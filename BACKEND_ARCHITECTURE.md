# Backend Architecture Proposal

> **Author**: Backend Engineering Assessment  
> **Date**: December 2024  
> **Status**: Proposal

## Executive Summary

The current application is a **client-only SPA** with all data stored in `localStorage`. This assessment proposes a production-grade backend architecture to support real users, secure authentication, and reliable market data.

---

## Current State Analysis

### 🔴 Critical Security Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Plain-text passwords | `src/services/auth.ts:24` | **CRITICAL** |
| Fake JWT tokens | `src/services/auth.ts:32` | **CRITICAL** |
| API keys in client bundle | `src/services/marketData.ts:12-13` | **HIGH** |
| No CSRF protection | All forms | **HIGH** |
| No rate limiting | All endpoints | **MEDIUM** |

### ⚠️ Architectural Limitations

1. **No data persistence** - localStorage is device-specific and easily cleared
2. **No multi-device sync** - Users can't access portfolio from multiple devices
3. **No real-time updates** - Market data polling is inefficient
4. **No collaboration backend** - Sharing is simulated client-side
5. **No audit trail persistence** - Activities lost on clear

---

## Proposed Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│    React SPA  │  Mobile App (Future)  │  API Consumers                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    API Gateway        │
                    │  (Rate Limiting,      │
                    │   Auth, Routing)      │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐      ┌───────▼───────┐      ┌───────▼───────┐
│ Auth Service  │      │  Portfolio    │      │  Market Data  │
│               │      │   Service     │      │    Service    │
│ - JWT/OAuth   │      │               │      │               │
│ - MFA         │      │ - CRUD        │      │ - Price Feed  │
│ - Sessions    │      │ - Analytics   │      │ - News        │
│ - RBAC        │      │ - Alerts      │      │ - Fundamentals│
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        │              ┌───────▼───────┐              │
        │              │  Event Bus    │              │
        │              │  (Redis/Kafka)│              │
        │              └───────┬───────┘              │
        │                      │                      │
┌───────▼──────────────────────▼──────────────────────▼───────┐
│                        DATA LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │   Redis     │  │    TimescaleDB      │  │
│  │ (Users,     │  │  (Cache,    │  │  (Time-series       │  │
│  │ Portfolios) │  │  Sessions)  │  │   price data)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Specifications

### 1. Authentication Service

**Purpose**: Secure user authentication and authorization

```typescript
// API Endpoints
POST   /api/auth/register     // Create account
POST   /api/auth/login        // Get access + refresh tokens
POST   /api/auth/refresh      // Refresh access token
POST   /api/auth/logout       // Invalidate tokens
POST   /api/auth/mfa/setup    // Enable 2FA
POST   /api/auth/mfa/verify   // Verify 2FA code
GET    /api/auth/sessions     // List active sessions
DELETE /api/auth/sessions/:id // Revoke session
```

**Security Requirements**:
- Passwords hashed with **Argon2id** (memory-hard)
- JWT access tokens (15min expiry)
- Refresh tokens (7 days, rotated on use)
- Rate limiting: 5 login attempts / 15 min
- Account lockout after 10 failed attempts
- TOTP-based MFA support

**Database Schema**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mfa_secret VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

### 2. Portfolio Service

**Purpose**: Portfolio CRUD, analytics, and collaboration

```typescript
// API Endpoints
GET    /api/portfolios                    // List user's portfolios
POST   /api/portfolios                    // Create portfolio
GET    /api/portfolios/:id                // Get portfolio details
PUT    /api/portfolios/:id                // Update portfolio
DELETE /api/portfolios/:id                // Delete portfolio

// Investments
POST   /api/portfolios/:id/investments    // Add investment
PUT    /api/portfolios/:id/investments/:investmentId
DELETE /api/portfolios/:id/investments/:investmentId

// Analytics
GET    /api/portfolios/:id/analytics      // Performance metrics
GET    /api/portfolios/:id/risk           // Risk analysis
GET    /api/portfolios/:id/allocation     // Asset allocation
GET    /api/portfolios/:id/rebalance      // Rebalancing suggestions

// Collaboration
POST   /api/portfolios/:id/share          // Share with user
DELETE /api/portfolios/:id/share/:userId  // Remove access
GET    /api/portfolios/:id/activity       // Audit trail
```

**Database Schema**:
```sql
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    purchase_price DECIMAL(18, 8) NOT NULL,
    purchase_date DATE NOT NULL,
    sector VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, user_id)
);

CREATE TABLE portfolio_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_investments_portfolio ON investments(portfolio_id);
CREATE INDEX idx_investments_symbol ON investments(symbol);
CREATE INDEX idx_portfolio_shares_user ON portfolio_shares(user_id);
CREATE INDEX idx_activities_portfolio ON portfolio_activities(portfolio_id);
CREATE INDEX idx_activities_created ON portfolio_activities(created_at DESC);
```

---

### 3. Market Data Service

**Purpose**: Real-time and historical market data with caching

```typescript
// API Endpoints
GET    /api/market/quote/:symbol          // Current price
GET    /api/market/quotes                 // Batch quotes (POST symbols)
GET    /api/market/historical/:symbol     // Historical OHLCV
GET    /api/market/fundamentals/:symbol   // Company fundamentals
GET    /api/market/news                   // Market news
GET    /api/market/search                 // Symbol search

// WebSocket
WS     /api/market/stream                 // Real-time price updates
```

**Caching Strategy**:
```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│  L1: In-Memory (Node.js)  │  TTL: 5 seconds   │  Hot data  │
│  L2: Redis                │  TTL: 60 seconds  │  Quotes    │
│  L3: TimescaleDB          │  Permanent        │  Historical│
└─────────────────────────────────────────────────────────────┘
```

**Data Provider Abstraction**:
```typescript
interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getHistorical(symbol: string, from: Date, to: Date): Promise<OHLCV[]>;
  getFundamentals(symbol: string): Promise<Fundamentals>;
  searchSymbol(query: string): Promise<SearchResult[]>;
}

// Implementations with fallback chain
class FactSetProvider implements MarketDataProvider { ... }
class AlphaVantageProvider implements MarketDataProvider { ... }
class YahooFinanceProvider implements MarketDataProvider { ... }

// Provider chain with circuit breaker
const marketData = new ProviderChain([
  new CircuitBreaker(new FactSetProvider()),
  new CircuitBreaker(new AlphaVantageProvider()),
  new CircuitBreaker(new YahooFinanceProvider()),
]);
```

---

### 4. Analytics Service

**Purpose**: Compute portfolio analytics and risk metrics

```typescript
// Capabilities
- Portfolio performance calculation (TWR, MWR)
- Risk metrics (VaR, CVaR, Sharpe, Sortino, Beta)
- Correlation analysis
- Monte Carlo simulations
- Factor exposure analysis
- Rebalancing optimization
```

**Background Jobs**:
```typescript
// Scheduled jobs (Bull Queue + Redis)
- Daily: Update all portfolio valuations
- Daily: Generate daily performance snapshots
- Weekly: Risk report generation
- Monthly: Tax lot optimization suggestions
```

---

## Infrastructure

### Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| API Framework | **Node.js + Fastify** | High performance, TypeScript native |
| Database | **PostgreSQL 15** | ACID, JSON support, mature |
| Time-series | **TimescaleDB** | Built on Postgres, compression |
| Cache | **Redis 7** | Sessions, rate limiting, pub/sub |
| Queue | **BullMQ** | Reliable job processing |
| Search | **Meilisearch** | Fast symbol/company search |
| API Gateway | **Kong** | Rate limiting, auth, monitoring |

### Deployment Architecture

```yaml
# docker-compose.yml (Development)
services:
  api:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://...
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [postgres, redis]

  postgres:
    image: timescale/timescaledb:latest-pg15
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: portfolio
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]

  worker:
    build: ./backend
    command: npm run worker
    depends_on: [postgres, redis]
```

### Production (Kubernetes)

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ API Pod │  │ API Pod │  │ API Pod │  │ Worker  │        │
│  │ (3 rep) │  │ (3 rep) │  │ (3 rep) │  │ (2 rep) │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│  ┌────▼────────────▼────────────▼────────────▼────┐        │
│  │              Ingress Controller                 │        │
│  │         (TLS termination, routing)              │        │
│  └─────────────────────┬───────────────────────────┘        │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Managed Services                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ RDS/Cloud   │  │ ElastiCache │  │  S3 / Cloud Storage │  │
│  │   SQL       │  │   Redis     │  │   (Backups, Files)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Implementation

### API Security Checklist

- [ ] **Authentication**: JWT with RS256, refresh token rotation
- [ ] **Authorization**: RBAC with portfolio-level permissions  
- [ ] **Input Validation**: Zod schemas for all inputs
- [ ] **Rate Limiting**: Per-user and per-IP limits
- [ ] **CORS**: Whitelist allowed origins
- [ ] **HTTPS**: TLS 1.3 only, HSTS headers
- [ ] **SQL Injection**: Parameterized queries (Prisma/Drizzle)
- [ ] **XSS**: Content-Security-Policy headers
- [ ] **Secrets**: Vault or AWS Secrets Manager
- [ ] **Logging**: Structured logs, PII redaction
- [ ] **Monitoring**: Error tracking (Sentry), APM

### Secret Management

```typescript
// ❌ Current (insecure)
const FACTSET_API_KEY = import.meta.env.VITE_FACTSET_API_KEY;

// ✅ Proposed (server-side only)
// backend/src/config/secrets.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secrets = await secretsManager.getSecretValue({
  SecretId: 'portfolio-app/production'
});

export const config = {
  factset: {
    username: secrets.FACTSET_USERNAME,
    apiKey: secrets.FACTSET_API_KEY,
  },
  openai: {
    apiKey: secrets.OPENAI_API_KEY,
  }
};
```

---

## Migration Plan

### Phase 1: Foundation (Week 1-2)
1. Set up PostgreSQL with schema migrations
2. Implement auth service with proper JWT
3. Create portfolio CRUD endpoints
4. Add Redis for session management

### Phase 2: Data Migration (Week 3)
1. Build localStorage → API migration script
2. Add data import/export endpoints
3. Implement optimistic UI updates

### Phase 3: Market Data (Week 4-5)
1. Build market data proxy service
2. Implement caching layer
3. Add WebSocket for real-time updates

### Phase 4: Analytics (Week 6)
1. Move analytics calculations server-side
2. Add background job processing
3. Implement email alerts

### Phase 5: Production (Week 7-8)
1. Set up CI/CD pipeline
2. Configure monitoring and alerting
3. Load testing and optimization
4. Security audit

---

## API Design Patterns

### Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-11T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  },
  "meta": {
    "timestamp": "2024-12-11T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination

```typescript
GET /api/portfolios?page=1&limit=20&sort=-createdAt

{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

## ✅ Implementation Status

All priority items P0-P3 have been implemented:

### P0 - Critical Security (Implemented)

| Feature | File | Description |
|---------|------|-------------|
| Email Verification | `src/services/email.ts` | Multi-provider email with verification templates |
| MFA/TOTP | `src/services/mfa.ts` | RFC 6238 TOTP with backup codes |

### P1 - Core Functionality (Implemented)

| Feature | File | Description |
|---------|------|-------------|
| Background Jobs | `src/services/jobs.ts` | BullMQ with 5 queue types, scheduled tasks |
| Email Notifications | `src/services/email.ts` | Price alerts, weekly reports, login alerts |

### P2 - Operations (Implemented)

| Feature | File | Description |
|---------|------|-------------|
| Rate Limiting | `src/middleware/rateLimit.ts` | Per-user/IP sliding window with Redis |
| Prometheus Metrics | `src/services/metrics.ts` | HTTP, auth, portfolio, job metrics |

### P3 - Developer Experience (Implemented)

| Feature | File | Description |
|---------|------|-------------|
| GraphQL API | `src/graphql/` | Full schema with Mercurius |
| API Versioning | `src/middleware/versioning.ts` | URL/header versioning, v1/v2 support |

---

## New Features Enabled by Backend

With a proper backend, we can add:

1. **Multi-device sync** - Access portfolio anywhere
2. **Email alerts** - Price targets, rebalancing reminders
3. **Scheduled reports** - Weekly/monthly PDF reports
4. **API access** - Let power users build integrations
5. **Team accounts** - Shared portfolios for advisors
6. **Audit compliance** - Full activity history
7. **Data export** - Tax reports, performance history
8. **Mobile app** - Share backend with native apps

---

## Cost Estimation (Production)

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| Compute (EKS/GKE) | 3x m5.large | ~$200 |
| PostgreSQL (RDS) | db.t3.medium | ~$60 |
| Redis (ElastiCache) | cache.t3.small | ~$25 |
| Load Balancer | ALB | ~$20 |
| Storage (S3) | 100GB | ~$3 |
| Market Data API | FactSet/IEX | $100-500 |
| **Total** | | **~$400-800/mo** |

---

## Next Steps

1. **Review and approve** this architecture proposal
2. **Set up** development environment with Docker Compose
3. **Create** database migrations and seed data
4. **Implement** auth service first (highest security impact)
5. **Iterate** with frontend team on API contracts

---

*This document should be treated as a living specification and updated as implementation proceeds.*
