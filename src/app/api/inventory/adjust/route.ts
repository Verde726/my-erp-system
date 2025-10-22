/**
 * API Route: POST /api/inventory/adjust
 *
 * Manual inventory adjustment for corrections, cycle counts, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adjustInventory } from '@/lib/inventory-manager'

const AdjustInventorySchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AdjustInventorySchema.parse(body)

    await adjustInventory(
      validatedData.partNumber,
      validatedData.newQuantity,
      validatedData.reason
    )

    return NextResponse.json({
      success: true,
      message: `Inventory adjusted for ${validatedData.partNumber}`,
      partNumber: validatedData.partNumber,
      newQuantity: validatedData.newQuantity,
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

    console.error('Error adjusting inventory:', error)
    return NextResponse.json(
      {
        error: 'Failed to adjust inventory',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
