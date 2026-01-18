import { BlockchainServiceNode } from './BlockchainServiceNode';
import { EventType, UserRole } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function createSampleFile(fileName: string, content: string): Promise<string> {
  const filePath = path.join(__dirname, '..', 'sample-docs', fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  return filePath;
}

async function runDemo() {
  try {
    logSection('BLOCKCHAIN LOAN DOCUMENT MANAGEMENT SYSTEM DEMO');

    // Step 1: Display existing transactions
    logSection('Step 1: Current Transactions');
    const transactions = BlockchainServiceNode.getTransactions();
    transactions.forEach(tx => {
      log(`\nTransaction ID: ${tx.id}`, colors.yellow);
      log(`  Property: ${tx.propertyAddress}`);
      log(`  Loan Amount: $${tx.loanAmount.toLocaleString()}`);
      log(`  Lender: ${tx.lenderName}`);
      log(`  Borrower: ${tx.borrowerName}`);
      log(`  Status: ${tx.status}`, colors.blue);
      log(`  Documents: ${tx.documents.length}`);
    });

    // Step 2: Create sample documents
    logSection('Step 2: Creating Sample Documents');
    
    const promissoryNotePath = await createSampleFile(
      'promissory-note.txt',
      'PROMISSORY NOTE\n\nAmount: $24,500,000\nBorrower: Market Street Developers LLC\nLender: Keystone Commercial Bank\nProperty: 1200 Market St, Philadelphia, PA\n\nTerms and conditions...'
    );
    log('Created sample promissory note file', colors.green);

    const deedOfTrustPath = await createSampleFile(
      'deed-of-trust.txt',
      'DEED OF TRUST\n\nProperty: 1200 Market St, Philadelphia, PA\nTrustor: Market Street Developers LLC\nBeneficiary: Keystone Commercial Bank\n\nLegal description and terms...'
    );
    log('Created sample deed of trust file', colors.green);

    // Step 3: Upload documents to blockchain
    logSection('Step 3: Uploading Documents to Blockchain');
    
    const promissoryNote = await BlockchainServiceNode.createDocument(
      'TX-2024-8492',
      promissoryNotePath,
      'Promissory Note',
      'john.attorney@lawfirm.com',
      UserRole.ATTORNEY
    );

    if (promissoryNote) {
      log('\n✓ Promissory Note uploaded successfully', colors.green);
      log(`  Document ID: ${promissoryNote.id}`);
      log(`  Hash: ${promissoryNote.currentHash.substring(0, 32)}...`);
      log(`  Status: ${promissoryNote.status}`);
      log(`  Block ID: ${promissoryNote.events[0].blockId.substring(0, 32)}...`);
    }

    const deedOfTrust = await BlockchainServiceNode.createDocument(
      'TX-2024-8492',
      deedOfTrustPath,
      'Deed of Trust',
      'john.attorney@lawfirm.com',
      UserRole.ATTORNEY
    );

    if (deedOfTrust) {
      log('\n✓ Deed of Trust uploaded successfully', colors.green);
      log(`  Document ID: ${deedOfTrust.id}`);
      log(`  Hash: ${deedOfTrust.currentHash.substring(0, 32)}...`);
      log(`  Status: ${deedOfTrust.status}`);
    }

    // Step 4: Simulate document approval workflow
    logSection('Step 4: Document Approval Workflow');
    
    if (promissoryNote) {
      // Lender approval
      const approved = BlockchainServiceNode.addEvent(
        promissoryNote.id,
        EventType.APPROVAL,
        'sarah.underwriter@bank.com',
        UserRole.LENDER,
        promissoryNote.currentHash,
        { comment: 'Terms approved by underwriting' }
      );
      log('\n✓ Document approved by Lender', colors.green);
      log(`  New Status: ${approved?.status}`);

      // Borrower signature
      const signed = BlockchainServiceNode.addEvent(
        promissoryNote.id,
        EventType.SIGNATURE,
        'ceo@marketstreetdev.com',
        UserRole.BORROWER,
        promissoryNote.currentHash,
        { signatureMethod: 'DocuSign', timestamp: new Date().toISOString() }
      );
      log('\n✓ Document signed by Borrower', colors.green);
      log(`  New Status: ${signed?.status}`);

      // Notarization
      BlockchainServiceNode.addEvent(
        promissoryNote.id,
        EventType.NOTARIZATION,
        'notary123@notaryservice.com',
        UserRole.NOTARY,
        promissoryNote.currentHash,
        { notaryLicense: 'PA-12345', location: 'Philadelphia, PA' }
      );
      log('\n✓ Document notarized', colors.green);

      // Recording
      const recorded = BlockchainServiceNode.addEvent(
        promissoryNote.id,
        EventType.RECORDED,
        'clerk@phila.gov',
        UserRole.COUNTY_CLERK,
        promissoryNote.currentHash,
        { recordingNumber: 'REC-2024-987654', recordingDate: new Date().toISOString() }
      );
      log('\n✓ Document recorded with County', colors.green);
      log(`  New Status: ${recorded?.status}`);
    }

    // Step 5: Verify document authenticity
    logSection('Step 5: Document Verification');
    
    const verification = await BlockchainServiceNode.verifyDocument(promissoryNotePath);
    if (verification.verified) {
      log('\n✓ DOCUMENT VERIFIED ON BLOCKCHAIN', colors.bright + colors.green);
      log(`  Document: ${verification.doc?.name}`);
      log(`  Type: ${verification.doc?.type}`);
      log(`  Status: ${verification.doc?.status}`);
      log(`  Transaction: ${verification.transaction?.id}`);
      log(`  Verified Block: ${verification.matchedEvent?.blockId.substring(0, 32)}...`);
    }

    // Test with a modified document
    const modifiedPath = await createSampleFile(
      'promissory-note-modified.txt',
      'PROMISSORY NOTE (MODIFIED)\n\nAmount: $30,000,000\n...'
    );
    
    const failedVerification = await BlockchainServiceNode.verifyDocument(modifiedPath);
    log('\n✗ Modified document verification:', colors.red);
    log(`  Verified: ${failedVerification.verified}`);
    log('  (Document hash does not match any recorded version)', colors.yellow);

    // Step 6: Display document history
    logSection('Step 6: Document Audit Trail');
    
    if (promissoryNote) {
      const history = BlockchainServiceNode.getDocumentHistory(promissoryNote.id);
      if (history) {
        log(`\nAudit Trail for Document ${promissoryNote.id}:`, colors.bright);
        history.forEach((event, index) => {
          const date = new Date(event.timestamp);
          log(`\n  ${index + 1}. ${event.type}`, colors.yellow);
          log(`     Actor: ${event.actorId} (${event.actorRole})`);
          log(`     Time: ${date.toLocaleString()}`);
          log(`     Block: ${event.blockId.substring(0, 20)}...`);
          if (event.metadata && Object.keys(event.metadata).length > 0) {
            log(`     Metadata: ${JSON.stringify(event.metadata, null, 2).replace(/\n/g, '\n     ')}`);
          }
        });
      }
    }

    // Step 7: Summary
    logSection('Step 7: Transaction Summary');
    
    const updatedTx = BlockchainServiceNode.getTransaction('TX-2024-8492');
    if (updatedTx) {
      log(`\nTransaction ${updatedTx.id}:`, colors.bright);
      log(`  Status: ${updatedTx.status}`, colors.green);
      log(`  Total Documents: ${updatedTx.documents.length}`);
      log(`  Documents:`);
      updatedTx.documents.forEach(doc => {
        log(`    - ${doc.name} (${doc.type}): ${doc.status}`, 
            doc.status === 'RECORDED' ? colors.green : colors.yellow);
        log(`      Events: ${doc.events.length} blockchain entries`);
      });
    }

    logSection('DEMO COMPLETED SUCCESSFULLY');
    log('\nThis demonstration shows:', colors.cyan);
    log('• Document upload and hash generation');
    log('• Multi-party approval workflow');
    log('• Blockchain event recording');
    log('• Document verification');
    log('• Complete audit trail');
    log('• Tamper detection');

  } catch (error) {
    log(`\nError: ${error}`, colors.red);
  }
}

// Run the demo
runDemo();