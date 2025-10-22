/**
 * Sales Orders API
 * GET /api/sales - Fetch sales orders with filtering
 * POST /api/sales - Create new sales order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const productId = searchParams.get('productId') || ''
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (priority) {
      where.priority = priority
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.timePeriod = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const skip = (page - 1) * limit

    const [orders, totalCount] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { timePeriod: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ])

    // Calculate summary statistics
    const allOrders = await prisma.salesOrder.findMany({
      where,
      select: {
        forecastedUnits: true,
        priority: true,
        status: true,
        timePeriod: true,
      },
    })

    const totalUnits = allOrders.reduce((sum, o) => sum + o.forecastedUnits, 0)
    const highPriorityCount = allOrders.filter((o) => o.priority === 'high').length
    const pendingCount = allOrders.filter((o) => o.status === 'pending').length

    // Check for overdue orders
    const now = new Date()
    const overdueCount = allOrders.filter(
      (o) => o.timePeriod < now && o.status !== 'completed'
    ).length

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalOrders: allOrders.length,
        totalUnits,
        highPriorityCount,
        pendingCount,
        overdueCount,
      },
    })
  } catch (error) {
    console.error('Error fetching sales orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      orderId,
      productId,
      forecastedUnits,
      timePeriod,
      priority,
      customerSegment,
      status,
    } = body

    // Validate required fields
    if (!orderId || !productId || !forecastedUnits || !timePeriod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newOrder = await prisma.salesOrder.create({
      data: {
        orderId,
        productId,
        forecastedUnits: parseFloat(forecastedUnits),
        timePeriod: new Date(timePeriod),
        priority: priority || 'medium',
        customerSegment: customerSegment || null,
        status: status || 'pending',
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error: any) {
    console.error('Error creating sales order:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Order ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create sales order' },
      { status: 500 }
    )
  }
}
