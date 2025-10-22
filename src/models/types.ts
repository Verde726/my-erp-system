/**
 * Comprehensive TypeScript Types and Interfaces for ERP/MRP System
 *
 * This file contains all business logic types, API types, and utility interfaces
 * that extend beyond the base Prisma-generated types.
 */

// ============================================================================
// PRISMA MODEL TYPES (Base entities matching database schema)
// ============================================================================

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
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  category: string
  targetMargin: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductBom {
  id: string
  productId: string
  partNumber: string
  quantityNeeded: number
}

export interface SalesOrder {
  id: string
  orderId: string
  productId: string
  forecastedUnits: number
  timePeriod: Date
  priority: Priority
  customerSegment: string | null
  status: string
  createdAt: Date
}

export interface ProductionSchedule {
  id: string
  scheduleId: string
  productId: string
  unitsToProducePerDay: number
  startDate: Date
  endDate: Date
  workstationId: string
  shiftNumber: number
  status: string
  actualUnitsProduced: number | null
  createdAt: Date
  updatedAt: Date
}

export interface MaterialRequirement {
  id: string
  scheduleId: string
  partNumber: string
  requiredQuantity: number
  allocatedQuantity: number
  status: string
  createdAt: Date
}

export interface ThroughputData {
  id: string
  date: Date
  productId: string
  unitsProduced: number
  hoursWorked: number
  defectRate: number
  workstationId: string
  efficiency: number
  createdAt: Date
}

export interface InventoryMovement {
  id: string
  partNumber: string
  movementType: MovementType
  quantity: number
  reference: string | null
  reason: string | null
  previousStock: number
  newStock: number
  timestamp: Date
}

export interface FinancialMetrics {
  id: string
  date: Date
  totalInventoryValue: number
  wipValue: number
  finishedGoodsValue: number
  totalMaterialCost: number
  productionCostEst: number
  createdAt: Date
}

export interface Alert {
  id: string
  alertType: AlertType
  severity: Severity
  title: string
  description: string
  reference: string | null
  status: string
  createdAt: Date
  resolvedAt: Date | null
}

export interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// ENUMS (matching Prisma schema)
// ============================================================================

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

export enum AlertType {
  SHORTAGE = 'shortage',
  REORDER = 'reorder',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  COST_OVERRUN = 'cost_overrun',
  CAPACITY_WARNING = 'capacity_warning',
  QUALITY_ISSUE = 'quality_issue',
}

export enum Severity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

// ============================================================================
// EXTENDED TYPES (with relations)
// ============================================================================

export interface ProductWithBom extends Product {
  bom: Array<ProductBom & { bomItem: BomItem }>
}

export interface SalesOrderWithProduct extends SalesOrder {
  product: Product
}

export interface ProductionScheduleWithProduct extends ProductionSchedule {
  product: Product
  materialReqs: Array<MaterialRequirement & { bomItem: BomItem }>
}

export interface MaterialRequirementWithDetails extends MaterialRequirement {
  bomItem: BomItem
  schedule: ProductionSchedule
}

export interface AlertWithContext extends Alert {
  context?: {
    partNumber?: string
    productSku?: string
    scheduleId?: string
  }
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

/**
 * Material Requirements Planning (MRP) calculation result
 */
export interface MRPResult {
  partNumber: string
  description: string
  grossRequirement: number
  currentStock: number
  netRequirement: number
  plannedOrderQuantity: number
  orderDate: Date
  requiredDate: Date
  status: 'sufficient' | 'shortage' | 'critical'
  leadTimeDays: number
  supplier: string
}

/**
 * Enhanced financial snapshot with breakdown
 */
export interface FinancialSnapshot {
  totalInventoryValue: number
  wipValue: number
  finishedGoodsValue: number
  totalMaterialCost: number
  productionCostEstimate: number
  breakdown: {
    rawMaterialsValue: number
    componentsValue: number
    overheadAllocation: number
  }
  date: Date
}

/**
 * Production throughput analytics and trends
 */
export interface ThroughputMetrics {
  productId: string
  productName: string
  averageUnitsPerHour: number
  averageUnitsPerDay: number
  standardDeviation: number
  efficiencyTrend: 'improving' | 'stable' | 'declining'
  defectRateTrend: 'improving' | 'stable' | 'worsening'
  averageDefectRate: number
  averageEfficiency: number
  dataPoints: number
  dateRange: {
    start: Date
    end: Date
  }
}

/**
 * Production capacity prediction based on historical data
 */
export interface CapacityPrediction {
  productId: string
  productName: string
  predictedUnitsPerDay: number
  confidenceInterval: {
    lower: number
    upper: number
  }
  basedOnDays: number
  reliabilityScore: number // 0-1
}

/**
 * Inventory health status
 */
export interface InventoryHealthStatus {
  partNumber: string
  description: string
  currentStock: number
  reorderPoint: number
  safetyStock: number
  daysRemaining: number
  status: 'healthy' | 'warning' | 'critical' | 'overstock'
  recommendation: string
  averageDailyUsage: number
}

/**
 * Production schedule feasibility analysis
 */
export interface ScheduleFeasibility {
  scheduleId: string
  isFeasible: boolean
  materialAvailability: Array<{
    partNumber: string
    required: number
    available: number
    shortage: number
    canProcure: boolean
  }>
  capacityConflicts: Array<{
    workstationId: string
    conflictingScheduleId: string
    overlapDays: number
  }>
  estimatedCompletionDate: Date
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

/**
 * Cost breakdown for a product
 */
export interface ProductCostBreakdown {
  productId: string
  productSku: string
  productName: string
  materialCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  targetMargin: number
  suggestedPrice: number
  breakdown: Array<{
    partNumber: string
    description: string
    quantity: number
    unitCost: number
    totalCost: number
  }>
}

/**
 * Workstation utilization metrics
 */
export interface WorkstationUtilization {
  workstationId: string
  utilizationRate: number // 0-1
  scheduledHours: number
  availableHours: number
  currentSchedules: number
  efficiency: number
  status: 'underutilized' | 'optimal' | 'overutilized'
}

// ============================================================================
// CSV UPLOAD TYPES
// ============================================================================

export interface BomUploadRow {
  partNumber: string
  description: string
  quantityPerUnit: number
  currentStock: number
  unitCost: number
  supplier: string
  reorderPoint: number
  leadTimeDays: number
  category: string
  safetyStock?: number
}

export interface ProductUploadRow {
  sku: string
  name: string
  description?: string
  category: string
  targetMargin?: number
}

export interface ProductBomUploadRow {
  productSku: string
  partNumber: string
  quantityNeeded: number
}

export interface SalesUploadRow {
  orderId: string
  productSku: string
  forecastedUnits: number
  date: string // ISO date string
  priority: 'high' | 'medium' | 'low'
  customerSegment?: string
  status?: string
}

export interface ProductionScheduleUploadRow {
  scheduleId: string
  productSku: string
  unitsToProducePerDay: number
  startDate: string // ISO date string
  endDate: string // ISO date string
  workstationId: string
  shiftNumber: number
}

export interface ThroughputUploadRow {
  date: string // ISO date string
  productSku: string
  unitsProduced: number
  hoursWorked: number
  defectRate: number
  workstationId: string
  efficiency?: number
}

export interface InventoryMovementUploadRow {
  partNumber: string
  movementType: 'in' | 'out' | 'adjustment'
  quantity: number
  reference?: string
  reason?: string
  timestamp?: string // ISO date string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export interface UploadResult {
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: Array<{
    row: number
    field?: string
    message: string
    value?: unknown
  }>
  warnings?: Array<{
    row: number
    message: string
  }>
  summary?: string
}

export interface BulkOperationResult {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  errors: Array<{
    id: string
    operation: string
    message: string
  }>
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardKPIs {
  production: {
    unitsToday: number
    scheduledUnitsToday: number
    scheduleAdherence: number // percentage
    nextScheduled: string
    activeSchedules: number
  }
  inventory: {
    totalValue: number
    itemsBelowReorder: number
    itemsBelowSafety: number
    daysRemaining: number
    turnoverRate: number
  }
  alerts: {
    criticalCount: number
    warningCount: number
    infoCount: number
    pendingActionsCount: number
    resolvedToday: number
  }
  financial: {
    todayProductionCost: number
    costVariance: number // percentage
    wipValue: number
    inventoryValue: number
    projectedMonthlyCost: number
  }
}

export interface ProductionDashboardMetrics {
  schedules: ProductionScheduleWithProduct[]
  throughput: ThroughputData[]
  alerts: Alert[]
  utilizationByWorkstation: Record<string, WorkstationUtilization>
  capacityPredictions: CapacityPrediction[]
}

export interface InventoryDashboardMetrics {
  lowStock: BomItem[]
  reorderNeeded: BomItem[]
  recentMovements: Array<InventoryMovement & { bomItem: BomItem }>
  valueByCategory: Record<string, number>
  turnoverRate: number
  healthStatus: InventoryHealthStatus[]
}

export interface FinancialDashboardMetrics {
  currentSnapshot: FinancialSnapshot
  historicalTrend: FinancialMetrics[]
  costByProduct: ProductCostBreakdown[]
  inventoryValuation: {
    rawMaterials: number
    wip: number
    finishedGoods: number
    total: number
  }
  costVarianceAnalysis: {
    planned: number
    actual: number
    variance: number
    variancePercentage: number
  }
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface DateRange {
  start: Date
  end: Date
}

export interface BomItemFilters {
  category?: string
  supplier?: string
  belowReorder?: boolean
  belowSafety?: boolean
  search?: string
}

export interface ProductFilters {
  category?: string
  search?: string
}

export interface SalesOrderFilters {
  productId?: string
  priority?: Priority
  status?: string
  dateRange?: DateRange
}

export interface ProductionScheduleFilters {
  productId?: string
  workstationId?: string
  shiftNumber?: number
  status?: string
  dateRange?: DateRange
}

export interface AlertFilters {
  alertType?: AlertType
  severity?: Severity
  status?: string
  dateRange?: DateRange
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface CreateBomItemInput {
  partNumber: string
  description: string
  quantityPerUnit: number
  currentStock: number
  unitCost: number
  supplier: string
  reorderPoint: number
  leadTimeDays: number
  category: string
  safetyStock?: number
}

export interface UpdateBomItemInput extends Partial<CreateBomItemInput> {
  id: string
}

export interface CreateProductInput {
  sku: string
  name: string
  description?: string
  category: string
  targetMargin?: number
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

export interface CreateProductBomInput {
  productId: string
  partNumber: string
  quantityNeeded: number
}

export interface CreateSalesOrderInput {
  orderId: string
  productId: string
  forecastedUnits: number
  timePeriod: Date
  priority?: Priority
  customerSegment?: string
  status?: string
}

export interface UpdateSalesOrderInput extends Partial<CreateSalesOrderInput> {
  id: string
}

export interface CreateProductionScheduleInput {
  scheduleId: string
  productId: string
  unitsToProducePerDay: number
  startDate: Date
  endDate: Date
  workstationId: string
  shiftNumber: number
  status?: string
}

export interface UpdateProductionScheduleInput extends Partial<CreateProductionScheduleInput> {
  id: string
  actualUnitsProduced?: number
}

export interface CreateInventoryMovementInput {
  partNumber: string
  movementType: MovementType
  quantity: number
  reference?: string
  reason?: string
}

export interface CreateAlertInput {
  alertType: AlertType
  severity: Severity
  title: string
  description: string
  reference?: string
}

export interface UpdateAlertInput {
  id: string
  status?: string
  resolvedAt?: Date
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface MRPCalculationInput {
  scheduleId: string
  productId: string
  quantityToProduce: number
  requiredDate: Date
}

export interface MRPCalculationOutput {
  scheduleId: string
  materialRequirements: MRPResult[]
  totalCost: number
  feasible: boolean
  shortages: MRPResult[]
  procurementNeeded: Array<{
    partNumber: string
    quantity: number
    supplier: string
    orderDate: Date
    expectedDelivery: Date
  }>
}

export interface CostCalculationInput {
  productId: string
  quantity: number
  includeOverhead?: boolean
  overheadRate?: number
}

export interface CostCalculationOutput {
  materialCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  costPerUnit: number
  breakdown: ProductCostBreakdown
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ProductionReport {
  dateRange: DateRange
  totalUnitsProduced: number
  totalHoursWorked: number
  averageEfficiency: number
  averageDefectRate: number
  byProduct: Array<{
    productId: string
    productName: string
    unitsProduced: number
    efficiency: number
    defectRate: number
  }>
  byWorkstation: Array<{
    workstationId: string
    unitsProduced: number
    hoursWorked: number
    efficiency: number
  }>
}

export interface InventoryReport {
  date: Date
  totalValue: number
  itemCount: number
  byCategory: Array<{
    category: string
    itemCount: number
    totalValue: number
    averageValue: number
  }>
  belowReorder: number
  belowSafety: number
  turnoverRate: number
}

export interface FinancialReport {
  dateRange: DateRange
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  grossMargin: number
  inventoryTurnover: number
  daysInventoryOutstanding: number
  costBreakdown: {
    materials: number
    labor: number
    overhead: number
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type ID = string

export type Timestamp = Date | string

export type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'worsening'

// ============================================================================
// EXPORT GROUPINGS
// ============================================================================

export type {
  // Re-export for convenience
}
