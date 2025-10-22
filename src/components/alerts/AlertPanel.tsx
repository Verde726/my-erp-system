'use client'

/**
 * Alert Panel Component
 *
 * Reusable panel for displaying and managing alerts with real-time updates
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAlerts, useResolveAlert, useDismissAlert, type Alert, type AlertFilters } from '@/hooks/useAlerts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ============================================================================
// TYPES
// ============================================================================

export interface AlertPanelProps {
  filters?: AlertFilters
  maxAlerts?: number
  showDismissed?: boolean
  onAlertClick?: (alert: Alert) => void
  compact?: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-600" />
    default:
      return <Info className="h-4 w-4" />
  }
}

function getSeverityBadgeVariant(severity: string) {
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

// ============================================================================
// COMPONENT
// ============================================================================

export function AlertPanel({
  filters = {},
  maxAlerts,
  showDismissed = false,
  onAlertClick,
  compact = false,
}: AlertPanelProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; alert: Alert | null }>({
    open: false,
    alert: null,
  })
  const [resolutionNotes, setResolutionNotes] = useState('')

  // Apply filters
  const alertFilters: AlertFilters = {
    ...filters,
    status: showDismissed ? undefined : 'active',
    limit: maxAlerts,
  }

  const { data, isLoading, refetch } = useAlerts(alertFilters)
  const resolveAlertMutation = useResolveAlert()
  const dismissAlertMutation = useDismissAlert()

  const alerts = data?.alerts || []

  const handleResolve = async () => {
    if (!resolveDialog.alert || !resolutionNotes.trim()) return

    try {
      await resolveAlertMutation.mutateAsync({
        alertId: resolveDialog.alert.id,
        notes: resolutionNotes,
      })
      setResolveDialog({ open: false, alert: null })
      setResolutionNotes('')
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const handleDismiss = async (alert: Alert) => {
    try {
      await dismissAlertMutation.mutateAsync({
        alertId: alert.id,
        reason: 'Dismissed by user',
      })
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerts
              </CardTitle>
              <CardDescription>
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const isExpanded = expandedAlert === alert.id

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-3 transition-all ${
                      alert.severity === 'critical'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                        : alert.severity === 'warning'
                        ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-border'
                    } ${onAlertClick ? 'cursor-pointer hover:bg-accent' : ''}`}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={getSeverityBadgeVariant(alert.severity)}
                                className="text-xs"
                              >
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(alert.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            {!compact && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {alert.description}
                              </p>
                            )}
                            {alert.reference && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ref: {alert.reference}
                              </p>
                            )}
                          </div>

                          {/* Expand button */}
                          {!compact && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedAlert(isExpanded ? null : alert.id)
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <p className="text-sm">{alert.description}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setResolveDialog({ open: true, alert })
                                }}
                                disabled={resolveAlertMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDismiss(alert)
                                }}
                                disabled={dismissAlertMutation.isPending}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ open, alert: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add resolution notes for this alert. This will mark it as resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Input
                id="resolution"
                placeholder="Describe how the issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, alert: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim() || resolveAlertMutation.isPending}
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
