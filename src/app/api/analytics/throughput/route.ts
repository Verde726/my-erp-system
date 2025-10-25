/**
 * API Route: GET /api/analytics/throughput
 *
 * Provides throughput analytics including metrics, predictions, and bottlenecks
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import {
  analyzeThroughput,
  predictCapacity,
  identifyBottlenecks,
  getProductionEfficiency,
  calculateDailyUsageRate,
} from '@/lib/throughput-analyzer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const analysisType = searchParams.get('analysisType') as
      | 'metrics'
      | 'prediction'
      | 'bottlenecks'
      | 'efficiency'
      | 'usage'
      | null

    if (!analysisType) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: analysisType',
          validTypes: [
            'metrics',
            'prediction',
            'bottlenecks',
            'efficiency',
            'usage',
          ],
        },
        { status: 400 }
      )
    }

    // ========================================================================
    // THROUGHPUT METRICS
    // ========================================================================
    if (analysisType === 'metrics') {
      const productId = searchParams.get('productId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      if (!productId || !startDate || !endDate) {
        return NextResponse.json(
          {
            error: 'Missing required parameters for metrics analysis',
            required: ['productId', 'startDate', 'endDate'],
          },
          { status: 400 }
        )
      }

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      }

      const metrics = await analyzeThroughput(productId, dateRange)

      return NextResponse.json({
        type: 'metrics',
        data: metrics,
      })
    }

    // ========================================================================
    // CAPACITY PREDICTION
    // ========================================================================
    if (analysisType === 'prediction') {
      const productId = searchParams.get('productId')
      const futureDays = searchParams.get('futureDays')

      if (!productId || !futureDays) {
        return NextResponse.json(
          {
            error: 'Missing required parameters for capacity prediction',
            required: ['productId', 'futureDays'],
          },
          { status: 400 }
        )
      }

      const prediction = await predictCapacity(
        productId,
        parseInt(futureDays, 10)
      )

      return NextResponse.json({
        type: 'prediction',
        data: prediction,
      })
    }

    // ========================================================================
    // BOTTLENECK IDENTIFICATION
    // ========================================================================
    if (analysisType === 'bottlenecks') {
      const scheduleId = searchParams.get('scheduleId')

      if (!scheduleId) {
        return NextResponse.json(
          {
            error: 'Missing required parameter for bottleneck analysis',
            required: ['scheduleId'],
          },
          { status: 400 }
        )
      }

      const warnings = await identifyBottlenecks(scheduleId)

      return NextResponse.json({
        type: 'bottlenecks',
        data: {
          scheduleId,
          warningCount: warnings.length,
          warnings,
        },
      })
    }

    // ========================================================================
    // PRODUCTION EFFICIENCY (OEE)
    // ========================================================================
    if (analysisType === 'efficiency') {
      const workstationId = searchParams.get('workstationId') || undefined
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      let dateRange: { start: Date; end: Date } | undefined

      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        }
      }

      const efficiency = await getProductionEfficiency(
        workstationId,
        dateRange
      )

      return NextResponse.json({
        type: 'efficiency',
        data: efficiency,
      })
    }

    // ========================================================================
    // DAILY USAGE RATE
    // ========================================================================
    if (analysisType === 'usage') {
      const partNumber = searchParams.get('partNumber')
      const days = searchParams.get('days')

      if (!partNumber) {
        return NextResponse.json(
          {
            error: 'Missing required parameter for usage rate calculation',
            required: ['partNumber'],
          },
          { status: 400 }
        )
      }

      const dailyUsageRate = await calculateDailyUsageRate(
        partNumber,
        days ? parseInt(days, 10) : 30
      )

      return NextResponse.json({
        type: 'usage',
        data: {
          partNumber,
          lookbackDays: days ? parseInt(days, 10) : 30,
          dailyUsageRate,
        },
      })
    }

    return NextResponse.json(
      {
        error: 'Invalid analysis type',
        validTypes: ['metrics', 'prediction', 'bottlenecks', 'efficiency', 'usage'],
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in throughput analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform throughput analysis',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
