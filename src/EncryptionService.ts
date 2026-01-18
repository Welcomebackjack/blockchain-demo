import * as jose from 'node-jose';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuditLogger, AuditEventType } from './AuditLogger';

// Key storage directory
const keysDir = path.join(process.cwd(), '.keys');

export interface KeyPair {
  id: string;
  publicKey: jose.JWK.Key;
  privateKey?: jose.JWK.Key;
  algorithm: string;
  purpose: 'encryption' | 'signing';
  createdAt: Date;
  expiresAt?: Date;
}

export interface EncryptedPayload {
  ciphertext: string;
  keyId: string;
  algorithm: string;
  iv?: string;
  tag?: string;
}

export interface SignedPayload {
  data: string;
  signature: string;
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export interface DocumentIntegrity {
  hash: string;
  algorithm: string;
  timestamp: Date;
  signature?: string;
  keyId?: string;
}

// In-memory keystore (in production, use HSM or secure key vault)
let keystore: jose.JWK.KeyStore;

export const EncryptionService = {
  /**
   * Initialize the encryption service and load/create keystore
   */
  async initialize(): Promise<void> {
    await fs.mkdir(keysDir, { recursive: true });

    const keystorePath = path.join(keysDir, 'keystore.json');

    try {
      const keystoreData = await fs.readFile(keystorePath, 'utf-8');
      keystore = await jose.JWK.asKeyStore(JSON.parse(keystoreData));

      AuditLogger.logSecurityEvent(
        AuditEventType.SYSTEM_START,
        { id: 'system', role: 'system' },
        'Keystore loaded',
        { keyCount: keystore.all().length }
      );
    } catch {
      // Create new keystore if doesn't exist
      keystore = jose.JWK.createKeyStore();

      // Generate default keys
      await this.generateEncryptionKey('default-encryption');
      await this.generateSigningKey('default-signing');

      await this.saveKeystore();

      AuditLogger.logSecurityEvent(
        AuditEventType.KEY_GENERATED,
        { id: 'system', role: 'system' },
        'New keystore created with default keys'
      );
    }
  },

  /**
   * Save keystore to disk (in production, use secure storage)
   */
  async saveKeystore(): Promise<void> {
    const keystorePath = path.join(keysDir, 'keystore.json');
    await fs.writeFile(keystorePath, JSON.stringify(keystore.toJSON(true), null, 2));
  },

  /**
   * Generate a new RSA key pair for encryption
   */
  async generateEncryptionKey(keyId: string): Promise<jose.JWK.Key> {
    const key = await keystore.generate('RSA', 2048, {
      kid: keyId,
      use: 'enc',
      alg: 'RSA-OAEP-256',
    });

    await this.saveKeystore();

    AuditLogger.logSecurityEvent(
      AuditEventType.KEY_GENERATED,
      { id: 'system', role: 'system' },
      'Encryption key generated',
      { keyId, algorithm: 'RSA-OAEP-256' }
    );

    return key;
  },

  /**
   * Generate a new RSA key pair for signing
   */
  async generateSigningKey(keyId: string): Promise<jose.JWK.Key> {
    const key = await keystore.generate('RSA', 2048, {
      kid: keyId,
      use: 'sig',
      alg: 'RS256',
    });

    await this.saveKeystore();

    AuditLogger.logSecurityEvent(
      AuditEventType.KEY_GENERATED,
      { id: 'system', role: 'system' },
      'Signing key generated',
      { keyId, algorithm: 'RS256' }
    );

    return key;
  },

  /**
   * Generate a symmetric key for AES encryption
   */
  async generateSymmetricKey(keyId: string): Promise<jose.JWK.Key> {
    const key = await keystore.generate('oct', 256, {
      kid: keyId,
      use: 'enc',
      alg: 'A256GCM',
    });

    await this.saveKeystore();

    AuditLogger.logSecurityEvent(
      AuditEventType.KEY_GENERATED,
      { id: 'system', role: 'system' },
      'Symmetric key generated',
      { keyId, algorithm: 'A256GCM' }
    );

    return key;
  },

  /**
   * Get a key by ID
   */
  getKey(keyId: string): jose.JWK.Key | undefined {
    return keystore.get(keyId);
  },

  /**
   * List all key IDs
   */
  listKeys(): Array<{ id: string; use: string; alg: string }> {
    return keystore.all().map((key) => ({
      id: key.kid,
      use: key.use || 'unknown',
      alg: key.alg || 'unknown',
    }));
  },

  /**
   * Encrypt data using JWE (JSON Web Encryption)
   */
  async encrypt(
    plaintext: string | Buffer,
    keyId: string = 'default-encryption',
    actor?: { id: string; role: string }
  ): Promise<string> {
    const key = keystore.get(keyId);
    if (!key) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    const input = typeof plaintext === 'string' ? plaintext : plaintext.toString('base64');

    const jwe = await jose.JWE.createEncrypt(
      { format: 'compact', contentAlg: 'A256GCM' },
      key
    )
      .update(input)
      .final();

    AuditLogger.logSecurityEvent(
      AuditEventType.ENCRYPTION_PERFORMED,
      actor || { id: 'system', role: 'system' },
      'Data encrypted',
      { keyId, algorithm: 'RSA-OAEP-256/A256GCM' }
    );

    return jwe;
  },

  /**
   * Decrypt JWE data
   */
  async decrypt(
    ciphertext: string,
    actor?: { id: string; role: string }
  ): Promise<string> {
    const result = await jose.JWE.createDecrypt(keystore).decrypt(ciphertext);

    // Extract key ID from header for logging
    const parts = ciphertext.split('.');
    let keyId = 'unknown';
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      keyId = header.kid || 'unknown';
    } catch { /* ignore */ }

    AuditLogger.logSecurityEvent(
      AuditEventType.DECRYPTION_PERFORMED,
      actor || { id: 'system', role: 'system' },
      'Data decrypted',
      { keyId }
    );

    return result.plaintext.toString('utf-8');
  },

  /**
   * Sign data using JWS (JSON Web Signature)
   */
  async sign(
    data: string | object,
    keyId: string = 'default-signing',
    actor?: { id: string; role: string }
  ): Promise<string> {
    const key = keystore.get(keyId);
    if (!key) {
      throw new Error(`Signing key not found: ${keyId}`);
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    const jwsResult = await jose.JWS.createSign(
      { format: 'compact' },
      key
    )
      .update(payload)
      .final();

    // Extract compact serialization string
    const jws = typeof jwsResult === 'string' ? jwsResult : (jwsResult as any).toString();

    AuditLogger.logSecurityEvent(
      AuditEventType.SIGNATURE_APPLIED,
      actor || { id: 'system', role: 'system' },
      'Data signed',
      { keyId, algorithm: 'RS256' }
    );

    return jws;
  },

  /**
   * Verify a JWS signature and return the payload
   */
  async verify(
    jws: string,
    actor?: { id: string; role: string }
  ): Promise<{ valid: boolean; payload?: string; keyId?: string }> {
    try {
      const result = await jose.JWS.createVerify(keystore).verify(jws);

      AuditLogger.logSecurityEvent(
        AuditEventType.SIGNATURE_VERIFIED,
        actor || { id: 'system', role: 'system' },
        'Signature verified',
        { keyId: result.key.kid, valid: true }
      );

      return {
        valid: true,
        payload: result.payload.toString('utf-8'),
        keyId: result.key.kid,
      };
    } catch (error) {
      AuditLogger.logSecurityEvent(
        AuditEventType.SIGNATURE_INVALID,
        actor || { id: 'system', role: 'system' },
        'Signature verification failed',
        { error: (error as Error).message },
        'FAILURE'
      );

      return { valid: false };
    }
  },

  /**
   * Create a hash of document content for integrity verification
   */
  hashDocument(content: string | Buffer, algorithm: string = 'sha256'): string {
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  },

  /**
   * Create a signed document integrity record
   */
  async createIntegrityRecord(
    content: string | Buffer,
    keyId: string = 'default-signing',
    actor?: { id: string; role: string }
  ): Promise<DocumentIntegrity> {
    const hash = this.hashDocument(content);
    const timestamp = new Date();

    const dataToSign = JSON.stringify({
      hash,
      algorithm: 'sha256',
      timestamp: timestamp.toISOString(),
    });

    const signature = await this.sign(dataToSign, keyId, actor);

    return {
      hash,
      algorithm: 'sha256',
      timestamp,
      signature,
      keyId,
    };
  },

  /**
   * Verify document integrity against a record
   */
  async verifyIntegrity(
    content: string | Buffer,
    record: DocumentIntegrity,
    actor?: { id: string; role: string }
  ): Promise<{ valid: boolean; hashMatch: boolean; signatureValid: boolean }> {
    // Verify hash
    const currentHash = this.hashDocument(content);
    const hashMatch = currentHash === record.hash;

    // Verify signature if present
    let signatureValid = true;
    if (record.signature) {
      const verifyResult = await this.verify(record.signature, actor);
      signatureValid = verifyResult.valid;

      if (verifyResult.valid && verifyResult.payload) {
        const signedData = JSON.parse(verifyResult.payload);
        // Ensure the signature was for this hash
        signatureValid = signedData.hash === record.hash;
      }
    }

    return {
      valid: hashMatch && signatureValid,
      hashMatch,
      signatureValid,
    };
  },

  /**
   * Encrypt a file and return the encrypted content
   */
  async encryptFile(
    filePath: string,
    keyId: string = 'default-encryption',
    actor?: { id: string; role: string }
  ): Promise<string> {
    const content = await fs.readFile(filePath);
    return this.encrypt(content.toString('base64'), keyId, actor);
  },

  /**
   * Decrypt and save a file
   */
  async decryptFile(
    encryptedContent: string,
    outputPath: string,
    actor?: { id: string; role: string }
  ): Promise<void> {
    const decrypted = await this.decrypt(encryptedContent, actor);
    const content = Buffer.from(decrypted, 'base64');
    await fs.writeFile(outputPath, content);
  },

  /**
   * Export public key for sharing
   */
  async exportPublicKey(keyId: string): Promise<object> {
    const key = keystore.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    return key.toJSON(false); // false = public key only
  },

  /**
   * Rotate a key (generate new, mark old as expired)
   */
  async rotateKey(
    oldKeyId: string,
    newKeyId: string,
    actor?: { id: string; role: string }
  ): Promise<jose.JWK.Key> {
    const oldKey = keystore.get(oldKeyId);
    if (!oldKey) {
      throw new Error(`Key not found: ${oldKeyId}`);
    }

    // Generate new key of same type
    let newKey: jose.JWK.Key;
    if (oldKey.use === 'enc') {
      newKey = await this.generateEncryptionKey(newKeyId);
    } else {
      newKey = await this.generateSigningKey(newKeyId);
    }

    AuditLogger.logSecurityEvent(
      AuditEventType.KEY_ROTATED,
      actor || { id: 'system', role: 'system' },
      'Key rotated',
      { oldKeyId, newKeyId, keyType: oldKey.use }
    );

    return newKey;
  },
};

export default EncryptionService;
