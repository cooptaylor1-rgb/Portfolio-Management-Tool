/**
 * Prometheus Metrics Service
 * 
 * Exposes application metrics for monitoring and alerting.
 * Compatible with Prometheus, Grafana, and other observability tools.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Metric types
interface Counter {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

interface Gauge {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

interface Histogram {
  name: string;
  help: string;
  labels: string[];
  buckets: number[];
  values: Map<string, { sum: number; count: number; buckets: number[] }>;
}

// Metric registry
class MetricsRegistry {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();

  // ============================================================================
  // COUNTER METHODS
  // ============================================================================

  createCounter(name: string, help: string, labels: string[] = []): void {
    this.counters.set(name, { name, help, labels, values: new Map() });
  }

  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const counter = this.counters.get(name);
    if (!counter) return;

    const key = this.labelsToKey(labels);
    const current = counter.values.get(key) || 0;
    counter.values.set(key, current + value);
  }

  // ============================================================================
  // GAUGE METHODS
  // ============================================================================

  createGauge(name: string, help: string, labels: string[] = []): void {
    this.gauges.set(name, { name, help, labels, values: new Map() });
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    gauge.values.set(key, value);
  }

  incrementGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    const current = gauge.values.get(key) || 0;
    gauge.values.set(key, current + value);
  }

  decrementGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    this.incrementGauge(name, labels, -value);
  }

  // ============================================================================
  // HISTOGRAM METHODS
  // ============================================================================

  createHistogram(
    name: string,
    help: string,
    labels: string[] = [],
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    this.histograms.set(name, { name, help, labels, buckets, values: new Map() });
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const key = this.labelsToKey(labels);
    let data = histogram.values.get(key);

    if (!data) {
      data = { sum: 0, count: 0, buckets: new Array(histogram.buckets.length).fill(0) };
      histogram.values.set(key, data);
    }

    data.sum += value;
    data.count += 1;

    // Update bucket counts
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        data.buckets[i]++;
      }
    }
  }

  // ============================================================================
  // OUTPUT METHODS
  // ============================================================================

  private labelsToKey(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  private keyToLabels(key: string): string {
    return key ? `{${key}}` : '';
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    // Counters
    for (const counter of this.counters.values()) {
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);
      for (const [key, value] of counter.values) {
        lines.push(`${counter.name}${this.keyToLabels(key)} ${value}`);
      }
    }

    // Gauges
    for (const gauge of this.gauges.values()) {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);
      for (const [key, value] of gauge.values) {
        lines.push(`${gauge.name}${this.keyToLabels(key)} ${value}`);
      }
    }

    // Histograms
    for (const histogram of this.histograms.values()) {
      lines.push(`# HELP ${histogram.name} ${histogram.help}`);
      lines.push(`# TYPE ${histogram.name} histogram`);
      for (const [key, data] of histogram.values) {
        const labels = key ? `${key},` : '';
        let cumulativeCount = 0;
        for (let i = 0; i < histogram.buckets.length; i++) {
          cumulativeCount += data.buckets[i];
          lines.push(`${histogram.name}_bucket{${labels}le="${histogram.buckets[i]}"} ${cumulativeCount}`);
        }
        lines.push(`${histogram.name}_bucket{${labels}le="+Inf"} ${data.count}`);
        lines.push(`${histogram.name}_sum${this.keyToLabels(key)} ${data.sum}`);
        lines.push(`${histogram.name}_count${this.keyToLabels(key)} ${data.count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.values.clear();
    }
    for (const gauge of this.gauges.values()) {
      gauge.values.clear();
    }
    for (const histogram of this.histograms.values()) {
      histogram.values.clear();
    }
  }
}

// Create global registry
export const metrics = new MetricsRegistry();

// ============================================================================
// INITIALIZE DEFAULT METRICS
// ============================================================================

// HTTP metrics
metrics.createCounter('http_requests_total', 'Total HTTP requests', ['method', 'path', 'status']);
metrics.createHistogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'path'], [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);
metrics.createGauge('http_requests_in_progress', 'HTTP requests currently in progress', ['method']);

// Auth metrics
metrics.createCounter('auth_login_total', 'Total login attempts', ['status']);
metrics.createCounter('auth_register_total', 'Total registration attempts', ['status']);
metrics.createCounter('auth_mfa_verification_total', 'Total MFA verification attempts', ['status']);
metrics.createGauge('auth_active_sessions', 'Number of active sessions');

// Portfolio metrics
metrics.createCounter('portfolio_operations_total', 'Total portfolio operations', ['operation']);
metrics.createGauge('portfolios_total', 'Total number of portfolios');
metrics.createGauge('investments_total', 'Total number of investments');

// Market data metrics
metrics.createCounter('market_data_requests_total', 'Total market data requests', ['provider', 'status']);
metrics.createHistogram('market_data_latency_seconds', 'Market data request latency', ['provider'], [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]);
metrics.createGauge('market_data_cache_size', 'Number of cached market data entries');
metrics.createCounter('market_data_cache_hits_total', 'Cache hits for market data');
metrics.createCounter('market_data_cache_misses_total', 'Cache misses for market data');

// Background job metrics
metrics.createCounter('jobs_processed_total', 'Total jobs processed', ['queue', 'status']);
metrics.createHistogram('job_duration_seconds', 'Job processing duration', ['queue'], [0.1, 0.5, 1, 5, 10, 30, 60]);
metrics.createGauge('jobs_waiting', 'Jobs waiting in queue', ['queue']);
metrics.createGauge('jobs_active', 'Jobs currently being processed', ['queue']);

// Database metrics
metrics.createHistogram('db_query_duration_seconds', 'Database query duration', ['operation'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]);
metrics.createCounter('db_errors_total', 'Database errors', ['operation']);
metrics.createGauge('db_connections_active', 'Active database connections');

// Redis metrics
metrics.createHistogram('redis_operation_duration_seconds', 'Redis operation duration', ['operation'], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1]);
metrics.createCounter('redis_errors_total', 'Redis errors', ['operation']);

// Rate limiting metrics
metrics.createCounter('rate_limit_exceeded_total', 'Rate limit exceeded events', ['tier']);
metrics.createGauge('rate_limit_current_requests', 'Current request count in window', ['tier']);

// Email metrics
metrics.createCounter('emails_sent_total', 'Total emails sent', ['type', 'status']);

// WebSocket metrics
metrics.createGauge('websocket_connections', 'Active WebSocket connections');
metrics.createCounter('websocket_messages_total', 'Total WebSocket messages', ['direction']);

// System metrics (populated by separate collector)
metrics.createGauge('process_cpu_usage', 'Process CPU usage');
metrics.createGauge('process_memory_bytes', 'Process memory usage in bytes', ['type']);
metrics.createGauge('nodejs_eventloop_lag_seconds', 'Node.js event loop lag');

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Request metrics middleware
 */
export async function metricsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const start = process.hrtime.bigint();
  const method = request.method;
  const path = request.routeOptions?.url || request.url.split('?')[0];

  // Track in-progress requests
  metrics.incrementGauge('http_requests_in_progress', { method });

  // After response is sent
  reply.raw.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9; // Convert to seconds
    const status = reply.statusCode.toString();

    metrics.incrementCounter('http_requests_total', { method, path, status });
    metrics.observeHistogram('http_request_duration_seconds', duration, { method, path });
    metrics.decrementGauge('http_requests_in_progress', { method });
  });
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(request: FastifyRequest, reply: FastifyReply) {
  // Collect current system metrics
  collectSystemMetrics();

  reply.header('Content-Type', 'text/plain; version=0.0.4');
  return metrics.export();
}

/**
 * Collect system metrics
 */
function collectSystemMetrics() {
  // Memory usage
  const memUsage = process.memoryUsage();
  metrics.setGauge('process_memory_bytes', memUsage.heapUsed, { type: 'heap_used' });
  metrics.setGauge('process_memory_bytes', memUsage.heapTotal, { type: 'heap_total' });
  metrics.setGauge('process_memory_bytes', memUsage.rss, { type: 'rss' });
  metrics.setGauge('process_memory_bytes', memUsage.external, { type: 'external' });

  // CPU usage (simplified)
  const cpuUsage = process.cpuUsage();
  const totalCpu = (cpuUsage.user + cpuUsage.system) / 1e6; // Convert to seconds
  metrics.setGauge('process_cpu_usage', totalCpu);
}

/**
 * Register metrics routes
 */
export function registerMetricsRoutes(app: FastifyInstance) {
  // Metrics endpoint (typically scraped by Prometheus)
  app.get('/metrics', metricsHandler);

  // Health check with basic metrics
  app.get('/health/detailed', async () => {
    collectSystemMetrics();
    const memUsage = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      },
    };
  });
}

// ============================================================================
// HELPER FUNCTIONS FOR RECORDING METRICS
// ============================================================================

/**
 * Record a login attempt
 */
export function recordLogin(success: boolean) {
  metrics.incrementCounter('auth_login_total', { status: success ? 'success' : 'failure' });
}

/**
 * Record a registration attempt
 */
export function recordRegistration(success: boolean) {
  metrics.incrementCounter('auth_register_total', { status: success ? 'success' : 'failure' });
}

/**
 * Record an MFA verification attempt
 */
export function recordMfaVerification(success: boolean) {
  metrics.incrementCounter('auth_mfa_verification_total', { status: success ? 'success' : 'failure' });
}

/**
 * Record a portfolio operation
 */
export function recordPortfolioOperation(operation: 'create' | 'update' | 'delete' | 'share') {
  metrics.incrementCounter('portfolio_operations_total', { operation });
}

/**
 * Record a market data request
 */
export function recordMarketDataRequest(provider: string, success: boolean, durationSeconds: number) {
  metrics.incrementCounter('market_data_requests_total', { provider, status: success ? 'success' : 'failure' });
  metrics.observeHistogram('market_data_latency_seconds', durationSeconds, { provider });
}

/**
 * Record cache hit/miss
 */
export function recordCacheHit(hit: boolean) {
  if (hit) {
    metrics.incrementCounter('market_data_cache_hits_total');
  } else {
    metrics.incrementCounter('market_data_cache_misses_total');
  }
}

/**
 * Record a background job
 */
export function recordJob(queue: string, success: boolean, durationSeconds: number) {
  metrics.incrementCounter('jobs_processed_total', { queue, status: success ? 'success' : 'failure' });
  metrics.observeHistogram('job_duration_seconds', durationSeconds, { queue });
}

/**
 * Record database operation
 */
export function recordDbOperation(operation: string, durationSeconds: number, success: boolean) {
  metrics.observeHistogram('db_query_duration_seconds', durationSeconds, { operation });
  if (!success) {
    metrics.incrementCounter('db_errors_total', { operation });
  }
}

/**
 * Record rate limit exceeded
 */
export function recordRateLimitExceeded(tier: string) {
  metrics.incrementCounter('rate_limit_exceeded_total', { tier });
}

/**
 * Record email sent
 */
export function recordEmailSent(type: string, success: boolean) {
  metrics.incrementCounter('emails_sent_total', { type, status: success ? 'success' : 'failure' });
}

/**
 * Update WebSocket connection count
 */
export function updateWebSocketConnections(count: number) {
  metrics.setGauge('websocket_connections', count);
}

/**
 * Record WebSocket message
 */
export function recordWebSocketMessage(direction: 'inbound' | 'outbound') {
  metrics.incrementCounter('websocket_messages_total', { direction });
}
