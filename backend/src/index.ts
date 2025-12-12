import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { authRoutes } from './routes/auth.js';
import { portfolioRoutes } from './routes/portfolios.js';
import { marketRoutes } from './routes/market.js';
import { analyticsRoutes } from './routes/analytics.js';
import { aiRoutes } from './routes/ai.js';
import { userRoutes } from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsMiddleware, registerMetricsRoutes } from './services/metrics.js';
import { apiVersioning, registerVersionRoutes } from './middleware/versioning.js';
import { registerGraphQL } from './graphql/index.js';
import authPlugin from './middleware/auth.js';

// Create Fastify instance
const app = Fastify({
  logger: {
    level: config.isDev ? 'debug' : 'info',
    transport: config.isDev
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Register plugins
await app.register(cors, {
  origin: (origin, cb) => {
    // Non-browser callers (curl, server-to-server) may omit Origin.
    if (!origin) return cb(null, true);

    // In development, Vite will often hop ports (5173, 5174, ...). Allow localhost ports.
    if (config.isDev && /^http:\/\/localhost:\d+$/.test(origin)) {
      return cb(null, true);
    }

    // In production, enforce configured allowlist.
    if (config.corsOrigin.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error('CORS origin not allowed'), false);
  },
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: config.isProd,
});

await app.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.windowMs,
});

await app.register(jwt, {
  secret: config.jwt.accessSecret,
});

await app.register(websocket);

// Auth plugin (provides app.authenticate decorator)
await app.register(authPlugin);

// API versioning plugin
await app.register(apiVersioning);

// Custom plugins
app.addHook('onRequest', requestLogger);
app.addHook('onRequest', metricsMiddleware);
app.setErrorHandler(errorHandler);

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: config.version,
}));

// Prometheus metrics endpoint
registerMetricsRoutes(app);

// API version info endpoints
registerVersionRoutes(app);

// GraphQL endpoint (supports subscriptions via WebSocket)
await registerGraphQL(app);

// REST API Routes (versioned)
app.register(authRoutes, { prefix: '/api/v2/auth' });
app.register(portfolioRoutes, { prefix: '/api/v2/portfolios' });
app.register(marketRoutes, { prefix: '/api/v2/market' });
app.register(analyticsRoutes, { prefix: '/api/v2/analytics' });
app.register(aiRoutes, { prefix: '/api/v2/ai' });
app.register(userRoutes, { prefix: '/api/v2/users' });

// Legacy v1 routes (deprecated, maps to v2)
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(portfolioRoutes, { prefix: '/api/v1/portfolios' });
app.register(marketRoutes, { prefix: '/api/v1/market' });
app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
app.register(aiRoutes, { prefix: '/api/v1/ai' });
app.register(userRoutes, { prefix: '/api/v1/users' });

// Unversioned routes (uses default version from config)
app.register(authRoutes, { prefix: '/api/auth' });
app.register(portfolioRoutes, { prefix: '/api/portfolios' });
app.register(marketRoutes, { prefix: '/api/market' });
app.register(analyticsRoutes, { prefix: '/api/analytics' });
app.register(aiRoutes, { prefix: '/api/ai' });
app.register(userRoutes, { prefix: '/api/users' });

// 404 handler
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
});

// Start server
const start = async () => {
  try {
    await app.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`
🚀 Portfolio API Server
━━━━━━━━━━━━━━━━━━━━━━━
📍 Server:   http://${config.host}:${config.port}
📊 Health:   http://${config.host}:${config.port}/health
📈 Metrics:  http://${config.host}:${config.port}/metrics
🔷 GraphQL:  http://${config.host}:${config.port}/graphql
📝 Docs:     http://${config.host}:${config.port}/docs
🔧 Mode:     ${config.nodeEnv}
━━━━━━━━━━━━━━━━━━━━━━━
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export { app };
