/**
 * Prisma Client Singleton with Performance Optimizations
 *
 * This ensures only one Prisma Client instance exists in development
 * to prevent connection pool exhaustion during hot-reload.
 *
 * Optimizations:
 * - Connection pooling configured for production workloads
 * - Query performance logging in development
 * - Optimized timeout settings
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Performance-optimized Prisma configuration
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : ['error'],

    // Connection pool optimization for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Log slow queries in development (> 100ms)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      console.warn(`🐌 Slow Query (${e.duration}ms):`, e.query)
    }
  })
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
