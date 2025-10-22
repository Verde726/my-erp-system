'use client'

/**
 * Production Timeline Component
 *
 * Gantt-style timeline visualization showing production schedules
 * for the next 30 days with capacity utilization
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Clock } from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface ProductionScheduleItem {
  scheduleId: string
  productName: string
  productSku: string
  startDate: Date
  endDate: Date
  unitsToProducePerDay: number
  workstationId: string
  priority: 'high' | 'medium' | 'low'
  capacityUtilization?: number
  overCapacity?: boolean
}

export interface ProductionTimelineProps {
  schedules: ProductionScheduleItem[]
  loading?: boolean
  daysToShow?: number
}

// ============================================================================
// HELPERS
// ============================================================================

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500 hover:bg-red-600'
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600'
    case 'low':
      return 'bg-blue-500 hover:bg-blue-600'
    default:
      return 'bg-gray-500 hover:bg-gray-600'
  }
}

function calculatePosition(
  startDate: Date,
  endDate: Date,
  timelineStart: Date,
  timelineEnd: Date
): { left: number; width: number } {
  const totalDays = differenceInDays(timelineEnd, timelineStart)
  const startOffset = differenceInDays(startDate, timelineStart)
  const duration = differenceInDays(endDate, startDate) + 1

  const left = Math.max(0, (startOffset / totalDays) * 100)
  const width = Math.min(100 - left, (duration / totalDays) * 100)

  return { left, width }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductionTimeline({
  schedules,
  loading = false,
  daysToShow = 30,
}: ProductionTimelineProps) {
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
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const timelineEnd = addDays(today, daysToShow)

  // Group schedules by product
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = schedule.productSku
    if (!acc[key]) {
      acc[key] = {
        productName: schedule.productName,
        productSku: schedule.productSku,
        schedules: [],
      }
    }
    acc[key].schedules.push(schedule)
    return acc
  }, {} as Record<string, { productName: string; productSku: string; schedules: ProductionScheduleItem[] }>)

  const products = Object.values(groupedSchedules)

  // Generate date markers (every 7 days)
  const dateMarkers = []
  for (let i = 0; i <= daysToShow; i += 7) {
    const date = addDays(today, i)
    const position = (i / daysToShow) * 100
    dateMarkers.push({ date, position })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Production Schedule Timeline
        </CardTitle>
        <CardDescription>Next {daysToShow} days production overview</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No production schedules found for the next {daysToShow} days
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date markers */}
            <div className="relative h-6 border-b">
              {dateMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 text-xs text-muted-foreground"
                  style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
                >
                  {format(marker.date, 'MMM d')}
                </div>
              ))}
            </div>

            {/* Timeline rows */}
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.productSku} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.productSku}</p>
                    </div>
                    {product.schedules.some((s) => s.overCapacity) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over Capacity
                      </Badge>
                    )}
                  </div>

                  {/* Timeline bar container */}
                  <div className="relative h-10 bg-muted/30 rounded-md">
                    {/* Today marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                      style={{ left: '0%' }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
                    </div>

                    {/* Schedule bars */}
                    <TooltipProvider>
                      {product.schedules.map((schedule) => {
                        const position = calculatePosition(
                          schedule.startDate,
                          schedule.endDate,
                          today,
                          timelineEnd
                        )

                        return (
                          <Tooltip key={schedule.scheduleId}>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all ${getPriorityColor(
                                  schedule.priority
                                )} ${schedule.overCapacity ? 'ring-2 ring-red-600' : ''}`}
                                style={{
                                  left: `${position.left}%`,
                                  width: `${position.width}%`,
                                }}
                              >
                                <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2 overflow-hidden whitespace-nowrap">
                                  {position.width > 10 &&
                                    `${schedule.unitsToProducePerDay}/day`}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-semibold">{schedule.productName}</p>
                                <p className="text-xs">
                                  {format(schedule.startDate, 'MMM d')} -{' '}
                                  {format(schedule.endDate, 'MMM d')}
                                </p>
                                <p className="text-xs">
                                  Workstation: {schedule.workstationId}
                                </p>
                                <p className="text-xs">
                                  Rate: {schedule.unitsToProducePerDay} units/day
                                </p>
                                <p className="text-xs capitalize">
                                  Priority: {schedule.priority}
                                </p>
                                {schedule.capacityUtilization !== undefined && (
                                  <p className="text-xs">
                                    Capacity: {schedule.capacityUtilization.toFixed(0)}%
                                  </p>
                                )}
                                {schedule.overCapacity && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    Exceeds Capacity
                                  </Badge>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-4 border-t text-xs">
              <span className="text-muted-foreground">Priority:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Low</span>
              </div>
              <div className="ml-4 flex items-center gap-1">
                <div className="w-0.5 h-4 bg-primary" />
                <span>Today</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
