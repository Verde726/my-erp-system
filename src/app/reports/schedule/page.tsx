'use client'

/**
 * Scheduled Reports Management Page
 *
 * UI for managing and triggering scheduled reports
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Clock,
  Download,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledReport {
  id: string
  name: string
  type: 'inventory' | 'production' | 'financial'
  format: 'pdf' | 'xlsx'
  schedule: string
  description: string
  enabled: boolean
  nextRun: string
  lastRun?: string
  recipients: string[]
}

interface TriggerResult {
  success: boolean
  message: string
  filename?: string
}

// ============================================================================
// MOCK DATA
// ============================================================================

const scheduledReports: ScheduledReport[] = [
  {
    id: 'weekly_inventory',
    name: 'Weekly Inventory Report',
    type: 'inventory',
    format: 'pdf',
    schedule: 'Every Monday at 9:00 AM',
    description: 'Comprehensive inventory status with movements, grouped by category',
    enabled: true,
    nextRun: 'Mon, Jan 27, 2025 at 9:00 AM',
    lastRun: 'Mon, Jan 20, 2025 at 9:00 AM',
    recipients: ['operations@company.com', 'inventory@company.com'],
  },
  {
    id: 'monthly_financial',
    name: 'Monthly Financial Report',
    type: 'financial',
    format: 'pdf',
    schedule: '1st of each month at 9:00 AM',
    description: 'Financial metrics, inventory valuation, and cost variance analysis',
    enabled: true,
    nextRun: 'Sat, Feb 1, 2025 at 9:00 AM',
    lastRun: 'Wed, Jan 1, 2025 at 9:00 AM',
    recipients: ['finance@company.com', 'cfo@company.com'],
  },
  {
    id: 'daily_production',
    name: 'Daily Production Summary',
    type: 'production',
    format: 'pdf',
    schedule: 'Every day at 6:00 PM',
    description: 'Production schedules, throughput metrics, and resource utilization',
    enabled: true,
    nextRun: 'Today at 6:00 PM',
    lastRun: 'Yesterday at 6:00 PM',
    recipients: ['production@company.com', 'operations@company.com'],
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduledReportsPage() {
  const [reports] = useState<ScheduledReport[]>(scheduledReports)
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  const handleTriggerReport = async (reportId: string) => {
    setTriggering(reportId)
    setTriggerResult(null)

    try {
      // Call API to trigger report
      const response = await fetch('/api/reports/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: reportId }),
      })

      const result = await response.json()

      if (response.ok) {
        setTriggerResult({
          success: true,
          message: `Report "${reports.find(r => r.id === reportId)?.name}" generated successfully!`,
          filename: result.filename,
        })
      } else {
        setTriggerResult({
          success: false,
          message: result.error || 'Failed to generate report',
        })
      }
    } catch (error: any) {
      setTriggerResult({
        success: false,
        message: error.message || 'Network error',
      })
    } finally {
      setTriggering(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return '📦'
      case 'production':
        return '🏭'
      case 'financial':
        return '💰'
      default:
        return '📄'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Scheduled Reports</h1>
        <p className="text-muted-foreground">
          Manage automated report generation and delivery
        </p>
      </div>

      {/* Trigger Result Alert */}
      {triggerResult && (
        <Alert variant={triggerResult.success ? 'default' : 'destructive'}>
          {triggerResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {triggerResult.message}
            {triggerResult.filename && (
              <div className="mt-2 text-sm">
                <strong>Filename:</strong> {triggerResult.filename}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Reports Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {reports.length} total reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Report</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today at 6:00 PM</div>
            <p className="text-xs text-muted-foreground">Daily Production Summary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Yesterday</div>
            <p className="text-xs text-muted-foreground">3 reports sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Report Schedules</CardTitle>
          <CardDescription>
            Configure automated reports and trigger manual generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getTypeIcon(report.type)}</div>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {report.format.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            To: {report.recipients.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{report.schedule}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{report.nextRun}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {report.lastRun || 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.enabled ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTriggerReport(report.id)}
                        disabled={triggering === report.id}
                      >
                        {triggering === report.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Run Now
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Environment variables for scheduled reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Timezone:</span>
              <span className="ml-2 text-muted-foreground">America/New_York</span>
            </div>
            <div>
              <span className="font-medium">Email Service:</span>
              <span className="ml-2 text-muted-foreground">Not configured</span>
            </div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To enable automated report delivery, configure email service in environment
              variables. See <code className="text-xs bg-muted px-1 py-0.5 rounded">CLAUDE.md</code> for
              details.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
