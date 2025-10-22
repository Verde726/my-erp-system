/**
 * CSV Export Utility
 *
 * Generic CSV export functionality with formatting and Excel compatibility
 */

import Papa from 'papaparse'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ColumnConfig<T = any> {
  header: string
  key: keyof T | string
  format?: (value: any, row: T) => string
  width?: number
}

export interface CSVExportOptions {
  includeBOM?: boolean // Byte Order Mark for Excel compatibility
  delimiter?: string
  newline?: string
  quotes?: boolean
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export data to CSV format
 */
export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ColumnConfig<T>[],
  filename: string,
  options: CSVExportOptions = {}
): Promise<string> {
  const {
    includeBOM = true,
    delimiter = ',',
    newline = '\r\n',
    quotes = true,
  } = options

  // Prepare headers
  const headers = columns.map((col) => col.header)

  // Transform data rows
  const rows = data.map((row) => {
    return columns.map((col) => {
      const value = getNestedValue(row, col.key as string)

      // Apply custom formatter if provided
      if (col.format) {
        return col.format(value, row)
      }

      // Default formatting
      return formatValue(value)
    })
  })

  // Combine headers and rows
  const csvData = [headers, ...rows]

  // Convert to CSV string
  const csv = Papa.unparse(csvData, {
    delimiter,
    newline,
    quotes,
    quoteChar: '"',
    escapeChar: '"',
  })

  // Add BOM for Excel compatibility
  const output = includeBOM ? '\uFEFF' + csv : csv

  return output
}

/**
 * Export multiple datasets to separate CSV files
 */
export async function exportMultipleToCSV<T extends Record<string, any>>(
  datasets: Array<{
    name: string
    data: T[]
    columns: ColumnConfig<T>[]
  }>,
  options: CSVExportOptions = {}
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const dataset of datasets) {
    results[dataset.name] = await exportToCSV(
      dataset.data,
      dataset.columns,
      dataset.name,
      options
    )
  }

  return results
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get value from nested object path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Format value for CSV output
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Create downloadable CSV blob
 */
export function createCSVBlob(csvString: string): Blob {
  return new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csvString: string, filename: string): void {
  const blob = createCSVBlob(csvString)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// PREDEFINED COLUMN CONFIGURATIONS
// ============================================================================

/**
 * Standard BOM inventory columns
 */
export const BOM_INVENTORY_COLUMNS: ColumnConfig[] = [
  { header: 'Part Number', key: 'partNumber' },
  { header: 'Description', key: 'description' },
  { header: 'Current Stock', key: 'currentStock' },
  { header: 'Unit Cost', key: 'unitCost', format: (v) => `$${v.toFixed(2)}` },
  {
    header: 'Total Value',
    key: 'currentStock',
    format: (v, row: any) => `$${(v * row.unitCost).toFixed(2)}`,
  },
  { header: 'Reorder Point', key: 'reorderPoint' },
  { header: 'Safety Stock', key: 'safetyStock' },
  { header: 'Supplier', key: 'supplier' },
  { header: 'Lead Time (days)', key: 'leadTimeDays' },
  { header: 'Category', key: 'category' },
]

/**
 * Production schedule columns
 */
export const PRODUCTION_SCHEDULE_COLUMNS: ColumnConfig[] = [
  { header: 'Schedule ID', key: 'scheduleId' },
  { header: 'Product SKU', key: 'product.sku' },
  { header: 'Product Name', key: 'product.name' },
  { header: 'Units/Day', key: 'unitsToProducePerDay' },
  {
    header: 'Start Date',
    key: 'startDate',
    format: (v) => new Date(v).toLocaleDateString(),
  },
  {
    header: 'End Date',
    key: 'endDate',
    format: (v) => new Date(v).toLocaleDateString(),
  },
  { header: 'Workstation', key: 'workstationId' },
  { header: 'Shift', key: 'shiftNumber' },
  { header: 'Status', key: 'status' },
  { header: 'Actual Units', key: 'actualUnitsProduced' },
]

/**
 * Financial metrics columns
 */
export const FINANCIAL_METRICS_COLUMNS: ColumnConfig[] = [
  {
    header: 'Date',
    key: 'date',
    format: (v) => new Date(v).toLocaleDateString(),
  },
  {
    header: 'Total Inventory Value',
    key: 'totalInventoryValue',
    format: (v) => `$${v.toLocaleString()}`,
  },
  {
    header: 'WIP Value',
    key: 'wipValue',
    format: (v) => `$${v.toLocaleString()}`,
  },
  {
    header: 'Finished Goods Value',
    key: 'finishedGoodsValue',
    format: (v) => `$${v.toLocaleString()}`,
  },
  {
    header: 'Material Cost',
    key: 'totalMaterialCost',
    format: (v) => `$${v.toLocaleString()}`,
  },
  {
    header: 'Production Cost Est.',
    key: 'productionCostEst',
    format: (v) => `$${v.toLocaleString()}`,
  },
]

/**
 * Alerts columns
 */
export const ALERTS_COLUMNS: ColumnConfig[] = [
  {
    header: 'Created',
    key: 'createdAt',
    format: (v) => new Date(v).toLocaleString(),
  },
  { header: 'Severity', key: 'severity' },
  { header: 'Type', key: 'alertType' },
  { header: 'Title', key: 'title' },
  { header: 'Description', key: 'description' },
  { header: 'Reference', key: 'reference' },
  { header: 'Status', key: 'status' },
  {
    header: 'Resolved',
    key: 'resolvedAt',
    format: (v) => (v ? new Date(v).toLocaleString() : ''),
  },
]
