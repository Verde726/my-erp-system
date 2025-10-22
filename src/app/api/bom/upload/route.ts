/**
 * BOM Upload API
 * POST /api/bom/upload - Upload and process BOM CSV file
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'

// Validation schema for BOM uploads
const BomUploadSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  description: z.string().min(1, 'Description is required'),
  quantityPerUnit: z.number().positive('Quantity per unit must be positive'),
  currentStock: z.number().nonnegative('Current stock cannot be negative'),
  unitCost: z.number().positive('Unit cost must be positive'),
  supplier: z.string().min(1, 'Supplier is required'),
  reorderPoint: z.number().nonnegative('Reorder point cannot be negative'),
  leadTimeDays: z.number().int().positive('Lead time must be a positive integer'),
  category: z.string().min(1, 'Category is required'),
  safetyStock: z.number().nonnegative('Safety stock cannot be negative').optional().default(0),
})

type BomUploadData = z.infer<typeof BomUploadSchema>

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
    const parseResult = await parseCSV(file, BomUploadSchema, {
      maxFileSizeMB: 10,
      skipEmptyLines: true,
    })

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
      errors: [] as Array<{ row: number; partNumber: string; error: string }>,
    }

    for (const item of parseResult.data) {
      try {
        // Attempt to upsert (update if exists, create if not)
        await prisma.bomItem.upsert({
          where: { partNumber: item.partNumber },
          update: {
            description: item.description,
            quantityPerUnit: item.quantityPerUnit,
            currentStock: item.currentStock,
            unitCost: item.unitCost,
            supplier: item.supplier,
            reorderPoint: item.reorderPoint,
            leadTimeDays: item.leadTimeDays,
            category: item.category,
            safetyStock: item.safetyStock || 0,
          },
          create: {
            partNumber: item.partNumber,
            description: item.description,
            quantityPerUnit: item.quantityPerUnit,
            currentStock: item.currentStock,
            unitCost: item.unitCost,
            supplier: item.supplier,
            reorderPoint: item.reorderPoint,
            leadTimeDays: item.leadTimeDays,
            category: item.category,
            safetyStock: item.safetyStock || 0,
          },
        })

        // Check if it was a new record or update
        const existing = await prisma.bomItem.findUnique({
          where: { partNumber: item.partNumber },
          select: { createdAt: true, updatedAt: true },
        })

        if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
          results.created++
        } else {
          results.updated++
        }
      } catch (error: any) {
        results.errors.push({
          row: parseResult.data.indexOf(item) + 1,
          partNumber: item.partNumber,
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
        errors: results.errors.length,
      },
      parseErrors: parseResult.errors,
      processingErrors: results.errors,
    })
  } catch (error) {
    console.error('Error processing BOM upload:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
