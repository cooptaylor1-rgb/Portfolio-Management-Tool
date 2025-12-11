import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { Decimal } from '@prisma/client/runtime/library';

// Validation schemas
const portfolioIdSchema = z.object({
  id: z.string().uuid(),
});

const rebalanceSchema = z.object({
  targetAllocation: z.record(z.number().min(0).max(100)).optional(),
});

export async function analyticsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/analytics/portfolio/:id
   * Get comprehensive portfolio analytics
   */
  app.get(
    '/portfolio/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      // Calculate all analytics
      const stats = calculatePortfolioStats(portfolio.investments);
      const allocation = calculateAllocation(portfolio.investments);
      const performance = calculatePerformance(portfolio.investments);
      const risk = calculateRiskMetrics(portfolio.investments);

      return reply.send({
        success: true,
        data: {
          stats,
          allocation,
          performance,
          risk,
        },
      });
    }
  );

  /**
   * GET /api/analytics/portfolio/:id/risk
   * Get detailed risk analysis
   */
  app.get(
    '/portfolio/:id/risk',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      const risk = calculateDetailedRisk(portfolio.investments);

      return reply.send({
        success: true,
        data: { risk },
      });
    }
  );

  /**
   * POST /api/analytics/portfolio/:id/rebalance
   * Get rebalancing recommendations
   */
  app.post(
    '/portfolio/:id/rebalance',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);
      const { targetAllocation } = rebalanceSchema.parse(request.body);

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      const recommendations = calculateRebalanceRecommendations(
        portfolio.investments,
        targetAllocation
      );

      return reply.send({
        success: true,
        data: { recommendations },
      });
    }
  );

  /**
   * GET /api/analytics/portfolio/:id/tax
   * Get tax impact analysis
   */
  app.get(
    '/portfolio/:id/tax',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      const taxAnalysis = calculateTaxImpact(portfolio.investments);

      return reply.send({
        success: true,
        data: { taxAnalysis },
      });
    }
  );

  /**
   * GET /api/analytics/portfolio/:id/correlation
   * Get correlation matrix for portfolio holdings
   */
  app.get(
    '/portfolio/:id/correlation',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      const correlation = calculateCorrelationMatrix(portfolio.investments);

      return reply.send({
        success: true,
        data: { correlation },
      });
    }
  );

  /**
   * POST /api/analytics/portfolio/:id/scenario
   * Run scenario analysis (Monte Carlo simulation)
   */
  app.post(
    '/portfolio/:id/scenario',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { scenarios?: number; horizon?: number };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { id: portfolioId } = portfolioIdSchema.parse(request.params);
      const { scenarios = 1000, horizon = 252 } = request.body || {};

      const portfolio = await getPortfolioWithAccess(portfolioId, userId);

      const simulation = runMonteCarloSimulation(portfolio.investments, scenarios, horizon);

      return reply.send({
        success: true,
        data: { simulation },
      });
    }
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getPortfolioWithAccess(portfolioId: string, userId: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      investments: true,
      shares: { where: { userId } },
    },
  });

  if (!portfolio) {
    throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
  }

  const hasAccess =
    portfolio.ownerId === userId ||
    portfolio.isPublic ||
    portfolio.shares.length > 0;

  if (!hasAccess) {
    throw new ApiError(403, 'ACCESS_DENIED', 'You do not have access to this portfolio');
  }

  return portfolio;
}

interface InvestmentData {
  symbol: string;
  name: string;
  type: string;
  quantity: Decimal;
  purchasePrice: Decimal;
  purchaseDate: Date;
  sector?: string | null;
}

function calculatePortfolioStats(investments: InvestmentData[]) {
  if (investments.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalGainLoss: 0,
      gainLossPercentage: 0,
      averageReturn: 0,
      diversificationScore: 0,
    };
  }

  // Use mock current prices (in production, fetch real prices)
  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    AMZN: 151.8,
    TSLA: 242.5,
    VOO: 425.75,
    SPY: 458.2,
  };

  let totalValue = 0;
  let totalInvested = 0;
  const returns: number[] = [];

  for (const inv of investments) {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;

    const invested = quantity * purchasePrice;
    const value = quantity * currentPrice;
    const returnPct = ((currentPrice - purchasePrice) / purchasePrice) * 100;

    totalInvested += invested;
    totalValue += value;
    returns.push(returnPct);
  }

  const totalGainLoss = totalValue - totalInvested;
  const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const averageReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

  // Simple diversification score based on number of holdings and types
  const uniqueTypes = new Set(investments.map((i) => i.type)).size;
  const uniqueSectors = new Set(investments.filter((i) => i.sector).map((i) => i.sector)).size;
  const diversificationScore = Math.min(
    100,
    investments.length * 10 + uniqueTypes * 15 + uniqueSectors * 10
  );

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
    gainLossPercentage: parseFloat(gainLossPercentage.toFixed(2)),
    averageReturn: parseFloat(averageReturn.toFixed(2)),
    diversificationScore: Math.round(diversificationScore),
  };
}

function calculateAllocation(investments: InvestmentData[]) {
  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    AMZN: 151.8,
    TSLA: 242.5,
    VOO: 425.75,
    SPY: 458.2,
  };

  const byType: Record<string, number> = {};
  const bySector: Record<string, number> = {};
  const byAsset: Array<{ symbol: string; name: string; value: number; percentage: number }> = [];

  let totalValue = 0;

  for (const inv of investments) {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;
    const value = quantity * currentPrice;

    totalValue += value;
    byType[inv.type] = (byType[inv.type] || 0) + value;
    if (inv.sector) {
      bySector[inv.sector] = (bySector[inv.sector] || 0) + value;
    }
    byAsset.push({ symbol: inv.symbol, name: inv.name, value, percentage: 0 });
  }

  // Calculate percentages
  for (const key of Object.keys(byType)) {
    byType[key] = parseFloat(((byType[key] / totalValue) * 100).toFixed(2));
  }
  for (const key of Object.keys(bySector)) {
    bySector[key] = parseFloat(((bySector[key] / totalValue) * 100).toFixed(2));
  }
  for (const asset of byAsset) {
    asset.percentage = parseFloat(((asset.value / totalValue) * 100).toFixed(2));
  }

  return {
    byType,
    bySector,
    byAsset: byAsset.sort((a, b) => b.percentage - a.percentage),
  };
}

function calculatePerformance(investments: InvestmentData[]) {
  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    AMZN: 151.8,
    TSLA: 242.5,
    VOO: 425.75,
    SPY: 458.2,
  };

  const performers = investments.map((inv) => {
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;
    const returnPct = ((currentPrice - purchasePrice) / purchasePrice) * 100;

    return {
      symbol: inv.symbol,
      name: inv.name,
      purchasePrice,
      currentPrice,
      return: parseFloat(returnPct.toFixed(2)),
    };
  });

  const sorted = [...performers].sort((a, b) => b.return - a.return);

  return {
    bestPerformer: sorted[0] || null,
    worstPerformer: sorted[sorted.length - 1] || null,
    allPerformers: sorted,
  };
}

function calculateRiskMetrics(investments: InvestmentData[]) {
  // Simplified risk calculations
  // In production, use historical volatility data
  const volatility = 15 + Math.random() * 10; // Mock 15-25%
  const sharpeRatio = 0.5 + Math.random() * 1.5; // Mock 0.5-2.0
  const beta = 0.8 + Math.random() * 0.4; // Mock 0.8-1.2
  const maxDrawdown = -10 - Math.random() * 20; // Mock -10% to -30%

  // Value at Risk (95% confidence)
  const totalValue = investments.reduce((sum, inv) => {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    return sum + quantity * purchasePrice;
  }, 0);
  const var95 = totalValue * (volatility / 100) * 1.645; // 95% confidence

  // Determine risk level
  let riskLevel: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
  if (volatility < 12) riskLevel = 'conservative';
  else if (volatility > 20) riskLevel = 'aggressive';

  return {
    volatility: parseFloat(volatility.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    beta: parseFloat(beta.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    valueAtRisk95: parseFloat(var95.toFixed(2)),
    riskLevel,
  };
}

function calculateDetailedRisk(investments: InvestmentData[]) {
  const basic = calculateRiskMetrics(investments);

  // Additional risk factors
  const concentrationRisk = calculateConcentrationRisk(investments);
  const sectorRisk = calculateSectorRisk(investments);
  const liquidityRisk = calculateLiquidityRisk(investments);

  return {
    ...basic,
    concentrationRisk,
    sectorRisk,
    liquidityRisk,
    overallRiskScore: Math.round(
      (basic.volatility / 30) * 40 +
        concentrationRisk * 30 +
        sectorRisk * 20 +
        liquidityRisk * 10
    ),
  };
}

function calculateConcentrationRisk(investments: InvestmentData[]) {
  if (investments.length === 0) return 0;

  const values = investments.map((inv) => Number(inv.quantity) * Number(inv.purchasePrice));
  const total = values.reduce((a, b) => a + b, 0);
  const percentages = values.map((v) => (v / total) * 100);

  // Herfindahl-Hirschman Index style
  const hhi = percentages.reduce((sum, pct) => sum + Math.pow(pct, 2), 0);
  return parseFloat((hhi / 100).toFixed(2)); // Normalized 0-100
}

function calculateSectorRisk(investments: InvestmentData[]) {
  const sectors = new Set(investments.filter((i) => i.sector).map((i) => i.sector));
  const sectorCount = sectors.size || 1;

  // More sectors = lower risk
  return parseFloat((100 / sectorCount).toFixed(2));
}

function calculateLiquidityRisk(investments: InvestmentData[]) {
  // Crypto and small caps have higher liquidity risk
  const highRiskTypes = ['CRYPTO', 'OTHER'];
  const highRiskCount = investments.filter((i) => highRiskTypes.includes(i.type)).length;

  return parseFloat(((highRiskCount / Math.max(investments.length, 1)) * 100).toFixed(2));
}

function calculateRebalanceRecommendations(
  investments: InvestmentData[],
  targetAllocation?: Record<string, number>
) {
  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    VOO: 425.75,
  };

  // Default balanced allocation
  const defaultTarget: Record<string, number> = {
    STOCK: 50,
    ETF: 30,
    BOND: 15,
    CRYPTO: 5,
  };

  const target = targetAllocation || defaultTarget;

  // Calculate current allocation by type
  let totalValue = 0;
  const currentByType: Record<string, number> = {};

  for (const inv of investments) {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;
    const value = quantity * currentPrice;

    totalValue += value;
    currentByType[inv.type] = (currentByType[inv.type] || 0) + value;
  }

  // Convert to percentages
  const currentPct: Record<string, number> = {};
  for (const [type, value] of Object.entries(currentByType)) {
    currentPct[type] = (value / totalValue) * 100;
  }

  // Generate recommendations
  const actions: Array<{
    action: 'buy' | 'sell';
    type: string;
    amount: number;
    reason: string;
  }> = [];

  for (const [type, targetPct] of Object.entries(target)) {
    const currentTypePct = currentPct[type] || 0;
    const diff = currentTypePct - targetPct;

    if (Math.abs(diff) > 5) {
      // Only recommend if >5% deviation
      const amount = Math.abs(diff / 100) * totalValue;
      actions.push({
        action: diff > 0 ? 'sell' : 'buy',
        type,
        amount: parseFloat(amount.toFixed(2)),
        reason:
          diff > 0
            ? `Overweight by ${diff.toFixed(1)}% - reduce ${type} exposure`
            : `Underweight by ${Math.abs(diff).toFixed(1)}% - increase ${type} exposure`,
      });
    }
  }

  return {
    currentAllocation: currentPct,
    targetAllocation: target,
    actions,
    isBalanced: actions.length === 0,
  };
}

function calculateTaxImpact(investments: InvestmentData[]) {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    VOO: 425.75,
  };

  const analysis = investments.map((inv) => {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;
    const purchaseDate = new Date(inv.purchaseDate);

    const gainLoss = (currentPrice - purchasePrice) * quantity;
    const isLongTerm = purchaseDate < oneYearAgo;
    const taxRate = isLongTerm ? 0.15 : 0.22;
    const taxImpact = gainLoss > 0 ? gainLoss * taxRate : 0;
    const daysHeld = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      symbol: inv.symbol,
      gainLoss: parseFloat(gainLoss.toFixed(2)),
      isLongTerm,
      taxRate: taxRate * 100,
      taxImpact: parseFloat(taxImpact.toFixed(2)),
      daysHeld,
      daysToLongTerm: isLongTerm ? 0 : Math.max(0, 365 - daysHeld),
    };
  });

  // Tax-loss harvesting opportunities
  const harvestingOpportunities = analysis
    .filter((a) => a.gainLoss < 0)
    .map((a) => ({
      symbol: a.symbol,
      loss: Math.abs(a.gainLoss),
      potentialSavings: Math.abs(a.gainLoss) * 0.22,
    }))
    .sort((a, b) => b.potentialSavings - a.potentialSavings);

  const totalTaxLiability = analysis.reduce((sum, a) => sum + a.taxImpact, 0);
  const totalUnrealizedGains = analysis.filter((a) => a.gainLoss > 0).reduce((sum, a) => sum + a.gainLoss, 0);
  const totalUnrealizedLosses = analysis.filter((a) => a.gainLoss < 0).reduce((sum, a) => sum + Math.abs(a.gainLoss), 0);

  return {
    positions: analysis,
    summary: {
      totalTaxLiability: parseFloat(totalTaxLiability.toFixed(2)),
      totalUnrealizedGains: parseFloat(totalUnrealizedGains.toFixed(2)),
      totalUnrealizedLosses: parseFloat(totalUnrealizedLosses.toFixed(2)),
    },
    harvestingOpportunities,
  };
}

function calculateCorrelationMatrix(investments: InvestmentData[]) {
  // In production, calculate from historical returns
  // For now, return mock correlation data
  const symbols = investments.map((i) => i.symbol);

  const matrix: Record<string, Record<string, number>> = {};

  for (const s1 of symbols) {
    matrix[s1] = {};
    for (const s2 of symbols) {
      if (s1 === s2) {
        matrix[s1][s2] = 1.0;
      } else {
        // Mock correlation based on type similarity
        const inv1 = investments.find((i) => i.symbol === s1);
        const inv2 = investments.find((i) => i.symbol === s2);
        const sameType = inv1?.type === inv2?.type;
        const sameSector = inv1?.sector && inv1.sector === inv2?.sector;

        let correlation = 0.2 + Math.random() * 0.4; // Base 0.2-0.6
        if (sameType) correlation += 0.2;
        if (sameSector) correlation += 0.15;

        matrix[s1][s2] = parseFloat(Math.min(correlation, 0.95).toFixed(2));
      }
    }
  }

  return {
    symbols,
    matrix,
  };
}

function runMonteCarloSimulation(
  investments: InvestmentData[],
  scenarios: number,
  horizon: number
) {
  const currentPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    VOO: 425.75,
  };

  // Calculate initial portfolio value
  let initialValue = 0;
  for (const inv of investments) {
    const quantity = Number(inv.quantity);
    const purchasePrice = Number(inv.purchasePrice);
    const currentPrice = currentPrices[inv.symbol] || purchasePrice;
    initialValue += quantity * currentPrice;
  }

  // Run simulations
  const finalValues: number[] = [];
  const avgReturn = 0.08; // 8% annual return assumption
  const volatility = 0.18; // 18% annual volatility assumption
  const dailyReturn = avgReturn / 252;
  const dailyVol = volatility / Math.sqrt(252);

  for (let s = 0; s < scenarios; s++) {
    let value = initialValue;

    for (let d = 0; d < horizon; d++) {
      // Geometric Brownian Motion
      const randomReturn = dailyReturn + dailyVol * normalRandom();
      value = value * (1 + randomReturn);
    }

    finalValues.push(value);
  }

  // Sort for percentiles
  finalValues.sort((a, b) => a - b);

  const percentile = (p: number) => {
    const index = Math.floor((p / 100) * scenarios);
    return parseFloat(finalValues[Math.min(index, scenarios - 1)].toFixed(2));
  };

  const avgFinalValue = finalValues.reduce((a, b) => a + b, 0) / scenarios;

  return {
    initialValue: parseFloat(initialValue.toFixed(2)),
    scenarios,
    horizon,
    results: {
      mean: parseFloat(avgFinalValue.toFixed(2)),
      median: percentile(50),
      percentile5: percentile(5),
      percentile25: percentile(25),
      percentile75: percentile(75),
      percentile95: percentile(95),
      minValue: parseFloat(finalValues[0].toFixed(2)),
      maxValue: parseFloat(finalValues[scenarios - 1].toFixed(2)),
    },
    probabilityOfLoss: parseFloat(
      ((finalValues.filter((v) => v < initialValue).length / scenarios) * 100).toFixed(2)
    ),
  };
}

// Standard normal random using Box-Muller transform
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
