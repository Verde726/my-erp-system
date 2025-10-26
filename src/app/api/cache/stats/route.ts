/**
 * Cache Statistics API
 * GET /api/cache/stats - Get cache performance metrics
 * POST /api/cache/clear - Clear cache (for testing/debugging)
 *
 * Provides visibility into cache performance for monitoring and optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, cache, shortCache, longCache, invalidateCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cache/stats
 * Returns cache performance statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats()

    // Calculate overall statistics
    const totalHits = stats.mainCache.hits + stats.shortCache.hits + stats.longCache.hits
    const totalMisses = stats.mainCache.misses + stats.shortCache.misses + stats.longCache.misses
    const totalRequests = totalHits + totalMisses
    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0

    return NextResponse.json({
      overall: {
        totalHits,
        totalMisses,
        totalRequests,
        hitRate: Math.round(overallHitRate * 100) / 100,
        totalCachedItems: stats.mainCache.size + stats.shortCache.size + stats.longCache.size,
      },
      caches: {
        main: {
          name: 'Main Cache (1 min TTL)',
          ...stats.mainCache,
        },
        short: {
          name: 'Short Cache (10 sec TTL)',
          ...stats.shortCache,
        },
        long: {
          name: 'Long Cache (5 min TTL)',
          ...stats.longCache,
        },
      },
      performance: {
        status: overallHitRate > 60 ? 'excellent' : overallHitRate > 40 ? 'good' : 'poor',
        recommendation:
          overallHitRate > 60
            ? 'Cache is performing well'
            : overallHitRate > 40
            ? 'Consider increasing TTL for stable data'
            : 'Review cache keys and TTL settings',
      },
    })
  } catch (error: any) {
    console.error('Error fetching cache stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cache statistics',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cache/clear
 * Clears cache for testing/debugging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { pattern } = body

    if (pattern) {
      // Clear specific pattern
      cache.clearPattern(pattern)
      return NextResponse.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
      })
    } else {
      // Clear all caches
      invalidateCache.all()
      return NextResponse.json({
        success: true,
        message: 'All caches cleared',
      })
    }
  } catch (error: any) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
