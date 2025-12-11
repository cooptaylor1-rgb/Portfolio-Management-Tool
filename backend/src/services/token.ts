import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  tokenId?: string;
}

interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

/**
 * Create access and refresh tokens for a user
 */
export async function createTokens(userId: string, deviceInfo: DeviceInfo) {
  // Generate access token
  const accessToken = jwt.sign(
    { userId, type: 'access' } as TokenPayload,
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );

  // Generate refresh token
  const refreshTokenId = nanoid(32);
  const refreshToken = jwt.sign(
    { userId, type: 'refresh', tokenId: refreshTokenId } as TokenPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  // Hash refresh token for storage
  const tokenHash = await argon2.hash(refreshToken);

  // Calculate expiry
  const expiresAt = new Date();
  const days = parseInt(config.jwt.refreshExpiry.replace('d', ''), 10);
  expiresAt.setDate(expiresAt.getDate() + days);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId,
      tokenHash,
      deviceInfo: deviceInfo as any,
      ipAddress: deviceInfo.ip,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
  };
}

/**
 * Verify a refresh token and return the user ID
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string; tokenId: string }> {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

    if (payload.type !== 'refresh' || !payload.tokenId) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid refresh token');
    }

    // Find token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!storedToken) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Token not found');
    }

    if (storedToken.revokedAt) {
      throw new ApiError(401, 'TOKEN_REVOKED', 'Token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired');
    }

    // Verify token hash
    const isValid = await argon2.verify(storedToken.tokenHash, token);
    if (!isValid) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Token verification failed');
    }

    return {
      userId: payload.userId,
      tokenId: payload.tokenId,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

    if (payload.type !== 'access') {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid access token');
    }

    return payload;
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/**
 * Clean up expired tokens (run as a scheduled job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

  return result.count;
}
