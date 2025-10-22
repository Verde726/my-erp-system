/**
 * MRP Creation API
 * POST /api/mrp/create - Create material requirements for a schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createMaterialRequirements } from '@/lib/mrp-calculator'

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

    await createMaterialRequirements(scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Material requirements created successfully',
    })
  } catch (error: any) {
    console.error('MRP creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create material requirements' },
      { status: 500 }
    )
  }
}
