/**
 * Mock Test Data
 *
 * Reusable mock data for tests
 */

import type { BomItem, Product, ProductBom, ProductionSchedule } from '@prisma/client'

export const mockBomItems: BomItem[] = [
  {
    id: 'bom-1',
    partNumber: 'PCB-001',
    description: 'Main Circuit Board',
    quantityPerUnit: 1,
    currentStock: 450,
    unitCost: 25.50,
    supplier: 'Electronics Components Ltd',
    reorderPoint: 100,
    leadTimeDays: 14,
    category: 'Electronics',
    safetyStock: 50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'bom-2',
    partNumber: 'RES-100',
    description: '100Ω Resistor Pack',
    quantityPerUnit: 1,
    currentStock: 2500,
    unitCost: 0.50,
    supplier: 'Electronics Components Ltd',
    reorderPoint: 500,
    leadTimeDays: 7,
    category: 'Electronics',
    safetyStock: 200,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'bom-3',
    partNumber: 'LED-BLUE',
    description: 'Blue LED 5mm',
    quantityPerUnit: 1,
    currentStock: 85, // Below reorder point
    unitCost: 0.35,
    supplier: 'Electronics Components Ltd',
    reorderPoint: 100,
    leadTimeDays: 14,
    category: 'Electronics',
    safetyStock: 50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'bom-4',
    partNumber: 'CASE-PLASTIC-A',
    description: 'Plastic Enclosure Case - Type A',
    quantityPerUnit: 1,
    currentStock: 600,
    unitCost: 8.75,
    supplier: 'Plastics & Polymers Inc',
    reorderPoint: 150,
    leadTimeDays: 10,
    category: 'Plastics',
    safetyStock: 75,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
]

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'CTRL-UNIT-100',
    name: 'Control Unit Model 100',
    description: 'Basic control unit',
    category: 'Control Systems',
    targetMargin: 0.35,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'prod-2',
    sku: 'CTRL-UNIT-200',
    name: 'Control Unit Model 200',
    description: 'Advanced control unit',
    category: 'Control Systems',
    targetMargin: 0.40,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
]

export const mockProductBoms: ProductBom[] = [
  {
    id: 'pb-1',
    productId: 'prod-1',
    partNumber: 'PCB-001',
    quantityNeeded: 1,
  },
  {
    id: 'pb-2',
    productId: 'prod-1',
    partNumber: 'RES-100',
    quantityNeeded: 2,
  },
  {
    id: 'pb-3',
    productId: 'prod-1',
    partNumber: 'CASE-PLASTIC-A',
    quantityNeeded: 1,
  },
  {
    id: 'pb-4',
    productId: 'prod-2',
    partNumber: 'PCB-001',
    quantityNeeded: 1,
  },
  {
    id: 'pb-5',
    productId: 'prod-2',
    partNumber: 'RES-100',
    quantityNeeded: 3,
  },
  {
    id: 'pb-6',
    productId: 'prod-2',
    partNumber: 'LED-BLUE',
    quantityNeeded: 4,
  },
]

export const mockProductionSchedules: ProductionSchedule[] = [
  {
    id: 'sched-1',
    scheduleId: 'SCHED-2025-001',
    productId: 'prod-1',
    unitsToProducePerDay: 100,
    actualUnitsProduced: 45,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-03'),
    workstationId: 'Assembly Line 1',
    shiftNumber: 1,
    status: 'in-progress',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
  },
  {
    id: 'sched-2',
    scheduleId: 'SCHED-2025-002',
    productId: 'prod-2',
    unitsToProducePerDay: 50,
    actualUnitsProduced: 0,
    startDate: new Date('2025-01-05'),
    endDate: new Date('2025-01-07'),
    workstationId: 'Assembly Line 2',
    shiftNumber: 1,
    status: 'scheduled',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
]

export const mockThroughputData = [
  {
    id: 'tp-1',
    productId: 'prod-1',
    date: new Date('2025-01-01'),
    unitsProduced: 20,
    hoursWorked: 8,
    defectRate: 0.02,
    workstationId: 'Assembly Line 1',
    efficiency: 0.85,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'tp-2',
    productId: 'prod-1',
    date: new Date('2025-01-02'),
    unitsProduced: 22,
    hoursWorked: 8,
    defectRate: 0.015,
    workstationId: 'Assembly Line 1',
    efficiency: 0.88,
    createdAt: new Date('2025-01-02'),
  },
]
