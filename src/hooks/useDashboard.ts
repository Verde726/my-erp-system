/**
 * React Query hooks for executive dashboard data
 */

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DashboardKPIs {
  production: {
    unitsToday: number
    scheduleAdherence: number
    nextProduction: {
      productName: string
      startTime: Date
    } | null
  }
  inventory: {
    totalValue: number
    itemsBelowReorder: number
    daysRemaining: number
  }
  alerts: {
    criticalCount: number
    warningCount: number
    pendingActions: number
  }
  financial: {
    productionCostToday: number
    costVariance: number
    wipValue: number
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch dashboard KPIs
 */
export function useDashboardKPIs() {
  return useQuery<DashboardKPIs>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/kpis')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch dashboard KPIs')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Fetch upcoming production schedules
 */
export function useProductionSchedules(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'schedules', days],
    queryFn: async () => {
      const response = await fetch(`/api/schedules?days=${days}&status=active`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch production schedules')
      }

      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch throughput data for trends
 */
export function useThroughputTrends(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'throughput', days],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/throughput?days=${days}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch throughput trends')
      }

      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch critical inventory items
 */
export function useCriticalInventory(limit: number = 10) {
  return useQuery({
    queryKey: ['dashboard', 'critical-inventory', limit],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/inventory?limit=${limit}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch critical inventory')
      }

      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch material requirements for next N days
 */
export function useMaterialRequirements(days: number = 7) {
  return useQuery({
    queryKey: ['dashboard', 'material-requirements', days],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/requirements?days=${days}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch material requirements')
      }

      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })
}

/**
 * Fetch active alerts
 */
export function useActiveAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/alerts?status=active')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch active alerts')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}
