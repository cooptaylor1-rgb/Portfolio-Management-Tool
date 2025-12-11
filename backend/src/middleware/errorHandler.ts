import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * Global error handler for Fastify
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;

  // Log error
  request.log.error({
    err: error,
    requestId,
    url: request.url,
    method: request.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this data already exists',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (prismaError.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle rate limit errors
  if ((error as FastifyError).statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Default to 500 for unknown errors
  const statusCode = (error as FastifyError).statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  return reply.status(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
