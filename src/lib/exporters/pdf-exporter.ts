/**
 * PDF Export Utility
 *
 * Professional PDF report generation with tables, charts, and corporate styling
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PDFReportOptions {
  title: string
  subtitle?: string
  companyName?: string
  dateRange?: { start: Date; end: Date }
  includeCharts?: boolean
  orientation?: 'portrait' | 'landscape'
}

interface ReportSection {
  title: string
  content: string | any[]
  type: 'text' | 'table' | 'chart' | 'summary'
}

// ============================================================================
// BASE PDF UTILITIES
// ============================================================================

/**
 * Create base PDF document with corporate styling
 */
function createPDF(options: PDFReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  return doc
}

/**
 * Add header to PDF
 */
function addHeader(
  doc: jsPDF,
  options: PDFReportOptions,
  pageNumber: number = 1
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Company name
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(options.companyName || 'ERP Manufacturing System', 15, yPos)

  // Report title
  yPos += 10
  doc.setFontSize(20)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(options.title, 15, yPos)

  // Subtitle/date range
  if (options.subtitle || options.dateRange) {
    yPos += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)

    const subtitle = options.subtitle ||
      (options.dateRange
        ? `${format(options.dateRange.start, 'MMM d, yyyy')} - ${format(options.dateRange.end, 'MMM d, yyyy')}`
        : '')

    doc.text(subtitle, 15, yPos)
  }

  // Generation date (right aligned)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
    pageWidth - 15,
    15,
    { align: 'right' }
  )

  // Horizontal line
  yPos += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(15, yPos, pageWidth - 15, yPos)

  return yPos + 10
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
}

/**
 * Add table to PDF
 */
function addTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  data: any[][],
  title?: string
): number {
  if (title) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(title, 15, startY)
    startY += 7
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 15, right: 15 },
  })

  return (doc as any).lastAutoTable.finalY + 10
}

/**
 * Add summary box
 */
function addSummaryBox(
  doc: jsPDF,
  startY: number,
  title: string,
  items: Array<{ label: string; value: string; highlight?: boolean }>
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxWidth = pageWidth - 30
  const boxHeight = 8 + items.length * 8

  // Draw box
  doc.setFillColor(240, 248, 255)
  doc.setDrawColor(66, 139, 202)
  doc.rect(15, startY, boxWidth, boxHeight, 'FD')

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(title, 20, startY + 6)

  // Items
  let yPos = startY + 14
  doc.setFontSize(10)

  items.forEach((item) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(item.label + ':', 20, yPos)

    doc.setFont('helvetica', item.highlight ? 'bold' : 'normal')
    doc.setTextColor(item.highlight ? 66 : 0, item.highlight ? 139 : 0, item.highlight ? 202 : 0)
    doc.text(item.value, pageWidth - 20, yPos, { align: 'right' })

    yPos += 6
  })

  return startY + boxHeight + 10
}

// ============================================================================
// INVENTORY REPORT
// ============================================================================

export async function exportInventoryReport(
  dateRange: { start: Date; end: Date },
  options: {
    includeMovements?: boolean
    groupByCategory?: boolean
  } = {}
): Promise<Buffer> {
  // Fetch data
  const bomItems = await prisma.bomItem.findMany({
    orderBy: { category: 'asc' },
  })

  const movements = options.includeMovements
    ? await prisma.inventoryMovement.findMany({
        where: {
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        include: {
          bomItem: true,
        },
        orderBy: { timestamp: 'desc' },
      })
    : []

  // Calculate summary metrics
  const totalValue = bomItems.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  )
  const itemCount = bomItems.length
  const itemsBelowReorder = bomItems.filter(
    (item) => item.currentStock <= item.reorderPoint
  ).length

  const valueByCategory = bomItems.reduce((acc, item) => {
    const value = item.currentStock * item.unitCost
    acc[item.category] = (acc[item.category] || 0) + value
    return acc
  }, {} as Record<string, number>)

  // Create PDF
  const doc = createPDF({
    title: 'Inventory Report',
    companyName: 'ERP Manufacturing System',
    dateRange,
  })

  let yPos = addHeader(doc, {
    title: 'Inventory Report',
    companyName: 'ERP Manufacturing System',
    dateRange,
  })

  // Executive Summary
  yPos = addSummaryBox(doc, yPos, 'Executive Summary', [
    { label: 'Total Inventory Value', value: `$${totalValue.toLocaleString()}`, highlight: true },
    { label: 'Total Items', value: itemCount.toString() },
    { label: 'Items Below Reorder', value: itemsBelowReorder.toString(), highlight: itemsBelowReorder > 0 },
    { label: 'Categories', value: Object.keys(valueByCategory).length.toString() },
  ])

  // Category breakdown
  if (options.groupByCategory) {
    yPos += 5
    const categoryData = Object.entries(valueByCategory).map(([category, value]) => [
      category,
      `$${value.toLocaleString()}`,
      `${((value / totalValue) * 100).toFixed(1)}%`,
    ])

    yPos = addTable(
      doc,
      yPos,
      ['Category', 'Value', 'Percentage'],
      categoryData,
      'Value by Category'
    )
  }

  // Detailed inventory
  yPos += 5
  const inventoryData = bomItems.map((item) => [
    item.partNumber,
    item.description.substring(0, 30),
    item.currentStock.toString(),
    `$${item.unitCost.toFixed(2)}`,
    `$${(item.currentStock * item.unitCost).toFixed(2)}`,
    item.reorderPoint.toString(),
    item.currentStock <= item.reorderPoint ? 'LOW' : 'OK',
  ])

  yPos = addTable(
    doc,
    yPos,
    ['Part #', 'Description', 'Stock', 'Unit Cost', 'Total Value', 'Reorder', 'Status'],
    inventoryData,
    'Inventory Details'
  )

  // Movements
  if (options.includeMovements && movements.length > 0) {
    // Add new page for movements
    doc.addPage()
    yPos = addHeader(doc, {
      title: 'Inventory Movements',
      dateRange,
    })

    const movementData = movements.slice(0, 50).map((movement) => [
      format(movement.timestamp, 'MMM d, yyyy'),
      movement.partNumber,
      movement.bomItem.description.substring(0, 25),
      movement.movementType.toUpperCase(),
      movement.quantity.toString(),
      movement.reference || '-',
    ])

    addTable(
      doc,
      yPos,
      ['Date', 'Part #', 'Description', 'Type', 'Quantity', 'Reference'],
      movementData,
      `Recent Movements (showing ${Math.min(50, movements.length)} of ${movements.length})`
    )
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ============================================================================
// PRODUCTION REPORT
// ============================================================================

export async function exportProductionReport(
  dateRange: { start: Date; end: Date }
): Promise<Buffer> {
  // Fetch production data
  const schedules = await prisma.productionSchedule.findMany({
    where: {
      startDate: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      product: true,
    },
    orderBy: { startDate: 'desc' },
  })

  const throughput = await prisma.throughputData.findMany({
    where: {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      product: true,
    },
    orderBy: { date: 'desc' },
  })

  // Calculate metrics
  const totalUnits = throughput.reduce((sum, t) => sum + t.unitsProduced, 0)
  const totalHours = throughput.reduce((sum, t) => sum + t.hoursWorked, 0)
  const avgEfficiency = throughput.length > 0
    ? throughput.reduce((sum, t) => sum + t.efficiency, 0) / throughput.length
    : 0
  const avgDefectRate = throughput.length > 0
    ? throughput.reduce((sum, t) => sum + t.defectRate, 0) / throughput.length
    : 0

  // Create PDF
  const doc = createPDF({
    title: 'Production Report',
    dateRange,
    orientation: 'landscape',
  })

  let yPos = addHeader(doc, {
    title: 'Production Report',
    dateRange,
  })

  // Summary
  yPos = addSummaryBox(doc, yPos, 'Production Summary', [
    { label: 'Total Units Produced', value: totalUnits.toLocaleString(), highlight: true },
    { label: 'Production Schedules', value: schedules.length.toString() },
    { label: 'Total Hours Worked', value: totalHours.toFixed(1) },
    { label: 'Average Efficiency', value: `${(avgEfficiency * 100).toFixed(1)}%` },
    { label: 'Average Defect Rate', value: `${(avgDefectRate * 100).toFixed(2)}%` },
  ])

  // Schedules table
  yPos += 5
  const scheduleData = schedules.map((schedule) => [
    schedule.scheduleId,
    schedule.product.name,
    schedule.unitsToProducePerDay.toString(),
    format(schedule.startDate, 'MMM d'),
    format(schedule.endDate, 'MMM d'),
    schedule.workstationId,
    schedule.status,
    schedule.actualUnitsProduced?.toString() || '-',
  ])

  yPos = addTable(
    doc,
    yPos,
    ['Schedule ID', 'Product', 'Units/Day', 'Start', 'End', 'Workstation', 'Status', 'Actual'],
    scheduleData,
    'Production Schedules'
  )

  // Throughput table
  if (throughput.length > 0) {
    doc.addPage()
    yPos = addHeader(doc, {
      title: 'Throughput Metrics',
      dateRange,
    })

    const throughputData = throughput.slice(0, 30).map((t) => [
      format(t.date, 'MMM d'),
      t.product.name,
      t.unitsProduced.toString(),
      t.hoursWorked.toFixed(1),
      (t.unitsProduced / t.hoursWorked).toFixed(1),
      `${(t.efficiency * 100).toFixed(1)}%`,
      `${(t.defectRate * 100).toFixed(2)}%`,
    ])

    addTable(
      doc,
      yPos,
      ['Date', 'Product', 'Units', 'Hours', 'Units/Hr', 'Efficiency', 'Defects'],
      throughputData,
      `Throughput Data (showing ${Math.min(30, throughput.length)} of ${throughput.length})`
    )
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ============================================================================
// FINANCIAL REPORT
// ============================================================================

export async function exportFinancialReport(
  dateRange: { start: Date; end: Date }
): Promise<Buffer> {
  // Fetch financial data
  const metrics = await prisma.financialMetrics.findMany({
    where: {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    orderBy: { date: 'desc' },
  })

  const bomItems = await prisma.bomItem.findMany()

  // Calculate summary
  const latestMetrics = metrics[0]
  const totalInventoryValue = latestMetrics?.totalInventoryValue || 0
  const wipValue = latestMetrics?.wipValue || 0
  const totalValue = bomItems.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  )

  // Create PDF
  const doc = createPDF({
    title: 'Financial Report',
    dateRange,
  })

  let yPos = addHeader(doc, {
    title: 'Financial Report',
    dateRange,
  })

  // Summary
  yPos = addSummaryBox(doc, yPos, 'Financial Summary', [
    { label: 'Current Inventory Value', value: `$${totalInventoryValue.toLocaleString()}`, highlight: true },
    { label: 'WIP Value', value: `$${wipValue.toLocaleString()}` },
    { label: 'Total Asset Value', value: `$${(totalInventoryValue + wipValue).toLocaleString()}`, highlight: true },
    { label: 'Snapshot Count', value: metrics.length.toString() },
  ])

  // Metrics table
  if (metrics.length > 0) {
    yPos += 5
    const metricsData = metrics.map((metric) => [
      format(metric.date, 'MMM d, yyyy'),
      `$${metric.totalInventoryValue.toLocaleString()}`,
      `$${metric.wipValue.toLocaleString()}`,
      `$${metric.finishedGoodsValue.toLocaleString()}`,
      `$${metric.totalMaterialCost.toLocaleString()}`,
      `$${metric.productionCostEst.toLocaleString()}`,
    ])

    addTable(
      doc,
      yPos,
      ['Date', 'Inventory', 'WIP', 'Finished Goods', 'Material Cost', 'Production Cost'],
      metricsData,
      'Financial Metrics'
    )
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create downloadable PDF blob
 */
export function createPDFBlob(buffer: Buffer): Blob {
  return new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })
}

/**
 * Trigger PDF download in browser
 */
export function downloadPDF(buffer: Buffer, filename: string): void {
  const blob = createPDFBlob(buffer)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
