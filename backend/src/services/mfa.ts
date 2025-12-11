/**
 * MFA (Multi-Factor Authentication) Service
 * 
 * Implements TOTP (Time-based One-Time Password) using RFC 6238.
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

// Configure TOTP settings
authenticator.options = {
  digits: 6,
  step: 30, // 30 second window
  window: 1, // Allow 1 step before/after for clock drift
};

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const APP_NAME = 'Portfolio Manager';

interface MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface MfaVerifyResult {
  valid: boolean;
  usedBackupCode?: boolean;
}

/**
 * Generate a new MFA secret for a user
 */
export function generateMfaSecret(email: string): MfaSetupResult {
  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate QR code URL for authenticator apps
  const qrCodeUrl = authenticator.keyuri(email, APP_NAME, secret);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Generate backup codes for account recovery
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  );
}

/**
 * Verify a TOTP code
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Verify a backup code and mark it as used
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const normalizedCode = code.replace('-', '').toUpperCase();
  const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

  // Find and use the backup code
  const backupCode = await prisma.mfaBackupCode.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
    },
  });

  if (!backupCode) {
    return false;
  }

  // Mark as used
  await prisma.mfaBackupCode.update({
    where: { id: backupCode.id },
    data: { usedAt: new Date() },
  });

  return true;
}

/**
 * Enable MFA for a user
 */
export async function enableMfa(
  userId: string,
  secret: string,
  backupCodes: string[],
  verificationCode: string
): Promise<void> {
  // Verify the code first
  if (!verifyTotpCode(secret, verificationCode)) {
    throw new ApiError(400, 'INVALID_MFA_CODE', 'Invalid verification code');
  }

  // Hash backup codes
  const hashedCodes = hashBackupCodes(backupCodes);

  // Update user and create backup codes in a transaction
  await prisma.$transaction(async (tx) => {
    // Update user
    await tx.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaEnabled: true,
      },
    });

    // Delete any existing backup codes
    await tx.mfaBackupCode.deleteMany({
      where: { userId },
    });

    // Create new backup codes
    await tx.mfaBackupCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        userId,
        codeHash,
      })),
    });
  });
}

/**
 * Disable MFA for a user
 */
export async function disableMfa(userId: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(400, 'MFA_NOT_ENABLED', 'MFA is not enabled for this account');
  }

  // Verify code
  if (!verifyTotpCode(user.mfaSecret, code)) {
    throw new ApiError(400, 'INVALID_MFA_CODE', 'Invalid verification code');
  }

  // Disable MFA
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        mfaSecret: null,
        mfaEnabled: false,
      },
    });

    await tx.mfaBackupCode.deleteMany({
      where: { userId },
    });
  });
}

/**
 * Verify MFA during login
 */
export async function verifyMfa(userId: string, code: string): Promise<MfaVerifyResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true },
  });

  if (!user || !user.mfaSecret) {
    throw new ApiError(400, 'MFA_NOT_ENABLED', 'MFA is not enabled for this account');
  }

  // Try TOTP code first
  if (verifyTotpCode(user.mfaSecret, code)) {
    return { valid: true, usedBackupCode: false };
  }

  // Try backup code
  const backupCodeValid = await verifyBackupCode(userId, code);
  if (backupCodeValid) {
    return { valid: true, usedBackupCode: true };
  }

  return { valid: false };
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(400, 'MFA_NOT_ENABLED', 'MFA is not enabled for this account');
  }

  // Verify code
  if (!verifyTotpCode(user.mfaSecret, code)) {
    throw new ApiError(400, 'INVALID_MFA_CODE', 'Invalid verification code');
  }

  // Generate new backup codes
  const newCodes = generateBackupCodes();
  const hashedCodes = hashBackupCodes(newCodes);

  // Replace existing codes
  await prisma.$transaction(async (tx) => {
    await tx.mfaBackupCode.deleteMany({
      where: { userId },
    });

    await tx.mfaBackupCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        userId,
        codeHash,
      })),
    });
  });

  return newCodes;
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodesCount(userId: string): Promise<number> {
  return prisma.mfaBackupCode.count({
    where: {
      userId,
      usedAt: null,
    },
  });
}

/**
 * Generate a QR code data URL for display
 */
export async function generateQrCodeDataUrl(qrCodeUrl: string): Promise<string> {
  // In production, use a library like 'qrcode' to generate actual QR code
  // For now, return the URL that can be used with a QR code generator
  // npm install qrcode
  // import QRCode from 'qrcode';
  // return QRCode.toDataURL(qrCodeUrl);
  
  // Return a placeholder that indicates the URL
  return `otpauth-url:${qrCodeUrl}`;
}
