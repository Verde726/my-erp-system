/**
 * Production Planning & Scheduling Engine
 *
 * Generates optimal production schedules from sales forecasts,
 * considering capacity constraints, priorities, and resource availability.
 */

import { prisma } from './db'
import { Priority } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleGenerationOptions {
  dateRange: {
    start: Date
    end: Date
  }
  priorityFilter?: Priority
  workstationId?: string
  shiftsPerDay: number
  includeExistingSchedules?: boolean
}

export interface ProductDemand {
  productId: string
  productSku: string
  productName: string
  totalUnits: number
  earliestDueDate: Date
  latestDueDate: Date
  highestPriority: Priority
  orderCount: number
  salesOrders: Array<{
    orderId: string
    forecastedUnits: number
    timePeriod: Date
    priority: Priority
  }>
}

export interface ProductionCapability {
  productId: string
  averageUnitsPerDay: number
  averageEfficiency: number
  averageDefectRate: number
  dataPoints: number
  recommendedWorkstation?: string
}

export interface ScheduleProposal {
  productId: string
  productSku: string
  productName: string
  unitsToProducePerDay: number
  totalUnits: number
  startDate: Date
  endDate: Date
  workstationId: string
  shiftNumber: number
  shiftsPerDay: number
  daysRequired: number
  warnings: string[]
  priority: Priority
  capacityUtilization: number
}

export interface ScheduleConflict {
  type: 'workstation_overlap' | 'capacity_exceeded' | 'date_conflict'
  severity: 'critical' | 'warning' | 'info'
  message: string
  affectedSchedules: string[]
}

export interface GenerationResult {
  proposals: ScheduleProposal[]
  conflicts: ScheduleConflict[]
  summary: {
    totalProducts: number
    totalUnits: number
    averageCapacityUtilization: number
    highPriorityCount: number
    warningCount: number
  }
}

// ============================================================================
// MAIN SCHEDULING FUNCTION
// ============================================================================

/**
 * Generate production schedules from sales forecasts
 *
 * This algorithm:
 * 1. Aggregates sales orders by product
 * 2. Retrieves historical throughput data
 * 3. Calculates production capacity
 * 4. Generates optimal schedules with constraint checking
 * 5. Detects conflicts and capacity issues
 */
export async function generateProductionSchedule(
  options: ScheduleGenerationOptions
): Promise<GenerationResult> {
  const { dateRange, priorityFilter, workstationId, shiftsPerDay } = options

  // Step 1: Get sales orders in date range
  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      timePeriod: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      ...(priorityFilter && { priority: priorityFilter }),
      status: {
        in: ['pending', 'confirmed'],
      },
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
        },
      },
    },
    orderBy: [
      { priority: 'asc' }, // high priority first
      { timePeriod: 'asc' },
    ],
  })

  if (salesOrders.length === 0) {
    return {
      proposals: [],
      conflicts: [],
      summary: {
        totalProducts: 0,
        totalUnits: 0,
        averageCapacityUtilization: 0,
        highPriorityCount: 0,
        warningCount: 0,
      },
    }
  }

  // Step 2: Aggregate demand by product
  const productDemands = aggregateDemandByProduct(salesOrders)

  // Step 3: Get historical throughput data for capacity estimation
  const productCapabilities = await getProductionCapabilities(
    productDemands.map((d) => d.productId)
  )

  // Step 4: Generate schedule proposals
  const proposals = await generateScheduleProposals(
    productDemands,
    productCapabilities,
    { workstationId, shiftsPerDay, startDate: dateRange.start }
  )

  // Step 5: Detect conflicts
  const conflicts = await detectAllConflicts(proposals, options)

  // Step 6: Calculate summary
  const summary = calculateSummary(proposals, conflicts)

  return {
    proposals,
    conflicts,
    summary,
  }
}

// ============================================================================
// DEMAND AGGREGATION
// ============================================================================

function aggregateDemandByProduct(
  salesOrders: Array<any>
): ProductDemand[] {
  const demandMap = new Map<string, ProductDemand>()

  for (const order of salesOrders) {
    const productId = order.productId
    const existing = demandMap.get(productId)

    if (existing) {
      existing.totalUnits += order.forecastedUnits
      existing.orderCount++
      existing.salesOrders.push({
        orderId: order.orderId,
        forecastedUnits: order.forecastedUnits,
        timePeriod: order.timePeriod,
        priority: order.priority,
      })

      // Update dates
      if (order.timePeriod < existing.earliestDueDate) {
        existing.earliestDueDate = order.timePeriod
      }
      if (order.timePeriod > existing.latestDueDate) {
        existing.latestDueDate = order.timePeriod
      }

      // Update priority (highest priority wins)
      if (getPriorityWeight(order.priority) > getPriorityWeight(existing.highestPriority)) {
        existing.highestPriority = order.priority
      }
    } else {
      demandMap.set(productId, {
        productId,
        productSku: order.product.sku,
        productName: order.product.name,
        totalUnits: order.forecastedUnits,
        earliestDueDate: order.timePeriod,
        latestDueDate: order.timePeriod,
        highestPriority: order.priority,
        orderCount: 1,
        salesOrders: [
          {
            orderId: order.orderId,
            forecastedUnits: order.forecastedUnits,
            timePeriod: order.timePeriod,
            priority: order.priority,
          },
        ],
      })
    }
  }

  return Array.from(demandMap.values())
}

// ============================================================================
// CAPACITY ESTIMATION
// ============================================================================

async function getProductionCapabilities(
  productIds: string[]
): Promise<Map<string, ProductionCapability>> {
  const capabilityMap = new Map<string, ProductionCapability>()

  // Get throughput data for the last 90 days for each product
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  for (const productId of productIds) {
    const throughputData = await prisma.throughputData.findMany({
      where: {
        productId,
        date: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    if (throughputData.length === 0) {
      // No historical data - use conservative estimate
      capabilityMap.set(productId, {
        productId,
        averageUnitsPerDay: 100, // Default conservative estimate
        averageEfficiency: 0.75,
        averageDefectRate: 0.05,
        dataPoints: 0,
      })
      continue
    }

    // Calculate averages
    const totalUnits = throughputData.reduce((sum, d) => sum + d.unitsProduced, 0)
    const totalHours = throughputData.reduce((sum, d) => sum + d.hoursWorked, 0)
    const totalEfficiency = throughputData.reduce((sum, d) => sum + d.efficiency, 0)
    const totalDefectRate = throughputData.reduce((sum, d) => sum + d.defectRate, 0)

    const avgUnitsPerHour = totalUnits / totalHours
    const avgUnitsPerDay = avgUnitsPerHour * 8 // 8 hour day

    // Find most common workstation
    const workstationCounts = new Map<string, number>()
    throughputData.forEach((d) => {
      workstationCounts.set(d.workstationId, (workstationCounts.get(d.workstationId) || 0) + 1)
    })
    const recommendedWorkstation = Array.from(workstationCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0]

    capabilityMap.set(productId, {
      productId,
      averageUnitsPerDay: avgUnitsPerDay,
      averageEfficiency: totalEfficiency / throughputData.length,
      averageDefectRate: totalDefectRate / throughputData.length,
      dataPoints: throughputData.length,
      recommendedWorkstation,
    })
  }

  return capabilityMap
}

// ============================================================================
// SCHEDULE GENERATION
// ============================================================================

async function generateScheduleProposals(
  demands: ProductDemand[],
  capabilities: Map<string, ProductionCapability>,
  options: {
    workstationId?: string
    shiftsPerDay: number
    startDate: Date
  }
): Promise<ScheduleProposal[]> {
  const proposals: ScheduleProposal[] = []

  // Sort by priority and due date
  const sortedDemands = demands.sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.highestPriority) - getPriorityWeight(a.highestPriority)
    if (priorityDiff !== 0) return priorityDiff
    return a.earliestDueDate.getTime() - b.earliestDueDate.getTime()
  })

  let currentDate = new Date(options.startDate)

  for (const demand of sortedDemands) {
    const capability = capabilities.get(demand.productId)
    if (!capability) continue

    // Calculate production rate
    const unitsPerDayPerShift = capability.averageUnitsPerDay
    const unitsPerDay = unitsPerDayPerShift * options.shiftsPerDay

    // Apply efficiency factor
    const effectiveUnitsPerDay = unitsPerDay * capability.averageEfficiency

    // Calculate days needed
    const daysRequired = Math.ceil(demand.totalUnits / effectiveUnitsPerDay)

    // Calculate capacity utilization
    const capacityUtilization = (demand.totalUnits / daysRequired) / unitsPerDay

    // Determine workstation
    const workstationId = options.workstationId || capability.recommendedWorkstation || 'WS-001'

    // Set dates
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + daysRequired - 1)

    // Check if we can meet the due date
    const warnings: string[] = []

    if (endDate > demand.latestDueDate) {
      warnings.push(
        `Production end date (${endDate.toISOString().split('T')[0]}) exceeds latest due date (${demand.latestDueDate.toISOString().split('T')[0]})`
      )
    }

    if (capacityUtilization > 0.9) {
      warnings.push(
        `High capacity utilization (${(capacityUtilization * 100).toFixed(1)}%). Consider extending production period or adding shifts.`
      )
    }

    if (capability.dataPoints < 5) {
      warnings.push(
        `Limited historical data (${capability.dataPoints} days). Production estimates may be inaccurate.`
      )
    }

    if (capability.averageDefectRate > 0.05) {
      warnings.push(
        `Historical defect rate is ${(capability.averageDefectRate * 100).toFixed(1)}%. Factor in extra units for quality.`
      )
    }

    proposals.push({
      productId: demand.productId,
      productSku: demand.productSku,
      productName: demand.productName,
      unitsToProducePerDay: Math.ceil(effectiveUnitsPerDay),
      totalUnits: demand.totalUnits,
      startDate,
      endDate,
      workstationId,
      shiftNumber: 1, // Default to first shift
      shiftsPerDay: options.shiftsPerDay,
      daysRequired,
      warnings,
      priority: demand.highestPriority,
      capacityUtilization,
    })

    // Move current date forward for next product
    currentDate = new Date(endDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return proposals
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

async function detectAllConflicts(
  proposals: ScheduleProposal[],
  options: ScheduleGenerationOptions
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = []

  // Check for workstation overlaps
  const workstationConflicts = detectWorkstationOverlaps(proposals)
  conflicts.push(...workstationConflicts)

  // Check for capacity constraints
  const capacityConflicts = detectCapacityIssues(proposals)
  conflicts.push(...capacityConflicts)

  // Check against existing schedules if requested
  if (options.includeExistingSchedules) {
    const existingConflicts = await detectExistingScheduleConflicts(proposals, options.dateRange)
    conflicts.push(...existingConflicts)
  }

  return conflicts
}

function detectWorkstationOverlaps(proposals: ScheduleProposal[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const workstationSchedules = new Map<string, ScheduleProposal[]>()

  // Group by workstation
  for (const proposal of proposals) {
    const existing = workstationSchedules.get(proposal.workstationId) || []
    existing.push(proposal)
    workstationSchedules.set(proposal.workstationId, existing)
  }

  // Check for overlaps within each workstation
  for (const [workstationId, schedules] of workstationSchedules) {
    if (schedules.length < 2) continue

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i]
        const b = schedules[j]

        if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
          conflicts.push({
            type: 'workstation_overlap',
            severity: 'critical',
            message: `Workstation ${workstationId} has overlapping schedules for ${a.productName} and ${b.productName}`,
            affectedSchedules: [a.productSku, b.productSku],
          })
        }
      }
    }
  }

  return conflicts
}

function detectCapacityIssues(proposals: ScheduleProposal[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (const proposal of proposals) {
    if (proposal.capacityUtilization > 0.95) {
      conflicts.push({
        type: 'capacity_exceeded',
        severity: 'warning',
        message: `${proposal.productName} utilizes ${(proposal.capacityUtilization * 100).toFixed(1)}% of capacity. Risk of delays.`,
        affectedSchedules: [proposal.productSku],
      })
    }

    if (proposal.warnings.length > 0) {
      for (const warning of proposal.warnings) {
        conflicts.push({
          type: 'date_conflict',
          severity: 'warning',
          message: `${proposal.productName}: ${warning}`,
          affectedSchedules: [proposal.productSku],
        })
      }
    }
  }

  return conflicts
}

async function detectExistingScheduleConflicts(
  proposals: ScheduleProposal[],
  dateRange: { start: Date; end: Date }
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = []

  const existingSchedules = await prisma.productionSchedule.findMany({
    where: {
      OR: [
        {
          startDate: {
            lte: dateRange.end,
          },
          endDate: {
            gte: dateRange.start,
          },
        },
      ],
      status: {
        in: ['planned', 'approved', 'in_progress'],
      },
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

  for (const proposal of proposals) {
    for (const existing of existingSchedules) {
      if (
        existing.workstationId === proposal.workstationId &&
        datesOverlap(proposal.startDate, proposal.endDate, existing.startDate, existing.endDate)
      ) {
        conflicts.push({
          type: 'workstation_overlap',
          severity: 'critical',
          message: `${proposal.productName} conflicts with existing schedule for ${existing.product.name} on workstation ${existing.workstationId}`,
          affectedSchedules: [proposal.productSku, existing.product.sku],
        })
      }
    }
  }

  return conflicts
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPriorityWeight(priority: Priority): number {
  switch (priority) {
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1
}

function calculateSummary(
  proposals: ScheduleProposal[],
  conflicts: ScheduleConflict[]
): GenerationResult['summary'] {
  const totalProducts = proposals.length
  const totalUnits = proposals.reduce((sum, p) => sum + p.totalUnits, 0)
  const avgCapacity =
    proposals.reduce((sum, p) => sum + p.capacityUtilization, 0) / (proposals.length || 1)
  const highPriorityCount = proposals.filter((p) => p.priority === 'high').length
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length

  return {
    totalProducts,
    totalUnits,
    averageCapacityUtilization: avgCapacity,
    highPriorityCount,
    warningCount,
  }
}

/**
 * Calculate production days needed for a given demand
 */
export function calculateProductionDays(
  totalUnits: number,
  unitsPerDay: number,
  efficiency: number = 0.85
): number {
  const effectiveUnitsPerDay = unitsPerDay * efficiency
  return Math.ceil(totalUnits / effectiveUnitsPerDay)
}

/**
 * Check if demand exceeds capacity constraints
 */
export function checkCapacityConstraints(
  demand: number,
  capacity: number,
  utilizationThreshold: number = 0.9
): {
  withinCapacity: boolean
  utilization: number
  warning?: string
} {
  const utilization = demand / capacity

  if (utilization > 1.0) {
    return {
      withinCapacity: false,
      utilization,
      warning: 'Demand exceeds available capacity',
    }
  }

  if (utilization > utilizationThreshold) {
    return {
      withinCapacity: true,
      utilization,
      warning: `High utilization (${(utilization * 100).toFixed(1)}%). Limited buffer for delays.`,
    }
  }

  return {
    withinCapacity: true,
    utilization,
  }
}

/**
 * Optimize workstation allocation across multiple products
 */
export async function optimizeWorkstationAllocation(
  proposals: ScheduleProposal[]
): Promise<ScheduleProposal[]> {
  // Get all available workstations
  const workstations = await prisma.productionSchedule.findMany({
    select: {
      workstationId: true,
    },
    distinct: ['workstationId'],
  })

  const workstationIds = workstations.map((w) => w.workstationId)

  // Simple greedy allocation: assign to least loaded workstation
  const workloadMap = new Map<string, number>()
  workstationIds.forEach((id) => workloadMap.set(id, 0))

  const optimized = proposals.map((proposal) => {
    // Find workstation with minimum load
    let minLoad = Infinity
    let bestWorkstation = proposal.workstationId

    for (const [wsId, load] of workloadMap) {
      if (load < minLoad) {
        minLoad = load
        bestWorkstation = wsId
      }
    }

    // Update load
    workloadMap.set(bestWorkstation, minLoad + proposal.daysRequired)

    return {
      ...proposal,
      workstationId: bestWorkstation,
    }
  })

  return optimized
}
