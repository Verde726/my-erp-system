# Performance Optimization Guide

## Dynamic Imports for Heavy Components

Use dynamic imports to lazy-load heavy components like charts, reducing initial bundle size.

### Example: Dashboard with Dynamic Imports

```tsx
'use client'

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy chart components
const ThroughputChart = dynamic(
  () => import('@/components/dashboard/ThroughputChart'),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
    ssr: false // Disable server-side rendering for client-only components
  }
);

const InventoryBarChart = dynamic(
  () => import('@/components/dashboard/InventoryBarChart'),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
    ssr: false
  }
);

export default function Dashboard() {
  return (
    <div>
      {/* Critical above-the-fold content loads immediately */}
      <KPICards />

      {/* Charts load after initial render */}
      <Suspense fallback={<ChartSkeleton />}>
        <ThroughputChart data={data} />
        <InventoryBarChart items={items} />
      </Suspense>
    </div>
  );
}
```

### When to Use Dynamic Imports

1. **Heavy visualization libraries** (Recharts, D3, etc.)
2. **Rich text editors**
3. **PDF viewers or generators**
4. **Large utility libraries** used in specific pages only
5. **Admin-only components** not needed for most users

### Benefits

- **Faster initial page load** - Code splitting reduces bundle size
- **Better Time to Interactive (TTI)** - Critical JS loads first
- **Improved Core Web Vitals** - Better LCP and FID scores

## API Response Caching

Use the caching utilities to reduce database queries:

```tsx
import { withCache, cacheKeys, invalidateCache } from '@/lib/cache/simple-cache';

// In API route
export async function GET() {
  const kpis = await withCache(
    cacheKeys.dashboard.kpis(),
    async () => {
      // Expensive calculation
      return await calculateKPIs();
    },
    2 * 60 * 1000 // Cache for 2 minutes
  );

  return Response.json(kpis);
}

// In mutation endpoint - invalidate cache
export async function POST(request: Request) {
  const result = await createSchedule(data);

  // Invalidate related caches
  invalidateCache.schedule();
  invalidateCache.dashboard();

  return Response.json(result);
}
```

## Database Query Optimization

Use the optimized query utilities instead of direct Prisma calls:

```tsx
import { bomQueries, scheduleQueries, alertQueries } from '@/lib/database/optimized-queries';

// Instead of:
const items = await prisma.bomItem.findMany({...});

// Use:
const { items, total, pages } = await bomQueries.getItems({
  page: 0,
  limit: 50,
  category: 'raw-materials',
  lowStockOnly: true
});
```

### Benefits

- **Field selection** - Only fetch needed columns
- **Efficient joins** - Optimized include statements
- **Built-in pagination** - Reduce memory usage
- **Indexed queries** - Leverage database indexes

## Performance Monitoring

Track slow operations:

```tsx
import { PerformanceMonitor } from '@/lib/monitoring/performance';

const result = await PerformanceMonitor.measureAsync(
  'MRP Calculation',
  async () => {
    return await calculateMaterialRequirements(scheduleId);
  }
);

// Logs: [PERF] MRP Calculation: 245.32ms
```

## Bundle Analysis

Run bundle analysis to identify large dependencies:

```bash
npm run analyze
```

This will:
1. Build the production bundle
2. Generate interactive visualization
3. Open analysis in browser
4. Show all chunks and their sizes

### What to Look For

- **Large vendor chunks** - Consider code splitting
- **Duplicate dependencies** - Check package.json
- **Unused code** - Remove unused imports
- **Opportunities for dynamic imports** - Split routes/features

## Best Practices

### 1. Code Splitting by Route

Next.js automatically splits by route in the App Router. Keep related code in route folders:

```
/app
  /dashboard
    page.tsx          # Dashboard route
    loading.tsx       # Loading state
    error.tsx         # Error boundary
  /sales
    page.tsx          # Sales route (separate chunk)
```

### 2. Optimize Images

Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={300}
  placeholder="blur"
  loading="lazy"
/>
```

### 3. Minimize Client Components

Keep components Server Components by default:

```tsx
// ✅ Good - Server Component (default)
export default function ProductList() {
  const products = await db.product.findMany();
  return <List items={products} />;
}

// ❌ Avoid - Client Component for static content
'use client'
export default function ProductList() {
  // ...
}
```

Only use `'use client'` for:
- Event handlers
- Browser APIs
- State management (useState, useContext)
- Effects (useEffect)

### 4. Database Connection Pooling

For production with PostgreSQL, configure connection pooling:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

### 5. Cache Invalidation Strategy

Invalidate caches strategically:

```tsx
// After data mutation
await createSchedule(data);
invalidateCache.schedule();      // Invalidate schedule caches
invalidateCache.dashboard();     // Invalidate dashboard (uses schedule data)

// For granular invalidation
invalidateCache.schedule(scheduleId);  // Only invalidate specific schedule
```

## Performance Targets

### Page Load Metrics

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.0s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s

### API Response Times

- **Dashboard KPIs**: < 500ms
- **List endpoints** (paginated): < 300ms
- **MRP calculation**: < 2000ms
- **Chart data queries**: < 400ms

### Database Query Times

- **Simple lookups**: < 50ms
- **Aggregations**: < 200ms
- **Complex joins**: < 500ms

Use the performance monitoring utilities to track these metrics in production.
