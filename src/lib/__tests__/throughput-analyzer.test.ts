/**
 * Throughput Analyzer Tests
 *
 * Tests for production throughput analysis, bottleneck detection,
 * and capacity planning calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyzeThroughput,
  calculateOEE,
  identifyBottlenecks,
  predictCapacity,
  calculateCycleTime,
} from '../throughput-analyzer'
import { mockThroughputData, mockProducts } from '@/tests/mockData'
import prisma from '@/lib/db'

describe('Throughput Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeThroughput', () => {
    it('should analyze throughput for a product', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await analyzeThroughput('prod-1')

      expect(result.productId).toBe('prod-1')
      expect(result.dataPoints).toBe(mockThroughputData.length)
      expect(result.averageUnitsPerHour).toBeGreaterThan(0)
      expect(result.averageEfficiency).toBeGreaterThan(0)
    })

    it('should calculate average units per hour', async () => {
      const throughputData = [
        {
          ...mockThroughputData[0],
          unitsProduced: 20,
          hoursWorked: 8,
        },
        {
          ...mockThroughputData[1],
          unitsProduced: 24,
          hoursWorked: 8,
        },
      ]

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(throughputData as any)

      const result = await analyzeThroughput('prod-1')

      // (20/8 + 24/8) / 2 = (2.5 + 3) / 2 = 2.75 units/hour
      expect(result.averageUnitsPerHour).toBeCloseTo(2.75, 2)
    })

    it('should calculate trend over time', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await analyzeThroughput('prod-1', { includeTrend: true })

      expect(result.trend).toBeDefined()
      expect(result.trend).toMatch(/improving|stable|declining/)
    })

    it('should identify peak performance periods', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await analyzeThroughput('prod-1', { includePeaks: true })

      expect(result.peakPerformance).toBeDefined()
      expect(result.peakPerformance!.maxUnitsPerHour).toBeGreaterThan(0)
      expect(result.peakPerformance!.date).toBeInstanceOf(Date)
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue([])

      await analyzeThroughput('prod-1', { startDate, endDate })

      expect(prisma.throughputData.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      )
    })

    it('should handle no data gracefully', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue([])

      const result = await analyzeThroughput('prod-999')

      expect(result.dataPoints).toBe(0)
      expect(result.averageUnitsPerHour).toBe(0)
      expect(result.averageEfficiency).toBe(0)
    })
  })

  describe('calculateOEE', () => {
    it('should calculate Overall Equipment Effectiveness', () => {
      const oee = calculateOEE({
        availableTime: 480, // 8 hours in minutes
        plannedDowntime: 30, // 30 min break
        unplannedDowntime: 20, // 20 min breakdown
        idealCycleTime: 2, // 2 min per unit
        totalUnits: 180,
        defectiveUnits: 10,
      })

      // Availability: (480 - 30 - 20) / (480 - 30) = 430/450 = 0.9556
      // Performance: (180 * 2) / 430 = 360/430 = 0.8372
      // Quality: (180 - 10) / 180 = 170/180 = 0.9444
      // OEE: 0.9556 * 0.8372 * 0.9444 H 0.756 (75.6%)

      expect(oee.availability).toBeCloseTo(0.9556, 2)
      expect(oee.performance).toBeCloseTo(0.8372, 2)
      expect(oee.quality).toBeCloseTo(0.9444, 2)
      expect(oee.oee).toBeCloseTo(0.756, 2)
    })

    it('should return perfect OEE for ideal conditions', () => {
      const oee = calculateOEE({
        availableTime: 480,
        plannedDowntime: 0,
        unplannedDowntime: 0,
        idealCycleTime: 2,
        totalUnits: 240, // 480 min / 2 min = 240 units
        defectiveUnits: 0,
      })

      expect(oee.availability).toBe(1)
      expect(oee.performance).toBe(1)
      expect(oee.quality).toBe(1)
      expect(oee.oee).toBe(1)
    })

    it('should handle zero production', () => {
      const oee = calculateOEE({
        availableTime: 480,
        plannedDowntime: 0,
        unplannedDowntime: 0,
        idealCycleTime: 2,
        totalUnits: 0,
        defectiveUnits: 0,
      })

      expect(oee.performance).toBe(0)
      expect(oee.quality).toBe(1) // No defects if no production
      expect(oee.oee).toBe(0)
    })

    it('should identify world-class OEE (>85%)', () => {
      const oee = calculateOEE({
        availableTime: 480,
        plannedDowntime: 20,
        unplannedDowntime: 10,
        idealCycleTime: 2,
        totalUnits: 220,
        defectiveUnits: 5,
      })

      expect(oee.oee).toBeGreaterThan(0.85)
      expect(oee.classification).toBe('world-class')
    })
  })

  describe('identifyBottlenecks', () => {
    it('should identify bottlenecks across workstations', async () => {
      const multiWorkstationData = [
        {
          ...mockThroughputData[0],
          workstationId: 'WS-1',
          unitsProduced: 100,
          hoursWorked: 8,
        },
        {
          ...mockThroughputData[1],
          workstationId: 'WS-2',
          unitsProduced: 80, // Slower - bottleneck
          hoursWorked: 8,
        },
        {
          ...mockThroughputData[0],
          workstationId: 'WS-3',
          unitsProduced: 95,
          hoursWorked: 8,
        },
      ]

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(multiWorkstationData as any)

      const result = await identifyBottlenecks()

      expect(result.bottlenecks.length).toBeGreaterThan(0)
      expect(result.bottlenecks[0].workstationId).toBe('WS-2')
      expect(result.bottlenecks[0].throughputRate).toBeLessThan(
        result.overallAverageThroughput
      )
    })

    it('should calculate constraint impact', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await identifyBottlenecks()

      if (result.bottlenecks.length > 0) {
        const bottleneck = result.bottlenecks[0]
        expect(bottleneck.constraintImpact).toBeDefined()
        expect(bottleneck.constraintImpact!).toBeGreaterThanOrEqual(0)
        expect(bottleneck.constraintImpact!).toBeLessThanOrEqual(100)
      }
    })

    it('should provide improvement recommendations', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await identifyBottlenecks()

      if (result.bottlenecks.length > 0) {
        expect(result.recommendations).toBeDefined()
        expect(result.recommendations!.length).toBeGreaterThan(0)
      }
    })

    it('should handle single workstation', async () => {
      const singleWorkstation = mockThroughputData.map((d) => ({
        ...d,
        workstationId: 'WS-1',
      }))

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(singleWorkstation as any)

      const result = await identifyBottlenecks()

      expect(result.bottlenecks.length).toBe(0)
    })
  })

  describe('predictCapacity', () => {
    it('should predict future capacity based on historical data', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await predictCapacity('prod-1', {
        forecastDays: 30,
      })

      expect(result.predictedDailyCapacity).toBeGreaterThan(0)
      expect(result.forecastDays).toBe(30)
      expect(result.confidenceLevel).toBeGreaterThan(0)
      expect(result.confidenceLevel).toBeLessThanOrEqual(100)
    })

    it('should account for efficiency trends', async () => {
      const improvingData = [
        { ...mockThroughputData[0], efficiency: 0.75 },
        { ...mockThroughputData[1], efficiency: 0.88 },
      ]

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(improvingData as any)

      const result = await predictCapacity('prod-1', {
        forecastDays: 30,
        includeTrend: true,
      })

      expect(result.trend).toBe('improving')
      expect(result.adjustedCapacity).toBeGreaterThan(result.baselineCapacity)
    })

    it('should provide conservative and optimistic estimates', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await predictCapacity('prod-1', {
        forecastDays: 30,
        includeRanges: true,
      })

      expect(result.conservativeEstimate).toBeLessThan(result.predictedDailyCapacity)
      expect(result.optimisticEstimate).toBeGreaterThan(result.predictedDailyCapacity)
    })

    it('should warn about low confidence predictions', async () => {
      const limitedData = [mockThroughputData[0]]

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(limitedData as any)

      const result = await predictCapacity('prod-1', {
        forecastDays: 90,
      })

      expect(result.confidenceLevel).toBeLessThan(70)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })
  })

  describe('calculateCycleTime', () => {
    it('should calculate average cycle time', () => {
      const cycleTime = calculateCycleTime({
        totalUnits: 100,
        totalTime: 480, // minutes
      })

      // 480 min / 100 units = 4.8 min per unit
      expect(cycleTime.averageCycleTime).toBe(4.8)
      expect(cycleTime.unitsPerHour).toBeCloseTo(12.5, 1) // 60/4.8
    })

    it('should identify cycle time improvements', () => {
      const current = calculateCycleTime({
        totalUnits: 100,
        totalTime: 400,
      })

      const previous = calculateCycleTime({
        totalUnits: 100,
        totalTime: 500,
      })

      const improvement = ((previous.averageCycleTime - current.averageCycleTime) /
        previous.averageCycleTime) * 100

      expect(improvement).toBeCloseTo(20, 0) // 20% improvement
    })

    it('should calculate theoretical maximum throughput', () => {
      const cycleTime = calculateCycleTime({
        totalUnits: 100,
        totalTime: 480,
        efficiency: 0.85,
      })

      const theoreticalCycleTime = cycleTime.averageCycleTime * 0.85
      const maxThroughput = 60 / theoreticalCycleTime

      expect(cycleTime.theoreticalMaxThroughput).toBeCloseTo(maxThroughput, 1)
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate takt time', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await analyzeThroughput('prod-1', {
        calculateTaktTime: true,
        customerDemand: 200, // units per day
        availableTime: 480, // minutes per day
      })

      // Takt time = 480 min / 200 units = 2.4 min per unit
      expect(result.taktTime).toBeCloseTo(2.4, 1)
    })

    it('should identify if production meets demand', async () => {
      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(mockThroughputData as any)

      const result = await analyzeThroughput('prod-1', {
        calculateTaktTime: true,
        customerDemand: 200,
        availableTime: 480,
      })

      expect(result.meetsDemand).toBeDefined()
      expect(typeof result.meetsDemand).toBe('boolean')
    })

    it('should calculate defect rate trend', async () => {
      const defectData = [
        { ...mockThroughputData[0], defectRate: 0.05 },
        { ...mockThroughputData[1], defectRate: 0.02 },
      ]

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(defectData as any)

      const result = await analyzeThroughput('prod-1', {
        includeQualityMetrics: true,
      })

      expect(result.averageDefectRate).toBeDefined()
      expect(result.defectRateTrend).toBe('improving')
    })
  })

  describe('Edge Cases', () => {
    it('should handle division by zero gracefully', () => {
      const oee = calculateOEE({
        availableTime: 0,
        plannedDowntime: 0,
        unplannedDowntime: 0,
        idealCycleTime: 2,
        totalUnits: 0,
        defectiveUnits: 0,
      })

      expect(oee.availability).toBe(0)
      expect(oee.performance).toBe(0)
      expect(oee.quality).toBe(1)
      expect(oee.oee).toBe(0)
    })

    it('should handle more defects than total units', () => {
      const oee = calculateOEE({
        availableTime: 480,
        plannedDowntime: 0,
        unplannedDowntime: 0,
        idealCycleTime: 2,
        totalUnits: 100,
        defectiveUnits: 150, // Invalid scenario
      })

      expect(oee.quality).toBe(0) // Cap at 0, not negative
    })

    it('should handle extremely high efficiency', async () => {
      const highEfficiencyData = mockThroughputData.map((d) => ({
        ...d,
        efficiency: 0.99,
      }))

      vi.mocked(prisma.throughputData.findMany).mockResolvedValue(highEfficiencyData as any)

      const result = await analyzeThroughput('prod-1')

      expect(result.averageEfficiency).toBeCloseTo(0.99, 2)
      expect(result.averageEfficiency).toBeLessThanOrEqual(1)
    })
  })
})
