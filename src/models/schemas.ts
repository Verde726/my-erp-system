/**
 * Zod Validation Schemas for ERP/MRP System
 *
 * This file contains all Zod schemas for runtime validation,
 * matching the Prisma database schema and business logic requirements.
 */

import { z } from 'zod'
import {
  PRIORITY_LEVELS,
  MOVEMENT_TYPES,
  ALERT_TYPES,
  SEVERITY_LEVELS,
  VALIDATION_LIMITS,
  BOM_CATEGORIES,
  PRODUCT_CATEGORIES,
  CUSTOMER_SEGMENTS,
} from './constants'

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const PrioritySchema = z.enum([
  PRIORITY_LEVELS.HIGH,
  PRIORITY_LEVELS.MEDIUM,
  PRIORITY_LEVELS.LOW,
])

export const MovementTypeSchema = z.enum([
  MOVEMENT_TYPES.IN,
  MOVEMENT_TYPES.OUT,
  MOVEMENT_TYPES.ADJUSTMENT,
])

export const AlertTypeSchema = z.enum([
  ALERT_TYPES.SHORTAGE,
  ALERT_TYPES.REORDER,
  ALERT_TYPES.SCHEDULE_CONFLICT,
  ALERT_TYPES.COST_OVERRUN,
  ALERT_TYPES.CAPACITY_WARNING,
  ALERT_TYPES.QUALITY_ISSUE,
])

export const SeveritySchema = z.enum([
  SEVERITY_LEVELS.CRITICAL,
  SEVERITY_LEVELS.WARNING,
  SEVERITY_LEVELS.INFO,
])

// ============================================================================
// BASE MODEL SCHEMAS
// ============================================================================

export const BomItemSchema = z.object({
  id: z.string().cuid().optional(),
  partNumber: z
    .string()
    .min(1, 'Part number is required')
    .max(VALIDATION_LIMITS.MAX_PART_NUMBER_LENGTH, 'Part number too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, 'Description too long'),
  quantityPerUnit: z
    .number()
    .positive('Quantity per unit must be positive'),
  currentStock: z
    .number()
    .nonnegative('Current stock cannot be negative'),
  unitCost: z
    .number()
    .nonnegative('Unit cost cannot be negative')
    .max(VALIDATION_LIMITS.MAX_UNIT_COST, 'Unit cost too high'),
  supplier: z
    .string()
    .min(1, 'Supplier is required')
    .max(VALIDATION_LIMITS.MAX_SUPPLIER_LENGTH, 'Supplier name too long'),
  reorderPoint: z
    .number()
    .nonnegative('Reorder point cannot be negative'),
  leadTimeDays: z
    .number()
    .int('Lead time must be a whole number')
    .nonnegative('Lead time cannot be negative')
    .max(VALIDATION_LIMITS.MAX_LEAD_TIME_DAYS, 'Lead time too long'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(VALIDATION_LIMITS.MAX_CATEGORY_LENGTH, 'Category name too long'),
  safetyStock: z
    .number()
    .nonnegative('Safety stock cannot be negative')
    .default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const ProductSchema = z.object({
  id: z.string().cuid().optional(),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(VALIDATION_LIMITS.MAX_SKU_LENGTH, 'SKU too long'),
  name: z.string().min(1, 'Product name is required'),
  description: z
    .string()
    .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, 'Description too long')
    .optional()
    .nullable(),
  category: z.string().min(1, 'Category is required'),
  targetMargin: z
    .number()
    .min(VALIDATION_LIMITS.MIN_TARGET_MARGIN, 'Target margin too low')
    .max(VALIDATION_LIMITS.MAX_TARGET_MARGIN, 'Target margin too high')
    .default(0.3),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const ProductBomSchema = z.object({
  id: z.string().cuid().optional(),
  productId: z.string().cuid('Invalid product ID'),
  partNumber: z.string().min(1, 'Part number is required'),
  quantityNeeded: z
    .number()
    .positive('Quantity needed must be positive')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity too high'),
})

export const SalesOrderSchema = z.object({
  id: z.string().cuid().optional(),
  orderId: z.string().min(1, 'Order ID is required'),
  productId: z.string().cuid('Invalid product ID'),
  forecastedUnits: z
    .number()
    .positive('Forecasted units must be positive')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity too high'),
  timePeriod: z.coerce.date(),
  priority: PrioritySchema.default(PRIORITY_LEVELS.MEDIUM),
  customerSegment: z.string().optional().nullable(),
  status: z.string().default('pending'),
  createdAt: z.date().optional(),
})

const ProductionScheduleBaseSchema = z.object({
  id: z.string().cuid().optional(),
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  productId: z.string().cuid('Invalid product ID'),
  unitsToProducePerDay: z
    .number()
    .positive('Units to produce per day must be positive')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity too high'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  workstationId: z
    .string()
    .min(1, 'Workstation ID is required')
    .max(VALIDATION_LIMITS.MAX_WORKSTATION_ID_LENGTH, 'Workstation ID too long'),
  shiftNumber: z
    .number()
    .int('Shift number must be a whole number')
    .min(1, 'Shift number must be at least 1')
    .max(VALIDATION_LIMITS.MAX_SHIFT_NUMBER, `Maximum ${VALIDATION_LIMITS.MAX_SHIFT_NUMBER} shifts`),
  status: z.string().default('planned'),
  actualUnitsProduced: z.number().nonnegative().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const ProductionScheduleSchema = ProductionScheduleBaseSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
  }
)

export const MaterialRequirementSchema = z.object({
  id: z.string().cuid().optional(),
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  requiredQuantity: z
    .number()
    .positive('Required quantity must be positive')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity too high'),
  allocatedQuantity: z
    .number()
    .nonnegative('Allocated quantity cannot be negative')
    .default(0),
  status: z.string().default('pending'),
  createdAt: z.date().optional(),
})

export const ThroughputDataSchema = z.object({
  id: z.string().cuid().optional(),
  date: z.coerce.date(),
  productId: z.string().cuid('Invalid product ID'),
  unitsProduced: z
    .number()
    .nonnegative('Units produced cannot be negative')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity too high'),
  hoursWorked: z
    .number()
    .positive('Hours worked must be positive')
    .max(24, 'Hours worked cannot exceed 24'),
  defectRate: z
    .number()
    .min(VALIDATION_LIMITS.MIN_DEFECT_RATE, 'Defect rate cannot be negative')
    .max(VALIDATION_LIMITS.MAX_DEFECT_RATE, 'Defect rate cannot exceed 100%'),
  workstationId: z.string().min(1, 'Workstation ID is required'),
  efficiency: z
    .number()
    .min(VALIDATION_LIMITS.MIN_EFFICIENCY, 'Efficiency cannot be negative')
    .max(VALIDATION_LIMITS.MAX_EFFICIENCY, 'Efficiency value too high'),
  createdAt: z.date().optional(),
})

export const InventoryMovementSchema = z.object({
  id: z.string().cuid().optional(),
  partNumber: z.string().min(1, 'Part number is required'),
  movementType: MovementTypeSchema,
  quantity: z.number().refine((val) => val !== 0, {
    message: 'Quantity cannot be zero',
  }),
  reference: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  previousStock: z.number().nonnegative('Previous stock cannot be negative'),
  newStock: z.number().nonnegative('New stock cannot be negative'),
  timestamp: z.coerce.date().default(() => new Date()),
})

export const FinancialMetricsSchema = z.object({
  id: z.string().cuid().optional(),
  date: z.coerce.date(),
  totalInventoryValue: z.number().nonnegative('Total inventory value cannot be negative'),
  wipValue: z.number().nonnegative('WIP value cannot be negative'),
  finishedGoodsValue: z.number().nonnegative('Finished goods value cannot be negative'),
  totalMaterialCost: z.number().nonnegative('Total material cost cannot be negative'),
  productionCostEst: z.number().nonnegative('Production cost estimate cannot be negative'),
  createdAt: z.date().optional(),
})

export const AlertSchema = z.object({
  id: z.string().cuid().optional(),
  alertType: AlertTypeSchema,
  severity: SeveritySchema,
  title: z
    .string()
    .min(1, 'Alert title is required')
    .max(VALIDATION_LIMITS.MAX_ALERT_TITLE_LENGTH, 'Title too long'),
  description: z
    .string()
    .min(1, 'Alert description is required')
    .max(VALIDATION_LIMITS.MAX_ALERT_DESCRIPTION_LENGTH, 'Description too long'),
  reference: z.string().optional().nullable(),
  status: z.string().default('active'),
  createdAt: z.date().optional(),
  resolvedAt: z.date().optional().nullable(),
})

export const UserSchema = z.object({
  id: z.string().cuid().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().optional().nullable(),
  role: z.string().default('user'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const CustomerSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const SupplierSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// ============================================================================
// CSV UPLOAD SCHEMAS
// ============================================================================

export const BomUploadRowSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  description: z.string().min(1, 'Description is required'),
  quantityPerUnit: z.coerce.number().positive('Quantity per unit must be positive'),
  currentStock: z.coerce.number().nonnegative('Current stock cannot be negative'),
  unitCost: z.coerce.number().nonnegative('Unit cost cannot be negative'),
  supplier: z.string().min(1, 'Supplier is required'),
  reorderPoint: z.coerce.number().nonnegative('Reorder point cannot be negative'),
  leadTimeDays: z.coerce.number().int().nonnegative('Lead time cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  safetyStock: z.coerce.number().nonnegative().optional().default(0),
})

export const ProductUploadRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  targetMargin: z.coerce.number().optional().default(0.3),
})

export const ProductBomUploadRowSchema = z.object({
  productSku: z.string().min(1, 'Product SKU is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  quantityNeeded: z.coerce.number().positive('Quantity needed must be positive'),
})

export const SalesUploadRowSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  forecastedUnits: z.coerce.number().positive('Forecasted units must be positive'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  customerSegment: z.string().optional(),
  status: z.string().optional().default('pending'),
})

export const ProductionScheduleUploadRowSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  unitsToProducePerDay: z.coerce.number().positive('Units to produce per day must be positive'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date format',
  }),
  workstationId: z.string().min(1, 'Workstation ID is required'),
  shiftNumber: z.coerce.number().int().min(1).max(3),
})

export const ThroughputUploadRowSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  productSku: z.string().min(1, 'Product SKU is required'),
  unitsProduced: z.coerce.number().nonnegative('Units produced cannot be negative'),
  hoursWorked: z.coerce.number().positive('Hours worked must be positive'),
  defectRate: z.coerce.number().min(0).max(1, 'Defect rate must be between 0 and 1'),
  workstationId: z.string().min(1, 'Workstation ID is required'),
  efficiency: z.coerce.number().optional(),
})

export const InventoryMovementUploadRowSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  movementType: z.enum(['in', 'out', 'adjustment']),
  quantity: z.coerce.number().refine((val) => val !== 0, {
    message: 'Quantity cannot be zero',
  }),
  reference: z.string().optional(),
  reason: z.string().optional(),
  timestamp: z.string().optional(),
})

// ============================================================================
// INPUT SCHEMAS (for API requests)
// ============================================================================

export const CreateBomItemInputSchema = BomItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateBomItemInputSchema = CreateBomItemInputSchema.partial().extend({
  id: z.string().cuid(),
})

export const CreateProductInputSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateProductInputSchema = CreateProductInputSchema.partial().extend({
  id: z.string().cuid(),
})

export const CreateProductBomInputSchema = ProductBomSchema.omit({
  id: true,
})

export const CreateSalesOrderInputSchema = SalesOrderSchema.omit({
  id: true,
  createdAt: true,
})

export const UpdateSalesOrderInputSchema = CreateSalesOrderInputSchema.partial().extend({
  id: z.string().cuid(),
})

export const CreateProductionScheduleInputSchema = ProductionScheduleBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
  }
)

export const UpdateProductionScheduleInputSchema = ProductionScheduleBaseSchema
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .extend({
    id: z.string().cuid(),
  })
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate > data.startDate,
    {
      message: 'End date must be after start date',
    }
  )

export const CreateInventoryMovementInputSchema = InventoryMovementSchema.omit({
  id: true,
  previousStock: true,
  newStock: true,
  timestamp: true,
})

export const CreateAlertInputSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  status: true,
})

export const UpdateAlertInputSchema = z.object({
  id: z.string().cuid(),
  status: z.string().optional(),
  resolvedAt: z.date().optional(),
})

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const DateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine((data) => data.end >= data.start, {
  message: 'End date must be after or equal to start date',
  path: ['end'],
})

export const BomItemFiltersSchema = z.object({
  category: z.string().optional(),
  supplier: z.string().optional(),
  belowReorder: z.coerce.boolean().optional(),
  belowSafety: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
})

export const SalesOrderFiltersSchema = z.object({
  productId: z.string().cuid().optional(),
  priority: PrioritySchema.optional(),
  status: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
})

export const ProductionScheduleFiltersSchema = z.object({
  productId: z.string().cuid().optional(),
  workstationId: z.string().optional(),
  shiftNumber: z.coerce.number().int().min(1).max(3).optional(),
  status: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
})

export const AlertFiltersSchema = z.object({
  alertType: AlertTypeSchema.optional(),
  severity: SeveritySchema.optional(),
  status: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
})

// ============================================================================
// CALCULATION INPUT SCHEMAS
// ============================================================================

export const MRPCalculationInputSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  productId: z.string().cuid('Invalid product ID'),
  quantityToProduce: z.number().positive('Quantity to produce must be positive'),
  requiredDate: z.coerce.date(),
})

export const CostCalculationInputSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be positive'),
  includeOverhead: z.boolean().optional().default(true),
  overheadRate: z.number().nonnegative().optional(),
})

// ============================================================================
// TYPE INFERENCE HELPERS
// ============================================================================

export type BomItemInput = z.infer<typeof BomItemSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type ProductBomInput = z.infer<typeof ProductBomSchema>
export type SalesOrderInput = z.infer<typeof SalesOrderSchema>
export type ProductionScheduleInput = z.infer<typeof ProductionScheduleSchema>
export type MaterialRequirementInput = z.infer<typeof MaterialRequirementSchema>
export type ThroughputDataInput = z.infer<typeof ThroughputDataSchema>
export type InventoryMovementInput = z.infer<typeof InventoryMovementSchema>
export type FinancialMetricsInput = z.infer<typeof FinancialMetricsSchema>
export type AlertInput = z.infer<typeof AlertSchema>

export type CreateBomItemInput = z.infer<typeof CreateBomItemInputSchema>
export type UpdateBomItemInput = z.infer<typeof UpdateBomItemInputSchema>
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>

export type PaginationParams = z.infer<typeof PaginationParamsSchema>
export type DateRange = z.infer<typeof DateRangeSchema>
export type BomItemFilters = z.infer<typeof BomItemFiltersSchema>
export type ProductFilters = z.infer<typeof ProductFiltersSchema>
export type SalesOrderFilters = z.infer<typeof SalesOrderFiltersSchema>
export type ProductionScheduleFilters = z.infer<typeof ProductionScheduleFiltersSchema>
export type AlertFilters = z.infer<typeof AlertFiltersSchema>
