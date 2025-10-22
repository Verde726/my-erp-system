/**
 * Sales Orders Upload API
 * POST /api/sales/upload - Upload sales forecast CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'

const SalesUploadSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  productSku: z.string().min(1, 'Product SKU is required'),
  forecastedUnits: z.number().positive('Forecasted units must be positive'),
  date: z.coerce.date(),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  customerSegment: z.string().optional(),
  status: z.string().optional().default('pending'),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse CSV
    const parseResult = await parseCSV(file, SalesUploadSchema)

    if (parseResult.summary.invalidRows > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.errors,
          summary: parseResult.summary,
        },
        { status: 400 }
      )
    }

    // Process valid rows
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; orderId: string; error: string }>,
    }

    for (const item of parseResult.data) {
      try {
        // Find product by SKU
        const product = await prisma.product.findUnique({
          where: { sku: item.productSku },
          select: { id: true },
        })

        if (!product) {
          results.errors.push({
            row: parseResult.data.indexOf(item) + 1,
            orderId: item.orderId,
            error: `Product SKU ${item.productSku} not found`,
          })
          results.skipped++
          continue
        }

        // Upsert sales order
        await prisma.salesOrder.upsert({
          where: { orderId: item.orderId },
          update: {
            productId: product.id,
            forecastedUnits: item.forecastedUnits,
            timePeriod: item.date,
            priority: item.priority,
            customerSegment: item.customerSegment || null,
            status: item.status || 'pending',
          },
          create: {
            orderId: item.orderId,
            productId: product.id,
            forecastedUnits: item.forecastedUnits,
            timePeriod: item.date,
            priority: item.priority,
            customerSegment: item.customerSegment || null,
            status: item.status || 'pending',
          },
        })

        // Check if it was created or updated
        const existing = await prisma.salesOrder.findUnique({
          where: { orderId: item.orderId },
          select: { createdAt: true },
        })

        const justCreated =
          existing && new Date().getTime() - existing.createdAt.getTime() < 1000

        if (justCreated) {
          results.created++
        } else {
          results.updated++
        }
      } catch (error: any) {
        results.errors.push({
          row: parseResult.data.indexOf(item) + 1,
          orderId: item.orderId,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: parseResult.summary.totalRows,
        validRows: parseResult.summary.validRows,
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
      },
      parseErrors: parseResult.errors,
      processingErrors: results.errors,
    })
  } catch (error) {
    console.error('Error processing sales upload:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
