/**
 * API Route: /api/alerts
 *
 * GET - List alerts with filters and pagination
 * POST - Create manual alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getActiveAlerts,
  createAlert,
  AlertFilters,
} from '@/lib/alert-manager'
import { AlertType, Severity } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AlertTypeSchema = z.enum([
  'shortage',
  'reorder',
  'schedule_conflict',
  'cost_overrun',
  'capacity_warning',
  'quality_issue',
  'delivery_risk',
])

const SeveritySchema = z.enum(['critical', 'warning', 'info'])

const CreateAlertSchema = z.object({
  type: AlertTypeSchema,
  severity: SeveritySchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  reference: z.string().optional(),
})

// ============================================================================
// GET HANDLER - List Alerts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters: AlertFilters = {}

    // Type filter
    const typeParam = searchParams.get('type')
    if (typeParam) {
      const types = typeParam.split(',') as AlertType[]
      filters.type = types.length === 1 ? types[0] : types
    }

    // Severity filter
    const severityParam = searchParams.get('severity')
    if (severityParam) {
      const severities = severityParam.split(',') as Severity[]
      filters.severity = severities.length === 1 ? severities[0] : severities
    }

    // Reference filter
    const reference = searchParams.get('reference')
    if (reference) {
      filters.reference = reference
    }

    // Status filter
    const status = searchParams.get('status') as 'active' | 'resolved' | 'dismissed' | null
    if (status) {
      filters.status = status
    }

    // Date filters
    const createdAfter = searchParams.get('createdAfter')
    if (createdAfter) {
      filters.createdAfter = new Date(createdAfter)
    }

    const createdBefore = searchParams.get('createdBefore')
    if (createdBefore) {
      filters.createdBefore = new Date(createdBefore)
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    )

    const result = await getActiveAlerts(filters, { page, limit })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST HANDLER - Create Manual Alert
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateAlertSchema.parse(body)

    const alert = await createAlert(
      validated.type,
      validated.severity,
      validated.title,
      validated.description,
      validated.reference
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Alert created successfully',
        alert,
      },
      { status: 201 }
    )
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

    console.error('Error creating alert:', error)
    return NextResponse.json(
      {
        error: 'Failed to create alert',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
