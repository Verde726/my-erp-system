# Financial System - Cost Tracking & Financial Analysis

## Overview

The Financial System provides comprehensive cost tracking, profitability analysis, and financial reporting for manufacturing operations. It integrates with inventory, production, and MRP modules to provide real-time financial insights.

## Features

### 1. **Material Cost Calculations**
- BOM-based cost rollup
- Per-unit material costs
- Component cost breakdown

### 2. **Production Cost Tracking**
- Material + overhead allocation
- Per-unit and total production costs
- Cost variance analysis

### 3. **Inventory Valuation**
- Real-time inventory value
- Category breakdown
- Detailed item-level valuation

### 4. **WIP (Work-In-Progress) Valuation**
- In-progress production value
- Material + proportional overhead
- Real-time WIP tracking

### 5. **Financial Snapshots**
- Daily financial summaries
- Inventory turnover metrics
- Cash flow impact analysis
- Trend detection with alerts

### 6. **Cost Variance Tracking**
- Estimated vs actual costs
- Favorable/unfavorable analysis
- Automatic alert generation

### 7. **Profitability Analysis**
- Gross margin calculations
- Target margin comparison
- Pricing recommendations

## Core Functions

### 1. calculateMaterialCostPerUnit()

Calculate total material cost to produce one unit of a product.

```typescript
import { calculateMaterialCostPerUnit } from '@/lib/financial-calculator'

const cost = await calculateMaterialCostPerUnit('prod-123')
console.log(`Material cost per unit: $${cost.toFixed(2)}`)
```

**Calculation:**
```
For each BOM component:
  component_cost = unit_cost × quantity_needed

material_cost_per_unit = Σ(component_cost)
```

**Example:**
```
Product: Widget A
BOM:
  - Steel Frame (PART-001): $5.00 × 2 = $10.00
  - Rubber Gasket (PART-002): $1.50 × 4 = $6.00
  - Screws (PART-003): $0.10 × 8 = $0.80

Total Material Cost = $16.80 per unit
```

### 2. calculateProductionCost()

Calculate complete production cost breakdown for a schedule.

```typescript
import { calculateProductionCost } from '@/lib/financial-calculator'

const breakdown = await calculateProductionCost('SCHED-001')

console.log(`Total units: ${breakdown.totalUnits}`)
console.log(`Material cost: $${breakdown.totalMaterialCost.toFixed(2)}`)
console.log(`Overhead: $${breakdown.overheadAllocation.toFixed(2)}`)
console.log(`Total cost: $${breakdown.totalProductionCost.toFixed(2)}`)
console.log(`Cost per unit: $${breakdown.costPerUnit.toFixed(2)}`)
```

**Calculation:**
```
material_cost_per_unit = calculateMaterialCostPerUnit(productId)
total_material_cost = material_cost_per_unit × total_units
overhead_allocation = total_material_cost × 15%
total_production_cost = total_material_cost + overhead
cost_per_unit = total_production_cost / total_units
```

**Return Type:**
```typescript
interface ProductionCostBreakdown {
  scheduleId: string
  productName: string
  productSku: string
  totalUnits: number
  materialCostPerUnit: number
  totalMaterialCost: number
  overheadAllocation: number  // 15% of material cost
  totalProductionCost: number
  costPerUnit: number
}
```

### 3. calculateInventoryValue()

Calculate total inventory value with category breakdown.

```typescript
import { calculateInventoryValue } from '@/lib/financial-calculator'

const valuation = await calculateInventoryValue()

console.log(`Total inventory value: $${valuation.totalValue.toLocaleString()}`)
console.log(`Raw materials: $${valuation.breakdown.rawMaterials.toLocaleString()}`)
console.log(`Components: $${valuation.breakdown.components.toLocaleString()}`)
console.log(`Item count: ${valuation.itemCount}`)

// Category breakdown
Object.entries(valuation.byCategory).forEach(([category, value]) => {
  console.log(`  ${category}: $${value.toLocaleString()}`)
})
```

**Calculation:**
```
For each BOM item:
  item_value = current_stock × unit_cost

total_value = Σ(item_value)
```

**Return Type:**
```typescript
interface InventoryValuation {
  totalValue: number
  breakdown: {
    rawMaterials: number
    components: number
    finishedGoods: number
  }
  byCategory: Record<string, number>
  itemCount: number
  items: Array<{
    partNumber: string
    description: string
    category: string
    currentStock: number
    unitCost: number
    totalValue: number
  }>
}
```

### 4. calculateWIPValue()

Calculate value of work-in-progress production.

```typescript
import { calculateWIPValue } from '@/lib/financial-calculator'

const wipValue = await calculateWIPValue()
console.log(`WIP value: $${wipValue.toLocaleString()}`)
```

**Calculation:**
```
For each in-progress schedule:
  material_cost = material_cost_per_unit × total_units
  overhead = material_cost × 15%
  wip_value = material_cost + overhead

total_wip = Σ(wip_value)
```

### 5. calculateFinancialSnapshot()

Generate comprehensive financial snapshot.

```typescript
import { calculateFinancialSnapshot, storeFinancialSnapshot } from '@/lib/financial-calculator'

const snapshot = await calculateFinancialSnapshot()

// Store in database
await storeFinancialSnapshot(snapshot)

console.log('Financial Snapshot:')
console.log(`Total Inventory: $${snapshot.totalInventoryValue.toLocaleString()}`)
console.log(`WIP: $${snapshot.wipValue.toLocaleString()}`)
console.log(`Inventory Turnover: ${snapshot.inventoryTurnoverRatio.toFixed(2)}x`)
console.log(`Days on Hand: ${snapshot.daysOfInventoryOnHand.toFixed(0)} days`)
```

**Aggregates:**
- Inventory valuation (all categories)
- WIP value (in-progress schedules)
- Completed production value (last 30 days)
- Projected costs (next 30 days)
- Inventory turnover ratio
- Days of inventory on hand
- Cash flow impact

**Return Type:**
```typescript
interface FinancialSnapshot {
  date: Date
  totalInventoryValue: number
  rawMaterialsValue: number
  componentsValue: number
  finishedGoodsValue: number
  wipValue: number
  completedProductionValue: number
  totalMaterialCost: number
  totalProductionCost: number
  projectedCosts30Days: number
  costBreakdown: Array<{
    category: string
    value: number
    percentage: number
  }>
  inventoryTurnoverRatio: number
  daysOfInventoryOnHand: number
  averageDailyProductionCost: number
  cashFlowImpact: {
    materialsPurchased: number
    productionCompleted: number
    netChange: number
  }
}
```

**Metrics Explained:**

**Inventory Turnover Ratio:**
```
turnover_ratio = annual_production_cost / current_inventory_value
```
Higher is better (inventory moves faster).

**Days of Inventory on Hand:**
```
days_on_hand = 365 / turnover_ratio
```
Lower is better (less capital tied up).

### 6. trackCostVariance()

Track variance between estimated and actual production costs.

```typescript
import { trackCostVariance } from '@/lib/financial-calculator'

const variance = await trackCostVariance('SCHED-001', {
  materialCost: 15200,
  laborCost: 3500,
  overheadCost: 2100
})

if (variance.isSignificant) {
  console.log(`⚠ Significant variance detected: ${variance.totalVariancePercent.toFixed(1)}%`)
  console.log(`${variance.isFavorable ? 'Under' : 'Over'} budget by $${Math.abs(variance.totalVariance).toFixed(2)}`)
}

if (variance.alertCreated) {
  console.log('Alert created for finance team review')
}
```

**Calculation:**
```
material_variance = estimated_material - actual_material
labor_variance = 0 - actual_labor (no estimated labor)
overhead_variance = estimated_overhead - actual_overhead
total_variance = estimated_total - actual_total

variance_percent = (variance / estimated) × 100
is_favorable = variance > 0 (under budget)
is_significant = |variance_percent| > 10%
```

**Alert Generation:**
- Created if variance > 10%
- Severity: `critical` if > 25%, `warning` otherwise
- Includes detailed cost breakdown

### 7. calculateProductProfitability()

Analyze product profitability at a given selling price.

```typescript
import { calculateProductProfitability } from '@/lib/financial-calculator'

const analysis = await calculateProductProfitability('prod-123', 49.99)

console.log(`Product: ${analysis.productName}`)
console.log(`Total cost: $${analysis.totalCostPerUnit.toFixed(2)}`)
console.log(`Selling price: $${analysis.sellingPrice.toFixed(2)}`)
console.log(`Gross margin: ${analysis.grossMarginPercent.toFixed(1)}%`)
console.log(`Target margin: ${analysis.targetMargin.toFixed(1)}%`)
console.log(`Meets target: ${analysis.meetsTarget ? 'YES' : 'NO'}`)

if (!analysis.meetsTarget) {
  console.log('\nRecommendations:')
  analysis.recommendations.forEach(rec => console.log(`  - ${rec}`))
}
```

**Calculation:**
```
material_cost = calculateMaterialCostPerUnit(productId)
overhead = material_cost × 15%
total_cost = material_cost + overhead

gross_margin_$ = selling_price - total_cost
gross_margin_% = (gross_margin_$ / selling_price) × 100

margin_variance = gross_margin_% - target_margin
meets_target = gross_margin_% ≥ target_margin
```

**Recommendations Generated:**
- Increase selling price to meet target
- Reduce production costs
- Overhead reduction initiatives
- Target met confirmation

## API Endpoints

### 1. GET /api/financial/snapshot

Retrieve financial snapshot for a date.

```bash
# Get today's snapshot (calculated on-the-fly)
GET /api/financial/snapshot

# Get snapshot for specific date
GET /api/financial/snapshot?date=2025-01-15
```

**Response:**
```json
{
  "source": "database",
  "date": "2025-01-15T00:00:00Z",
  "data": {
    "totalInventoryValue": 245000,
    "wipValue": 18500,
    "finishedGoodsValue": 0,
    "totalMaterialCost": 245000,
    "productionCostEst": 52000,
    "createdAt": "2025-01-15T00:01:00Z"
  }
}
```

### 2. POST /api/financial/snapshot

Generate new financial snapshot.

```bash
POST /api/financial/snapshot
Content-Type: application/json

{
  "storeInDatabase": true,
  "compareWithPrevious": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Financial snapshot generated successfully",
  "snapshot": { /* full snapshot data */ },
  "comparison": {
    "previousDate": "2025-01-14T00:00:00Z",
    "inventoryChange": 5000,
    "inventoryChangePercent": 2.08,
    "wipChange": -2000,
    "wipChangePercent": -9.76,
    "isSignificantChange": false
  },
  "stored": true
}
```

### 3. POST /api/financial/cost-variance

Track cost variance for a production schedule.

```bash
POST /api/financial/cost-variance
Content-Type: application/json

{
  "scheduleId": "SCHED-001",
  "actualCosts": {
    "materialCost": 15200,
    "laborCost": 3500,
    "overheadCost": 2100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduleId": "SCHED-001",
    "productName": "Widget A",
    "estimatedMaterialCost": 16800,
    "estimatedOverheadCost": 2520,
    "estimatedTotalCost": 19320,
    "actualMaterialCost": 15200,
    "actualLaborCost": 3500,
    "actualOverheadCost": 2100,
    "actualTotalCost": 20800,
    "materialVariance": 1600,
    "materialVariancePercent": 9.52,
    "laborVariance": -3500,
    "laborVariancePercent": 0,
    "overheadVariance": 420,
    "overheadVariancePercent": 16.67,
    "totalVariance": -1480,
    "totalVariancePercent": -7.66,
    "isFavorable": false,
    "isSignificant": false,
    "alertCreated": false
  }
}
```

### 4. GET /api/financial/profitability

Analyze product profitability.

```bash
GET /api/financial/profitability?productId=prod-123&sellingPrice=49.99
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod-123",
    "productName": "Widget A",
    "productSku": "WGT-A-001",
    "materialCostPerUnit": 16.80,
    "overheadPerUnit": 2.52,
    "totalCostPerUnit": 19.32,
    "sellingPrice": 49.99,
    "grossMarginDollars": 30.67,
    "grossMarginPercent": 61.36,
    "targetMargin": 30.0,
    "marginVariance": 31.36,
    "meetsTarget": true,
    "recommendations": [
      "Product meets target margin of 30.0%"
    ]
  }
}
```

### 5. GET /api/financial/inventory-value

Get current inventory valuation.

```bash
# Inventory only
GET /api/financial/inventory-value

# Include WIP
GET /api/financial/inventory-value?includeWIP=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": {
      "totalValue": 245000,
      "breakdown": {
        "rawMaterials": 80000,
        "components": 150000,
        "finishedGoods": 15000
      },
      "byCategory": {
        "Raw Materials": 80000,
        "Components": 120000,
        "Parts": 30000,
        "Finished Goods": 15000
      },
      "itemCount": 45,
      "items": [ /* array of all items */ ]
    },
    "wip": {
      "value": 18500,
      "included": true
    },
    "totalValue": 263500
  }
}
```

## Daily Financial Snapshot Job

### Configuration

The system includes an automated daily financial snapshot job that runs at midnight.

**Schedule:** `0 0 * * *` (midnight daily)

**Location:** `src/lib/jobs/daily-financial-snapshot.ts`

### What It Does

1. **Calculate Snapshot**: Calls `calculateFinancialSnapshot()`
2. **Store in Database**: Saves to `FinancialMetrics` table
3. **Compare with Previous Day**: Detects changes
4. **Generate Alerts**: If change > 15%
5. **Log Execution**: Success/failure tracking

### Starting the Job

```typescript
// In your app startup (e.g., src/app/layout.tsx or server.ts)
import { startDailyFinancialSnapshotJob } from '@/lib/jobs/daily-financial-snapshot'

// Start the cron job
startDailyFinancialSnapshotJob()
```

### Manual Execution

```typescript
import { runNow } from '@/lib/jobs/daily-financial-snapshot'

// Run immediately for testing
await runNow()
```

### Error Handling

The job includes comprehensive error handling:

- **Missing Cost Data**: Skips schedules with missing BOM
- **Division by Zero**: Safe handling of empty datasets
- **Database Errors**: Rollback and logging
- **Alert Creation**: Critical alert if job fails

### Alert Generation

Alerts are created when:
- **Inventory change > 15%**: Warning or critical severity
- **WIP change > 15%**: Warning or critical severity
- **Job failure**: Critical alert for manual intervention

## Financial Metrics

### Overhead Allocation

**Rate:** 15% of material cost

**Formula:**
```
overhead = material_cost × 0.15
```

**Rationale:** Covers indirect costs like utilities, depreciation, admin, etc.

### Inventory Turnover Ratio

**Formula:**
```
turnover_ratio = annual_production_cost / current_inventory_value
```

**Benchmarks:**
- **Manufacturing**: 4-8x annually
- **High-volume**: 10-15x
- **Low-volume**: 2-4x

**Example:**
```
Annual production cost: $1,200,000
Current inventory: $300,000
Turnover ratio: 1,200,000 / 300,000 = 4x
```

### Days of Inventory on Hand

**Formula:**
```
days_on_hand = 365 / turnover_ratio
```

**Benchmarks:**
- **Just-in-time**: 30-45 days
- **Standard**: 60-90 days
- **High safety stock**: 120+ days

**Example:**
```
Turnover ratio: 4x
Days on hand: 365 / 4 = 91 days
```

### Gross Margin

**Formula:**
```
gross_margin_% = ((selling_price - total_cost) / selling_price) × 100
```

**Benchmarks:**
- **Low-margin**: 10-20%
- **Standard**: 30-40%
- **High-margin**: 50%+

**Example:**
```
Selling price: $50
Total cost: $20
Gross margin: ((50 - 20) / 50) × 100 = 60%
```

## Use Cases

### 1. Daily Financial Review

```typescript
// Generate daily snapshot
const snapshot = await calculateFinancialSnapshot()
await storeFinancialSnapshot(snapshot)

// Review key metrics
console.log('Daily Financial Summary:')
console.log(`Inventory Value: $${snapshot.totalInventoryValue.toLocaleString()}`)
console.log(`WIP Value: $${snapshot.wipValue.toLocaleString()}`)
console.log(`Turnover Ratio: ${snapshot.inventoryTurnoverRatio.toFixed(2)}x`)
console.log(`Days on Hand: ${snapshot.daysOfInventoryOnHand.toFixed(0)} days`)
console.log(`Avg Daily Cost: $${snapshot.averageDailyProductionCost.toLocaleString()}`)
```

### 2. Production Cost Estimation

```typescript
// Before scheduling production
const cost = await calculateProductionCost('SCHED-DRAFT-001')

console.log(`Production Cost Estimate:`)
console.log(`Units: ${cost.totalUnits}`)
console.log(`Material: $${cost.totalMaterialCost.toFixed(2)}`)
console.log(`Overhead: $${cost.overheadAllocation.toFixed(2)}`)
console.log(`Total: $${cost.totalProductionCost.toFixed(2)}`)
console.log(`Per Unit: $${cost.costPerUnit.toFixed(2)}`)

// Approve or reject based on cost
if (cost.costPerUnit > targetCost) {
  console.log(`⚠ Cost exceeds target of $${targetCost}`)
}
```

### 3. Product Pricing

```typescript
// Analyze profitability at different price points
const pricePoints = [39.99, 44.99, 49.99, 54.99]

for (const price of pricePoints) {
  const analysis = await calculateProductProfitability('prod-123', price)

  console.log(`\nPrice: $${price}`)
  console.log(`  Margin: ${analysis.grossMarginPercent.toFixed(1)}%`)
  console.log(`  Meets Target: ${analysis.meetsTarget ? 'YES' : 'NO'}`)

  if (analysis.meetsTarget) {
    console.log(`  ✓ Optimal price point`)
    break
  }
}
```

### 4. Post-Production Variance Analysis

```typescript
// After production completes
const variance = await trackCostVariance('SCHED-001', {
  materialCost: actualMaterialCost,
  laborCost: actualLaborCost,
  overheadCost: actualOverheadCost
})

if (variance.isSignificant) {
  console.log(`Variance Report:`)
  console.log(`Total Variance: ${variance.isFavorable ? '+' : '-'}$${Math.abs(variance.totalVariance).toFixed(2)} (${Math.abs(variance.totalVariancePercent).toFixed(1)}%)`)

  if (!variance.isFavorable) {
    console.log(`\nCost Overrun Analysis:`)
    console.log(`  Material: ${variance.materialVariancePercent.toFixed(1)}%`)
    console.log(`  Labor: $${variance.actualLaborCost.toFixed(2)}`)
    console.log(`  Overhead: ${variance.overheadVariancePercent.toFixed(1)}%`)
  }
}
```

## Database Schema

### FinancialMetrics Table

```prisma
model FinancialMetrics {
  id                  String   @id @default(cuid())
  date                DateTime @unique
  totalInventoryValue Float
  wipValue            Float
  finishedGoodsValue  Float
  totalMaterialCost   Float
  productionCostEst   Float
  createdAt           DateTime @default(now())

  @@index([date])
}
```

**Purpose:** Store daily financial snapshots for historical analysis and trending.

## Integration Points

### With Inventory System

```typescript
// When inventory changes, recalculate value
await recordInventoryMovement(...)
const newValue = await calculateInventoryValue()
```

### With Production System

```typescript
// When production completes
await decrementInventoryForProduction(scheduleId, units)
const wipValue = await calculateWIPValue() // WIP decreases
```

### With MRP System

```typescript
// When creating production schedule
const mrpResults = await calculateMRP(scheduleId)
const costEstimate = await calculateProductionCost(scheduleId)
// Compare material availability with cost impact
```

## Best Practices

### 1. Run Daily Snapshots

```typescript
// Ensure cron job is running
startDailyFinancialSnapshotJob()

// Or trigger manually
await runNow()
```

### 2. Track All Cost Variances

```typescript
// After every production completion
await trackCostVariance(scheduleId, actualCosts)
```

### 3. Validate Profitability Before Quoting

```typescript
const analysis = await calculateProductProfitability(productId, proposedPrice)
if (!analysis.meetsTarget) {
  console.warn('Price does not meet target margin')
}
```

### 4. Monitor Inventory Turnover

```typescript
const snapshot = await calculateFinancialSnapshot()
if (snapshot.daysOfInventoryOnHand > 120) {
  console.warn('High inventory levels - consider reducing stock')
}
```

### 5. Review WIP Regularly

```typescript
const wipValue = await calculateWIPValue()
if (wipValue > inventoryValue * 0.5) {
  console.warn('High WIP - production bottleneck possible')
}
```

## Future Enhancements

- [ ] Multi-currency support
- [ ] Standard costing vs actual costing
- [ ] Variance analysis trending
- [ ] Cost driver analysis (ABC costing)
- [ ] Budget vs actual tracking
- [ ] Financial forecasting models
- [ ] Email notifications for financial alerts
- [ ] Custom overhead allocation rules
- [ ] Job costing for custom orders
- [ ] Export to accounting systems (QuickBooks, Xero)

## References

- **Overhead Allocation**: Manufacturing Accounting Principles
- **Inventory Turnover**: APICS CPIM Standards
- **Gross Margin**: GAAP Financial Reporting
- **WIP Valuation**: Manufacturing Cost Accounting Standards
