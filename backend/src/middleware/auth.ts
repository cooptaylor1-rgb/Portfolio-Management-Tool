import { FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccessToken } from '../services/token.js';
import { ApiError } from './errorHandler.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Authentication decorator plugin
 */
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, 'MISSING_TOKEN', 'Authorization header is required');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'INVALID_AUTH_SCHEME', 'Authorization must use Bearer scheme');
    }

    try {
      const payload = verifyAccessToken(token);
      request.user = { id: payload.userId };
    } catch (error) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired access token');
    }
  });
}

export default fp(authPlugin, {
  name: 'auth-plugin',
});
