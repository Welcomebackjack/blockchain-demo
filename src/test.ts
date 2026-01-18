import { BlockchainServiceNode } from './BlockchainServiceNode';
import { EventType, UserRole } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function test(description: string, fn: () => Promise<boolean>) {
  try {
    const result = await fn();
    if (result) {
      console.log(`${colors.green}✓${colors.reset} ${description}`);
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${description}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${description} - Error: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Running Blockchain Service Tests\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Get transactions
  if (await test('Should retrieve initial transactions', async () => {
    const transactions = BlockchainServiceNode.getTransactions();
    return transactions.length === 2;
  })) passed++; else failed++;

  // Test 2: Get specific transaction
  if (await test('Should retrieve specific transaction by ID', async () => {
    const tx = BlockchainServiceNode.getTransaction('TX-2024-8492');
    return tx !== undefined && tx.propertyAddress === '1200 Market St, Philadelphia, PA';
  })) passed++; else failed++;

  // Test 3: Create test file and upload document
  const testFilePath = path.join(__dirname, '..', 'test-doc.txt');
  await fs.mkdir(path.dirname(testFilePath), { recursive: true });
  await fs.writeFile(testFilePath, 'Test document content for blockchain demo');

  if (await test('Should upload document to blockchain', async () => {
    const doc = await BlockchainServiceNode.createDocument(
      'TX-2024-8492',
      testFilePath,
      'Test Document',
      'test@example.com',
      UserRole.ATTORNEY
    );
    return doc !== null && doc.status === 'DRAFT';
  })) passed++; else failed++;

  // Test 4: Verify document
  if (await test('Should verify uploaded document', async () => {
    const result = await BlockchainServiceNode.verifyDocument(testFilePath);
    return result.verified === true;
  })) passed++; else failed++;

  // Test 5: Verify modified document fails
  const modifiedPath = path.join(__dirname, '..', 'test-doc-modified.txt');
  await fs.writeFile(modifiedPath, 'Modified content - should fail verification');
  
  if (await test('Should fail verification for modified document', async () => {
    const result = await BlockchainServiceNode.verifyDocument(modifiedPath);
    return result.verified === false;
  })) passed++; else failed++;

  // Test 6: Add events to document
  if (await test('Should add approval event to document', async () => {
    const tx = BlockchainServiceNode.getTransaction('TX-2024-8492');
    if (tx && tx.documents.length > 0) {
      const doc = tx.documents[0];
      const updated = BlockchainServiceNode.addEvent(
        doc.id,
        EventType.APPROVAL,
        'approver@bank.com',
        UserRole.LENDER,
        doc.currentHash,
        { comment: 'Approved for testing' }
      );
      return updated !== null && updated.status === 'APPROVED';
    }
    return false;
  })) passed++; else failed++;

  // Test 7: Document history
  if (await test('Should retrieve document event history', async () => {
    const tx = BlockchainServiceNode.getTransaction('TX-2024-8492');
    if (tx && tx.documents.length > 0) {
      const history = BlockchainServiceNode.getDocumentHistory(tx.documents[0].id);
      return history !== null && history.length >= 2;
    }
    return false;
  })) passed++; else failed++;

  // Test 8: List all documents
  if (await test('Should list all documents across transactions', async () => {
    const allDocs = BlockchainServiceNode.listAllDocuments();
    const totalDocs = allDocs.reduce((sum, item) => sum + item.documents.length, 0);
    return totalDocs >= 1;
  })) passed++; else failed++;

  // Test 9: Transaction status update
  if (await test('Should update transaction status when document is recorded', async () => {
    const tx = BlockchainServiceNode.getTransaction('TX-2024-8492');
    if (tx && tx.documents.length > 0) {
      const doc = tx.documents[0];
      BlockchainServiceNode.addEvent(
        doc.id,
        EventType.RECORDED,
        'clerk@county.gov',
        UserRole.COUNTY_CLERK,
        doc.currentHash,
        { recordingNumber: 'TEST-123456' }
      );
      const updatedTx = BlockchainServiceNode.getTransaction('TX-2024-8492');
      return updatedTx?.status === 'RECORDED';
    }
    return false;
  })) passed++; else failed++;

  // Test 10: Hash generation consistency
  if (await test('Should generate consistent hash for same file', async () => {
    const hash1 = await BlockchainServiceNode.computeFileHash(testFilePath);
    const hash2 = await BlockchainServiceNode.computeFileHash(testFilePath);
    return hash1 === hash2 && hash1.length === 64; // SHA-256 produces 64 hex characters
  })) passed++; else failed++;

  // Clean up test files
  await fs.unlink(testFilePath).catch(() => {});
  await fs.unlink(modifiedPath).catch(() => {});

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} failed${colors.reset}`);
  console.log('='.repeat(50) + '\n');

  return failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTests };
