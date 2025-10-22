/**
 * API Route: Financial Snapshot
 *
 * GET - Retrieve financial snapshot for a specific date
 * POST - Trigger manual snapshot calculation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  calculateFinancialSnapshot,
  storeFinancialSnapshot,
} from '@/lib/financial-calculator'
import { prisma } from '@/lib/db'

// ============================================================================
// GET HANDLER - Retrieve Financial Snapshot
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Parse date (defaults to today)
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0) // Normalize to start of day

    // Try to get from database first
    const existingSnapshot = await prisma.financialMetrics.findUnique({
      where: {
        date: targetDate,
      },
    })

    if (existingSnapshot) {
      // Return stored snapshot
      return NextResponse.json({
        source: 'database',
        date: existingSnapshot.date,
        data: {
          totalInventoryValue: existingSnapshot.totalInventoryValue,
          wipValue: existingSnapshot.wipValue,
          finishedGoodsValue: existingSnapshot.finishedGoodsValue,
          totalMaterialCost: existingSnapshot.totalMaterialCost,
          productionCostEst: existingSnapshot.productionCostEst,
          createdAt: existingSnapshot.createdAt,
        },
      })
    }

    // If not exists and requesting today, calculate on-the-fly
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (targetDate.getTime() === today.getTime()) {
      const snapshot = await calculateFinancialSnapshot()

      return NextResponse.json({
        source: 'calculated',
        date: snapshot.date,
        data: snapshot,
        note: 'Real-time calculation - not yet stored in database',
      })
    }

    // Historical date not found
    return NextResponse.json(
      {
        error: 'Financial snapshot not found for the requested date',
        date: targetDate,
        suggestion: 'Use POST endpoint to generate snapshot for this date',
      },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error retrieving financial snapshot:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve financial snapshot',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST HANDLER - Generate Financial Snapshot
// ============================================================================

const GenerateSnapshotSchema = z.object({
  storeInDatabase: z.boolean().optional().default(true),
  compareWithPrevious: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeInDatabase, compareWithPrevious } =
      GenerateSnapshotSchema.parse(body)

    // Calculate snapshot
    const snapshot = await calculateFinancialSnapshot()

    // Store in database if requested
    if (storeInDatabase) {
      await storeFinancialSnapshot(snapshot)
    }

    // Compare with previous day if requested
    let comparison = null
    if (compareWithPrevious) {
      const yesterday = new Date(snapshot.date)
      yesterday.setDate(yesterday.getDate() - 1)

      const previousSnapshot = await prisma.financialMetrics.findUnique({
        where: {
          date: yesterday,
        },
      })

      if (previousSnapshot) {
        const inventoryChange =
          snapshot.totalInventoryValue - previousSnapshot.totalInventoryValue
        const inventoryChangePercent =
          (inventoryChange / previousSnapshot.totalInventoryValue) * 100

        const wipChange = snapshot.wipValue - previousSnapshot.wipValue
        const wipChangePercent =
          previousSnapshot.wipValue > 0
            ? (wipChange / previousSnapshot.wipValue) * 100
            : 0

        comparison = {
          previousDate: previousSnapshot.date,
          inventoryChange,
          inventoryChangePercent,
          wipChange,
          wipChangePercent,
          isSignificantChange:
            Math.abs(inventoryChangePercent) > 15 ||
            Math.abs(wipChangePercent) > 15,
        }

        // Create alert if significant change
        if (comparison.isSignificantChange) {
          await prisma.alert.create({
            data: {
              alertType: 'capacity_warning',
              severity: 'warning',
              title: 'Significant Financial Change Detected',
              description:
                `Financial snapshot shows significant changes from previous day. ` +
                `Inventory: ${inventoryChangePercent > 0 ? '+' : ''}${inventoryChangePercent.toFixed(1)}%, ` +
                `WIP: ${wipChangePercent > 0 ? '+' : ''}${wipChangePercent.toFixed(1)}%`,
              reference: snapshot.date.toISOString(),
              status: 'active',
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Financial snapshot generated successfully',
      snapshot,
      comparison,
      stored: storeInDatabase,
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

    console.error('Error generating financial snapshot:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate financial snapshot',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
