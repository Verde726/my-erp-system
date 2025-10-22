/**
 * API Route: /api/alerts/[id]
 *
 * GET - Get alert details
 * PATCH - Resolve or dismiss alert
 * DELETE - Soft delete alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveAlert, dismissAlert } from '@/lib/alert-manager'
import { prisma } from '@/lib/db'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateAlertSchema = z.object({
  action: z.enum(['resolve', 'dismiss']),
  notes: z.string().optional(),
  userId: z.string().optional(),
})

// ============================================================================
// GET HANDLER - Get Alert Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
    })

    if (!alert) {
      return NextResponse.json(
        {
          error: 'Alert not found',
          id: params.id,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(alert)
  } catch (error: any) {
    console.error('Error fetching alert:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch alert',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH HANDLER - Resolve or Dismiss Alert
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = UpdateAlertSchema.parse(body)

    let alert

    if (validated.action === 'resolve') {
      if (!validated.notes) {
        return NextResponse.json(
          {
            error: 'Resolution notes are required when resolving an alert',
          },
          { status: 400 }
        )
      }

      alert = await resolveAlert(params.id, validated.notes, validated.userId)
    } else if (validated.action === 'dismiss') {
      alert = await dismissAlert(params.id, validated.notes)
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${validated.action}d successfully`,
      alert,
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

    console.error('Error updating alert:', error)
    return NextResponse.json(
      {
        error: 'Failed to update alert',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE HANDLER - Soft Delete Alert
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by marking as dismissed
    const alert = await dismissAlert(params.id, 'Deleted by user')

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
      alert,
    })
  } catch (error: any) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete alert',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
