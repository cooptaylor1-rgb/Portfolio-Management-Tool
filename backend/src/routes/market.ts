import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { redis } from '../lib/redis.js';
import { ApiError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

// Cache TTLs
const CACHE_TTL = {
  QUOTE: 60, // 1 minute
  HISTORICAL: 300, // 5 minutes
  FUNDAMENTALS: 3600, // 1 hour
  NEWS: 300, // 5 minutes
};

// Validation schemas
const quoteParamsSchema = z.object({
  symbol: z.string().min(1).max(20),
});

const batchQuoteSchema = z.object({
  symbols: z.array(z.string().min(1).max(20)).min(1).max(50),
});

const historicalQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  interval: z.enum(['1d', '1w', '1m']).default('1d'),
});

/**
 * Market Data Routes
 * Proxies requests to external APIs (FactSet, Alpha Vantage, etc.)
 * Implements caching and fallback providers
 */
export async function marketRoutes(app: FastifyInstance) {
  /**
   * GET /api/market/quote/:symbol
   * Get current price quote for a symbol
   */
  app.get(
    '/quote/:symbol',
    async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
      const { symbol } = quoteParamsSchema.parse(request.params);
      const cacheKey = `quote:${symbol.toUpperCase()}`;

      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return reply.send({
          success: true,
          data: JSON.parse(cached),
          meta: { cached: true },
        });
      }

      // Fetch from provider
      const quote = await fetchQuoteFromProvider(symbol.toUpperCase());

      // Cache result
      await redis.setex(cacheKey, CACHE_TTL.QUOTE, JSON.stringify(quote));

      return reply.send({
        success: true,
        data: quote,
        meta: { cached: false },
      });
    }
  );

  /**
   * POST /api/market/quotes
   * Get quotes for multiple symbols (batch)
   */
  app.post('/quotes', async (request: FastifyRequest, reply: FastifyReply) => {
    const { symbols } = batchQuoteSchema.parse(request.body);

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        const cacheKey = `quote:${symbol.toUpperCase()}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
          return { ...JSON.parse(cached), cached: true };
        }

        try {
          const quote = await fetchQuoteFromProvider(symbol.toUpperCase());
          await redis.setex(cacheKey, CACHE_TTL.QUOTE, JSON.stringify(quote));
          return { ...quote, cached: false };
        } catch (error) {
          return { symbol: symbol.toUpperCase(), error: 'Failed to fetch quote' };
        }
      })
    );

    return reply.send({
      success: true,
      data: { quotes },
    });
  });

  /**
   * GET /api/market/historical/:symbol
   * Get historical price data
   */
  app.get(
    '/historical/:symbol',
    async (
      request: FastifyRequest<{
        Params: { symbol: string };
        Querystring: { from?: string; to?: string; interval?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { symbol } = quoteParamsSchema.parse(request.params);
      const query = historicalQuerySchema.parse(request.query);

      const cacheKey = `historical:${symbol.toUpperCase()}:${query.interval}:${query.from}:${query.to}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return reply.send({
          success: true,
          data: JSON.parse(cached),
          meta: { cached: true },
        });
      }

      const data = await fetchHistoricalFromProvider(
        symbol.toUpperCase(),
        query.from ? new Date(query.from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        query.to ? new Date(query.to) : new Date(),
        query.interval
      );

      await redis.setex(cacheKey, CACHE_TTL.HISTORICAL, JSON.stringify(data));

      return reply.send({
        success: true,
        data,
        meta: { cached: false },
      });
    }
  );

  /**
   * GET /api/market/fundamentals/:symbol
   * Get company fundamentals
   */
  app.get(
    '/fundamentals/:symbol',
    async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
      const { symbol } = quoteParamsSchema.parse(request.params);
      const cacheKey = `fundamentals:${symbol.toUpperCase()}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return reply.send({
          success: true,
          data: JSON.parse(cached),
          meta: { cached: true },
        });
      }

      const fundamentals = await fetchFundamentalsFromProvider(symbol.toUpperCase());
      await redis.setex(cacheKey, CACHE_TTL.FUNDAMENTALS, JSON.stringify(fundamentals));

      return reply.send({
        success: true,
        data: fundamentals,
        meta: { cached: false },
      });
    }
  );

  /**
   * GET /api/market/search
   * Search for symbols
   */
  app.get(
    '/search',
    async (
      request: FastifyRequest<{ Querystring: { q: string } }>,
      reply: FastifyReply
    ) => {
      const query = request.query.q;

      if (!query || query.length < 1) {
        throw new ApiError(400, 'INVALID_QUERY', 'Search query is required');
      }

      const results = await searchSymbols(query);

      return reply.send({
        success: true,
        data: { results },
      });
    }
  );

  /**
   * GET /api/market/news
   * Get market news
   */
  app.get(
    '/news',
    async (
      request: FastifyRequest<{ Querystring: { symbols?: string; limit?: string } }>,
      reply: FastifyReply
    ) => {
      const symbols = request.query.symbols?.split(',') || [];
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);

      const cacheKey = `news:${symbols.sort().join(',')}:${limit}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return reply.send({
          success: true,
          data: JSON.parse(cached),
          meta: { cached: true },
        });
      }

      const news = await fetchNewsFromProvider(symbols, limit);
      await redis.setex(cacheKey, CACHE_TTL.NEWS, JSON.stringify(news));

      return reply.send({
        success: true,
        data: { news },
        meta: { cached: false },
      });
    }
  );

  /**
   * WebSocket endpoint for real-time price updates
   * WS /api/market/stream
   */
  app.get('/stream', { websocket: true }, (socket, request) => {
    const subscriptions = new Set<string>();

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.action === 'subscribe' && data.symbols) {
          data.symbols.forEach((s: string) => subscriptions.add(s.toUpperCase()));
          socket.send(JSON.stringify({ type: 'subscribed', symbols: Array.from(subscriptions) }));
        }

        if (data.action === 'unsubscribe' && data.symbols) {
          data.symbols.forEach((s: string) => subscriptions.delete(s.toUpperCase()));
          socket.send(JSON.stringify({ type: 'unsubscribed', symbols: data.symbols }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Simulate price updates (in production, connect to real feed)
    const interval = setInterval(async () => {
      if (subscriptions.size === 0) return;

      for (const symbol of subscriptions) {
        const quote = await fetchQuoteFromProvider(symbol);
        socket.send(JSON.stringify({ type: 'quote', data: quote }));
      }
    }, 5000);

    socket.on('close', () => {
      clearInterval(interval);
    });
  });
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

/**
 * Fetch quote from provider chain (FactSet → Alpha Vantage → Mock)
 */
async function fetchQuoteFromProvider(symbol: string) {
  // Try FactSet first
  if (config.apiKeys.factset.username && config.apiKeys.factset.apiKey) {
    try {
      return await fetchFromFactSet(symbol);
    } catch (error) {
      console.error(`FactSet error for ${symbol}:`, error);
    }
  }

  // Try Alpha Vantage
  if (config.apiKeys.alphaVantage) {
    try {
      return await fetchFromAlphaVantage(symbol);
    } catch (error) {
      console.error(`Alpha Vantage error for ${symbol}:`, error);
    }
  }

  // Fallback to mock data
  return getMockQuote(symbol);
}

async function fetchFromFactSet(symbol: string) {
  const credentials = Buffer.from(
    `${config.apiKeys.factset.username}-serial:${config.apiKeys.factset.apiKey}`
  ).toString('base64');

  const response = await fetch('https://api.factset.com/content/factset-prices/v1/prices', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: [symbol],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      frequency: 'D',
    }),
  });

  if (!response.ok) {
    throw new Error(`FactSet API error: ${response.status}`);
  }

  const data = await response.json();
  const item = data.data?.[0];

  if (!item) {
    throw new Error('No data returned from FactSet');
  }

  return {
    symbol,
    price: item.price,
    change: item.change || 0,
    changePercent: item.changePercent || 0,
    volume: item.volume || 0,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchFromAlphaVantage(symbol: string) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.apiKeys.alphaVantage}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  const quote = data['Global Quote'];

  if (!quote || !quote['05. price']) {
    throw new Error('No data returned from Alpha Vantage');
  }

  return {
    symbol,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume'], 10),
    lastUpdated: new Date().toISOString(),
  };
}

function getMockQuote(symbol: string) {
  const mockPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    AMZN: 151.8,
    TSLA: 242.5,
    VOO: 425.75,
    SPY: 458.2,
    BTC: 52000,
    ETH: 3200,
  };

  const basePrice = mockPrices[symbol] || 100;
  const fluctuation = (Math.random() - 0.5) * 2;
  const price = basePrice * (1 + fluctuation / 100);
  const change = price - basePrice;

  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    lastUpdated: new Date().toISOString(),
    mock: true,
  };
}

async function fetchHistoricalFromProvider(
  symbol: string,
  from: Date,
  to: Date,
  interval: string
) {
  // In production, implement real provider calls
  // For now, return mock data
  const data = [];
  const current = new Date(from);
  let price = 100;

  while (current <= to) {
    const change = (Math.random() - 0.5) * 4;
    price = price * (1 + change / 100);

    data.push({
      date: current.toISOString().split('T')[0],
      open: parseFloat((price * 0.99).toFixed(2)),
      high: parseFloat((price * 1.02).toFixed(2)),
      low: parseFloat((price * 0.98).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
    });

    current.setDate(current.getDate() + (interval === '1w' ? 7 : interval === '1m' ? 30 : 1));
  }

  return { symbol, interval, data };
}

async function fetchFundamentalsFromProvider(symbol: string) {
  // In production, implement real provider calls
  const mockFundamentals: Record<string, any> = {
    AAPL: {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 2750000000000,
      pe: 28.5,
      eps: 6.16,
      revenue: 383285000000,
      revenueGrowth: 0.03,
      netIncome: 96995000000,
      netMargin: 0.253,
      roe: 1.474,
      roa: 0.283,
    },
    MSFT: {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2200000000000,
      pe: 31.2,
      eps: 9.72,
      revenue: 211915000000,
      revenueGrowth: 0.07,
      netIncome: 72738000000,
      netMargin: 0.343,
      roe: 0.423,
      roa: 0.186,
    },
  };

  return (
    mockFundamentals[symbol] || {
      symbol,
      companyName: `${symbol} Corporation`,
      sector: 'Unknown',
      industry: 'Unknown',
      marketCap: 0,
      pe: 0,
      eps: 0,
    }
  );
}

async function searchSymbols(query: string) {
  // In production, implement real search
  const allSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf' },
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  ];

  const q = query.toLowerCase();
  return allSymbols.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

async function fetchNewsFromProvider(symbols: string[], limit: number) {
  // In production, implement real news feed
  return [
    {
      id: '1',
      title: 'Markets Rally on Economic Data',
      source: 'Financial Times',
      url: 'https://example.com/news/1',
      publishedAt: new Date().toISOString(),
      sentiment: 'positive',
      symbols: ['SPY', 'VOO'],
    },
    {
      id: '2',
      title: 'Tech Sector Shows Strength',
      source: 'Bloomberg',
      url: 'https://example.com/news/2',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      sentiment: 'positive',
      symbols: ['AAPL', 'MSFT', 'GOOGL'],
    },
  ];
}
