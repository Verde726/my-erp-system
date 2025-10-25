/**
 * API Route: GET /api/financial/inventory-value
 *
 * Get current inventory valuation with category breakdown
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateInventoryValue, calculateWIPValue } from '@/lib/financial-calculator'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWIP = searchParams.get('includeWIP') === 'true'

    // Calculate inventory value
    const inventoryValue = await calculateInventoryValue()

    // Optionally include WIP
    let wipValue = 0
    if (includeWIP) {
      wipValue = await calculateWIPValue()
    }

    return NextResponse.json({
      success: true,
      data: {
        inventory: inventoryValue,
        wip: includeWIP
          ? {
              value: wipValue,
              included: true,
            }
          : {
              included: false,
            },
        totalValue: inventoryValue.totalValue + wipValue,
      },
    })
  } catch (error: any) {
    console.error('Error calculating inventory value:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate inventory value',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
