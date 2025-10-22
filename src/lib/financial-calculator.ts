/**
 * Financial Calculator - Cost Tracking & Financial Analysis
 *
 * Comprehensive financial management including:
 * - Material cost calculations
 * - Production cost tracking
 * - Inventory valuation
 * - WIP (Work-In-Progress) valuation
 * - Cost variance analysis
 * - Profitability analysis
 * - Financial snapshots
 */

import { prisma } from './db'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductionCostBreakdown {
  scheduleId: string
  productName: string
  productSku: string
  totalUnits: number
  materialCostPerUnit: number
  totalMaterialCost: number
  overheadAllocation: number
  totalProductionCost: number
  costPerUnit: number
}

export interface InventoryValuation {
  totalValue: number
  breakdown: {
    rawMaterials: number
    components: number
    finishedGoods: number
  }
  byCategory: Record<string, number>
  itemCount: number
  items: Array<{
    partNumber: string
    description: string
    category: string
    currentStock: number
    unitCost: number
    totalValue: number
  }>
}

export interface FinancialSnapshot {
  date: Date

  // Inventory
  totalInventoryValue: number
  rawMaterialsValue: number
  componentsValue: number
  finishedGoodsValue: number

  // Production
  wipValue: number
  completedProductionValue: number

  // Costs
  totalMaterialCost: number
  totalProductionCost: number
  projectedCosts30Days: number

  // Breakdown
  costBreakdown: {
    category: string
    value: number
    percentage: number
  }[]

  // Metrics
  inventoryTurnoverRatio: number
  daysOfInventoryOnHand: number
  averageDailyProductionCost: number

  // Cash flow
  cashFlowImpact: {
    materialsPurchased: number
    productionCompleted: number
    netChange: number
  }
}

export interface CostVarianceReport {
  scheduleId: string
  productName: string

  // Estimated costs
  estimatedMaterialCost: number
  estimatedOverheadCost: number
  estimatedTotalCost: number

  // Actual costs
  actualMaterialCost: number
  actualLaborCost: number
  actualOverheadCost: number
  actualTotalCost: number

  // Variances
  materialVariance: number
  materialVariancePercent: number
  laborVariance: number
  laborVariancePercent: number
  overheadVariance: number
  overheadVariancePercent: number
  totalVariance: number
  totalVariancePercent: number

  // Classification
  isFavorable: boolean
  isSignificant: boolean // >10% variance
  alertCreated: boolean
}

export interface ProfitabilityAnalysis {
  productId: string
  productName: string
  productSku: string

  // Costs
  materialCostPerUnit: number
  overheadPerUnit: number
  totalCostPerUnit: number

  // Revenue
  sellingPrice: number

  // Profitability
  grossMarginDollars: number
  grossMarginPercent: number

  // Target comparison
  targetMargin: number
  marginVariance: number
  meetsTarget: boolean

  // Recommendations
  recommendations: string[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OVERHEAD_RATE = 0.15 // 15% overhead allocation
const SIGNIFICANT_VARIANCE_THRESHOLD = 0.1 // 10%
const INVENTORY_TURNOVER_PERIOD_DAYS = 365
const SIGNIFICANT_CHANGE_THRESHOLD = 0.15 // 15% for daily alerts

// ============================================================================
// 1. MATERIAL COST PER UNIT
// ============================================================================

/**
 * Calculate total material cost per unit for a product
 * Sums the cost of all BOM components needed to make one unit
 */
export async function calculateMaterialCostPerUnit(
  productId: string
): Promise<number> {
  // Get product with BOM
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      bom: {
        include: {
          bomItem: true,
        },
      },
    },
  })

  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  if (!product.bom || product.bom.length === 0) {
    throw new Error(`Product ${product.sku} has no BOM defined`)
  }

  // Calculate total material cost
  let totalMaterialCost = 0

  for (const bomEntry of product.bom) {
    const componentCost = bomEntry.bomItem.unitCost * bomEntry.quantityNeeded
    totalMaterialCost += componentCost
  }

  return totalMaterialCost
}

// ============================================================================
// 2. PRODUCTION COST BREAKDOWN
// ============================================================================

/**
 * Calculate complete production cost breakdown for a schedule
 * Includes materials, overhead allocation, and per-unit costs
 */
export async function calculateProductionCost(
  scheduleId: string
): Promise<ProductionCostBreakdown> {
  // Get production schedule
  const schedule = await prisma.productionSchedule.findUnique({
    where: { scheduleId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
  })

  if (!schedule) {
    throw new Error(`Production schedule ${scheduleId} not found`)
  }

  // Calculate total units
  const durationDays = Math.ceil(
    (schedule.endDate.getTime() - schedule.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1
  const totalUnits = schedule.unitsToProducePerDay * durationDays

  // Get material cost per unit
  const materialCostPerUnit = await calculateMaterialCostPerUnit(
    schedule.product.id
  )

  // Calculate costs
  const totalMaterialCost = materialCostPerUnit * totalUnits
  const overheadAllocation = totalMaterialCost * OVERHEAD_RATE
  const totalProductionCost = totalMaterialCost + overheadAllocation
  const costPerUnit = totalProductionCost / totalUnits

  return {
    scheduleId,
    productName: schedule.product.name,
    productSku: schedule.product.sku,
    totalUnits,
    materialCostPerUnit,
    totalMaterialCost,
    overheadAllocation,
    totalProductionCost,
    costPerUnit,
  }
}

// ============================================================================
// 3. INVENTORY VALUATION
// ============================================================================

/**
 * Calculate total inventory value across all BOM items
 * Groups by category and provides detailed breakdown
 */
export async function calculateInventoryValue(): Promise<InventoryValuation> {
  // Get all BOM items
  const bomItems = await prisma.bomItem.findMany({
    orderBy: { category: 'asc' },
  })

  if (bomItems.length === 0) {
    return {
      totalValue: 0,
      breakdown: {
        rawMaterials: 0,
        components: 0,
        finishedGoods: 0,
      },
      byCategory: {},
      itemCount: 0,
      items: [],
    }
  }

  let totalValue = 0
  const byCategory: Record<string, number> = {}
  const items: InventoryValuation['items'] = []

  // Calculate value for each item
  for (const item of bomItems) {
    const itemValue = item.currentStock * item.unitCost
    totalValue += itemValue

    // Track by category
    if (!byCategory[item.category]) {
      byCategory[item.category] = 0
    }
    byCategory[item.category] += itemValue

    items.push({
      partNumber: item.partNumber,
      description: item.description,
      category: item.category,
      currentStock: item.currentStock,
      unitCost: item.unitCost,
      totalValue: itemValue,
    })
  }

  // Categorize into breakdown (simplified categorization)
  const breakdown = {
    rawMaterials: byCategory['Raw Materials'] || 0,
    components: byCategory['Components'] || byCategory['Parts'] || 0,
    finishedGoods: byCategory['Finished Goods'] || 0,
  }

  // Add any uncategorized items to components
  const categorizedTotal = Object.values(breakdown).reduce(
    (sum, val) => sum + val,
    0
  )
  if (categorizedTotal < totalValue) {
    breakdown.components += totalValue - categorizedTotal
  }

  return {
    totalValue,
    breakdown,
    byCategory,
    itemCount: bomItems.length,
    items,
  }
}

// ============================================================================
// 4. WORK-IN-PROGRESS (WIP) VALUATION
// ============================================================================

/**
 * Calculate value of work-in-progress production
 * Includes material costs and proportional overhead for in-progress schedules
 */
export async function calculateWIPValue(): Promise<number> {
  // Get all in-progress production schedules
  const inProgressSchedules = await prisma.productionSchedule.findMany({
    where: {
      status: 'in_progress',
    },
    include: {
      product: {
        select: {
          id: true,
        },
      },
    },
  })

  if (inProgressSchedules.length === 0) {
    return 0
  }

  let totalWIPValue = 0

  for (const schedule of inProgressSchedules) {
    // Calculate units in progress
    const durationDays = Math.ceil(
      (schedule.endDate.getTime() - schedule.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
    const totalUnits = schedule.unitsToProducePerDay * durationDays

    // Get material cost per unit
    const materialCostPerUnit = await calculateMaterialCostPerUnit(
      schedule.product.id
    )

    // Calculate WIP value
    const materialCost = materialCostPerUnit * totalUnits
    const overheadAllocation = materialCost * OVERHEAD_RATE
    const wipValue = materialCost + overheadAllocation

    totalWIPValue += wipValue
  }

  return totalWIPValue
}

// ============================================================================
// 5. COMPREHENSIVE FINANCIAL SNAPSHOT
// ============================================================================

/**
 * Generate comprehensive financial snapshot
 * Aggregates data from inventory, production, and costs
 */
export async function calculateFinancialSnapshot(): Promise<FinancialSnapshot> {
  const snapshotDate = new Date()

  // 1. Get inventory valuation
  const inventoryValuation = await calculateInventoryValue()

  // 2. Get WIP value
  const wipValue = await calculateWIPValue()

  // 3. Calculate completed production value (last 30 days)
  const thirtyDaysAgo = new Date(snapshotDate)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const completedSchedules = await prisma.productionSchedule.findMany({
    where: {
      status: 'completed',
      updatedAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      product: {
        select: {
          id: true,
        },
      },
    },
  })

  let completedProductionValue = 0
  for (const schedule of completedSchedules) {
    const costBreakdown = await calculateProductionCost(schedule.scheduleId)
    completedProductionValue += costBreakdown.totalProductionCost
  }

  // 4. Calculate projected costs (next 30 days)
  const thirtyDaysFromNow = new Date(snapshotDate)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const upcomingSchedules = await prisma.productionSchedule.findMany({
    where: {
      status: {
        in: ['planned', 'approved'],
      },
      startDate: {
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      product: {
        select: {
          id: true,
        },
      },
    },
  })

  let projectedCosts30Days = 0
  for (const schedule of upcomingSchedules) {
    try {
      const costBreakdown = await calculateProductionCost(schedule.scheduleId)
      projectedCosts30Days += costBreakdown.totalProductionCost
    } catch (error) {
      // Skip schedules with missing BOM data
      console.warn(`Could not calculate cost for schedule ${schedule.scheduleId}`)
    }
  }

  // 5. Build cost breakdown
  const costBreakdown = Object.entries(inventoryValuation.byCategory).map(
    ([category, value]) => ({
      category,
      value,
      percentage: (value / inventoryValuation.totalValue) * 100,
    })
  )

  // 6. Calculate metrics
  const averageDailyProductionCost = await getAverageDailyProductionCost(30)

  // Inventory turnover ratio = COGS / Average Inventory
  // Simplified: annual production cost / current inventory value
  const annualProductionCost = averageDailyProductionCost * INVENTORY_TURNOVER_PERIOD_DAYS
  const inventoryTurnoverRatio =
    inventoryValuation.totalValue > 0
      ? annualProductionCost / inventoryValuation.totalValue
      : 0

  // Days of inventory on hand = 365 / turnover ratio
  const daysOfInventoryOnHand =
    inventoryTurnoverRatio > 0 ? INVENTORY_TURNOVER_PERIOD_DAYS / inventoryTurnoverRatio : 0

  // 7. Calculate cash flow impact
  // Get inventory movements from last 30 days
  const inventoryMovements = await prisma.inventoryMovement.findMany({
    where: {
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      bomItem: true,
    },
  })

  let materialsPurchased = 0
  let materialsUsed = 0

  for (const movement of inventoryMovements) {
    const value = movement.quantity * movement.bomItem.unitCost

    if (movement.movementType === 'in') {
      materialsPurchased += value
    } else if (movement.movementType === 'out') {
      materialsUsed += value
    }
  }

  const cashFlowImpact = {
    materialsPurchased,
    productionCompleted: completedProductionValue,
    netChange: completedProductionValue - materialsPurchased,
  }

  return {
    date: snapshotDate,
    totalInventoryValue: inventoryValuation.totalValue,
    rawMaterialsValue: inventoryValuation.breakdown.rawMaterials,
    componentsValue: inventoryValuation.breakdown.components,
    finishedGoodsValue: inventoryValuation.breakdown.finishedGoods,
    wipValue,
    completedProductionValue,
    totalMaterialCost: inventoryValuation.totalValue,
    totalProductionCost: completedProductionValue,
    projectedCosts30Days,
    costBreakdown,
    inventoryTurnoverRatio,
    daysOfInventoryOnHand,
    averageDailyProductionCost,
    cashFlowImpact,
  }
}

// ============================================================================
// 6. COST VARIANCE TRACKING
// ============================================================================

/**
 * Track cost variance between estimated and actual costs
 * Creates alerts for significant variances
 */
export async function trackCostVariance(
  scheduleId: string,
  actualCosts: {
    materialCost: number
    laborCost?: number
    overheadCost?: number
  }
): Promise<CostVarianceReport> {
  // Get estimated costs
  const estimatedCosts = await calculateProductionCost(scheduleId)

  const schedule = await prisma.productionSchedule.findUnique({
    where: { scheduleId },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!schedule) {
    throw new Error(`Production schedule ${scheduleId} not found`)
  }

  // Calculate actual total cost
  const actualTotalCost =
    actualCosts.materialCost +
    (actualCosts.laborCost || 0) +
    (actualCosts.overheadCost || 0)

  // Calculate variances
  const materialVariance =
    estimatedCosts.totalMaterialCost - actualCosts.materialCost
  const materialVariancePercent =
    (materialVariance / estimatedCosts.totalMaterialCost) * 100

  const laborVariance = -(actualCosts.laborCost || 0) // No estimated labor cost
  const laborVariancePercent = 0

  const overheadVariance =
    estimatedCosts.overheadAllocation - (actualCosts.overheadCost || 0)
  const overheadVariancePercent =
    (overheadVariance / estimatedCosts.overheadAllocation) * 100

  const totalVariance = estimatedCosts.totalProductionCost - actualTotalCost
  const totalVariancePercent =
    (totalVariance / estimatedCosts.totalProductionCost) * 100

  // Classify variance
  const isFavorable = totalVariance > 0 // Under budget is favorable
  const isSignificant =
    Math.abs(totalVariancePercent) / 100 > SIGNIFICANT_VARIANCE_THRESHOLD

  // Create alert if significant
  let alertCreated = false
  if (isSignificant) {
    await prisma.alert.create({
      data: {
        alertType: 'cost_overrun',
        severity: Math.abs(totalVariancePercent) > 25 ? 'critical' : 'warning',
        title: `Cost Variance: ${schedule.product.name}`,
        description:
          `Production schedule ${scheduleId} has ${isFavorable ? 'favorable' : 'unfavorable'} ` +
          `cost variance of ${Math.abs(totalVariancePercent).toFixed(1)}%. ` +
          `Estimated: $${estimatedCosts.totalProductionCost.toFixed(2)}, ` +
          `Actual: $${actualTotalCost.toFixed(2)}, ` +
          `Variance: $${Math.abs(totalVariance).toFixed(2)}`,
        reference: scheduleId,
        status: 'active',
      },
    })
    alertCreated = true
  }

  return {
    scheduleId,
    productName: schedule.product.name,
    estimatedMaterialCost: estimatedCosts.totalMaterialCost,
    estimatedOverheadCost: estimatedCosts.overheadAllocation,
    estimatedTotalCost: estimatedCosts.totalProductionCost,
    actualMaterialCost: actualCosts.materialCost,
    actualLaborCost: actualCosts.laborCost || 0,
    actualOverheadCost: actualCosts.overheadCost || 0,
    actualTotalCost,
    materialVariance,
    materialVariancePercent,
    laborVariance,
    laborVariancePercent,
    overheadVariance,
    overheadVariancePercent,
    totalVariance,
    totalVariancePercent,
    isFavorable,
    isSignificant,
    alertCreated,
  }
}

// ============================================================================
// 7. PRODUCT PROFITABILITY ANALYSIS
// ============================================================================

/**
 * Analyze product profitability based on costs and selling price
 * Compares to target margin and provides recommendations
 */
export async function calculateProductProfitability(
  productId: string,
  sellingPrice: number
): Promise<ProfitabilityAnalysis> {
  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      sku: true,
      targetMargin: true,
    },
  })

  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }

  // Calculate costs
  const materialCostPerUnit = await calculateMaterialCostPerUnit(productId)
  const overheadPerUnit = materialCostPerUnit * OVERHEAD_RATE
  const totalCostPerUnit = materialCostPerUnit + overheadPerUnit

  // Calculate profitability
  const grossMarginDollars = sellingPrice - totalCostPerUnit
  const grossMarginPercent = (grossMarginDollars / sellingPrice) * 100

  // Compare to target
  const targetMargin = product.targetMargin
  const marginVariance = grossMarginPercent / 100 - targetMargin
  const meetsTarget = grossMarginPercent / 100 >= targetMargin

  // Generate recommendations
  const recommendations: string[] = []

  if (!meetsTarget) {
    const requiredPrice = totalCostPerUnit / (1 - targetMargin)
    recommendations.push(
      `Increase selling price to $${requiredPrice.toFixed(2)} to meet ${(targetMargin * 100).toFixed(1)}% target margin`
    )

    const maxCost = sellingPrice * (1 - targetMargin)
    const costReduction = totalCostPerUnit - maxCost
    recommendations.push(
      `Reduce production costs by $${costReduction.toFixed(2)} per unit`
    )
  } else {
    recommendations.push(
      `Product meets target margin of ${(targetMargin * 100).toFixed(1)}%`
    )
  }

  if (overheadPerUnit > materialCostPerUnit * 0.2) {
    recommendations.push('Consider overhead cost reduction initiatives')
  }

  return {
    productId,
    productName: product.name,
    productSku: product.sku,
    materialCostPerUnit,
    overheadPerUnit,
    totalCostPerUnit,
    sellingPrice,
    grossMarginDollars,
    grossMarginPercent,
    targetMargin: targetMargin * 100,
    marginVariance: marginVariance * 100,
    meetsTarget,
    recommendations,
  }
}

// ============================================================================
// 8. HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate average daily production cost based on recent history
 */
export async function getAverageDailyProductionCost(
  days: number = 30
): Promise<number> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const completedSchedules = await prisma.productionSchedule.findMany({
    where: {
      status: 'completed',
      updatedAt: {
        gte: startDate,
      },
    },
    include: {
      product: {
        select: {
          id: true,
        },
      },
    },
  })

  if (completedSchedules.length === 0) {
    return 0
  }

  let totalCost = 0

  for (const schedule of completedSchedules) {
    try {
      const costBreakdown = await calculateProductionCost(schedule.scheduleId)
      totalCost += costBreakdown.totalProductionCost
    } catch (error) {
      // Skip schedules with errors
      console.warn(`Could not calculate cost for schedule ${schedule.scheduleId}`)
    }
  }

  return totalCost / days
}

/**
 * Store financial snapshot in database
 */
export async function storeFinancialSnapshot(
  snapshot: FinancialSnapshot
): Promise<void> {
  // Check if snapshot already exists for this date
  const existingSnapshot = await prisma.financialMetrics.findUnique({
    where: {
      date: snapshot.date,
    },
  })

  if (existingSnapshot) {
    // Update existing
    await prisma.financialMetrics.update({
      where: {
        date: snapshot.date,
      },
      data: {
        totalInventoryValue: snapshot.totalInventoryValue,
        wipValue: snapshot.wipValue,
        finishedGoodsValue: snapshot.finishedGoodsValue,
        totalMaterialCost: snapshot.totalMaterialCost,
        productionCostEst: snapshot.projectedCosts30Days,
      },
    })
  } else {
    // Create new
    await prisma.financialMetrics.create({
      data: {
        date: snapshot.date,
        totalInventoryValue: snapshot.totalInventoryValue,
        wipValue: snapshot.wipValue,
        finishedGoodsValue: snapshot.finishedGoodsValue,
        totalMaterialCost: snapshot.totalMaterialCost,
        productionCostEst: snapshot.projectedCosts30Days,
      },
    })
  }
}
