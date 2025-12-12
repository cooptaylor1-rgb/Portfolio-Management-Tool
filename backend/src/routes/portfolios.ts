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

const recordTransactionSchema = z.object({
  type: z.enum(['BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'TRANSFER_IN', 'TRANSFER_OUT']),
  quantity: z.number().nonnegative(),
  price: z.number().nonnegative(),
  fees: z.number().nonnegative().optional(),
  date: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

const exportImportInvestmentTypeSchema = z
  .union([
    z.enum(['STOCK', 'BOND', 'ETF', 'MUTUAL_FUND', 'CRYPTO', 'OTHER']),
    z.enum(['stock', 'bond', 'etf', 'mutual-fund', 'crypto', 'other']),
    z.enum(['mutual_fund']),
  ])
  .transform((value) => {
    const normalized = String(value).trim().toUpperCase().replace(/-/g, '_');
    if (normalized === 'MUTUAL_FUND') return 'MUTUAL_FUND' as const;
    if (['STOCK', 'BOND', 'ETF', 'CRYPTO', 'OTHER'].includes(normalized)) return normalized as any;
    throw new Error('Invalid investment type');
  });

const exportImportTransactionTypeSchema = z
  .union([
    z.enum(['BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'TRANSFER_IN', 'TRANSFER_OUT']),
    z.enum(['buy', 'sell', 'dividend', 'split', 'transfer_in', 'transfer_out']),
  ])
  .transform((value) => String(value).trim().toUpperCase());

const exportPortfolioSchema = z.object({
  // Optional metadata (ignored for data creation, but can be used for provenance)
  id: z.string().optional(),
  owner: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().email(),
    })
    .optional(),
  permission: z.enum(['OWNER', 'VIEW', 'EDIT', 'ADMIN']).optional(),
  isOwner: z.boolean().optional(),
  investmentCount: z.coerce.number().optional(),
  shareCount: z.coerce.number().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  investments: z
    .array(
      z.object({
        symbol: z.string().min(1).max(20),
        name: z.string().min(1).max(255),
        type: exportImportInvestmentTypeSchema,
        quantity: z.coerce.number().nonnegative(),
        purchasePrice: z.coerce.number().nonnegative(),
        purchaseDate: z.string().datetime(),
        sector: z.string().max(100).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        transactions: z
          .array(
            z.object({
              type: exportImportTransactionTypeSchema,
              quantity: z.coerce.number().nonnegative(),
              price: z.coerce.number().nonnegative(),
              fees: z.coerce.number().nonnegative().optional().nullable(),
              date: z.string().datetime(),
              notes: z.string().max(1000).optional().nullable(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .optional()
    .default([]),
});

const importPayloadSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().datetime().optional(),
  portfolios: z.array(exportPortfolioSchema).min(1),
});

const sharePortfolioSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['VIEW', 'EDIT', 'ADMIN']),
});

export async function portfolioRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/portfolios/export
   * Export all portfolios the current user can access (owned + shared)
   */
  app.get('/export', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;

    const portfolios = await prisma.portfolio.findMany({
      where: {
        OR: [{ ownerId: userId }, { shares: { some: { userId } } }],
      },
      include: {
        _count: {
          select: { shares: true },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          where: { userId },
          select: { permission: true },
        },
        investments: {
          orderBy: { createdAt: 'desc' },
          include: {
            transactions: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const exportData = {
      version: '1',
      exportedAt: new Date().toISOString(),
      portfolios: portfolios.map((p) => ({
        id: p.id,
        owner: p.owner,
        permission: p.ownerId === userId ? 'OWNER' : p.shares[0]?.permission ?? 'VIEW',
        isOwner: p.ownerId === userId,
        investmentCount: p.investments.length,
        shareCount: p._count.shares,
        name: p.name,
        description: p.description,
        isPublic: p.isPublic,
        investments: p.investments.map((inv) => ({
          symbol: inv.symbol,
          name: inv.name,
          type: inv.type,
          quantity: inv.quantity,
          purchasePrice: inv.purchasePrice,
          purchaseDate: inv.purchaseDate.toISOString(),
          sector: inv.sector,
          notes: inv.notes,
          transactions: inv.transactions.map((t) => ({
            type: t.type,
            quantity: t.quantity,
            price: t.price,
            fees: t.fees,
            date: t.date.toISOString(),
            notes: t.notes,
          })),
        })),
      })),
    };

    return reply.send({
      success: true,
      data: exportData,
    });
  });

  /**
   * POST /api/portfolios/import
   * Import portfolios for the current user (creates new portfolios)
   */
  app.post('/import', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;
    const body = importPayloadSchema.parse(request.body);

    const created: Array<{ id: string; name: string }> = [];

    for (const portfolio of body.portfolios) {
      const importedFrom: Record<string, string> = {};
      if (portfolio.id) importedFrom.sourcePortfolioId = portfolio.id;
      if (portfolio.owner?.email) importedFrom.sourceOwnerEmail = portfolio.owner.email;
      if (portfolio.owner?.name) importedFrom.sourceOwnerName = portfolio.owner.name;
      if (body.exportedAt) importedFrom.exportedAt = body.exportedAt;
      if (body.version) importedFrom.version = body.version;

      const createdPortfolio = await prisma.portfolio.create({
        data: {
          name: portfolio.name,
          description: portfolio.description ?? undefined,
          isPublic: portfolio.isPublic ?? false,
          ownerId: userId,
          settings: {
            importedFrom,
          },
          investments: {
            create: (portfolio.investments ?? []).map((inv) => ({
              symbol: inv.symbol.toUpperCase(),
              name: inv.name,
              type: inv.type as any,
              quantity: inv.quantity,
              purchasePrice: inv.purchasePrice,
              purchaseDate: new Date(inv.purchaseDate),
              sector: inv.sector ?? undefined,
              notes: inv.notes ?? undefined,
              transactions: {
                create: (inv.transactions ?? []).map((t) => ({
                  type: t.type as any,
                  quantity: t.quantity,
                  price: t.price,
                  fees: t.fees ?? undefined,
                  date: new Date(t.date),
                  notes: t.notes ?? undefined,
                })),
              },
            })),
          },
        },
        select: { id: true, name: true },
      });

      created.push(createdPortfolio);

      await prisma.portfolioActivity.create({
        data: {
          portfolioId: createdPortfolio.id,
          userId,
          action: 'IMPORTED',
          details: {
            investmentCount: portfolio.investments?.length ?? 0,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });
    }

    return reply.status(201).send({
      success: true,
      data: {
        importedCount: created.length,
        portfolios: created,
      },
    });
  });

  /**
   * DELETE /api/portfolios/owned
   * Delete all portfolios owned by the current user
   */
  app.delete('/owned', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;

    const result = await prisma.portfolio.deleteMany({
      where: { ownerId: userId },
    });

    return reply.send({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  });

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
          select: { investments: true, shares: true },
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
      shareCount: p._count.shares,
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

  /**
   * POST /api/portfolios/:id/investments/:investmentId/transactions
   * Record a transaction for an investment (edit/admin/owner)
   */
  app.post(
    '/:id/investments/:investmentId/transactions',
    async (
      request: FastifyRequest<{ Params: { id: string; investmentId: string } }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { id: portfolioId, investmentId } = request.params;
      const body = recordTransactionSchema.parse(request.body);

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
        throw new ApiError(403, 'ACCESS_DENIED', 'You do not have permission to record transactions');
      }

      const investment = await prisma.investment.findUnique({
        where: { id: investmentId },
        select: { id: true, portfolioId: true, symbol: true },
      });

      if (!investment || investment.portfolioId !== portfolioId) {
        throw new ApiError(404, 'INVESTMENT_NOT_FOUND', 'Investment not found');
      }

      const transaction = await prisma.transaction.create({
        data: {
          investmentId,
          type: body.type,
          quantity: body.quantity,
          price: body.price,
          fees: body.fees,
          date: new Date(body.date),
          notes: body.notes,
        },
      });

      await prisma.portfolioActivity.create({
        data: {
          portfolioId,
          userId,
          action: 'TRANSACTION_RECORDED',
          details: { symbol: investment.symbol, type: body.type },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });

      return reply.status(201).send({
        success: true,
        data: { transaction },
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
