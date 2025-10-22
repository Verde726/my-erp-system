/**
 * Excel Export Utility
 *
 * Multi-sheet Excel workbook exports with formatting and formulas
 */

import * as XLSX from 'xlsx'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExcelSheetConfig {
  name: string
  data: any[]
  columns?: Array<{
    header: string
    key: string
    width?: number
    format?: 'text' | 'number' | 'currency' | 'date' | 'percentage'
  }>
  totals?: boolean
  autoFilter?: boolean
}

export interface ExcelExportOptions {
  creator?: string
  company?: string
  title?: string
  subject?: string
  keywords?: string[]
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export data to Excel workbook with multiple sheets
 */
export async function exportToExcel(
  sheets: Record<string, any[]> | ExcelSheetConfig[],
  filename: string,
  options: ExcelExportOptions = {}
): Promise<Buffer> {
  // Create new workbook
  const workbook = XLSX.utils.book_new()

  // Set workbook properties
  workbook.Props = {
    Title: options.title || 'ERP System Report',
    Subject: options.subject || 'Generated Report',
    Author: options.creator || 'ERP System',
    Company: options.company || 'Manufacturing Company',
    CreatedDate: new Date(),
  }

  // Handle simple object format
  if (!Array.isArray(sheets)) {
    for (const [sheetName, data] of Object.entries(sheets)) {
      addSheet(workbook, sheetName, data)
    }
  } else {
    // Handle advanced sheet config format
    for (const sheetConfig of sheets) {
      addSheetWithConfig(workbook, sheetConfig)
    }
  }

  // Write workbook to buffer
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })

  return buffer
}

/**
 * Add simple sheet to workbook
 */
function addSheet(workbook: XLSX.WorkBook, name: string, data: any[]): void {
  if (data.length === 0) {
    // Create empty sheet
    const worksheet = XLSX.utils.aoa_to_sheet([[]])
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
    return
  }

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Auto-size columns
  const cols = Object.keys(data[0]).map((key) => ({
    wch: Math.max(key.length, 15),
  }))
  worksheet['!cols'] = cols

  // Add autofilter
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) }

  XLSX.utils.book_append_sheet(workbook, worksheet, name)
}

/**
 * Add sheet with advanced configuration
 */
function addSheetWithConfig(
  workbook: XLSX.WorkBook,
  config: ExcelSheetConfig
): void {
  if (config.data.length === 0) {
    const worksheet = XLSX.utils.aoa_to_sheet([[]])
    XLSX.utils.book_append_sheet(workbook, worksheet, config.name)
    return
  }

  let worksheet: XLSX.WorkSheet

  if (config.columns) {
    // Use custom columns
    const headers = config.columns.map((col) => col.header)
    const data = config.data.map((row) =>
      config.columns!.map((col) => {
        const value = row[col.key]
        return formatCellValue(value, col.format)
      })
    )

    worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])

    // Set column widths
    worksheet['!cols'] = config.columns.map((col) => ({
      wch: col.width || 15,
    }))

    // Apply number formats
    applyCellFormats(worksheet, config.columns, data.length)
  } else {
    // Auto-detect columns
    worksheet = XLSX.utils.json_to_sheet(config.data)

    // Auto-size columns
    const cols = Object.keys(config.data[0]).map((key) => ({
      wch: Math.max(key.length, 15),
    }))
    worksheet['!cols'] = cols
  }

  // Add totals row
  if (config.totals && config.columns) {
    addTotalsRow(worksheet, config.columns, config.data.length)
  }

  // Add autofilter
  if (config.autoFilter !== false) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, config.name)
}

/**
 * Format cell value based on type
 */
function formatCellValue(value: any, format?: string): any {
  if (value === null || value === undefined) {
    return ''
  }

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value : parseFloat(value) || 0
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0
    case 'percentage':
      return typeof value === 'number' ? value : parseFloat(value) || 0
    case 'date':
      return value instanceof Date ? value : new Date(value)
    default:
      return value
  }
}

/**
 * Apply cell formats to worksheet
 */
function applyCellFormats(
  worksheet: XLSX.WorkSheet,
  columns: ExcelSheetConfig['columns'],
  rowCount: number
): void {
  if (!columns) return

  for (let row = 2; row <= rowCount + 1; row++) {
    columns.forEach((col, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: colIndex })
      const cell = worksheet[cellAddress]

      if (!cell) return

      switch (col.format) {
        case 'currency':
          cell.z = '$#,##0.00'
          break
        case 'number':
          cell.z = '#,##0'
          break
        case 'percentage':
          cell.z = '0.00%'
          break
        case 'date':
          cell.z = 'yyyy-mm-dd'
          break
      }
    })
  }
}

/**
 * Add totals row with formulas
 */
function addTotalsRow(
  worksheet: XLSX.WorkSheet,
  columns: ExcelSheetConfig['columns'],
  rowCount: number
): void {
  if (!columns) return

  const totalsRow = rowCount + 2 // +1 for header, +1 for 0-index

  columns.forEach((col, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: totalsRow - 1, c: colIndex })

    if (colIndex === 0) {
      // First column: "Total" label
      worksheet[cellAddress] = { t: 's', v: 'TOTAL' }
    } else if (col.format === 'currency' || col.format === 'number') {
      // Numeric columns: SUM formula
      const startCell = XLSX.utils.encode_cell({ r: 1, c: colIndex })
      const endCell = XLSX.utils.encode_cell({ r: rowCount, c: colIndex })
      worksheet[cellAddress] = {
        t: 'n',
        f: `SUM(${startCell}:${endCell})`,
      }
    }
  })
}

/**
 * Create downloadable Excel blob
 */
export function createExcelBlob(buffer: Buffer): Blob {
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Trigger Excel download in browser
 */
export function downloadExcel(buffer: Buffer, filename: string): void {
  const blob = createExcelBlob(buffer)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert CSV to Excel
 */
export function csvToExcel(csvString: string, sheetName: string = 'Sheet1'): Buffer {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(
    csvString.split('\n').map((row) => row.split(','))
  )
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })
}

/**
 * Read Excel file
 */
export function readExcelFile(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(firstSheet)
}
