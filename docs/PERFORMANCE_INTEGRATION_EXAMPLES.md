# Performance Optimization Integration Examples

This guide shows how to integrate the performance optimizations into your API routes and components.

## Table of Contents

1. [API Response Caching](#api-response-caching)
2. [Performance Monitoring](#performance-monitoring)
3. [Optimized Database Queries](#optimized-database-queries)
4. [Dynamic Imports](#dynamic-imports)
5. [Complete Example](#complete-example)

---

## API Response Caching

### Basic GET Endpoint with Cache

```typescript
// src/app/api/dashboard/kpis/route.ts
import { NextResponse } from 'next/server';
import { withCache, cacheKeys } from '@/lib/cache/simple-cache';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const kpis = await withCache(
      cacheKeys.dashboard.kpis(),
      async () => {
        // Expensive calculation - only runs on cache miss
        const [productionCount, lowStockCount, alertCount] = await Promise.all([
          prisma.productionSchedule.count({
            where: { status: 'in-progress' }
          }),
          prisma.bomItem.count({
            where: { currentStock: { lte: 100 } }
          }),
          prisma.alert.count({
            where: { status: 'active', severity: 'critical' }
          })
        ]);

        return {
          productionActive: productionCount,
          lowStockItems: lowStockCount,
          criticalAlerts: alertCount,
        };
      },
      2 * 60 * 1000 // Cache for 2 minutes
    );

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}
```

### POST Endpoint with Cache Invalidation

```typescript
// src/app/api/schedules/production/route.ts
import { NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/cache/simple-cache';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schedule = await prisma.productionSchedule.create({
      data: {
        ...body,
        status: 'planned',
      },
    });

    // Invalidate all related caches
    invalidateCache.schedule();
    invalidateCache.dashboard();

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
```

### Granular Cache Invalidation

```typescript
// src/app/api/schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { cache, cacheKeys, invalidateCache } from '@/lib/cache/simple-cache';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updated = await prisma.productionSchedule.update({
      where: { id: params.id },
      data: body,
    });

    // Invalidate specific schedule cache
    cache.invalidate(cacheKeys.schedule.byId(params.id));

    // Invalidate list caches
    invalidateCache.schedule();
    invalidateCache.dashboard();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
```

---

## Performance Monitoring

### Basic API Route with Monitoring

```typescript
// src/app/api/analytics/throughput/route.ts
import { NextResponse } from 'next/server';
import { withPerformanceLogging } from '@/lib/monitoring/performance';
import { prisma } from '@/lib/db';

export const GET = withPerformanceLogging(
  async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates required' },
        { status: 400 }
      );
    }

    const data = await prisma.throughputData.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        product: {
          select: { sku: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(data);
  },
  'analytics/throughput' // Route name for logging
);
// Logs: ✅ [PERF] API:analytics/throughput: 245.32ms
```

### Manual Performance Measurement

```typescript
// For complex operations with multiple stages
import { PerformanceMonitor } from '@/lib/monitoring/performance';

export async function POST(request: Request) {
  const result = await PerformanceMonitor.measureAsync(
    'MRP Calculation',
    async () => {
      // Your expensive calculation
      return await calculateMaterialRequirements();
    }
  );

  return NextResponse.json(result);
}
```

### Multi-Stage Performance Tracking

```typescript
import { PerformanceTimer } from '@/lib/monitoring/performance';

export async function POST(request: Request) {
  const timer = new PerformanceTimer('Complete MRP Run');

  // Stage 1: Fetch schedules
  timer.mark('fetch-schedules');
  const schedules = await fetchActiveSchedules();

  // Stage 2: Calculate requirements
  timer.mark('calculate-requirements');
  const requirements = await calculateRequirements(schedules);

  // Stage 3: Save to database
  timer.mark('save-to-db');
  await saveRequirements(requirements);

  // Stage 4: Generate alerts
  timer.mark('generate-alerts');
  await generateShortageAlerts(requirements);

  timer.complete();
  // Logs detailed breakdown of each stage

  return NextResponse.json({ success: true });
}
```

---

## Optimized Database Queries

### Using BOM Queries

```typescript
import { bomQueries } from '@/lib/database/optimized-queries';

// Instead of this:
const items = await prisma.bomItem.findMany({
  where: { category: 'raw-materials' },
  skip: page * limit,
  take: limit,
});

// Use this:
const { items, total, pages } = await bomQueries.getItems({
  page: 0,
  limit: 50,
  category: 'raw-materials',
  lowStockOnly: true,
});

console.log(`Found ${items.length} items out of ${total} (${pages} pages)`);
```

### Using Schedule Queries

```typescript
import { scheduleQueries } from '@/lib/database/optimized-queries';

// Get active schedules with product data
const activeSchedules = await scheduleQueries.getActiveSchedules();

// Get schedule with full MRP details
const scheduleDetails = await scheduleQueries.getScheduleWithMRP(scheduleId);

// Get schedules by date range
const upcomingSchedules = await scheduleQueries.getSchedulesByDateRange({
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  status: 'planned',
});
```

### Using Alert Queries

```typescript
import { alertQueries } from '@/lib/database/optimized-queries';

// Get critical alerts only
const criticalAlerts = await alertQueries.getActiveAlerts({
  severity: 'critical',
  limit: 10,
});

// Get alert statistics for dashboard
const stats = await alertQueries.getAlertStats();
console.log(`${stats.criticalCount} critical, ${stats.warningCount} warnings`);
```

---

## Dynamic Imports

### Dashboard with Lazy-Loaded Charts

```typescript
'use client'

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Skeleton component for loading state
const ChartSkeleton = () => (
  <div className="h-64 animate-pulse bg-muted rounded-lg" />
);

// Lazy load heavy chart components
const ThroughputChart = dynamic(
  () => import('@/components/dashboard/ThroughputChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Don't render on server
  }
);

const InventoryBarChart = dynamic(
  () => import('@/components/dashboard/InventoryBarChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export default function Dashboard() {
  return (
    <div>
      {/* Critical content loads immediately */}
      <h1>Dashboard</h1>
      <KPICards />

      {/* Charts load after initial render */}
      <Suspense fallback={<ChartSkeleton />}>
        <ThroughputChart data={data} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <InventoryBarChart items={items} />
      </Suspense>
    </div>
  );
}
```

### Conditional Dynamic Import

```typescript
'use client'

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Only load when user clicks "Export to PDF"
const PDFExporter = dynamic(
  () => import('@/components/exporters/PDFExporter'),
  { ssr: false }
);

export default function Reports() {
  const [showExporter, setShowExporter] = useState(false);

  return (
    <div>
      <button onClick={() => setShowExporter(true)}>
        Export to PDF
      </button>

      {showExporter && <PDFExporter data={data} />}
    </div>
  );
}
```

---

## Complete Example

### Optimized API Route with All Features

```typescript
// src/app/api/dashboard/summary/route.ts
import { NextResponse } from 'next/server';
import { withCache, cacheKeys } from '@/lib/cache/simple-cache';
import { PerformanceTimer } from '@/lib/monitoring/performance';
import { bomQueries, alertQueries, scheduleQueries } from '@/lib/database/optimized-queries';

export async function GET() {
  try {
    // Use caching for expensive calculation
    const summary = await withCache(
      cacheKeys.dashboard.kpis(),
      async () => {
        // Multi-stage performance tracking
        const timer = new PerformanceTimer('Dashboard Summary');

        // Stage 1: Fetch inventory data
        timer.mark('inventory');
        const inventoryValue = await bomQueries.getInventoryValue();

        // Stage 2: Fetch alert statistics
        timer.mark('alerts');
        const alertStats = await alertQueries.getAlertStats();

        // Stage 3: Fetch active schedules
        timer.mark('schedules');
        const activeSchedules = await scheduleQueries.getActiveSchedules();

        // Complete and log performance
        timer.complete();

        return {
          inventory: {
            totalValue: inventoryValue.totalValue,
            totalItems: inventoryValue.totalItems,
          },
          alerts: {
            critical: alertStats.criticalCount,
            warning: alertStats.warningCount,
            info: alertStats.infoCount,
          },
          production: {
            activeSchedules: activeSchedules.length,
            nextSchedule: activeSchedules[0] || null,
          },
          timestamp: new Date().toISOString(),
        };
      },
      2 * 60 * 1000 // Cache for 2 minutes
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
```

### Optimized Client Component

```typescript
'use client'

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load visualization library
const Chart = dynamic(() => import('recharts').then(mod => mod.LineChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />
});

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch with automatic caching on server
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Critical content above the fold */}
      <h1>Dashboard</h1>
      <KPICards data={summary} />

      {/* Heavy chart loads after initial render */}
      <Chart data={summary?.chartData} />
    </div>
  );
}
```

---

## Best Practices Checklist

### API Routes
- [ ] Add caching to read-heavy endpoints (dashboard, lists)
- [ ] Invalidate caches in mutation endpoints (POST, PUT, DELETE)
- [ ] Use performance monitoring for slow operations (>500ms)
- [ ] Use optimized query utilities instead of raw Prisma calls
- [ ] Set appropriate cache TTLs (1-5 minutes for dashboards)

### Database Queries
- [ ] Use optimized query utilities with field selection
- [ ] Implement pagination for large datasets
- [ ] Leverage composite indexes for common queries
- [ ] Avoid N+1 queries with proper includes
- [ ] Use aggregations instead of fetching all data

### Frontend
- [ ] Lazy load charts and heavy visualizations
- [ ] Use Server Components for static content
- [ ] Implement proper loading states
- [ ] Prefetch critical data
- [ ] Optimize images with Next.js Image component

### Monitoring
- [ ] Track slow operations in development
- [ ] Set up production monitoring service
- [ ] Monitor cache hit rates
- [ ] Track bundle sizes over time
- [ ] Run performance tests regularly

---

## Troubleshooting

### Cache Not Working

```typescript
// Check cache stats
import { cache } from '@/lib/cache/simple-cache';

console.log('Cache stats:', cache.stats());
// { total: 15, active: 12, expired: 3 }

// Verify key is correct
console.log('Cached data:', cache.get('dashboard:kpis'));
```

### Slow Queries

```typescript
// Enable query logging
import { prisma } from '@/lib/db';

// Check Prisma client logs in development
// Look for queries taking >100ms

// Use optimized queries instead
import { bomQueries } from '@/lib/database/optimized-queries';
```

### Large Bundle Size

```bash
# Analyze bundle
npm run analyze

# Look for:
# - Large packages (>100KB)
# - Duplicate dependencies
# - Opportunities for dynamic imports
```

---

## Measuring Improvements

### Before and After Comparison

```typescript
// Before optimization
export async function GET() {
  const data = await prisma.bomItem.findMany(); // No caching, no field selection
  return NextResponse.json(data);
}

// After optimization
export async function GET() {
  const data = await withCache(
    'bom:all',
    async () => {
      const { items } = await bomQueries.getItems({
        page: 0,
        limit: 50,
      });
      return items;
    },
    60 * 1000 // 1 minute cache
  );
  return NextResponse.json(data);
}

// Expected improvements:
// - First request: ~same speed (cache miss)
// - Subsequent requests: 10-100x faster (cache hit)
// - Reduced data transfer (field selection)
// - Better scalability (pagination)
```

### Running Performance Tests

```bash
# Test API endpoints
npm run dev
npm run perf:test

# Test database queries only
npm run perf:test db

# Analyze bundle size
npm run analyze
```

---

## Next Steps

1. **Apply optimizations incrementally**
   - Start with dashboard endpoints
   - Add to high-traffic routes
   - Monitor improvements

2. **Measure baseline performance**
   - Run `npm run perf:test` before optimizations
   - Document current metrics
   - Set improvement targets

3. **Implement and validate**
   - Add caching to one endpoint
   - Test performance improvement
   - Repeat for other endpoints

4. **Monitor in production**
   - Track slow operations
   - Monitor cache hit rates
   - Adjust TTLs as needed

5. **Iterate and improve**
   - Identify new bottlenecks
   - Add more indexes if needed
   - Optimize slow queries
