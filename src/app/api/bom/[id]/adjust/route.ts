/**
 * Stock Adjustment API
 * POST /api/bom/[id]/adjust - Adjust stock for a BOM item
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MovementType } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { adjustmentType, quantity, reason, reference } = body

    // Validate inputs
    if (!adjustmentType || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const parsedQuantity = parseFloat(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity === 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-zero number' },
        { status: 400 }
      )
    }

    // Get current stock
    const item = await prisma.bomItem.findUnique({
      where: { id: params.id },
      select: {
        partNumber: true,
        currentStock: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      )
    }

    const previousStock = item.currentStock
    let newStock: number
    let movementType: MovementType

    // Calculate new stock based on adjustment type
    switch (adjustmentType) {
      case 'add':
        newStock = previousStock + Math.abs(parsedQuantity)
        movementType = 'in'
        break
      case 'remove':
        newStock = previousStock - Math.abs(parsedQuantity)
        movementType = 'out'
        break
      case 'set':
        newStock = Math.abs(parsedQuantity)
        movementType = 'adjustment'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid adjustment type' },
          { status: 400 }
        )
    }

    // Prevent negative stock
    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Adjustment would result in negative stock' },
        { status: 400 }
      )
    }

    // Perform the adjustment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update stock level
      const updated = await tx.bomItem.update({
        where: { id: params.id },
        data: { currentStock: newStock },
      })

      // Create inventory movement record
      const actualQuantity =
        adjustmentType === 'set' ? newStock - previousStock : parsedQuantity

      await tx.inventoryMovement.create({
        data: {
          partNumber: item.partNumber,
          movementType,
          quantity: Math.abs(actualQuantity),
          reference: reference || null,
          reason,
          previousStock,
          newStock,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      item: result,
      adjustment: {
        previousStock,
        newStock,
        change: newStock - previousStock,
      },
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
