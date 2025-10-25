/**
 * MRP Calculator Tests
 *
 * Tests for Material Requirements Planning calculation engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateMRP, calculateEOQ, calculateSafetyStock } from '../mrp-calculator'
import {
  mockBomItems,
  mockProducts,
  mockProductBoms,
  mockProductionSchedules,
} from '@/tests/mockData'
import prisma from '@/lib/db'

describe('MRP Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateMRP', () => {
    it('should calculate material requirements for a production schedule', async () => {
      // Mock database responses
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(
        mockBomItems.filter((item) =>
          mockProductBoms
            .filter((pb) => pb.productId === 'prod-1')
            .map((pb) => pb.partNumber)
            .includes(item.partNumber)
        )
      )

      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-001')

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.results.length).toBeGreaterThan(0)
    })

    it('should identify shortages when stock is insufficient', async () => {
      // Create a scenario with low stock
      const lowStockBom = { ...mockBomItems[2], currentStock: 10 } // LED-BLUE with only 10 units

      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[1], // Prod-2 which requires LED-BLUE
        product: {
          ...mockProducts[1],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-2'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([
        mockBomItems[0], // PCB-001
        mockBomItems[1], // RES-100
        lowStockBom, // LED-BLUE with low stock
      ])

      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-002')

      // Should detect shortage
      const ledShortage = result.results.find((r) => r.partNumber === 'LED-BLUE')
      expect(ledShortage).toBeDefined()
      expect(ledShortage?.status).toMatch(/shortage|critical/)
      expect(result.summary.shortageCount).toBeGreaterThan(0)
    })

    it('should calculate correct gross requirements based on BOM', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        unitsToProducePerDay: 100,
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-001')

      // PCB-001 requires 1 per unit, so 100 units
      const pcbRequirement = result.results.find((r) => r.partNumber === 'PCB-001')
      expect(pcbRequirement?.grossRequirement).toBe(100)

      // RES-100 requires 2 per unit, so 200 units
      const resRequirement = result.results.find((r) => r.partNumber === 'RES-100')
      expect(resRequirement?.grossRequirement).toBe(200)
    })

    it('should calculate planned order dates considering lead time', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        startDate: new Date('2025-02-01'),
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-001')

      // PCB-001 has 14 day lead time
      const pcbRequirement = result.results.find((r) => r.partNumber === 'PCB-001')
      expect(pcbRequirement?.plannedOrderDate).toBeDefined()

      // Order date should be before production start date
      const productionStart = new Date('2025-02-01')
      expect(pcbRequirement!.plannedOrderDate.getTime()).toBeLessThan(
        productionStart.getTime()
      )
    })

    it('should handle schedule not found', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue(null)

      await expect(calculateMRP('INVALID-SCHEDULE')).rejects.toThrow(
        'Production schedule not found'
      )
    })

    it('should calculate total cost for material requirements', async () => {
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        unitsToProducePerDay: 100,
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mockBomItems)
      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-001')

      expect(result.summary.totalCost).toBeGreaterThan(0)
      result.results.forEach((r) => {
        expect(r.totalCost).toBe(r.plannedOrderQuantity * r.unitCost)
      })
    })
  })

  describe('calculateEOQ', () => {
    it('should calculate Economic Order Quantity correctly', () => {
      const eoq = calculateEOQ({
        annualDemand: 1000,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      })

      // EOQ formula: sqrt((2 * D * S) / H)
      // sqrt((2 * 1000 * 50) / 2) = sqrt(50000) ≈ 223.6
      expect(eoq).toBeCloseTo(223.6, 0)
    })

    it('should handle zero demand', () => {
      const eoq = calculateEOQ({
        annualDemand: 0,
        orderingCost: 50,
        holdingCostPerUnit: 2,
      })

      expect(eoq).toBe(0)
    })

    it('should handle large demand volumes', () => {
      const eoq = calculateEOQ({
        annualDemand: 100000,
        orderingCost: 100,
        holdingCostPerUnit: 5,
      })

      expect(eoq).toBeGreaterThan(0)
      expect(eoq).toBeLessThan(100000)
    })
  })

  describe('calculateSafetyStock', () => {
    it('should calculate safety stock based on demand variability', () => {
      const safetyStock = calculateSafetyStock({
        averageDailyDemand: 10,
        demandStdDev: 2,
        leadTimeDays: 14,
        serviceLevel: 0.95,
      })

      expect(safetyStock).toBeGreaterThan(0)
    })

    it('should return 0 for zero demand variability', () => {
      const safetyStock = calculateSafetyStock({
        averageDailyDemand: 10,
        demandStdDev: 0,
        leadTimeDays: 14,
        serviceLevel: 0.95,
      })

      expect(safetyStock).toBe(0)
    })

    it('should increase safety stock with longer lead times', () => {
      const shortLeadTime = calculateSafetyStock({
        averageDailyDemand: 10,
        demandStdDev: 2,
        leadTimeDays: 7,
        serviceLevel: 0.95,
      })

      const longLeadTime = calculateSafetyStock({
        averageDailyDemand: 10,
        demandStdDev: 2,
        leadTimeDays: 28,
        serviceLevel: 0.95,
      })

      expect(longLeadTime).toBeGreaterThan(shortLeadTime)
    })
  })

  describe('MRP Summary', () => {
    it('should generate accurate summary statistics', async () => {
      // Mix of sufficient and shortage scenarios
      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[0],
        product: {
          ...mockProducts[0],
          bom: mockProductBoms.filter((pb) => pb.productId === 'prod-1'),
        },
      } as any)

      const mixedStock = [
        { ...mockBomItems[0], currentStock: 1000 }, // Sufficient
        { ...mockBomItems[1], currentStock: 10 }, // Shortage
        { ...mockBomItems[3], currentStock: 500 }, // Sufficient
      ]

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue(mixedStock)
      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-001')

      expect(result.summary.totalComponents).toBe(mixedStock.length)
      expect(result.summary.sufficientCount + result.summary.shortageCount + result.summary.criticalCount).toBe(
        mixedStock.length
      )
    })

    it('should provide urgent actions for critical shortages', async () => {
      const criticalBom = { ...mockBomItems[2], currentStock: 1 } // Very low stock

      vi.mocked(prisma.productionSchedule.findUnique).mockResolvedValue({
        ...mockProductionSchedules[1],
        product: {
          ...mockProducts[1],
          bom: [mockProductBoms[5]], // LED-BLUE requirement
        },
      } as any)

      vi.mocked(prisma.bomItem.findMany).mockResolvedValue([criticalBom])
      vi.mocked(prisma.materialRequirement.findMany).mockResolvedValue([])

      const result = await calculateMRP('SCHED-2025-002')

      expect(result.summary.urgentActions.length).toBeGreaterThan(0)
      expect(result.summary.criticalCount).toBeGreaterThan(0)
    })
  })
})
