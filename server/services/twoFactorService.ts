/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA for Master Admin accounts
 */

import { getDb } from "../db";
import { twoFactorAuth, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/encryption";
import * as crypto from "crypto";

// TOTP Configuration
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "sha1";

/**
 * Generate a random secret for TOTP
 */
export function generateSecret(): string {
  // Generate 20 random bytes and encode as base32
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Base32 encoding for TOTP secrets
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

/**
 * Base32 decoding for TOTP secrets
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  
  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(output);
}

/**
 * Generate TOTP code for a given secret and time
 */
function generateTOTP(secret: string, time?: number): string {
  const currentTime = time || Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / TOTP_PERIOD);
  
  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  
  // Decode secret from base32
  const secretBuffer = base32Decode(secret);
  
  // Generate HMAC
  const hmac = crypto.createHmac(TOTP_ALGORITHM, secretBuffer);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = 
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  // Generate OTP
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Verify TOTP code with time window tolerance
 */
export function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Check codes within the time window
  for (let i = -window; i <= window; i++) {
    const time = currentTime + (i * TOTP_PERIOD);
    const expectedCode = generateTOTP(secret, time);
    
    if (code === expectedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Generate QR code URL for authenticator apps
 */
export function generateQRCodeUrl(secret: string, email: string, issuer: string = "SmallClubManager"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(userId: number): Promise<{ secret: string; backupCodes: string[]; qrUrl: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) throw new Error("User not found");
  
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  const qrUrl = generateQRCodeUrl(secret, user[0].email || `user-${userId}`);
  
  // Encrypt sensitive data
  const encryptedSecret = encrypt(secret);
  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));
  
  // Check if 2FA record exists
  const existing = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(twoFactorAuth)
      .set({
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        isEnabled: false, // Not enabled until verified
      })
      .where(eq(twoFactorAuth.userId, userId));
  } else {
    await db.insert(twoFactorAuth).values({
      userId,
      secret: encryptedSecret,
      backupCodes: encryptedBackupCodes,
      isEnabled: false,
    });
  }
  
  return { secret, backupCodes, qrUrl };
}

/**
 * Verify and activate 2FA
 */
export async function verify2FA(userId: number, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const record = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  if (!record.length) throw new Error("2FA not set up");
  
  const secret = decrypt(record[0].secret);
  
  if (verifyTOTP(secret, code)) {
    await db.update(twoFactorAuth)
      .set({ isEnabled: true, lastUsedAt: new Date() })
      .where(eq(twoFactorAuth.userId, userId));
    return true;
  }
  
  return false;
}

/**
 * Verify 2FA code for login
 */
export async function verify2FALogin(userId: number, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const record = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  if (!record.length || !record[0].isEnabled) return true; // 2FA not enabled, allow login
  
  const secret = decrypt(record[0].secret);
  
  // Try TOTP code first
  if (verifyTOTP(secret, code)) {
    await db.update(twoFactorAuth)
      .set({ lastUsedAt: new Date() })
      .where(eq(twoFactorAuth.userId, userId));
    return true;
  }
  
  // Try backup codes
  if (record[0].backupCodes) {
    const backupCodes: string[] = JSON.parse(decrypt(record[0].backupCodes));
    const codeIndex = backupCodes.indexOf(code.toUpperCase());
    
    if (codeIndex !== -1) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await db.update(twoFactorAuth)
        .set({
          backupCodes: encrypt(JSON.stringify(backupCodes)),
          lastUsedAt: new Date(),
        })
        .where(eq(twoFactorAuth.userId, userId));
      return true;
    }
  }
  
  return false;
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
}

/**
 * Check if 2FA is enabled for a user
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const record = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  return record.length > 0 && record[0].isEnabled;
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const record = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  if (!record.length || !record[0].backupCodes) return 0;
  
  const backupCodes: string[] = JSON.parse(decrypt(record[0].backupCodes));
  return backupCodes.length;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const backupCodes = generateBackupCodes();
  const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));
  
  await db.update(twoFactorAuth)
    .set({ backupCodes: encryptedBackupCodes })
    .where(eq(twoFactorAuth.userId, userId));
  
  return backupCodes;
}
