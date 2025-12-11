-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('STOCK', 'BOND', 'ETF', 'MUTUAL_FUND', 'CRYPTO', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'EDIT', 'ADMIN');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE', 'PERFORMANCE', 'RISK', 'REBALANCE', 'TAX', 'NEWS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TradeIdeaStatus" AS ENUM ('WATCHING', 'ACTIVE', 'CLOSED', 'STOPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "mfa_secret" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "purchase_price" DECIMAL(18,8) NOT NULL,
    "purchase_date" DATE NOT NULL,
    "sector" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "fees" DECIMAL(18,8),
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_shares" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_activities" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_value" DECIMAL(18,2) NOT NULL,
    "total_invested" DECIMAL(18,2) NOT NULL,
    "daily_change" DECIMAL(18,2),
    "holdings" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target_price" DECIMAL(18,8),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_ideas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TradeIdeaStatus" NOT NULL,
    "entry_price" DECIMAL(18,8),
    "exit_price" DECIMAL(18,8),
    "target_price" DECIMAL(18,8) NOT NULL,
    "stop_loss" DECIMAL(18,8) NOT NULL,
    "conviction" INTEGER NOT NULL,
    "time_horizon" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "entry_rationale" TEXT NOT NULL,
    "exit_rationale" TEXT,
    "tags" TEXT[],
    "catalysts" TEXT[],
    "risks" TEXT[],
    "notes" TEXT,
    "entry_date" TIMESTAMP(3),
    "exit_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "symbols" TEXT[],
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_cache" (
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "change" DECIMAL(18,8) NOT NULL,
    "change_percent" DECIMAL(10,4) NOT NULL,
    "volume" BIGINT,
    "market_cap" BIGINT,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_cache_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "portfolios_owner_id_idx" ON "portfolios"("owner_id");

-- CreateIndex
CREATE INDEX "investments_portfolio_id_idx" ON "investments"("portfolio_id");

-- CreateIndex
CREATE INDEX "investments_symbol_idx" ON "investments"("symbol");

-- CreateIndex
CREATE INDEX "transactions_investment_id_idx" ON "transactions"("investment_id");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "portfolio_shares_user_id_idx" ON "portfolio_shares"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_shares_portfolio_id_user_id_key" ON "portfolio_shares"("portfolio_id", "user_id");

-- CreateIndex
CREATE INDEX "portfolio_activities_portfolio_id_idx" ON "portfolio_activities"("portfolio_id");

-- CreateIndex
CREATE INDEX "portfolio_activities_created_at_idx" ON "portfolio_activities"("created_at" DESC);

-- CreateIndex
CREATE INDEX "portfolio_snapshots_portfolio_id_date_idx" ON "portfolio_snapshots"("portfolio_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_snapshots_portfolio_id_date_key" ON "portfolio_snapshots"("portfolio_id", "date");

-- CreateIndex
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_user_id_symbol_key" ON "watchlist_items"("user_id", "symbol");

-- CreateIndex
CREATE INDEX "alerts_user_id_read_idx" ON "alerts"("user_id", "read");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "trade_ideas_user_id_idx" ON "trade_ideas"("user_id");

-- CreateIndex
CREATE INDEX "trade_ideas_symbol_idx" ON "trade_ideas"("symbol");

-- CreateIndex
CREATE INDEX "trade_ideas_status_idx" ON "trade_ideas"("status");

-- CreateIndex
CREATE INDEX "research_notes_user_id_idx" ON "research_notes"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_shares" ADD CONSTRAINT "portfolio_shares_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_shares" ADD CONSTRAINT "portfolio_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_activities" ADD CONSTRAINT "portfolio_activities_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_activities" ADD CONSTRAINT "portfolio_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_ideas" ADD CONSTRAINT "trade_ideas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
