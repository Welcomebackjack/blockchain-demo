import { Transaction, DocumentAsset, BlockchainEvent, EventType, UserRole } from './types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// Helper to generate a SHA-256 hash for Node.js
export async function computeFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Helper to simulate block generation
const generateBlockId = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const BlockchainServiceNode = {
  getTransactions: (): Transaction[] => {
    return transactions;
  },

  getTransaction: (id: string): Transaction | undefined => {
    return transactions.find(t => t.id === id);
  },

  createDocument: async (
    transactionId: string, 
    filePath: string, 
    docType: string, 
    actor: string, 
    role: UserRole
  ): Promise<DocumentAsset | null> => {
    const txIndex = transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) return null;

    const hash = await computeFileHash(filePath);
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    const newEvent: BlockchainEvent = {
      id: `evt_${Date.now()}`,
      timestamp: Date.now(),
      type: EventType.UPLOAD,
      actorId: actor,
      actorRole: role,
      docHash: hash,
      metadata: { fileName, fileSize: stats.size },
      blockId: generateBlockId()
    };

    const newDoc: DocumentAsset = {
      id: `DOC-${Date.now()}`,
      name: fileName,
      type: docType,
      currentVersion: 1,
      currentHash: hash,
      status: 'DRAFT',
      events: [newEvent]
    };

    transactions[txIndex].documents.push(newDoc);
    return newDoc;
  },

  addEvent: (
    docId: string, 
    type: EventType, 
    actor: string, 
    role: UserRole, 
    currentHash: string, 
    metadata: any = {}
  ): DocumentAsset | null => {
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
          docHash: currentHash,
          metadata,
          blockId: generateBlockId()
        };

        doc.events.push(newEvent);
        
        // Update status based on event
        if (type === EventType.APPROVAL) doc.status = 'APPROVED';
        if (type === EventType.SIGNATURE) doc.status = 'SIGNED';
        if (type === EventType.RECORDED) {
          doc.status = 'RECORDED';
          tx.status = 'RECORDED';
        }
        return doc;
      }
    }
    return null;
  },

  verifyDocument: async (filePath: string): Promise<{ 
    verified: boolean; 
    doc?: DocumentAsset; 
    matchedEvent?: BlockchainEvent;
    transaction?: Transaction;
  }> => {
    const hash = await computeFileHash(filePath);
    
    // Scan all docs in simulated ledger
    for (const tx of transactions) {
      for (const doc of tx.documents) {
        // Check the chain of events for this hash
        const match = doc.events.find(e => e.docHash === hash);
        if (match) {
          return { verified: true, doc, matchedEvent: match, transaction: tx };
        }
      }
    }
    return { verified: false };
  },

  // Additional utility methods for better demo
  listAllDocuments: (): Array<{transaction: Transaction; documents: DocumentAsset[]}> => {
    return transactions.map(tx => ({
      transaction: tx,
      documents: tx.documents
    }));
  },

  getDocumentHistory: (docId: string): BlockchainEvent[] | null => {
    for (const tx of transactions) {
      const doc = tx.documents.find(d => d.id === docId);
      if (doc) {
        return doc.events;
      }
    }
    return null;
  }
};