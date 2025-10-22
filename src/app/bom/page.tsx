'use client'

/**
 * BOM Inventory Management Page
 * Main page for managing Bill of Materials inventory
 */

import { useState } from 'react'
import { useBomList, useBomCategories, useBomSuppliers, BomItem } from '@/hooks/useBom'
import { formatCurrency, exportToCSV } from '@/lib/utils'
import { BomTable } from '@/components/bom/BomTable'
import { BomDetailDrawer } from '@/components/bom/BomDetailDrawer'
import { UploadModal } from '@/components/bom/UploadModal'
import { StockAdjustmentModal } from '@/components/bom/StockAdjustmentModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  Package,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BomPage() {
  // Filters state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [supplier, setSupplier] = useState('all')
  const [status, setStatus] = useState<'all' | 'sufficient' | 'low' | 'out'>('all')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BomItem | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)

  // Fetch data
  const { data, isLoading } = useBomList({
    search,
    category: category === 'all' ? undefined : category,
    supplier: supplier === 'all' ? undefined : supplier,
    status: status === 'all' ? undefined : status,
    page,
    limit: 50,
  })

  const { data: categories } = useBomCategories()
  const { data: suppliers } = useBomSuppliers()

  const handleRowClick = (item: BomItem) => {
    setSelectedItem(item)
    setDetailDrawerOpen(true)
  }

  const handleEdit = (item: BomItem) => {
    setSelectedItem(item)
    // TODO: Implement edit modal
    console.log('Edit item:', item)
  }

  const handleAdjustStock = () => {
    setDetailDrawerOpen(false)
    setAdjustmentModalOpen(true)
  }

  const handleExport = () => {
    if (!data?.items) return

    const exportData = data.items.map((item) => ({
      'Part Number': item.partNumber,
      Description: item.description,
      Category: item.category,
      'Current Stock': item.currentStock,
      'Reorder Point': item.reorderPoint,
      'Unit Cost': item.unitCost,
      'Total Value': item.totalValue,
      Supplier: item.supplier,
      'Lead Time (days)': item.leadTimeDays,
      'Safety Stock': item.safetyStock,
      Status: item.stockStatus,
    }))

    exportToCSV(exportData, `bom_inventory_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const hasActiveFilters = search || category !== 'all' || supplier !== 'all' || status !== 'all'

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bill of Materials Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage raw materials, components, and parts inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!data?.items}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(data.summary.totalInventoryValue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold mt-1">{data.summary.totalItems}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Items Below Reorder</p>
                  <p className="text-2xl font-bold mt-1">
                    {data.summary.itemsBelowReorder}
                  </p>
                </div>
                <div
                  className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center',
                    data.summary.itemsBelowReorder > 0
                      ? 'bg-red-100 dark:bg-red-950'
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <AlertCircle
                    className={cn(
                      'h-6 w-6',
                      data.summary.itemsBelowReorder > 0
                        ? 'text-red-600'
                        : 'text-gray-400'
                    )}
                  />
                </div>
              </div>
              {data.summary.itemsBelowReorder > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Action Required
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and Filter Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by part number or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(hasActiveFilters && 'border-primary')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown
                  className={cn(
                    'h-4 w-4 ml-2 transition-transform',
                    showFilters && 'rotate-180'
                  )}
                />
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={status}
                    onValueChange={(value: any) => {
                      setStatus(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="sufficient">Sufficient Stock</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Select
                    value={supplier}
                    onValueChange={(value) => {
                      setSupplier(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers?.map((sup) => (
                        <SelectItem key={sup} value={sup}>
                          {sup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      ) : data?.items ? (
        <>
          <BomTable
            data={data.items}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 50) + 1} to{' '}
                {Math.min(page * 50, data.pagination.totalCount)} of{' '}
                {data.pagination.totalCount} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or upload BOM data
          </p>
        </div>
      )}

      {/* Modals */}
      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      <BomDetailDrawer
        itemId={selectedItem?.id || null}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false)
          setSelectedItem(null)
        }}
        onEdit={() => handleEdit(selectedItem!)}
        onAdjustStock={handleAdjustStock}
      />

      <StockAdjustmentModal
        open={adjustmentModalOpen}
        onClose={() => {
          setAdjustmentModalOpen(false)
        }}
        item={
          selectedItem
            ? {
                id: selectedItem.id,
                partNumber: selectedItem.partNumber,
                description: selectedItem.description,
                currentStock: selectedItem.currentStock,
                reorderPoint: selectedItem.reorderPoint,
              }
            : null
        }
      />
    </div>
  )
}
