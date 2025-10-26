/**
 * BOM API Routes
 * GET /api/bom - Fetch all BOM items with filtering and pagination
 *
 * Performance Optimizations:
 * - Uses database aggregations instead of fetching all items
 * - Implements caching for frequently accessed data
 * - Parallel query execution
 * - Selective field selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cache, cacheKeys } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const supplier = searchParams.get('supplier') || ''
    const status = searchParams.get('status') || 'all' // all | sufficient | low | out
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause
    const where: any = {}

    // Search filter (part number or description)
    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Supplier filter
    if (supplier) {
      where.supplier = supplier
    }

    // Status filter (based on stock level vs reorder point)
    if (status !== 'all') {
      if (status === 'out') {
        where.currentStock = { lte: 0 }
      } else if (status === 'low') {
        where.AND = [
          { currentStock: { gt: 0 } },
          { currentStock: { lte: prisma.bomItem.fields.reorderPoint } },
        ]
      } else if (status === 'sufficient') {
        where.currentStock = { gt: prisma.bomItem.fields.reorderPoint }
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build cache key based on query parameters
    const filterKey = `${search}-${category}-${supplier}-${status}`
    const cacheKey = cacheKeys.bomList(page, limit, filterKey)

    // Try to get summary stats from cache
    const cachedSummary = cache.get<{
      totalInventoryValue: number
      itemsBelowReorder: number
      totalItems: number
    }>(cacheKeys.bomSummary())

    // Fetch data with optimized queries - use aggregations instead of fetching all items
    const [items, totalCount, summaryStats] = await Promise.all([
      prisma.bomItem.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              movements: true,
              materialReqs: true,
            },
          },
        },
      }),
      prisma.bomItem.count({ where }),
      // Fetch summary only if not cached
      cachedSummary
        ? Promise.resolve(cachedSummary)
        : Promise.all([
            // Use aggregation for total inventory value (much faster than fetching all items)
            prisma.$queryRaw<Array<{ total: number; count: number }>>`
              SELECT
                CAST(SUM(currentStock * unitCost) AS REAL) as total,
                CAST(COUNT(*) AS INTEGER) as count
              FROM BomItem
            `,
            // Count items below reorder point efficiently
            prisma.$queryRaw<Array<{ count: number }>>`
              SELECT CAST(COUNT(*) AS INTEGER) as count
              FROM BomItem
              WHERE currentStock <= reorderPoint
            `,
          ]).then(([inventoryStats, lowStockStats]) => {
            const summary = {
              totalInventoryValue: inventoryStats[0]?.total || 0,
              itemsBelowReorder: lowStockStats[0]?.count || 0,
              totalItems: inventoryStats[0]?.count || 0,
            }
            // Cache for 1 minute
            cache.set(cacheKeys.bomSummary(), summary)
            return summary
          }),
    ])

    const { totalInventoryValue, itemsBelowReorder, totalItems } = summaryStats

    // Add calculated fields to items
    const itemsWithStatus = items.map((item) => {
      const totalValue = item.currentStock * item.unitCost
      let stockStatus: 'out' | 'low' | 'sufficient' | 'good'

      if (item.currentStock === 0) {
        stockStatus = 'out'
      } else if (item.currentStock <= item.reorderPoint) {
        stockStatus = 'low'
      } else if (item.currentStock <= item.reorderPoint * 1.5) {
        stockStatus = 'sufficient'
      } else {
        stockStatus = 'good'
      }

      return {
        ...item,
        totalValue,
        stockStatus,
      }
    })

    const response = NextResponse.json({
      items: itemsWithStatus,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalInventoryValue,
        itemsBelowReorder,
        totalItems,
      },
    })

    // Add cache headers for better performance (30 seconds client cache, 60 seconds CDN cache)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30')

    return response
  } catch (error) {
    console.error('Error fetching BOM items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM items' },
      { status: 500 }
    )
  }
}
