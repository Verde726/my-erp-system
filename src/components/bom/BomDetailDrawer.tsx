'use client'

/**
 * BOM Detail Drawer Component
 * Slides in from right to show detailed item information
 */

import { useBomItem, useDeleteBomItem } from '@/hooks/useBom'
import { formatCurrency, formatNumber, formatDateTime, cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  Truck,
  Edit,
  Trash2,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

interface BomDetailDrawerProps {
  itemId: string | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onAdjustStock: () => void
}

export function BomDetailDrawer({
  itemId,
  open,
  onClose,
  onEdit,
  onAdjustStock,
}: BomDetailDrawerProps) {
  const { data: item, isLoading } = useBomItem(itemId)
  const deleteMutation = useDeleteBomItem()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!itemId) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    try {
      await deleteMutation.mutateAsync(itemId)
      onClose()
      setConfirmDelete(false)
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  if (isLoading || !item) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const stockPercentage = (item.currentStock / item.reorderPoint) * 100
  const stockStatusColor =
    item.stockStatus === 'good' || item.stockStatus === 'sufficient'
      ? 'text-green-600'
      : item.stockStatus === 'low'
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="font-mono text-xl">
                {item.partNumber}
              </SheetTitle>
              <SheetDescription className="mt-1">
                {item.description}
              </SheetDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {item.category}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Stock Level Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stock Gauge */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className={cn('text-3xl font-bold', stockStatusColor)}>
                      {formatNumber(item.currentStock, 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Reorder at {formatNumber(item.reorderPoint, 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        item.stockStatus === 'good' && 'bg-green-500',
                        item.stockStatus === 'sufficient' && 'bg-green-400',
                        item.stockStatus === 'low' && 'bg-yellow-500',
                        item.stockStatus === 'out' && 'bg-red-500'
                      )}
                      style={{
                        width: `${Math.min(stockPercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {item.currentStock <= item.reorderPoint && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn('text-sm font-medium', stockStatusColor)}>
                      {item.stockStatus === 'out' && 'Out of Stock'}
                      {item.stockStatus === 'low' && 'Low Stock - Reorder Needed'}
                      {item.stockStatus === 'sufficient' && 'Stock Sufficient'}
                      {item.stockStatus === 'good' && 'Stock Level Good'}
                    </span>
                  </div>
                </div>

                {/* Safety Stock */}
                {item.safetyStock > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Safety Stock</span>
                    <span className="font-medium">
                      {formatNumber(item.safetyStock, 0)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Unit Cost</div>
                <div className="font-semibold">{formatCurrency(item.unitCost)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                <div className="font-semibold">
                  {formatCurrency(item.totalValue)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Qty per Unit</div>
                <div className="font-semibold">
                  {formatNumber(item.quantityPerUnit, 2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Lead Time</div>
                  <div className="font-semibold">{item.leadTimeDays} days</div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Supplier</div>
                <div className="font-semibold">{item.supplier}</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          {item.movements && item.movements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Movements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.movements.slice(0, 5).map((movement: any) => (
                    <div
                      key={movement.id}
                      className="flex items-start justify-between text-sm border-l-2 pl-3"
                      style={{
                        borderLeftColor:
                          movement.movementType === 'in'
                            ? 'rgb(34, 197, 94)'
                            : movement.movementType === 'out'
                            ? 'rgb(239, 68, 68)'
                            : 'rgb(59, 130, 246)',
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {movement.movementType === 'in' && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {movement.movementType === 'out' && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          {movement.movementType === 'adjustment' && (
                            <Settings className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium capitalize">
                            {movement.movementType}
                          </span>
                          <span className="text-muted-foreground">
                            {formatNumber(movement.quantity, 0)}
                          </span>
                        </div>
                        {movement.reason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {movement.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(movement.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Requirements */}
          {item.materialReqs && item.materialReqs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Upcoming Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.materialReqs.map((req: any) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {req.schedule.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {req.schedule.product.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(req.requiredQuantity, 0)}
                        </div>
                        <Badge
                          variant={
                            req.status === 'allocated' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onAdjustStock} className="flex-1">
              Adjust Stock
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={confirmDelete ? 'destructive' : 'outline'}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirm Delete' : ''}
            </Button>
          </div>
          {confirmDelete && (
            <p className="text-sm text-red-600 text-center">
              Click again to confirm deletion
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
