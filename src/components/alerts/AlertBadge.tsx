'use client'

/**
 * Alert Badge Component
 *
 * Small badge showing alert count with severity-based coloring and pulsing animation
 */

import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// TYPES
// ============================================================================

export interface AlertBadgeProps {
  onClick?: () => void
  showIcon?: boolean
  pulse?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AlertBadge({ onClick, showIcon = true, pulse = true }: AlertBadgeProps) {
  // Fetch active alerts
  const { data, isLoading } = useAlerts({ status: 'active', limit: 100 })

  if (isLoading) {
    return <Skeleton className="h-6 w-12 rounded-full" />
  }

  const alerts = data?.alerts || []
  const totalCount = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

  // Determine badge variant based on highest severity
  const variant = criticalCount > 0 ? 'destructive' : warningCount > 0 ? 'outline' : 'secondary'

  // Determine if should pulse (critical alerts only)
  const shouldPulse = pulse && criticalCount > 0

  if (totalCount === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1 ${
        shouldPulse ? 'animate-pulse-slow' : ''
      }`}
    >
      {showIcon && <Bell className="h-5 w-5" />}
      <Badge variant={variant} className="text-xs px-2">
        {totalCount}
      </Badge>
      {criticalCount > 0 && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full animate-ping" />
      )}
    </button>
  )
}
