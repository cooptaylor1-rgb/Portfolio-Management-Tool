/**
 * API Versioning System
 * 
 * Implements version negotiation and routing for the API.
 * Supports both URL-based and header-based versioning.
 */

import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiVersion {
  major: number;
  minor: number;
  patch?: number;
}

export interface VersionConfig {
  /** Current stable version */
  current: string;
  /** Minimum supported version */
  minimum: string;
  /** Latest version (may be beta/preview) */
  latest: string;
  /** Deprecated versions (will be removed) */
  deprecated: string[];
  /** Sunset dates for deprecated versions */
  sunsetDates: Record<string, Date>;
}

export interface VersionedRoute {
  version: string;
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<any>;
}

// ============================================================================
// VERSION CONFIGURATION
// ============================================================================

export const VERSION_CONFIG: VersionConfig = {
  current: '2.0',
  minimum: '1.0',
  latest: '2.1',
  deprecated: ['1.0'],
  sunsetDates: {
    '1.0': new Date('2025-06-01'),
  },
};

// Supported API versions
export const SUPPORTED_VERSIONS = ['1.0', '1.1', '2.0', '2.1'];

// ============================================================================
// VERSION UTILITIES
// ============================================================================

/**
 * Parse version string into components
 */
export function parseVersion(version: string): ApiVersion {
  const parts = version.replace(/^v/, '').split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parts[2] ? parseInt(parts[2], 10) : undefined,
  };
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if ((vA.patch || 0) !== (vB.patch || 0)) {
    return (vA.patch || 0) < (vB.patch || 0) ? -1 : 1;
  }
  return 0;
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.some(
    (v) => v === version || v.startsWith(version + '.')
  );
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  return VERSION_CONFIG.deprecated.includes(version);
}

/**
 * Get sunset date for a version
 */
export function getVersionSunsetDate(version: string): Date | null {
  return VERSION_CONFIG.sunsetDates[version] || null;
}

/**
 * Extract version from request
 */
export function extractVersion(request: FastifyRequest): string {
  // 1. URL path version: /api/v2/portfolios
  const urlMatch = request.url.match(/\/api\/v(\d+(?:\.\d+)?)\//);
  if (urlMatch) {
    return urlMatch[1];
  }

  // 2. Accept header: Accept: application/vnd.portfolio.v2+json
  const accept = request.headers.accept;
  if (accept) {
    const headerMatch = accept.match(/application\/vnd\.portfolio\.v(\d+(?:\.\d+)?)\+json/);
    if (headerMatch) {
      return headerMatch[1];
    }
  }

  // 3. Custom header: X-API-Version: 2.0
  const customHeader = request.headers['x-api-version'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader;
  }

  // 4. Query parameter: ?api-version=2.0
  const queryVersion = (request.query as any)?.['api-version'];
  if (queryVersion) {
    return queryVersion;
  }

  // Default to current stable version
  return VERSION_CONFIG.current;
}

// ============================================================================
// VERSIONING MIDDLEWARE
// ============================================================================

/**
 * Version validation middleware
 */
export async function versionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const version = extractVersion(request);
  const minVersion = parseVersion(VERSION_CONFIG.minimum);
  const requestedVersion = parseVersion(version);

  // Store version in request for later use
  (request as any).apiVersion = version;

  // Check minimum version
  if (compareVersions(version, VERSION_CONFIG.minimum) < 0) {
    reply.status(400).send({
      error: 'Unsupported API version',
      message: `API version ${version} is no longer supported. Minimum supported version is ${VERSION_CONFIG.minimum}.`,
      code: 'UNSUPPORTED_VERSION',
      currentVersion: VERSION_CONFIG.current,
      minimumVersion: VERSION_CONFIG.minimum,
    });
    return;
  }

  // Check if version exists
  if (!isVersionSupported(version)) {
    reply.status(400).send({
      error: 'Unknown API version',
      message: `API version ${version} does not exist. Available versions: ${SUPPORTED_VERSIONS.join(', ')}.`,
      code: 'UNKNOWN_VERSION',
      availableVersions: SUPPORTED_VERSIONS,
    });
    return;
  }

  // Add deprecation warning headers
  if (isVersionDeprecated(version)) {
    const sunsetDate = getVersionSunsetDate(version);
    reply.header('Deprecation', 'true');
    reply.header('X-API-Deprecated', 'true');
    reply.header(
      'X-API-Deprecation-Info',
      `API version ${version} is deprecated. Please upgrade to version ${VERSION_CONFIG.current}.`
    );
    if (sunsetDate) {
      reply.header('Sunset', sunsetDate.toUTCString());
    }
  }

  // Add version info headers
  reply.header('X-API-Version', version);
  reply.header('X-API-Current-Version', VERSION_CONFIG.current);
  reply.header('X-API-Latest-Version', VERSION_CONFIG.latest);
}

// ============================================================================
// VERSIONED ROUTER
// ============================================================================

/**
 * Create versioned route handlers
 */
export function createVersionedRoute(routes: VersionedRoute[]) {
  // Sort routes by version (newest first)
  const sortedRoutes = [...routes].sort(
    (a, b) => -compareVersions(a.version, b.version)
  );

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const requestedVersion = (request as any).apiVersion || VERSION_CONFIG.current;

    // Find the best matching handler
    for (const route of sortedRoutes) {
      if (compareVersions(requestedVersion, route.version) >= 0) {
        return route.handler(request, reply);
      }
    }

    // Fallback to oldest handler
    return sortedRoutes[sortedRoutes.length - 1].handler(request, reply);
  };
}

// ============================================================================
// RESPONSE TRANSFORMERS
// ============================================================================

/**
 * Transform response based on API version
 */
export type ResponseTransformer = (
  data: any,
  version: string
) => any;

const responseTransformers: Map<string, ResponseTransformer> = new Map();

/**
 * Register a response transformer for a specific type
 */
export function registerTransformer(type: string, transformer: ResponseTransformer) {
  responseTransformers.set(type, transformer);
}

/**
 * Transform response for the requested API version
 */
export function transformResponse(type: string, data: any, version: string): any {
  const transformer = responseTransformers.get(type);
  if (transformer) {
    return transformer(data, version);
  }
  return data;
}

// Register default transformers for backward compatibility
registerTransformer('portfolio', (data, version) => {
  const v = parseVersion(version);
  
  // V1 format transformations
  if (v.major === 1) {
    return {
      ...data,
      // V1 used snake_case
      total_value: data.totalValue,
      total_gain: data.totalGain,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      // Remove fields not in V1
      metrics: undefined,
      activities: undefined,
    };
  }
  
  return data;
});

registerTransformer('investment', (data, version) => {
  const v = parseVersion(version);
  
  if (v.major === 1) {
    return {
      ...data,
      average_cost: data.avgCost,
      current_price: data.currentPrice,
      current_value: data.currentValue,
      day_change: data.dayChange,
    };
  }
  
  return data;
});

registerTransformer('user', (data, version) => {
  const v = parseVersion(version);
  
  if (v.major === 1) {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      // V1 didn't expose these fields
    };
  }
  
  return data;
});

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

const versioningPlugin: FastifyPluginCallback = (fastify, opts, done) => {
  // Add version middleware to all routes
  fastify.addHook('onRequest', versionMiddleware);

  // Decorate request with version helper
  fastify.decorateRequest('apiVersion', '');
  fastify.decorateRequest('getApiVersion', function (this: FastifyRequest) {
    return (this as any).apiVersion || VERSION_CONFIG.current;
  });

  // Decorate reply with version transform helper
  fastify.decorateReply('sendVersioned', function (
    this: FastifyReply,
    type: string,
    data: any
  ) {
    const version = (this.request as any).apiVersion || VERSION_CONFIG.current;
    const transformed = transformResponse(type, data, version);
    return this.send(transformed);
  });

  done();
};

export const apiVersioning = fp(versioningPlugin, {
  name: 'api-versioning',
  fastify: '4.x',
});

// ============================================================================
// VERSION INFO ENDPOINT
// ============================================================================

/**
 * Register version info endpoint
 */
export function registerVersionRoutes(app: FastifyInstance) {
  // Version info endpoint
  app.get('/api/version', async (request, reply) => {
    return {
      current: VERSION_CONFIG.current,
      latest: VERSION_CONFIG.latest,
      minimum: VERSION_CONFIG.minimum,
      deprecated: VERSION_CONFIG.deprecated,
      supported: SUPPORTED_VERSIONS,
      sunsetDates: Object.fromEntries(
        Object.entries(VERSION_CONFIG.sunsetDates).map(([v, d]) => [v, d.toISOString()])
      ),
    };
  });

  // Version-specific info
  app.get('/api/version/:version', async (request, reply) => {
    const { version } = request.params as { version: string };

    if (!isVersionSupported(version)) {
      return reply.status(404).send({
        error: 'Version not found',
        message: `API version ${version} does not exist.`,
      });
    }

    const sunsetDate = getVersionSunsetDate(version);

    return {
      version,
      supported: true,
      deprecated: isVersionDeprecated(version),
      sunsetDate: sunsetDate?.toISOString() || null,
      isCurrent: version === VERSION_CONFIG.current,
      isLatest: version === VERSION_CONFIG.latest,
    };
  });
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Check if a field exists in a specific version
 */
export function fieldExistsInVersion(field: string, version: string): boolean {
  const v = parseVersion(version);
  
  // Define field availability by version
  const fieldVersions: Record<string, string> = {
    'portfolio.metrics': '2.0',
    'portfolio.activities': '2.0',
    'portfolio.snapshots': '1.1',
    'investment.transactions': '1.1',
    'user.mfaEnabled': '2.0',
    'user.tier': '2.0',
  };
  
  const minVersion = fieldVersions[field];
  if (!minVersion) return true; // Field always existed
  
  return compareVersions(version, minVersion) >= 0;
}

/**
 * Filter fields based on API version
 */
export function filterFieldsForVersion<T extends Record<string, any>>(
  data: T,
  entityType: string,
  version: string
): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const fieldPath = `${entityType}.${key}`;
    if (fieldExistsInVersion(fieldPath, version)) {
      (result as any)[key] = value;
    }
  }
  
  return result;
}
