/**
 * Simple in-memory cache for API responses
 * For production, consider replacing with Redis for multi-instance deployments
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60 * 1000; // 1 minute
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      total: this.cache.size,
      active: activeEntries,
      expired: expiredEntries,
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup(intervalMs: number = 5 * 60 * 1000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(
          `[Cache] Cleaned up ${cleaned} expired entries. Stats:`,
          this.stats()
        );
      }
    }, intervalMs);
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

// Singleton cache instance
export const cache = new SimpleCache();

// Start cleanup in production
if (process.env.NODE_ENV === 'production') {
  cache.startCleanup();
}

/**
 * Cache wrapper for async functions
 * Automatically caches the result of the function
 *
 * @example
 * const data = await withCache('users:all', async () => {
 *   return await prisma.user.findMany();
 * }, 5 * 60 * 1000); // 5 minutes
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

/**
 * Cache key builder utilities
 */
export const cacheKeys = {
  dashboard: {
    kpis: () => 'dashboard:kpis',
    alerts: (severity?: string) =>
      severity ? `dashboard:alerts:${severity}` : 'dashboard:alerts',
    production: (days?: number) =>
      `dashboard:production:${days || 'default'}`,
  },
  bom: {
    all: (page?: number) => (page ? `bom:all:page:${page}` : 'bom:all'),
    item: (partNumber: string) => `bom:item:${partNumber}`,
    lowStock: () => 'bom:lowstock',
    inventoryValue: () => 'bom:inventory-value',
  },
  schedule: {
    active: () => 'schedule:active',
    byId: (id: string) => `schedule:${id}`,
    byDateRange: (start: string, end: string) =>
      `schedule:range:${start}:${end}`,
  },
  sales: {
    forecast: (start: string, end: string) => `sales:forecast:${start}:${end}`,
    byPriority: (priority: string) => `sales:priority:${priority}`,
  },
  throughput: {
    byProduct: (productId: string, days: number) =>
      `throughput:product:${productId}:${days}`,
    byDateRange: (start: string, end: string) =>
      `throughput:range:${start}:${end}`,
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  /**
   * Invalidate all dashboard caches
   */
  dashboard: () => {
    cache.invalidatePattern('^dashboard:');
  },

  /**
   * Invalidate BOM-related caches
   */
  bom: (partNumber?: string) => {
    if (partNumber) {
      cache.invalidate(cacheKeys.bom.item(partNumber));
    }
    cache.invalidatePattern('^bom:');
  },

  /**
   * Invalidate schedule caches
   */
  schedule: (scheduleId?: string) => {
    if (scheduleId) {
      cache.invalidate(cacheKeys.schedule.byId(scheduleId));
    }
    cache.invalidatePattern('^schedule:');
  },

  /**
   * Invalidate sales caches
   */
  sales: () => {
    cache.invalidatePattern('^sales:');
  },

  /**
   * Invalidate all caches
   */
  all: () => {
    cache.clear();
  },
};
