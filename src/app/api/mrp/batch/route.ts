/**
 * Batch MRP Processing API
 * POST /api/mrp/batch - Run MRP for all schedules with a given status
 */

import { NextRequest, NextResponse } from 'next/server'
import { runMRPForAllSchedules } from '@/lib/mrp-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status } = body

    const validStatuses = ['planned', 'approved', 'in_progress']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: planned, approved, or in_progress' },
        { status: 400 }
      )
    }

    const result = await runMRPForAllSchedules(status || 'planned')

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      message: `Processed ${result.processed} schedule(s) with ${result.errors.length} error(s)`,
    })
  } catch (error: any) {
    console.error('Batch MRP error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run batch MRP' },
      { status: 500 }
    )
  }
}
