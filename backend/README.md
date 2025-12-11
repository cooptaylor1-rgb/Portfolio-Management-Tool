# Backend

Production-grade backend for the Portfolio Management Tool.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Start background worker (separate terminal)
npm run worker
```

## Architecture

```
src/
├── config/         # Configuration and environment
├── graphql/        # GraphQL schema and resolvers
│   ├── schema.ts   # SDL type definitions
│   ├── resolvers.ts# Query and mutation handlers
│   └── index.ts    # GraphQL server setup
├── lib/            # Shared libraries (Prisma, Redis)
├── middleware/     # Authentication, error handling, logging
│   ├── auth.ts     # JWT authentication
│   ├── rateLimit.ts# Per-user/IP rate limiting
│   └── versioning.ts# API versioning
├── routes/         # REST API route handlers
├── services/       # Business logic
│   ├── email.ts    # Multi-provider email service
│   ├── jobs.ts     # Background job queues
│   ├── metrics.ts  # Prometheus metrics
│   ├── mfa.ts      # TOTP/MFA service
│   └── token.ts    # JWT token management
├── worker.ts       # Background job processor
└── index.ts        # Application entry point
```

## API Endpoints

### REST API (versioned: /api/v1, /api/v2)

#### Authentication
- `POST /api/v2/auth/register` - Create account
- `POST /api/v2/auth/login` - Get tokens
- `POST /api/v2/auth/refresh` - Refresh access token
- `POST /api/v2/auth/logout` - Invalidate tokens
- `GET /api/v2/auth/me` - Get current user
- `POST /api/v2/auth/mfa/setup` - Setup MFA
- `POST /api/v2/auth/mfa/verify` - Verify MFA code
- `POST /api/v2/auth/mfa/disable` - Disable MFA
- `GET /api/v2/auth/sessions` - List active sessions

#### Portfolios
- `GET /api/v2/portfolios` - List portfolios
- `POST /api/v2/portfolios` - Create portfolio
- `GET /api/v2/portfolios/:id` - Get portfolio
- `PUT /api/v2/portfolios/:id` - Update portfolio
- `DELETE /api/v2/portfolios/:id` - Delete portfolio
- `POST /api/v2/portfolios/:id/investments` - Add investment
- `POST /api/v2/portfolios/:id/share` - Share portfolio

#### Market Data
- `GET /api/v2/market/quote/:symbol` - Get quote
- `POST /api/v2/market/quotes` - Batch quotes
- `GET /api/v2/market/historical/:symbol` - Historical data
- `GET /api/v2/market/fundamentals/:symbol` - Company fundamentals
- `GET /api/v2/market/search` - Search symbols
- `WS /api/v2/market/stream` - Real-time prices

#### Analytics
- `GET /api/v2/analytics/portfolio/:id` - Portfolio analytics
- `GET /api/v2/analytics/portfolio/:id/risk` - Risk analysis
- `POST /api/v2/analytics/portfolio/:id/rebalance` - Rebalancing
- `GET /api/v2/analytics/portfolio/:id/tax` - Tax analysis
- `POST /api/v2/analytics/portfolio/:id/scenario` - Monte Carlo

### GraphQL API

Access GraphQL playground at `/graphql` in development mode.

```graphql
# Example queries
query {
  portfolios {
    items {
      id
      name
      totalValue
      investments {
        symbol
        currentValue
        gainPercent
      }
    }
  }
}

mutation {
  createPortfolio(input: {
    name: "My Portfolio"
    currency: "USD"
  }) {
    id
    name
  }
}
```

### Monitoring Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with metrics
- `GET /metrics` - Prometheus metrics
- `GET /api/version` - API version info

## Features

### Security
- **Password hashing**: Argon2id (memory-hard)
- **JWT tokens**: 15min access, 7-day refresh with rotation
- **MFA**: TOTP-based with backup codes
- **Rate limiting**: Per-user sliding window with Redis
- **Input validation**: Zod schemas

### Email Service
Multi-provider support (SendGrid, SES, Resend, SMTP):
- Email verification
- Password reset
- MFA enabled notifications
- Price alerts
- Weekly portfolio reports
- Login alerts

### Background Jobs (BullMQ)
- **Email queue**: Async email sending
- **Portfolio queue**: Daily snapshots
- **Alerts queue**: Price monitoring (every 5 min)
- **Reports queue**: Weekly summary generation
- **Cleanup queue**: Token/session cleanup

### API Versioning
Supports multiple versioning strategies:
- URL path: `/api/v2/portfolios`
- Accept header: `Accept: application/vnd.portfolio.v2+json`
- Custom header: `X-API-Version: 2.0`
- Query param: `?api-version=2.0`

### Metrics (Prometheus)
Exposes metrics for:
- HTTP requests (count, latency, in-progress)
- Authentication (login, register, MFA)
- Portfolio operations
- Market data (cache hits/misses, latency)
- Background jobs (processed, duration)
- Database and Redis operations
- Rate limiting
- WebSocket connections

## Database

PostgreSQL with Prisma ORM.

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```
