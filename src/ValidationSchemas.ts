import { z } from 'zod';

// ============================================================
// Enums and Constants
// ============================================================

export const UserRoleSchema = z.enum([
  'BORROWER',
  'LENDER',
  'TITLE_COMPANY',
  'ATTORNEY',
  'NOTARY',
  'COUNTY_CLERK',
]);

export const EventTypeSchema = z.enum([
  'UPLOAD',
  'VIEW',
  'APPROVAL',
  'SIGNATURE',
  'NOTARIZATION',
  'RECORDED',
  'REVISION',
]);

export const DocumentStatusSchema = z.enum([
  'DRAFT',
  'APPROVED',
  'SIGNED',
  'RECORDED',
]);

export const TransactionStatusSchema = z.enum([
  'OPEN',
  'CLOSING',
  'RECORDED',
  'COMPLETED',
]);

export const DocumentTypeSchema = z.enum([
  'PROMISSORY_NOTE',
  'DEED_OF_TRUST',
  'CLOSING_DISCLOSURE',
  'TITLE_COMMITMENT',
  'MORTGAGE',
  'ASSIGNMENT',
  'SUBORDINATION_AGREEMENT',
  'ESTOPPEL_CERTIFICATE',
  'GUARANTY',
  'ENVIRONMENTAL_INDEMNITY',
  'UCC_FINANCING_STATEMENT',
  'OTHER',
]);

// ============================================================
// Core Entity Schemas
// ============================================================

/**
 * Email validation with proper format
 */
export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(254, 'Email too long');

/**
 * SHA-256 hash validation (64 hex characters)
 */
export const HashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, 'Invalid SHA-256 hash format');

/**
 * Block ID validation (starts with 0x, 64+ hex characters)
 */
export const BlockIdSchema = z
  .string()
  .regex(/^0x[a-f0-9]{64,}$/i, 'Invalid block ID format');

/**
 * Transaction ID validation
 */
export const TransactionIdSchema = z
  .string()
  .regex(/^TX-\d{4}-\d{4,}$/, 'Transaction ID must be in format TX-YYYY-NNNN');

/**
 * Document ID validation
 */
export const DocumentIdSchema = z
  .string()
  .regex(/^DOC-\d{13,}$/, 'Document ID must be in format DOC-timestamp');

/**
 * US Currency amount (positive, max 2 decimal places)
 */
export const CurrencySchema = z
  .number()
  .positive('Amount must be positive')
  .max(999999999999, 'Amount exceeds maximum')
  .refine(
    (val) => Number.isFinite(val) && Math.round(val * 100) / 100 === val,
    'Amount must have at most 2 decimal places'
  );

/**
 * Interest rate (0-100%, up to 4 decimal places)
 */
export const InterestRateSchema = z
  .number()
  .min(0, 'Interest rate cannot be negative')
  .max(100, 'Interest rate cannot exceed 100%')
  .refine(
    (val) => Math.round(val * 10000) / 10000 === val,
    'Interest rate must have at most 4 decimal places'
  );

/**
 * US Address validation
 */
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(200, 'Street too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  state: z.string().length(2, 'State must be 2-letter abbreviation'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  county: z.string().optional(),
});

/**
 * Simple address string (for backwards compatibility)
 */
export const AddressStringSchema = z
  .string()
  .min(10, 'Address too short')
  .max(500, 'Address too long');

// ============================================================
// Blockchain Event Schema
// ============================================================

export const BlockchainEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  timestamp: z.number().int().positive('Timestamp must be positive'),
  type: EventTypeSchema,
  actorId: EmailSchema,
  actorRole: UserRoleSchema,
  docHash: HashSchema,
  metadata: z.record(z.any()).optional(),
  blockId: BlockIdSchema,
});

// ============================================================
// Document Schema
// ============================================================

export const DocumentAssetSchema = z.object({
  id: DocumentIdSchema,
  name: z.string().min(1, 'Document name is required').max(255, 'Name too long'),
  type: z.string().min(1, 'Document type is required').max(100, 'Type too long'),
  currentVersion: z.number().int().positive('Version must be positive'),
  currentHash: HashSchema,
  status: DocumentStatusSchema,
  events: z.array(BlockchainEventSchema),
});

// ============================================================
// Transaction Schema
// ============================================================

export const TransactionSchema = z.object({
  id: TransactionIdSchema,
  propertyAddress: AddressStringSchema,
  loanAmount: CurrencySchema,
  lenderName: z.string().min(1, 'Lender name is required').max(200, 'Name too long'),
  borrowerName: z.string().min(1, 'Borrower name is required').max(200, 'Name too long'),
  status: TransactionStatusSchema,
  createdAt: z.number().int().positive('Created timestamp must be positive'),
  documents: z.array(DocumentAssetSchema),
});

// ============================================================
// Input Validation Schemas (for API requests)
// ============================================================

/**
 * Create Transaction Input
 */
export const CreateTransactionInputSchema = z.object({
  propertyAddress: AddressStringSchema,
  loanAmount: CurrencySchema,
  lenderName: z.string().min(1).max(200),
  borrowerName: z.string().min(1).max(200),
  interestRate: InterestRateSchema.optional(),
  loanTermMonths: z.number().int().min(1).max(600).optional(),
});

/**
 * Upload Document Input
 */
export const UploadDocumentInputSchema = z.object({
  transactionId: TransactionIdSchema,
  documentType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  actorId: EmailSchema,
  actorRole: UserRoleSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Add Event Input
 */
export const AddEventInputSchema = z.object({
  documentId: DocumentIdSchema,
  eventType: EventTypeSchema,
  actorId: EmailSchema,
  actorRole: UserRoleSchema,
  currentHash: HashSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Loan Document Generation Input
 */
export const LoanDocumentInputSchema = z.object({
  transactionId: TransactionIdSchema,
  documentType: DocumentTypeSchema,
  propertyAddress: AddressStringSchema,
  loanAmount: CurrencySchema,
  interestRate: InterestRateSchema,
  lenderName: z.string().min(1).max(200),
  borrowerName: z.string().min(1).max(200),
  loanTerm: z.number().int().min(1).max(600),
  closingDate: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format'),
  additionalTerms: z.string().max(5000).optional(),
});

// ============================================================
// Validation Helper Functions
// ============================================================

export const ValidationHelpers = {
  /**
   * Validate and parse data, throwing on error
   */
  validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  },

  /**
   * Safe validate - returns result object instead of throwing
   */
  safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError['errors'];
  } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, errors: result.error.errors };
  },

  /**
   * Format validation errors for display
   */
  formatErrors(errors: z.ZodError['errors']): string[] {
    return errors.map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
  },

  /**
   * Validate transaction ID format
   */
  isValidTransactionId(id: string): boolean {
    return TransactionIdSchema.safeParse(id).success;
  },

  /**
   * Validate document ID format
   */
  isValidDocumentId(id: string): boolean {
    return DocumentIdSchema.safeParse(id).success;
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    return EmailSchema.safeParse(email).success;
  },

  /**
   * Validate SHA-256 hash format
   */
  isValidHash(hash: string): boolean {
    return HashSchema.safeParse(hash).success;
  },

  /**
   * Sanitize string input (trim, remove control characters)
   */
  sanitizeString(input: string): string {
    return input
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  },

  /**
   * Validate and sanitize loan amount
   */
  validateLoanAmount(amount: number): {
    valid: boolean;
    value?: number;
    error?: string;
  } {
    const result = CurrencySchema.safeParse(amount);
    if (result.success) {
      return { valid: true, value: Math.round(amount * 100) / 100 };
    }
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Invalid amount',
    };
  },
};

// ============================================================
// Type Exports (inferred from schemas)
// ============================================================

export type UserRole = z.infer<typeof UserRoleSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type BlockchainEvent = z.infer<typeof BlockchainEventSchema>;
export type DocumentAsset = z.infer<typeof DocumentAssetSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;
export type UploadDocumentInput = z.infer<typeof UploadDocumentInputSchema>;
export type AddEventInput = z.infer<typeof AddEventInputSchema>;
export type LoanDocumentInput = z.infer<typeof LoanDocumentInputSchema>;
export type Address = z.infer<typeof AddressSchema>;

export default ValidationHelpers;
