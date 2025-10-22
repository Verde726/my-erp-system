/**
 * Schedule Batch Save API
 * POST /api/schedules/save - Save multiple generated schedules at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schedules } = body

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        { error: 'Invalid schedules data' },
        { status: 400 }
      )
    }

    const created = []
    const errors = []

    for (const schedule of schedules) {
      try {
        const newSchedule = await prisma.productionSchedule.create({
          data: {
            scheduleId: schedule.scheduleId || `SCHED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: schedule.productId,
            unitsToProducePerDay: schedule.unitsToProducePerDay,
            startDate: new Date(schedule.startDate),
            endDate: new Date(schedule.endDate),
            workstationId: schedule.workstationId,
            shiftNumber: schedule.shiftNumber,
            status: 'planned',
          },
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        })

        created.push(newSchedule)
      } catch (error: any) {
        errors.push({
          productId: schedule.productId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors: errors.length,
      schedules: created,
      errorDetails: errors,
    })
  } catch (error) {
    console.error('Error saving schedules:', error)
    return NextResponse.json(
      { error: 'Failed to save schedules' },
      { status: 500 }
    )
  }
}
