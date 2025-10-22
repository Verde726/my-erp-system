/**
 * MRP Calculation API
 * POST /api/mrp/calculate - Calculate MRP for a production schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateMRP } from '@/lib/mrp-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const result = await calculateMRP(scheduleId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('MRP calculation error:', error)

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message.includes('no BOM')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to calculate MRP' },
      { status: 500 }
    )
  }
}
