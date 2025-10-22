'use client'

/**
 * Throughput Chart Component
 *
 * Line chart comparing actual vs planned production with variance indicators
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { format } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface ThroughputDataPoint {
  date: Date
  actual: number
  planned: number
}

export interface ThroughputChartProps {
  data: ThroughputDataPoint[]
  loading?: boolean
  daysToShow?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ThroughputChart({
  data,
  loading = false,
  daysToShow = 30,
}: ThroughputChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Calculate stats
  const totalActual = data.reduce((sum, d) => sum + d.actual, 0)
  const totalPlanned = data.reduce((sum, d) => sum + d.planned, 0)
  const avgActual = totalActual / data.length
  const avgPlanned = totalPlanned / data.length
  const variance = ((totalActual - totalPlanned) / totalPlanned) * 100
  const isOverPerforming = variance > 0

  // Format data for chart
  const chartData = data.map((d) => ({
    date: format(d.date, 'MMM d'),
    actual: d.actual,
    planned: d.planned,
    upperBound: d.planned * 1.1, // +10% variance
    lowerBound: d.planned * 0.9, // -10% variance
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isOverPerforming ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Throughput Trends
            </CardTitle>
            <CardDescription>
              Last {daysToShow} days - Actual vs Planned Production
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p
              className={`text-2xl font-bold ${
                isOverPerforming ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {variance > 0 ? '+' : ''}
              {variance.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No throughput data available for the selected period
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="varianceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{
                    value: 'Units',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />

                {/* Variance area (±10%) */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="url(#varianceArea)"
                  fillOpacity={1}
                  name="±10% Variance"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="url(#varianceArea)"
                  fillOpacity={1}
                />

                {/* Planned line (dashed) */}
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Planned"
                />

                {/* Actual line (solid) */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Actual"
                />

                {/* Average reference line */}
                <ReferenceLine
                  y={avgPlanned}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Avg Planned',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Avg Actual</p>
                <p className="text-lg font-semibold text-green-600">
                  {avgActual.toFixed(0)} units/day
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Planned</p>
                <p className="text-lg font-semibold">{avgPlanned.toFixed(0)} units/day</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Variance</p>
                <p
                  className={`text-lg font-semibold ${
                    isOverPerforming ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(totalActual - totalPlanned).toFixed(0)} units
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
