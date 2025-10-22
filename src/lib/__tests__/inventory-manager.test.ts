/**
 * Test Suite for Inventory Management System
 *
 * Tests cover:
 * - Successful inventory decrementation
 * - Insufficient stock errors
 * - Reorder point triggering
 * - Audit trail creation
 * - Manual adjustments
 * - Concurrent updates and race conditions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '../db'
import {
  decrementInventoryForProduction,
  adjustInventory,
  recordInventoryMovement,
  checkReorderPoint,
  getInventoryHistory,
  receiveInventory,
} from '../inventory-manager'

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

describe('Inventory Management System', () => {
  let testProductId: string
  let testBomItem1: string
  let testBomItem2: string
  let testScheduleId: string

  beforeEach(async () => {
    // Create test data
    // 1. Create BOM items
    const bomItem1 = await prisma.bomItem.create({
      data: {
        partNumber: 'TEST-PART-001',
        description: 'Test Component 1',
        quantityPerUnit: 1,
        currentStock: 1000,
        unitCost: 5.0,
        supplier: 'Test Supplier',
        reorderPoint: 200,
        leadTimeDays: 7,
        category: 'Components',
        safetyStock: 50,
      },
    })
    testBomItem1 = bomItem1.partNumber

    const bomItem2 = await prisma.bomItem.create({
      data: {
        partNumber: 'TEST-PART-002',
        description: 'Test Component 2',
        quantityPerUnit: 1,
        currentStock: 500,
        unitCost: 10.0,
        supplier: 'Test Supplier',
        reorderPoint: 100,
        leadTimeDays: 14,
        category: 'Components',
        safetyStock: 25,
      },
    })
    testBomItem2 = bomItem2.partNumber

    // 2. Create product
    const product = await prisma.product.create({
      data: {
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        description: 'Test product for inventory tests',
        category: 'Finished Goods',
        targetMargin: 0.3,
      },
    })
    testProductId = product.id

    // 3. Create ProductBom entries
    await prisma.productBom.createMany({
      data: [
        {
          productId: testProductId,
          partNumber: testBomItem1,
          quantityNeeded: 2, // 2 units of part 1 per product
        },
        {
          productId: testProductId,
          partNumber: testBomItem2,
          quantityNeeded: 3, // 3 units of part 2 per product
        },
      ],
    })

    // 4. Create production schedule
    const schedule = await prisma.productionSchedule.create({
      data: {
        scheduleId: `TEST-SCHED-${Date.now()}`,
        productId: testProductId,
        unitsToProducePerDay: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // +1 day
        workstationId: 'WS-001',
        shiftNumber: 1,
        status: 'in_progress',
      },
    })
    testScheduleId = schedule.scheduleId
  })

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await prisma.inventoryMovement.deleteMany({
      where: {
        partNumber: {
          in: [testBomItem1, testBomItem2],
        },
      },
    })

    await prisma.materialRequirement.deleteMany({
      where: { scheduleId: testScheduleId },
    })

    await prisma.alert.deleteMany({
      where: {
        reference: {
          in: [testBomItem1, testBomItem2, testScheduleId],
        },
      },
    })

    await prisma.productionSchedule.deleteMany({
      where: { scheduleId: testScheduleId },
    })

    await prisma.productBom.deleteMany({
      where: { productId: testProductId },
    })

    await prisma.product.deleteMany({
      where: { id: testProductId },
    })

    await prisma.bomItem.deleteMany({
      where: {
        partNumber: {
          in: [testBomItem1, testBomItem2],
        },
      },
    })
  })

  // ==========================================================================
  // TEST: Successful Decrementation
  // ==========================================================================

  it('should successfully decrement inventory for production', async () => {
    const result = await decrementInventoryForProduction(testScheduleId, 50)

    expect(result.success).toBe(true)
    expect(result.unitsProduced).toBe(50)
    expect(result.componentsDecremented).toHaveLength(2)

    // Check part 1: 50 units × 2 per unit = 100 units consumed
    const part1Result = result.componentsDecremented.find(
      (c) => c.partNumber === testBomItem1
    )
    expect(part1Result).toBeDefined()
    expect(part1Result?.quantityUsed).toBe(100)
    expect(part1Result?.previousStock).toBe(1000)
    expect(part1Result?.newStock).toBe(900)

    // Check part 2: 50 units × 3 per unit = 150 units consumed
    const part2Result = result.componentsDecremented.find(
      (c) => c.partNumber === testBomItem2
    )
    expect(part2Result).toBeDefined()
    expect(part2Result?.quantityUsed).toBe(150)
    expect(part2Result?.previousStock).toBe(500)
    expect(part2Result?.newStock).toBe(350)

    // Verify database was updated
    const updatedBom1 = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem1 },
    })
    expect(updatedBom1?.currentStock).toBe(900)

    const updatedBom2 = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem2 },
    })
    expect(updatedBom2?.currentStock).toBe(350)

    // Verify inventory movements were created
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        partNumber: {
          in: [testBomItem1, testBomItem2],
        },
        reference: testScheduleId,
      },
    })
    expect(movements).toHaveLength(2)
  })

  // ==========================================================================
  // TEST: Insufficient Stock Error
  // ==========================================================================

  it('should throw error when insufficient stock', async () => {
    // Try to produce 300 units
    // Part 1 needs: 300 × 2 = 600 units (have 1000, OK)
    // Part 2 needs: 300 × 3 = 900 units (have 500, INSUFFICIENT)

    await expect(
      decrementInventoryForProduction(testScheduleId, 300)
    ).rejects.toThrow('Insufficient inventory')

    // Verify no changes were made (transaction rollback)
    const bomItem1 = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem1 },
    })
    expect(bomItem1?.currentStock).toBe(1000) // Unchanged

    const bomItem2 = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem2 },
    })
    expect(bomItem2?.currentStock).toBe(500) // Unchanged

    // Verify no inventory movements were created
    const movements = await prisma.inventoryMovement.findMany({
      where: { reference: testScheduleId },
    })
    expect(movements).toHaveLength(0)
  })

  // ==========================================================================
  // TEST: Reorder Point Triggering
  // ==========================================================================

  it('should trigger reorder alert when stock falls below reorder point', async () => {
    // Part 1: reorderPoint = 200, currentStock = 1000
    // Produce 410 units: 410 × 2 = 820 consumed, new stock = 180 (below 200)

    const result = await decrementInventoryForProduction(testScheduleId, 410)

    const part1Result = result.componentsDecremented.find(
      (c) => c.partNumber === testBomItem1
    )
    expect(part1Result?.newStock).toBe(180)
    expect(part1Result?.triggeredReorder).toBe(true)

    // Verify alert was created
    const alert = await prisma.alert.findFirst({
      where: {
        alertType: 'reorder',
        reference: testBomItem1,
        status: 'active',
      },
    })
    expect(alert).toBeDefined()
    expect(alert?.title).toContain(testBomItem1)
  })

  // ==========================================================================
  // TEST: Audit Trail Creation
  // ==========================================================================

  it('should create complete audit trail', async () => {
    await decrementInventoryForProduction(testScheduleId, 25)

    const history = await getInventoryHistory(testBomItem1)

    expect(history.length).toBeGreaterThan(0)

    const movement = history[0]
    expect(movement.movementType).toBe('out')
    expect(movement.quantity).toBe(50) // 25 units × 2 per unit
    expect(movement.reference).toBe(testScheduleId)
    expect(movement.previousStock).toBe(1000)
    expect(movement.newStock).toBe(950)
    expect(movement.reason).toContain('Production')
  })

  // ==========================================================================
  // TEST: Manual Adjustments
  // ==========================================================================

  it('should handle manual inventory adjustments', async () => {
    await adjustInventory(
      testBomItem1,
      1200,
      'Physical count adjustment - found extra stock'
    )

    const bomItem = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem1 },
    })
    expect(bomItem?.currentStock).toBe(1200)

    const history = await getInventoryHistory(testBomItem1)
    const adjustment = history.find((m) => m.movementType === 'adjustment')
    expect(adjustment).toBeDefined()
    expect(adjustment?.previousStock).toBe(1000)
    expect(adjustment?.newStock).toBe(1200)
  })

  // ==========================================================================
  // TEST: Receive Inventory
  // ==========================================================================

  it('should receive inventory and update stock', async () => {
    const movements = await receiveInventory([
      {
        partNumber: testBomItem1,
        quantity: 500,
        reference: 'PO-12345',
      },
    ])

    expect(movements).toHaveLength(1)
    expect(movements[0].quantity).toBe(500)
    expect(movements[0].newStock).toBe(1500)

    const bomItem = await prisma.bomItem.findUnique({
      where: { partNumber: testBomItem1 },
    })
    expect(bomItem?.currentStock).toBe(1500)
  })

  // ==========================================================================
  // TEST: Check Reorder Point
  // ==========================================================================

  it('should check reorder point and create alert', async () => {
    // Manually set stock below reorder point
    await prisma.bomItem.update({
      where: { partNumber: testBomItem1 },
      data: { currentStock: 150 },
    })

    const alert = await checkReorderPoint(testBomItem1, 150)

    expect(alert).toBeDefined()
    expect(alert?.alertType).toBe('reorder')
    expect(alert?.reference).toBe(testBomItem1)
  })

  // ==========================================================================
  // TEST: No Duplicate Alerts
  // ==========================================================================

  it('should not create duplicate reorder alerts', async () => {
    // Set stock below reorder point
    await prisma.bomItem.update({
      where: { partNumber: testBomItem1 },
      data: { currentStock: 150 },
    })

    const alert1 = await checkReorderPoint(testBomItem1, 150)
    expect(alert1).toBeDefined()

    const alert2 = await checkReorderPoint(testBomItem1, 140)
    expect(alert2).toBeDefined()

    // Should return existing alert, not create new one
    expect(alert1?.id).toBe(alert2?.id)

    const alertCount = await prisma.alert.count({
      where: {
        alertType: 'reorder',
        reference: testBomItem1,
        status: 'active',
      },
    })
    expect(alertCount).toBe(1)
  })

  // ==========================================================================
  // TEST: Record Inventory Movement
  // ==========================================================================

  it('should record inventory movement for different types', async () => {
    // Test 'in' movement
    const inMovement = await recordInventoryMovement(
      testBomItem1,
      'in',
      100,
      'PO-001',
      'Received from supplier'
    )
    expect(inMovement.movementType).toBe('in')
    expect(inMovement.quantity).toBe(100)
    expect(inMovement.newStock).toBe(1100)

    // Test 'out' movement
    const outMovement = await recordInventoryMovement(
      testBomItem1,
      'out',
      50,
      'WO-001',
      'Manual withdrawal'
    )
    expect(outMovement.movementType).toBe('out')
    expect(outMovement.quantity).toBe(50)
    expect(outMovement.newStock).toBe(1050)

    // Test 'adjustment' movement
    const adjMovement = await recordInventoryMovement(
      testBomItem1,
      'adjustment',
      -50, // Negative adjustment
      'CC-001',
      'Cycle count correction'
    )
    expect(adjMovement.movementType).toBe('adjustment')
    expect(adjMovement.newStock).toBe(1000)
  })

  // ==========================================================================
  // TEST: Inventory History with Date Range
  // ==========================================================================

  it('should fetch inventory history with date range', async () => {
    const yesterday = new Date(Date.now() - 86400000)
    const tomorrow = new Date(Date.now() + 86400000)

    // Create some movements
    await recordInventoryMovement(testBomItem1, 'in', 100)

    const history = await getInventoryHistory(testBomItem1, {
      start: yesterday,
      end: tomorrow,
    })

    expect(history.length).toBeGreaterThan(0)
    history.forEach((movement) => {
      expect(movement.timestamp.getTime()).toBeGreaterThanOrEqual(
        yesterday.getTime()
      )
      expect(movement.timestamp.getTime()).toBeLessThanOrEqual(
        tomorrow.getTime()
      )
    })
  })

  // ==========================================================================
  // TEST: Concurrent Updates (Race Condition)
  // ==========================================================================

  it('should handle concurrent inventory updates safely', async () => {
    // This test simulates two concurrent productions trying to use the same inventory
    // Database transactions should prevent race conditions

    const schedule2 = await prisma.productionSchedule.create({
      data: {
        scheduleId: `TEST-SCHED-CONCURRENT-${Date.now()}`,
        productId: testProductId,
        unitsToProducePerDay: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        workstationId: 'WS-002',
        shiftNumber: 2,
        status: 'in_progress',
      },
    })

    try {
      // Run two decrementations concurrently
      const [result1, result2] = await Promise.all([
        decrementInventoryForProduction(testScheduleId, 100),
        decrementInventoryForProduction(schedule2.scheduleId, 100),
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Verify final stock is correct
      // Each production uses 200 units of part 1 (100 products × 2 per product)
      // Total: 400 units consumed from 1000 = 600 remaining
      const bomItem = await prisma.bomItem.findUnique({
        where: { partNumber: testBomItem1 },
      })
      expect(bomItem?.currentStock).toBe(600)
    } finally {
      // Cleanup
      await prisma.materialRequirement.deleteMany({
        where: { scheduleId: schedule2.scheduleId },
      })
      await prisma.productionSchedule.deleteMany({
        where: { scheduleId: schedule2.scheduleId },
      })
    }
  })
})
