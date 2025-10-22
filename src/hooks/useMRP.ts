/**
 * React Query hooks for MRP operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface MRPResult {
  partNumber: string
  description: string
  scheduleId: string
  productSku: string
  productName: string
  grossRequirement: number
  currentStock: number
  allocatedStock: number
  availableStock: number
  netRequirement: number
  plannedOrderQuantity: number
  plannedOrderDate: string
  expectedDeliveryDate: string
  status: 'sufficient' | 'shortage' | 'critical'
  orderDateInPast: boolean
  leadTimeDays: number
  safetyStock: number
  reorderPoint: number
  unitCost: number
  totalCost: number
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

export interface MRPCalculationResult {
  results: MRPResult[]
  summary: MRPSummary
}

export function useCalculateMRP() {
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch('/api/mrp/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to calculate MRP')
      }

      return response.json() as Promise<MRPCalculationResult>
    },
  })
}

export function useCreateMaterialRequirements() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await fetch('/api/mrp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create material requirements')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useRunBatchMRP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (status?: 'planned' | 'approved' | 'in_progress') => {
      const response = await fetch('/api/mrp/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run batch MRP')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}
