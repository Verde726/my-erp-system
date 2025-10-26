/**
 * Production Schedules API
 * GET /api/schedules - Fetch production schedules
 * POST /api/schedules - Create new schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const productId = searchParams.get('productId') || ''
    const workstationId = searchParams.get('workstationId') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (workstationId) {
      where.workstationId = workstationId
    }

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.AND = [
        {
          startDate: {
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
          },
        },
      ]
    }

    // Optimized query with selective fields to reduce data transfer
    const schedules = await prisma.productionSchedule.findMany({
      where,
      select: {
        id: true,
        scheduleId: true,
        productId: true,
        unitsToProducePerDay: true,
        startDate: true,
        endDate: true,
        workstationId: true,
        shiftNumber: true,
        status: true,
        actualUnitsProduced: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
          },
        },
        materialReqs: {
          select: {
            id: true,
            requiredQuantity: true,
            allocatedQuantity: true,
            status: true,
            bomItem: {
              select: {
                partNumber: true,
                description: true,
                currentStock: true,
              },
            },
          },
        },
        _count: {
          select: {
            materialReqs: true,
          },
        },
      },
      orderBy: [
        { startDate: 'asc' },
        { product: { name: 'asc' } },
      ],
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      scheduleId,
      productId,
      unitsToProducePerDay,
      startDate,
      endDate,
      workstationId,
      shiftNumber,
      status,
    } = body

    if (!scheduleId || !productId || !unitsToProducePerDay || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newSchedule = await prisma.productionSchedule.create({
      data: {
        scheduleId,
        productId,
        unitsToProducePerDay: parseFloat(unitsToProducePerDay),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        workstationId: workstationId || 'WS-001',
        shiftNumber: parseInt(shiftNumber) || 1,
        status: status || 'planned',
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

    return NextResponse.json(newSchedule, { status: 201 })
  } catch (error: any) {
    console.error('Error creating schedule:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Schedule ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
