/**
 * Central export file for all ERP/MRP types, schemas, and constants
 *
 * Import from this file to access all type definitions, validation schemas,
 * and business constants throughout the application.
 *
 * @example
 * ```typescript
 * import {
 *   BomItem,
 *   BomItemSchema,
 *   PRIORITY_LEVELS,
 *   DEFAULT_TARGET_MARGIN
 * } from '@/models'
 * ```
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Base model types
  BomItem,
  Product,
  ProductBom,
  SalesOrder,
  ProductionSchedule,
  MaterialRequirement,
  ThroughputData,
  InventoryMovement,
  FinancialMetrics,
  Alert,
  User,
  Customer,
  Supplier,

  // Extended types with relations
  ProductWithBom,
  SalesOrderWithProduct,
  ProductionScheduleWithProduct,
  MaterialRequirementWithDetails,
  AlertWithContext,

  // Business logic types
  MRPResult,
  FinancialSnapshot,
  ThroughputMetrics,
  CapacityPrediction,
  InventoryHealthStatus,
  ScheduleFeasibility,
  ProductCostBreakdown,
  WorkstationUtilization,

  // CSV upload types
  BomUploadRow,
  ProductUploadRow,
  ProductBomUploadRow,
  SalesUploadRow,
  ProductionScheduleUploadRow,
  ThroughputUploadRow,
  InventoryMovementUploadRow,

  // API response types
  ApiResponse,
  PaginatedResponse,
  UploadResult,
  BulkOperationResult,

  // Dashboard types
  DashboardKPIs,
  ProductionDashboardMetrics,
  InventoryDashboardMetrics,
  FinancialDashboardMetrics,

  // Filter and query types
  DateRange,
  BomItemFilters,
  ProductFilters,
  SalesOrderFilters,
  ProductionScheduleFilters,
  AlertFilters,
  PaginationParams,

  // Form input types
  CreateBomItemInput,
  UpdateBomItemInput,
  CreateProductInput,
  UpdateProductInput,
  CreateProductBomInput,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  CreateProductionScheduleInput,
  UpdateProductionScheduleInput,
  CreateInventoryMovementInput,
  CreateAlertInput,
  UpdateAlertInput,

  // Calculation types
  MRPCalculationInput,
  MRPCalculationOutput,
  CostCalculationInput,
  CostCalculationOutput,

  // Report types
  ProductionReport,
  InventoryReport,
  FinancialReport,

  // Utility types
  DeepPartial,
  RequiredFields,
  ID,
  Timestamp,
  Status,
  TrendDirection,
} from './types'

// ============================================================================
// ENUM EXPORTS
// ============================================================================

export {
  Priority,
  MovementType,
  AlertType,
  Severity,
} from './types'

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

export {
  // Enum schemas
  PrioritySchema,
  MovementTypeSchema,
  AlertTypeSchema,
  SeveritySchema,

  // Base model schemas
  BomItemSchema,
  ProductSchema,
  ProductBomSchema,
  SalesOrderSchema,
  ProductionScheduleSchema,
  MaterialRequirementSchema,
  ThroughputDataSchema,
  InventoryMovementSchema,
  FinancialMetricsSchema,
  AlertSchema,
  UserSchema,
  CustomerSchema,
  SupplierSchema,

  // CSV upload schemas
  BomUploadRowSchema,
  ProductUploadRowSchema,
  ProductBomUploadRowSchema,
  SalesUploadRowSchema,
  ProductionScheduleUploadRowSchema,
  ThroughputUploadRowSchema,
  InventoryMovementUploadRowSchema,

  // Input schemas
  CreateBomItemInputSchema,
  UpdateBomItemInputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema,
  CreateProductBomInputSchema,
  CreateSalesOrderInputSchema,
  UpdateSalesOrderInputSchema,
  CreateProductionScheduleInputSchema,
  UpdateProductionScheduleInputSchema,
  CreateInventoryMovementInputSchema,
  CreateAlertInputSchema,
  UpdateAlertInputSchema,

  // Query parameter schemas
  PaginationParamsSchema,
  DateRangeSchema,
  BomItemFiltersSchema,
  ProductFiltersSchema,
  SalesOrderFiltersSchema,
  ProductionScheduleFiltersSchema,
  AlertFiltersSchema,

  // Calculation schemas
  MRPCalculationInputSchema,
  CostCalculationInputSchema,
} from './schemas'

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

export {
  // Enum values
  PRIORITY_LEVELS,
  MOVEMENT_TYPES,
  ALERT_TYPES,
  SEVERITY_LEVELS,

  // Status values
  SALES_ORDER_STATUS,
  PRODUCTION_SCHEDULE_STATUS,
  MATERIAL_REQUIREMENT_STATUS,
  ALERT_STATUS,
  INVENTORY_HEALTH_STATUS,

  // Categories
  BOM_CATEGORIES,
  PRODUCT_CATEGORIES,
  CUSTOMER_SEGMENTS,

  // Financial constants
  DEFAULT_OVERHEAD_RATE,
  DEFAULT_TARGET_MARGIN,
  DEFAULT_LABOR_COST_PER_HOUR,
  OVERHEAD_ALLOCATION_METHODS,
  COST_VARIANCE_THRESHOLD,

  // Inventory constants
  DEFAULT_SAFETY_STOCK_PERCENTAGE,
  INVENTORY_TURNOVER_DAYS,
  MIN_DAYS_REMAINING_ALERT,
  OVERSTOCK_THRESHOLD,
  STOCK_HEALTH_THRESHOLDS,

  // Production constants
  HOURS_PER_SHIFT,
  MAX_SHIFTS_PER_DAY,
  WORKING_DAYS_PER_WEEK,
  EFFICIENCY_THRESHOLDS,
  DEFECT_RATE_THRESHOLDS,
  CAPACITY_UTILIZATION_THRESHOLDS,
  SCHEDULE_ADHERENCE_THRESHOLDS,

  // MRP constants
  LEAD_TIME_BUFFER_PERCENTAGE,
  MIN_ORDER_QUANTITY_MULTIPLIER,
  LOT_SIZING_METHODS,
  DEFAULT_LOT_SIZING_METHOD,

  // Alert constants
  ALERT_AUTO_RESOLVE_HOURS,
  ALERT_SEVERITY_WEIGHTS,
  ALERT_TYPE_PRIORITIES,

  // Dashboard constants
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  DASHBOARD_REFRESH_INTERVAL,
  DEFAULT_REPORT_DAYS,
  THROUGHPUT_TREND_DAYS,
  CAPACITY_PREDICTION_WINDOW,
  MIN_PREDICTION_DATA_POINTS,

  // Validation limits
  VALIDATION_LIMITS,

  // Date formats
  DATE_FORMATS,

  // Messages
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,

  // RBAC
  USER_ROLES,
  ROLE_PERMISSIONS,

  // Export config
  EXPORT_FORMATS,
  CSV_EXPORT_CONFIG,

  // Type guards
  isPriorityLevel,
  isMovementType,
  isAlertType,
  isSeverityLevel,

  // Helper functions
  getAlertSeverityWeight,
  getAlertTypePriority,
  calculateSafetyStock,
  calculateSuggestedPrice,
  calculateLeadTimeWithBuffer,
  getStockHealthStatus,
  getEfficiencyRating,
  getDefectRateRating,
} from './constants'
