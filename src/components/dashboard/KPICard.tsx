'use client'

/**
 * KPI Card Component
 *
 * Reusable card for displaying key performance indicators with metrics,
 * status indicators, and quick actions
 */

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LucideIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// ============================================================================
// TYPES
// ============================================================================

export interface KPIMetric {
  label: string
  value: string | number
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  sublabel?: string
}

export interface KPICardProps {
  title: string
  icon: LucideIcon
  metrics: KPIMetric[]
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
  loading?: boolean
  pulse?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KPICard({
  title,
  icon: Icon,
  metrics,
  actionLabel,
  actionHref,
  onActionClick,
  loading = false,
  pulse = false,
  className = '',
}: KPICardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'danger':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-foreground'
    }
  }

  const cardClasses = `transition-all hover:shadow-lg ${
    pulse ? 'animate-pulse-slow border-red-500' : ''
  } ${className}`

  if (loading) {
    return (
      <Card className={cardClasses}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardClasses}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              {metric.badge && (
                <Badge variant={metric.badge.variant} className="text-xs">
                  {metric.badge.text}
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                {metric.value}
              </p>
              {metric.sublabel && (
                <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
              )}
            </div>
          </div>
        ))}

        {(actionLabel || actionHref) && (
          <div className="pt-2">
            {actionHref ? (
              <Link href={actionHref}>
                <Button variant="outline" className="w-full" size="sm">
                  {actionLabel}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={onActionClick}
              >
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

export function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}
