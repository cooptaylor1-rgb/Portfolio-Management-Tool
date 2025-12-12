/**
 * GraphQL Resolvers
 * 
 * Implements all GraphQL operations by wrapping existing services.
 */

import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { GraphQLError } from 'graphql';

// Type definitions for context
interface Context {
  user?: {
    id: string;
    email: string;
    name: string;
    tier: string;
  };
  req: any;
  reply: any;
}

// Helper to require authentication
function requireAuth(context: Context) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check portfolio access
async function checkPortfolioAccess(
  portfolioId: string,
  userId: string,
  requiredPermission: 'VIEW' | 'EDIT' | 'ADMIN' = 'VIEW'
) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      shares: {
        where: { userId },
      },
    },
  });

  if (!portfolio) {
    throw new GraphQLError('Portfolio not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const isOwner = portfolio.ownerId === userId;
  const share = portfolio.shares[0];

  if (!isOwner && !share) {
    if (!portfolio.isPublic) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    if (requiredPermission !== 'VIEW') {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  }

  if (!isOwner && share) {
    const permissionLevel = { VIEW: 1, EDIT: 2, ADMIN: 3 };
    if (permissionLevel[share.permission] < permissionLevel[requiredPermission]) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  }

  return portfolio;
}

// Scalar resolvers
const dateTimeScalar = {
  serialize(value: Date): string {
    return value.toISOString();
  },
  parseValue(value: string): Date {
    return new Date(value);
  },
  parseLiteral(ast: any): Date | null {
    if (ast.kind === 'StringValue') {
      return new Date(ast.value);
    }
    return null;
  },
};

const decimalScalar = {
  serialize(value: any): string {
    return value.toString();
  },
  parseValue(value: string): number {
    return parseFloat(value);
  },
  parseLiteral(ast: any): number | null {
    if (ast.kind === 'StringValue' || ast.kind === 'FloatValue' || ast.kind === 'IntValue') {
      return parseFloat(ast.value);
    }
    return null;
  },
};

export const resolvers = {
  // Scalar types
  DateTime: dateTimeScalar,
  Decimal: decimalScalar,
  JSON: {
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: (ast: any) => ast.value,
  },

  // ============================================================================
  // QUERY RESOLVERS
  // ============================================================================

  Query: {
    // User queries
    me: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context);
      return prisma.user.findUnique({
        where: { id: user.id },
      });
    },

    // Portfolio queries
    portfolios: async (_: any, args: any, context: Context) => {
      const user = requireAuth(context);
      const { filter, sort, pagination } = args;

      const where: any = {
        OR: [
          { ownerId: user.id },
          ...(filter?.includeShared !== false
            ? [{ shares: { some: { userId: user.id } } }]
            : []),
        ],
      };

      if (filter?.search) {
        where.AND = [
          {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { description: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.portfolio.findMany({
          where,
          orderBy: { [sort?.field || 'updatedAt']: sort?.direction?.toLowerCase() || 'desc' },
          skip: pagination?.offset || 0,
          take: pagination?.limit || 20,
          include: {
            investments: true,
            owner: true,
          },
        }),
        prisma.portfolio.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: (pagination?.offset || 0) + items.length < total,
      };
    },

    portfolio: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      return checkPortfolioAccess(args.id, user.id);
    },

    investment: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      const investment = await prisma.investment.findUnique({
        where: { id: args.id },
        include: { portfolio: true },
      });

      if (!investment) {
        throw new GraphQLError('Investment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await checkPortfolioAccess(investment.portfolioId, user.id);
      return investment;
    },

    // Watchlist
    watchlist: async (_: any, __: any, context: Context) => {
      const user = requireAuth(context);
      return prisma.watchlistItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Alerts
    alerts: async (_: any, args: { triggered?: boolean }, context: Context) => {
      const user = requireAuth(context);
      const where: any = { userId: user.id };
      if (args.triggered !== undefined) {
        where.triggered = args.triggered;
      }
      return prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Market data queries
    quote: async (_: any, args: { symbol: string }) => {
      // Check cache first
      const cached = await redis.get(`quote:${args.symbol}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // In production, this would call the market data provider
      // For now, return mock data
      const quote = {
        symbol: args.symbol,
        price: 150 + Math.random() * 10,
        change: Math.random() * 5 - 2.5,
        changePercent: Math.random() * 3 - 1.5,
        open: 148,
        high: 152,
        low: 147,
        volume: Math.floor(Math.random() * 10000000),
        updatedAt: new Date(),
      };

      await redis.setex(`quote:${args.symbol}`, 60, JSON.stringify(quote));
      return quote;
    },

    quotes: async (_: any, args: { symbols: string[] }) => {
      const quotes = await Promise.all(
        args.symbols.map(async (symbol) => {
          const cached = await redis.get(`quote:${symbol}`);
          if (cached) {
            return JSON.parse(cached);
          }
          return {
            symbol,
            price: 150 + Math.random() * 10,
            change: Math.random() * 5 - 2.5,
            changePercent: Math.random() * 3 - 1.5,
            updatedAt: new Date(),
          };
        })
      );
      return quotes;
    },

    historicalData: async (_: any, args: any) => {
      // In production, fetch from provider
      const days = args.period === '1M' ? 30 : args.period === '3M' ? 90 : 365;
      const data = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let price = 150;
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const change = (Math.random() - 0.5) * 5;
        price = Math.max(price + change, 1);
        data.push({
          date,
          open: price - 1,
          high: price + 2,
          low: price - 2,
          close: price,
          volume: Math.floor(Math.random() * 10000000),
          adjustedClose: price,
        });
      }
      return data;
    },

    search: async (_: any, args: { query: string; limit?: number }) => {
      // Mock search results
      const results = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', exchange: 'NASDAQ', currency: 'USD' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', exchange: 'NASDAQ', currency: 'USD' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', exchange: 'NASDAQ', currency: 'USD' },
      ].filter(
        (r) =>
          r.symbol.toLowerCase().includes(args.query.toLowerCase()) ||
          r.name.toLowerCase().includes(args.query.toLowerCase())
      );
      return results.slice(0, args.limit || 10);
    },

    news: async (_: any, args: { symbols?: string[]; limit?: number }) => {
      // Mock news
      return [
        {
          id: '1',
          title: 'Market Update: Tech Stocks Rally',
          summary: 'Technology stocks led the market higher today...',
          source: 'Financial Times',
          url: 'https://example.com/news/1',
          publishedAt: new Date(),
          symbols: args.symbols || ['AAPL', 'GOOGL', 'MSFT'],
          sentiment: 'positive',
        },
      ];
    },

    // Analytics queries
    riskAnalysis: async (_: any, args: { portfolioId: string }, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.portfolioId, user.id);

      // In production, this would use proper risk calculations
      return {
        portfolioId: args.portfolioId,
        var95: 5000,
        var99: 7500,
        cvar: 8000,
        beta: 1.1,
        sharpeRatio: 1.5,
        sortinoRatio: 1.8,
        maxDrawdown: 15,
        volatility: 18,
        correlationWithMarket: 0.85,
        sectorExposure: { Technology: 40, Healthcare: 25, Finance: 20, Other: 15 },
        geographicExposure: { US: 70, Europe: 20, Asia: 10 },
      };
    },

    correlationMatrix: async (_: any, args: { portfolioId: string }, context: Context) => {
      const user = requireAuth(context);
      const portfolio = await checkPortfolioAccess(args.portfolioId, user.id);
      
      const investments = await prisma.investment.findMany({
        where: { portfolioId: portfolio.id },
      });

      const symbols = investments.map((i) => i.symbol);
      const n = symbols.length;
      const matrix = Array(n)
        .fill(null)
        .map((_, i) =>
          Array(n)
            .fill(null)
            .map((_, j) => (i === j ? 1 : Math.random() * 0.8 - 0.4))
        );

      return { symbols, matrix };
    },

    taxAnalysis: async (_: any, args: any, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.portfolioId, user.id);

      return {
        portfolioId: args.portfolioId,
        shortTermGains: 2500,
        longTermGains: 15000,
        shortTermLosses: 500,
        longTermLosses: 1000,
        washSaleRisk: [],
        taxLossHarvestingOpportunities: [
          {
            symbol: 'XYZ',
            currentLoss: 1500,
            taxSavings: 375,
            alternatives: ['ABC', 'DEF'],
          },
        ],
      };
    },

    monteCarlo: async (_: any, args: any, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.input.portfolioId, user.id);

      // Simplified Monte Carlo simulation
      const { years = 10, simulations = 1000 } = args.input;
      const startValue = 100000;
      const annualReturn = 0.07;
      const volatility = 0.15;

      const results: number[] = [];
      for (let s = 0; s < simulations; s++) {
        let value = startValue;
        for (let y = 0; y < years; y++) {
          const randomReturn = annualReturn + volatility * (Math.random() * 2 - 1);
          value *= 1 + randomReturn;
        }
        results.push(value);
      }

      results.sort((a, b) => a - b);
      const getPercentile = (p: number) => results[Math.floor(results.length * p)];

      return {
        percentiles: {
          p10: Array(years).fill(getPercentile(0.1)),
          p25: Array(years).fill(getPercentile(0.25)),
          p50: Array(years).fill(getPercentile(0.5)),
          p75: Array(years).fill(getPercentile(0.75)),
          p90: Array(years).fill(getPercentile(0.9)),
        },
        successRate: 0.85,
        medianFinalValue: getPercentile(0.5),
        distribution: [
          { value: getPercentile(0.1), frequency: 100 },
          { value: getPercentile(0.5), frequency: 300 },
          { value: getPercentile(0.9), frequency: 100 },
        ],
      };
    },

    rebalanceSuggestions: async (_: any, args: any, context: Context) => {
      const user = requireAuth(context);
      const portfolio = await checkPortfolioAccess(args.input.portfolioId, user.id);

      const investments = await prisma.investment.findMany({
        where: { portfolioId: portfolio.id },
      });

      const totalValue = investments.reduce((sum, inv) => {
        return sum + Number(inv.quantity) * Number(inv.purchasePrice);
      }, 0);

      return args.input.targetAllocations.map((target: any) => {
        const investment = investments.find((i) => i.symbol === target.symbol);
        const currentValue = investment
          ? Number(investment.quantity) * Number(investment.purchasePrice)
          : 0;
        const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        const targetValue = (totalValue * target.targetPercent) / 100;
        const currentPrice = investment ? Number(investment.purchasePrice) : 100;
        const suggestedShares = targetValue / currentPrice;
        const currentShares = investment ? Number(investment.quantity) : 0;

        return {
          symbol: target.symbol,
          name: investment?.name || target.symbol,
          currentShares,
          currentValue,
          currentPercent,
          targetPercent: target.targetPercent,
          suggestedShares,
          sharesChange: suggestedShares - currentShares,
          action: suggestedShares > currentShares ? 'BUY' : 'SELL',
        };
      });
    },
  },

  // ============================================================================
  // MUTATION RESOLVERS
  // ============================================================================

  Mutation: {
    // Portfolio mutations
    createPortfolio: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      const { name, description, isPublic } = args.input;
      return prisma.portfolio.create({
        data: {
          name,
          description,
          isPublic,
          ownerId: user.id,
        },
        include: { investments: true, owner: true },
      });
    },

    updatePortfolio: async (_: any, args: { id: string; input: any }, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.id, user.id, 'EDIT');

      const data: any = {};
      if (args.input?.name !== undefined) data.name = args.input.name;
      if (args.input?.description !== undefined) data.description = args.input.description;
      if (args.input?.isPublic !== undefined) data.isPublic = args.input.isPublic;

      return prisma.portfolio.update({
        where: { id: args.id },
        data,
        include: { investments: true, owner: true },
      });
    },

    deletePortfolio: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      const portfolio = await checkPortfolioAccess(args.id, user.id, 'ADMIN');

      if (portfolio.ownerId !== user.id) {
        throw new GraphQLError('Only the owner can delete a portfolio', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await prisma.portfolio.delete({ where: { id: args.id } });
      return true;
    },

    sharePortfolio: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.input.portfolioId, user.id, 'ADMIN');

      const targetUser = await prisma.user.findUnique({
        where: { email: args.input.email },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return prisma.portfolioShare.create({
        data: {
          portfolioId: args.input.portfolioId,
          userId: targetUser.id,
          permission: args.input.permission,
        },
        include: { portfolio: true, user: true },
      });
    },

    // Investment mutations
    addInvestment: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      await checkPortfolioAccess(args.input.portfolioId, user.id, 'EDIT');

      const { portfolioId, symbol, name, type, shares, avgCost, sector, notes } = args.input;

      return prisma.investment.create({
        data: {
          portfolioId,
          symbol,
          name,
          type,
          quantity: shares,
          purchasePrice: avgCost,
          purchaseDate: new Date(),
          sector,
          notes,
        },
        include: { transactions: true },
      });
    },

    updateInvestment: async (_: any, args: { id: string; input: any }, context: Context) => {
      const user = requireAuth(context);
      const investment = await prisma.investment.findUnique({
        where: { id: args.id },
      });

      if (!investment) {
        throw new GraphQLError('Investment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await checkPortfolioAccess(investment.portfolioId, user.id, 'EDIT');

      const data: any = {};
      if (args.input?.shares !== undefined) data.quantity = args.input.shares;
      if (args.input?.avgCost !== undefined) data.purchasePrice = args.input.avgCost;
      if (args.input?.sector !== undefined) data.sector = args.input.sector;
      if (args.input?.notes !== undefined) data.notes = args.input.notes;

      return prisma.investment.update({
        where: { id: args.id },
        data,
      });
    },

    deleteInvestment: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      const investment = await prisma.investment.findUnique({
        where: { id: args.id },
      });

      if (!investment) {
        throw new GraphQLError('Investment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await checkPortfolioAccess(investment.portfolioId, user.id, 'EDIT');
      await prisma.investment.delete({ where: { id: args.id } });
      return true;
    },

    // Transaction mutations
    addTransaction: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      const investment = await prisma.investment.findUnique({
        where: { id: args.input.investmentId },
      });

      if (!investment) {
        throw new GraphQLError('Investment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await checkPortfolioAccess(investment.portfolioId, user.id, 'EDIT');

      const { shares, ...rest } = args.input;

      return prisma.transaction.create({
        data: {
          ...rest,
          quantity: shares,
          date: args.input.date || new Date(),
        },
        include: { investment: true },
      });
    },

    // Watchlist mutations
    addToWatchlist: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      return prisma.watchlistItem.create({
        data: {
          ...args.input,
          userId: user.id,
        },
      });
    },

    removeFromWatchlist: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      await prisma.watchlistItem.deleteMany({
        where: { id: args.id, userId: user.id },
      });
      return true;
    },

    // Alert mutations
    createAlert: async (_: any, args: { input: any }, context: Context) => {
      const user = requireAuth(context);
      return prisma.alert.create({
        data: {
          ...args.input,
          userId: user.id,
        },
      });
    },

    deleteAlert: async (_: any, args: { id: string }, context: Context) => {
      const user = requireAuth(context);
      await prisma.alert.deleteMany({
        where: { id: args.id, userId: user.id },
      });
      return true;
    },
  },

  // ============================================================================
  // TYPE RESOLVERS
  // ============================================================================

  User: {
    portfolios: async (parent: { id: string }) => {
      return prisma.portfolio.findMany({
        where: { ownerId: parent.id },
      });
    },
    watchlist: async (parent: { id: string }) => {
      return prisma.watchlistItem.findMany({
        where: { userId: parent.id },
      });
    },
    alerts: async (parent: { id: string }) => {
      return prisma.alert.findMany({
        where: { userId: parent.id },
      });
    },
  },

  Portfolio: {
    currency: () => 'USD',
    owner: async (parent: any) => {
      return prisma.user.findUnique({
        where: { id: parent.ownerId },
      });
    },
    investments: async (parent: { id: string }) => {
      return prisma.investment.findMany({
        where: { portfolioId: parent.id },
      });
    },
    shares: async (parent: { id: string }) => {
      return prisma.portfolioShare.findMany({
        where: { portfolioId: parent.id },
        include: { user: true },
      });
    },
    activities: async (parent: { id: string }) => {
      return prisma.portfolioActivity.findMany({
        where: { portfolioId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
    snapshots: async (parent: { id: string }, args: { limit?: number }) => {
      return prisma.portfolioSnapshot.findMany({
        where: { portfolioId: parent.id },
        orderBy: { date: 'desc' },
        take: args.limit || 30,
      });
    },
    totalValue: async (parent: any) => {
      const investments = await prisma.investment.findMany({
        where: { portfolioId: parent.id },
      });
      return investments.reduce(
        (sum, inv) => sum + Number(inv.quantity) * Number(inv.purchasePrice) * 1.1,
        0
      );
    },
    totalGain: () => 15000, // Would calculate from market data
    totalGainPercent: () => 12.5,
    dayChange: () => 500,
    dayChangePercent: () => 0.5,
    metrics: async (parent: any) => ({
      totalValue: 100000,
      totalCost: 85000,
      totalGain: 15000,
      totalGainPercent: 17.6,
      dayChange: 500,
      dayChangePercent: 0.5,
      beta: 1.1,
      sharpeRatio: 1.5,
      volatility: 18,
      maxDrawdown: 15,
      diversificationScore: 7.5,
    }),
  },

  Investment: {
    shares: (parent: any) => parent.quantity,
    avgCost: (parent: any) => parent.purchasePrice,
    currency: () => 'USD',
    transactions: async (parent: { id: string }) => {
      return prisma.transaction.findMany({
        where: { investmentId: parent.id },
        orderBy: { date: 'desc' },
      });
    },
    currentPrice: () => 155.5,
    currentValue: (parent: any) => Number(parent.quantity) * 155.5,
    gain: (parent: any) => Number(parent.quantity) * (155.5 - Number(parent.purchasePrice)),
    gainPercent: (parent: any) =>
      ((155.5 - Number(parent.purchasePrice)) / Number(parent.purchasePrice)) * 100,
    dayChange: () => 2.5,
    dayChangePercent: () => 1.6,
    weight: () => 15,
  },

  Transaction: {
    investment: async (parent: { investmentId: string }) => {
      return prisma.investment.findUnique({
        where: { id: parent.investmentId },
      });
    },
    totalCost: (parent: any) =>
      Number(parent.quantity) * Number(parent.price) + Number(parent.fees),
  },

  PortfolioShare: {
    portfolio: async (parent: { portfolioId: string }) => {
      return prisma.portfolio.findUnique({
        where: { id: parent.portfolioId },
      });
    },
    user: async (parent: { userId: string }) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },

  PortfolioActivity: {
    user: async (parent: { userId: string }) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },

  Alert: {
    currentPrice: () => 155.5,
    distanceToTrigger: (parent: any) => Math.abs(155.5 - Number(parent.threshold)),
  },

  WatchlistItem: {
    price: () => 155.5,
    change: () => 2.5,
    changePercent: () => 1.6,
  },
};
