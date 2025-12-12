import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/users/search?q=...
   * Search users by name/email for collaboration sharing.
   */
  app.get(
    '/search',
    async (
      request: FastifyRequest<{ Querystring: { q?: string; limit?: string } }>,
      reply: FastifyReply
    ) => {
      const parsed = searchSchema.parse({
        q: request.query.q ?? '',
        limit: request.query.limit,
      });

      const limit = Math.min(parseInt(parsed.limit || '10', 10), 25);
      const q = parsed.q.toLowerCase();

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
      });

      return reply.send({
        success: true,
        data: { users },
      });
    }
  );
}
