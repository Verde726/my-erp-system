/**
 * BOM API Routes
 * GET /api/bom - Fetch all BOM items with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    // Fetch data
    const [items, totalCount] = await Promise.all([
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
    ])

    // Calculate summary statistics
    const allItems = await prisma.bomItem.findMany({
      select: {
        currentStock: true,
        unitCost: true,
        reorderPoint: true,
      },
    })

    const totalInventoryValue = allItems.reduce(
      (sum, item) => sum + item.currentStock * item.unitCost,
      0
    )

    const itemsBelowReorder = allItems.filter(
      (item) => item.currentStock <= item.reorderPoint
    ).length

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

    return NextResponse.json({
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
        totalItems: allItems.length,
      },
    })
  } catch (error) {
    console.error('Error fetching BOM items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM items' },
      { status: 500 }
    )
  }
}
