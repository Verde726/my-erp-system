'use client'

/**
 * Financial Dashboard Component
 *
 * Displays comprehensive financial metrics including:
 * - Inventory valuation
 * - WIP (Work in Progress) value
 * - Cost variance analysis
 * - Profitability metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinancialSnapshot, useInventoryValue } from '@/hooks/useFinancial'
import { DollarSign, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading = false,
}: {
  title: string
  value: string | number
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InventoryBreakdownChart({ data }: { data: Array<{ category: string; value: number }> }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ category, value, percent }) =>
            `${category}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function InventoryHealthChart({
  healthyValue,
  lowStockValue,
}: {
  healthyValue: number
  lowStockValue: number
}) {
  const data = [
    { name: 'Healthy Stock', value: healthyValue, fill: '#00C49F' },
    { name: 'Low Stock', value: lowStockValue, fill: '#FF8042' },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Bar dataKey="value" fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinancialDashboard() {
  const { data: snapshot, isLoading: snapshotLoading, error: snapshotError } = useFinancialSnapshot()
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useInventoryValue(true)

  // Extract data with safe fallbacks
  const totalInventoryValue = snapshot?.data?.totalInventoryValue ?? 0
  const wipValue = snapshot?.data?.wipValue ?? 0
  const finishedGoodsValue = snapshot?.data?.finishedGoodsValue ?? 0
  const totalMaterialCost = snapshot?.data?.totalMaterialCost ?? 0
  const productionCostEst = snapshot?.data?.productionCostEst ?? 0

  const inventoryByCategory = inventoryData?.data?.inventory?.byCategory ?? []
  const lowStockValue = inventoryData?.data?.inventory?.lowStockValue ?? 0
  const lowStockCount = inventoryData?.data?.inventory?.lowStockCount ?? 0
  const healthyStockValue = inventoryData?.data?.inventory?.healthyStockValue ?? 0

  const totalAssets = totalInventoryValue + wipValue + finishedGoodsValue

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
        <p className="text-muted-foreground">
          Real-time financial metrics and inventory valuation
        </p>
      </div>

      {/* Error States */}
      {(snapshotError || inventoryError) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              {snapshotError && `Snapshot: ${(snapshotError as Error).message}`}
              {inventoryError && `Inventory: ${(inventoryError as Error).message}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          icon={DollarSign}
          description="Inventory + WIP + Finished Goods"
          loading={snapshotLoading}
        />
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(totalInventoryValue)}
          icon={Package}
          description="Raw materials & components"
          loading={snapshotLoading}
        />
        <MetricCard
          title="WIP Value"
          value={formatCurrency(wipValue)}
          icon={TrendingUp}
          description="Work in progress"
          loading={snapshotLoading}
        />
        <MetricCard
          title="Production Cost Est."
          value={formatCurrency(productionCostEst)}
          icon={DollarSign}
          description="Estimated production costs"
          loading={snapshotLoading}
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Inventory Breakdown</TabsTrigger>
          <TabsTrigger value="health">Inventory Health</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Inventory Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value by Category</CardTitle>
              <CardDescription>
                Distribution of inventory value across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : (
                <InventoryBreakdownChart data={inventoryByCategory} />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryByCategory.map((cat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatCurrency(cat.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          {cat.itemCount} items
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Material Cost</span>
                  <span className="text-sm font-bold">{formatCurrency(totalMaterialCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Finished Goods Value</span>
                  <span className="text-sm font-bold">{formatCurrency(finishedGoodsValue)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total Value</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(totalMaterialCost + finishedGoodsValue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Health Overview</CardTitle>
              <CardDescription>
                Comparison of healthy vs low stock inventory value
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : (
                <InventoryHealthChart
                  healthyValue={healthyStockValue}
                  lowStockValue={lowStockValue}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Healthy Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(healthyStockValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Above reorder point</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {formatCurrency(lowStockValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockCount} items need reorder
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalInventoryValue > 0
                    ? `${((healthyStockValue / totalInventoryValue) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Inventory health score</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                Complete overview of financial metrics
                {snapshot?.source === 'calculated' && ' (Real-time calculation)'}
                {snapshot?.source === 'database' && ' (From database snapshot)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                    <p className="text-xl font-bold">{formatCurrency(totalAssets)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Inventory</p>
                    <p className="text-xl font-bold">{formatCurrency(totalInventoryValue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">WIP Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(wipValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finished Goods</p>
                    <p className="text-lg font-semibold">{formatCurrency(finishedGoodsValue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Material Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalMaterialCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Production Cost Est.</p>
                    <p className="text-lg font-semibold">{formatCurrency(productionCostEst)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Source Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Source:</span>
                  <span className="font-medium capitalize">{snapshot?.source ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Snapshot Date:</span>
                  <span className="font-medium">
                    {snapshot?.date ? new Date(snapshot.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {snapshot?.note && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                    {snapshot.note}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
