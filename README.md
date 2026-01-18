# Blockchain Loan Document Management System

A demonstration of a blockchain-based system for managing real estate loan documents with cryptographic verification, multi-party approval workflows, and immutable audit trails.

## Overview

This system simulates a blockchain ledger for commercial real estate transactions, providing:
- **Document Hashing**: SHA-256 hash generation for document integrity
- **Multi-Party Workflows**: Support for different user roles (Lender, Borrower, Attorney, Notary, County Clerk)
- **Blockchain Events**: Immutable audit trail of all document actions
- **Document Verification**: Verify document authenticity against the blockchain
- **Status Tracking**: Automatic status updates through the document lifecycle

## Features

### Core Functionality
- **Transaction Management**: Track loan transactions with property and party details
- **Document Upload**: Add documents to transactions with cryptographic hashing
- **Event Recording**: Record all actions (upload, approval, signature, notarization, recording)
- **Verification**: Verify document authenticity by comparing hashes
- **Audit Trail**: Complete history of all document events with blockchain IDs

### User Roles
- `BORROWER`: Can sign documents
- `LENDER`: Can approve documents
- `ATTORNEY`: Can upload and manage documents
- `NOTARY`: Can notarize documents
- `TITLE_COMPANY`: Can verify title documents
- `COUNTY_CLERK`: Can record documents officially

### Event Types
- `UPLOAD`: Initial document upload
- `VIEW`: Document access logged
- `APPROVAL`: Document approval by authorized party
- `SIGNATURE`: Digital signature applied
- `NOTARIZATION`: Notary verification
- `RECORDED`: Official recording with county
- `REVISION`: Document modification

## Installation

```bash
# Clone or create the project directory
cd blockchain-demo

# Install dependencies
npm install

# Or if you prefer yarn
yarn install
```

## Running the Demo

### Quick Start
```bash
# Run the demo directly
npm run demo
```

### Development Mode
```bash
# Run with TypeScript directly (no compilation)
npm run dev
```

### Build and Run
```bash
# Build TypeScript to JavaScript
npm run build

# Run the compiled JavaScript
node dist/demo.js
```

### Clean Generated Files
```bash
# Remove compiled files and sample documents
npm run clean
```

## Project Structure

```
blockchain-demo/
├── src/
│   ├── types.ts                 # TypeScript type definitions
│   ├── BlockchainService.ts     # Browser-compatible service
│   ├── BlockchainServiceNode.ts # Node.js-compatible service
│   ├── DocumentProcessor.ts     # PDF generation, OCR, image processing
│   ├── AuditLogger.ts           # Winston-based audit logging
│   ├── EncryptionService.ts     # Node-Jose encryption and signing
│   ├── ValidationSchemas.ts     # Zod validation schemas
│   └── demo.ts                  # Demo script showcasing functionality
├── web/                         # React/Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── upload/page.tsx  # Document upload
│   │   │   ├── verify/page.tsx  # Document verification
│   │   │   └── audit/page.tsx   # Audit trail
│   │   ├── components/
│   │   │   └── Sidebar.tsx      # Navigation sidebar
│   │   └── lib/
│   │       └── mockData.ts      # Mock data and types
│   └── package.json
├── sample-docs/                 # Generated sample documents (created at runtime)
├── dist/                        # Compiled JavaScript (created by build)
├── package.json                 # Node.js project configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## Web Interface (React MVP)

A visual frontend for demonstrating blockchain document verification to potential users and investors.

### Running the Web App

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:3000 in your browser.

### Web Features

- **Dashboard**: Overview of transactions, documents, and blockchain events with statistics
- **Upload**: Drag-and-drop document upload with SHA-256 hash generation
- **Verify**: Check document authenticity against blockchain records
- **Audit Trail**: Visual timeline of all blockchain events with filtering

### Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- lucide-react icons
- date-fns for date formatting

## Demo Walkthrough

The demo performs the following steps:

### Step 1: Display Existing Transactions
Shows pre-loaded sample transactions for commercial properties.

### Step 2: Create Sample Documents
Generates sample legal documents (promissory note, deed of trust).

### Step 3: Upload to Blockchain
Uploads documents and generates SHA-256 hashes, creating blockchain events.

### Step 4: Approval Workflow
Simulates multi-party approval:
- Lender approval
- Borrower signature
- Notary verification
- County recording

### Step 5: Document Verification
- Verifies authentic documents against blockchain
- Detects tampered/modified documents

### Step 6: Audit Trail
Displays complete blockchain history for documents.

### Step 7: Summary
Shows final transaction status with all documents and events.

## API Usage Example

```typescript
import { BlockchainServiceNode } from './BlockchainServiceNode';
import { EventType, UserRole } from './types';

// Get all transactions
const transactions = BlockchainServiceNode.getTransactions();

// Upload a document
const doc = await BlockchainServiceNode.createDocument(
  'TX-2024-8492',           // Transaction ID
  '/path/to/document.pdf',  // File path
  'Loan Agreement',         // Document type
  'attorney@law.com',       // Actor ID
  UserRole.ATTORNEY         // Actor role
);

// Add approval event
BlockchainServiceNode.addEvent(
  doc.id,                   // Document ID
  EventType.APPROVAL,       // Event type
  'lender@bank.com',        // Actor ID
  UserRole.LENDER,          // Actor role
  doc.currentHash,          // Document hash
  { comment: 'Approved' }   // Metadata
);

// Verify a document
const result = await BlockchainServiceNode.verifyDocument('/path/to/document.pdf');
if (result.verified) {
  console.log('Document is authentic!');
  console.log('Found in transaction:', result.transaction.id);
}
```

## Key Components

### Transaction
```typescript
{
  id: string;
  propertyAddress: string;
  loanAmount: number;
  lenderName: string;
  borrowerName: string;
  status: 'OPEN' | 'CLOSING' | 'RECORDED' | 'COMPLETED';
  createdAt: number;
  documents: DocumentAsset[];
}
```

### DocumentAsset
```typescript
{
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  currentHash: string;
  status: 'DRAFT' | 'APPROVED' | 'SIGNED' | 'RECORDED';
  events: BlockchainEvent[];
}
```

### BlockchainEvent
```typescript
{
  id: string;
  timestamp: number;
  type: EventType;
  actorId: string;
  actorRole: UserRole;
  docHash: string;
  metadata?: any;
  blockId: string;
}
```

## Security Features

- **SHA-256 Hashing**: Cryptographic hash for each document
- **Tamper Detection**: Any modification to a document changes its hash
- **Immutable Events**: All events are permanently recorded
- **Role-Based Access**: Different permissions for different user roles
- **Audit Trail**: Complete history of all document interactions

## Limitations (MVP)

This is a demonstration/MVP with the following limitations:
- **In-Memory Storage**: Data is not persisted between runs
- **Simulated Blockchain**: Uses mock block IDs instead of real blockchain
- **No Network**: Single-node operation only
- **No Encryption**: Documents are not encrypted
- **No Authentication**: User roles are not authenticated

## Production Considerations

For a production system, consider:
- Real blockchain implementation (Ethereum, Hyperledger, etc.)
- Persistent storage (database)
- Document encryption
- User authentication and authorization
- Distributed consensus mechanism
- Smart contracts for business logic
- IPFS or similar for document storage
- RESTful API or GraphQL interface
- Web3 integration for blockchain interaction

## License

MIT

## Author

Stephen - Real Estate Attorney specializing in complex commercial transactions

## Support

For questions about implementation or real estate law considerations, please contact the author.