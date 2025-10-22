/**
 * React Query hooks for financial data
 */

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FinancialSnapshot {
  source: 'database' | 'calculated'
  date: Date
  data: {
    totalInventoryValue: number
    wipValue: number
    finishedGoodsValue: number
    totalMaterialCost: number
    productionCostEst: number
    createdAt?: Date
  }
  note?: string
}

interface InventoryValue {
  totalValue: number
  byCategory: Array<{
    category: string
    value: number
    itemCount: number
  }>
  lowStockValue: number
  lowStockCount: number
  healthyStockValue: number
}

interface InventoryValueResponse {
  success: boolean
  data: {
    inventory: InventoryValue
    wip: {
      value?: number
      included: boolean
    }
    totalValue: number
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch financial snapshot for a specific date
 */
export function useFinancialSnapshot(date?: string) {
  return useQuery<FinancialSnapshot>({
    queryKey: ['financial', 'snapshot', date],
    queryFn: async () => {
      const url = date
        ? `/api/financial/snapshot?date=${date}`
        : '/api/financial/snapshot'

      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch financial snapshot')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch current inventory value with breakdown
 */
export function useInventoryValue(includeWIP: boolean = true) {
  return useQuery<InventoryValueResponse>({
    queryKey: ['financial', 'inventory-value', includeWIP],
    queryFn: async () => {
      const url = `/api/financial/inventory-value?includeWIP=${includeWIP}`

      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch inventory value')
      }

      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch cost variance analysis
 */
export function useCostVariance() {
  return useQuery({
    queryKey: ['financial', 'cost-variance'],
    queryFn: async () => {
      const response = await fetch('/api/financial/cost-variance')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch cost variance')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch profitability analysis
 */
export function useProfitability() {
  return useQuery({
    queryKey: ['financial', 'profitability'],
    queryFn: async () => {
      const response = await fetch('/api/financial/profitability')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch profitability data')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
