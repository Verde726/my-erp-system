'use client'

/**
 * Export Modal Component
 *
 * Reusable modal for exporting reports in various formats
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { format as formatDate, subDays } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportConfig {
  type: 'inventory' | 'production' | 'financial'
  format: 'pdf' | 'csv' | 'xlsx'
  startDate: string
  endDate: string
  options?: Record<string, boolean>
}

export interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportTypes?: Array<{ value: string; label: string }>
  onExport?: (config: ExportConfig) => Promise<void>
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_REPORT_TYPES = [
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'production', label: 'Production Report' },
  { value: 'financial', label: 'Financial Report' },
]

const FORMATS = [
  { value: 'pdf', label: 'PDF Report', icon: FileText },
  { value: 'xlsx', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV Data', icon: File },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function ExportModal({
  open,
  onOpenChange,
  reportTypes = DEFAULT_REPORT_TYPES,
  onExport,
}: ExportModalProps) {
  const [reportType, setReportType] = useState<string>('inventory')
  const [format, setFormat] = useState<string>('pdf')
  const [dateRange, setDateRange] = useState<string>('30days')
  const [options, setOptions] = useState<Record<string, boolean>>({
    includeMovements: true,
    groupByCategory: true,
  })
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)

    try {
      // Calculate dates based on range
      const endDate = new Date()
      let startDate = new Date()

      switch (dateRange) {
        case '7days':
          startDate = subDays(endDate, 7)
          break
        case '30days':
          startDate = subDays(endDate, 30)
          break
        case '90days':
          startDate = subDays(endDate, 90)
          break
        case 'ytd':
          startDate = new Date(endDate.getFullYear(), 0, 1)
          break
        default:
          startDate = subDays(endDate, 30)
      }

      const config: ExportConfig = {
        type: reportType as 'inventory' | 'production' | 'financial',
        format: format as 'pdf' | 'csv' | 'xlsx',
        startDate: formatDate(startDate, 'yyyy-MM-dd'),
        endDate: formatDate(endDate, 'yyyy-MM-dd'),
        options,
      }

      if (onExport) {
        await onExport(config)
      } else {
        // Default export via API
        await defaultExport(config)
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const defaultExport = async (config: ExportConfig) => {
    const params = new URLSearchParams({
      type: config.type,
      format: config.format,
      startDate: config.startDate,
      endDate: config.endDate,
      options: JSON.stringify(config.options),
    })

    const response = await fetch(`/api/export?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Download file
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/)
    const filename = filenameMatch ? filenameMatch[1] : `export_${config.type}_${config.format}`

    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose report type, format, and date range for export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((fmt) => (
                <Button
                  key={fmt.value}
                  variant={format === fmt.value ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setFormat(fmt.value)}
                >
                  <fmt.icon className="h-6 w-6 mb-1" />
                  <span className="text-xs">{fmt.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          {reportType === 'inventory' && (
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMovements"
                  checked={options.includeMovements}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeMovements: checked as boolean })
                  }
                />
                <label
                  htmlFor="includeMovements"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include inventory movements
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByCategory"
                  checked={options.groupByCategory}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, groupByCategory: checked as boolean })
                  }
                />
                <label
                  htmlFor="groupByCategory"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Group by category
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              'Exporting...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
