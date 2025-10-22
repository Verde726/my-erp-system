'use client'

/**
 * Material Requirements Planning (MRP) Page
 * Calculate and display material requirements for production schedules
 */

import { useState } from 'react'
import { useProductionSchedules } from '@/hooks/useSales'
import { useCalculateMRP, useCreateMaterialRequirements, type MRPCalculationResult } from '@/hooks/useMRP'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle, Package, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'

export default function MRPPage() {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [mrpResult, setMrpResult] = useState<MRPCalculationResult | null>(null)

  // Fetch schedules
  const { data: schedulesData } = useProductionSchedules({
    status: 'planned',
  })

  const calculateMutation = useCalculateMRP()
  const createMutation = useCreateMaterialRequirements()

  const schedules = schedulesData?.schedules || []

  const handleCalculate = async () => {
    if (!selectedScheduleId) return

    try {
      const result = await calculateMutation.mutateAsync(selectedScheduleId)
      setMrpResult(result)
    } catch (error) {
      console.error('MRP calculation failed:', error)
    }
  }

  const handleCreate = async () => {
    if (!selectedScheduleId) return

    try {
      await createMutation.mutateAsync(selectedScheduleId)
      alert('Material requirements created successfully!')
    } catch (error) {
      console.error('Material requirements creation failed:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Material Requirements Planning (MRP)</h1>
        <p className="text-muted-foreground mt-1">
          Calculate material needs for production schedules
        </p>
      </div>

      {/* Schedule Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Select Production Schedule
              </label>
              <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a schedule..." />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule: any) => (
                    <SelectItem key={schedule.scheduleId} value={schedule.scheduleId}>
                      {schedule.product.name} ({schedule.scheduleId}) - {formatDate(schedule.startDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCalculate}
              disabled={!selectedScheduleId || calculateMutation.isPending}
            >
              {calculateMutation.isPending ? 'Calculating...' : 'Calculate MRP'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {calculateMutation.isError && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {calculateMutation.error?.message || 'Failed to calculate MRP'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {mrpResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Components</p>
                    <p className="text-2xl font-bold mt-1">
                      {mrpResult.summary.totalComponents}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sufficient Stock</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {mrpResult.summary.sufficientCount}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Shortages</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-600">
                      {mrpResult.summary.shortageCount}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {mrpResult.summary.criticalCount}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Cost */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Material Cost</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(mrpResult.summary.totalCost)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Urgent Actions */}
          {mrpResult.summary.urgentActions.length > 0 && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                  <AlertTriangle className="h-5 w-5" />
                  Urgent Actions Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mrpResult.summary.urgentActions.map((action, i) => (
                    <li key={i} className="flex items-center gap-2 text-red-900 dark:text-red-100">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Material Requirements Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Material Requirements</CardTitle>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Requirements'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Part Number</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Required</th>
                      <th className="text-right p-2">Available</th>
                      <th className="text-right p-2">Net Need</th>
                      <th className="text-right p-2">Order Qty</th>
                      <th className="text-left p-2">Order Date</th>
                      <th className="text-right p-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mrpResult.results.map((result) => (
                      <tr
                        key={result.partNumber}
                        className={cn(
                          'border-b hover:bg-muted/50',
                          result.status === 'critical' && 'bg-red-50 dark:bg-red-950',
                          result.status === 'shortage' && 'bg-yellow-50 dark:bg-yellow-950'
                        )}
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'h-3 w-3 rounded-full',
                                result.status === 'sufficient' && 'bg-green-500',
                                result.status === 'shortage' && 'bg-yellow-500',
                                result.status === 'critical' && 'bg-red-500'
                              )}
                            />
                            {result.orderDateInPast && (
                              <span title="Order date in past">
                                <Clock className="h-4 w-4 text-red-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-mono text-sm font-medium">
                            {result.partNumber}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="max-w-xs truncate">{result.description}</div>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {formatNumber(result.grossRequirement, 0)}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {formatNumber(result.availableStock, 0)}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          <span
                            className={cn(
                              'font-medium',
                              result.netRequirement > 0 && 'text-red-600'
                            )}
                          >
                            {formatNumber(result.netRequirement, 0)}
                          </span>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {formatNumber(result.plannedOrderQuantity, 0)}
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {formatDate(result.plannedOrderDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.leadTimeDays}d lead
                          </div>
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {formatCurrency(result.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recommendations */}
              <div className="mt-6 space-y-4">
                {mrpResult.results
                  .filter((r) => r.recommendations.length > 0 || r.warnings.length > 0)
                  .map((result) => (
                    <Card key={result.partNumber} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="font-medium mb-2">
                          {result.partNumber} - {result.description}
                        </div>
                        {result.warnings.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-yellow-600 mb-1">
                              Warnings:
                            </p>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                              {result.warnings.map((warning, i) => (
                                <li key={i}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">
                              Recommendations:
                            </p>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                              {result.recommendations.map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
