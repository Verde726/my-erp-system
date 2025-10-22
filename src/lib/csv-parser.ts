/**
 * Robust CSV Parsing and Validation System
 *
 * This module provides generic CSV parsing with Zod validation,
 * error handling, and template generation capabilities.
 */

import Papa from 'papaparse'
import { z, ZodSchema, ZodError } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export interface ParseError {
  row: number
  field?: string
  value?: unknown
  message: string
  severity: 'error' | 'warning'
}

export interface ParseResult<T> {
  data: T[]
  errors: ParseError[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    warnings: string[]
  }
}

export interface CSVParseOptions {
  maxFileSizeMB?: number
  skipEmptyLines?: boolean
  trimHeaders?: boolean
  trimFields?: boolean
  delimiter?: string
  encoding?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: Required<CSVParseOptions> = {
  maxFileSizeMB: 10,
  skipEmptyLines: true,
  trimHeaders: true,
  trimFields: true,
  delimiter: ',',
  encoding: 'utf-8',
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const STREAMING_THRESHOLD_BYTES = 5 * 1024 * 1024 // 5MB

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

/**
 * Parse and validate CSV file with Zod schema
 *
 * @param file - The CSV file to parse
 * @param validator - Zod schema for validation
 * @param options - Parsing options
 * @returns Promise with parsed data and errors
 *
 * @example
 * ```typescript
 * const result = await parseCSV(file, BomUploadSchema)
 * if (result.summary.invalidRows === 0) {
 *   // All rows valid, proceed with data
 *   await bulkCreateBomItems(result.data)
 * } else {
 *   // Show errors to user
 *   console.error(result.errors)
 * }
 * ```
 */
export async function parseCSV<T>(
  file: File,
  validator: ZodSchema<T>,
  options: CSVParseOptions = {}
): Promise<ParseResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate file size
  const maxBytes = opts.maxFileSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      data: [],
      errors: [
        {
          row: 0,
          message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${opts.maxFileSizeMB}MB)`,
          severity: 'error',
        },
      ],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        warnings: [],
      },
    }
  }

  // Determine parsing strategy based on file size
  if (file.size > STREAMING_THRESHOLD_BYTES) {
    return parseCSVStreaming(file, validator, opts)
  } else {
    return parseCSVComplete(file, validator, opts)
  }
}

// ============================================================================
// COMPLETE PARSING (for smaller files)
// ============================================================================

async function parseCSVComplete<T>(
  file: File,
  validator: ZodSchema<T>,
  options: Required<CSVParseOptions>
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: options.skipEmptyLines ? 'greedy' : false,
      delimiter: options.delimiter === ',' ? undefined : options.delimiter, // Auto-detect if comma
      transformHeader: options.trimHeaders ? (header) => header.trim() : undefined,
      transform: options.trimFields ? (value) => value.trim() : undefined,
      dynamicTyping: true, // Automatically convert numeric strings to numbers
      encoding: options.encoding,
      complete: (results) => {
        const parseResult = validateRows(results.data as Record<string, unknown>[], validator)
        resolve(parseResult)
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [
            {
              row: 0,
              message: `CSV parsing error: ${error.message}`,
              severity: 'error',
            },
          ],
          summary: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            warnings: ['Failed to parse CSV file'],
          },
        })
      },
    })
  })
}

// ============================================================================
// STREAMING PARSING (for larger files)
// ============================================================================

async function parseCSVStreaming<T>(
  file: File,
  validator: ZodSchema<T>,
  options: Required<CSVParseOptions>
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    const validData: T[] = []
    const errors: ParseError[] = []
    let rowNumber = 0

    Papa.parse(file, {
      header: true,
      skipEmptyLines: options.skipEmptyLines ? 'greedy' : false,
      delimiter: options.delimiter === ',' ? undefined : options.delimiter,
      transformHeader: options.trimHeaders ? (header) => header.trim() : undefined,
      transform: options.trimFields ? (value) => value.trim() : undefined,
      dynamicTyping: true,
      encoding: options.encoding,
      chunk: (results, parser) => {
        const chunkData = results.data as Record<string, unknown>[]

        chunkData.forEach((row) => {
          rowNumber++
          const result = validateRow(row, validator, rowNumber)

          if (result.success) {
            validData.push(result.data)
          } else {
            errors.push(...result.errors)
          }
        })
      },
      complete: () => {
        resolve({
          data: validData,
          errors,
          summary: {
            totalRows: rowNumber,
            validRows: validData.length,
            invalidRows: errors.filter((e) => e.severity === 'error').length,
            warnings: errors.filter((e) => e.severity === 'warning').map((e) => e.message),
          },
        })
      },
      error: (error) => {
        resolve({
          data: validData,
          errors: [
            ...errors,
            {
              row: rowNumber,
              message: `CSV parsing error: ${error.message}`,
              severity: 'error',
            },
          ],
          summary: {
            totalRows: rowNumber,
            validRows: validData.length,
            invalidRows: errors.length + 1,
            warnings: ['Parsing interrupted due to error'],
          },
        })
      },
    })
  })
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate all rows at once
 */
function validateRows<T>(
  rows: Record<string, unknown>[],
  validator: ZodSchema<T>
): ParseResult<T> {
  const validData: T[] = []
  const errors: ParseError[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1 // 1-indexed for user-friendly display
    const result = validateRow(row, validator, rowNumber)

    if (result.success) {
      validData.push(result.data)
    } else {
      errors.push(...result.errors)
    }
  })

  return {
    data: validData,
    errors,
    summary: {
      totalRows: rows.length,
      validRows: validData.length,
      invalidRows: errors.filter((e) => e.severity === 'error').length,
      warnings: errors.filter((e) => e.severity === 'warning').map((e) => e.message),
    },
  }
}

/**
 * Validate a single row
 */
function validateRow<T>(
  row: Record<string, unknown>,
  validator: ZodSchema<T>,
  rowNumber: number
): { success: true; data: T } | { success: false; errors: ParseError[] } {
  // Handle empty rows
  if (Object.keys(row).length === 0 || Object.values(row).every((v) => v === null || v === '')) {
    return {
      success: false,
      errors: [
        {
          row: rowNumber,
          message: 'Empty row',
          severity: 'warning',
        },
      ],
    }
  }

  // Preprocess row data
  const processedRow = preprocessRow(row)

  // Validate with Zod
  const result = validator.safeParse(processedRow)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const zodError = result.error as ZodError
    const errors: ParseError[] = zodError.errors.map((error) => ({
      row: rowNumber,
      field: error.path.join('.'),
      value: error.path.length > 0 ? getNestedValue(processedRow, error.path as string[]) : undefined,
      message: error.message,
      severity: 'error',
    }))

    return { success: false, errors }
  }
}

/**
 * Preprocess row data before validation
 * - Convert date strings to Date objects
 * - Handle numeric conversions
 * - Normalize boolean values
 */
function preprocessRow(row: Record<string, unknown>): Record<string, unknown> {
  const processed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === '' || value === undefined) {
      processed[key] = null
      continue
    }

    // Try to parse as date if it looks like a date string
    if (typeof value === 'string' && isDateString(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        processed[key] = date
        continue
      }
    }

    // PapaParse's dynamicTyping should handle numbers,
    // but we can add additional processing if needed
    processed[key] = value
  }

  return processed
}

/**
 * Check if string looks like a date
 */
function isDateString(str: string): boolean {
  // ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/
  return isoDateRegex.test(str)
}

/**
 * Get nested value from object using path array
 */
function getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  return path.reduce((current: any, key) => current?.[key], obj)
}

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

export type TemplateType = 'bom' | 'sales' | 'throughput' | 'product' | 'productBom' | 'inventoryMovement'

interface TemplateDefinition {
  headers: string[]
  examples: string[][]
  hints?: string[]
}

const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  bom: {
    headers: [
      'partNumber',
      'description',
      'quantityPerUnit',
      'currentStock',
      'unitCost',
      'supplier',
      'reorderPoint',
      'leadTimeDays',
      'category',
      'safetyStock',
    ],
    hints: [
      'string (required)',
      'string (required)',
      'number (required)',
      'number (required)',
      'number (required)',
      'string (required)',
      'number (required)',
      'integer (required)',
      'string (required)',
      'number (optional, default: 0)',
    ],
    examples: [
      [
        'BOLT-M5-100',
        'M5 Bolt 100mm',
        '1',
        '500',
        '0.15',
        'FastenerCo',
        '100',
        '7',
        'hardware',
        '20',
      ],
      [
        'PLATE-STEEL-12',
        'Steel Plate 12x12',
        '1',
        '200',
        '12.50',
        'SteelWorks Inc',
        '50',
        '14',
        'raw_materials',
        '10',
      ],
    ],
  },

  sales: {
    headers: ['orderId', 'productSku', 'forecastedUnits', 'date', 'priority', 'customerSegment', 'status'],
    hints: [
      'string (required)',
      'string (required)',
      'number (required)',
      'YYYY-MM-DD (required)',
      'high|medium|low (optional, default: medium)',
      'string (optional)',
      'string (optional, default: pending)',
    ],
    examples: [
      ['SO-2024-001', 'PROD-A-100', '500', '2024-12-01', 'high', 'enterprise', 'pending'],
      ['SO-2024-002', 'PROD-B-200', '300', '2024-12-15', 'medium', 'smb', 'confirmed'],
    ],
  },

  throughput: {
    headers: ['date', 'productSku', 'unitsProduced', 'hoursWorked', 'defectRate', 'workstationId', 'efficiency'],
    hints: [
      'YYYY-MM-DD (required)',
      'string (required)',
      'number (required)',
      'number (required)',
      'number 0-1 (required)',
      'string (required)',
      'number (optional, calculated)',
    ],
    examples: [
      ['2024-11-20', 'PROD-A-100', '450', '8', '0.02', 'WS-001', '0.95'],
      ['2024-11-20', 'PROD-B-200', '380', '8', '0.05', 'WS-002', '0.88'],
    ],
  },

  product: {
    headers: ['sku', 'name', 'description', 'category', 'targetMargin'],
    hints: [
      'string (required)',
      'string (required)',
      'string (optional)',
      'string (required)',
      'number 0-1 (optional, default: 0.3)',
    ],
    examples: [
      ['PROD-A-100', 'Product A Standard', 'High quality product', 'finished_goods', '0.35'],
      ['PROD-B-200', 'Product B Premium', 'Premium line product', 'finished_goods', '0.40'],
    ],
  },

  productBom: {
    headers: ['productSku', 'partNumber', 'quantityNeeded'],
    hints: ['string (required)', 'string (required)', 'number (required)'],
    examples: [
      ['PROD-A-100', 'BOLT-M5-100', '4'],
      ['PROD-A-100', 'PLATE-STEEL-12', '1'],
      ['PROD-B-200', 'BOLT-M5-100', '6'],
    ],
  },

  inventoryMovement: {
    headers: ['partNumber', 'movementType', 'quantity', 'reference', 'reason', 'timestamp'],
    hints: [
      'string (required)',
      'in|out|adjustment (required)',
      'number (required, non-zero)',
      'string (optional)',
      'string (optional)',
      'YYYY-MM-DD (optional)',
    ],
    examples: [
      ['BOLT-M5-100', 'in', '1000', 'PO-2024-050', 'Received shipment', '2024-11-20'],
      ['PLATE-STEEL-12', 'out', '50', 'SCHED-001', 'Production consumption', '2024-11-20'],
      ['BOLT-M5-100', 'adjustment', '-10', 'INV-COUNT-Q4', 'Cycle count adjustment', '2024-11-20'],
    ],
  },
}

/**
 * Generate and download a CSV template
 *
 * @param type - The template type to generate
 * @param includeHints - Whether to include data type hints as first row
 * @param includeExamples - Whether to include example data rows
 *
 * @example
 * ```typescript
 * // Download BOM template with hints and examples
 * downloadTemplate('bom', true, true)
 * ```
 */
export function downloadTemplate(
  type: TemplateType,
  includeHints: boolean = true,
  includeExamples: boolean = true
): void {
  const template = TEMPLATES[type]

  if (!template) {
    throw new Error(`Unknown template type: ${type}`)
  }

  const rows: string[][] = []

  // Add headers
  rows.push(template.headers)

  // Add hints row if requested
  if (includeHints && template.hints) {
    rows.push(template.hints)
  }

  // Add example rows if requested
  if (includeExamples && template.examples) {
    rows.push(...template.examples)
  }

  // Convert to CSV string
  const csv = Papa.unparse(rows)

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${type}_template.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Get template headers for a given type
 *
 * @param type - The template type
 * @returns Array of header strings
 */
export function getTemplateHeaders(type: TemplateType): string[] {
  return TEMPLATES[type]?.headers || []
}

/**
 * Validate CSV headers against expected template
 *
 * @param headers - Actual headers from CSV
 * @param expectedType - Expected template type
 * @returns Object with validation result and missing/extra headers
 */
export function validateHeaders(
  headers: string[],
  expectedType: TemplateType
): {
  valid: boolean
  missingHeaders: string[]
  extraHeaders: string[]
  suggestions: string[]
} {
  const expectedHeaders = getTemplateHeaders(expectedType)
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase())
  const normalizedExpected = expectedHeaders.map((h) => h.toLowerCase())

  const missingHeaders = normalizedExpected.filter((h) => !normalizedHeaders.includes(h))
  const extraHeaders = normalizedHeaders.filter((h) => !normalizedExpected.includes(h))

  const suggestions: string[] = []
  if (missingHeaders.length > 0) {
    suggestions.push(`Missing required headers: ${missingHeaders.join(', ')}`)
  }
  if (extraHeaders.length > 0) {
    suggestions.push(`Unexpected headers found: ${extraHeaders.join(', ')} (will be ignored)`)
  }

  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
    extraHeaders,
    suggestions,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  const csv = Papa.unparse(data, {
    header: true,
    columns: headers,
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
