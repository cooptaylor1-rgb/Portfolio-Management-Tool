import { FastifyRequest } from 'fastify';

/**
 * Request logger hook
 */
export async function requestLogger(request: FastifyRequest) {
  request.log.info({
    requestId: request.id,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });
}
