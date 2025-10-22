/**
 * Schedule Generation API
 * POST /api/schedules/generate - Generate production schedules from sales forecasts
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateProductionSchedule } from '@/lib/production-planner'
import type { Priority } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      startDate,
      endDate,
      priorityFilter,
      workstationId,
      shiftsPerDay,
      includeExistingSchedules,
    } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    if (!shiftsPerDay || shiftsPerDay < 1 || shiftsPerDay > 3) {
      return NextResponse.json(
        { error: 'Shifts per day must be between 1 and 3' },
        { status: 400 }
      )
    }

    const result = await generateProductionSchedule({
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate),
      },
      priorityFilter: priorityFilter as Priority | undefined,
      workstationId: workstationId || undefined,
      shiftsPerDay: parseInt(shiftsPerDay),
      includeExistingSchedules: includeExistingSchedules === true,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error generating schedules:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedules' },
      { status: 500 }
    )
  }
}
