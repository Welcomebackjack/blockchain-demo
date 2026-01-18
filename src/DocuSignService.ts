// DocuSign eSignature API Integration Service
// Uses JWT Grant for server-side authentication

import * as fs from 'fs';
import * as crypto from 'crypto';
import docusign from 'docusign-esign';
import {
  DocuSignEnvelope,
  DocuSignEnvelopeStatus,
  DocuSignSigner,
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
  privateKeyPath: string;
  environment: 'development' | 'production';
  webhookHmacKey?: string;
  returnBaseUrl: string;
}

export class DocuSignService {
  private config: DocuSignConfig;
  private apiClient: docusign.ApiClient;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // In-memory storage for envelopes (in production, use a database)
  private envelopes: Map<string, DocuSignEnvelope> = new Map();

  constructor(config?: Partial<DocuSignConfig>) {
    this.config = {
      integrationKey: config?.integrationKey || process.env.DOCUSIGN_INTEGRATION_KEY || '',
      accountId: config?.accountId || process.env.DOCUSIGN_ACCOUNT_ID || '',
      userId: config?.userId || process.env.DOCUSIGN_USER_ID || '',
      privateKeyPath: config?.privateKeyPath || process.env.DOCUSIGN_PRIVATE_KEY_PATH || './keys/docusign-private.pem',
      environment: (config?.environment || process.env.DOCUSIGN_ENVIRONMENT || 'development') as 'development' | 'production',
      webhookHmacKey: config?.webhookHmacKey || process.env.DOCUSIGN_WEBHOOK_HMAC_KEY,
      returnBaseUrl: config?.returnBaseUrl || process.env.DOCUSIGN_RETURN_BASE_URL || 'http://localhost:3000'
    };

    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(this.getBasePath());
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

  /**
   * Get a valid access token, refreshing if needed
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    // Read private key
    let privateKey: string;
    try {
      privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read DocuSign private key from ${this.config.privateKeyPath}: ${error}`);
    }

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

      return this.accessToken;
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
   */
  async createEnvelope(request: CreateEnvelopeRequest): Promise<CreateEnvelopeResponse> {
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
      const signers: docusign.Signer[] = request.signers.map((signer, index) => {
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
        documentHash: this.computeDocumentHash(request.documentBase64)
      };
      this.envelopes.set(envelopeId, envelope);

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
   * Generate an embedded signing URL for a signer
   */
  async getEmbeddedSigningUrl(request: EmbeddedSigningRequest): Promise<EmbeddedSigningResponse> {
    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // Get envelope to find the recipient
      const envelope = this.envelopes.get(request.envelopeId);
      if (!envelope) {
        return { success: false, error: 'Envelope not found' };
      }

      const signer = envelope.signers.find(s => s.email === request.signerEmail);
      if (!signer) {
        return { success: false, error: 'Signer not found in envelope' };
      }

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
    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(this.config.accountId, envelopeId);

      // Update local cache
      const localEnvelope = this.envelopes.get(envelopeId);
      if (localEnvelope) {
        localEnvelope.status = this.mapEnvelopeStatus(envelope.status!);
        if (envelope.status === 'completed') {
          localEnvelope.completedAt = new Date(envelope.completedDateTime!).getTime();
        }
      }

      return localEnvelope || null;
    } catch (error: any) {
      console.error('Error getting envelope status:', error);
      return null;
    }
  }

  /**
   * Validate webhook HMAC signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookHmacKey) {
      console.warn('Webhook HMAC key not configured, skipping validation');
      return true;
    }

    const computedSignature = crypto
      .createHmac('sha256', this.config.webhookHmacKey)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }

  /**
   * Process webhook event from DocuSign
   */
  async processWebhook(payload: DocuSignWebhookPayload): Promise<SignatureMetadata | null> {
    const { data } = payload;
    const { envelopeId, envelopeSummary } = data;

    // Update local envelope status
    const envelope = this.envelopes.get(envelopeId);
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
   * Download signed document from DocuSign
   */
  async downloadSignedDocument(envelopeId: string): Promise<Buffer | null> {
    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const document = await envelopesApi.getDocument(
        this.config.accountId,
        envelopeId,
        '1'
      );

      return document as Buffer;
    } catch (error: any) {
      console.error('Error downloading signed document:', error);
      return null;
    }
  }

  /**
   * Download certificate of completion
   */
  async downloadCertificate(envelopeId: string): Promise<Buffer | null> {
    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const certificate = await envelopesApi.getDocument(
        this.config.accountId,
        envelopeId,
        'certificate'
      );

      return certificate as Buffer;
    } catch (error: any) {
      console.error('Error downloading certificate:', error);
      return null;
    }
  }

  /**
   * Get all envelopes (from local cache)
   */
  getAllEnvelopes(): DocuSignEnvelope[] {
    return Array.from(this.envelopes.values());
  }

  /**
   * Get envelope by ID (from local cache)
   */
  getEnvelope(envelopeId: string): DocuSignEnvelope | undefined {
    return this.envelopes.get(envelopeId);
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

  private computeDocumentHash(base64Content: string): string {
    return crypto
      .createHash('sha256')
      .update(Buffer.from(base64Content, 'base64'))
      .digest('hex');
  }
}

// Export singleton instance
export const docuSignService = new DocuSignService();
