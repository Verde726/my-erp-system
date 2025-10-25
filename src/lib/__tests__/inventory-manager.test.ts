/**
 * Inventory Manager Tests
 *
 * Tests for inventory management and decrementation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  decrementInventory,
  adjustInventory,
  checkMaterialAvailability,
  getInventoryMovementHistory,
} from '../inventory-manager'
import { mockBomItems, mockProductBoms } from '@/tests/mockData'
import prisma from '@/lib/db'

describe('Inventory Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('decrementInventory', () => {
    it('should decrement inventory for production completion', async () => {
      const scheduleId = 'SCHED-2025-001'
      const productId = 'prod-1'
      const quantityProduced = 10

      // Mock product BOM
      vi.mocked(prisma.productBom.findMany).mockResolvedValue(
        mockProductBoms.filter((pb) => pb.productId === productId)
      )

      // Mock BOM items with sufficient stock
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      // Mock update operations
      vi.mocked(prisma.bomItem.update).mockImplementation(async ({ data }: any) =>
        Promise.resolve({ ...mockBomItems[0], currentStock: data.currentStock } as any)
      )

      vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({} as any)

      const result = await decrementInventory(scheduleId, productId, quantityProduced)

      expect(result.success).toBe(true)
      expect(result.movements.length).toBeGreaterThan(0)

      // Verify inventory was decremented
      expect(prisma.bomItem.update).toHaveBeenCalled()
      expect(prisma.inventoryMovement.create).toHaveBeenCalled()
    })

    it('should fail when insufficient stock', async () => {
      const scheduleId = 'SCHED-2025-001'
      const productId = 'prod-1'
      const quantityProduced = 10000 // Requires more than available

      vi.mocked(prisma.productBom.findMany).mockResolvedValue(mockProductBoms)

      // Mock BOM items with low stock
      const lowStockItems = mockBomItems.map((item) => ({
        ...item,
        currentStock: 1,
      }))
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(lowStockItems)

      const result = await decrementInventory(scheduleId, productId, quantityProduced)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.shortages).toBeDefined()
      expect(result.shortages!.length).toBeGreaterThan(0)
    })

    it('should create audit trail for each decrementation', async () => {
      const scheduleId = 'SCHED-2025-001'
      const productId = 'prod-1'
      const quantityProduced = 5

      vi.mocked(prisma.productBom.findMany).mockResolvedValue([mockProductBoms[0]])
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([mockBomItems[0]])
      vi.mocked(prisma.bomItem.update).mockResolvedValue(mockBomItems[0] as any)

      const movementMock = vi.fn().mockResolvedValue({})
      vi.mocked(prisma.inventoryMovement.create).mockImplementation(movementMock)

      await decrementInventory(scheduleId, productId, quantityProduced)

      // Should create movement record
      expect(movementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: 'out',
            reference: scheduleId,
          }),
        })
      )
    })

    it('should calculate correct quantity based on BOM', async () => {
      const scheduleId = 'SCHED-2025-001'
      const productId = 'prod-1'
      const quantityProduced = 10

      // RES-100 requires 2 per unit
      const resBom = mockProductBoms.find((pb) => pb.partNumber === 'RES-100')!

      vi.mocked(prisma.productBom.findMany).mockResolvedValue([resBom])
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([mockBomItems[1]]) // RES-100

      let updatedStock: number | undefined
      vi.mocked(prisma.bomItem.update).mockImplementation(async ({ data }: any) => {
        updatedStock = data.currentStock
        return Promise.resolve({ ...mockBomItems[1], currentStock: data.currentStock } as any)
      })

      vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({} as any)

      await decrementInventory(scheduleId, productId, quantityProduced)

      // 10 units produced * 2 resistors per unit = 20 resistors consumed
      // Original: 2500, After: 2480
      expect(updatedStock).toBe(2500 - 20)
    })
  })

  describe('adjustInventory', () => {
    it('should adjust inventory with positive quantity', async () => {
      const partNumber = 'PCB-001'
      const quantity = 100
      const reason = 'Received shipment'

      vi.mocked(prisma.bomItem.findUnique).mockResolvedValue(mockBomItems[0])
      vi.mocked(prisma.bomItem.update).mockResolvedValue({
        ...mockBomItems[0],
        currentStock: mockBomItems[0].currentStock + quantity,
      } as any)
      vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({} as any)

      const result = await adjustInventory(partNumber, quantity, reason)

      expect(result.success).toBe(true)
      expect(result.newStock).toBe(mockBomItems[0].currentStock + quantity)
      expect(result.previousStock).toBe(mockBomItems[0].currentStock)
    })

    it('should adjust inventory with negative quantity (scrap/damage)', async () => {
      const partNumber = 'PCB-001'
      const quantity = -10
      const reason = 'Damaged units'

      vi.mocked(prisma.bomItem.findUnique).mockResolvedValue(mockBomItems[0])
      vi.mocked(prisma.bomItem.update).mockResolvedValue({
        ...mockBomItems[0],
        currentStock: mockBomItems[0].currentStock + quantity,
      } as any)
      vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({} as any)

      const result = await adjustInventory(partNumber, quantity, reason)

      expect(result.success).toBe(true)
      expect(result.newStock).toBe(mockBomItems[0].currentStock - 10)
    })

    it('should prevent negative inventory', async () => {
      const partNumber = 'PCB-001'
      const quantity = -10000 // More than current stock

      vi.mocked(prisma.bomItem.findUnique).mockResolvedValue(mockBomItems[0])

      const result = await adjustInventory(partNumber, quantity, 'Invalid adjustment')

      expect(result.success).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should create movement record with correct type', async () => {
      const partNumber = 'PCB-001'
      const quantity = 50

      vi.mocked(prisma.bomItem.findUnique).mockResolvedValue(mockBomItems[0])
      vi.mocked(prisma.bomItem.update).mockResolvedValue(mockBomItems[0] as any)

      const movementMock = vi.fn().mockResolvedValue({})
      vi.mocked(prisma.inventoryMovement.create).mockImplementation(movementMock)

      await adjustInventory(partNumber, quantity, 'Manual adjustment')

      expect(movementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: 'adjustment',
          }),
        })
      )
    })
  })

  describe('checkMaterialAvailability', () => {
    it('should return true when all materials are available', async () => {
      const productId = 'prod-1'
      const quantity = 10

      vi.mocked(prisma.productBom.findMany).mockResolvedValue(
        mockProductBoms.filter((pb) => pb.productId === productId)
      )
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await checkMaterialAvailability(productId, quantity)

      expect(result.available).toBe(true)
      expect(result.shortages.length).toBe(0)
    })

    it('should identify shortages when materials are insufficient', async () => {
      const productId = 'prod-2'
      const quantity = 100

      vi.mocked(prisma.productBom.findMany).mockResolvedValue(
        mockProductBoms.filter((pb) => pb.productId === productId)
      )

      // Low stock scenario
      const lowStockItems = mockBomItems.map((item) => ({
        ...item,
        currentStock: 10,
      }))
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(lowStockItems)

      const result = await checkMaterialAvailability(productId, quantity)

      expect(result.available).toBe(false)
      expect(result.shortages.length).toBeGreaterThan(0)
    })

    it('should calculate maximum producible quantity', async () => {
      const productId = 'prod-1'
      const quantity = 1000

      // PCB-001: 450 in stock, needs 1 per unit → max 450
      // RES-100: 2500 in stock, needs 2 per unit → max 1250
      // CASE: 600 in stock, needs 1 per unit → max 600
      // Bottleneck: PCB-001 at 450 units

      vi.mocked(prisma.productBom.findMany).mockResolvedValue([
        { ...mockProductBoms[0], quantityNeeded: 1 }, // PCB-001
        { ...mockProductBoms[1], quantityNeeded: 2 }, // RES-100
        { ...mockProductBoms[2], quantityNeeded: 1 }, // CASE
      ])

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([
        { ...mockBomItems[0], currentStock: 450 }, // PCB-001
        { ...mockBomItems[1], currentStock: 2500 }, // RES-100
        { ...mockBomItems[3], currentStock: 600 }, // CASE
      ])

      const result = await checkMaterialAvailability(productId, quantity)

      expect(result.maxProducibleQuantity).toBe(450)
    })
  })

  describe('getInventoryMovementHistory', () => {
    it('should retrieve movement history for a part', async () => {
      const partNumber = 'PCB-001'
      const movements = [
        {
          id: 'mov-1',
          partNumber,
          movementType: 'in',
          quantity: 100,
          previousStock: 350,
          newStock: 450,
          timestamp: new Date(),
          reason: 'Purchase order receipt',
          reference: 'PO-001',
        },
        {
          id: 'mov-2',
          partNumber,
          movementType: 'out',
          quantity: 80,
          previousStock: 450,
          newStock: 370,
          timestamp: new Date(),
          reason: 'Production consumption',
          reference: 'SCHED-001',
        },
      ]

      vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue(movements as any)

      const result = await getInventoryMovementHistory(partNumber)

      expect(result.length).toBe(2)
      expect(result[0].movementType).toBe('in')
      expect(result[1].movementType).toBe('out')
    })

    it('should filter movements by date range', async () => {
      const partNumber = 'PCB-001'
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([])

      await getInventoryMovementHistory(partNumber, { startDate, endDate })

      expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('should filter movements by type', async () => {
      const partNumber = 'PCB-001'
      const movementType = 'out'

      vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([])

      await getInventoryMovementHistory(partNumber, { movementType })

      expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            movementType,
          }),
        })
      )
    })
  })
})
