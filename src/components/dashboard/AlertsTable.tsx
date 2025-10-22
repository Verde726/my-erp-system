'use client'

/**
 * Alerts Table Component
 *
 * Displays active alerts with filtering, search, and actions
 * Auto-refreshes and shows real-time status
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'active' | 'resolved' | 'dismissed'

export interface Alert {
  id: string
  severity: AlertSeverity
  alertType: string
  title: string
  description: string
  reference?: string
  referenceLink?: string
  createdAt: Date
  status: AlertStatus
}

export interface AlertsTableProps {
  alerts: Alert[]
  loading?: boolean
  onResolve?: (alert: Alert) => void
  onDismiss?: (alert: Alert) => void
  onView?: (alert: Alert) => void
  onRefresh?: () => void
  autoRefresh?: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

function getSeverityBadgeVariant(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'warning':
      return 'outline'
    case 'info':
      return 'secondary'
    default:
      return 'default'
  }
}

function getAlertTypeLabel(alertType: string): string {
  const labels: Record<string, string> = {
    shortage: 'Material Shortage',
    reorder: 'Reorder Required',
    schedule_conflict: 'Schedule Conflict',
    cost_overrun: 'Cost Overrun',
    capacity_warning: 'Capacity Warning',
    quality_issue: 'Quality Issue',
  }
  return labels[alertType] || alertType
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AlertsTable({
  alerts,
  loading = false,
  onResolve,
  onDismiss,
  onView,
  onRefresh,
  autoRefresh = true,
}: AlertsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all')

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
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesSearch =
      searchQuery === '' ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesSearch && alert.status === 'active'
  })

  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length
  const warningCount = alerts.filter(
    (a) => a.severity === 'warning' && a.status === 'active'
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              {filteredAlerts.length} active alert
              {filteredAlerts.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                {warningCount} Warnings
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={severityFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverityFilter('all')}
            >
              All
            </Button>
            <Button
              variant={severityFilter === 'critical' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setSeverityFilter('critical')}
            >
              Critical
            </Button>
            <Button
              variant={severityFilter === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverityFilter('warning')}
            >
              Warnings
            </Button>
            <Button
              variant={severityFilter === 'info' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSeverityFilter('info')}
            >
              Info
            </Button>
          </div>
        </div>

        {/* Alerts Table */}
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || severityFilter !== 'all'
              ? 'No alerts match your filters'
              : 'No active alerts'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead>Alert Details</TableHead>
                  <TableHead className="w-[150px]">Reference</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={
                      alert.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-950/20'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-950/20'
                        : ''
                    }
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getSeverityIcon(alert.severity)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getSeverityBadgeVariant(alert.severity)}
                        className="text-xs"
                      >
                        {getAlertTypeLabel(alert.alertType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.referenceLink ? (
                        <Link
                          href={alert.referenceLink}
                          className="text-sm text-primary hover:underline"
                        >
                          {alert.reference}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {alert.reference || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(alert)}>
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onResolve && (
                            <DropdownMenuItem onClick={() => onResolve(alert)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Resolve
                            </DropdownMenuItem>
                          )}
                          {onDismiss && (
                            <DropdownMenuItem onClick={() => onDismiss(alert)}>
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Dismiss
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
