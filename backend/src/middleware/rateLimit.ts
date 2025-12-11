/**
 * Advanced Rate Limiting Middleware
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-IP rate limiting
 * - Endpoint-specific limits
 * - Sliding window algorithm
 * - Redis-backed for distributed systems
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';
import { ApiError } from './errorHandler.js';

// Rate limit configurations by tier
export const RATE_LIMIT_TIERS = {
  // Anonymous/IP-based limits
  anonymous: {
    requests: 60,
    window: 60, // 1 minute
  },
  // Authenticated user limits
  authenticated: {
    requests: 200,
    window: 60,
  },
  // Premium user limits
  premium: {
    requests: 1000,
    window: 60,
  },
} as const;

// Endpoint-specific limits (stricter for sensitive endpoints)
export const ENDPOINT_LIMITS: Record<string, { requests: number; window: number }> = {
  // Auth endpoints - very strict to prevent brute force
  'POST:/api/auth/login': { requests: 5, window: 300 }, // 5 per 5 minutes
  'POST:/api/auth/register': { requests: 3, window: 300 }, // 3 per 5 minutes
  'POST:/api/auth/forgot-password': { requests: 3, window: 300 },
  'POST:/api/auth/mfa/verify': { requests: 10, window: 300 },
  
  // Market data - moderate limits
  'GET:/api/market/quote/*': { requests: 120, window: 60 },
  'POST:/api/market/quotes': { requests: 30, window: 60 },
  'WS:/api/market/stream': { requests: 5, window: 60 }, // Connection limit
  
  // Analytics - heavier operations
  'POST:/api/analytics/*/scenario': { requests: 10, window: 60 },
  'GET:/api/analytics/*': { requests: 60, window: 60 },
  
  // Portfolios - standard limits
  'POST:/api/portfolios': { requests: 20, window: 60 },
  'POST:/api/portfolios/*/investments': { requests: 50, window: 60 },
};

interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Get rate limit key based on request
 */
function getRateLimitKey(request: FastifyRequest): { key: string; tier: keyof typeof RATE_LIMIT_TIERS } {
  const userId = (request as any).user?.id;
  const ip = request.ip;
  
  if (userId) {
    // Check if user has premium tier (would come from user record)
    const isPremium = false; // TODO: Check user subscription
    return {
      key: `ratelimit:user:${userId}`,
      tier: isPremium ? 'premium' : 'authenticated',
    };
  }
  
  return {
    key: `ratelimit:ip:${ip}`,
    tier: 'anonymous',
  };
}

/**
 * Get endpoint-specific limit key
 */
function getEndpointKey(request: FastifyRequest): string | null {
  const method = request.method;
  const url = request.url.split('?')[0]; // Remove query params
  
  // Try exact match first
  const exactKey = `${method}:${url}`;
  if (ENDPOINT_LIMITS[exactKey]) {
    return exactKey;
  }
  
  // Try wildcard matches
  for (const pattern of Object.keys(ENDPOINT_LIMITS)) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
      if (regex.test(exactKey)) {
        return pattern;
      }
    }
  }
  
  return null;
}

/**
 * Check rate limit using sliding window algorithm
 */
async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitInfo> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const windowKey = `${key}:window`;
  
  // Use Redis sorted set for sliding window
  const multi = redis.multi();
  
  // Remove old entries
  multi.zremrangebyscore(windowKey, 0, windowStart);
  
  // Add current request
  multi.zadd(windowKey, now, `${now}-${Math.random()}`);
  
  // Count requests in window
  multi.zcard(windowKey);
  
  // Set TTL on the key
  multi.expire(windowKey, windowSeconds);
  
  const results = await multi.exec();
  const requestCount = results?.[2]?.[1] as number || 0;
  
  const remaining = Math.max(0, maxRequests - requestCount);
  const reset = Math.ceil((windowStart + windowSeconds * 1000) / 1000);
  
  if (requestCount > maxRequests) {
    // Get oldest request timestamp to calculate retry-after
    const oldest = await redis.zrange(windowKey, 0, 0, 'WITHSCORES');
    const oldestTime = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    const retryAfter = Math.ceil((oldestTime + windowSeconds * 1000 - now) / 1000);
    
    return {
      remaining: 0,
      limit: maxRequests,
      reset,
      retryAfter: Math.max(1, retryAfter),
    };
  }
  
  return {
    remaining,
    limit: maxRequests,
    reset,
  };
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting for health checks
    if (request.url === '/health') {
      return;
    }
    
    const { key: userKey, tier } = getRateLimitKey(request);
    const tierConfig = RATE_LIMIT_TIERS[tier];
    
    // Check user/IP rate limit
    const userLimit = await checkRateLimit(
      userKey,
      tierConfig.requests,
      tierConfig.window
    );
    
    // Set headers
    reply.header('X-RateLimit-Limit', userLimit.limit);
    reply.header('X-RateLimit-Remaining', userLimit.remaining);
    reply.header('X-RateLimit-Reset', userLimit.reset);
    
    if (userLimit.retryAfter) {
      reply.header('Retry-After', userLimit.retryAfter);
      throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', `Too many requests. Please try again in ${userLimit.retryAfter} seconds.`);
    }
    
    // Check endpoint-specific limit
    const endpointPattern = getEndpointKey(request);
    if (endpointPattern) {
      const endpointConfig = ENDPOINT_LIMITS[endpointPattern];
      const endpointKey = `${userKey}:endpoint:${endpointPattern.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const endpointLimit = await checkRateLimit(
        endpointKey,
        endpointConfig.requests,
        endpointConfig.window
      );
      
      // Use the more restrictive limit for headers
      if (endpointLimit.remaining < userLimit.remaining) {
        reply.header('X-RateLimit-Remaining', endpointLimit.remaining);
      }
      
      if (endpointLimit.retryAfter) {
        reply.header('Retry-After', endpointLimit.retryAfter);
        throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', `Too many requests to this endpoint. Please try again in ${endpointLimit.retryAfter} seconds.`);
      }
    }
  };
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(userId: string): Promise<{
  tier: string;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const key = `ratelimit:user:${userId}:window`;
  const tierConfig = RATE_LIMIT_TIERS.authenticated;
  
  const now = Date.now();
  const windowStart = now - tierConfig.window * 1000;
  
  // Count current requests
  const count = await redis.zcount(key, windowStart, now);
  
  return {
    tier: 'authenticated',
    limit: tierConfig.requests,
    remaining: Math.max(0, tierConfig.requests - count),
    reset: Math.ceil((now + tierConfig.window * 1000) / 1000),
  };
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(userId: string): Promise<void> {
  const pattern = `ratelimit:user:${userId}*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Block an IP address
 */
export async function blockIP(ip: string, durationSeconds: number, reason: string): Promise<void> {
  const key = `blocked:ip:${ip}`;
  await redis.setex(key, durationSeconds, JSON.stringify({ reason, blockedAt: Date.now() }));
}

/**
 * Check if an IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  const key = `blocked:ip:${ip}`;
  const data = await redis.get(key);
  
  if (!data) {
    return { blocked: false };
  }
  
  try {
    const parsed = JSON.parse(data);
    return { blocked: true, reason: parsed.reason };
  } catch {
    return { blocked: true };
  }
}

/**
 * IP blocking middleware
 */
export async function checkIPBlock(request: FastifyRequest, reply: FastifyReply) {
  const { blocked, reason } = await isIPBlocked(request.ip);
  
  if (blocked) {
    throw new ApiError(403, 'IP_BLOCKED', reason || 'Your IP address has been blocked');
  }
}
