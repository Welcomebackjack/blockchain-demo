import { PDFDocument, rgb, StandardFonts, RGB } from 'pdf-lib';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

// Type for Tesseract word data
interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface LoanDocumentData {
  transactionId: string;
  documentType: 'PROMISSORY_NOTE' | 'DEED_OF_TRUST' | 'CLOSING_DISCLOSURE' | 'TITLE_COMMITMENT';
  propertyAddress: string;
  loanAmount: number;
  interestRate: number;
  lenderName: string;
  borrowerName: string;
  loanTerm: number; // months
  closingDate: string;
  additionalTerms?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  grayscale?: boolean;
  sharpen?: boolean;
}

export const DocumentProcessor = {
  /**
   * Generate a professional PDF loan document
   */
  async generateLoanDocument(data: LoanDocumentData, outputPath: string): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();

    let yPosition = height - 50;
    const margin = 50;
    const lineHeight = 14;

    // Helper function to add text
    const addText = (text: string, options: {
      font?: typeof timesRoman;
      size?: number;
      color?: RGB;
      x?: number;
      y?: number;
      maxWidth?: number;
    } = {}) => {
      const font = options.font || timesRoman;
      const size = options.size || 12;
      const x = options.x || margin;
      const y = options.y || yPosition;

      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: options.color || rgb(0, 0, 0),
        maxWidth: options.maxWidth || width - 2 * margin,
      });

      if (!options.y) {
        yPosition -= lineHeight * (size / 12);
      }
    };

    // Document Title
    const titles: Record<string, string> = {
      'PROMISSORY_NOTE': 'PROMISSORY NOTE',
      'DEED_OF_TRUST': 'DEED OF TRUST',
      'CLOSING_DISCLOSURE': 'CLOSING DISCLOSURE',
      'TITLE_COMMITMENT': 'TITLE COMMITMENT',
    };

    addText(titles[data.documentType] || data.documentType, {
      font: timesRomanBold,
      size: 18,
      x: width / 2 - 80,
    });
    yPosition -= 30;

    // Transaction ID
    addText(`Transaction ID: ${data.transactionId}`, { size: 10 });
    addText(`Date: ${data.closingDate}`, { size: 10 });
    yPosition -= 20;

    // Parties
    addText('PARTIES:', { font: timesRomanBold });
    addText(`Lender: ${data.lenderName}`);
    addText(`Borrower: ${data.borrowerName}`);
    yPosition -= 15;

    // Property
    addText('PROPERTY:', { font: timesRomanBold });
    addText(`Address: ${data.propertyAddress}`);
    yPosition -= 15;

    // Loan Terms
    addText('LOAN TERMS:', { font: timesRomanBold });
    addText(`Principal Amount: $${data.loanAmount.toLocaleString()}`);
    addText(`Interest Rate: ${data.interestRate}% per annum`);
    addText(`Loan Term: ${data.loanTerm} months (${Math.floor(data.loanTerm / 12)} years)`);

    const monthlyPayment = this.calculateMonthlyPayment(data.loanAmount, data.interestRate, data.loanTerm);
    addText(`Monthly Payment: $${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    yPosition -= 15;

    // Document-specific content
    if (data.documentType === 'PROMISSORY_NOTE') {
      addText('PROMISE TO PAY:', { font: timesRomanBold });
      yPosition -= 5;
      const promiseText = `FOR VALUE RECEIVED, the undersigned Borrower promises to pay to the order of ${data.lenderName} ("Lender"), the principal sum of ${data.loanAmount.toLocaleString()} Dollars ($${data.loanAmount.toLocaleString()}.00), together with interest thereon at the rate of ${data.interestRate}% per annum, in lawful money of the United States of America.`;
      addText(promiseText, { size: 11 });
      yPosition -= 20;

      addText('PAYMENT TERMS:', { font: timesRomanBold });
      addText(`Payments shall be made in ${data.loanTerm} consecutive monthly installments of $${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}, commencing on the first day of the month following closing.`);
    } else if (data.documentType === 'DEED_OF_TRUST') {
      addText('CONVEYANCE AND GRANT:', { font: timesRomanBold });
      yPosition -= 5;
      addText(`Borrower irrevocably grants and conveys to Trustee, in trust, with power of sale, the property located at ${data.propertyAddress} ("Property") to secure payment of the debt evidenced by the Promissory Note.`);
    }

    // Additional terms
    if (data.additionalTerms) {
      yPosition -= 15;
      addText('ADDITIONAL TERMS:', { font: timesRomanBold });
      addText(data.additionalTerms);
    }

    // Signature blocks at bottom
    yPosition = 150;
    addText('SIGNATURES:', { font: timesRomanBold });
    yPosition -= 30;

    // Borrower signature
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: margin + 200, y: yPosition },
      thickness: 1,
    });
    addText('Borrower Signature', { y: yPosition - 15, size: 10 });
    addText(data.borrowerName, { y: yPosition - 28, size: 10 });

    // Lender signature
    page.drawLine({
      start: { x: width - margin - 200, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
    });
    addText('Lender Signature', { x: width - margin - 200, y: yPosition - 15, size: 10 });
    addText(data.lenderName, { x: width - margin - 200, y: yPosition - 28, size: 10 });

    // Footer
    page.drawText(`Generated by Blockchain Loan Document System | Block verification pending`, {
      x: margin,
      y: 30,
      size: 8,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  },

  /**
   * Calculate monthly payment using standard amortization formula
   */
  calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / termMonths;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
           (Math.pow(1 + monthlyRate, termMonths) - 1);
  },

  /**
   * Perform OCR on a scanned document image
   */
  async performOCR(imagePath: string): Promise<OCRResult> {
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Progress callback - could be used for UI updates
        }
      },
    });

    const words = (result.data as any).words || [];
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: words.map((word: TesseractWord) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      })),
    };
  },

  /**
   * Extract text from a scanned PDF or image for indexing/searching
   */
  async extractTextFromDocument(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif'].includes(ext)) {
      const result = await this.performOCR(filePath);
      return result.text;
    }

    // For PDFs, we'd need to convert pages to images first
    // This is a simplified version
    throw new Error(`Unsupported file type for OCR: ${ext}. Supported: jpg, jpeg, png, tiff, bmp, gif`);
  },

  /**
   * Process and optimize an image for document storage
   */
  async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<{ width: number; height: number; size: number }> {
    let pipeline = sharp(inputPath);

    // Resize if dimensions specified
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to grayscale if requested (good for document scans)
    if (options.grayscale) {
      pipeline = pipeline.grayscale();
    }

    // Sharpen for better text clarity
    if (options.sharpen) {
      pipeline = pipeline.sharpen();
    }

    // Output format
    const format = options.format || 'jpeg';
    const quality = options.quality || 85;

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(outputPath);

    // Get metadata of processed image
    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: stats.size,
    };
  },

  /**
   * Prepare a document image for OCR (optimize for text recognition)
   */
  async prepareForOCR(inputPath: string, outputPath: string): Promise<string> {
    await sharp(inputPath)
      .grayscale()
      .normalize() // Enhance contrast
      .sharpen()
      .threshold(128) // Binarize for cleaner text
      .toFile(outputPath);

    return outputPath;
  },

  /**
   * Create a thumbnail for document preview
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 200
  ): Promise<string> {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  },

  /**
   * Add a watermark to a document image
   */
  async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkText: string = 'DRAFT'
  ): Promise<string> {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Create SVG watermark
    const svgWatermark = `
      <svg width="${width}" height="${height}">
        <text
          x="50%"
          y="50%"
          font-size="72"
          fill="rgba(255, 0, 0, 0.3)"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-45, ${width/2}, ${height/2})"
        >${watermarkText}</text>
      </svg>
    `;

    await image
      .composite([{
        input: Buffer.from(svgWatermark),
        gravity: 'center',
      }])
      .toFile(outputPath);

    return outputPath;
  },
};

export default DocumentProcessor;
