import { AuditLogger, AuditEventType } from './AuditLogger';
import { EncryptionService } from './EncryptionService';
import {
  ValidationHelpers,
  CreateTransactionInputSchema,
  LoanDocumentInputSchema,
  TransactionIdSchema,
  EmailSchema,
  CurrencySchema,
} from './ValidationSchemas';
import * as fs from 'fs/promises';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

const log = {
  header: (msg: string) => console.log(`\n${'='.repeat(60)}\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n${'='.repeat(60)}`),
  subheader: (msg: string) => console.log(`\n${colors.bold}${colors.magenta}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.reset}  ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  code: (msg: string) => console.log(`${colors.gray}  ${msg}${colors.reset}`),
};

async function runComplianceDemo() {
  log.header('COMPLIANCE & SECURITY DEMO');
  log.info('Demonstrating audit logging, encryption, and data validation\n');

  // ============================================================
  // Step 1: Initialize Encryption Service
  // ============================================================
  log.header('Step 1: Initialize Encryption Service');

  await EncryptionService.initialize();
  log.success('Encryption service initialized');

  const keys = EncryptionService.listKeys();
  log.info('Available keys:');
  keys.forEach((key) => {
    log.code(`  - ${key.id} (${key.use}, ${key.alg})`);
  });

  // ============================================================
  // Step 2: Data Validation with Zod
  // ============================================================
  log.header('Step 2: Data Validation with Zod');

  log.subheader('2a. Validate Transaction Input');

  // Valid transaction
  const validTransaction = {
    propertyAddress: '1200 Market St, Philadelphia, PA 19107',
    loanAmount: 24500000,
    lenderName: 'Keystone Commercial Bank',
    borrowerName: 'Market Street Developers LLC',
    interestRate: 6.5,
    loanTermMonths: 360,
  };

  const txResult = ValidationHelpers.safeValidate(CreateTransactionInputSchema, validTransaction);
  if (txResult.success) {
    log.success('Valid transaction data accepted');
    log.info(`  Loan Amount: $${txResult.data?.loanAmount.toLocaleString()}`);
  }

  // Invalid transaction (negative loan amount)
  const invalidTransaction = {
    propertyAddress: '123 Main St',
    loanAmount: -50000, // Invalid!
    lenderName: 'Test Bank',
    borrowerName: 'Test Borrower',
  };

  const invalidResult = ValidationHelpers.safeValidate(CreateTransactionInputSchema, invalidTransaction);
  if (!invalidResult.success) {
    log.warn('Invalid transaction correctly rejected:');
    ValidationHelpers.formatErrors(invalidResult.errors!).forEach((err) => {
      log.code(`  - ${err}`);
    });
  }

  log.subheader('2b. Validate Email Addresses');

  const emails = [
    'john.attorney@lawfirm.com',
    'invalid-email',
    'test@',
    'valid@domain.org',
  ];

  emails.forEach((email) => {
    const isValid = ValidationHelpers.isValidEmail(email);
    if (isValid) {
      log.success(`"${email}" - Valid`);
    } else {
      log.error(`"${email}" - Invalid`);
    }
  });

  log.subheader('2c. Validate Currency Amounts');

  const amounts = [24500000, 1234.56, -100, 0.001, 999999999999.99];

  amounts.forEach((amount) => {
    const result = ValidationHelpers.validateLoanAmount(amount);
    if (result.valid) {
      log.success(`$${amount.toLocaleString()} - Valid`);
    } else {
      log.error(`$${amount} - ${result.error}`);
    }
  });

  // ============================================================
  // Step 3: Encryption & Decryption
  // ============================================================
  log.header('Step 3: Encryption & Decryption');

  const actor = { id: 'john.attorney@lawfirm.com', role: 'ATTORNEY' };

  log.subheader('3a. Encrypt Sensitive Data');

  const sensitiveData = JSON.stringify({
    ssn: '123-45-6789',
    accountNumber: '9876543210',
    borrowerIncome: 250000,
  });

  log.info('Original data (sensitive):');
  log.code(`  ${sensitiveData}`);

  const encrypted = await EncryptionService.encrypt(sensitiveData, 'default-encryption', actor);
  log.success('Data encrypted successfully');
  log.info('Encrypted (JWE compact format):');
  log.code(`  ${encrypted.substring(0, 50)}...`);
  log.code(`  (${encrypted.length} characters total)`);

  log.subheader('3b. Decrypt Data');

  const decrypted = await EncryptionService.decrypt(encrypted, actor);
  log.success('Data decrypted successfully');
  log.info('Decrypted data:');
  log.code(`  ${decrypted}`);

  // ============================================================
  // Step 4: Digital Signatures
  // ============================================================
  log.header('Step 4: Digital Signatures');

  log.subheader('4a. Sign a Document');

  const documentContent = {
    transactionId: 'TX-2024-8492',
    documentType: 'PROMISSORY_NOTE',
    hash: 'a1b2c3d4e5f6...',
    timestamp: new Date().toISOString(),
  };

  const signature = await EncryptionService.sign(documentContent, 'default-signing', actor);
  log.success('Document signed successfully');
  log.info('Signature (JWS compact format):');
  log.code(`  ${signature.substring(0, 50)}...`);

  log.subheader('4b. Verify Signature');

  const verifyResult = await EncryptionService.verify(signature, actor);
  if (verifyResult.valid) {
    log.success('Signature verified successfully');
    log.info(`  Signed by key: ${verifyResult.keyId}`);
    log.info(`  Payload: ${verifyResult.payload?.substring(0, 50)}...`);
  }

  // Tamper with signature and verify fails
  const tamperedSignature = signature.slice(0, -5) + 'XXXXX';
  const tamperedResult = await EncryptionService.verify(tamperedSignature, actor);
  if (!tamperedResult.valid) {
    log.warn('Tampered signature correctly rejected');
  }

  // ============================================================
  // Step 5: Document Integrity
  // ============================================================
  log.header('Step 5: Document Integrity Verification');

  const sampleDocContent = `
    PROMISSORY NOTE
    Transaction: TX-2024-8492
    Amount: $24,500,000
    This is a legally binding document...
  `;

  log.subheader('5a. Create Integrity Record');

  const integrityRecord = await EncryptionService.createIntegrityRecord(
    sampleDocContent,
    'default-signing',
    actor
  );

  log.success('Integrity record created');
  log.info(`  Hash: ${integrityRecord.hash.substring(0, 32)}...`);
  log.info(`  Algorithm: ${integrityRecord.algorithm}`);
  log.info(`  Timestamp: ${integrityRecord.timestamp.toISOString()}`);
  log.info(`  Signed: Yes (${integrityRecord.keyId})`);

  log.subheader('5b. Verify Document Integrity');

  // Verify original document
  const integrityCheck = await EncryptionService.verifyIntegrity(
    sampleDocContent,
    integrityRecord,
    actor
  );

  log.success(`Original document verification:`);
  log.info(`  Hash match: ${integrityCheck.hashMatch ? 'Yes' : 'No'}`);
  log.info(`  Signature valid: ${integrityCheck.signatureValid ? 'Yes' : 'No'}`);
  log.info(`  Overall: ${integrityCheck.valid ? 'VALID' : 'INVALID'}`);

  // Verify tampered document
  const tamperedDoc = sampleDocContent.replace('$24,500,000', '$24,500,001');
  const tamperedCheck = await EncryptionService.verifyIntegrity(
    tamperedDoc,
    integrityRecord,
    actor
  );

  log.warn(`Tampered document verification:`);
  log.info(`  Hash match: ${tamperedCheck.hashMatch ? 'Yes' : 'No'}`);
  log.info(`  Overall: ${tamperedCheck.valid ? 'VALID' : 'INVALID (correctly detected)'}`);

  // ============================================================
  // Step 6: Audit Logging
  // ============================================================
  log.header('Step 6: Audit Logging');

  log.subheader('6a. Log Various Events');

  // Log document events
  AuditLogger.logDocumentEvent(
    AuditEventType.DOCUMENT_CREATED,
    'DOC-1234567890123',
    'promissory-note.pdf',
    actor,
    { fileSize: 245678, mimeType: 'application/pdf' }
  );
  log.success('Logged: Document created');

  AuditLogger.logDocumentEvent(
    AuditEventType.DOCUMENT_UPLOADED,
    'DOC-1234567890123',
    'promissory-note.pdf',
    actor,
    { transactionId: 'TX-2024-8492' }
  );
  log.success('Logged: Document uploaded');

  // Log workflow events
  AuditLogger.logWorkflowEvent(
    AuditEventType.APPROVAL_GRANTED,
    'TX-2024-8492',
    'DOC-1234567890123',
    { id: 'sarah.underwriter@bank.com', role: 'LENDER' },
    { comment: 'Terms approved by underwriting committee' }
  );
  log.success('Logged: Approval granted');

  AuditLogger.logWorkflowEvent(
    AuditEventType.SIGNATURE_APPLIED,
    'TX-2024-8492',
    'DOC-1234567890123',
    { id: 'ceo@borrower.com', role: 'BORROWER' },
    { signatureMethod: 'DocuSign', ipAddress: '192.168.1.100' }
  );
  log.success('Logged: Signature applied');

  // Log access event
  AuditLogger.logAccessEvent(
    AuditEventType.ACCESS_GRANTED,
    { id: 'viewer@external.com', role: 'ATTORNEY', ip: '10.0.0.50' },
    'document',
    'DOC-1234567890123',
    true
  );
  log.success('Logged: Access granted');

  // Log security event (this was already logged by encryption operations)
  log.success('Logged: Multiple security events (encryption, signing)');

  log.subheader('6b. Query Audit Logs');

  // Small delay to ensure logs are written
  await new Promise((resolve) => setTimeout(resolve, 100));

  const recentLogs = await AuditLogger.queryLogs({ limit: 5 });
  log.info(`Found ${recentLogs.length} recent log entries:`);
  recentLogs.forEach((entry, i) => {
    log.code(`  ${i + 1}. [${entry.eventType}] ${entry.action}`);
  });

  log.subheader('6c. Log Files Created');

  const logsDir = path.join(process.cwd(), 'logs');
  try {
    const logFiles = await fs.readdir(logsDir);
    log.info(`Log files in ${logsDir}:`);
    for (const file of logFiles) {
      const stats = await fs.stat(path.join(logsDir, file));
      log.code(`  - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  } catch {
    log.warn('Logs directory not yet created');
  }

  // ============================================================
  // Summary
  // ============================================================
  log.header('COMPLIANCE DEMO COMPLETED');

  log.info('\n' + colors.cyan + 'Compliance & Security Capabilities:' + colors.reset);

  log.info('\n  ' + colors.bold + 'Audit Logging (Winston)' + colors.reset);
  log.info('    - Structured JSON logs for machine parsing');
  log.info('    - Human-readable combined logs');
  log.info('    - Separate security event logging');
  log.info('    - Error tracking with stack traces');
  log.info('    - Log rotation and size limits');
  log.info('    - Queryable audit trail');
  log.info('    - Compliance report export (JSON/CSV)');

  log.info('\n  ' + colors.bold + 'Encryption (Node-Jose)' + colors.reset);
  log.info('    - RSA key pair generation');
  log.info('    - JWE encryption (RSA-OAEP-256 + A256GCM)');
  log.info('    - JWS digital signatures (RS256)');
  log.info('    - Document integrity records');
  log.info('    - Key rotation support');
  log.info('    - File encryption/decryption');

  log.info('\n  ' + colors.bold + 'Data Validation (Zod)' + colors.reset);
  log.info('    - Schema-based validation');
  log.info('    - Type-safe parsing');
  log.info('    - Custom validators (email, currency, etc.)');
  log.info('    - Detailed error messages');
  log.info('    - Input sanitization helpers');

  log.info('\n  ' + colors.bold + 'Files Created:' + colors.reset);
  log.info('    - logs/audit.log (JSON audit trail)');
  log.info('    - logs/security.log (security events)');
  log.info('    - logs/error.log (errors only)');
  log.info('    - logs/combined.log (human-readable)');
  log.info('    - .keys/keystore.json (encrypted keys)');
}

// Run the demo
runComplianceDemo().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
