'use client'

/**
 * Edit Item Modal Component
 * Modal form for editing BOM item details
 */

import { useState, useEffect } from 'react'
import { useUpdateBomItem, useBomCategories, useBomSuppliers } from '@/hooks/useBom'
import type { BomItem } from '@/hooks/useBom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EditItemModalProps {
  item: BomItem | null
  open: boolean
  onClose: () => void
}

export function EditItemModal({ item, open, onClose }: EditItemModalProps): JSX.Element | null {
  const { toast } = useToast()
  const updateMutation = useUpdateBomItem()
  const { data: categories } = useBomCategories()
  const { data: suppliers } = useBomSuppliers()

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    quantityPerUnit: '',
    unitCost: '',
    supplier: '',
    reorderPoint: '',
    leadTimeDays: '',
    category: '',
    safetyStock: '',
  })

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        description: item.description,
        quantityPerUnit: item.quantityPerUnit.toString(),
        unitCost: item.unitCost.toString(),
        supplier: item.supplier,
        reorderPoint: item.reorderPoint.toString(),
        leadTimeDays: item.leadTimeDays.toString(),
        category: item.category,
        safetyStock: item.safetyStock.toString(),
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!item) return

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          description: formData.description,
          quantityPerUnit: parseFloat(formData.quantityPerUnit),
          unitCost: parseFloat(formData.unitCost),
          supplier: formData.supplier,
          reorderPoint: parseFloat(formData.reorderPoint),
          leadTimeDays: parseInt(formData.leadTimeDays),
          category: formData.category,
          safetyStock: parseFloat(formData.safetyStock || '0'),
        },
      })

      toast({
        title: 'Success',
        description: 'BOM item updated successfully',
      })

      onClose()
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update BOM item',
        variant: 'destructive',
      })
    }
  }

  const handleChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit BOM Item</DialogTitle>
          <DialogDescription>
            Part Number: <span className="font-mono font-semibold">{item.partNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={formData.supplier} onValueChange={(value) => handleChange('supplier', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((sup) => (
                    <SelectItem key={sup} value={sup}>
                      {sup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Per Unit */}
            <div className="space-y-2">
              <Label htmlFor="quantityPerUnit">Quantity Per Unit *</Label>
              <Input
                id="quantityPerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityPerUnit}
                onChange={(e) => handleChange('quantityPerUnit', e.target.value)}
                required
              />
            </div>

            {/* Unit Cost */}
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost ($) *</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) => handleChange('unitCost', e.target.value)}
                required
              />
            </div>

            {/* Reorder Point */}
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point *</Label>
              <Input
                id="reorderPoint"
                type="number"
                step="1"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => handleChange('reorderPoint', e.target.value)}
                required
              />
            </div>

            {/* Safety Stock */}
            <div className="space-y-2">
              <Label htmlFor="safetyStock">Safety Stock</Label>
              <Input
                id="safetyStock"
                type="number"
                step="1"
                min="0"
                value={formData.safetyStock}
                onChange={(e) => handleChange('safetyStock', e.target.value)}
              />
            </div>

            {/* Lead Time Days */}
            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">Lead Time (Days) *</Label>
              <Input
                id="leadTimeDays"
                type="number"
                step="1"
                min="0"
                value={formData.leadTimeDays}
                onChange={(e) => handleChange('leadTimeDays', e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
