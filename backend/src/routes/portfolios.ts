import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

const updatePortfolioSchema = createPortfolioSchema.partial();

const addInvestmentSchema = z.object({
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  type: z.enum(['STOCK', 'BOND', 'ETF', 'MUTUAL_FUND', 'CRYPTO', 'OTHER']),
  quantity: z.number().positive(),
  purchasePrice: z.number().positive(),
  purchaseDate: z.string().datetime(),
  sector: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

const sharePortfolioSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['VIEW', 'EDIT', 'ADMIN']),
});

export async function portfolioRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/portfolios/activity
   * List recent activity across all portfolios the user can access
   */
  app.get(
    '/activity',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);

      const activities = await prisma.portfolioActivity.findMany({
        where: {
          portfolio: {
            OR: [{ ownerId: userId }, { shares: { some: { userId } } }],
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          portfolio: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return reply.send({
        success: true,
        data: { activities },
      });
    }
  );

  /**
   * GET /api/portfolios
   * List user's portfolios (owned and shared)
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;

    const portfolios = await prisma.portfolio.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { shares: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { investments: true },
        },
        shares: {
          where: { userId },
          select: { permission: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform response
    const data = portfolios.map((p) => ({
      ...p,
      isOwner: p.ownerId === userId,
      permission: p.ownerId === userId ? 'OWNER' : p.shares[0]?.permission,
      investmentCount: p._count.investments,
      shares: undefined,
      _count: undefined,
    }));

    return reply.send({
      success: true,
      data: { portfolios: data },
    });
  });

  /**
   * POST /api/portfolios
   * Create a new portfolio
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;
    const body = createPortfolioSchema.parse(request.body);

    const portfolio = await prisma.portfolio.create({
      data: {
        ...body,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await prisma.portfolioActivity.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        action: 'CREATED',
        details: { name: portfolio.name },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return reply.status(201).send({
      success: true,
      data: { portfolio },
    });
  });

  /**
   * GET /api/portfolios/:id
   * Get portfolio details with investments
   */
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.user.id;
    const portfolioId = request.params.id;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        investments: {
          orderBy: { createdAt: 'desc' },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!portfolio) {
      throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
    }

    // Check access
    const hasAccess =
      portfolio.ownerId === userId ||
      portfolio.isPublic ||
      portfolio.shares.some((s) => s.userId === userId);

    if (!hasAccess) {
      throw new ApiError(403, 'ACCESS_DENIED', 'You do not have access to this portfolio');
    }

    // Determine user's permission level
    const permission =
      portfolio.ownerId === userId
        ? 'OWNER'
        : portfolio.shares.find((s) => s.userId === userId)?.permission || 'VIEW';

    return reply.send({
      success: true,
      data: {
        portfolio: {
          ...portfolio,
          permission,
          isOwner: portfolio.ownerId === userId,
        },
      },
    });
  });

  /**
   * PUT /api/portfolios/:id
   * Update portfolio details
   */
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.user.id;
    const portfolioId = request.params.id;
    const body = updatePortfolioSchema.parse(request.body);

    // Check ownership/edit permission
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        shares: {
          where: { userId },
        },
      },
    });

    if (!portfolio) {
      throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
    }

    const canEdit =
      portfolio.ownerId === userId ||
      portfolio.shares.some((s) => ['EDIT', 'ADMIN'].includes(s.permission));

    if (!canEdit) {
      throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to edit this portfolio');
    }

    const updated = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: body,
    });

    // Log activity
    await prisma.portfolioActivity.create({
      data: {
        portfolioId,
        userId,
        action: 'UPDATED',
        details: body,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return reply.send({
      success: true,
      data: { portfolio: updated },
    });
  });

  /**
   * DELETE /api/portfolios/:id
   * Delete a portfolio (owner only)
   */
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.user.id;
    const portfolioId = request.params.id;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
    }

    if (portfolio.ownerId !== userId) {
      throw new ApiError(403, 'ACCESS_DENIED', 'Only the owner can delete this portfolio');
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    return reply.send({
      success: true,
      data: { message: 'Portfolio deleted' },
    });
  });

  // ==================== INVESTMENTS ====================

  /**
   * POST /api/portfolios/:id/investments
   * Add an investment to portfolio
   */
  app.post(
    '/:id/investments',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const portfolioId = request.params.id;
      const body = addInvestmentSchema.parse(request.body);

      // Check edit permission
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: {
          shares: { where: { userId } },
        },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const canEdit =
        portfolio.ownerId === userId ||
        portfolio.shares.some((s) => ['EDIT', 'ADMIN'].includes(s.permission));

      if (!canEdit) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to add investments');
      }

      const investment = await prisma.investment.create({
        data: {
          portfolioId,
          symbol: body.symbol.toUpperCase(),
          name: body.name,
          type: body.type,
          quantity: body.quantity,
          purchasePrice: body.purchasePrice,
          purchaseDate: new Date(body.purchaseDate),
          sector: body.sector,
          notes: body.notes,
        },
      });

      // Log activity
      await prisma.portfolioActivity.create({
        data: {
          portfolioId,
          userId,
          action: 'INVESTMENT_ADDED',
          details: { symbol: investment.symbol, quantity: body.quantity },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.status(201).send({
        success: true,
        data: { investment },
      });
    }
  );

  /**
   * PUT /api/portfolios/:id/investments/:investmentId
   * Update an investment
   */
  app.put(
    '/:id/investments/:investmentId',
    async (
      request: FastifyRequest<{ Params: { id: string; investmentId: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { id: portfolioId, investmentId } = request.params;
      const body = addInvestmentSchema.partial().parse(request.body);

      // Check edit permission
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { shares: { where: { userId } } },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const canEdit =
        portfolio.ownerId === userId ||
        portfolio.shares.some((s) => ['EDIT', 'ADMIN'].includes(s.permission));

      if (!canEdit) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to edit investments');
      }

      const investment = await prisma.investment.update({
        where: { id: investmentId },
        data: {
          ...body,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        },
      });

      return reply.send({
        success: true,
        data: { investment },
      });
    }
  );

  /**
   * DELETE /api/portfolios/:id/investments/:investmentId
   * Remove an investment
   */
  app.delete(
    '/:id/investments/:investmentId',
    async (
      request: FastifyRequest<{ Params: { id: string; investmentId: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { id: portfolioId, investmentId } = request.params;

      // Check edit permission
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { shares: { where: { userId } } },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const canEdit =
        portfolio.ownerId === userId ||
        portfolio.shares.some((s) => ['EDIT', 'ADMIN'].includes(s.permission));

      if (!canEdit) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to remove investments');
      }

      const investment = await prisma.investment.delete({
        where: { id: investmentId },
      });

      // Log activity
      await prisma.portfolioActivity.create({
        data: {
          portfolioId,
          userId,
          action: 'INVESTMENT_REMOVED',
          details: { symbol: investment.symbol },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.send({
        success: true,
        data: { message: 'Investment removed' },
      });
    }
  );

  // ==================== SHARING ====================

  /**
   * POST /api/portfolios/:id/share
   * Share portfolio with another user
   */
  app.post(
    '/:id/share',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const portfolioId = request.params.id;
      const body = sharePortfolioSchema.parse(request.body);

      // Check ownership/admin permission
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { shares: { where: { userId } } },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const canShare =
        portfolio.ownerId === userId ||
        portfolio.shares.some((s) => s.permission === 'ADMIN');

      if (!canShare) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to share this portfolio');
      }

      // Find user to share with
      const targetUser = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });

      if (!targetUser) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      if (targetUser.id === portfolio.ownerId) {
        throw new ApiError(400, 'INVALID_OPERATION', 'Cannot share with the owner');
      }

      // Upsert share
      const share = await prisma.portfolioShare.upsert({
        where: {
          portfolioId_userId: {
            portfolioId,
            userId: targetUser.id,
          },
        },
        update: { permission: body.permission },
        create: {
          portfolioId,
          userId: targetUser.id,
          permission: body.permission,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Log activity
      await prisma.portfolioActivity.create({
        data: {
          portfolioId,
          userId,
          action: 'SHARED',
          details: { sharedWith: targetUser.email, permission: body.permission },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.send({
        success: true,
        data: { share },
      });
    }
  );

  /**
   * DELETE /api/portfolios/:id/share/:userId
   * Remove a user's access to a portfolio (owner/admin only)
   */
  app.delete(
    '/:id/share/:userId',
    async (
      request: FastifyRequest<{ Params: { id: string; userId: string } }>,
      reply: FastifyReply
    ) => {
      const actorId = request.user.id;
      const portfolioId = request.params.id;
      const targetUserId = request.params.userId;

      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { shares: { where: { userId: actorId } } },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const canManageShares =
        portfolio.ownerId === actorId || portfolio.shares.some((s) => s.permission === 'ADMIN');

      if (!canManageShares) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to manage sharing');
      }

      if (targetUserId === portfolio.ownerId) {
        throw new ApiError(400, 'INVALID_OPERATION', 'Cannot remove the owner');
      }

      const existing = await prisma.portfolioShare.findUnique({
        where: { portfolioId_userId: { portfolioId, userId: targetUserId } },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!existing) {
        throw new ApiError(404, 'SHARE_NOT_FOUND', 'Share not found');
      }

      await prisma.portfolioShare.delete({
        where: { portfolioId_userId: { portfolioId, userId: targetUserId } },
      });

      await prisma.portfolioActivity.create({
        data: {
          portfolioId,
          userId: actorId,
          action: 'UNSHARED',
          details: { removedUser: existing.user.email },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.send({
        success: true,
        data: { message: 'Access removed' },
      });
    }
  );

  /**
   * GET /api/portfolios/:id/activity
   * Get portfolio activity log
   */
  app.get(
    '/:id/activity',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const portfolioId = request.params.id;
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);

      // Check access
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { shares: { where: { userId } } },
      });

      if (!portfolio) {
        throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
      }

      const hasAccess =
        portfolio.ownerId === userId ||
        portfolio.shares.length > 0;

      if (!hasAccess) {
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have access to this portfolio');
      }

      const activities = await prisma.portfolioActivity.findMany({
        where: { portfolioId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return reply.send({
        success: true,
        data: { activities },
      });
    }
  );
}
