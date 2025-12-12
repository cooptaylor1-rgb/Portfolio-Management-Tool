import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma so these tests don't require a database.
vi.mock('../lib/prisma.js', () => {
  const prisma = {
    portfolio: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    investment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    portfolioActivity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    portfolioShare: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  return { prisma };
});

import { prisma } from '../lib/prisma.js';
import { portfolioRoutes } from './portfolios.js';
import { userRoutes } from './users.js';

describe('collaboration routes (mocked prisma)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/v2/portfolios returns shareCount and investmentCount summaries', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolio.findMany.mockResolvedValue([
      {
        id: 'p_owned',
        name: 'Owned Portfolio',
        description: null,
        ownerId: 'user_1',
        isPublic: false,
        createdAt: new Date('2025-01-01').toISOString(),
        updatedAt: new Date('2025-01-02').toISOString(),
        owner: { id: 'user_1', name: 'Alice', email: 'alice@example.com' },
        _count: { investments: 2, shares: 3 },
        shares: [{ permission: 'EDIT' }],
      },
      {
        id: 'p_shared',
        name: 'Shared Portfolio',
        description: 'Shared',
        ownerId: 'user_2',
        isPublic: false,
        createdAt: new Date('2025-02-01').toISOString(),
        updatedAt: new Date('2025-02-02').toISOString(),
        owner: { id: 'user_2', name: 'Bob', email: 'bob@example.com' },
        _count: { investments: 5, shares: 1 },
        shares: [{ permission: 'VIEW' }],
      },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v2/portfolios' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.portfolios)).toBe(true);

    const owned = body.data.portfolios.find((p: any) => p.id === 'p_owned');
    expect(owned.investmentCount).toBe(2);
    expect(owned.shareCount).toBe(3);
    expect(owned.isOwner).toBe(true);
    expect(owned.permission).toBe('OWNER');

    const shared = body.data.portfolios.find((p: any) => p.id === 'p_shared');
    expect(shared.investmentCount).toBe(5);
    expect(shared.shareCount).toBe(1);
    expect(shared.isOwner).toBe(false);
    expect(shared.permission).toBe('VIEW');
  });

  it('GET /api/v2/portfolios/activity returns recent activity feed', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolioActivity.findMany.mockResolvedValue([
      {
        id: 'a1',
        portfolioId: 'p1',
        userId: 'user_1',
        action: 'CREATED',
        details: { name: 'P1' },
        createdAt: new Date('2025-03-01').toISOString(),
        user: { id: 'user_1', name: 'Alice', email: 'alice@example.com' },
        portfolio: { id: 'p1', name: 'P1' },
      },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v2/portfolios/activity?limit=20' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.activities).toHaveLength(1);
    expect(body.data.activities[0].id).toBe('a1');
  });

  it('GET /api/v2/users/search returns matching users', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(userRoutes, { prefix: '/api/v2/users' });

    (prisma as any).user.findMany.mockResolvedValue([
      {
        id: 'user_2',
        email: 'bob@example.com',
        name: 'Bob',
        avatar: null,
        createdAt: new Date('2025-01-01').toISOString(),
      },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v2/users/search?q=bob&limit=5' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0].email).toBe('bob@example.com');

    expect((prisma as any).user.findMany).toHaveBeenCalledTimes(1);
    const callArg = (prisma as any).user.findMany.mock.calls[0][0];
    expect(callArg.take).toBe(5);
  });

  it('DELETE /api/v2/portfolios/:id/share/:userId removes access', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'owner_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      ownerId: 'owner_1',
      shares: [],
    });

    (prisma as any).portfolioShare.findUnique.mockResolvedValue({
      portfolioId: 'p1',
      userId: 'user_2',
      permission: 'VIEW',
      user: { id: 'user_2', name: 'Bob', email: 'bob@example.com' },
    });

    (prisma as any).portfolioShare.delete.mockResolvedValue({
      portfolioId: 'p1',
      userId: 'user_2',
    });

    (prisma as any).portfolioActivity.create.mockResolvedValue({ id: 'act_1' });

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v2/portfolios/p1/share/user_2',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Access removed');

    expect((prisma as any).portfolioShare.delete).toHaveBeenCalledTimes(1);
    expect((prisma as any).portfolioActivity.create).toHaveBeenCalledTimes(1);
  });

  it('GET /api/v2/portfolios/export exports owned portfolios with investments and transactions', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolio.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'P1',
        description: null,
        isPublic: false,
        investments: [
          {
            id: 'i1',
            symbol: 'AAPL',
            name: 'Apple',
            type: 'STOCK',
            quantity: '10',
            purchasePrice: '100',
            purchaseDate: new Date('2025-01-01T00:00:00.000Z'),
            sector: null,
            notes: null,
            transactions: [
              {
                id: 't1',
                investmentId: 'i1',
                type: 'BUY',
                quantity: '10',
                price: '100',
                fees: null,
                date: new Date('2025-01-02T00:00:00.000Z'),
                notes: null,
              },
            ],
          },
        ],
        updatedAt: new Date('2025-01-03T00:00:00.000Z'),
      },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v2/portfolios/export' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.version).toBe('1');
    expect(Array.isArray(body.data.portfolios)).toBe(true);
    expect(body.data.portfolios[0].name).toBe('P1');
    expect(body.data.portfolios[0].investments[0].symbol).toBe('AAPL');
    expect(body.data.portfolios[0].investments[0].transactions[0].type).toBe('BUY');

    expect((prisma as any).portfolio.findMany).toHaveBeenCalledTimes(1);
    const callArg = (prisma as any).portfolio.findMany.mock.calls[0][0];
    expect(callArg.where).toEqual({ ownerId: 'user_1' });
  });

  it('POST /api/v2/portfolios/import creates portfolios for the user', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolio.create.mockResolvedValue({ id: 'p_new', name: 'Imported' });
    (prisma as any).portfolioActivity.create.mockResolvedValue({ id: 'act_1' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v2/portfolios/import',
      payload: {
        version: '1',
        exportedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        portfolios: [
          {
            name: 'Imported',
            description: null,
            isPublic: false,
            investments: [
              {
                symbol: 'aapl',
                name: 'Apple',
                type: 'stock',
                quantity: '10',
                purchasePrice: '100',
                purchaseDate: new Date('2025-01-01T00:00:00.000Z').toISOString(),
                transactions: [
                  {
                    type: 'buy',
                    quantity: '10',
                    price: '100',
                    fees: '0',
                    date: new Date('2025-01-02T00:00:00.000Z').toISOString(),
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.importedCount).toBe(1);
    expect(body.data.portfolios[0].id).toBe('p_new');

    expect((prisma as any).portfolio.create).toHaveBeenCalledTimes(1);
    expect((prisma as any).portfolioActivity.create).toHaveBeenCalledTimes(1);

    const createArg = (prisma as any).portfolio.create.mock.calls[0][0];
    expect(createArg.data.ownerId).toBe('user_1');
    expect(createArg.data.investments.create[0].symbol).toBe('AAPL');
    expect(createArg.data.investments.create[0].type).toBe('STOCK');
    expect(createArg.data.investments.create[0].transactions.create[0].type).toBe('BUY');
  });

  it('POST /api/v2/portfolios/:id/investments/:investmentId/transactions records a transaction when user can edit', async () => {
    const app = Fastify();

    app.decorate('authenticate', async (request: any) => {
      request.user = { id: 'user_1' };
    });

    await app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });

    (prisma as any).portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      ownerId: 'user_1',
      shares: [],
    });

    (prisma as any).investment.findUnique.mockResolvedValue({
      id: 'i1',
      portfolioId: 'p1',
      symbol: 'AAPL',
    });

    (prisma as any).transaction.create.mockResolvedValue({
      id: 't1',
      investmentId: 'i1',
      type: 'BUY',
      quantity: '10',
      price: '100',
      fees: null,
      date: new Date('2025-01-02T00:00:00.000Z'),
      notes: null,
    });

    (prisma as any).portfolioActivity.create.mockResolvedValue({ id: 'act_1' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v2/portfolios/p1/investments/i1/transactions',
      payload: {
        type: 'BUY',
        quantity: 10,
        price: 100,
        fees: 0,
        date: new Date('2025-01-02T00:00:00.000Z').toISOString(),
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.transaction.id).toBe('t1');

    expect((prisma as any).transaction.create).toHaveBeenCalledTimes(1);
    expect((prisma as any).portfolioActivity.create).toHaveBeenCalledTimes(1);
  });
});
