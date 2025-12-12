import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { createTokens, verifyRefreshToken, revokeRefreshToken } from '../services/token.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(config.security.passwordMinLength),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Create a new user account
   */
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'USER_EXISTS', 'A user with this email already exists');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        passwordHash,
        emailVerifyToken: nanoid(32),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await createTokens(user.id, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // TODO: Send verification email

    return reply.status(201).send({
      success: true,
      data: {
        user,
        ...tokens,
      },
    });
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return tokens
   */
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(
        423,
        'ACCOUNT_LOCKED',
        `Account is locked. Try again in ${minutesLeft} minutes.`
      );
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, body.password);

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };

      // Lock account if too many attempts
      if (failedAttempts >= config.security.maxLoginAttempts) {
        updates.lockedUntil = new Date(Date.now() + config.security.lockoutDuration);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const tokens = await createTokens(user.id, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          mfaEnabled: user.mfaEnabled,
        },
        ...tokens,
      },
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.parse(request.body);

    const { userId, tokenId } = await verifyRefreshToken(body.refreshToken);

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(tokenId);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'INVALID_TOKEN', 'User not found');
    }

    // Generate new tokens
    const tokens = await createTokens(user.id, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    return reply.send({
      success: true,
      data: {
        user,
        ...tokens,
      },
    });
  });

  /**
   * POST /api/auth/logout
   * Invalidate refresh token
   */
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.parse(request.body);

    try {
      const { tokenId } = await verifyRefreshToken(body.refreshToken);
      await revokeRefreshToken(tokenId);
    } catch {
      // Ignore errors - token might already be invalid
    }

    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          mfaEnabled: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      return reply.send({
        success: true,
        data: { user },
      });
    }
  );

  /**
   * GET /api/auth/sessions
   * List active sessions
   */
  app.get(
    '/sessions',
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          deviceInfo: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: { sessions },
      });
    }
  );

  /**
   * DELETE /api/auth/sessions/:id
   * Revoke a specific session
   */
  app.delete(
    '/sessions/:id',
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;
      const sessionId = (request.params as any).id as string;

      const session = await prisma.refreshToken.findFirst({
        where: {
          id: sessionId,
          userId,
          revokedAt: null,
        },
      });

      if (!session) {
        throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
      }

      await prisma.refreshToken.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });

      return reply.send({
        success: true,
        data: { message: 'Session revoked' },
      });
    }
  );
}
