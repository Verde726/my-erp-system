'use client'

/**
 * Material Requirements Table Component
 *
 * Displays upcoming material requirements for the next 7 days
 * with shortage indicators and order actions
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, CheckCircle, ShoppingCart, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface MaterialRequirement {
  id: string
  partNumber: string
  description: string
  requiredDate: Date
  requiredQuantity: number
  availableStock: number
  shortage: number
  orderStatus: 'ordered' | 'pending' | 'critical'
  scheduleId?: string
  productName?: string
}

export interface MaterialRequirementsTableProps {
  requirements: MaterialRequirement[]
  loading?: boolean
  onOrderClick?: (requirement: MaterialRequirement) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MaterialRequirementsTable({
  requirements,
  loading = false,
  onOrderClick,
}: MaterialRequirementsTableProps) {
  const [filter, setFilter] = useState<'all' | 'shortages' | 'ordered'>('all')

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
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter requirements
  const filteredRequirements = requirements.filter((req) => {
    if (filter === 'shortages') return req.shortage > 0
    if (filter === 'ordered') return req.orderStatus === 'ordered'
    return true
  })

  // Group by date
  const groupedByDate = filteredRequirements.reduce((acc, req) => {
    const dateKey = format(req.requiredDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: req.requiredDate,
        requirements: [],
      }
    }
    acc[dateKey].requirements.push(req)
    return acc
  }, {} as Record<string, { date: Date; requirements: MaterialRequirement[] }>)

  const groupedList = Object.values(groupedByDate).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  const shortageCount = requirements.filter((r) => r.shortage > 0).length
  const criticalCount = requirements.filter((r) => r.orderStatus === 'critical').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Material Requirements
            </CardTitle>
            <CardDescription>Next 7 days production needs</CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalCount} Critical
              </Badge>
            )}
            {shortageCount > 0 && (
              <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                {shortageCount} Shortages
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({requirements.length})
          </Button>
          <Button
            variant={filter === 'shortages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('shortages')}
          >
            Shortages ({shortageCount})
          </Button>
          <Button
            variant={filter === 'ordered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('ordered')}
          >
            Ordered
          </Button>
        </div>

        {filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {filter === 'all'
              ? 'No material requirements for the next 7 days'
              : filter === 'shortages'
              ? 'No shortages detected'
              : 'No ordered materials'}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedList.map((group) => (
              <div key={format(group.date, 'yyyy-MM-dd')} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h4 className="text-sm font-semibold">
                    {format(group.date, 'EEEE, MMMM d, yyyy')}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {group.requirements.length} items
                  </Badge>
                </div>

                {/* Requirements Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Part Number</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right w-[100px]">Required</TableHead>
                        <TableHead className="text-right w-[100px]">Available</TableHead>
                        <TableHead className="text-right w-[100px]">Shortage</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.requirements.map((req) => {
                        const hasShortage = req.shortage > 0
                        const isCritical = req.orderStatus === 'critical'

                        return (
                          <TableRow
                            key={req.id}
                            className={
                              isCritical
                                ? 'bg-red-50 dark:bg-red-950/20'
                                : hasShortage
                                ? 'bg-yellow-50 dark:bg-yellow-950/20'
                                : ''
                            }
                          >
                            <TableCell className="font-medium">{req.partNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{req.description}</p>
                                {req.productName && (
                                  <p className="text-xs text-muted-foreground">
                                    For: {req.productName}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {req.requiredQuantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  hasShortage
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                }
                              >
                                {req.availableStock}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {hasShortage ? (
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  -{req.shortage}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {req.orderStatus === 'ordered' ? (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ordered
                                </Badge>
                              ) : isCritical ? (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Critical
                                </Badge>
                              ) : hasShortage ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-yellow-500 text-yellow-600"
                                >
                                  Pending
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Ready
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {hasShortage && req.orderStatus !== 'ordered' && (
                                <Button
                                  size="sm"
                                  variant={isCritical ? 'destructive' : 'default'}
                                  onClick={() => onOrderClick?.(req)}
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Order Now
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
