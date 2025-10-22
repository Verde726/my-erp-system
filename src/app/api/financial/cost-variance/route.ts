/**
 * API Route: POST /api/financial/cost-variance
 *
 * Track cost variance between estimated and actual production costs
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { trackCostVariance } from '@/lib/financial-calculator'

const CostVarianceSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  actualCosts: z.object({
    materialCost: z.number().min(0, 'Material cost must be non-negative'),
    laborCost: z.number().min(0).optional(),
    overheadCost: z.number().min(0).optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CostVarianceSchema.parse(body)

    const varianceReport = await trackCostVariance(
      validatedData.scheduleId,
      validatedData.actualCosts
    )

    return NextResponse.json({
      success: true,
      data: varianceReport,
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

    console.error('Error tracking cost variance:', error)
    return NextResponse.json(
      {
        error: 'Failed to track cost variance',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
