// Type definitions for the blockchain document management system

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
