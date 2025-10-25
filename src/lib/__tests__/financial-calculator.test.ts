/**
 * Financial Calculator Tests
 *
 * Tests for financial calculations including inventory valuation,
 * WIP calculations, and profitability analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateInventoryValue,
  calculateWIPValue,
  calculateProductionCost,
  calculateProductProfitability,
  generateFinancialSnapshot,
} from '../financial-calculator'
import { mockBomItems, mockProducts, mockProductBoms, mockProductionSchedules } from '@/tests/mockData'
import prisma from '@/lib/db'

describe('Financial Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateInventoryValue', () => {
    it('should calculate total inventory value', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateInventoryValue()

      // PCB-001: 450 * $25.50 = $11,475
      // RES-100: 2500 * $0.50 = $1,250
      // LED-BLUE: 85 * $0.35 = $29.75
      // CASE: 600 * $8.75 = $5,250
      // Total: $18,004.75

      expect(result.totalValue).toBeGreaterThan(0)
      expect(result.itemCount).toBe(mockBomItems.length)
    })

    it('should calculate inventory value by category', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateInventoryValue({ groupByCategory: true })

      expect(result.byCategory).toBeDefined()
      expect(Array.isArray(result.byCategory)).toBe(true)

      const electronicsCategory = result.byCategory?.find((c) => c.category === 'Electronics')
      expect(electronicsCategory).toBeDefined()
      expect(electronicsCategory!.value).toBeGreaterThan(0)
      expect(electronicsCategory!.itemCount).toBeGreaterThan(0)
    })

    it('should identify low stock items', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateInventoryValue({ includeLowStock: true })

      expect(result.lowStockValue).toBeDefined()
      expect(result.lowStockCount).toBeDefined()

      // LED-BLUE has 85 units, reorder point 100 - should be flagged
      expect(result.lowStockCount).toBeGreaterThan(0)
    })

    it('should calculate healthy vs low stock distribution', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateInventoryValue({ includeLowStock: true })

      expect(result.healthyStockValue).toBeDefined()
      expect(result.lowStockValue).toBeDefined()
      expect(result.totalValue).toBe(result.healthyStockValue! + result.lowStockValue!)
    })

    it('should handle empty inventory', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([])

      const result = await calculateInventoryValue()

      expect(result.totalValue).toBe(0)
      expect(result.itemCount).toBe(0)
    })
  })

  describe('calculateWIPValue', () => {
    it('should calculate work-in-progress value', async () => {
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([
        {
          ...mockProductionSchedules[0],
          product: {
            ...mockProducts[0],
            bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
          },
        } as any,
      ])

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateWIPValue()

      expect(result.totalWIPValue).toBeGreaterThan(0)
      expect(result.schedulesInProgress).toBeGreaterThan(0)
    })

    it('should calculate WIP for each in-progress schedule', async () => {
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([
        {
          ...mockProductionSchedules[0],
          actualUnitsProduced: 45,
          unitsToProducePerDay: 100,
          product: {
            ...mockProducts[0],
            bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
          },
        } as any,
      ])

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateWIPValue()

      // 45 units in progress * material cost per unit
      expect(result.schedules).toBeDefined()
      expect(result.schedules![0].wipValue).toBeGreaterThan(0)
      expect(result.schedules![0].unitsInProgress).toBe(45)
    })

    it('should return zero when no WIP', async () => {
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([])

      const result = await calculateWIPValue()

      expect(result.totalWIPValue).toBe(0)
      expect(result.schedulesInProgress).toBe(0)
    })

    it('should exclude completed schedules', async () => {
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([
        {
          ...mockProductionSchedules[0],
          status: 'completed',
          product: mockProducts[0],
        } as any,
      ])

      const result = await calculateWIPValue()

      expect(result.schedulesInProgress).toBe(0)
    })
  })

  describe('calculateProductionCost', () => {
    it('should calculate total production cost for a schedule', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateProductionCost('SCHED-2025-001')

      expect(result.totalMaterialCost).toBeGreaterThan(0)
      expect(result.unitsToProducePerDay).toBe(100)
      expect(result.costPerUnit).toBeGreaterThan(0)
    })

    it('should break down cost by component', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateProductionCost('SCHED-2025-001')

      expect(result.componentCosts).toBeDefined()
      expect(result.componentCosts!.length).toBeGreaterThan(0)

      // Verify PCB-001 cost calculation
      const pcbCost = result.componentCosts!.find((c) => c.partNumber === 'PCB-001')
      expect(pcbCost).toBeDefined()
      expect(pcbCost!.totalCost).toBe(pcbCost!.quantityNeeded * pcbCost!.unitCost)
    })

    it('should calculate cost per unit', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        unitsToProducePerDay: 100,
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateProductionCost('SCHED-2025-001')

      expect(result.costPerUnit).toBe(result.totalMaterialCost / 100)
    })

    it('should throw error for non-existent schedule', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue(null)

      await expect(calculateProductionCost('INVALID')).rejects.toThrow()
    })
  })

  describe('calculateProductProfitability', () => {
    it('should calculate product profitability', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const sellingPrice = 100
      const result = await calculateProductProfitability('prod-1', sellingPrice)

      expect(result.materialCost).toBeGreaterThan(0)
      expect(result.sellingPrice).toBe(sellingPrice)
      expect(result.grossProfit).toBe(sellingPrice - result.materialCost)
      expect(result.marginPercentage).toBeGreaterThan(0)
    })

    it('should identify unprofitable products', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const lowSellingPrice = 10 // Lower than material cost
      const result = await calculateProductProfitability('prod-1', lowSellingPrice)

      expect(result.grossProfit).toBeLessThan(0)
      expect(result.marginPercentage).toBeLessThan(0)
    })

    it('should compare actual margin to target margin', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        targetMargin: 0.35,
        bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const sellingPrice = 100
      const result = await calculateProductProfitability('prod-1', sellingPrice)

      expect(result.targetMargin).toBe(0.35)
      expect(result.marginVariance).toBeDefined()
    })

    it('should calculate break-even price', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        targetMargin: 0.35,
        bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)

      const result = await calculateProductProfitability('prod-1', 100)

      expect(result.breakEvenPrice).toBe(result.materialCost)
      expect(result.recommendedPrice).toBeGreaterThan(result.breakEvenPrice)
    })
  })

  describe('generateFinancialSnapshot', () => {
    it('should generate complete financial snapshot', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([
        {
          ...mockProductionSchedules[0],
          product: {
            ...mockProducts[0],
            bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
          },
        } as any,
      ])
      vi.mocked(prisma.financialMetrics.create).mockResolvedValue({} as any)

      const result = await generateFinancialSnapshot()

      expect(result.totalInventoryValue).toBeGreaterThan(0)
      expect(result.wipValue).toBeGreaterThan(0)
      expect(result.date).toBeInstanceOf(Date)
    })

    it('should save snapshot to database', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([])

      const createMock = vi.fn().mockResolvedValue({})
      vi.mocked(prisma.financialMetrics.create).mockImplementation(createMock)

      await generateFinancialSnapshot({ save: true })

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalInventoryValue: expect.any(Number),
            wipValue: expect.any(Number),
          }),
        })
      )
    })

    it('should calculate finished goods value', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([])

      const result = await generateFinancialSnapshot()

      expect(result.finishedGoodsValue).toBeDefined()
      expect(result.finishedGoodsValue).toBeGreaterThanOrEqual(0)
    })

    it('should include date in snapshot', async () => {
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.productionSchedule.findMany).mockResolvedValue([])

      const result = await generateFinancialSnapshot()

      expect(result.date).toBeInstanceOf(Date)
      const now = new Date()
      expect(result.date.getDate()).toBe(now.getDate())
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero-cost items', async () => {
      const zeroCostItem = { ...mockBomItems[0], unitCost: 0 }
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([zeroCostItem])

      const result = await calculateInventoryValue()

      expect(result.totalValue).toBe(0)
      expect(result.itemCount).toBe(1)
    })

    it('should handle very large inventory values', async () => {
      const expensiveItem = { ...mockBomItems[0], currentStock: 1000000, unitCost: 999.99 }
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([expensiveItem])

      const result = await calculateInventoryValue()

      expect(result.totalValue).toBeCloseTo(999990000, -3)
    })

    it('should handle floating point precision', async () => {
      const precisionItem = {
        ...mockBomItems[0],
        currentStock: 333,
        unitCost: 0.33,
      }
      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([precisionItem])

      const result = await calculateInventoryValue()

      expect(result.totalValue).toBeCloseTo(109.89, 2)
    })
  })
})
