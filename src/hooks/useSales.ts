/**
 * React Query hooks for Sales Orders and Production Schedules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Priority } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface SalesOrder {
  id: string
  orderId: string
  productId: string
  forecastedUnits: number
  timePeriod: string
  priority: Priority
  customerSegment: string | null
  status: string
  createdAt: string
  product: {
    id: string
    sku: string
    name: string
    category: string
  }
}

export interface ProductionSchedule {
  id: string
  scheduleId: string
  productId: string
  unitsToProducePerDay: number
  startDate: string
  endDate: string
  workstationId: string
  shiftNumber: number
  status: string
  actualUnitsProduced: number | null
  createdAt: string
  updatedAt: string
  product: {
    id: string
    sku: string
    name: string
    category: string
  }
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
// QUERY KEYS
// ============================================================================

export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...salesKeys.lists(), filters] as const,
}

export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...scheduleKeys.lists(), filters] as const,
}

// ============================================================================
// SALES ORDERS HOOKS
// ============================================================================

export function useSalesOrders(filters: {
  productId?: string
  priority?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
} = {}) {
  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.productId) params.set('productId', filters.productId)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.status) params.set('status', filters.status)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())

      const response = await fetch(`/api/sales?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sales orders')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useUploadSales() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/sales/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() })
    },
  })
}

// ============================================================================
// PRODUCTION SCHEDULES HOOKS
// ============================================================================

export function useProductionSchedules(filters: {
  productId?: string
  workstationId?: string
  status?: string
  startDate?: string
  endDate?: string
} = {}) {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.productId) params.set('productId', filters.productId)
      if (filters.workstationId) params.set('workstationId', filters.workstationId)
      if (filters.status) params.set('status', filters.status)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const response = await fetch(`/api/schedules?${params}`)
      if (!response.ok) throw new Error('Failed to fetch schedules')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useGenerateSchedules() {
  return useMutation({
    mutationFn: async (options: {
      startDate: string
      endDate: string
      priorityFilter?: Priority
      workstationId?: string
      shiftsPerDay: number
      includeExistingSchedules?: boolean
    }) => {
      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate schedules')
      }

      return response.json() as Promise<GenerationResult>
    },
  })
}

export function useSaveSchedules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schedules: ScheduleProposal[]) => {
      const response = await fetch('/api/schedules/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save schedules')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
    },
  })
}
