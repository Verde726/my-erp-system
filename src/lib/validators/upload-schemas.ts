/**
 * Zod Schemas for CSV Upload Validation
 *
 * These schemas provide comprehensive validation for bulk data imports
 * with custom business logic and helpful error messages.
 */

import { z } from 'zod'
import { VALIDATION_LIMITS, BOM_CATEGORIES, PRODUCT_CATEGORIES } from '@/models/constants'

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Validate date is not too far in the past or future
 */
const reasonableDateValidator = z.coerce.date().refine(
  (date) => {
    const now = new Date()
    const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    const twoYearsAhead = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())

    return date >= fiveYearsAgo && date <= twoYearsAhead
  },
  {
    message: 'Date must be within the last 5 years and not more than 2 years in the future',
  }
)

/**
 * Validate defect rate is reasonable (< 50%)
 */
const defectRateValidator = z
  .number()
  .min(0, 'Defect rate cannot be negative')
  .max(1, 'Defect rate must be between 0 and 1')
  .refine((rate) => rate < 0.5, {
    message: 'Defect rate seems unusually high (>50%). Please verify this value.',
  })

/**
 * Validate part number format
 */
const partNumberValidator = z
  .string()
  .min(1, 'Part number is required')
  .max(VALIDATION_LIMITS.MAX_PART_NUMBER_LENGTH, 'Part number too long')
  .regex(/^[A-Z0-9-_]+$/i, 'Part number can only contain letters, numbers, hyphens, and underscores')

/**
 * Validate SKU format
 */
const skuValidator = z
  .string()
  .min(1, 'SKU is required')
  .max(VALIDATION_LIMITS.MAX_SKU_LENGTH, 'SKU too long')
  .regex(/^[A-Z0-9-_]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores')

/**
 * Validate order ID format
 */
const orderIdValidator = z
  .string()
  .min(1, 'Order ID is required')
  .regex(/^[A-Z]{2,4}-\d{4}-\d{3,6}$/i, 'Order ID must follow format: XX-YYYY-### (e.g., SO-2024-001)')

// ============================================================================
// BOM UPLOAD SCHEMA
// ============================================================================

export const BomUploadSchema = z
  .object({
    partNumber: partNumberValidator,

    description: z
      .string()
      .min(1, 'Description is required')
      .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, 'Description too long')
      .trim(),

    quantityPerUnit: z
      .number({
        required_error: 'Quantity per unit is required',
        invalid_type_error: 'Quantity per unit must be a number',
      })
      .positive('Quantity per unit must be greater than 0')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity per unit exceeds maximum allowed'),

    currentStock: z
      .number({
        required_error: 'Current stock is required',
        invalid_type_error: 'Current stock must be a number',
      })
      .nonnegative('Current stock cannot be negative')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Current stock exceeds maximum allowed'),

    unitCost: z
      .number({
        required_error: 'Unit cost is required',
        invalid_type_error: 'Unit cost must be a number',
      })
      .positive('Unit cost must be greater than 0')
      .max(VALIDATION_LIMITS.MAX_UNIT_COST, 'Unit cost exceeds maximum allowed')
      .refine((cost) => cost < 100000, {
        message: 'Unit cost seems unusually high (>$100,000). Please verify this value.',
      }),

    supplier: z
      .string()
      .min(1, 'Supplier is required')
      .max(VALIDATION_LIMITS.MAX_SUPPLIER_LENGTH, 'Supplier name too long')
      .trim(),

    reorderPoint: z
      .number({
        required_error: 'Reorder point is required',
        invalid_type_error: 'Reorder point must be a number',
      })
      .nonnegative('Reorder point cannot be negative')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Reorder point exceeds maximum allowed'),

    leadTimeDays: z
      .number({
        required_error: 'Lead time is required',
        invalid_type_error: 'Lead time must be a number',
      })
      .int('Lead time must be a whole number')
      .positive('Lead time must be at least 1 day')
      .max(VALIDATION_LIMITS.MAX_LEAD_TIME_DAYS, `Lead time cannot exceed ${VALIDATION_LIMITS.MAX_LEAD_TIME_DAYS} days`),

    category: z
      .string()
      .min(1, 'Category is required')
      .max(VALIDATION_LIMITS.MAX_CATEGORY_LENGTH, 'Category name too long')
      .trim(),

    safetyStock: z
      .number({
        invalid_type_error: 'Safety stock must be a number',
      })
      .nonnegative('Safety stock cannot be negative')
      .optional()
      .default(0),
  })
  .refine((data) => data.safetyStock <= data.reorderPoint, {
    message: 'Safety stock should not exceed reorder point',
    path: ['safetyStock'],
  })
  .refine((data) => data.currentStock >= 0, {
    message: 'Current stock must be non-negative',
    path: ['currentStock'],
  })

export type BomUploadRow = z.infer<typeof BomUploadSchema>

// ============================================================================
// SALES ORDER UPLOAD SCHEMA
// ============================================================================

export const SalesUploadSchema = z
  .object({
    orderId: orderIdValidator,

    productSku: skuValidator,

    forecastedUnits: z
      .number({
        required_error: 'Forecasted units is required',
        invalid_type_error: 'Forecasted units must be a number',
      })
      .positive('Forecasted units must be greater than 0')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Forecasted units exceeds maximum allowed')
      .int('Forecasted units must be a whole number'),

    date: reasonableDateValidator,

    priority: z
      .enum(['high', 'medium', 'low'], {
        errorMap: () => ({ message: 'Priority must be "high", "medium", or "low"' }),
      })
      .default('medium'),

    customerSegment: z
      .string()
      .trim()
      .max(100, 'Customer segment name too long')
      .optional()
      .nullable()
      .transform((val) => val || null),

    status: z.string().trim().optional().default('pending'),
  })
  .refine(
    (data) => {
      // Warn if forecasted units are very high
      return data.forecastedUnits <= 100000
    },
    {
      message: 'Forecasted units seem unusually high (>100,000). Please verify this value.',
      path: ['forecastedUnits'],
    }
  )

export type SalesUploadRow = z.infer<typeof SalesUploadSchema>

// ============================================================================
// THROUGHPUT UPLOAD SCHEMA
// ============================================================================

export const ThroughputUploadSchema = z
  .object({
    date: reasonableDateValidator,

    productSku: skuValidator,

    unitsProduced: z
      .number({
        required_error: 'Units produced is required',
        invalid_type_error: 'Units produced must be a number',
      })
      .nonnegative('Units produced cannot be negative')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Units produced exceeds maximum allowed')
      .int('Units produced must be a whole number'),

    hoursWorked: z
      .number({
        required_error: 'Hours worked is required',
        invalid_type_error: 'Hours worked must be a number',
      })
      .positive('Hours worked must be greater than 0')
      .max(24, 'Hours worked cannot exceed 24 hours in a day')
      .refine((hours) => hours >= 0.1, {
        message: 'Hours worked must be at least 0.1 (6 minutes)',
      }),

    defectRate: defectRateValidator,

    workstationId: z
      .string()
      .min(1, 'Workstation ID is required')
      .max(VALIDATION_LIMITS.MAX_WORKSTATION_ID_LENGTH, 'Workstation ID too long')
      .trim(),

    efficiency: z
      .number({
        invalid_type_error: 'Efficiency must be a number',
      })
      .min(0, 'Efficiency cannot be negative')
      .max(VALIDATION_LIMITS.MAX_EFFICIENCY, 'Efficiency value too high')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Calculate units per hour and check if reasonable
      const unitsPerHour = data.unitsProduced / data.hoursWorked
      return unitsPerHour <= 10000 // Warn if > 10,000 units/hour
    },
    {
      message: 'Production rate seems unusually high (>10,000 units/hour). Please verify these values.',
      path: ['unitsProduced'],
    }
  )

export type ThroughputUploadRow = z.infer<typeof ThroughputUploadSchema>

// ============================================================================
// PRODUCT UPLOAD SCHEMA
// ============================================================================

export const ProductUploadSchema = z.object({
  sku: skuValidator,

  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long').trim(),

  description: z
    .string()
    .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, 'Description too long')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),

  category: z
    .string()
    .min(1, 'Category is required')
    .max(VALIDATION_LIMITS.MAX_CATEGORY_LENGTH, 'Category name too long')
    .trim(),

  targetMargin: z
    .number({
      invalid_type_error: 'Target margin must be a number',
    })
    .min(VALIDATION_LIMITS.MIN_TARGET_MARGIN, 'Target margin too low')
    .max(VALIDATION_LIMITS.MAX_TARGET_MARGIN, 'Target margin too high')
    .optional()
    .default(0.3),
})

export type ProductUploadRow = z.infer<typeof ProductUploadSchema>

// ============================================================================
// PRODUCT BOM UPLOAD SCHEMA
// ============================================================================

export const ProductBomUploadSchema = z.object({
  productSku: skuValidator,

  partNumber: partNumberValidator,

  quantityNeeded: z
    .number({
      required_error: 'Quantity needed is required',
      invalid_type_error: 'Quantity needed must be a number',
    })
    .positive('Quantity needed must be greater than 0')
    .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Quantity needed exceeds maximum allowed'),
})

export type ProductBomUploadRow = z.infer<typeof ProductBomUploadSchema>

// ============================================================================
// PRODUCTION SCHEDULE UPLOAD SCHEMA
// ============================================================================

export const ProductionScheduleUploadSchema = z
  .object({
    scheduleId: z
      .string()
      .min(1, 'Schedule ID is required')
      .regex(/^SCHED-\d{4}-\d{3,6}$/i, 'Schedule ID must follow format: SCHED-YYYY-### (e.g., SCHED-2024-001)'),

    productSku: skuValidator,

    unitsToProducePerDay: z
      .number({
        required_error: 'Units to produce per day is required',
        invalid_type_error: 'Units to produce per day must be a number',
      })
      .positive('Units to produce per day must be greater than 0')
      .max(VALIDATION_LIMITS.MAX_QUANTITY, 'Units to produce per day exceeds maximum allowed'),

    startDate: reasonableDateValidator,

    endDate: reasonableDateValidator,

    workstationId: z
      .string()
      .min(1, 'Workstation ID is required')
      .max(VALIDATION_LIMITS.MAX_WORKSTATION_ID_LENGTH, 'Workstation ID too long')
      .trim(),

    shiftNumber: z
      .number({
        required_error: 'Shift number is required',
        invalid_type_error: 'Shift number must be a number',
      })
      .int('Shift number must be a whole number')
      .min(1, 'Shift number must be at least 1')
      .max(VALIDATION_LIMITS.MAX_SHIFT_NUMBER, `Maximum ${VALIDATION_LIMITS.MAX_SHIFT_NUMBER} shifts`),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type ProductionScheduleUploadRow = z.infer<typeof ProductionScheduleUploadSchema>

// ============================================================================
// INVENTORY MOVEMENT UPLOAD SCHEMA
// ============================================================================

export const InventoryMovementUploadSchema = z.object({
  partNumber: partNumberValidator,

  movementType: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: 'Movement type must be "in", "out", or "adjustment"' }),
  }),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .refine((val) => val !== 0, {
      message: 'Quantity cannot be zero',
    })
    .refine((val) => Math.abs(val) <= VALIDATION_LIMITS.MAX_QUANTITY, {
      message: 'Quantity exceeds maximum allowed',
    }),

  reference: z.string().trim().max(100, 'Reference too long').optional().nullable(),

  reason: z
    .string()
    .trim()
    .max(500, 'Reason too long')
    .optional()
    .nullable()
    .transform((val) => val || null),

  timestamp: reasonableDateValidator.optional().nullable(),
})

export type InventoryMovementUploadRow = z.infer<typeof InventoryMovementUploadSchema>

// ============================================================================
// BATCH VALIDATION HELPERS
// ============================================================================

/**
 * Check for duplicate part numbers in BOM upload
 */
export function checkDuplicatePartNumbers(rows: BomUploadRow[]): {
  hasDuplicates: boolean
  duplicates: string[]
} {
  const partNumbers = rows.map((r) => r.partNumber)
  const duplicates = partNumbers.filter((item, index) => partNumbers.indexOf(item) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

/**
 * Check for duplicate SKUs in product upload
 */
export function checkDuplicateSkus(rows: ProductUploadRow[]): {
  hasDuplicates: boolean
  duplicates: string[]
} {
  const skus = rows.map((r) => r.sku)
  const duplicates = skus.filter((item, index) => skus.indexOf(item) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

/**
 * Check for duplicate order IDs in sales upload
 */
export function checkDuplicateOrderIds(rows: SalesUploadRow[]): {
  hasDuplicates: boolean
  duplicates: string[]
} {
  const orderIds = rows.map((r) => r.orderId)
  const duplicates = orderIds.filter((item, index) => orderIds.indexOf(item) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

/**
 * Check for duplicate schedule IDs in production schedule upload
 */
export function checkDuplicateScheduleIds(rows: ProductionScheduleUploadRow[]): {
  hasDuplicates: boolean
  duplicates: string[]
} {
  const scheduleIds = rows.map((r) => r.scheduleId)
  const duplicates = scheduleIds.filter((item, index) => scheduleIds.indexOf(item) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate that referenced products exist (requires database lookup)
 */
export async function validateProductReferences(
  skus: string[],
  checkExists: (skus: string[]) => Promise<string[]>
): Promise<{
  valid: boolean
  missing: string[]
}> {
  const existingSkus = await checkExists(skus)
  const missing = skus.filter((sku) => !existingSkus.includes(sku))

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Validate that referenced parts exist (requires database lookup)
 */
export async function validatePartReferences(
  partNumbers: string[],
  checkExists: (partNumbers: string[]) => Promise<string[]>
): Promise<{
  valid: boolean
  missing: string[]
}> {
  const existingParts = await checkExists(partNumbers)
  const missing = partNumbers.filter((part) => !existingParts.includes(part))

  return {
    valid: missing.length === 0,
    missing,
  }
}
