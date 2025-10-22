/**
 * React Query hooks for BOM data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface BomItem {
  id: string
  partNumber: string
  description: string
  quantityPerUnit: number
  currentStock: number
  unitCost: number
  supplier: string
  reorderPoint: number
  leadTimeDays: number
  category: string
  safetyStock: number
  createdAt: string
  updatedAt: string
  totalValue: number
  stockStatus: 'out' | 'low' | 'sufficient' | 'good'
  _count?: {
    movements: number
    materialReqs: number
  }
}

export interface BomQueryParams {
  search?: string
  category?: string
  supplier?: string
  status?: 'all' | 'sufficient' | 'low' | 'out'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BomListResponse {
  items: BomItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  summary: {
    totalInventoryValue: number
    itemsBelowReorder: number
    totalItems: number
  }
}

// Query keys
export const bomKeys = {
  all: ['bom'] as const,
  lists: () => [...bomKeys.all, 'list'] as const,
  list: (params: BomQueryParams) => [...bomKeys.lists(), params] as const,
  details: () => [...bomKeys.all, 'detail'] as const,
  detail: (id: string) => [...bomKeys.details(), id] as const,
  categories: () => [...bomKeys.all, 'categories'] as const,
  suppliers: () => [...bomKeys.all, 'suppliers'] as const,
}

// Fetch BOM list
export function useBomList(params: BomQueryParams = {}) {
  return useQuery({
    queryKey: bomKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.category) searchParams.set('category', params.category)
      if (params.supplier) searchParams.set('supplier', params.supplier)
      if (params.status) searchParams.set('status', params.status)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

      const response = await fetch(`/api/bom?${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch BOM items')
      return response.json() as Promise<BomListResponse>
    },
    staleTime: 30000, // 30 seconds
  })
}

// Fetch single BOM item
export function useBomItem(id: string | null) {
  return useQuery({
    queryKey: bomKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('No ID provided')
      const response = await fetch(`/api/bom/${id}`)
      if (!response.ok) throw new Error('Failed to fetch BOM item')
      return response.json()
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

// Fetch categories
export function useBomCategories() {
  return useQuery({
    queryKey: bomKeys.categories(),
    queryFn: async () => {
      const response = await fetch('/api/bom/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json() as Promise<string[]>
    },
    staleTime: 60000, // 1 minute
  })
}

// Fetch suppliers
export function useBomSuppliers() {
  return useQuery({
    queryKey: bomKeys.suppliers(),
    queryFn: async () => {
      const response = await fetch('/api/bom/suppliers')
      if (!response.ok) throw new Error('Failed to fetch suppliers')
      return response.json() as Promise<string[]>
    },
    staleTime: 60000,
  })
}

// Update BOM item
export function useUpdateBomItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BomItem> }) => {
      const response = await fetch(`/api/bom/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update BOM item')
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}

// Delete BOM item
export function useDeleteBomItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bom/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete BOM item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bomKeys.categories() })
      queryClient.invalidateQueries({ queryKey: bomKeys.suppliers() })
    },
  })
}

// Adjust stock
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      adjustmentType,
      quantity,
      reason,
      reference,
    }: {
      id: string
      adjustmentType: 'add' | 'remove' | 'set'
      quantity: number
      reason: string
      reference?: string
    }) => {
      const response = await fetch(`/api/bom/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustmentType, quantity, reason, reference }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to adjust stock')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) })
    },
  })
}

// Upload BOM CSV
export function useUploadBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/bom/upload', {
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
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bomKeys.categories() })
      queryClient.invalidateQueries({ queryKey: bomKeys.suppliers() })
    },
  })
}
