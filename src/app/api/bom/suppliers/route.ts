/**
 * BOM Suppliers API
 * GET /api/bom/suppliers - Get list of unique suppliers
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const suppliers = await prisma.bomItem.findMany({
      select: {
        supplier: true,
      },
      distinct: ['supplier'],
      orderBy: {
        supplier: 'asc',
      },
    })

    return NextResponse.json(suppliers.map((s) => s.supplier))
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
