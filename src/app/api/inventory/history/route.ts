/**
 * API Route: GET /api/inventory/history
 *
 * Get inventory movement history for audit trail
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInventoryHistory } from '@/lib/inventory-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partNumber = searchParams.get('partNumber')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!partNumber) {
      return NextResponse.json(
        { error: 'partNumber parameter is required' },
        { status: 400 }
      )
    }

    let dateRange: { start: Date; end: Date } | undefined

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    }

    const history = await getInventoryHistory(partNumber, dateRange)

    return NextResponse.json({
      partNumber,
      totalMovements: history.length,
      dateRange: dateRange || null,
      movements: history.map((m) => ({
        id: m.id,
        movementType: m.movementType,
        quantity: m.quantity,
        reference: m.reference,
        reason: m.reason,
        previousStock: m.previousStock,
        newStock: m.newStock,
        timestamp: m.timestamp,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching inventory history:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory history',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
