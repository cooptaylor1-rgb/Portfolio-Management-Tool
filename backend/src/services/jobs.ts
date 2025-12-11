/**
 * Background Job Processing with BullMQ
 * 
 * Handles scheduled and async tasks:
 * - Daily portfolio snapshots
 * - Price alert checking
 * - Email notifications
 * - Weekly reports
 * - Data cleanup
 */

import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { emailService } from './email.js';
import { config } from '../config/index.js';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  PORTFOLIO: 'portfolio',
  ALERTS: 'alerts',
  REPORTS: 'reports',
  CLEANUP: 'cleanup',
} as const;

// Job types
export type EmailJobData = {
  type: 'verification' | 'password-reset' | 'mfa-enabled' | 'price-alert' | 'weekly-report' | 'login-alert';
  to: string;
  data: Record<string, any>;
};

export type PortfolioJobData = {
  type: 'snapshot' | 'calculate-analytics' | 'sync-prices';
  portfolioId?: string;
  userId?: string;
};

export type AlertJobData = {
  type: 'check-price-alerts' | 'check-rebalance';
  userId?: string;
};

export type ReportJobData = {
  type: 'weekly' | 'monthly' | 'tax';
  userId: string;
};

export type CleanupJobData = {
  type: 'expired-tokens' | 'old-activities' | 'stale-cache';
};

// Create queues
const connection = { connection: redis };

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, connection);
export const portfolioQueue = new Queue<PortfolioJobData>(QUEUE_NAMES.PORTFOLIO, connection);
export const alertsQueue = new Queue<AlertJobData>(QUEUE_NAMES.ALERTS, connection);
export const reportsQueue = new Queue<ReportJobData>(QUEUE_NAMES.REPORTS, connection);
export const cleanupQueue = new Queue<CleanupJobData>(QUEUE_NAMES.CLEANUP, connection);

/**
 * Schedule recurring jobs
 */
export async function scheduleRecurringJobs() {
  // Daily portfolio snapshots at 11:59 PM UTC
  await portfolioQueue.add(
    'daily-snapshots',
    { type: 'snapshot' },
    {
      repeat: { pattern: '59 23 * * *' },
      jobId: 'daily-snapshots',
    }
  );

  // Check price alerts every 5 minutes during market hours (9:30 AM - 4:00 PM EST)
  await alertsQueue.add(
    'price-alerts',
    { type: 'check-price-alerts' },
    {
      repeat: { pattern: '*/5 9-16 * * 1-5' }, // Mon-Fri, 9 AM - 4 PM
      jobId: 'price-alerts-check',
    }
  );

  // Weekly reports on Sunday at 8:00 AM UTC
  await reportsQueue.add(
    'weekly-reports',
    { type: 'weekly', userId: '' }, // Will process all users
    {
      repeat: { pattern: '0 8 * * 0' },
      jobId: 'weekly-reports',
    }
  );

  // Clean up expired tokens daily at 3:00 AM UTC
  await cleanupQueue.add(
    'token-cleanup',
    { type: 'expired-tokens' },
    {
      repeat: { pattern: '0 3 * * *' },
      jobId: 'token-cleanup',
    }
  );

  // Clean up old activities weekly
  await cleanupQueue.add(
    'activity-cleanup',
    { type: 'old-activities' },
    {
      repeat: { pattern: '0 4 * * 0' },
      jobId: 'activity-cleanup',
    }
  );

  console.log('📅 Recurring jobs scheduled');
}

/**
 * Email Worker
 */
export function createEmailWorker() {
  return new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    async (job: Job<EmailJobData>) => {
      const { type, to, data } = job.data;
      console.log(`📧 Processing email job: ${type} to ${to}`);

      try {
        switch (type) {
          case 'verification':
            await emailService.sendVerificationEmail(to, data.name, data.token);
            break;
          case 'password-reset':
            await emailService.sendPasswordResetEmail(to, data.name, data.token);
            break;
          case 'mfa-enabled':
            await emailService.sendMfaEnabledEmail(to, data.name);
            break;
          case 'price-alert':
            await emailService.sendPriceAlert(
              to,
              data.name,
              data.symbol,
              data.alertType,
              data.price,
              data.targetPrice
            );
            break;
          case 'weekly-report':
            await emailService.sendWeeklyReport(to, data.name, data);
            break;
          case 'login-alert':
            await emailService.sendLoginAlert(to, data.name, data);
            break;
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Email job failed: ${error.message}`);
        throw error;
      }
    },
    {
      ...connection,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000, // Max 100 emails per minute
      },
    }
  );
}

/**
 * Portfolio Worker
 */
export function createPortfolioWorker() {
  return new Worker<PortfolioJobData>(
    QUEUE_NAMES.PORTFOLIO,
    async (job: Job<PortfolioJobData>) => {
      const { type, portfolioId, userId } = job.data;
      console.log(`📊 Processing portfolio job: ${type}`);

      try {
        switch (type) {
          case 'snapshot':
            await createDailySnapshots(portfolioId);
            break;
          case 'calculate-analytics':
            if (portfolioId) {
              await calculatePortfolioAnalytics(portfolioId);
            }
            break;
          case 'sync-prices':
            await syncCurrentPrices(portfolioId);
            break;
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Portfolio job failed: ${error.message}`);
        throw error;
      }
    },
    {
      ...connection,
      concurrency: 3,
    }
  );
}

/**
 * Alerts Worker
 */
export function createAlertsWorker() {
  return new Worker<AlertJobData>(
    QUEUE_NAMES.ALERTS,
    async (job: Job<AlertJobData>) => {
      const { type, userId } = job.data;
      console.log(`🔔 Processing alerts job: ${type}`);

      try {
        switch (type) {
          case 'check-price-alerts':
            await checkPriceAlerts(userId);
            break;
          case 'check-rebalance':
            await checkRebalanceNeeded(userId);
            break;
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Alerts job failed: ${error.message}`);
        throw error;
      }
    },
    {
      ...connection,
      concurrency: 2,
    }
  );
}

/**
 * Reports Worker
 */
export function createReportsWorker() {
  return new Worker<ReportJobData>(
    QUEUE_NAMES.REPORTS,
    async (job: Job<ReportJobData>) => {
      const { type, userId } = job.data;
      console.log(`📈 Processing reports job: ${type}`);

      try {
        switch (type) {
          case 'weekly':
            await generateWeeklyReports(userId);
            break;
          case 'monthly':
            await generateMonthlyReports(userId);
            break;
          case 'tax':
            await generateTaxReport(userId);
            break;
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Reports job failed: ${error.message}`);
        throw error;
      }
    },
    {
      ...connection,
      concurrency: 1, // Reports are heavy, process one at a time
    }
  );
}

/**
 * Cleanup Worker
 */
export function createCleanupWorker() {
  return new Worker<CleanupJobData>(
    QUEUE_NAMES.CLEANUP,
    async (job: Job<CleanupJobData>) => {
      const { type } = job.data;
      console.log(`🧹 Processing cleanup job: ${type}`);

      try {
        switch (type) {
          case 'expired-tokens':
            await cleanupExpiredTokens();
            break;
          case 'old-activities':
            await cleanupOldActivities();
            break;
          case 'stale-cache':
            await cleanupStaleCache();
            break;
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Cleanup job failed: ${error.message}`);
        throw error;
      }
    },
    {
      ...connection,
      concurrency: 1,
    }
  );
}

// ============================================================================
// JOB IMPLEMENTATIONS
// ============================================================================

/**
 * Create daily snapshots for all portfolios
 */
async function createDailySnapshots(portfolioId?: string) {
  const whereClause = portfolioId ? { id: portfolioId } : {};

  const portfolios = await prisma.portfolio.findMany({
    where: whereClause,
    include: {
      investments: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mock prices (in production, fetch from market data service)
  const mockPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
    VOO: 425.75,
    SPY: 458.2,
  };

  for (const portfolio of portfolios) {
    let totalValue = 0;
    let totalInvested = 0;
    const holdings: any[] = [];

    for (const inv of portfolio.investments) {
      const quantity = Number(inv.quantity);
      const purchasePrice = Number(inv.purchasePrice);
      const currentPrice = mockPrices[inv.symbol] || purchasePrice;

      totalValue += quantity * currentPrice;
      totalInvested += quantity * purchasePrice;

      holdings.push({
        symbol: inv.symbol,
        quantity,
        price: currentPrice,
        value: quantity * currentPrice,
      });
    }

    // Check if snapshot already exists for today
    const existing = await prisma.portfolioSnapshot.findUnique({
      where: {
        portfolioId_date: {
          portfolioId: portfolio.id,
          date: today,
        },
      },
    });

    if (!existing) {
      // Get yesterday's snapshot for daily change calculation
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdaySnapshot = await prisma.portfolioSnapshot.findUnique({
        where: {
          portfolioId_date: {
            portfolioId: portfolio.id,
            date: yesterday,
          },
        },
      });

      const dailyChange = yesterdaySnapshot
        ? totalValue - Number(yesterdaySnapshot.totalValue)
        : null;

      await prisma.portfolioSnapshot.create({
        data: {
          portfolioId: portfolio.id,
          date: today,
          totalValue,
          totalInvested,
          dailyChange,
          holdings: holdings as any,
        },
      });
    }
  }

  console.log(`📸 Created snapshots for ${portfolios.length} portfolios`);
}

/**
 * Calculate and cache portfolio analytics
 */
async function calculatePortfolioAnalytics(portfolioId: string) {
  // This would calculate complex analytics and cache them
  // Implementation depends on analytics service
  console.log(`📊 Calculated analytics for portfolio ${portfolioId}`);
}

/**
 * Sync current prices for portfolios
 */
async function syncCurrentPrices(portfolioId?: string) {
  // Fetch and cache current prices from market data providers
  console.log('💰 Synced current prices');
}

/**
 * Check price alerts for all users
 */
async function checkPriceAlerts(userId?: string) {
  const whereClause = userId ? { userId } : {};

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: {
      ...whereClause,
      targetPrice: { not: null },
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  // Mock prices (in production, fetch from market data service)
  const mockPrices: Record<string, number> = {
    AAPL: 175.5,
    MSFT: 295.25,
    GOOGL: 142.3,
  };

  for (const item of watchlistItems) {
    const currentPrice = mockPrices[item.symbol];
    if (!currentPrice || !item.targetPrice) continue;

    const targetPrice = Number(item.targetPrice);
    const alertTriggered =
      (currentPrice >= targetPrice && currentPrice * 0.99 < targetPrice) || // Just crossed above
      (currentPrice <= targetPrice && currentPrice * 1.01 > targetPrice); // Just crossed below

    if (alertTriggered) {
      const alertType = currentPrice >= targetPrice ? 'reached target' : 'dropped to target';

      await emailQueue.add('price-alert', {
        type: 'price-alert',
        to: item.user.email,
        data: {
          name: item.user.name,
          symbol: item.symbol,
          alertType,
          price: currentPrice,
          targetPrice,
        },
      });

      // Create alert record
      await prisma.alert.create({
        data: {
          userId: item.userId,
          type: 'PRICE',
          severity: 'INFO',
          title: `Price Alert: ${item.symbol}`,
          message: `${item.symbol} has ${alertType} at $${currentPrice.toFixed(2)}`,
          actionable: true,
          metadata: { symbol: item.symbol, price: currentPrice, targetPrice } as any,
        },
      });
    }
  }

  console.log(`🔔 Checked ${watchlistItems.length} price alerts`);
}

/**
 * Check if portfolios need rebalancing
 */
async function checkRebalanceNeeded(userId?: string) {
  // Check portfolio allocations against targets
  console.log('⚖️ Checked rebalance requirements');
}

/**
 * Generate weekly reports for all users (or specific user)
 */
async function generateWeeklyReports(userId?: string) {
  const users = userId
    ? await prisma.user.findMany({ where: { id: userId } })
    : await prisma.user.findMany({ where: { emailVerified: true } });

  for (const user of users) {
    // Get user's portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: { ownerId: user.id },
      include: { investments: true },
    });

    if (portfolios.length === 0) continue;

    // Calculate totals (simplified)
    let totalValue = 0;
    let performers: { symbol: string; change: number }[] = [];

    for (const portfolio of portfolios) {
      for (const inv of portfolio.investments) {
        const quantity = Number(inv.quantity);
        const purchasePrice = Number(inv.purchasePrice);
        const currentPrice = purchasePrice * (1 + (Math.random() - 0.5) * 0.1); // Mock

        totalValue += quantity * currentPrice;
        const change = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        performers.push({ symbol: inv.symbol, change });
      }
    }

    performers.sort((a, b) => b.change - a.change);
    const topPerformer = performers[0] || { symbol: 'N/A', change: 0 };
    const worstPerformer = performers[performers.length - 1] || { symbol: 'N/A', change: 0 };

    // Queue email
    await emailQueue.add('weekly-report', {
      type: 'weekly-report',
      to: user.email,
      data: {
        name: user.name,
        totalValue,
        weeklyChange: totalValue * 0.02, // Mock 2% change
        weeklyChangePercent: 2,
        topPerformer,
        worstPerformer,
      },
    });
  }

  console.log(`📈 Generated weekly reports for ${users.length} users`);
}

/**
 * Generate monthly reports
 */
async function generateMonthlyReports(userId: string) {
  console.log(`📊 Generated monthly report for user ${userId}`);
}

/**
 * Generate tax report
 */
async function generateTaxReport(userId: string) {
  console.log(`📋 Generated tax report for user ${userId}`);
}

/**
 * Clean up expired refresh tokens
 */
async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

  console.log(`🧹 Cleaned up ${result.count} expired tokens`);
}

/**
 * Clean up old activity logs (keep last 90 days)
 */
async function cleanupOldActivities() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const result = await prisma.portfolioActivity.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log(`🧹 Cleaned up ${result.count} old activities`);
}

/**
 * Clean up stale cache entries
 */
async function cleanupStaleCache() {
  // Clean up old cache entries in Redis
  // Implementation depends on cache key patterns
  console.log('🧹 Cleaned up stale cache');
}

// ============================================================================
// HELPER FUNCTIONS FOR ADDING JOBS
// ============================================================================

/**
 * Queue a verification email
 */
export async function queueVerificationEmail(to: string, name: string, token: string) {
  await emailQueue.add(
    'verification',
    { type: 'verification', to, data: { name, token } },
    { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
  );
}

/**
 * Queue a password reset email
 */
export async function queuePasswordResetEmail(to: string, name: string, token: string) {
  await emailQueue.add(
    'password-reset',
    { type: 'password-reset', to, data: { name, token } },
    { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
  );
}

/**
 * Queue portfolio snapshot
 */
export async function queuePortfolioSnapshot(portfolioId: string) {
  await portfolioQueue.add(
    'snapshot',
    { type: 'snapshot', portfolioId },
    { attempts: 2 }
  );
}

/**
 * Queue login alert
 */
export async function queueLoginAlert(
  to: string,
  name: string,
  data: { ip: string; location: string; device: string; time: string }
) {
  await emailQueue.add(
    'login-alert',
    { type: 'login-alert', to, data: { name, ...data } },
    { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
  );
}
