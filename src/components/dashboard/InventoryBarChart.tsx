'use client'

/**
 * Inventory Bar Chart Component
 *
 * Horizontal bar chart showing critical inventory items with
 * current stock, reorder points, and status indicators
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryItem {
  partNumber: string
  description: string
  currentStock: number
  reorderPoint: number
  safetyStock: number
  status: 'critical' | 'low' | 'healthy'
}

export interface InventoryBarChartProps {
  items: InventoryItem[]
  loading?: boolean
  maxItems?: number
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusColor(status: string): string {
  switch (status) {
    case 'critical':
      return '#ef4444'
    case 'low':
      return '#f59e0b'
    case 'healthy':
      return '#10b981'
    default:
      return '#94a3b8'
  }
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'critical':
      return 'destructive'
    case 'low':
      return 'outline'
    case 'healthy':
      return 'secondary'
    default:
      return 'default'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InventoryBarChart({
  items,
  loading = false,
  maxItems = 10,
}: InventoryBarChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by status (critical first) and take top items
  const sortedItems = [...items]
    .sort((a, b) => {
      const statusOrder = { critical: 0, low: 1, healthy: 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    })
    .slice(0, maxItems)

  const criticalCount = items.filter((item) => item.status === 'critical').length
  const lowCount = items.filter((item) => item.status === 'low').length

  // Prepare chart data
  const chartData = sortedItems.map((item) => ({
    name: item.partNumber,
    description: item.description,
    stock: item.currentStock,
    reorder: item.reorderPoint,
    safety: item.safetyStock,
    status: item.status,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Status
            </CardTitle>
            <CardDescription>Top {maxItems} critical items</CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {criticalCount} Critical
              </Badge>
            )}
            {lowCount > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                {lowCount} Low
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No inventory items to display
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{
                    value: 'Quantity',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: 'hsl(var(--muted-foreground))' },
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === 'stock') {
                      return [
                        `${value} units`,
                        `Current Stock (${props.payload.description})`,
                      ]
                    }
                    if (name === 'reorder') {
                      return [`${value} units`, 'Reorder Point']
                    }
                    return [value, name]
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />

                {/* Current Stock Bars */}
                <Bar dataKey="stock" name="Current Stock" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Bar>

                {/* Reorder Point Reference Lines */}
                {chartData.map((item, index) => (
                  <ReferenceLine
                    key={`reorder-${index}`}
                    x={item.reorder}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    ifOverflow="extendDomain"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>

            {/* Item Details List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Item Details</h4>
              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <div
                    key={item.partNumber}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.partNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: getStatusColor(item.status) }}
                        >
                          {item.currentStock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Reorder</p>
                        <p className="text-sm font-semibold">{item.reorderPoint}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-4 border-t text-xs">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Critical (below reorder)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Low (near reorder)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Healthy</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
