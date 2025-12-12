/**
 * GraphQL Server Setup
 * 
 * Integrates Mercurius (FastifyGraphQL) with the Fastify server.
 * Mercurius is the fastest GraphQL adapter for Node.js.
 */

import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { verifyAccessToken } from '../services/token.js';

/**
 * Register GraphQL server with Fastify
 */
export async function registerGraphQL(app: FastifyInstance) {
  // Register Mercurius GraphQL
  await app.register(mercurius as any, {
    schema: typeDefs,
    resolvers: resolvers as any,
    graphiql: process.env.NODE_ENV !== 'production',
    path: '/graphql',
    
    // Context builder - runs for each request
    context: async (request: any, reply: any) => {
      let user = null;

      // Extract and verify JWT token
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = verifyAccessToken(token);
          user = decoded;
        } catch {
          // Token invalid or expired - user remains null
        }
      }

      return { user, req: request, reply };
    },

    // Error formatter
    errorFormatter: (execution: any, context: any) => {
      const errors = execution.errors?.map((error: any) => {
        // Don't expose internal errors in production
        if (process.env.NODE_ENV === 'production') {
          const code = error.extensions?.code;
          if (!code || code === 'INTERNAL_SERVER_ERROR') {
            return {
              message: 'An unexpected error occurred',
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            };
          }
        }
        return error;
      });

      return {
        statusCode: execution.errors?.[0]?.extensions?.code === 'UNAUTHENTICATED' ? 401 : 200,
        response: {
          data: execution.data,
          errors,
        },
      };
    },

    // Query depth limiting for security
    queryDepth: 10,

    // JIT compilation for better performance
    jit: 1,
  } as any);

  app.log.info('GraphQL server registered at /graphql');
}

/**
 * GraphQL loader for DataLoader pattern (N+1 prevention)
 */
export function createLoaders(prisma: any) {
  return {
    // User loader
    User: {
      loader: async (ids: string[]) => {
        const users = await prisma.user.findMany({
          where: { id: { in: ids } },
        });
        const userMap = new Map(users.map((u: any) => [u.id, u]));
        return ids.map((id) => userMap.get(id) || null);
      },
    },

    // Portfolio loader
    Portfolio: {
      loader: async (ids: string[]) => {
        const portfolios = await prisma.portfolio.findMany({
          where: { id: { in: ids } },
        });
        const portfolioMap = new Map(portfolios.map((p: any) => [p.id, p]));
        return ids.map((id) => portfolioMap.get(id) || null);
      },
    },

    // Investment loader
    Investment: {
      loader: async (ids: string[]) => {
        const investments = await prisma.investment.findMany({
          where: { id: { in: ids } },
        });
        const investmentMap = new Map(investments.map((i: any) => [i.id, i]));
        return ids.map((id) => investmentMap.get(id) || null);
      },
    },

    // Investments by portfolio loader
    InvestmentsByPortfolio: {
      loader: async (portfolioIds: string[]) => {
        const investments = await prisma.investment.findMany({
          where: { portfolioId: { in: portfolioIds } },
        });
        const grouped = new Map<string, any[]>();
        investments.forEach((inv: any) => {
          const list = grouped.get(inv.portfolioId) || [];
          list.push(inv);
          grouped.set(inv.portfolioId, list);
        });
        return portfolioIds.map((id) => grouped.get(id) || []);
      },
    },
  };
}
