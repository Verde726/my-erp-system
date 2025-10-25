/**
 * Performance monitoring utilities for tracking slow operations
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private metrics: PerformanceMetric[] = [];
  private slowThreshold = 1000; // 1 second

  /**
   * Measure the execution time of an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.logMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.logMetric(name, duration, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const start = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - start;
      this.logMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.logMetric(name, duration, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Log a performance metric
   */
  private logMetric(
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Console logging with color coding
    const isSlow = duration > this.slowThreshold;
    const formattedDuration = duration.toFixed(2);

    if (isSlow) {
      console.warn(
        `⚠️  [PERF] SLOW: ${name} took ${formattedDuration}ms`,
        metadata || ''
      );
    } else {
      console.log(
        `✅ [PERF] ${name}: ${formattedDuration}ms`,
        metadata || ''
      );
    }

    // In production, you could send to monitoring service
    if (process.env.NODE_ENV === 'production' && isSlow) {
      this.sendToMonitoring(metric);
    }

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Send metric to external monitoring service
   * Replace with your actual monitoring service (e.g., DataDog, New Relic, etc.)
   */
  private sendToMonitoring(metric: PerformanceMetric): void {
    // Example: POST to monitoring API
    // fetch('/api/monitoring/metrics', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    // }).catch(console.error);

    // For now, just log to console
    console.warn('[MONITORING] Slow operation detected:', metric);
  }

  /**
   * Get performance statistics
   */
  getStats(filterName?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    slowCount: number;
  } {
    const filtered = filterName
      ? this.metrics.filter((m) => m.name === filterName)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowCount: 0,
      };
    }

    const durations = filtered.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: filtered.length,
      avgDuration: sum / filtered.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowCount: filtered.filter((m) => m.duration > this.slowThreshold)
        .length,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(limit?: number): PerformanceMetric[] {
    const metrics = [...this.metrics].reverse(); // Most recent first
    return limit ? metrics.slice(0, limit) : metrics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Set the slow operation threshold
   */
  setSlowThreshold(ms: number): void {
    this.slowThreshold = ms;
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceLogger();

/**
 * Wrapper for API route handlers to automatically measure performance
 */
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: Parameters<T>) => {
    return PerformanceMonitor.measureAsync(
      `API:${routeName}`,
      () => handler(...args),
      {
        method: args[0]?.method,
        url: args[0]?.url,
      }
    );
  }) as T;
}

/**
 * Decorator for measuring class methods
 */
export function Measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const className = target.constructor.name;

  descriptor.value = async function (...args: any[]) {
    return PerformanceMonitor.measureAsync(
      `${className}.${propertyKey}`,
      () => originalMethod.apply(this, args)
    );
  };

  return descriptor;
}

/**
 * Time-based performance markers for tracking multiple stages
 */
export class PerformanceTimer {
  private markers: Map<string, number> = new Map();
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
    this.markers.set('start', this.startTime);
  }

  /**
   * Mark a specific point in the operation
   */
  mark(label: string): void {
    this.markers.set(label, performance.now());
  }

  /**
   * Get duration from start or from a specific marker
   */
  getDuration(fromLabel?: string): number {
    const startMark = fromLabel
      ? this.markers.get(fromLabel)
      : this.startTime;

    if (!startMark) {
      throw new Error(`Marker '${fromLabel}' not found`);
    }

    return performance.now() - startMark;
  }

  /**
   * Get duration between two markers
   */
  getDurationBetween(startLabel: string, endLabel: string): number {
    const start = this.markers.get(startLabel);
    const end = this.markers.get(endLabel);

    if (!start || !end) {
      throw new Error(`Markers '${startLabel}' or '${endLabel}' not found`);
    }

    return end - start;
  }

  /**
   * Complete and log all markers
   */
  complete(): void {
    const totalDuration = this.getDuration();
    console.log(`\n🕐 [PERF] ${this.name} - Total: ${totalDuration.toFixed(2)}ms`);

    const markerArray = Array.from(this.markers.entries());
    for (let i = 1; i < markerArray.length; i++) {
      const [label, time] = markerArray[i];
      const [prevLabel, prevTime] = markerArray[i - 1];
      const duration = time - prevTime;
      console.log(`  ├─ ${prevLabel} → ${label}: ${duration.toFixed(2)}ms`);
    }

    console.log(`  └─ Total: ${totalDuration.toFixed(2)}ms\n`);
  }
}

/**
 * Example usage for complex operations
 *
 * const timer = new PerformanceTimer('MRP Calculation');
 * timer.mark('fetch-schedule');
 * // ... fetch schedule
 * timer.mark('calculate-requirements');
 * // ... calculate
 * timer.mark('save-to-db');
 * // ... save
 * timer.complete();
 */
