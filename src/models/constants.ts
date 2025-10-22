/**
 * Business Rules Constants and Enums for ERP/MRP System
 *
 * This file contains all constant values, business rules, and configuration
 * parameters used throughout the application.
 */

// ============================================================================
// ENUM VALUES (matching Prisma schema)
// ============================================================================

export const PRIORITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export const MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
} as const

export const ALERT_TYPES = {
  SHORTAGE: 'shortage',
  REORDER: 'reorder',
  SCHEDULE_CONFLICT: 'schedule_conflict',
  COST_OVERRUN: 'cost_overrun',
  CAPACITY_WARNING: 'capacity_warning',
  QUALITY_ISSUE: 'quality_issue',
} as const

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
} as const

// ============================================================================
// STATUS VALUES
// ============================================================================

export const SALES_ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
} as const

export const PRODUCTION_SCHEDULE_STATUS = {
  PLANNED: 'planned',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
  DELAYED: 'delayed',
} as const

export const MATERIAL_REQUIREMENT_STATUS = {
  PENDING: 'pending',
  ALLOCATED: 'allocated',
  PARTIALLY_ALLOCATED: 'partially_allocated',
  FULFILLED: 'fulfilled',
  SHORTAGE: 'shortage',
  ORDERED: 'ordered',
} as const

export const ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const

export const INVENTORY_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OVERSTOCK: 'overstock',
} as const

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const BOM_CATEGORIES = {
  RAW_MATERIALS: 'raw_materials',
  COMPONENTS: 'components',
  PACKAGING: 'packaging',
  CONSUMABLES: 'consumables',
  TOOLS: 'tools',
  HARDWARE: 'hardware',
  ELECTRONICS: 'electronics',
  CHEMICALS: 'chemicals',
  OTHER: 'other',
} as const

export const PRODUCT_CATEGORIES = {
  FINISHED_GOODS: 'finished_goods',
  SUB_ASSEMBLIES: 'sub_assemblies',
  WORK_IN_PROGRESS: 'work_in_progress',
  CUSTOM_ORDERS: 'custom_orders',
  STANDARD_PRODUCTS: 'standard_products',
  OTHER: 'other',
} as const

export const CUSTOMER_SEGMENTS = {
  ENTERPRISE: 'enterprise',
  SMB: 'smb',
  RETAIL: 'retail',
  DISTRIBUTOR: 'distributor',
  GOVERNMENT: 'government',
  INTERNAL: 'internal',
  OTHER: 'other',
} as const

// ============================================================================
// BUSINESS RULES - FINANCIAL
// ============================================================================

/**
 * Default overhead percentage applied to production costs
 */
export const DEFAULT_OVERHEAD_RATE = 0.25 // 25%

/**
 * Default target margin for products
 */
export const DEFAULT_TARGET_MARGIN = 0.30 // 30%

/**
 * Labor cost per hour (configurable per implementation)
 */
export const DEFAULT_LABOR_COST_PER_HOUR = 25.0

/**
 * Overhead allocation methods
 */
export const OVERHEAD_ALLOCATION_METHODS = {
  LABOR_HOURS: 'labor_hours',
  MACHINE_HOURS: 'machine_hours',
  MATERIAL_COST: 'material_cost',
  UNITS_PRODUCED: 'units_produced',
} as const

/**
 * Cost variance threshold for alerts (percentage)
 */
export const COST_VARIANCE_THRESHOLD = 0.10 // 10%

// ============================================================================
// BUSINESS RULES - INVENTORY
// ============================================================================

/**
 * Default safety stock percentage of reorder point
 */
export const DEFAULT_SAFETY_STOCK_PERCENTAGE = 0.20 // 20%

/**
 * Days to consider for inventory turnover calculation
 */
export const INVENTORY_TURNOVER_DAYS = 90

/**
 * Minimum days remaining before creating reorder alert
 */
export const MIN_DAYS_REMAINING_ALERT = 7

/**
 * Overstock threshold (percentage above reorder point)
 */
export const OVERSTOCK_THRESHOLD = 3.0 // 300% of reorder point

/**
 * Stock health thresholds
 */
export const STOCK_HEALTH_THRESHOLDS = {
  CRITICAL: 0.5, // 50% of reorder point
  WARNING: 1.0, // at reorder point
  HEALTHY: 1.5, // 150% of reorder point
} as const

// ============================================================================
// BUSINESS RULES - PRODUCTION
// ============================================================================

/**
 * Standard working hours per shift
 */
export const HOURS_PER_SHIFT = 8

/**
 * Maximum shifts per day
 */
export const MAX_SHIFTS_PER_DAY = 3

/**
 * Working days per week
 */
export const WORKING_DAYS_PER_WEEK = 5

/**
 * Production efficiency thresholds
 */
export const EFFICIENCY_THRESHOLDS = {
  EXCELLENT: 0.95, // 95%+
  GOOD: 0.85, // 85-95%
  ACCEPTABLE: 0.75, // 75-85%
  POOR: 0.60, // 60-75%
  // Below 60% is critical
} as const

/**
 * Defect rate thresholds
 */
export const DEFECT_RATE_THRESHOLDS = {
  EXCELLENT: 0.01, // < 1%
  GOOD: 0.03, // 1-3%
  ACCEPTABLE: 0.05, // 3-5%
  POOR: 0.10, // 5-10%
  // Above 10% is critical
} as const

/**
 * Capacity utilization thresholds
 */
export const CAPACITY_UTILIZATION_THRESHOLDS = {
  UNDERUTILIZED: 0.60, // < 60%
  OPTIMAL_MIN: 0.75, // 75%
  OPTIMAL_MAX: 0.90, // 90%
  OVERUTILIZED: 0.95, // > 95%
} as const

/**
 * Schedule adherence thresholds (percentage of target met)
 */
export const SCHEDULE_ADHERENCE_THRESHOLDS = {
  EXCELLENT: 0.98, // 98%+
  GOOD: 0.95, // 95-98%
  ACCEPTABLE: 0.90, // 90-95%
  POOR: 0.85, // 85-90%
  // Below 85% is critical
} as const

// ============================================================================
// BUSINESS RULES - MRP CALCULATIONS
// ============================================================================

/**
 * Lead time buffer (percentage added to supplier lead time)
 */
export const LEAD_TIME_BUFFER_PERCENTAGE = 0.15 // 15%

/**
 * Minimum order quantity multiplier
 */
export const MIN_ORDER_QUANTITY_MULTIPLIER = 1.0

/**
 * Lot sizing methods
 */
export const LOT_SIZING_METHODS = {
  EXACT_REQUIREMENT: 'exact_requirement',
  ECONOMIC_ORDER_QUANTITY: 'eoq',
  LOT_FOR_LOT: 'lot_for_lot',
  FIXED_ORDER_QUANTITY: 'fixed_order_quantity',
  PERIOD_ORDER_QUANTITY: 'period_order_quantity',
} as const

/**
 * Default lot sizing method
 */
export const DEFAULT_LOT_SIZING_METHOD = LOT_SIZING_METHODS.EXACT_REQUIREMENT

// ============================================================================
// BUSINESS RULES - ALERTS
// ============================================================================

/**
 * Alert auto-resolution timeout (hours)
 */
export const ALERT_AUTO_RESOLVE_HOURS = 72

/**
 * Alert priority weights for sorting
 */
export const ALERT_SEVERITY_WEIGHTS = {
  [SEVERITY_LEVELS.CRITICAL]: 100,
  [SEVERITY_LEVELS.WARNING]: 50,
  [SEVERITY_LEVELS.INFO]: 10,
} as const

/**
 * Alert type priorities
 */
export const ALERT_TYPE_PRIORITIES = {
  [ALERT_TYPES.SHORTAGE]: 1,
  [ALERT_TYPES.QUALITY_ISSUE]: 2,
  [ALERT_TYPES.SCHEDULE_CONFLICT]: 3,
  [ALERT_TYPES.COST_OVERRUN]: 4,
  [ALERT_TYPES.REORDER]: 5,
  [ALERT_TYPES.CAPACITY_WARNING]: 6,
} as const

// ============================================================================
// DASHBOARD CONFIGURATION
// ============================================================================

/**
 * Default pagination page size
 */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Maximum pagination page size
 */
export const MAX_PAGE_SIZE = 100

/**
 * Dashboard refresh interval (milliseconds)
 */
export const DASHBOARD_REFRESH_INTERVAL = 60000 // 1 minute

/**
 * Default date range for reports (days)
 */
export const DEFAULT_REPORT_DAYS = 30

/**
 * Throughput trend calculation window (days)
 */
export const THROUGHPUT_TREND_DAYS = 14

/**
 * Capacity prediction window (days of historical data)
 */
export const CAPACITY_PREDICTION_WINDOW = 30

/**
 * Minimum data points required for predictions
 */
export const MIN_PREDICTION_DATA_POINTS = 7

// ============================================================================
// DATA VALIDATION LIMITS
// ============================================================================

export const VALIDATION_LIMITS = {
  // String lengths
  MAX_PART_NUMBER_LENGTH: 50,
  MAX_SKU_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_ALERT_TITLE_LENGTH: 200,
  MAX_ALERT_DESCRIPTION_LENGTH: 2000,
  MAX_CATEGORY_LENGTH: 100,
  MAX_SUPPLIER_LENGTH: 200,
  MAX_WORKSTATION_ID_LENGTH: 50,

  // Numeric limits
  MAX_UNIT_COST: 1000000,
  MAX_QUANTITY: 1000000,
  MAX_LEAD_TIME_DAYS: 365,
  MAX_SHIFT_NUMBER: 3,
  MIN_TARGET_MARGIN: -1.0, // Can be negative
  MAX_TARGET_MARGIN: 10.0, // 1000%
  MIN_DEFECT_RATE: 0.0,
  MAX_DEFECT_RATE: 1.0,
  MIN_EFFICIENCY: 0.0,
  MAX_EFFICIENCY: 2.0, // Allow >100% for exceptional performance

  // CSV Upload limits
  MAX_CSV_ROWS: 10000,
  MAX_BULK_OPERATIONS: 1000,
} as const

// ============================================================================
// DATE/TIME FORMATS
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  SHORT_DATE: 'MM/dd/yyyy',
  REPORT_DATE: 'MMMM dd, yyyy',
} as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // General
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',

  // BOM
  PART_NUMBER_EXISTS: 'A part with this part number already exists.',
  PART_NUMBER_NOT_FOUND: 'Part number not found.',
  INVALID_STOCK_LEVEL: 'Stock level cannot be negative.',
  INVALID_REORDER_POINT: 'Reorder point must be greater than safety stock.',

  // Product
  SKU_EXISTS: 'A product with this SKU already exists.',
  SKU_NOT_FOUND: 'Product SKU not found.',
  INVALID_MARGIN: 'Target margin must be between -100% and 1000%.',

  // Production
  SCHEDULE_CONFLICT: 'A production schedule already exists for this workstation and time period.',
  INVALID_DATE_RANGE: 'End date must be after start date.',
  WORKSTATION_OVERBOOKED: 'Workstation is already at maximum capacity for this time period.',

  // MRP
  INSUFFICIENT_STOCK: 'Insufficient stock to fulfill production requirements.',
  MATERIAL_SHORTAGE: 'Material shortage detected. Cannot proceed with production.',

  // Upload
  INVALID_CSV_FORMAT: 'Invalid CSV format. Please check your file.',
  DUPLICATE_ENTRIES: 'Duplicate entries detected in upload.',
  REQUIRED_FIELD_MISSING: 'Required field is missing.',
} as const

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created.',
  UPDATED: 'Successfully updated.',
  DELETED: 'Successfully deleted.',
  UPLOADED: 'Successfully uploaded.',
  ALERT_RESOLVED: 'Alert has been resolved.',
  SCHEDULE_APPROVED: 'Production schedule approved.',
  INVENTORY_ADJUSTED: 'Inventory has been adjusted.',
} as const

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  PLANNER: 'planner',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['*'], // All permissions
  [USER_ROLES.MANAGER]: [
    'view:all',
    'create:all',
    'update:all',
    'delete:sales_orders',
    'approve:schedules',
    'resolve:alerts',
  ],
  [USER_ROLES.PLANNER]: [
    'view:all',
    'create:schedules',
    'create:sales_orders',
    'update:schedules',
    'update:sales_orders',
    'calculate:mrp',
  ],
  [USER_ROLES.OPERATOR]: [
    'view:schedules',
    'view:bom',
    'update:production_data',
    'create:inventory_movements',
  ],
  [USER_ROLES.VIEWER]: ['view:all'],
} as const

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
  PDF: 'pdf',
} as const

export const CSV_EXPORT_CONFIG = {
  DELIMITER: ',',
  QUOTE: '"',
  ESCAPE: '"',
  NEWLINE: '\n',
  ENCODING: 'utf-8',
} as const

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isPriorityLevel = (value: string): value is keyof typeof PRIORITY_LEVELS => {
  return Object.values(PRIORITY_LEVELS).includes(value as any)
}

export const isMovementType = (value: string): value is keyof typeof MOVEMENT_TYPES => {
  return Object.values(MOVEMENT_TYPES).includes(value as any)
}

export const isAlertType = (value: string): value is keyof typeof ALERT_TYPES => {
  return Object.values(ALERT_TYPES).includes(value as any)
}

export const isSeverityLevel = (value: string): value is keyof typeof SEVERITY_LEVELS => {
  return Object.values(SEVERITY_LEVELS).includes(value as any)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get alert severity weight for sorting
 */
export const getAlertSeverityWeight = (severity: string): number => {
  return ALERT_SEVERITY_WEIGHTS[severity as keyof typeof ALERT_SEVERITY_WEIGHTS] || 0
}

/**
 * Get alert type priority for sorting
 */
export const getAlertTypePriority = (alertType: string): number => {
  return ALERT_TYPE_PRIORITIES[alertType as keyof typeof ALERT_TYPE_PRIORITIES] || 999
}

/**
 * Calculate safety stock from reorder point
 */
export const calculateSafetyStock = (reorderPoint: number): number => {
  return Math.ceil(reorderPoint * DEFAULT_SAFETY_STOCK_PERCENTAGE)
}

/**
 * Calculate suggested price from cost and margin
 */
export const calculateSuggestedPrice = (cost: number, targetMargin: number): number => {
  return cost / (1 - targetMargin)
}

/**
 * Calculate lead time with buffer
 */
export const calculateLeadTimeWithBuffer = (leadTimeDays: number): number => {
  return Math.ceil(leadTimeDays * (1 + LEAD_TIME_BUFFER_PERCENTAGE))
}

/**
 * Get stock health status
 */
export const getStockHealthStatus = (
  currentStock: number,
  reorderPoint: number
): keyof typeof INVENTORY_HEALTH_STATUS => {
  const ratio = currentStock / reorderPoint

  if (ratio >= OVERSTOCK_THRESHOLD) {
    return 'OVERSTOCK'
  } else if (ratio >= STOCK_HEALTH_THRESHOLDS.HEALTHY) {
    return 'HEALTHY'
  } else if (ratio >= STOCK_HEALTH_THRESHOLDS.WARNING) {
    return 'WARNING'
  } else {
    return 'CRITICAL'
  }
}

/**
 * Get efficiency rating
 */
export const getEfficiencyRating = (efficiency: number): string => {
  if (efficiency >= EFFICIENCY_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (efficiency >= EFFICIENCY_THRESHOLDS.GOOD) return 'Good'
  if (efficiency >= EFFICIENCY_THRESHOLDS.ACCEPTABLE) return 'Acceptable'
  if (efficiency >= EFFICIENCY_THRESHOLDS.POOR) return 'Poor'
  return 'Critical'
}

/**
 * Get defect rate rating
 */
export const getDefectRateRating = (defectRate: number): string => {
  if (defectRate <= DEFECT_RATE_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (defectRate <= DEFECT_RATE_THRESHOLDS.GOOD) return 'Good'
  if (defectRate <= DEFECT_RATE_THRESHOLDS.ACCEPTABLE) return 'Acceptable'
  if (defectRate <= DEFECT_RATE_THRESHOLDS.POOR) return 'Poor'
  return 'Critical'
}
