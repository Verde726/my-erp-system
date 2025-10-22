/**
 * API Route: POST /api/production/complete
 *
 * Marks a production schedule as complete and decrements inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { decrementInventoryForProduction } from '@/lib/inventory-manager'
import { prisma } from '@/lib/db'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CompleteProductionSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  actualUnitsProduced: z
    .number()
    .positive('Units produced must be greater than zero'),
  notes: z.string().optional(),
})

type CompleteProductionRequest = z.infer<typeof CompleteProductionSchema>

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = CompleteProductionSchema.parse(body)

    // Step 1: Verify schedule exists and is in valid state
    const schedule = await prisma.productionSchedule.findUnique({
      where: { scheduleId: validatedData.scheduleId },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        {
          error: 'Production schedule not found',
          scheduleId: validatedData.scheduleId,
        },
        { status: 404 }
      )
    }

    // Check if schedule is in a state that can be completed
    if (schedule.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Production schedule already completed',
          scheduleId: validatedData.scheduleId,
          completedAt: schedule.updatedAt,
        },
        { status: 400 }
      )
    }

    // Validate units produced is reasonable
    const plannedDays = Math.ceil(
      (schedule.endDate.getTime() - schedule.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
    const plannedTotal = schedule.unitsToProducePerDay * plannedDays

    if (validatedData.actualUnitsProduced > plannedTotal * 1.5) {
      return NextResponse.json(
        {
          error: 'Actual units produced significantly exceeds planned quantity',
          planned: plannedTotal,
          actual: validatedData.actualUnitsProduced,
          message:
            'Please verify the actual units produced. If correct, contact administrator.',
        },
        { status: 400 }
      )
    }

    // Step 2: Call decrementInventoryForProduction
    try {
      const result = await decrementInventoryForProduction(
        validatedData.scheduleId,
        validatedData.actualUnitsProduced
      )

      // Step 3: Add notes if provided
      if (validatedData.notes) {
        await prisma.productionSchedule.update({
          where: { scheduleId: validatedData.scheduleId },
          data: {
            // Note: You may need to add a 'notes' field to the schema
            // For now, we'll just log it or store it elsewhere
          },
        })
      }

      // Step 4: Return success result
      return NextResponse.json(
        {
          success: true,
          message: `Production completed for ${schedule.product.name}`,
          result: {
            scheduleId: result.scheduleId,
            productSku: schedule.product.sku,
            productName: schedule.product.name,
            unitsProduced: result.unitsProduced,
            componentsDecremented: result.componentsDecremented,
            alertsGenerated: result.alerts.length,
            alerts: result.alerts.map((alert) => ({
              id: alert.id,
              type: alert.alertType,
              severity: alert.severity,
              title: alert.title,
              description: alert.description,
            })),
          },
        },
        { status: 200 }
      )
    } catch (inventoryError: any) {
      // Step 4: Handle insufficient inventory error
      if (inventoryError.message.includes('Insufficient inventory')) {
        // Parse error message to extract part details
        const partNumberMatch = inventoryError.message.match(
          /for ([A-Z0-9-]+)/
        )
        const requiredMatch = inventoryError.message.match(/Required: ([\d.]+)/)
        const availableMatch = inventoryError.message.match(
          /Available: ([\d.]+)/
        )
        const shortageMatch = inventoryError.message.match(
          /Shortage: ([\d.]+)/
        )

        return NextResponse.json(
          {
            error: 'Insufficient inventory to complete production',
            message: inventoryError.message,
            details: {
              partNumber: partNumberMatch?.[1],
              required: requiredMatch ? parseFloat(requiredMatch[1]) : null,
              available: availableMatch
                ? parseFloat(availableMatch[1])
                : null,
              shortage: shortageMatch ? parseFloat(shortageMatch[1]) : null,
            },
            recommendation:
              'Please receive additional inventory or reduce actual units produced',
          },
          { status: 400 }
        )
      }

      // Other inventory errors
      throw inventoryError
    }
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle other errors
    console.error('Error completing production:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete production',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET HANDLER - Get production completion status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId parameter is required' },
        { status: 400 }
      )
    }

    const schedule = await prisma.productionSchedule.findUnique({
      where: { scheduleId },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Production schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      scheduleId: schedule.scheduleId,
      productSku: schedule.product.sku,
      productName: schedule.product.name,
      status: schedule.status,
      plannedUnits:
        schedule.unitsToProducePerDay *
        (Math.ceil(
          (schedule.endDate.getTime() - schedule.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1),
      actualUnitsProduced: schedule.actualUnitsProduced,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      workstationId: schedule.workstationId,
      shiftNumber: schedule.shiftNumber,
      isCompleted: schedule.status === 'completed',
      canComplete:
        schedule.status === 'in_progress' || schedule.status === 'planned',
    })
  } catch (error: any) {
    console.error('Error fetching production status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production status' },
      { status: 500 }
    )
  }
}
