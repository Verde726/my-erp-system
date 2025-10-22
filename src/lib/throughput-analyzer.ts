/**
 * Throughput Analysis System
 *
 * Provides comprehensive production analytics including:
 * - Throughput metrics and trends
 * - Capacity predictions using statistical models
 * - Bottleneck identification
 * - OEE (Overall Equipment Effectiveness) calculations
 * - Daily usage rate analysis
 */

import { prisma } from './db'

// ============================================================================
// TYPES
// ============================================================================

export interface ThroughputMetrics {
  productId: string
  productName: string
  productSku: string
  dateRange: { start: Date; end: Date }

  // Core metrics
  totalUnitsProduced: number
  totalHoursWorked: number
  totalDataPoints: number

  // Averages
  averageUnitsPerHour: number
  averageUnitsPerDay: number
  averageEfficiency: number
  averageDefectRate: number

  // Variability
  standardDeviation: number
  coefficientOfVariation: number // CV = stdDev / mean

  // Trends
  efficiencyTrend: 'improving' | 'declining' | 'stable'
  efficiencyChange: number // Percentage change
  defectRateTrend: 'improving' | 'declining' | 'stable'
  defectRateChange: number

  // Quality
  totalDefects: number
  qualityRate: number // 1 - defect rate

  // Workstation breakdown
  workstationMetrics: Array<{
    workstationId: string
    unitsProduced: number
    hoursWorked: number
    efficiency: number
    defectRate: number
  }>
}

export interface CapacityPrediction {
  productId: string
  productName: string
  predictionDays: number
  historicalDataPoints: number

  // Predictions
  predictedDailyCapacity: number
  predictedTotalCapacity: number

  // Confidence intervals
  confidenceLower: number // -10%
  confidenceUpper: number // +10%

  // Statistical basis
  exponentialMovingAverage: number
  simpleMovingAverage: number
  trendDirection: 'increasing' | 'decreasing' | 'stable'
  trendStrength: number // 0-1

  // Assumptions
  workingDaysPerWeek: number
  workingDaysInPrediction: number
  hoursPerDay: number

  // Warnings
  warnings: string[]
}

export interface BottleneckWarning {
  scheduleId: string
  productId: string
  productName: string
  workstationId: string

  // Planned vs capacity
  plannedDailyRate: number
  historicalDailyRate: number
  capacityExceeded: number // Percentage
  shortfall: number // Units at risk

  // Timing
  startDate: Date
  endDate: Date
  durationDays: number

  // Recommendations
  severity: 'critical' | 'warning' | 'info'
  recommendations: string[]
}

export interface EfficiencyReport {
  dateRange: { start: Date; end: Date }
  workstationId?: string

  // OEE Components
  availability: number // Uptime / Total time
  performance: number // Actual / Theoretical
  quality: number // Good units / Total units
  oee: number // Availability × Performance × Quality

  // Breakdown by workstation
  workstations: Array<{
    workstationId: string
    availability: number
    performance: number
    quality: number
    oee: number
    totalHours: number
    unitsProduced: number
    defectRate: number
  }>

  // Overall statistics
  totalUnitsProduced: number
  totalHoursWorked: number
  totalDefects: number
  overallDefectRate: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WORKING_HOURS_PER_DAY = 8
const WORKING_DAYS_PER_WEEK = 5
const TREND_THRESHOLD = 0.05 // 5% change for trend detection
const EMA_ALPHA = 0.3 // Exponential moving average smoothing factor
const CONFIDENCE_INTERVAL = 0.1 // ±10%
const TARGET_OEE = 0.85 // 85% is world-class
const TARGET_DEFECT_RATE = 0.02 // 2%

// ============================================================================
// 1. THROUGHPUT ANALYSIS
// ============================================================================

export async function analyzeThroughput(
  productId: string,
  dateRange: { start: Date; end: Date }
): Promise<ThroughputMetrics> {
  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, sku: true },
  })

  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  // Get throughput data for the date range
  const throughputData = await prisma.throughputData.findMany({
    where: {
      productId,
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    orderBy: { date: 'asc' },
  })

  if (throughputData.length === 0) {
    throw new Error(
      `No throughput data found for product ${product.sku} in the specified date range`
    )
  }

  // Calculate core metrics
  const totalUnitsProduced = throughputData.reduce(
    (sum, d) => sum + d.unitsProduced,
    0
  )
  const totalHoursWorked = throughputData.reduce(
    (sum, d) => sum + d.hoursWorked,
    0
  )
  const totalDefects = throughputData.reduce(
    (sum, d) => sum + d.unitsProduced * d.defectRate,
    0
  )

  const averageUnitsPerHour = totalUnitsProduced / totalHoursWorked
  const averageUnitsPerDay = averageUnitsPerHour * WORKING_HOURS_PER_DAY
  const averageEfficiency =
    throughputData.reduce((sum, d) => sum + d.efficiency, 0) /
    throughputData.length
  const averageDefectRate =
    throughputData.reduce((sum, d) => sum + d.defectRate, 0) /
    throughputData.length

  // Calculate standard deviation of daily production
  const dailyProduction = throughputData.map((d) => d.unitsProduced)
  const mean =
    dailyProduction.reduce((sum, val) => sum + val, 0) / dailyProduction.length
  const variance =
    dailyProduction.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    dailyProduction.length
  const standardDeviation = Math.sqrt(variance)
  const coefficientOfVariation = standardDeviation / mean

  // Calculate efficiency trend (first half vs second half)
  const midpoint = Math.floor(throughputData.length / 2)
  const firstHalf = throughputData.slice(0, midpoint)
  const secondHalf = throughputData.slice(midpoint)

  const firstHalfEfficiency =
    firstHalf.reduce((sum, d) => sum + d.efficiency, 0) / firstHalf.length
  const secondHalfEfficiency =
    secondHalf.reduce((sum, d) => sum + d.efficiency, 0) / secondHalf.length

  const efficiencyChange =
    (secondHalfEfficiency - firstHalfEfficiency) / firstHalfEfficiency
  let efficiencyTrend: 'improving' | 'declining' | 'stable'
  if (efficiencyChange > TREND_THRESHOLD) {
    efficiencyTrend = 'improving'
  } else if (efficiencyChange < -TREND_THRESHOLD) {
    efficiencyTrend = 'declining'
  } else {
    efficiencyTrend = 'stable'
  }

  // Calculate defect rate trend
  const firstHalfDefectRate =
    firstHalf.reduce((sum, d) => sum + d.defectRate, 0) / firstHalf.length
  const secondHalfDefectRate =
    secondHalf.reduce((sum, d) => sum + d.defectRate, 0) / secondHalf.length

  const defectRateChange =
    (secondHalfDefectRate - firstHalfDefectRate) / firstHalfDefectRate
  let defectRateTrend: 'improving' | 'declining' | 'stable'
  // Note: For defect rate, improvement means decrease
  if (defectRateChange < -TREND_THRESHOLD) {
    defectRateTrend = 'improving'
  } else if (defectRateChange > TREND_THRESHOLD) {
    defectRateTrend = 'declining'
  } else {
    defectRateTrend = 'stable'
  }

  // Calculate workstation metrics
  const workstationMap = new Map<string, typeof throughputData>()
  for (const data of throughputData) {
    if (!workstationMap.has(data.workstationId)) {
      workstationMap.set(data.workstationId, [])
    }
    workstationMap.get(data.workstationId)!.push(data)
  }

  const workstationMetrics = Array.from(workstationMap.entries()).map(
    ([workstationId, data]) => ({
      workstationId,
      unitsProduced: data.reduce((sum, d) => sum + d.unitsProduced, 0),
      hoursWorked: data.reduce((sum, d) => sum + d.hoursWorked, 0),
      efficiency: data.reduce((sum, d) => sum + d.efficiency, 0) / data.length,
      defectRate: data.reduce((sum, d) => sum + d.defectRate, 0) / data.length,
    })
  )

  return {
    productId,
    productName: product.name,
    productSku: product.sku,
    dateRange,
    totalUnitsProduced,
    totalHoursWorked,
    totalDataPoints: throughputData.length,
    averageUnitsPerHour,
    averageUnitsPerDay,
    averageEfficiency,
    averageDefectRate,
    standardDeviation,
    coefficientOfVariation,
    efficiencyTrend,
    efficiencyChange: efficiencyChange * 100,
    defectRateTrend,
    defectRateChange: defectRateChange * 100,
    totalDefects,
    qualityRate: 1 - averageDefectRate,
    workstationMetrics,
  }
}

// ============================================================================
// 2. CAPACITY PREDICTION
// ============================================================================

export async function predictCapacity(
  productId: string,
  futureDays: number
): Promise<CapacityPrediction> {
  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, sku: true },
  })

  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  // Get historical data (last 30 days minimum, up to 90 for seasonal patterns)
  const lookbackDays = Math.min(90, Math.max(30, futureDays * 2))
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)

  const throughputData = await prisma.throughputData.findMany({
    where: {
      productId,
      date: {
        gte: startDate,
      },
    },
    orderBy: { date: 'asc' },
  })

  if (throughputData.length === 0) {
    throw new Error(
      `No historical throughput data found for product ${product.sku}`
    )
  }

  const warnings: string[] = []

  if (throughputData.length < 7) {
    warnings.push(
      `Limited historical data (${throughputData.length} days). Prediction may be less accurate.`
    )
  }

  // Calculate simple moving average
  const dailyProduction = throughputData.map(
    (d) => (d.unitsProduced / d.hoursWorked) * WORKING_HOURS_PER_DAY
  )
  const simpleMovingAverage =
    dailyProduction.reduce((sum, val) => sum + val, 0) / dailyProduction.length

  // Calculate exponential moving average (weights recent data more heavily)
  let ema = dailyProduction[0]
  for (let i = 1; i < dailyProduction.length; i++) {
    ema = EMA_ALPHA * dailyProduction[i] + (1 - EMA_ALPHA) * ema
  }

  // Detect trend direction and strength
  const firstQuarter = dailyProduction.slice(
    0,
    Math.floor(dailyProduction.length / 4)
  )
  const lastQuarter = dailyProduction.slice(-Math.floor(dailyProduction.length / 4))

  const firstAvg =
    firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length
  const lastAvg =
    lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length

  const trendChange = (lastAvg - firstAvg) / firstAvg
  const trendStrength = Math.min(1, Math.abs(trendChange) / 0.5) // Normalize to 0-1

  let trendDirection: 'increasing' | 'decreasing' | 'stable'
  if (trendChange > 0.05) {
    trendDirection = 'increasing'
  } else if (trendChange < -0.05) {
    trendDirection = 'decreasing'
  } else {
    trendDirection = 'stable'
  }

  // Apply trend adjustment to EMA for prediction
  let predictedDailyCapacity = ema
  if (trendDirection === 'increasing') {
    predictedDailyCapacity *= 1 + trendChange * 0.5 // Conservative trend projection
  } else if (trendDirection === 'decreasing') {
    predictedDailyCapacity *= 1 + trendChange * 0.5
  }

  // Calculate working days in prediction period
  const workingDaysInPrediction = Math.floor(
    (futureDays / 7) * WORKING_DAYS_PER_WEEK
  )

  const predictedTotalCapacity = predictedDailyCapacity * workingDaysInPrediction

  // Confidence intervals
  const confidenceLower = predictedDailyCapacity * (1 - CONFIDENCE_INTERVAL)
  const confidenceUpper = predictedDailyCapacity * (1 + CONFIDENCE_INTERVAL)

  // Additional warnings
  if (trendDirection === 'decreasing' && trendStrength > 0.3) {
    warnings.push(
      'Declining trend detected. Consider investigating production issues.'
    )
  }

  if (coefficientOfVariation(dailyProduction) > 0.3) {
    warnings.push(
      'High variability in production. Predictions may be less reliable.'
    )
  }

  return {
    productId,
    productName: product.name,
    predictionDays: futureDays,
    historicalDataPoints: throughputData.length,
    predictedDailyCapacity,
    predictedTotalCapacity,
    confidenceLower,
    confidenceUpper,
    exponentialMovingAverage: ema,
    simpleMovingAverage,
    trendDirection,
    trendStrength,
    workingDaysPerWeek: WORKING_DAYS_PER_WEEK,
    workingDaysInPrediction,
    hoursPerDay: WORKING_HOURS_PER_DAY,
    warnings,
  }
}

// Helper function
function coefficientOfVariation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  return stdDev / mean
}

// ============================================================================
// 3. BOTTLENECK IDENTIFICATION
// ============================================================================

export async function identifyBottlenecks(
  scheduleId: string
): Promise<BottleneckWarning[]> {
  // Get production schedule
  const schedule = await prisma.productionSchedule.findUnique({
    where: { scheduleId },
    include: {
      product: {
        select: { id: true, name: true, sku: true },
      },
    },
  })

  if (!schedule) {
    throw new Error(`Production schedule ${scheduleId} not found`)
  }

  const warnings: BottleneckWarning[] = []

  // Calculate planned daily rate
  const durationDays = Math.ceil(
    (schedule.endDate.getTime() - schedule.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1
  const plannedDailyRate = schedule.unitsToProducePerDay

  // Get historical throughput for this product and workstation
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - 30)

  const historicalData = await prisma.throughputData.findMany({
    where: {
      productId: schedule.productId,
      workstationId: schedule.workstationId,
      date: {
        gte: lookbackDate,
      },
    },
  })

  if (historicalData.length === 0) {
    warnings.push({
      scheduleId,
      productId: schedule.productId,
      productName: schedule.product.name,
      workstationId: schedule.workstationId,
      plannedDailyRate,
      historicalDailyRate: 0,
      capacityExceeded: 0,
      shortfall: 0,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      durationDays,
      severity: 'warning',
      recommendations: [
        'No historical data available for this product/workstation combination',
        'Monitor production closely during execution',
        'Consider setting conservative targets for first run',
      ],
    })
    return warnings
  }

  // Calculate historical average daily rate
  const historicalDailyRate =
    historicalData.reduce(
      (sum, d) => sum + (d.unitsProduced / d.hoursWorked) * WORKING_HOURS_PER_DAY,
      0
    ) / historicalData.length

  // Check if scheduled rate exceeds historical capacity
  const capacityRatio = plannedDailyRate / historicalDailyRate
  const capacityExceeded = (capacityRatio - 1) * 100

  if (capacityRatio > 1.1) {
    // Exceeds by more than 10%
    const totalPlanned = plannedDailyRate * durationDays
    const totalHistoricalCapacity = historicalDailyRate * durationDays
    const shortfall = totalPlanned - totalHistoricalCapacity

    let severity: 'critical' | 'warning' | 'info'
    if (capacityRatio > 1.5) {
      severity = 'critical'
    } else if (capacityRatio > 1.25) {
      severity = 'warning'
    } else {
      severity = 'info'
    }

    const recommendations: string[] = []

    if (capacityRatio > 1.3) {
      recommendations.push(
        `Extend production timeline by ${Math.ceil(durationDays * (capacityRatio - 1))} days`
      )
    }

    recommendations.push(
      `Reduce daily target to ${Math.floor(historicalDailyRate)} units/day`
    )
    recommendations.push(
      `Consider process improvements to increase capacity by ${Math.ceil(capacityExceeded)}%`
    )

    if (schedule.shiftNumber === 1) {
      recommendations.push('Consider adding second shift to increase capacity')
    }

    warnings.push({
      scheduleId,
      productId: schedule.productId,
      productName: schedule.product.name,
      workstationId: schedule.workstationId,
      plannedDailyRate,
      historicalDailyRate,
      capacityExceeded,
      shortfall,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      durationDays,
      severity,
      recommendations,
    })
  }

  return warnings
}

// ============================================================================
// 4. PRODUCTION EFFICIENCY (OEE)
// ============================================================================

export async function getProductionEfficiency(
  workstationId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<EfficiencyReport> {
  // Set default date range (last 30 days)
  const effectiveDateRange = dateRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  }

  // Build query
  const where: any = {
    date: {
      gte: effectiveDateRange.start,
      lte: effectiveDateRange.end,
    },
  }

  if (workstationId) {
    where.workstationId = workstationId
  }

  const throughputData = await prisma.throughputData.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  if (throughputData.length === 0) {
    throw new Error('No throughput data found for the specified criteria')
  }

  // Calculate overall metrics
  const totalUnitsProduced = throughputData.reduce(
    (sum, d) => sum + d.unitsProduced,
    0
  )
  const totalHoursWorked = throughputData.reduce(
    (sum, d) => sum + d.hoursWorked,
    0
  )
  const totalDefects = throughputData.reduce(
    (sum, d) => sum + d.unitsProduced * d.defectRate,
    0
  )
  const overallDefectRate = totalDefects / totalUnitsProduced

  // Calculate OEE components
  // Availability = Actual hours worked / Total available hours
  const totalDays = throughputData.length
  const totalAvailableHours = totalDays * WORKING_HOURS_PER_DAY
  const availability = totalHoursWorked / totalAvailableHours

  // Performance = Actual production rate / Theoretical production rate
  // Theoretical = Average efficiency × hours worked
  const averageEfficiency =
    throughputData.reduce((sum, d) => sum + d.efficiency, 0) /
    throughputData.length
  const theoreticalProduction = totalHoursWorked * averageEfficiency
  const performance = totalUnitsProduced / theoreticalProduction

  // Quality = Good units / Total units
  const quality = 1 - overallDefectRate

  // OEE = Availability × Performance × Quality
  const oee = availability * performance * quality

  // Calculate by workstation
  const workstationMap = new Map<string, typeof throughputData>()
  for (const data of throughputData) {
    if (!workstationMap.has(data.workstationId)) {
      workstationMap.set(data.workstationId, [])
    }
    workstationMap.get(data.workstationId)!.push(data)
  }

  const workstations = Array.from(workstationMap.entries()).map(
    ([wsId, data]) => {
      const wsUnitsProduced = data.reduce((sum, d) => sum + d.unitsProduced, 0)
      const wsHoursWorked = data.reduce((sum, d) => sum + d.hoursWorked, 0)
      const wsDefects = data.reduce(
        (sum, d) => sum + d.unitsProduced * d.defectRate,
        0
      )
      const wsDefectRate = wsDefects / wsUnitsProduced

      const wsDays = data.length
      const wsAvailableHours = wsDays * WORKING_HOURS_PER_DAY
      const wsAvailability = wsHoursWorked / wsAvailableHours

      const wsAvgEfficiency =
        data.reduce((sum, d) => sum + d.efficiency, 0) / data.length
      const wsTheoreticalProduction = wsHoursWorked * wsAvgEfficiency
      const wsPerformance = wsUnitsProduced / wsTheoreticalProduction

      const wsQuality = 1 - wsDefectRate
      const wsOee = wsAvailability * wsPerformance * wsQuality

      return {
        workstationId: wsId,
        availability: wsAvailability,
        performance: wsPerformance,
        quality: wsQuality,
        oee: wsOee,
        totalHours: wsHoursWorked,
        unitsProduced: wsUnitsProduced,
        defectRate: wsDefectRate,
      }
    }
  )

  return {
    dateRange: effectiveDateRange,
    workstationId,
    availability,
    performance,
    quality,
    oee,
    workstations,
    totalUnitsProduced,
    totalHoursWorked,
    totalDefects,
    overallDefectRate,
  }
}

// ============================================================================
// 5. DAILY USAGE RATE CALCULATION
// ============================================================================

export async function calculateDailyUsageRate(
  partNumber: string,
  days: number = 30
): Promise<number> {
  // Get BOM item to verify it exists
  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    throw new Error(`Part ${partNumber} not found`)
  }

  // Get production schedules from the last N days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const schedules = await prisma.productionSchedule.findMany({
    where: {
      startDate: {
        gte: startDate,
      },
      status: 'completed',
    },
    include: {
      product: {
        include: {
          bom: {
            where: {
              partNumber,
            },
          },
        },
      },
    },
  })

  // Calculate total parts used
  let totalPartsUsed = 0

  for (const schedule of schedules) {
    if (schedule.product.bom.length === 0) {
      continue // This product doesn't use this part
    }

    const bomEntry = schedule.product.bom[0]
    const unitsProduced = schedule.actualUnitsProduced || 0
    const partsUsed = bomEntry.quantityNeeded * unitsProduced

    totalPartsUsed += partsUsed
  }

  // Calculate average daily usage
  const dailyUsageRate = totalPartsUsed / days

  return dailyUsageRate
}
