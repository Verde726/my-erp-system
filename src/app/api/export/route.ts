/**
 * API Route: /api/export
 *
 * GET - Export reports in various formats (PDF, CSV, Excel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
import { exportInventoryReport, exportProductionReport, exportFinancialReport } from '@/lib/exporters/pdf-exporter'
import { exportToCSV, BOM_INVENTORY_COLUMNS, PRODUCTION_SCHEDULE_COLUMNS, FINANCIAL_METRICS_COLUMNS } from '@/lib/exporters/csv-exporter'
import { exportToExcel } from '@/lib/exporters/excel-exporter'
import { prisma } from '@/lib/db'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ExportQuerySchema = z.object({
  type: z.enum(['inventory', 'production', 'financial', 'custom']),
  format: z.enum(['pdf', 'csv', 'xlsx']),
  startDate: z.string(),
  endDate: z.string(),
  options: z.string().optional(),
})

// ============================================================================
// GET HANDLER - Export Reports
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const params = ExportQuerySchema.parse({
      type: searchParams.get('type'),
      format: searchParams.get('format'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      options: searchParams.get('options'),
    })

    const dateRange = {
      start: new Date(params.startDate),
      end: new Date(params.endDate),
    }

    const options = params.options ? JSON.parse(params.options) : {}

    let buffer: Buffer
    let filename: string
    let contentType: string

    // Generate export based on type and format
    switch (params.type) {
      case 'inventory':
        if (params.format === 'pdf') {
          buffer = await exportInventoryReport(dateRange, options)
          filename = `inventory_report_${params.startDate}_${params.endDate}.pdf`
          contentType = 'application/pdf'
        } else if (params.format === 'csv') {
          filename = `inventory_export_${params.startDate}_${params.endDate}.csv`
          const bomItems = await prisma.bomItem.findMany()
          const csvString = await exportToCSV(bomItems, BOM_INVENTORY_COLUMNS, filename)
          buffer = Buffer.from(csvString, 'utf-8')
          contentType = 'text/csv'
        } else {
          // Excel
          filename = `inventory_export_${params.startDate}_${params.endDate}.xlsx`
          const bomItems = await prisma.bomItem.findMany()
          const movements = await prisma.inventoryMovement.findMany({
            where: {
              timestamp: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          })
          buffer = await exportToExcel(
            {
              Inventory: bomItems,
              Movements: movements,
            },
            filename
          )
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        break

      case 'production':
        if (params.format === 'pdf') {
          buffer = await exportProductionReport(dateRange)
          filename = `production_report_${params.startDate}_${params.endDate}.pdf`
          contentType = 'application/pdf'
        } else if (params.format === 'csv') {
          filename = `production_export_${params.startDate}_${params.endDate}.csv`
          const schedules = await prisma.productionSchedule.findMany({
            where: {
              startDate: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            include: { product: true },
          })
          const csvString = await exportToCSV(schedules, PRODUCTION_SCHEDULE_COLUMNS, filename)
          buffer = Buffer.from(csvString, 'utf-8')
          contentType = 'text/csv'
        } else {
          // Excel
          filename = `production_export_${params.startDate}_${params.endDate}.xlsx`
          const schedules = await prisma.productionSchedule.findMany({
            where: {
              startDate: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            include: { product: true },
          })
          const throughput = await prisma.throughputData.findMany({
            where: {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            include: { product: true },
          })
          buffer = await exportToExcel(
            {
              Schedules: schedules,
              Throughput: throughput,
            },
            filename
          )
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        break

      case 'financial':
        if (params.format === 'pdf') {
          buffer = await exportFinancialReport(dateRange)
          filename = `financial_report_${params.startDate}_${params.endDate}.pdf`
          contentType = 'application/pdf'
        } else if (params.format === 'csv') {
          filename = `financial_export_${params.startDate}_${params.endDate}.csv`
          const metrics = await prisma.financialMetrics.findMany({
            where: {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          })
          const csvString = await exportToCSV(metrics, FINANCIAL_METRICS_COLUMNS, filename)
          buffer = Buffer.from(csvString, 'utf-8')
          contentType = 'text/csv'
        } else {
          // Excel
          filename = `financial_export_${params.startDate}_${params.endDate}.xlsx`
          const metrics = await prisma.financialMetrics.findMany({
            where: {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          })
          const bomItems = await prisma.bomItem.findMany()
          buffer = await exportToExcel(
            {
              Metrics: metrics,
              Inventory: bomItems,
            },
            filename
          )
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        break

      default:
        return NextResponse.json(
          {
            error: 'Invalid export type',
            validTypes: ['inventory', 'production', 'financial'],
          },
          { status: 400 }
        )
    }

    // Return file as download
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          issues: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error generating export:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate export',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
