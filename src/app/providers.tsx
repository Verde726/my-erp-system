'use client'

/**
 * React Query Provider - Performance Optimized
 * Wraps the application with QueryClientProvider for data fetching
 *
 * Performance optimizations:
 * - Aggressive caching with 2-minute stale time
 * - Smart retry logic
 * - Optimistic updates enabled
 * - Network mode optimization
 * - Deduplication of requests
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data freshness
            staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh longer
            gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache

            // Network optimization
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: false, // Don't refetch on component mount if data is fresh
            refetchOnReconnect: 'always', // Refetch when reconnecting to internet

            // Retry configuration
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

            // Performance
            structuralSharing: true, // Enable structural sharing for better memory usage
            networkMode: 'online', // Only run queries when online
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
            retryDelay: 1000,

            // Network mode
            networkMode: 'online',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
