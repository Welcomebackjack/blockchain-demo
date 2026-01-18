// DocuSign eSignature API Integration Service for Next.js
// Uses JWT Grant for server-side authentication
// Provides mock mode for demo/development without DocuSign credentials
//
// NOTE: The docusign-esign package must be installed in the root project
// This service uses dynamic imports to avoid bundling issues with Turbopack

import {
  DocuSignEnvelope,
  DocuSignEnvelopeStatus,
  CreateEnvelopeRequest,
  CreateEnvelopeResponse,
  EmbeddedSigningRequest,
  EmbeddedSigningResponse,
  DocuSignWebhookPayload,
  SignatureMetadata
} from './types';

interface DocuSignConfig {
  integrationKey: string;
  accountId: string;
  userId: string;
  privateKey: string;
  environment: 'development' | 'production';
  webhookHmacKey?: string;
  returnBaseUrl: string;
}

// In-memory storage for envelopes (in production, use a database)
const envelopeStore = new Map<string, DocuSignEnvelope>();

// Helper to compute hash without crypto module on client
function computeSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

class DocuSignService {
  private config: DocuSignConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private docusignModule: any = null;
  private apiClient: any = null;
  private crypto: typeof import('crypto') | null = null;

  constructor() {
    this.config = {
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
      userId: process.env.DOCUSIGN_USER_ID || '',
      privateKey: process.env.DOCUSIGN_PRIVATE_KEY || '',
      environment: (process.env.DOCUSIGN_ENVIRONMENT || 'development') as 'development' | 'production',
      webhookHmacKey: process.env.DOCUSIGN_WEBHOOK_HMAC_KEY,
      returnBaseUrl: process.env.DOCUSIGN_RETURN_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    };
  }

  private getBasePath(): string {
    return this.config.environment === 'production'
      ? 'https://www.docusign.net/restapi'
      : 'https://demo.docusign.net/restapi';
  }

  private getOAuthBasePath(): string {
    return this.config.environment === 'production'
      ? 'account.docusign.com'
      : 'account-d.docusign.com';
  }

  isConfigured(): boolean {
    return !!(
      this.config.integrationKey &&
      this.config.accountId &&
      this.config.userId &&
      this.config.privateKey
    );
  }

  /**
   * Dynamically load crypto module (server-side only)
   */
  private async loadCrypto(): Promise<typeof import('crypto')> {
    if (!this.crypto) {
      try {
        this.crypto = await import('crypto');
      } catch (error) {
        throw new Error('Crypto module not available');
      }
    }
    return this.crypto;
  }

  /**
   * Dynamically load the docusign-esign module (server-side only)
   */
  private async loadDocuSign(): Promise<any> {
    if (!this.docusignModule) {
      try {
        // Try to import from the root project's node_modules
        this.docusignModule = await import('docusign-esign');
      } catch (error) {
        console.warn('DocuSign SDK not available - using mock mode');
        return null;
      }
    }
    return this.docusignModule.default || this.docusignModule;
  }

  /**
   * Get a valid access token, refreshing if needed
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('DocuSign is not configured. Please set environment variables.');
    }

    const docusign = await this.loadDocuSign();
    if (!docusign) {
      throw new Error('DocuSign SDK not available');
    }

    if (!this.apiClient) {
      this.apiClient = new docusign.ApiClient();
      this.apiClient.setBasePath(this.getBasePath());
    }

    // Use private key from environment
    const privateKey = this.config.privateKey.replace(/\\n/g, '\n');

    // Request JWT token
    const scopes = ['signature', 'impersonation'];

    try {
      const results = await this.apiClient.requestJWTUserToken(
        this.config.integrationKey,
        this.config.userId,
        scopes,
        privateKey,
        3600 // Token valid for 1 hour
      );

      this.accessToken = results.body.access_token;
      this.tokenExpiresAt = Date.now() + (results.body.expires_in * 1000);

      return this.accessToken!;
    } catch (error: any) {
      // Check if this is a consent required error
      if (error.response?.body?.error === 'consent_required') {
        const consentUrl = `https://${this.getOAuthBasePath()}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${this.config.integrationKey}&redirect_uri=${encodeURIComponent(this.config.returnBaseUrl + '/api/docusign/callback')}`;
        throw new Error(`User consent required. Please visit: ${consentUrl}`);
      }
      throw new Error(`Failed to get DocuSign access token: ${error.message}`);
    }
  }

  /**
   * Create a new envelope (signing request) for a document
   * Uses mock mode if DocuSign is not configured or SDK not available
   */
  async createEnvelope(request: CreateEnvelopeRequest): Promise<CreateEnvelopeResponse> {
    // Check if we should use mock mode
    const docusign = await this.loadDocuSign();
    if (!this.isConfigured() || !docusign) {
      return this.createMockEnvelope(request);
    }

    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // Create document object
      const document = new docusign.Document();
      document.documentBase64 = request.documentBase64;
      document.name = request.documentName;
      document.fileExtension = this.getFileExtension(request.documentName);
      document.documentId = '1';

      // Create signers with signature tabs
      const signers = request.signers.map((signer, index) => {
        const docuSigner = new docusign.Signer();
        docuSigner.email = signer.email;
        docuSigner.name = signer.name;
        docuSigner.recipientId = (index + 1).toString();
        docuSigner.routingOrder = (signer.routingOrder || index + 1).toString();
        docuSigner.clientUserId = `${signer.email}_${Date.now()}`; // For embedded signing

        // Add signature tab
        const signHere = new docusign.SignHere();
        signHere.documentId = '1';
        signHere.pageNumber = '1';
        signHere.recipientId = (index + 1).toString();
        signHere.tabLabel = 'SignatureTab';
        signHere.xPosition = '100';
        signHere.yPosition = '700';

        // Add date signed tab
        const dateSigned = new docusign.DateSigned();
        dateSigned.documentId = '1';
        dateSigned.pageNumber = '1';
        dateSigned.recipientId = (index + 1).toString();
        dateSigned.tabLabel = 'DateSignedTab';
        dateSigned.xPosition = '300';
        dateSigned.yPosition = '700';

        const tabs = new docusign.Tabs();
        tabs.signHereTabs = [signHere];
        tabs.dateSignedTabs = [dateSigned];
        docuSigner.tabs = tabs;

        return docuSigner;
      });

      // Create recipients object
      const recipients = new docusign.Recipients();
      recipients.signers = signers;

      // Create envelope definition
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.emailSubject = request.emailSubject || `Please sign: ${request.documentName}`;
      envelopeDefinition.emailBlurb = request.emailBlurb || 'Please review and sign the attached document.';
      envelopeDefinition.documents = [document];
      envelopeDefinition.recipients = recipients;
      envelopeDefinition.status = 'sent'; // Send immediately

      // Create the envelope
      const results = await envelopesApi.createEnvelope(this.config.accountId, {
        envelopeDefinition
      });

      const envelopeId = results.envelopeId!;

      // Store envelope info locally
      const envelope: DocuSignEnvelope = {
        envelopeId,
        status: DocuSignEnvelopeStatus.SENT,
        documentId: request.documentId,
        transactionId: request.transactionId,
        signers: request.signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: (index + 1).toString(),
          routingOrder: signer.routingOrder || index + 1,
          status: 'sent'
        })),
        createdAt: Date.now(),
        documentName: request.documentName,
        documentHash: await this.computeDocumentHash(request.documentBase64)
      };
      envelopeStore.set(envelopeId, envelope);

      return {
        success: true,
        envelopeId
      };
    } catch (error: any) {
      console.error('Error creating envelope:', error);
      return {
        success: false,
        error: error.message || 'Failed to create envelope'
      };
    }
  }

  /**
   * Mock envelope creation for demo mode
   */
  private async createMockEnvelope(request: CreateEnvelopeRequest): Promise<CreateEnvelopeResponse> {
    const envelopeId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const envelope: DocuSignEnvelope = {
      envelopeId,
      status: DocuSignEnvelopeStatus.SENT,
      documentId: request.documentId,
      transactionId: request.transactionId,
      signers: request.signers.map((signer, index) => ({
        email: signer.email,
        name: signer.name,
        recipientId: (index + 1).toString(),
        routingOrder: signer.routingOrder || index + 1,
        status: 'sent'
      })),
      createdAt: Date.now(),
      documentName: request.documentName,
      documentHash: await this.computeDocumentHash(request.documentBase64)
    };
    envelopeStore.set(envelopeId, envelope);

    console.log('[DEMO MODE] Mock envelope created:', envelopeId);

    return {
      success: true,
      envelopeId
    };
  }

  /**
   * Generate an embedded signing URL for a signer
   * Uses mock mode if DocuSign is not configured
   */
  async getEmbeddedSigningUrl(request: EmbeddedSigningRequest): Promise<EmbeddedSigningResponse> {
    // Get envelope from store
    const envelope = envelopeStore.get(request.envelopeId);
    if (!envelope) {
      return { success: false, error: 'Envelope not found' };
    }

    const signer = envelope.signers.find(s => s.email === request.signerEmail);
    if (!signer) {
      return { success: false, error: 'Signer not found in envelope' };
    }

    // Check if we should use mock mode
    const docusign = await this.loadDocuSign();
    if (!this.isConfigured() || !docusign) {
      // Return a mock URL that simulates the signing experience
      const mockSigningUrl = `${request.returnUrl}&event=signing_complete&envelopeId=${request.envelopeId}&mock=true`;
      console.log('[DEMO MODE] Mock signing URL generated');
      return {
        success: true,
        signingUrl: mockSigningUrl
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // Create recipient view request
      const viewRequest = new docusign.RecipientViewRequest();
      viewRequest.returnUrl = request.returnUrl;
      viewRequest.authenticationMethod = 'none';
      viewRequest.email = request.signerEmail;
      viewRequest.userName = request.signerName;
      viewRequest.recipientId = signer.recipientId;
      viewRequest.clientUserId = `${request.signerEmail}_${envelope.createdAt}`;

      const results = await envelopesApi.createRecipientView(
        this.config.accountId,
        request.envelopeId,
        { recipientViewRequest: viewRequest }
      );

      return {
        success: true,
        signingUrl: results.url
      };
    } catch (error: any) {
      console.error('Error getting signing URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to get signing URL'
      };
    }
  }

  /**
   * Get the status of an envelope
   */
  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope | null> {
    const localEnvelope = envelopeStore.get(envelopeId);

    // Check if we should use mock/local mode
    const docusign = await this.loadDocuSign();
    if (!this.isConfigured() || !docusign) {
      return localEnvelope || null;
    }

    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(this.config.accountId, envelopeId);

      // Update local cache
      if (localEnvelope) {
        localEnvelope.status = this.mapEnvelopeStatus(envelope.status!);
        if (envelope.status === 'completed') {
          localEnvelope.completedAt = new Date(envelope.completedDateTime!).getTime();
        }
        return localEnvelope;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting envelope status:', error);
      return localEnvelope || null;
    }
  }

  /**
   * Validate webhook HMAC signature
   */
  async validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
    if (!this.config.webhookHmacKey) {
      console.warn('Webhook HMAC key not configured, skipping validation');
      return true;
    }

    try {
      const crypto = await this.loadCrypto();
      const computedSignature = crypto
        .createHmac('sha256', this.config.webhookHmacKey)
        .update(payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Process webhook event from DocuSign
   */
  async processWebhook(payload: DocuSignWebhookPayload): Promise<SignatureMetadata | null> {
    const { data } = payload;
    const { envelopeId, envelopeSummary } = data;

    // Update local envelope status
    const envelope = envelopeStore.get(envelopeId);
    if (envelope) {
      envelope.status = this.mapEnvelopeStatus(envelopeSummary.status);

      // Update signer statuses
      if (envelopeSummary.recipients?.signers) {
        for (const remoteSigner of envelopeSummary.recipients.signers) {
          const localSigner = envelope.signers.find(s => s.email === remoteSigner.email);
          if (localSigner) {
            localSigner.status = remoteSigner.status as any;
            if (remoteSigner.signedDateTime) {
              localSigner.signedAt = new Date(remoteSigner.signedDateTime).getTime();
            }
          }
        }
      }

      if (envelopeSummary.status === 'completed') {
        envelope.completedAt = Date.now();

        // Return signature metadata for blockchain recording
        const lastSigner = envelope.signers[envelope.signers.length - 1];
        return {
          signatureMethod: 'DocuSign',
          envelopeId,
          signedAt: envelope.completedAt,
          signerEmail: lastSigner.email,
          signerName: lastSigner.name
        };
      }
    }

    return null;
  }

  /**
   * Get envelope from local store
   */
  getEnvelope(envelopeId: string): DocuSignEnvelope | undefined {
    return envelopeStore.get(envelopeId);
  }

  /**
   * Get all envelopes from local store
   */
  getAllEnvelopes(): DocuSignEnvelope[] {
    return Array.from(envelopeStore.values());
  }

  // Helper methods

  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || 'pdf';
  }

  private mapEnvelopeStatus(status: string): DocuSignEnvelopeStatus {
    const statusMap: Record<string, DocuSignEnvelopeStatus> = {
      'created': DocuSignEnvelopeStatus.CREATED,
      'sent': DocuSignEnvelopeStatus.SENT,
      'delivered': DocuSignEnvelopeStatus.DELIVERED,
      'signed': DocuSignEnvelopeStatus.SIGNED,
      'completed': DocuSignEnvelopeStatus.COMPLETED,
      'declined': DocuSignEnvelopeStatus.DECLINED,
      'voided': DocuSignEnvelopeStatus.VOIDED
    };
    return statusMap[status.toLowerCase()] || DocuSignEnvelopeStatus.CREATED;
  }

  private async computeDocumentHash(base64Content: string): Promise<string> {
    try {
      const crypto = await this.loadCrypto();
      return crypto
        .createHash('sha256')
        .update(Buffer.from(base64Content, 'base64'))
        .digest('hex');
    } catch {
      // Fallback for client-side or when crypto isn't available
      return computeSimpleHash(base64Content);
    }
  }
}

// Export singleton instance
export const docuSignService = new DocuSignService();
