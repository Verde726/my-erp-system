# CSV Upload System Guide

## Overview

The ERP system includes a robust CSV upload system for bulk data imports with:
- Automatic validation using Zod schemas
- Comprehensive error reporting
- Template generation
- Support for large files (up to 10MB)
- Streaming parser for files > 5MB

## Files

- **`src/lib/csv-parser.ts`** - Core CSV parsing engine
- **`src/lib/validators/upload-schemas.ts`** - Validation schemas for each upload type

## Supported Upload Types

1. **BOM Items** - Bill of materials / parts inventory
2. **Products** - Finished goods catalog
3. **Product BOM** - Bill of materials mappings
4. **Sales Orders** - Sales forecasts and orders
5. **Production Schedules** - Production planning
6. **Throughput Data** - Historical production data
7. **Inventory Movements** - Stock adjustments

## Quick Start

### 1. Download Template

```typescript
import { downloadTemplate } from '@/lib/csv-parser'

// Download BOM template with hints and examples
downloadTemplate('bom', true, true)

// Download sales template without hints
downloadTemplate('sales', false, true)
```

### 2. Parse and Validate CSV

```typescript
import { parseCSV } from '@/lib/csv-parser'
import { BomUploadSchema } from '@/lib/validators/upload-schemas'

async function handleFileUpload(file: File) {
  const result = await parseCSV(file, BomUploadSchema)

  if (result.summary.invalidRows === 0) {
    // All rows valid - proceed with import
    console.log(`Successfully validated ${result.data.length} rows`)
    await bulkCreateBomItems(result.data)
  } else {
    // Show errors to user
    console.error(`Found ${result.errors.length} errors`)
    displayErrors(result.errors)
  }
}
```

### 3. Handle Errors

```typescript
function displayErrors(errors: ParseError[]) {
  errors.forEach((error) => {
    console.log(`Row ${error.row}: ${error.message}`)
    if (error.field) {
      console.log(`  Field: ${error.field}`)
      console.log(`  Value: ${error.value}`)
    }
  })
}
```

## Upload Schemas Reference

### BOM Items Upload

**Required Fields:**
- `partNumber` (string, uppercase letters/numbers/hyphens)
- `description` (string)
- `quantityPerUnit` (positive number)
- `currentStock` (non-negative number)
- `unitCost` (positive number, < $100,000)
- `supplier` (string)
- `reorderPoint` (non-negative number)
- `leadTimeDays` (positive integer, max 365 days)
- `category` (string)

**Optional Fields:**
- `safetyStock` (non-negative number, default: 0)

**Business Rules:**
- Safety stock ≤ reorder point
- Part number must be unique
- Unit cost warning if > $100,000

**Example CSV:**
```csv
partNumber,description,quantityPerUnit,currentStock,unitCost,supplier,reorderPoint,leadTimeDays,category,safetyStock
BOLT-M5-100,M5 Bolt 100mm,1,500,0.15,FastenerCo,100,7,hardware,20
PLATE-STEEL-12,Steel Plate 12x12,1,200,12.50,SteelWorks Inc,50,14,raw_materials,10
```

### Sales Orders Upload

**Required Fields:**
- `orderId` (format: XX-YYYY-###, e.g., SO-2024-001)
- `productSku` (string, uppercase letters/numbers/hyphens)
- `forecastedUnits` (positive integer)
- `date` (YYYY-MM-DD, within last 5 years / next 2 years)
- `priority` (high | medium | low, default: medium)

**Optional Fields:**
- `customerSegment` (string)
- `status` (string, default: pending)

**Business Rules:**
- Order ID must be unique
- Forecasted units warning if > 100,000
- Date must be reasonable (not too far past/future)

**Example CSV:**
```csv
orderId,productSku,forecastedUnits,date,priority,customerSegment,status
SO-2024-001,PROD-A-100,500,2024-12-01,high,enterprise,pending
SO-2024-002,PROD-B-200,300,2024-12-15,medium,smb,confirmed
```

### Throughput Data Upload

**Required Fields:**
- `date` (YYYY-MM-DD)
- `productSku` (string)
- `unitsProduced` (non-negative integer)
- `hoursWorked` (positive number, max 24, min 0.1)
- `defectRate` (number 0-1, warning if > 0.5)
- `workstationId` (string)

**Optional Fields:**
- `efficiency` (number 0-2)

**Business Rules:**
- Defect rate < 50% (warning otherwise)
- Production rate warning if > 10,000 units/hour
- Hours worked between 0.1 and 24

**Example CSV:**
```csv
date,productSku,unitsProduced,hoursWorked,defectRate,workstationId,efficiency
2024-11-20,PROD-A-100,450,8,0.02,WS-001,0.95
2024-11-20,PROD-B-200,380,8,0.05,WS-002,0.88
```

### Product Upload

**Required Fields:**
- `sku` (string, unique)
- `name` (string)
- `category` (string)

**Optional Fields:**
- `description` (string)
- `targetMargin` (number 0-1, default: 0.3)

**Example CSV:**
```csv
sku,name,description,category,targetMargin
PROD-A-100,Product A Standard,High quality product,finished_goods,0.35
PROD-B-200,Product B Premium,Premium line product,finished_goods,0.40
```

### Product BOM Upload

**Required Fields:**
- `productSku` (string, must exist)
- `partNumber` (string, must exist)
- `quantityNeeded` (positive number)

**Example CSV:**
```csv
productSku,partNumber,quantityNeeded
PROD-A-100,BOLT-M5-100,4
PROD-A-100,PLATE-STEEL-12,1
PROD-B-200,BOLT-M5-100,6
```

### Production Schedule Upload

**Required Fields:**
- `scheduleId` (format: SCHED-YYYY-###)
- `productSku` (string)
- `unitsToProducePerDay` (positive number)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD, must be after startDate)
- `workstationId` (string)
- `shiftNumber` (integer 1-3)

**Example CSV:**
```csv
scheduleId,productSku,unitsToProducePerDay,startDate,endDate,workstationId,shiftNumber
SCHED-2024-001,PROD-A-100,500,2024-12-01,2024-12-05,WS-001,1
SCHED-2024-002,PROD-B-200,300,2024-12-01,2024-12-10,WS-002,2
```

### Inventory Movement Upload

**Required Fields:**
- `partNumber` (string)
- `movementType` (in | out | adjustment)
- `quantity` (non-zero number)

**Optional Fields:**
- `reference` (string, e.g., PO number)
- `reason` (string)
- `timestamp` (YYYY-MM-DD)

**Example CSV:**
```csv
partNumber,movementType,quantity,reference,reason,timestamp
BOLT-M5-100,in,1000,PO-2024-050,Received shipment,2024-11-20
PLATE-STEEL-12,out,50,SCHED-001,Production consumption,2024-11-20
BOLT-M5-100,adjustment,-10,INV-COUNT-Q4,Cycle count adjustment,2024-11-20
```

## Advanced Usage

### Custom Validation

```typescript
import { parseCSV } from '@/lib/csv-parser'
import { BomUploadSchema, checkDuplicatePartNumbers } from '@/lib/validators/upload-schemas'

async function uploadBomWithDuplicateCheck(file: File) {
  const result = await parseCSV(file, BomUploadSchema)

  if (result.summary.invalidRows > 0) {
    return { success: false, errors: result.errors }
  }

  // Check for duplicates within the file
  const duplicateCheck = checkDuplicatePartNumbers(result.data)
  if (duplicateCheck.hasDuplicates) {
    return {
      success: false,
      errors: [{
        row: 0,
        message: `Duplicate part numbers found: ${duplicateCheck.duplicates.join(', ')}`,
        severity: 'error' as const
      }]
    }
  }

  // Check against existing database records
  const existing = await prisma.bomItem.findMany({
    where: {
      partNumber: { in: result.data.map(r => r.partNumber) }
    },
    select: { partNumber: true }
  })

  if (existing.length > 0) {
    const existingPartNumbers = existing.map(e => e.partNumber)
    return {
      success: false,
      errors: [{
        row: 0,
        message: `Part numbers already exist in database: ${existingPartNumbers.join(', ')}`,
        severity: 'error' as const
      }]
    }
  }

  // All validations passed
  return { success: true, data: result.data }
}
```

### Streaming for Large Files

The parser automatically uses streaming for files > 5MB:

```typescript
// Automatically uses streaming if file > 5MB
const result = await parseCSV(largeFile, BomUploadSchema)

// Force streaming threshold (optional)
const result2 = await parseCSV(file, BomUploadSchema, {
  maxFileSizeMB: 20 // Allow up to 20MB files
})
```

### Header Validation

```typescript
import { validateHeaders } from '@/lib/csv-parser'

const headers = ['partNumber', 'description', 'currentStock']
const validation = validateHeaders(headers, 'bom')

if (!validation.valid) {
  console.log('Missing headers:', validation.missingHeaders)
  console.log('Extra headers:', validation.extraHeaders)
  console.log('Suggestions:', validation.suggestions)
}
```

### Export to CSV

```typescript
import { exportToCSV } from '@/lib/csv-parser'

const bomItems = await prisma.bomItem.findMany()

// Export all fields
exportToCSV(bomItems, 'bom_export.csv')

// Export specific fields only
exportToCSV(
  bomItems,
  'bom_export.csv',
  ['partNumber', 'description', 'currentStock', 'unitCost']
)
```

## React Component Example

```typescript
'use client'

import { useState } from 'react'
import { parseCSV, downloadTemplate } from '@/lib/csv-parser'
import { BomUploadSchema } from '@/lib/validators/upload-schemas'
import type { ParseError } from '@/lib/csv-parser'

export function BomUploadComponent() {
  const [errors, setErrors] = useState<ParseError[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrors([])

    try {
      const result = await parseCSV(file, BomUploadSchema)

      if (result.summary.invalidRows > 0) {
        setErrors(result.errors)
      } else {
        // Upload to server
        const response = await fetch('/api/bom-items/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: result.data })
        })

        if (response.ok) {
          alert(`Successfully uploaded ${result.data.length} items`)
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={() => downloadTemplate('bom')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Template
        </button>
      </div>

      <div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 p-4 rounded">
          <h3 className="font-semibold text-red-900 mb-2">
            Validation Errors ({errors.length})
          </h3>
          <ul className="space-y-2">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700">
                <strong>Row {error.row}:</strong> {error.message}
                {error.field && <span className="text-red-600"> (Field: {error.field})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

## API Route Example

```typescript
// app/api/bom-items/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BomUploadSchema } from '@/lib/validators/upload-schemas'
import { z } from 'zod'

const BulkUploadSchema = z.object({
  items: z.array(BomUploadSchema)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = BulkUploadSchema.parse(body)

    // Create all items in a transaction
    const created = await prisma.$transaction(
      items.map(item =>
        prisma.bomItem.create({
          data: item
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: created,
      message: `Successfully created ${created.length} items`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create items' },
      { status: 500 }
    )
  }
}
```

## Error Handling Best Practices

1. **Always check `summary.invalidRows` before processing data**
2. **Display errors with row numbers** to help users fix issues
3. **Distinguish between errors and warnings** - warnings can be ignored
4. **Provide download template button** for users unfamiliar with format
5. **Show progress indicator** for large file uploads
6. **Validate duplicates** both within file and against database
7. **Use transactions** when bulk creating to ensure atomicity

## Performance Considerations

- Files < 5MB: Parsed completely in memory (faster)
- Files > 5MB: Streamed and processed in chunks (lower memory)
- Maximum file size: 10MB (configurable)
- Validation happens row-by-row for memory efficiency
- All errors collected (doesn't stop at first error)

## Troubleshooting

### "File size exceeds maximum"
- Current limit: 10MB
- Solution: Split file into smaller chunks or increase `maxFileSizeMB` option

### "Date must be within last 5 years"
- Dates too far in past or future are rejected
- Solution: Check date format is YYYY-MM-DD and date is reasonable

### "Defect rate seems unusually high"
- Warning if defect rate > 50%
- Solution: Verify the defect rate is correct (should be 0-1, not percentage)

### "Part number can only contain..."
- Part numbers must be alphanumeric with hyphens/underscores
- Solution: Remove special characters from part numbers

### "Duplicate part numbers found"
- Multiple rows have the same part number
- Solution: Remove duplicates or use update operation instead

## Summary

The CSV upload system provides:
- ✅ Type-safe validation with Zod
- ✅ Comprehensive error reporting
- ✅ Template generation
- ✅ Large file support (streaming)
- ✅ Custom business logic validation
- ✅ Duplicate detection
- ✅ Reference validation
- ✅ User-friendly error messages

All upload types follow the same pattern, making it easy to add new upload types in the future.
