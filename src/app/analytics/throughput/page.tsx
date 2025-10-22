'use client'

/**
 * Production Throughput Analytics Dashboard
 *
 * Interactive dashboard for analyzing production performance, capacity planning,
 * and identifying bottlenecks
 */

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ErrorBar,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Download,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ThroughputMetrics {
  productId: string
  productName: string
  productSku: string
  dateRange: { start: string; end: string }
  totalUnitsProduced: number
  totalHoursWorked: number
  totalDataPoints: number
  averageUnitsPerHour: number
  averageUnitsPerDay: number
  averageEfficiency: number
  averageDefectRate: number
  standardDeviation: number
  efficiencyTrend: 'improving' | 'declining' | 'stable'
  efficiencyChange: number
  defectRateTrend: 'improving' | 'declining' | 'stable'
  defectRateChange: number
  qualityRate: number
  workstationMetrics: Array<{
    workstationId: string
    unitsProduced: number
    hoursWorked: number
    efficiency: number
    defectRate: number
  }>
}

interface CapacityPrediction {
  productName: string
  predictionDays: number
  predictedDailyCapacity: number
  predictedTotalCapacity: number
  confidenceLower: number
  confidenceUpper: number
  trendDirection: 'increasing' | 'decreasing' | 'stable'
  warnings: string[]
}

interface BottleneckWarning {
  scheduleId: string
  productName: string
  workstationId: string
  plannedDailyRate: number
  historicalDailyRate: number
  capacityExceeded: number
  shortfall: number
  severity: 'critical' | 'warning' | 'info'
  recommendations: string[]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ThroughputAnalyticsPage() {
  // State
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const [metrics, setMetrics] = useState<ThroughputMetrics | null>(null)
  const [prediction, setPrediction] = useState<CapacityPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Load analytics when product/dates change
  useEffect(() => {
    if (selectedProduct) {
      fetchAnalytics()
    }
  }, [selectedProduct, dateRange])

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
        if (data.length > 0) {
          setSelectedProduct(data[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchAnalytics = async () => {
    if (!selectedProduct) return

    setLoading(true)
    setError(null)

    try {
      // Fetch throughput metrics
      const metricsRes = await fetch(
        `/api/analytics/throughput?analysisType=metrics&productId=${selectedProduct}&startDate=${dateRange.start}&endDate=${dateRange.end}`
      )

      if (!metricsRes.ok) {
        throw new Error('Failed to fetch throughput metrics')
      }

      const metricsData = await metricsRes.json()
      setMetrics(metricsData.data)

      // Fetch capacity prediction
      const predictionRes = await fetch(
        `/api/analytics/throughput?analysisType=prediction&productId=${selectedProduct}&futureDays=30`
      )

      if (predictionRes.ok) {
        const predictionData = await predictionRes.json()
        setPrediction(predictionData.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-500" />
    if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-500" />
    return <Minus className="h-5 w-5 text-gray-500" />
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatNumber = (value: number) => value.toFixed(1)

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Throughput Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analyze production performance and plan capacity
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Product</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      {metrics && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Units/Hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.averageUnitsPerHour)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Units/Day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.averageUnitsPerDay)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Efficiency Trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metrics.efficiencyTrend)}
                  <span className="text-2xl font-bold">
                    {formatPercentage(metrics.averageEfficiency)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.efficiencyChange > 0 ? '+' : ''}
                  {formatNumber(metrics.efficiencyChange)}% vs earlier period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Quality Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {formatPercentage(metrics.qualityRate)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Defect rate: {formatPercentage(metrics.averageDefectRate)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Production Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Production Summary</CardTitle>
              <CardDescription>
                {metrics.productName} ({metrics.productSku})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-lg font-semibold">
                    {metrics.totalUnitsProduced.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(metrics.totalHoursWorked)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Std Deviation</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(metrics.standardDeviation)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                  <p className="text-lg font-semibold">
                    {metrics.totalDataPoints}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Prediction */}
          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle>30-Day Capacity Prediction</CardTitle>
                <CardDescription>
                  Based on exponential moving average of recent throughput
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Predicted Daily Capacity
                      </p>
                      <p className="text-2xl font-bold">
                        {formatNumber(prediction.predictedDailyCapacity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        units/day
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Capacity
                      </p>
                      <p className="text-2xl font-bold">
                        {formatNumber(prediction.predictedTotalCapacity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        units in {prediction.predictionDays} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Confidence Range
                      </p>
                      <p className="text-lg font-semibold">
                        {formatNumber(prediction.confidenceLower)} -{' '}
                        {formatNumber(prediction.confidenceUpper)}
                      </p>
                      <p className="text-xs text-muted-foreground">±10%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTrendIcon(
                          prediction.trendDirection === 'increasing'
                            ? 'improving'
                            : prediction.trendDirection === 'decreasing'
                            ? 'declining'
                            : 'stable'
                        )}
                        <span className="text-lg font-semibold capitalize">
                          {prediction.trendDirection}
                        </span>
                      </div>
                    </div>
                  </div>

                  {prediction.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Prediction Warnings</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {prediction.warnings.map((warning, i) => (
                            <li key={i} className="text-sm">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Capacity Chart */}
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            name: 'Predicted',
                            capacity: prediction.predictedDailyCapacity,
                            error: [
                              prediction.predictedDailyCapacity -
                                prediction.confidenceLower,
                              prediction.confidenceUpper -
                                prediction.predictedDailyCapacity,
                            ],
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine
                          y={metrics.averageUnitsPerDay}
                          stroke="#666"
                          strokeDasharray="3 3"
                          label="Current Avg"
                        />
                        <Bar dataKey="capacity" fill="#3b82f6">
                          <ErrorBar dataKey="error" width={4} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workstation Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Workstation Performance</CardTitle>
              <CardDescription>
                Compare efficiency across workstations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workstation</TableHead>
                    <TableHead className="text-right">Units Produced</TableHead>
                    <TableHead className="text-right">Hours Worked</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                    <TableHead className="text-right">Defect Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.workstationMetrics
                    .sort((a, b) => b.efficiency - a.efficiency)
                    .map((ws) => (
                      <TableRow key={ws.workstationId}>
                        <TableCell className="font-medium">
                          {ws.workstationId}
                        </TableCell>
                        <TableCell className="text-right">
                          {ws.unitsProduced.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(ws.hoursWorked)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              ws.efficiency >= 0.85
                                ? 'text-green-600 font-semibold'
                                : ws.efficiency >= 0.7
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }
                          >
                            {formatPercentage(ws.efficiency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(ws.defectRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
