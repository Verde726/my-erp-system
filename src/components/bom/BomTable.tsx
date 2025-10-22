'use client'

/**
 * BOM Table Component
 * Interactive data table for BOM inventory with sorting, filtering, and pagination
 */

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Eye, Edit, TrendingUp, TrendingDown } from 'lucide-react'
import { BomItem } from '@/hooks/useBom'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface BomTableProps {
  data: BomItem[]
  onRowClick: (item: BomItem) => void
  onEdit: (item: BomItem) => void
}

export function BomTable({ data, onRowClick, onEdit }: BomTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<BomItem>[] = [
    {
      id: 'status',
      header: '',
      cell: ({ row }) => {
        const status = row.original.stockStatus
        return (
          <div className="flex items-center justify-center">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                status === 'good' && 'bg-green-500',
                status === 'sufficient' && 'bg-green-400',
                status === 'low' && 'bg-yellow-500',
                status === 'out' && 'bg-red-500'
              )}
              title={status.charAt(0).toUpperCase() + status.slice(1)}
            />
          </div>
        )
      },
      size: 40,
    },
    {
      accessorKey: 'partNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold"
        >
          Part Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue('partNumber')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-md truncate">{row.getValue('description')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('category')}
        </Badge>
      ),
    },
    {
      accessorKey: 'currentStock',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold"
        >
          Current Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.getValue('currentStock') as number
        const reorderPoint = row.original.reorderPoint
        const isLow = stock <= reorderPoint

        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium tabular-nums',
                isLow ? 'text-red-600' : 'text-green-600'
              )}
            >
              {formatNumber(stock, 0)}
            </span>
            {isLow && stock > 0 && (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'reorderPoint',
      header: 'Reorder Point',
      cell: ({ row }) => (
        <div className="tabular-nums text-muted-foreground">
          {formatNumber(row.getValue('reorderPoint'), 0)}
        </div>
      ),
    },
    {
      accessorKey: 'unitCost',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold"
        >
          Unit Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="tabular-nums">{formatCurrency(row.getValue('unitCost'))}</div>
      ),
    },
    {
      accessorKey: 'totalValue',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold"
        >
          Total Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium tabular-nums">
          {formatCurrency(row.getValue('totalValue'))}
        </div>
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm">
          {row.getValue('supplier')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onRowClick(row.original)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row.original)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
