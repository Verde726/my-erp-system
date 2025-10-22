/**
 * Inventory Management System
 *
 * Handles automatic inventory decrementation, audit trails, and reorder alerts
 * for production execution. Uses database transactions to ensure data consistency.
 */

import { prisma } from './db'
import type { Alert, InventoryMovement, MovementType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface DecrementResult {
  success: boolean
  scheduleId: string
  unitsProduced: number
  componentsDecremented: Array<{
    partNumber: string
    description: string
    quantityUsed: number
    previousStock: number
    newStock: number
    triggeredReorder: boolean
  }>
  alerts: Alert[]
  errors?: string[]
}

export interface InventoryAdjustment {
  partNumber: string
  newQuantity: number
  reason: string
  adjustedBy?: string
}

export interface ReorderRecommendation {
  partNumber: string
  currentStock: number
  reorderPoint: number
  safetyStock: number
  leadTimeDays: number
  recommendedOrderQuantity: number
  estimatedDailyUsage: number
  daysUntilStockout: number
}

// ============================================================================
// CORE INVENTORY DECREMENTATION
// ============================================================================

/**
 * Decrement inventory when production occurs
 *
 * This function implements a transactional approach to inventory decrementation:
 * 1. Validates production schedule exists
 * 2. Retrieves BOM and calculates material consumption
 * 3. Uses a database transaction to atomically:
 *    - Update BomItem stock levels
 *    - Create InventoryMovement audit records
 *    - Check reorder points and create alerts
 * 4. Updates production schedule with actual units produced
 *
 * @throws Error if insufficient inventory or database transaction fails
 */
export async function decrementInventoryForProduction(
  scheduleId: string,
  actualUnitsProduced: number
): Promise<DecrementResult> {
  // Step 1: Get production schedule with product BOM
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
    throw new Error(
      `Product ${schedule.product.sku} has no BOM defined - cannot decrement inventory`
    )
  }

  if (actualUnitsProduced <= 0) {
    throw new Error('Actual units produced must be greater than zero')
  }

  const componentsDecremented: DecrementResult['componentsDecremented'] = []
  const alerts: Alert[] = []
  const errors: string[] = []

  // Step 2: Begin database transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Process each BOM component
      for (const bomEntry of schedule.product.bom) {
        const bomItem = bomEntry.bomItem

        // Step 3a: Calculate quantity used
        const quantityUsed = bomEntry.quantityNeeded * actualUnitsProduced

        // Step 3b: Get current stock
        const previousStock = bomItem.currentStock

        // Step 3c: Validate sufficient stock
        if (previousStock < quantityUsed) {
          throw new Error(
            `Insufficient inventory for ${bomItem.partNumber} (${bomItem.description}). ` +
              `Required: ${quantityUsed}, Available: ${previousStock}, ` +
              `Shortage: ${quantityUsed - previousStock}`
          )
        }

        // Step 3d: Calculate new stock
        const newStock = previousStock - quantityUsed

        // Step 3e: Update BomItem.currentStock
        await tx.bomItem.update({
          where: { partNumber: bomItem.partNumber },
          data: { currentStock: newStock },
        })

        // Step 3f: Create InventoryMovement record
        await tx.inventoryMovement.create({
          data: {
            partNumber: bomItem.partNumber,
            movementType: 'out',
            quantity: quantityUsed,
            reference: scheduleId,
            reason: `Production: ${schedule.product.name} (${actualUnitsProduced} units)`,
            previousStock,
            newStock,
            timestamp: new Date(),
          },
        })

        // Step 3g: Check reorder point
        let triggeredReorder = false
        if (newStock <= bomItem.reorderPoint) {
          const reorderAlert = await createReorderAlert(
            tx,
            bomItem.partNumber,
            newStock,
            bomItem.reorderPoint,
            bomItem.safetyStock,
            bomItem.leadTimeDays
          )

          if (reorderAlert) {
            alerts.push(reorderAlert)
            triggeredReorder = true
          }
        }

        componentsDecremented.push({
          partNumber: bomItem.partNumber,
          description: bomItem.description,
          quantityUsed,
          previousStock,
          newStock,
          triggeredReorder,
        })
      }
    })

    // Step 4: Transaction committed successfully
    // Step 5: Update ProductionSchedule.actualUnitsProduced
    await prisma.productionSchedule.update({
      where: { scheduleId },
      data: {
        actualUnitsProduced,
        status: 'completed',
        updatedAt: new Date(),
      },
    })

    // Step 6: Return summary
    return {
      success: true,
      scheduleId,
      unitsProduced: actualUnitsProduced,
      componentsDecremented,
      alerts,
    }
  } catch (error: any) {
    // Transaction failed - all changes rolled back
    throw new Error(`Inventory decrementation failed: ${error.message}`)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Record inventory movement for audit trail
 *
 * Creates an InventoryMovement record and updates BomItem stock
 * Used for receiving, adjustments, and manual corrections
 */
export async function recordInventoryMovement(
  partNumber: string,
  type: MovementType,
  quantity: number,
  reference?: string,
  reason?: string
): Promise<InventoryMovement> {
  // Get current BOM item
  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    throw new Error(`Part ${partNumber} not found in inventory`)
  }

  const previousStock = bomItem.currentStock

  // Calculate new stock based on movement type
  let newStock: number
  switch (type) {
    case 'in':
      newStock = previousStock + quantity
      break
    case 'out':
      newStock = previousStock - quantity
      if (newStock < 0) {
        throw new Error(
          `Cannot remove ${quantity} units of ${partNumber}. Only ${previousStock} available.`
        )
      }
      break
    case 'adjustment':
      // For adjustments, quantity represents the delta (can be positive or negative)
      newStock = previousStock + quantity
      break
    default:
      throw new Error(`Invalid movement type: ${type}`)
  }

  // Use transaction to ensure atomic update
  return await prisma.$transaction(async (tx) => {
    // Update stock
    await tx.bomItem.update({
      where: { partNumber },
      data: { currentStock: newStock },
    })

    // Create movement record
    const movement = await tx.inventoryMovement.create({
      data: {
        partNumber,
        movementType: type,
        quantity: Math.abs(quantity),
        reference,
        reason,
        previousStock,
        newStock,
        timestamp: new Date(),
      },
    })

    return movement
  })
}

/**
 * Manually adjust inventory to a specific quantity
 *
 * Used for physical inventory corrections, cycle counts, etc.
 * Records the adjustment as an 'adjustment' type movement
 */
export async function adjustInventory(
  partNumber: string,
  newQuantity: number,
  reason: string
): Promise<void> {
  if (newQuantity < 0) {
    throw new Error('Inventory quantity cannot be negative')
  }

  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    throw new Error(`Part ${partNumber} not found in inventory`)
  }

  const previousStock = bomItem.currentStock
  const delta = newQuantity - previousStock

  await prisma.$transaction(async (tx) => {
    // Update stock
    await tx.bomItem.update({
      where: { partNumber },
      data: { currentStock: newQuantity },
    })

    // Create adjustment record
    await tx.inventoryMovement.create({
      data: {
        partNumber,
        movementType: 'adjustment',
        quantity: Math.abs(delta),
        reason: `Manual adjustment: ${reason} (${previousStock} → ${newQuantity})`,
        previousStock,
        newStock: newQuantity,
        timestamp: new Date(),
      },
    })

    // Check if adjustment triggered reorder point
    if (newQuantity <= bomItem.reorderPoint) {
      await createReorderAlert(
        tx,
        partNumber,
        newQuantity,
        bomItem.reorderPoint,
        bomItem.safetyStock,
        bomItem.leadTimeDays
      )
    }
  })
}

/**
 * Check if current stock has reached reorder point and create alert
 *
 * Avoids duplicate alerts by checking for existing active reorder alerts
 * for the same part number
 */
export async function checkReorderPoint(
  partNumber: string,
  currentStock: number
): Promise<Alert | null> {
  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    throw new Error(`Part ${partNumber} not found`)
  }

  if (currentStock > bomItem.reorderPoint) {
    return null
  }

  // Check for existing active reorder alert
  const existingAlert = await prisma.alert.findFirst({
    where: {
      alertType: 'reorder',
      reference: partNumber,
      status: 'active',
    },
  })

  if (existingAlert) {
    // Alert already exists, don't create duplicate
    return existingAlert
  }

  // Calculate recommended order quantity
  const recommendation = calculateReorderQuantity(
    bomItem.reorderPoint,
    bomItem.safetyStock,
    bomItem.leadTimeDays,
    currentStock
  )

  // Create reorder alert
  const alert = await prisma.alert.create({
    data: {
      alertType: 'reorder',
      severity: currentStock <= bomItem.safetyStock ? 'critical' : 'warning',
      title: `Reorder Required: ${bomItem.partNumber}`,
      description:
        `Stock level (${currentStock}) at or below reorder point (${bomItem.reorderPoint}). ` +
        `Recommended order: ${recommendation} units. ` +
        `Lead time: ${bomItem.leadTimeDays} days. ` +
        `Supplier: ${bomItem.supplier}`,
      reference: partNumber,
      status: 'active',
    },
  })

  return alert
}

/**
 * Helper function to create reorder alert within a transaction
 */
async function createReorderAlert(
  tx: any,
  partNumber: string,
  currentStock: number,
  reorderPoint: number,
  safetyStock: number,
  leadTimeDays: number
): Promise<Alert | null> {
  // Check for existing active alert
  const existingAlert = await tx.alert.findFirst({
    where: {
      alertType: 'reorder',
      reference: partNumber,
      status: 'active',
    },
  })

  if (existingAlert) {
    return null
  }

  // Get BOM item for additional details
  const bomItem = await tx.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    return null
  }

  const recommendation = calculateReorderQuantity(
    reorderPoint,
    safetyStock,
    leadTimeDays,
    currentStock
  )

  const alert = await tx.alert.create({
    data: {
      alertType: 'reorder',
      severity: currentStock <= safetyStock ? 'critical' : 'warning',
      title: `Reorder Required: ${partNumber}`,
      description:
        `Stock level (${currentStock}) at or below reorder point (${reorderPoint}). ` +
        `Recommended order: ${recommendation} units. ` +
        `Lead time: ${leadTimeDays} days. ` +
        `Supplier: ${bomItem.supplier}`,
      reference: partNumber,
      status: 'active',
    },
  })

  return alert
}

/**
 * Calculate recommended reorder quantity
 *
 * Formula: (lead time × estimated daily usage) + safety stock - current stock
 * Minimum: reorder point - current stock
 */
function calculateReorderQuantity(
  reorderPoint: number,
  safetyStock: number,
  leadTimeDays: number,
  currentStock: number
): number {
  // Estimate daily usage based on reorder point and lead time
  // Reorder point ≈ (daily usage × lead time) + safety stock
  const estimatedDailyUsage = Math.max(
    1,
    (reorderPoint - safetyStock) / Math.max(1, leadTimeDays)
  )

  // Calculate recommended order
  const recommended =
    leadTimeDays * estimatedDailyUsage + safetyStock - currentStock

  // Ensure minimum order brings stock back to at least reorder point
  const minimum = reorderPoint - currentStock

  return Math.ceil(Math.max(recommended, minimum, 0))
}

/**
 * Get inventory movement history for a part
 *
 * Used for audit trails, analysis, and troubleshooting
 */
export async function getInventoryHistory(
  partNumber: string,
  dateRange?: { start: Date; end: Date }
): Promise<InventoryMovement[]> {
  const where: any = { partNumber }

  if (dateRange) {
    where.timestamp = {
      gte: dateRange.start,
      lte: dateRange.end,
    }
  }

  return await prisma.inventoryMovement.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  })
}

/**
 * Get comprehensive reorder recommendations for all low-stock items
 */
export async function getReorderRecommendations(): Promise<
  ReorderRecommendation[]
> {
  // Find all items at or below reorder point
  const lowStockItems = await prisma.bomItem.findMany({
    where: {
      currentStock: {
        lte: prisma.bomItem.fields.reorderPoint,
      },
    },
    orderBy: [{ currentStock: 'asc' }],
  })

  const recommendations: ReorderRecommendation[] = []

  for (const item of lowStockItems) {
    const estimatedDailyUsage = Math.max(
      1,
      (item.reorderPoint - item.safetyStock) / Math.max(1, item.leadTimeDays)
    )

    const daysUntilStockout = Math.max(
      0,
      Math.floor(item.currentStock / estimatedDailyUsage)
    )

    const recommendedOrderQuantity = calculateReorderQuantity(
      item.reorderPoint,
      item.safetyStock,
      item.leadTimeDays,
      item.currentStock
    )

    recommendations.push({
      partNumber: item.partNumber,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      leadTimeDays: item.leadTimeDays,
      recommendedOrderQuantity,
      estimatedDailyUsage,
      daysUntilStockout,
    })
  }

  return recommendations
}

/**
 * Batch receive inventory (e.g., from purchase order)
 */
export async function receiveInventory(
  items: Array<{ partNumber: string; quantity: number; reference?: string }>
): Promise<InventoryMovement[]> {
  const movements: InventoryMovement[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const bomItem = await tx.bomItem.findUnique({
        where: { partNumber: item.partNumber },
      })

      if (!bomItem) {
        throw new Error(`Part ${item.partNumber} not found`)
      }

      const previousStock = bomItem.currentStock
      const newStock = previousStock + item.quantity

      await tx.bomItem.update({
        where: { partNumber: item.partNumber },
        data: { currentStock: newStock },
      })

      const movement = await tx.inventoryMovement.create({
        data: {
          partNumber: item.partNumber,
          movementType: 'in',
          quantity: item.quantity,
          reference: item.reference || 'Receiving',
          reason: `Received ${item.quantity} units`,
          previousStock,
          newStock,
          timestamp: new Date(),
        },
      })

      movements.push(movement)
    }
  })

  return movements
}
