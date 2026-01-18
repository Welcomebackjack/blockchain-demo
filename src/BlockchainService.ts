import { Transaction, DocumentAsset, BlockchainEvent, EventType, UserRole } from './types';

// In-memory storage for the MVP demo
let transactions: Transaction[] = [
  {
    id: 'TX-2024-8492',
    propertyAddress: '1200 Market St, Philadelphia, PA',
    loanAmount: 24500000,
    lenderName: 'Keystone Commercial Bank',
    borrowerName: 'Market Street Developers LLC',
    status: 'OPEN',
    createdAt: Date.now() - 100000000,
    documents: []
  },
  {
    id: 'TX-2024-9921',
    propertyAddress: '450 Technology Dr, Austin, TX',
    loanAmount: 12000000,
    lenderName: 'Austin Debt Fund',
    borrowerName: 'TechSpace PropCo',
    status: 'CLOSING',
    createdAt: Date.now() - 50000000,
    documents: []
  }
];

// Helper to generate a SHA-256 hash
export async function computeFileHash(file: File): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for non-secure contexts (development only)
    console.warn("Crypto API not available, using mock hash");
    return `mock-hash-${file.name}-${file.size}-${Date.now()}`;
  }
}

// Helper to simulate block generation
const generateBlockId = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const BlockchainService = {
  getTransactions: (): Transaction[] => {
    return transactions;
  },

  getTransaction: (id: string): Transaction | undefined => {
    return transactions.find(t => t.id === id);
  },

  createDocument: async (transactionId: string, file: File, docType: string, actor: string, role: UserRole): Promise<DocumentAsset | null> => {
    const txIndex = transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) return null;

    const hash = await computeFileHash(file);
    
    const newEvent: BlockchainEvent = {
      id: `evt_${Date.now()}`,
      timestamp: Date.now(),
      type: EventType.UPLOAD,
      actorId: actor,
      actorRole: role,
      docHash: hash,
      metadata: { fileName: file.name, fileSize: file.size },
      blockId: generateBlockId()
    };

    const newDoc: DocumentAsset = {
      id: `DOC-${Date.now()}`,
      name: file.name,
      type: docType,
      currentVersion: 1,
      currentHash: hash,
      status: 'DRAFT',
      events: [newEvent]
    };

    transactions[txIndex].documents.push(newDoc);
    return newDoc;
  },

  addEvent: (docId: string, type: EventType, actor: string, role: UserRole, currentHash: string, metadata: any = {}): void => {
    // Find doc in all transactions
    for (const tx of transactions) {
      const doc = tx.documents.find(d => d.id === docId);
      if (doc) {
        const newEvent: BlockchainEvent = {
          id: `evt_${Date.now()}`,
          timestamp: Date.now(),
          type: type,
          actorId: actor,
          actorRole: role,
          docHash: currentHash, // In real life, if content changed, hash changes. Here we assume same file unless re-uploaded.
          metadata,
          blockId: generateBlockId()
        };

        doc.events.push(newEvent);
        
        // Update status based on event
        if (type === EventType.APPROVAL) doc.status = 'APPROVED';
        if (type === EventType.SIGNATURE) doc.status = 'SIGNED';
        if (type === EventType.RECORDED) {
          doc.status = 'RECORDED';
          tx.status = 'RECORDED'; // Simplified logic
        }
        break;
      }
    }
  },

  verifyDocument: async (file: File): Promise<{ verified: boolean; doc?: DocumentAsset; matchedEvent?: BlockchainEvent }> => {
    const hash = await computeFileHash(file);
    
    // Scan all docs in simulated ledger
    for (const tx of transactions) {
      for (const doc of tx.documents) {
        // Check the chain of events for this hash
        const match = doc.events.find(e => e.docHash === hash);
        if (match) {
          return { verified: true, doc, matchedEvent: match };
        }
      }
    }
    return { verified: false };
  }
};