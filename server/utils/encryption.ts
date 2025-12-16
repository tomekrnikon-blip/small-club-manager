import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * Falls back to JWT_SECRET if ENCRYPTION_KEY not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  if (!key) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for encryption');
  }
  // Derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt sensitive data (API keys, tokens, passwords)
 * Returns base64 encoded string: salt:iv:tag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive unique key for this encryption using salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt:iv:tag:encrypted
  return `${salt.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * Expects base64 encoded string: salt:iv:tag:encrypted
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  
  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    // Not encrypted, return as-is (for backward compatibility)
    return ciphertext;
  }
  
  const [saltB64, ivB64, tagB64, encrypted] = parts;
  
  const key = getEncryptionKey();
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  
  // Derive the same key using salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a string is already encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 4;
}

/**
 * Encrypt if not already encrypted
 */
export function encryptIfNeeded(value: string): string {
  if (!value || isEncrypted(value)) return value;
  return encrypt(value);
}

/**
 * Hash sensitive data (one-way, for comparison)
 * Uses bcrypt-like approach with salt
 */
export function hashSensitive(value: string): string {
  if (!value) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(value, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify hashed value
 */
export function verifyHash(value: string, hashedValue: string): boolean {
  if (!value || !hashedValue) return false;
  const [salt, originalHash] = hashedValue.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(value, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

/**
 * Mask sensitive data for display (show only last 4 chars)
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) return '****';
  return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}

/**
 * Sanitize email for logging (show only domain)
 */
export function sanitizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [, domain] = email.split('@');
  return `***@${domain}`;
}

/**
 * Sanitize phone number for logging
 */
export function sanitizePhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}
