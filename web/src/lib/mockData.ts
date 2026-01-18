// Mock data for the blockchain demo
// In production, this would come from the backend services

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

export interface DocumentAsset {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  currentHash: string;
  status: 'DRAFT' | 'APPROVED' | 'SIGNED' | 'RECORDED';
  events: BlockchainEvent[];
  uploadedAt: number;
}

export interface BlockchainEvent {
  id: string;
  timestamp: number;
  type: 'UPLOAD' | 'VIEW' | 'APPROVAL' | 'SIGNATURE' | 'NOTARIZATION' | 'RECORDED' | 'REVISION';
  actorId: string;
  actorRole: string;
  docHash: string;
  metadata?: Record<string, unknown>;
  blockId: string;
}

// Sample transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'TX-2024-8492',
    propertyAddress: '1200 Market St, Philadelphia, PA 19107',
    loanAmount: 24500000,
    lenderName: 'Keystone Commercial Bank',
    borrowerName: 'Market Street Developers LLC',
    status: 'CLOSING',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    documents: [
      {
        id: 'DOC-1705234567890',
        name: 'promissory-note.pdf',
        type: 'Promissory Note',
        currentVersion: 1,
        currentHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
        status: 'SIGNED',
        uploadedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        events: [
          {
            id: 'evt_1',
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
            type: 'UPLOAD',
            actorId: 'john.attorney@lawfirm.com',
            actorRole: 'ATTORNEY',
            docHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
            blockId: '0xabc123def456789012345678901234567890abcdef1234567890abcdef12345678',
          },
          {
            id: 'evt_2',
            timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
            type: 'APPROVAL',
            actorId: 'sarah.underwriter@bank.com',
            actorRole: 'LENDER',
            docHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
            metadata: { comment: 'Terms approved by underwriting' },
            blockId: '0xdef456789012345678901234567890abcdef1234567890abcdef123456789012',
          },
          {
            id: 'evt_3',
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            type: 'SIGNATURE',
            actorId: 'ceo@marketstreetdev.com',
            actorRole: 'BORROWER',
            docHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
            metadata: { signatureMethod: 'DocuSign' },
            blockId: '0x789012345678901234567890abcdef1234567890abcdef12345678901234567890',
          },
        ],
      },
      {
        id: 'DOC-1705234567891',
        name: 'deed-of-trust.pdf',
        type: 'Deed of Trust',
        currentVersion: 1,
        currentHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a',
        status: 'APPROVED',
        uploadedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        events: [
          {
            id: 'evt_4',
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
            type: 'UPLOAD',
            actorId: 'john.attorney@lawfirm.com',
            actorRole: 'ATTORNEY',
            docHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a',
            blockId: '0xcde567890123456789012345678901234567890abcdef1234567890abcdef1234',
          },
          {
            id: 'evt_5',
            timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
            type: 'APPROVAL',
            actorId: 'sarah.underwriter@bank.com',
            actorRole: 'LENDER',
            docHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a',
            blockId: '0xef6789012345678901234567890abcdef1234567890abcdef12345678901234567',
          },
        ],
      },
    ],
  },
  {
    id: 'TX-2024-9921',
    propertyAddress: '450 Technology Dr, Austin, TX 78701',
    loanAmount: 12000000,
    lenderName: 'Austin Debt Fund',
    borrowerName: 'TechSpace PropCo',
    status: 'OPEN',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    documents: [],
  },
  {
    id: 'TX-2024-7156',
    propertyAddress: '888 Financial Blvd, New York, NY 10004',
    loanAmount: 45000000,
    lenderName: 'Manhattan Capital Partners',
    borrowerName: 'Financial District Holdings',
    status: 'RECORDED',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    documents: [
      {
        id: 'DOC-1705234567892',
        name: 'promissory-note.pdf',
        type: 'Promissory Note',
        currentVersion: 1,
        currentHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
        status: 'RECORDED',
        uploadedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
        events: [
          {
            id: 'evt_6',
            timestamp: Date.now() - 28 * 24 * 60 * 60 * 1000,
            type: 'UPLOAD',
            actorId: 'legal@manhattancap.com',
            actorRole: 'ATTORNEY',
            docHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
            blockId: '0xf67890123456789012345678901234567890abcdef1234567890abcdef12345678',
          },
          {
            id: 'evt_7',
            timestamp: Date.now() - 25 * 24 * 60 * 60 * 1000,
            type: 'APPROVAL',
            actorId: 'credit@manhattancap.com',
            actorRole: 'LENDER',
            docHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
            blockId: '0x0789012345678901234567890abcdef1234567890abcdef1234567890123456789',
          },
          {
            id: 'evt_8',
            timestamp: Date.now() - 22 * 24 * 60 * 60 * 1000,
            type: 'SIGNATURE',
            actorId: 'cfo@fdholdings.com',
            actorRole: 'BORROWER',
            docHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
            blockId: '0x1890123456789012345678901234567890abcdef1234567890abcdef123456789a',
          },
          {
            id: 'evt_9',
            timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
            type: 'NOTARIZATION',
            actorId: 'notary@verified.com',
            actorRole: 'NOTARY',
            docHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
            metadata: { notaryLicense: 'NY-98765' },
            blockId: '0x2901234567890123456789012345678901234567890abcdef1234567890abcdef1',
          },
          {
            id: 'evt_10',
            timestamp: Date.now() - 18 * 24 * 60 * 60 * 1000,
            type: 'RECORDED',
            actorId: 'clerk@nyc.gov',
            actorRole: 'COUNTY_CLERK',
            docHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab0',
            metadata: { recordingNumber: 'NYC-2024-123456' },
            blockId: '0x3012345678901234567890123456789012345678901234567890abcdef12345678',
          },
        ],
      },
    ],
  },
];

// Simulated file hash function (in production, use crypto)
export function computeHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.repeat(8);
}

// Get all events across all documents, sorted by time
export function getAllEvents(): (BlockchainEvent & { documentName: string; transactionId: string })[] {
  const events: (BlockchainEvent & { documentName: string; transactionId: string })[] = [];

  for (const tx of mockTransactions) {
    for (const doc of tx.documents) {
      for (const event of doc.events) {
        events.push({
          ...event,
          documentName: doc.name,
          transactionId: tx.id,
        });
      }
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// Verify a document hash
export function verifyDocument(hash: string): {
  verified: boolean;
  document?: DocumentAsset;
  transaction?: Transaction;
} {
  for (const tx of mockTransactions) {
    for (const doc of tx.documents) {
      if (doc.currentHash === hash) {
        return { verified: true, document: doc, transaction: tx };
      }
    }
  }
  return { verified: false };
}
