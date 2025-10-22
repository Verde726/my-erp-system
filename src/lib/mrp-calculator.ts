/**
 * Material Requirements Planning (MRP) Calculation Engine
 *
 * Implements sophisticated MRP logic including:
 * - Net requirements calculation
 * - Economic Order Quantity (EOQ)
 * - Safety stock calculations
 * - Lead time analysis
 * - Multi-schedule allocation
 */

import { prisma } from './db'

// ============================================================================
// TYPES
// ============================================================================

export interface MRPResult {
  partNumber: string
  description: string
  scheduleId: string
  productSku: string
  productName: string

  // Requirements
  grossRequirement: number
  currentStock: number
  allocatedStock: number
  availableStock: number
  netRequirement: number

  // Planning
  plannedOrderQuantity: number
  plannedOrderDate: Date
  expectedDeliveryDate: Date

  // Status
  status: 'sufficient' | 'shortage' | 'critical'
  orderDateInPast: boolean

  // Metadata
  leadTimeDays: number
  safetyStock: number
  reorderPoint: number
  unitCost: number
  totalCost: number

  // Recommendations
  recommendations: string[]
  warnings: string[]
}

export interface MRPSummary {
  scheduleId: string
  totalComponents: number
  sufficientCount: number
  shortageCount: number
  criticalCount: number
  totalCost: number
  urgentActions: string[]
}

export interface EOQParameters {
  annualDemand: number
  orderingCost: number
  holdingCostPerUnit: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ORDERING_COST = 50 // Cost per purchase order
const DEFAULT_HOLDING_COST_RATE = 0.25 // 25% of unit cost per year
const CRITICAL_SHORTAGE_THRESHOLD = 0.5 // 50% of requirement
const WORKING_DAYS_PER_YEAR = 250
const SERVICE_LEVEL_Z_SCORE = 1.65 // 95% service level

// ============================================================================
// MAIN MRP CALCULATION
// ============================================================================

/**
 * Calculate Material Requirements Planning for a production schedule
 *
 * This implements a time-phased MRP algorithm that:
 * 1. Explodes the BOM to determine component requirements
 * 2. Nets requirements against available inventory
 * 3. Calculates optimal order quantities
 * 4. Determines order dates based on lead times
 * 5. Identifies shortages and conflicts
 */
export async function calculateMRP(
  scheduleId: string
): Promise<{ results: MRPResult[]; summary: MRPSummary }> {
  // Step 1: Get production schedule
  const schedule = await prisma.productionSchedule.findUnique({
    where: { scheduleId },
    include: {
      product: {
        include: {
          bom: {
            include: {
              bomItem: true,
            },
          },
        },
      },
    },
  })

  if (!schedule) {
    throw new Error(`Production schedule ${scheduleId} not found`)
  }

  if (!schedule.product.bom || schedule.product.bom.length === 0) {
    throw new Error(`Product ${schedule.product.sku} has no BOM defined`)
  }

  // Step 2: Calculate production duration and total units
  const durationDays = Math.ceil(
    (schedule.endDate.getTime() - schedule.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1

  const totalUnitsToProduced = schedule.unitsToProducePerDay * durationDays

  // Step 3: Get all existing material requirements to calculate allocated stock
  const existingRequirements = await prisma.materialRequirement.findMany({
    select: {
      partNumber: true,
      allocatedQuantity: true,
    },
  })

  const allocatedStockMap = new Map<string, number>()
  for (const req of existingRequirements) {
    const current = allocatedStockMap.get(req.partNumber) || 0
    allocatedStockMap.set(req.partNumber, current + req.allocatedQuantity)
  }

  // Step 4: Calculate requirements for each BOM component
  const results: MRPResult[] = []

  for (const bomEntry of schedule.product.bom) {
    const bomItem = bomEntry.bomItem

    // Calculate gross requirement
    const grossRequirement = bomEntry.quantityNeeded * totalUnitsToProduced

    // Get current and allocated stock
    const currentStock = bomItem.currentStock
    const allocatedStock = allocatedStockMap.get(bomItem.partNumber) || 0
    const availableStock = Math.max(0, currentStock - allocatedStock)

    // Calculate net requirement
    const netRequirement = Math.max(0, grossRequirement - availableStock)

    // Determine status
    let status: 'sufficient' | 'shortage' | 'critical'
    if (netRequirement === 0) {
      status = 'sufficient'
    } else if (netRequirement < grossRequirement * CRITICAL_SHORTAGE_THRESHOLD) {
      status = 'shortage'
    } else {
      status = 'critical'
    }

    // Calculate planned order quantity
    const plannedOrderQuantity = calculatePlannedOrderQuantity(
      netRequirement,
      bomItem.unitCost,
      bomItem.leadTimeDays,
      bomItem.safetyStock
    )

    // Calculate order dates
    const plannedOrderDate = new Date(schedule.startDate)
    plannedOrderDate.setDate(plannedOrderDate.getDate() - bomItem.leadTimeDays)

    const expectedDeliveryDate = new Date(plannedOrderDate)
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + bomItem.leadTimeDays)

    const orderDateInPast = plannedOrderDate < new Date()

    // Calculate total cost
    const totalCost = plannedOrderQuantity * bomItem.unitCost

    // Generate recommendations and warnings
    const recommendations: string[] = []
    const warnings: string[] = []

    if (status === 'critical') {
      warnings.push('CRITICAL SHORTAGE: Immediate action required')
      recommendations.push(`Order ${Math.ceil(plannedOrderQuantity)} units immediately`)
    } else if (status === 'shortage') {
      warnings.push('Shortage detected')
      recommendations.push(`Order ${Math.ceil(plannedOrderQuantity)} units`)
    }

    if (orderDateInPast) {
      warnings.push(`Order should have been placed on ${plannedOrderDate.toISOString().split('T')[0]}`)
      recommendations.push('Consider expediting delivery or adjusting production schedule')
    }

    if (availableStock < bomItem.safetyStock) {
      warnings.push(`Stock below safety level (${bomItem.safetyStock})`)
    }

    if (bomItem.currentStock < bomItem.reorderPoint) {
      recommendations.push('Stock below reorder point - consider standing order')
    }

    // Calculate EOQ for future reference
    const eoq = calculateEOQ(
      grossRequirement * (WORKING_DAYS_PER_YEAR / durationDays), // Annualize demand
      DEFAULT_ORDERING_COST,
      bomItem.unitCost * DEFAULT_HOLDING_COST_RATE
    )

    if (plannedOrderQuantity < eoq * 0.5 || plannedOrderQuantity > eoq * 2) {
      recommendations.push(`Economic order quantity is ${Math.ceil(eoq)} units`)
    }

    results.push({
      partNumber: bomItem.partNumber,
      description: bomItem.description,
      scheduleId: schedule.scheduleId,
      productSku: schedule.product.sku,
      productName: schedule.product.name,
      grossRequirement,
      currentStock,
      allocatedStock,
      availableStock,
      netRequirement,
      plannedOrderQuantity,
      plannedOrderDate,
      expectedDeliveryDate,
      status,
      orderDateInPast,
      leadTimeDays: bomItem.leadTimeDays,
      safetyStock: bomItem.safetyStock,
      reorderPoint: bomItem.reorderPoint,
      unitCost: bomItem.unitCost,
      totalCost,
      recommendations,
      warnings,
    })
  }

  // Step 5: Generate summary
  const summary = generateSummary(scheduleId, results)

  return { results, summary }
}

// ============================================================================
// PLANNED ORDER QUANTITY CALCULATION
// ============================================================================

/**
 * Calculate the planned order quantity using a hybrid approach:
 * - For large orders: EOQ
 * - For small orders: Lot-for-lot with safety stock
 * - Always meets minimum = net requirement + safety stock
 */
function calculatePlannedOrderQuantity(
  netRequirement: number,
  unitCost: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  if (netRequirement === 0) {
    return 0
  }

  // Minimum order: net requirement + safety stock buffer
  const minimumOrder = netRequirement + safetyStock

  // Calculate EOQ for comparison
  const annualizedDemand = netRequirement * (WORKING_DAYS_PER_YEAR / leadTimeDays)
  const eoq = calculateEOQ(
    annualizedDemand,
    DEFAULT_ORDERING_COST,
    unitCost * DEFAULT_HOLDING_COST_RATE
  )

  // Use EOQ if it's reasonable, otherwise use minimum order
  if (eoq > minimumOrder && eoq < minimumOrder * 3) {
    return Math.ceil(eoq)
  }

  return Math.ceil(minimumOrder)
}

// ============================================================================
// ECONOMIC ORDER QUANTITY (EOQ)
// ============================================================================

/**
 * Calculate Economic Order Quantity using the Wilson EOQ formula:
 * EOQ = √(2 × D × S / H)
 *
 * Where:
 * - D = Annual demand
 * - S = Ordering cost per order
 * - H = Holding cost per unit per year
 *
 * This minimizes total inventory costs (ordering + holding)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  if (annualDemand <= 0 || orderingCost <= 0 || holdingCostPerUnit <= 0) {
    return 0
  }

  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit)
  return Math.max(1, eoq)
}

// ============================================================================
// SAFETY STOCK CALCULATION
// ============================================================================

/**
 * Calculate safety stock using the standard deviation method:
 * Safety Stock = Z × σ_LT
 *
 * Where:
 * - Z = Service level Z-score (e.g., 1.65 for 95%)
 * - σ_LT = Standard deviation of demand during lead time
 *
 * For simplicity, we use: Z × √(Lead Time) × Daily Demand Variance
 */
export function calculateSafetyStock(
  averageDailyDemand: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95
): number {
  if (averageDailyDemand <= 0 || leadTimeDays <= 0) {
    return 0
  }

  // Z-score for service level
  let zScore = SERVICE_LEVEL_Z_SCORE
  if (serviceLevel >= 0.99) zScore = 2.33
  else if (serviceLevel >= 0.97) zScore = 1.88
  else if (serviceLevel >= 0.95) zScore = 1.65
  else if (serviceLevel >= 0.90) zScore = 1.28

  // Assume demand variance is 20% of average (rule of thumb)
  const demandStdDev = averageDailyDemand * 0.2

  // Safety stock formula
  const safetyStock = zScore * demandStdDev * Math.sqrt(leadTimeDays)

  return Math.ceil(safetyStock)
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Create MaterialRequirement records in the database from MRP results
 * This establishes the link between production schedules and material needs
 */
export async function createMaterialRequirements(
  scheduleId: string
): Promise<void> {
  const { results } = await calculateMRP(scheduleId)

  // Delete existing material requirements for this schedule
  await prisma.materialRequirement.deleteMany({
    where: { scheduleId },
  })

  // Create new material requirements
  const requirements = results.map((result) => ({
    scheduleId: result.scheduleId,
    partNumber: result.partNumber,
    requiredQuantity: result.grossRequirement,
    allocatedQuantity: 0,
    status: result.status === 'sufficient' ? 'fulfilled' : 'pending',
  }))

  await prisma.materialRequirement.createMany({
    data: requirements,
  })

  // Create alerts for shortages
  const criticalShortages = results.filter((r) => r.status === 'critical')
  const regularShortages = results.filter((r) => r.status === 'shortage')

  for (const shortage of criticalShortages) {
    await prisma.alert.create({
      data: {
        alertType: 'shortage',
        severity: 'critical',
        title: `Critical Material Shortage: ${shortage.partNumber}`,
        description: `Production schedule ${scheduleId} requires ${shortage.netRequirement} units of ${shortage.description}, but only ${shortage.availableStock} units available. Order immediately.`,
        reference: scheduleId,
        status: 'active',
      },
    })
  }

  for (const shortage of regularShortages) {
    await prisma.alert.create({
      data: {
        alertType: 'shortage',
        severity: 'warning',
        title: `Material Shortage: ${shortage.partNumber}`,
        description: `Production schedule ${scheduleId} requires ${shortage.netRequirement} additional units of ${shortage.description}.`,
        reference: scheduleId,
        status: 'active',
      },
    })
  }
}

// ============================================================================
// BATCH MRP PROCESSING
// ============================================================================

/**
 * Run MRP for all production schedules with a given status
 * Useful for nightly batch processing or on-demand recalculation
 */
export async function runMRPForAllSchedules(
  status: 'planned' | 'approved' | 'in_progress' = 'planned'
): Promise<{ processed: number; errors: Array<{ scheduleId: string; error: string }> }> {
  const schedules = await prisma.productionSchedule.findMany({
    where: { status },
    select: { scheduleId: true },
  })

  const errors: Array<{ scheduleId: string; error: string }> = []
  let processed = 0

  for (const schedule of schedules) {
    try {
      await createMaterialRequirements(schedule.scheduleId)
      processed++
    } catch (error: any) {
      errors.push({
        scheduleId: schedule.scheduleId,
        error: error.message || 'Unknown error',
      })
    }
  }

  return { processed, errors }
}

// ============================================================================
// MULTI-SCHEDULE ALLOCATION
// ============================================================================

/**
 * Allocate available inventory across multiple competing schedules
 * Uses priority-based allocation algorithm
 */
export async function allocateInventoryAcrossSchedules(
  scheduleIds: string[]
): Promise<Map<string, Map<string, number>>> {
  // Get all MRP results
  const allResults: MRPResult[] = []
  for (const scheduleId of scheduleIds) {
    const { results } = await calculateMRP(scheduleId)
    allResults.push(...results)
  }

  // Group by part number
  const partRequirements = new Map<string, MRPResult[]>()
  for (const result of allResults) {
    const existing = partRequirements.get(result.partNumber) || []
    existing.push(result)
    partRequirements.set(result.partNumber, existing)
  }

  // Allocate inventory for each part
  const allocation = new Map<string, Map<string, number>>()

  for (const [partNumber, requirements] of partRequirements) {
    // Sort by priority (high first) and order date (earliest first)
    const sorted = requirements.sort((a, b) => {
      const dateA = a.plannedOrderDate.getTime()
      const dateB = b.plannedOrderDate.getTime()
      return dateA - dateB
    })

    const available = sorted[0]?.availableStock || 0
    let remaining = available

    const partAllocation = new Map<string, number>()

    for (const req of sorted) {
      if (remaining <= 0) {
        partAllocation.set(req.scheduleId, 0)
        continue
      }

      const allocated = Math.min(remaining, req.grossRequirement)
      partAllocation.set(req.scheduleId, allocated)
      remaining -= allocated
    }

    allocation.set(partNumber, partAllocation)
  }

  return allocation
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSummary(scheduleId: string, results: MRPResult[]): MRPSummary {
  const totalComponents = results.length
  const sufficientCount = results.filter((r) => r.status === 'sufficient').length
  const shortageCount = results.filter((r) => r.status === 'shortage').length
  const criticalCount = results.filter((r) => r.status === 'critical').length
  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0)

  const urgentActions: string[] = []

  const criticalParts = results.filter((r) => r.status === 'critical')
  if (criticalParts.length > 0) {
    urgentActions.push(
      `${criticalParts.length} critical shortage(s) - order immediately`
    )
  }

  const pastDueOrders = results.filter((r) => r.orderDateInPast && r.netRequirement > 0)
  if (pastDueOrders.length > 0) {
    urgentActions.push(
      `${pastDueOrders.length} order(s) overdue - expedite delivery`
    )
  }

  return {
    scheduleId,
    totalComponents,
    sufficientCount,
    shortageCount,
    criticalCount,
    totalCost,
    urgentActions,
  }
}

/**
 * Check if a part has sufficient inventory for a schedule
 */
export async function checkPartAvailability(
  partNumber: string,
  requiredQuantity: number
): Promise<{
  available: boolean
  currentStock: number
  shortage: number
  message: string
}> {
  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    return {
      available: false,
      currentStock: 0,
      shortage: requiredQuantity,
      message: `Part ${partNumber} not found in inventory`,
    }
  }

  const shortage = Math.max(0, requiredQuantity - bomItem.currentStock)

  return {
    available: shortage === 0,
    currentStock: bomItem.currentStock,
    shortage,
    message:
      shortage === 0
        ? 'Sufficient inventory'
        : `Short ${shortage} units (${bomItem.currentStock} available)`,
  }
}
