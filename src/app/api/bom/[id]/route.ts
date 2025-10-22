/**
 * BOM Item API Routes
 * GET /api/bom/[id] - Get single BOM item with details
 * PUT /api/bom/[id] - Update BOM item
 * DELETE /api/bom/[id] - Delete BOM item
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.bomItem.findUnique({
      where: { id: params.id },
      include: {
        movements: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        materialReqs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            schedule: {
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        productBoms: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Calculate stock status
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

    return NextResponse.json({
      ...item,
      totalValue,
      stockStatus,
    })
  } catch (error) {
    console.error('Error fetching BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate required fields
    const {
      description,
      quantityPerUnit,
      unitCost,
      supplier,
      reorderPoint,
      leadTimeDays,
      category,
      safetyStock,
    } = body

    const updated = await prisma.bomItem.update({
      where: { id: params.id },
      data: {
        description,
        quantityPerUnit: parseFloat(quantityPerUnit),
        unitCost: parseFloat(unitCost),
        supplier,
        reorderPoint: parseFloat(reorderPoint),
        leadTimeDays: parseInt(leadTimeDays),
        category,
        safetyStock: parseFloat(safetyStock || 0),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to update BOM item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bomItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to delete BOM item' },
      { status: 500 }
    )
  }
}
