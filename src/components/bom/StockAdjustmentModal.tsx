'use client'

/**
 * Stock Adjustment Modal Component
 * Modal for adjusting inventory stock levels with validation
 */

import { useState, useEffect } from 'react'
import { useAdjustStock } from '@/hooks/useBom'
import { formatNumber } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, Settings, AlertCircle } from 'lucide-react'

interface StockAdjustmentModalProps {
  open: boolean
  onClose: () => void
  item: {
    id: string
    partNumber: string
    description: string
    currentStock: number
    reorderPoint: number
  } | null
}

export function StockAdjustmentModal({
  open,
  onClose,
  item,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const adjustMutation = useAdjustStock()

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAdjustmentType('add')
      setQuantity('')
      setReason('')
      setReference('')
      adjustMutation.reset()
    }
  }, [open, adjustMutation])

  if (!item) return null

  const parsedQuantity = parseFloat(quantity) || 0
  let newStock = item.currentStock

  switch (adjustmentType) {
    case 'add':
      newStock = item.currentStock + Math.abs(parsedQuantity)
      break
    case 'remove':
      newStock = item.currentStock - Math.abs(parsedQuantity)
      break
    case 'set':
      newStock = Math.abs(parsedQuantity)
      break
  }

  const isValid = parsedQuantity > 0 && reason.trim().length > 0 && newStock >= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      await adjustMutation.mutateAsync({
        id: item.id,
        adjustmentType,
        quantity: parsedQuantity,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Stock adjustment failed:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            <div className="font-mono font-medium">{item.partNumber}</div>
            <div className="text-sm">{item.description}</div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Stock */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
            <div className="text-2xl font-bold">
              {formatNumber(item.currentStock, 0)}
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adjustment Type</label>
            <Select
              value={adjustmentType}
              onValueChange={(value: 'add' | 'remove' | 'set') =>
                setAdjustmentType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Add to Stock</span>
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span>Remove from Stock</span>
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    <span>Set Exact Stock</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === 'set' ? 'Enter new stock level' : 'Enter quantity'}
              required
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <label htmlFor="reference" className="text-sm font-medium">
              Reference <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number, schedule ID, etc."
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this adjustment needed?"
              required
            />
          </div>

          {/* New Stock Preview */}
          {quantity && (
            <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">New Stock Level</span>
                {newStock <= item.reorderPoint && (
                  <Badge variant="destructive" className="text-xs">
                    Below Reorder Point
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(newStock, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Change: {newStock > item.currentStock ? '+' : ''}
                {formatNumber(newStock - item.currentStock, 0)}
              </div>
            </div>
          )}

          {/* Error Display */}
          {adjustMutation.isError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 text-red-900 dark:text-red-100">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {adjustMutation.error?.message || 'Adjustment failed'}
                </span>
              </div>
            </div>
          )}

          {/* Negative Stock Warning */}
          {newStock < 0 && quantity && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Adjustment would result in negative stock
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={adjustMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || adjustMutation.isPending}
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Confirm Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
