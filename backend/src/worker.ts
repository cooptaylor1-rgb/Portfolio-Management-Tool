/**
 * Background Worker Entry Point
 * 
 * Runs background job processors for:
 * - Email sending
 * - Portfolio snapshots
 * - Price alerts
 * - Reports generation
 * - Cleanup tasks
 */

import { config } from './config/index.js';
import {
  createEmailWorker,
  createPortfolioWorker,
  createAlertsWorker,
  createReportsWorker,
  createCleanupWorker,
  scheduleRecurringJobs,
} from './services/jobs.js';

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Portfolio Manager - Background Worker                ║
╠═══════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(44)}║
╚═══════════════════════════════════════════════════════════════╝
`);

// Create workers
const workers = [
  createEmailWorker(),
  createPortfolioWorker(),
  createAlertsWorker(),
  createReportsWorker(),
  createCleanupWorker(),
];

// Log worker events
workers.forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.name} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.name} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
});

// Schedule recurring jobs
scheduleRecurringJobs().catch(console.error);

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down workers...');
  
  await Promise.all(workers.map((w) => w.close()));
  
  console.log('✅ Workers shut down gracefully');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('🚀 Background workers started');
console.log('   - Email Worker');
console.log('   - Portfolio Worker');
console.log('   - Alerts Worker');
console.log('   - Reports Worker');
console.log('   - Cleanup Worker');
