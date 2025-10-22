/**
 * React Query hooks for alert management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AlertFilters {
  type?: string | string[]
  severity?: string | string[]
  reference?: string
  status?: 'active' | 'resolved' | 'dismissed'
  createdAfter?: string
  createdBefore?: string
  page?: number
  limit?: number
}

export interface Alert {
  id: string
  alertType: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  reference?: string
  status: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  resolution?: string
  resolvedBy?: string
  dismissedAt?: Date
  dismissalReason?: string
}

export interface PaginatedAlerts {
  alerts: Alert[]
  total: number
  page: number
  totalPages: number
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch alerts with filters and pagination
 */
export function useAlerts(filters: AlertFilters = {}) {
  const queryParams = new URLSearchParams()

  if (filters.type) {
    queryParams.set('type', Array.isArray(filters.type) ? filters.type.join(',') : filters.type)
  }
  if (filters.severity) {
    queryParams.set(
      'severity',
      Array.isArray(filters.severity) ? filters.severity.join(',') : filters.severity
    )
  }
  if (filters.reference) {
    queryParams.set('reference', filters.reference)
  }
  if (filters.status) {
    queryParams.set('status', filters.status)
  }
  if (filters.createdAfter) {
    queryParams.set('createdAfter', filters.createdAfter)
  }
  if (filters.createdBefore) {
    queryParams.set('createdBefore', filters.createdBefore)
  }
  if (filters.page) {
    queryParams.set('page', filters.page.toString())
  }
  if (filters.limit) {
    queryParams.set('limit', filters.limit.toString())
  }

  return useQuery<PaginatedAlerts>({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      const response = await fetch(`/api/alerts?${queryParams.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch alerts')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Fetch a single alert by ID
 */
export function useAlert(alertId: string) {
  return useQuery<Alert>({
    queryKey: ['alerts', alertId],
    queryFn: async () => {
      const response = await fetch(`/api/alerts/${alertId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch alert')
      }

      return response.json()
    },
    enabled: !!alertId,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new alert
 */
export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      type: string
      severity: string
      title: string
      description: string
      reference?: string
    }) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create alert')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch alerts
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

/**
 * Resolve an alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { alertId: string; notes: string; userId?: string }) => {
      const response = await fetch(`/api/alerts/${data.alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve',
          notes: data.notes,
          userId: data.userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to resolve alert')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate alerts list
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      // Invalidate specific alert
      queryClient.invalidateQueries({ queryKey: ['alerts', variables.alertId] })
    },
  })
}

/**
 * Dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { alertId: string; reason?: string }) => {
      const response = await fetch(`/api/alerts/${data.alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dismiss',
          notes: data.reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to dismiss alert')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate alerts list
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      // Invalidate specific alert
      queryClient.invalidateQueries({ queryKey: ['alerts', variables.alertId] })
    },
  })
}

/**
 * Delete an alert
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete alert')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate alerts list
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
