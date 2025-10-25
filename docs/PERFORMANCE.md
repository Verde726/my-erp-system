# Performance Optimization Documentation

This document outlines all performance optimizations implemented in the ERP/MRP system.

## Table of Contents

1. [Database Optimizations](#database-optimizations)
2. [API Response Caching](#api-response-caching)
3. [Frontend Optimizations](#frontend-optimizations)
4. [Performance Monitoring](#performance-monitoring)
5. [Bundle Analysis](#bundle-analysis)
6. [Performance Targets](#performance-targets)
7. [Testing & Validation](#testing--validation)

---

## Database Optimizations

### Indexes Added

Strategic indexes have been added to improve query performance across all major tables:

#### BomItem Table
- `@@index([category])` - Filter items by category
- `@@index([currentStock, reorderPoint])` - Identify low stock items efficiently
- `@@index([supplier])` - Query items by supplier

#### SalesOrder Table
- `@@index([productId])` - Product-based queries
- `@@index([timePeriod])` - Time-based filtering
- `@@index([priority, status])` - Filter by priority and status
- `@@index([timePeriod, productId])` - Composite for demand forecasting

#### ProductionSchedule Table
- `@@index([productId])` - Product-specific schedules
- `@@index([startDate, endDate])` - Date range queries
- `@@index([workstationId, shiftNumber])` - Workstation scheduling
- `@@index([status])` - Filter by schedule status
- `@@index([status, startDate])` - Active schedules by date
- `@@index([productId, status])` - Product schedules by status

#### MaterialRequirement Table
- `@@index([scheduleId])` - Requirements for a schedule
- `@@index([partNumber])` - Part-specific requirements
- `@@index([status])` - Filter by requirement status
- `@@index([partNumber, status])` - Part requirements by status

#### ThroughputData Table
- `@@index([date, productId])` - Product performance over time
- `@@index([workstationId])` - Workstation efficiency tracking

#### InventoryMovement Table
- `@@index([partNumber, timestamp])` - Part movement history
- `@@index([movementType])` - Filter by movement type
- `@@index([timestamp])` - Time-based queries

#### Alert Table
- `@@index([status, createdAt])` - Active alerts by date
- `@@index([alertType, severity])` - Filter by type and severity
- `@@index([reference])` - Quick reference lookup
- `@@index([status, severity, createdAt])` - Composite for dashboard
- `@@index([alertType, status])` - Type-specific active alerts

### Migration File

The migration file has been created but **NOT applied**:
- Location: `prisma/migrations/20251025030804_add_performance_indexes/`
- Run manually with: `npx prisma migrate dev`

### Optimized Query Utilities

Created reusable query functions in `src/lib/database/optimized-queries.ts`:

**BOM Queries:**
- `bomQueries.getItems()` - Paginated items with field selection
- `bomQueries.getInventoryValue()` - Aggregated inventory value
- `bomQueries.getLowStockItems()` - Efficient low stock detection

**Schedule Queries:**
- `scheduleQueries.getActiveSchedules()` - Active schedules with product data
- `scheduleQueries.getScheduleWithMRP()` - Schedule with material requirements
- `scheduleQueries.getSchedulesByDateRange()` - Date-filtered schedules

**Alert Queries:**
- `alertQueries.getActiveAlerts()` - Filtered active alerts
- `alertQueries.getAlertStats()` - Alert statistics for dashboard

**Throughput Queries:**
- `throughputQueries.getByDateRange()` - Performance data by date
- `throughputQueries.getAverageEfficiencyByProduct()` - Product efficiency metrics

**Inventory Queries:**
- `inventoryQueries.getRecentMovements()` - Recent stock changes
- `inventoryQueries.getMovementsByDateRange()` - Historical movement data

**Sales Queries:**
- `salesQueries.getOrdersByPriority()` - Priority-filtered orders
- `salesQueries.getDemandForecast()` - Demand forecasting data

### Connection Pooling

**Current:** SQLite (development)
**Production:** PostgreSQL with connection pooling configured

Connection string format for production:
```
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20"
```

**Configuration:**
- Connection limit: 10 concurrent connections
- Pool timeout: 20 seconds
- Graceful shutdown handling in `src/lib/database/client.ts`

---

## API Response Caching

### In-Memory Cache Implementation

Created a simple in-memory cache in `src/lib/cache/simple-cache.ts`:

**Features:**
- TTL-based expiration (default: 1 minute)
- Pattern-based invalidation
- Automatic cleanup of expired entries
- Cache statistics and monitoring

**Cache Key Structure:**
```typescript
cacheKeys = {
  dashboard: { kpis: 'dashboard:kpis', alerts: 'dashboard:alerts' },
  bom: { all: 'bom:all', item: 'bom:item:{partNumber}' },
  schedule: { active: 'schedule:active', byId: 'schedule:{id}' },
  // ... more keys
}
```

### Usage Example

```typescript
import { withCache, cacheKeys, invalidateCache } from '@/lib/cache/simple-cache';

// In GET endpoint
export async function GET() {
  const data = await withCache(
    cacheKeys.dashboard.kpis(),
    async () => calculateKPIs(),
    2 * 60 * 1000 // 2 minutes
  );
  return Response.json(data);
}

// In POST/PUT endpoint - invalidate related caches
export async function POST(request: Request) {
  const result = await createSchedule(data);
  invalidateCache.schedule();
  invalidateCache.dashboard();
  return Response.json(result);
}
```

### Cache Invalidation Strategy

**Automatic invalidation on mutations:**
- Creating/updating schedules → invalidate `schedule:*` and `dashboard:*`
- BOM changes → invalidate `bom:*` and `dashboard:*`
- Sales order changes → invalidate `sales:*` and `dashboard:*`

**Manual invalidation:**
- Use `invalidateCache.all()` to clear everything
- Use pattern-based: `cache.invalidatePattern('^schedule:')`

### Production Considerations

For production deployments with multiple instances:
- Replace with Redis for shared caching
- Use Redis pub/sub for cache invalidation across instances
- Current implementation works for single-instance deployments

---

## Frontend Optimizations

### Next.js Configuration

**Compression:** Enabled gzip compression for responses

**SWC Minification:** Enabled for faster builds and smaller bundles

**Package Import Optimization:**
```javascript
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns']
}
```

**Image Optimization:**
- Formats: AVIF, WebP (fallback to JPEG/PNG)
- Device sizes: Optimized for mobile → desktop
- Cache TTL: 60 seconds minimum
- Lazy loading by default

**Source Maps:** Disabled in production for smaller bundle size

### Dynamic Imports

Use lazy loading for heavy components:

```typescript
import dynamic from 'next/dynamic';

const ThroughputChart = dynamic(
  () => import('@/components/dashboard/ThroughputChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false // Client-only components
  }
);
```

**When to use:**
- Chart libraries (Recharts)
- Large data tables
- PDF/Excel generators
- Admin-only features

### Code Splitting

Next.js automatically splits by route:
- Each page in `/app` is a separate chunk
- Shared components are bundled separately
- Dynamic imports create separate chunks

### React Server Components

**Default:** All components are Server Components
**Client Components:** Only when needed for:
- State management (`useState`, `useContext`)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)
- Effects (`useEffect`)

---

## Performance Monitoring

### PerformanceMonitor Class

Created in `src/lib/monitoring/performance.ts`:

**Features:**
- Async and sync function measurement
- Automatic slow operation detection (>1s)
- Statistics and metrics tracking
- Production monitoring integration ready

### Basic Usage

```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance';

const result = await PerformanceMonitor.measureAsync(
  'MRP Calculation',
  async () => calculateMaterialRequirements(scheduleId)
);
// Logs: ✅ [PERF] MRP Calculation: 245.32ms
```

### API Route Performance Wrapper

```typescript
import { withPerformanceLogging } from '@/lib/monitoring/performance';

export const GET = withPerformanceLogging(
  async (request: Request) => {
    // Your handler logic
  },
  'analytics/kpis'
);
```

### Multi-Stage Performance Tracking

For complex operations with multiple stages:

```typescript
import { PerformanceTimer } from '@/lib/monitoring/performance';

const timer = new PerformanceTimer('Complete MRP Run');
timer.mark('fetch-schedules');
// ... fetch schedules
timer.mark('calculate-requirements');
// ... calculate
timer.mark('save-results');
// ... save
timer.complete();

// Output:
// 🕐 [PERF] Complete MRP Run - Total: 1247.52ms
//   ├─ start → fetch-schedules: 120.34ms
//   ├─ fetch-schedules → calculate-requirements: 945.12ms
//   ├─ calculate-requirements → save-results: 182.06ms
//   └─ Total: 1247.52ms
```

### Statistics and Monitoring

```typescript
// Get performance stats for specific operation
const stats = PerformanceMonitor.getStats('MRP Calculation');
// {
//   count: 45,
//   avgDuration: 234.56,
//   minDuration: 120.23,
//   maxDuration: 567.89,
//   slowCount: 3
// }

// Get recent metrics
const metrics = PerformanceMonitor.getMetrics(20); // Last 20
```

---

## Bundle Analysis

### Setup

Bundle analyzer is configured in `next.config.js`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
```

### Running Bundle Analysis

```bash
npm run analyze
```

This will:
1. Build the production bundle
2. Generate interactive HTML reports
3. Open reports in your default browser
4. Show client and server bundles separately

### What to Look For

**Red Flags:**
- Packages >100KB that aren't essential
- Duplicate dependencies
- Unused code in bundles
- Heavy libraries in initial chunk

**Optimization Opportunities:**
- Large packages → dynamic imports
- Multiple instances → dedupe in package.json
- Tree-shaking failures → check imports
- Heavy pages → code splitting

### Current Bundle Status

After optimization:
- **Initial bundle:** Target <200KB gzipped
- **Route chunks:** <50KB each typically
- **Shared chunks:** Lucide-react, date-fns optimized
- **Chart libraries:** Dynamically imported

---

## Performance Targets

### Page Load Metrics (Lighthouse/Core Web Vitals)

| Metric | Target | Current |
|--------|--------|---------|
| Time to First Byte (TTFB) | <200ms | TBD |
| First Contentful Paint (FCP) | <1.0s | TBD |
| Largest Contentful Paint (LCP) | <2.5s | TBD |
| Time to Interactive (TTI) | <3.0s | TBD |
| Cumulative Layout Shift (CLS) | <0.1 | TBD |
| First Input Delay (FID) | <100ms | TBD |

### API Response Times

| Endpoint | Target | Description |
|----------|--------|-------------|
| Dashboard KPIs | <500ms | Aggregate metrics |
| BOM List (paginated) | <300ms | 50 items per page |
| Production Schedules | <400ms | Active schedules |
| MRP Calculation | <2000ms | Material requirements |
| Chart Data | <400ms | Time-series data |
| Alert List | <200ms | Active alerts only |

### Database Query Times

| Query Type | Target |
|------------|--------|
| Simple lookups (by ID) | <50ms |
| Filtered lists (indexed) | <100ms |
| Aggregations | <200ms |
| Complex joins | <500ms |
| Full-table scans | Avoid |

### Bundle Size Targets

| Bundle | Target (gzipped) |
|--------|------------------|
| Initial JS | <200KB |
| Route chunks | <50KB each |
| Total JS (initial load) | <300KB |
| CSS | <30KB |

---

## Testing & Validation

### Performance Test Script

Created in `scripts/performance-test.ts`:

```bash
npm run perf:test
```

**Tests:**
- Dashboard KPI load time
- MRP calculation time
- BOM query performance
- Alert fetching speed

### Manual Testing

**Database Query Performance:**
```bash
# Enable query logging
# Check prisma/schema.prisma logs in dev mode
npm run dev

# Watch for slow queries in console
# Look for queries >100ms
```

**Bundle Size Check:**
```bash
npm run build
# Check output for chunk sizes
# Run analyzer for detailed view
npm run analyze
```

**API Response Time:**
```bash
# Use browser DevTools Network tab
# Check response times in production build
npm run build && npm start
```

### Continuous Monitoring

**Development:**
- Console logs show performance metrics
- Slow operations logged with ⚠️  warnings

**Production:**
- Slow threshold: 1000ms (configurable)
- Automatic logging of slow operations
- Ready for external monitoring service integration

### Setting Up Production Monitoring

To integrate with monitoring service (DataDog, New Relic, etc.):

1. Modify `PerformanceLogger.sendToMonitoring()` in `src/lib/monitoring/performance.ts`
2. Add your monitoring service API endpoint
3. Configure authentication
4. Set up alerts for slow operations

Example:
```typescript
private sendToMonitoring(metric: PerformanceMetric): void {
  fetch('https://api.monitoring-service.com/metrics', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  }).catch(console.error);
}
```

---

## Next Steps

1. **Run the migration** to apply database indexes:
   ```bash
   npx prisma migrate dev
   ```

2. **Measure baseline performance** with the test script:
   ```bash
   npm run perf:test
   ```

3. **Analyze bundle size**:
   ```bash
   npm run analyze
   ```

4. **Implement caching** in API routes:
   - Start with dashboard endpoints
   - Add cache invalidation to mutations
   - Monitor hit rates

5. **Add dynamic imports** to heavy pages:
   - Dashboard charts
   - BOM data tables
   - Financial reports

6. **Set up production monitoring**:
   - Choose monitoring service
   - Implement `sendToMonitoring()`
   - Configure alerts

7. **Load testing** (future):
   - Use tools like k6 or Artillery
   - Test concurrent users
   - Identify bottlenecks
   - Tune connection pool sizes

---

## Troubleshooting

### Slow Database Queries

1. Check if indexes are applied: `npx prisma migrate status`
2. Enable query logging in development
3. Look for missing `@@index` annotations
4. Use `EXPLAIN` in database for query plans

### High Memory Usage

1. Check cache size: `cache.stats()`
2. Reduce cache TTL for less-used endpoints
3. Implement cache size limits
4. Use Redis for production with memory limits

### Large Bundle Size

1. Run `npm run analyze`
2. Look for duplicate dependencies
3. Check for unnecessary imports
4. Add more dynamic imports
5. Remove unused dependencies

### Slow API Responses

1. Check performance logs for slow operations
2. Review database query times
3. Add caching to expensive endpoints
4. Optimize aggregation queries
5. Consider pagination for large datasets

---

## Resources

- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Web Vitals](https://web.dev/vitals/)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
