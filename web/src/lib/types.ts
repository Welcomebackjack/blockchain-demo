// Shared types for the blockchain document management system

export enum UserRole {
  BORROWER = 'BORROWER',
  LENDER = 'LENDER',
  TITLE_COMPANY = 'TITLE_COMPANY',
  ATTORNEY = 'ATTORNEY',
  NOTARY = 'NOTARY',
  COUNTY_CLERK = 'COUNTY_CLERK'
}

export enum EventType {
  UPLOAD = 'UPLOAD',
  VIEW = 'VIEW',
  APPROVAL = 'APPROVAL',
  SIGNATURE = 'SIGNATURE',
  NOTARIZATION = 'NOTARIZATION',
  RECORDED = 'RECORDED',
  REVISION = 'REVISION'
}

export interface BlockchainEvent {
  id: string;
  timestamp: number;
  type: EventType;
  actorId: string;
  actorRole: UserRole;
  docHash: string;
  metadata?: any;
  blockId: string;
}

export interface DocumentAsset {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  currentHash: string;
  status: 'DRAFT' | 'APPROVED' | 'SIGNED' | 'RECORDED';
  events: BlockchainEvent[];
}

export interface Transaction {
  id: string;
  propertyAddress: string;
  loanAmount: number;
  lenderName: string;
  borrowerName: string;
  status: 'OPEN' | 'CLOSING' | 'RECORDED' | 'COMPLETED';
  createdAt: number;
  documents: DocumentAsset[];
}

// DocuSign Integration Types

export enum DocuSignEnvelopeStatus {
  CREATED = 'created',
  SENT = 'sent',
  DELIVERED = 'delivered',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  VOIDED = 'voided'
}

export interface DocuSignSigner {
  email: string;
  name: string;
  recipientId: string;
  routingOrder?: number;
  status?: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined';
  signedAt?: number;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  status: DocuSignEnvelopeStatus;
  documentId: string;
  transactionId: string;
  signers: DocuSignSigner[];
  createdAt: number;
  completedAt?: number;
  documentName: string;
  documentHash: string;
}

export interface SignatureMetadata {
  signatureMethod: 'DocuSign';
  envelopeId: string;
  signedAt: number;
  signerEmail: string;
  signerName: string;
  certificateUri?: string;
  ipAddress?: string;
}

export interface CreateEnvelopeRequest {
  documentId: string;
  transactionId: string;
  documentName: string;
  documentBase64: string;
  signers: Array<{
    email: string;
    name: string;
    routingOrder?: number;
  }>;
  emailSubject?: string;
  emailBlurb?: string;
}

export interface CreateEnvelopeResponse {
  success: boolean;
  envelopeId?: string;
  error?: string;
}

export interface EmbeddedSigningRequest {
  envelopeId: string;
  signerEmail: string;
  signerName: string;
  returnUrl: string;
}

export interface EmbeddedSigningResponse {
  success: boolean;
  signingUrl?: string;
  error?: string;
}

export interface DocuSignWebhookPayload {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: string;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    envelopeSummary: {
      status: string;
      emailSubject: string;
      recipients: {
        signers: Array<{
          email: string;
          name: string;
          recipientId: string;
          status: string;
          signedDateTime?: string;
        }>;
      };
    };
  };
}
