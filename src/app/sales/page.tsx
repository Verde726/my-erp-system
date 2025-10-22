'use client'

/**
 * Sales Forecasts & Production Planning Page
 * Handles sales data import and production schedule generation
 */

import { useState } from 'react'
import { useSalesOrders, useGenerateSchedules, useSaveSchedules, useProductionSchedules, useUploadSales } from '@/hooks/useSales'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Upload, Play, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import type { ScheduleProposal, GenerationResult } from '@/hooks/useSales'

export default function SalesPage() {
  // Date range (default: next 90 days)
  const today = new Date()
  const ninetyDaysLater = new Date(today)
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90)

  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(ninetyDaysLater.toISOString().split('T')[0])

  // Filters
  const [priority, setPriority] = useState('all')
  const [status, setStatus] = useState('all')

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Generation options
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [workstationId, setWorkstationId] = useState('')
  const [shiftsPerDay, setShiftsPerDay] = useState(2)

  // Generation results
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Fetch data
  const { data: salesData, isLoading: salesLoading } = useSalesOrders({
    startDate,
    endDate,
    priority: priority === 'all' ? undefined : priority,
    status: status === 'all' ? undefined : status,
  })

  const { data: schedulesData } = useProductionSchedules({ startDate, endDate })

  const uploadMutation = useUploadSales()
  const generateMutation = useGenerateSchedules()
  const saveMutation = useSaveSchedules()

  const handleUpload = async () => {
    if (!uploadedFile) return

    try {
      await uploadMutation.mutateAsync(uploadedFile)
      setUploadModalOpen(false)
      setUploadedFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        startDate,
        endDate,
        priorityFilter: priorityFilter as any || undefined,
        workstationId: workstationId || undefined,
        shiftsPerDay,
        includeExistingSchedules: true,
      })

      setGenerationResult(result)
      setGenerateModalOpen(false)
      setPreviewModalOpen(true)
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  const handleSaveSchedules = async () => {
    if (!generationResult) return

    try {
      await saveMutation.mutateAsync(generationResult.proposals)
      setPreviewModalOpen(false)
      setGenerationResult(null)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const orders = salesData?.orders || []
  const summary = salesData?.summary || {}
  const schedules = schedulesData?.schedules || []

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Forecasts & Production Planning</h1>
          <p className="text-muted-foreground mt-1">
            Import sales data and generate optimal production schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Sales CSV
          </Button>
          <Button onClick={() => setGenerateModalOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            Generate Schedule
          </Button>
        </div>
      </div>

      {/* Date Range & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{summary.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalUnits || 0} units
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {summary.highPriorityCount || 0}
              </p>
              {summary.overdueCount > 0 && (
                <Badge variant="destructive" className="mt-1">
                  {summary.overdueCount} Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales orders found. Upload a CSV to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-right p-2">Units</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-sm">{order.orderId}</td>
                      <td className="p-2">
                        <div className="font-medium">{order.product.name}</div>
                        <div className="text-xs text-muted-foreground">{order.product.sku}</div>
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(order.forecastedUnits, 0)}
                      </td>
                      <td className="p-2">{formatDate(order.timePeriod)}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            order.priority === 'high'
                              ? 'destructive'
                              : order.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="capitalize">
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Schedules */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Production Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules.map((schedule: any) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{schedule.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(schedule.unitsToProducePerDay, 0)} units/day • {schedule.workstationId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                    </div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {schedule.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Sales Forecast CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
            />
            {uploadMutation.isSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm text-green-900 dark:text-green-100">
                  ✓ Upload successful: {uploadMutation.data.summary.created} created,{' '}
                  {uploadMutation.data.summary.updated} updated
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!uploadedFile || uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generation Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Production Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Priority Filter (Optional)</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="high">High priority only</SelectItem>
                  <SelectItem value="medium">Medium priority only</SelectItem>
                  <SelectItem value="low">Low priority only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Workstation (Optional)</label>
              <Input
                placeholder="e.g., WS-001"
                value={workstationId}
                onChange={(e) => setWorkstationId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Shifts per Day</label>
              <Select
                value={shiftsPerDay.toString()}
                onValueChange={(v) => setShiftsPerDay(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 shift (8 hours)</SelectItem>
                  <SelectItem value="2">2 shifts (16 hours)</SelectItem>
                  <SelectItem value="3">3 shifts (24 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Preview</DialogTitle>
          </DialogHeader>
          {generationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold">{generationResult.summary.totalProducts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Units</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(generationResult.summary.totalUnits, 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Avg Capacity</p>
                    <p className="text-2xl font-bold">
                      {(generationResult.summary.averageCapacityUtilization * 100).toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Conflicts */}
              {generationResult.conflicts.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({generationResult.conflicts.length})
                  </h3>
                  <div className="space-y-1">
                    {generationResult.conflicts.slice(0, 5).map((conflict, i) => (
                      <p key={i} className="text-sm">{conflict.message}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposals */}
              <div>
                <h3 className="font-semibold mb-2">Proposed Schedules</h3>
                <div className="space-y-2">
                  {generationResult.proposals.map((proposal, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{proposal.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.productSku} • {formatNumber(proposal.totalUnits, 0)} total units
                          </div>
                          <div className="text-sm mt-1">
                            {formatNumber(proposal.unitsToProducePerDay, 0)} units/day • {proposal.daysRequired} days • {proposal.workstationId}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {new Date(proposal.startDate).toLocaleDateString()} - {new Date(proposal.endDate).toLocaleDateString()}
                          </div>
                          <Badge
                            variant={
                              proposal.capacityUtilization > 0.9
                                ? 'destructive'
                                : proposal.capacityUtilization > 0.75
                                ? 'default'
                                : 'secondary'
                            }
                            className="mt-1"
                          >
                            {(proposal.capacityUtilization * 100).toFixed(0)}% capacity
                          </Badge>
                        </div>
                      </div>
                      {proposal.warnings.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-600">
                          ⚠ {proposal.warnings.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSchedules} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save All Schedules'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
