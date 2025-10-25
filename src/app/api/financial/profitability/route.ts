/**
 * API Route: GET /api/financial/profitability
 *
 * Analyze product profitability based on costs and selling price
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateProductProfitability } from '@/lib/financial-calculator'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const sellingPrice = searchParams.get('sellingPrice')

    if (!productId || !sellingPrice) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['productId', 'sellingPrice'],
        },
        { status: 400 }
      )
    }

    const price = parseFloat(sellingPrice)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid selling price',
          message: 'Selling price must be a positive number',
        },
        { status: 400 }
      )
    }

    const analysis = await calculateProductProfitability(productId, price)

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error: any) {
    console.error('Error calculating profitability:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate profitability',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
