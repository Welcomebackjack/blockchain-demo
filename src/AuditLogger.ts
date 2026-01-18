import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for audit logs
const auditFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${meta ? '\n' + meta : ''}`;
});

// JSON format for machine-readable logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the main audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { service: 'blockchain-loan-docs' },
  transports: [
    // Audit trail - all important actions (JSON for parsing)
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
    // Errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // Security events (authentication, authorization, encryption)
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
    // Human-readable combined log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        auditFormat
      ),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Add console output in development
if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta, (k, v) => k === 'service' ? undefined : v)}`
            : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// Audit event types for categorization
export enum AuditEventType {
  // Document events
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
  DOCUMENT_MODIFIED = 'DOCUMENT_MODIFIED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_VERIFICATION_FAILED = 'DOCUMENT_VERIFICATION_FAILED',

  // Blockchain events
  BLOCKCHAIN_EVENT_RECORDED = 'BLOCKCHAIN_EVENT_RECORDED',
  BLOCKCHAIN_HASH_GENERATED = 'BLOCKCHAIN_HASH_GENERATED',
  BLOCKCHAIN_VERIFICATION = 'BLOCKCHAIN_VERIFICATION',

  // Transaction events
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  TRANSACTION_STATUS_CHANGED = 'TRANSACTION_STATUS_CHANGED',

  // Approval workflow events
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  APPROVAL_DENIED = 'APPROVAL_DENIED',
  SIGNATURE_APPLIED = 'SIGNATURE_APPLIED',
  NOTARIZATION_COMPLETED = 'NOTARIZATION_COMPLETED',
  DOCUMENT_RECORDED = 'DOCUMENT_RECORDED',

  // Security events
  ENCRYPTION_PERFORMED = 'ENCRYPTION_PERFORMED',
  DECRYPTION_PERFORMED = 'DECRYPTION_PERFORMED',
  SIGNATURE_VERIFIED = 'SIGNATURE_VERIFIED',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  KEY_GENERATED = 'KEY_GENERATED',
  KEY_ROTATED = 'KEY_ROTATED',

  // Access events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',

  // System events
  SYSTEM_START = 'SYSTEM_START',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

export interface AuditEntry {
  eventType: AuditEventType;
  actor: {
    id: string;
    role: string;
    ip?: string;
  };
  resource?: {
    type: string;
    id: string;
    name?: string;
  };
  action: string;
  details?: Record<string, any>;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  timestamp?: Date;
}

// Security logger for sensitive operations
const securityLogger = winston.createLogger({
  level: 'info',
  format: jsonFormat,
  defaultMeta: { service: 'blockchain-loan-docs', category: 'security' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export const AuditLogger = {
  /**
   * Log a general audit event
   */
  log(entry: AuditEntry): void {
    const logData = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
      correlationId: this.generateCorrelationId(),
    };

    auditLogger.info(entry.action, logData);
  },

  /**
   * Log document-related events
   */
  logDocumentEvent(
    eventType: AuditEventType,
    documentId: string,
    documentName: string,
    actor: { id: string; role: string },
    details?: Record<string, any>
  ): void {
    this.log({
      eventType,
      actor,
      resource: {
        type: 'document',
        id: documentId,
        name: documentName,
      },
      action: `Document ${eventType.replace('DOCUMENT_', '').toLowerCase()}`,
      details,
      result: 'SUCCESS',
    });
  },

  /**
   * Log blockchain events
   */
  logBlockchainEvent(
    eventType: AuditEventType,
    blockId: string,
    documentId: string,
    actor: { id: string; role: string },
    hash?: string
  ): void {
    this.log({
      eventType,
      actor,
      resource: {
        type: 'blockchain',
        id: blockId,
      },
      action: `Blockchain event: ${eventType}`,
      details: {
        documentId,
        hash: hash ? `${hash.substring(0, 16)}...` : undefined,
      },
      result: 'SUCCESS',
    });
  },

  /**
   * Log security events (encryption, signing, key operations)
   */
  logSecurityEvent(
    eventType: AuditEventType,
    actor: { id: string; role: string },
    action: string,
    details?: Record<string, any>,
    result: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
  ): void {
    const logData = {
      eventType,
      actor,
      action,
      details: {
        ...details,
        // Redact sensitive information
        key: details?.key ? '[REDACTED]' : undefined,
        plaintext: details?.plaintext ? '[REDACTED]' : undefined,
      },
      result,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
    };

    securityLogger.info(action, logData);
    auditLogger.info(action, { ...logData, category: 'security' });
  },

  /**
   * Log access control events
   */
  logAccessEvent(
    eventType: AuditEventType,
    actor: { id: string; role: string; ip?: string },
    resourceType: string,
    resourceId: string,
    granted: boolean
  ): void {
    this.log({
      eventType,
      actor,
      resource: {
        type: resourceType,
        id: resourceId,
      },
      action: granted ? 'Access granted' : 'Access denied',
      result: granted ? 'SUCCESS' : 'FAILURE',
    });
  },

  /**
   * Log workflow events (approvals, signatures, etc.)
   */
  logWorkflowEvent(
    eventType: AuditEventType,
    transactionId: string,
    documentId: string,
    actor: { id: string; role: string },
    details?: Record<string, any>
  ): void {
    this.log({
      eventType,
      actor,
      resource: {
        type: 'workflow',
        id: `${transactionId}/${documentId}`,
      },
      action: `Workflow: ${eventType.replace(/_/g, ' ').toLowerCase()}`,
      details: {
        transactionId,
        documentId,
        ...details,
      },
      result: 'SUCCESS',
    });
  },

  /**
   * Log errors with full context
   */
  logError(
    error: Error,
    context: {
      actor?: { id: string; role: string };
      operation: string;
      resourceType?: string;
      resourceId?: string;
    }
  ): void {
    auditLogger.error(context.operation, {
      eventType: AuditEventType.ERROR_OCCURRED,
      actor: context.actor || { id: 'system', role: 'system' },
      resource: context.resourceType
        ? { type: context.resourceType, id: context.resourceId || 'unknown' }
        : undefined,
      action: context.operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      result: 'FAILURE',
      timestamp: new Date(),
    });
  },

  /**
   * Generate a correlation ID for tracking related events
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Query audit logs (simplified - in production, use a database)
   */
  async queryLogs(options: {
    eventType?: AuditEventType;
    actorId?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    // In production, this would query a database or log aggregation service
    // For now, read from the audit log file
    const logPath = path.join(logsDir, 'audit.log');

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let entries = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Apply filters
    if (options.eventType) {
      entries = entries.filter((e) => e.eventType === options.eventType);
    }
    if (options.actorId) {
      entries = entries.filter((e) => e.actor?.id === options.actorId);
    }
    if (options.resourceId) {
      entries = entries.filter((e) => e.resource?.id === options.resourceId);
    }
    if (options.startDate) {
      entries = entries.filter((e) => new Date(e.timestamp) >= options.startDate!);
    }
    if (options.endDate) {
      entries = entries.filter((e) => new Date(e.timestamp) <= options.endDate!);
    }

    // Sort by timestamp descending and limit
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  },

  /**
   * Get compliance report for a specific transaction
   */
  async getTransactionAuditTrail(transactionId: string): Promise<any[]> {
    return this.queryLogs({
      resourceId: transactionId,
    });
  },

  /**
   * Export audit logs for compliance review
   */
  async exportAuditReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const entries = await this.queryLogs({ startDate, endDate });

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    // CSV format
    if (entries.length === 0) return '';

    const headers = ['timestamp', 'eventType', 'actorId', 'actorRole', 'action', 'resourceType', 'resourceId', 'result'];
    const rows = entries.map((e) => [
      e.timestamp,
      e.eventType,
      e.actor?.id,
      e.actor?.role,
      e.action,
      e.resource?.type,
      e.resource?.id,
      e.result,
    ].map((v) => `"${v || ''}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  },
};

export default AuditLogger;
