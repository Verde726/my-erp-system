/**
 * Vitest Test Setup
 *
 * Global test configuration and mocks
 */

import { vi } from 'vitest'

// Mock Prisma Client with named export
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    bomItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productBom: {
      findMany: vi.fn(),
    },
    productionSchedule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    materialRequirement: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    financialMetrics: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    throughputData: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    alert: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }

  return {
    default: mockPrisma,
    prisma: mockPrisma,
  }
})

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // Keep errors visible
}
