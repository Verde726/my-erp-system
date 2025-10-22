# TypeScript Types and Schemas Documentation

## Overview

The ERP/MRP system uses a comprehensive type system with:
- **TypeScript interfaces** for compile-time type safety
- **Zod schemas** for runtime validation
- **Business constants** for configuration and rules
- **Utility types** for common patterns

## File Structure

```
src/models/
├── types.ts       # All TypeScript interfaces and types
├── schemas.ts     # Zod validation schemas
├── constants.ts   # Business rules and constants
└── index.ts       # Central export file
```

## Usage

### Import Types and Schemas

```typescript
import {
  // Types
  BomItem,
  Product,
  MRPResult,
  DashboardKPIs,

  // Schemas
  BomItemSchema,
  CreateProductInputSchema,

  // Constants
  PRIORITY_LEVELS,
  DEFAULT_TARGET_MARGIN,

  // Helper functions
  calculateSafetyStock,
  getStockHealthStatus,
} from '@/models'
```

## Type Categories

### 1. Base Model Types

Interfaces matching the Prisma database schema:

```typescript
interface BomItem {
  id: string
  partNumber: string
  description: string
  currentStock: number
  unitCost: number
  reorderPoint: number
  safetyStock: number
  // ... more fields
}

interface Product {
  id: string
  sku: string
  name: string
  category: string
  targetMargin: number
  // ... more fields
}
```

**13 base models:** BomItem, Product, ProductBom, SalesOrder, ProductionSchedule, MaterialRequirement, ThroughputData, InventoryMovement, FinancialMetrics, Alert, User, Customer, Supplier

### 2. Extended Types (with Relations)

Types that include related data from joins:

```typescript
interface ProductWithBom extends Product {
  bom: Array<ProductBom & { bomItem: BomItem }>
}

interface ProductionScheduleWithProduct extends ProductionSchedule {
  product: Product
  materialReqs: Array<MaterialRequirement & { bomItem: BomItem }>
}
```

**Use case:** API responses that return nested data

### 3. Business Logic Types

Complex calculated types for business operations:

#### MRP Result

```typescript
interface MRPResult {
  partNumber: string
  description: string
  grossRequirement: number
  currentStock: number
  netRequirement: number
  plannedOrderQuantity: number
  orderDate: Date
  requiredDate: Date
  status: 'sufficient' | 'shortage' | 'critical'
  leadTimeDays: number
  supplier: string
}
```

**Use case:** Material Requirements Planning calculations

#### Throughput Metrics

```typescript
interface ThroughputMetrics {
  productId: string
  productName: string
  averageUnitsPerHour: number
  averageUnitsPerDay: number
  standardDeviation: number
  efficiencyTrend: 'improving' | 'stable' | 'declining'
  defectRateTrend: 'improving' | 'stable' | 'worsening'
  averageDefectRate: number
  averageEfficiency: number
  dataPoints: number
  dateRange: { start: Date; end: Date }
}
```

**Use case:** Production performance analytics

#### Financial Snapshot

```typescript
interface FinancialSnapshot {
  totalInventoryValue: number
  wipValue: number
  finishedGoodsValue: number
  totalMaterialCost: number
  productionCostEstimate: number
  breakdown: {
    rawMaterialsValue: number
    componentsValue: number
    overheadAllocation: number
  }
  date: Date
}
```

**Use case:** Executive financial dashboards

### 4. CSV Upload Types

Types for bulk data imports:

```typescript
interface BomUploadRow {
  partNumber: string
  description: string
  quantityPerUnit: number
  currentStock: number
  unitCost: number
  supplier: string
  reorderPoint: number
  leadTimeDays: number
  category: string
  safetyStock?: number
}
```

**7 upload types:** BomUploadRow, ProductUploadRow, ProductBomUploadRow, SalesUploadRow, ProductionScheduleUploadRow, ThroughputUploadRow, InventoryMovementUploadRow

### 5. API Response Types

Standardized API response wrappers:

```typescript
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

interface UploadResult {
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: Array<{
    row: number
    field?: string
    message: string
    value?: unknown
  }>
  warnings?: Array<{
    row: number
    message: string
  }>
}
```

**Use case:** Consistent API response structure

### 6. Dashboard Types

Types for dashboard KPIs and metrics:

```typescript
interface DashboardKPIs {
  production: {
    unitsToday: number
    scheduledUnitsToday: number
    scheduleAdherence: number
    nextScheduled: string
    activeSchedules: number
  }
  inventory: {
    totalValue: number
    itemsBelowReorder: number
    itemsBelowSafety: number
    daysRemaining: number
    turnoverRate: number
  }
  alerts: {
    criticalCount: number
    warningCount: number
    infoCount: number
    pendingActionsCount: number
    resolvedToday: number
  }
  financial: {
    todayProductionCost: number
    costVariance: number
    wipValue: number
    inventoryValue: number
    projectedMonthlyCost: number
  }
}
```

**Use case:** Executive dashboard displays

## Zod Schemas

### Purpose

Zod schemas provide runtime validation for:
- API request payloads
- CSV upload data
- User form inputs
- Query parameters

### Usage Examples

#### Validating API Input

```typescript
import { CreateBomItemInputSchema } from '@/models'

// In API route
export async function POST(request: Request) {
  const body = await request.json()

  // Validate with Zod
  const result = CreateBomItemInputSchema.safeParse(body)

  if (!result.success) {
    return Response.json({
      success: false,
      error: 'Validation failed',
      details: result.error.errors
    }, { status: 400 })
  }

  // result.data is now type-safe
  const bomItem = await prisma.bomItem.create({
    data: result.data
  })

  return Response.json({ success: true, data: bomItem })
}
```

#### Validating CSV Upload

```typescript
import { BomUploadRowSchema } from '@/models'
import Papa from 'papaparse'

const results = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true
})

const validatedRows: BomUploadRow[] = []
const errors: UploadResult['errors'] = []

results.data.forEach((row, index) => {
  const result = BomUploadRowSchema.safeParse(row)

  if (result.success) {
    validatedRows.push(result.data)
  } else {
    errors.push({
      row: index + 1,
      message: result.error.errors.map(e => e.message).join(', ')
    })
  }
})
```

#### Validating Query Parameters

```typescript
import { PaginationParamsSchema, BomItemFiltersSchema } from '@/models'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const paginationResult = PaginationParamsSchema.safeParse({
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  })

  const filtersResult = BomItemFiltersSchema.safeParse({
    category: searchParams.get('category'),
    belowReorder: searchParams.get('belowReorder'),
    search: searchParams.get('search'),
  })

  if (!paginationResult.success || !filtersResult.success) {
    return Response.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
  }

  const { page, pageSize } = paginationResult.data
  const filters = filtersResult.data

  // Use validated params...
}
```

## Business Constants

### Categories

```typescript
import { BOM_CATEGORIES, PRODUCT_CATEGORIES } from '@/models'

// BOM Categories
BOM_CATEGORIES.RAW_MATERIALS
BOM_CATEGORIES.COMPONENTS
BOM_CATEGORIES.PACKAGING
// ... more

// Product Categories
PRODUCT_CATEGORIES.FINISHED_GOODS
PRODUCT_CATEGORIES.SUB_ASSEMBLIES
// ... more
```

### Financial Rules

```typescript
import {
  DEFAULT_OVERHEAD_RATE,
  DEFAULT_TARGET_MARGIN,
  DEFAULT_LABOR_COST_PER_HOUR,
  COST_VARIANCE_THRESHOLD
} from '@/models'

const DEFAULT_OVERHEAD_RATE = 0.25 // 25%
const DEFAULT_TARGET_MARGIN = 0.30 // 30%
const DEFAULT_LABOR_COST_PER_HOUR = 25.0
const COST_VARIANCE_THRESHOLD = 0.10 // 10%
```

### Inventory Rules

```typescript
import {
  DEFAULT_SAFETY_STOCK_PERCENTAGE,
  STOCK_HEALTH_THRESHOLDS,
  OVERSTOCK_THRESHOLD
} from '@/models'

const DEFAULT_SAFETY_STOCK_PERCENTAGE = 0.20 // 20%
const OVERSTOCK_THRESHOLD = 3.0 // 300% of reorder point

const STOCK_HEALTH_THRESHOLDS = {
  CRITICAL: 0.5,  // 50% of reorder point
  WARNING: 1.0,   // at reorder point
  HEALTHY: 1.5,   // 150% of reorder point
}
```

### Production Rules

```typescript
import {
  HOURS_PER_SHIFT,
  MAX_SHIFTS_PER_DAY,
  EFFICIENCY_THRESHOLDS,
  DEFECT_RATE_THRESHOLDS
} from '@/models'

const HOURS_PER_SHIFT = 8
const MAX_SHIFTS_PER_DAY = 3

const EFFICIENCY_THRESHOLDS = {
  EXCELLENT: 0.95,    // 95%+
  GOOD: 0.85,         // 85-95%
  ACCEPTABLE: 0.75,   // 75-85%
  POOR: 0.60,         // 60-75%
}

const DEFECT_RATE_THRESHOLDS = {
  EXCELLENT: 0.01,    // < 1%
  GOOD: 0.03,         // 1-3%
  ACCEPTABLE: 0.05,   // 3-5%
  POOR: 0.10,         // 5-10%
}
```

### Helper Functions

```typescript
import {
  calculateSafetyStock,
  calculateSuggestedPrice,
  getStockHealthStatus,
  getEfficiencyRating
} from '@/models'

// Calculate safety stock from reorder point
const safetyStock = calculateSafetyStock(100) // 20 (20% of 100)

// Calculate price from cost and margin
const price = calculateSuggestedPrice(70, 0.3) // 100 (70 / 0.7)

// Get stock health status
const status = getStockHealthStatus(45, 100) // 'CRITICAL' (45% of reorder point)

// Get efficiency rating
const rating = getEfficiencyRating(0.92) // 'Good'
```

## Validation Limits

```typescript
import { VALIDATION_LIMITS } from '@/models'

VALIDATION_LIMITS.MAX_PART_NUMBER_LENGTH  // 50
VALIDATION_LIMITS.MAX_SKU_LENGTH           // 50
VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH   // 500
VALIDATION_LIMITS.MAX_UNIT_COST            // 1,000,000
VALIDATION_LIMITS.MAX_QUANTITY             // 1,000,000
VALIDATION_LIMITS.MAX_CSV_ROWS             // 10,000
```

## Error and Success Messages

```typescript
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/models'

// Error messages
ERROR_MESSAGES.PART_NUMBER_EXISTS
ERROR_MESSAGES.INSUFFICIENT_STOCK
ERROR_MESSAGES.SCHEDULE_CONFLICT

// Success messages
SUCCESS_MESSAGES.CREATED
SUCCESS_MESSAGES.UPDATED
SUCCESS_MESSAGES.ALERT_RESOLVED
```

## Best Practices

### 1. Always Validate API Inputs

```typescript
// Good ✓
const result = CreateProductInputSchema.safeParse(body)
if (!result.success) {
  return Response.json({ error: result.error }, { status: 400 })
}
const product = await prisma.product.create({ data: result.data })

// Bad ✗
const product = await prisma.product.create({ data: body })
```

### 2. Use Type Inference

```typescript
// Good ✓
import type { BomItem, CreateBomItemInput } from '@/models'

function processBomItem(item: BomItem) { ... }
function createBomItem(input: CreateBomItemInput) { ... }

// Bad ✗
function processBomItem(item: any) { ... }
```

### 3. Use Constants Instead of Magic Values

```typescript
// Good ✓
import { PRIORITY_LEVELS, DEFAULT_TARGET_MARGIN } from '@/models'

const order = { priority: PRIORITY_LEVELS.HIGH }
const product = { targetMargin: DEFAULT_TARGET_MARGIN }

// Bad ✗
const order = { priority: 'high' }  // Typo-prone
const product = { targetMargin: 0.3 }  // Magic number
```

### 4. Leverage Helper Functions

```typescript
// Good ✓
import { calculateSafetyStock, getStockHealthStatus } from '@/models'

const safetyStock = calculateSafetyStock(reorderPoint)
const status = getStockHealthStatus(currentStock, reorderPoint)

// Bad ✗
const safetyStock = Math.ceil(reorderPoint * 0.2)  // Duplicated logic
const status = currentStock < reorderPoint ? 'low' : 'ok'  // Incomplete
```

## Type Coverage

- **Base Models**: 13
- **Extended Types**: 5
- **Business Logic Types**: 10+
- **CSV Upload Types**: 7
- **API Response Types**: 4
- **Dashboard Types**: 4
- **Filter Types**: 6
- **Form Input Types**: 12+
- **Calculation Types**: 4
- **Report Types**: 3
- **Zod Schemas**: 50+
- **Constants**: 200+
- **Helper Functions**: 10+

## Migration from Old Models

The old `models/index.ts` file has been backed up to `models/index.ts.old`.

To migrate existing code:

```typescript
// Old import
import { ProductSchema } from '@/models/index'

// New import (same, but now in src/models)
import { ProductSchema } from '@/models'
```

The new location is `src/models/` instead of `models/`, which aligns with Next.js conventions and separates source code from configuration files.
