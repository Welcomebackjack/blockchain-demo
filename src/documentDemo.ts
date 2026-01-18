import { DocumentProcessor, LoanDocumentData } from './DocumentProcessor';
import { BlockchainServiceNode } from './BlockchainServiceNode';
import { UserRole } from './types';
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
};

const log = {
  header: (msg: string) => console.log(`\n${'='.repeat(60)}\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n${'='.repeat(60)}`),
  success: (msg: string) => console.log(`${colors.green}${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.reset}${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}${msg}${colors.reset}`),
};

async function runDocumentProcessingDemo() {
  log.header('DOCUMENT PROCESSING DEMO');
  log.info('Demonstrating PDF generation, OCR, and image processing\n');

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'generated-docs');
  await fs.mkdir(outputDir, { recursive: true });

  // ============================================================
  // Step 1: Generate Professional PDF Documents
  // ============================================================
  log.header('Step 1: Generate Professional PDF Documents');

  const transactions = BlockchainServiceNode.getTransactions();
  const tx = transactions[0]; // Use first transaction

  const loanData: LoanDocumentData = {
    transactionId: tx.id,
    documentType: 'PROMISSORY_NOTE',
    propertyAddress: tx.propertyAddress,
    loanAmount: tx.loanAmount,
    interestRate: 6.5,
    lenderName: tx.lenderName,
    borrowerName: tx.borrowerName,
    loanTerm: 360, // 30 years
    closingDate: new Date().toLocaleDateString(),
    additionalTerms: 'This note is secured by a Deed of Trust on the Property. Prepayment may be made without penalty after 3 years.',
  };

  const promissoryNotePath = path.join(outputDir, 'promissory-note.pdf');
  await DocumentProcessor.generateLoanDocument(loanData, promissoryNotePath);
  log.success(`\n✓ Generated Promissory Note: ${promissoryNotePath}`);

  // Generate Deed of Trust
  const deedData: LoanDocumentData = {
    ...loanData,
    documentType: 'DEED_OF_TRUST',
  };
  const deedPath = path.join(outputDir, 'deed-of-trust.pdf');
  await DocumentProcessor.generateLoanDocument(deedData, deedPath);
  log.success(`✓ Generated Deed of Trust: ${deedPath}`);

  // Show loan calculation
  const monthlyPayment = DocumentProcessor.calculateMonthlyPayment(
    loanData.loanAmount,
    loanData.interestRate,
    loanData.loanTerm
  );
  log.info(`\n  Loan Details:`);
  log.info(`  Principal: $${loanData.loanAmount.toLocaleString()}`);
  log.info(`  Interest Rate: ${loanData.interestRate}%`);
  log.info(`  Term: ${loanData.loanTerm / 12} years`);
  log.info(`  Monthly Payment: $${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  // ============================================================
  // Step 2: Upload Generated PDFs to Blockchain
  // ============================================================
  log.header('Step 2: Upload Generated PDFs to Blockchain');

  const promissoryDoc = await BlockchainServiceNode.createDocument(
    tx.id,
    promissoryNotePath,
    'Promissory Note',
    'john.attorney@lawfirm.com',
    UserRole.ATTORNEY
  );

  if (promissoryDoc) {
    log.success(`\n✓ Promissory Note uploaded to blockchain`);
    log.info(`  Document ID: ${promissoryDoc.id}`);
    log.info(`  Hash: ${promissoryDoc.currentHash.substring(0, 32)}...`);
    log.info(`  Block: ${promissoryDoc.events[0].blockId.substring(0, 32)}...`);
  }

  const deedDoc = await BlockchainServiceNode.createDocument(
    tx.id,
    deedPath,
    'Deed of Trust',
    'john.attorney@lawfirm.com',
    UserRole.ATTORNEY
  );

  if (deedDoc) {
    log.success(`\n✓ Deed of Trust uploaded to blockchain`);
    log.info(`  Document ID: ${deedDoc.id}`);
    log.info(`  Hash: ${deedDoc.currentHash.substring(0, 32)}...`);
  }

  // ============================================================
  // Step 3: Image Processing Demo
  // ============================================================
  log.header('Step 3: Image Processing Capabilities');

  // Create a sample image for demo
  const sampleImagePath = path.join(outputDir, 'sample-scan.png');

  // Create a simple test image using sharp
  const sharp = require('sharp');
  await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toFile(sampleImagePath);

  log.success(`\n✓ Created sample image for processing demo`);

  // Create thumbnail
  const thumbnailPath = path.join(outputDir, 'sample-thumbnail.jpg');
  await DocumentProcessor.createThumbnail(sampleImagePath, thumbnailPath, 150);
  log.success(`✓ Created thumbnail: ${thumbnailPath}`);

  // Process image with optimization
  const optimizedPath = path.join(outputDir, 'sample-optimized.jpg');
  const processedInfo = await DocumentProcessor.processImage(sampleImagePath, optimizedPath, {
    width: 1200,
    quality: 85,
    format: 'jpeg',
  });
  log.success(`✓ Optimized image: ${optimizedPath}`);
  log.info(`  Dimensions: ${processedInfo.width}x${processedInfo.height}`);
  log.info(`  Size: ${(processedInfo.size / 1024).toFixed(1)} KB`);

  // Add watermark
  const watermarkedPath = path.join(outputDir, 'sample-watermarked.jpg');
  await DocumentProcessor.addWatermark(sampleImagePath, watermarkedPath, 'DRAFT');
  log.success(`✓ Added watermark: ${watermarkedPath}`);

  // ============================================================
  // Step 4: OCR Demo (informational)
  // ============================================================
  log.header('Step 4: OCR Capabilities (Tesseract.js)');

  log.info('\nOCR Features available:');
  log.info('  • performOCR(imagePath) - Extract text from images');
  log.info('  • extractTextFromDocument(filePath) - Smart text extraction');
  log.info('  • prepareForOCR(input, output) - Optimize images for OCR');
  log.info('\nSupported formats: JPEG, PNG, TIFF, BMP, GIF');
  log.info('\nExample usage:');
  log.info(`  const result = await DocumentProcessor.performOCR('scan.jpg');`);
  log.info(`  console.log(result.text);`);
  log.info(`  console.log('Confidence:', result.confidence);`);

  // ============================================================
  // Summary
  // ============================================================
  log.header('DEMO COMPLETED');

  log.info('\nGenerated files in: ' + outputDir);
  const files = await fs.readdir(outputDir);
  files.forEach((file) => {
    log.info(`  • ${file}`);
  });

  log.info('\n' + colors.cyan + 'Document Processing Capabilities:' + colors.reset);
  log.info('  ✓ PDF Generation (pdf-lib)');
  log.info('    - Professional loan documents');
  log.info('    - Promissory notes, deeds of trust');
  log.info('    - Signature blocks, legal formatting');
  log.info('');
  log.info('  ✓ OCR (tesseract.js)');
  log.info('    - Extract text from scanned documents');
  log.info('    - Word-level confidence scores');
  log.info('    - Bounding box positions');
  log.info('');
  log.info('  ✓ Image Processing (sharp)');
  log.info('    - Resize/optimize for storage');
  log.info('    - Thumbnail generation');
  log.info('    - Watermarking');
  log.info('    - OCR preparation (grayscale, sharpen, threshold)');
}

// Run the demo
runDocumentProcessingDemo().catch(console.error);
