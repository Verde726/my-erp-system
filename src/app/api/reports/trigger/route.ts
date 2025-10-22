/**
 * API Route: /api/reports/trigger
 *
 * POST - Manually trigger scheduled report generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { triggerReport } from '@/lib/jobs/scheduled-reports'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TriggerReportSchema = z.object({
  reportType: z.enum(['weekly_inventory', 'monthly_financial', 'daily_production']),
})

// ============================================================================
// POST HANDLER - Trigger Report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const params = TriggerReportSchema.parse(body)

    // Trigger the report
    const result = await triggerReport(params.reportType)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: `Report generated successfully`,
          filename: result.filename,
          timestamp: result.timestamp,
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Report generation failed',
          timestamp: result.timestamp,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          issues: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error triggering report:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger report',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
