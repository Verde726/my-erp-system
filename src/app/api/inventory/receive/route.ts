/**
 * API Route: POST /api/inventory/receive
 *
 * Receive inventory from purchase orders or deliveries
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { receiveInventory } from '@/lib/inventory-manager'

const ReceiveInventoryItemSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  reference: z.string().optional(),
})

const ReceiveInventorySchema = z.object({
  items: z
    .array(ReceiveInventoryItemSchema)
    .min(1, 'At least one item is required'),
  purchaseOrderId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ReceiveInventorySchema.parse(body)

    // Add PO reference to all items if provided
    const itemsWithReference = validatedData.items.map((item) => ({
      ...item,
      reference:
        item.reference ||
        validatedData.purchaseOrderId ||
        'Manual Receipt',
    }))

    const movements = await receiveInventory(itemsWithReference)

    return NextResponse.json({
      success: true,
      message: `Received ${movements.length} item(s)`,
      movements: movements.map((m) => ({
        partNumber: m.partNumber,
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        timestamp: m.timestamp,
      })),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error receiving inventory:', error)
    return NextResponse.json(
      {
        error: 'Failed to receive inventory',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
