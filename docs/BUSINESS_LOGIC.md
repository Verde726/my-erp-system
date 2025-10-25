# Business Logic Documentation

Comprehensive guide to the core business logic, algorithms, and formulas used in the ERP/MRP system.

## Overview

This document explains the mathematical models, algorithms, and business rules implemented in the system's core calculation engines.

## Table of Contents

1. [Material Requirements Planning (MRP)](#material-requirements-planning-mrp)
2. [Production Scheduling](#production-scheduling)
3. [Inventory Management](#inventory-management)
4. [Financial Calculations](#financial-calculations)
5. [Throughput Analysis](#throughput-analysis)
6. [Alert Generation](#alert-generation)

---

## Material Requirements Planning (MRP)

**Module**: `src/lib/mrp-calculator.ts`

### Overview

MRP is a time-phased planning methodology that calculates material requirements based on production schedules and bill of materials (BOM). The system implements a sophisticated MRP algorithm with EOQ optimization and safety stock calculations.

### MRP Calculation Process

#### Step 1: BOM Explosion

**Purpose**: Determine component requirements for finished goods.

**Formula**:
```
Gross Requirement = BOM Quantity per Unit × Total Units to Produce
```

**Example**:
- Product: Widget Assembly
- BOM: 2 Bolts per Widget
- Production Schedule: 1000 Widgets over 5 days (200/day)
- **Gross Requirement**: 2 × 1000 = 2000 Bolts

**Implementation**:
```typescript
for (const bomEntry of product.bom) {
  const grossRequirement = bomEntry.quantityNeeded * totalUnitsToProduced
}
```

---

#### Step 2: Inventory Netting

**Purpose**: Calculate net requirements by subtracting available inventory.

**Formulas**:
```
Available Stock = Current Stock - Allocated Stock
Net Requirement = max(0, Gross Requirement - Available Stock)
```

**Allocated Stock**: Inventory reserved for other production schedules.

**Example**:
- Gross Requirement: 2000 Bolts
- Current Stock: 500 Bolts
- Allocated Stock: 0 Bolts
- Available Stock: 500 Bolts
- **Net Requirement**: max(0, 2000 - 500) = 1500 Bolts

**Implementation**:
```typescript
const availableStock = Math.max(0, currentStock - allocatedStock)
const netRequirement = Math.max(0, grossRequirement - availableStock)
```

---

#### Step 3: Order Quantity Calculation

**Purpose**: Determine optimal order quantity balancing ordering costs and holding costs.

**Method**: Hybrid approach using Economic Order Quantity (EOQ) with safety stock considerations.

**Formula**:
```
Planned Order Quantity = {
  If EOQ reasonable: EOQ
  Else: Net Requirement + Safety Stock
}
```

**EOQ (Wilson Formula)**:
```
EOQ = √(2 × D × S / H)

Where:
  D = Annual demand
  S = Ordering cost per order ($50 default)
  H = Holding cost per unit per year (25% of unit cost)
```

**Example**:
- Net Requirement: 1500 Bolts
- Unit Cost: $0.25
- Annual Demand: 75,000 Bolts (estimated)
- Ordering Cost: $50
- Holding Cost: $0.25 × 0.25 = $0.0625/year

```
EOQ = √(2 × 75000 × 50 / 0.0625)
    = √(120,000,000)
    = 10,954 units
```

Since EOQ (10,954) >> Net Requirement (1,500), use minimum order:
```
Planned Order Quantity = Net Requirement + Safety Stock
                       = 1500 + 100
                       = 1600 Bolts
```

**Implementation**:
```typescript
const minimumOrder = netRequirement + safetyStock
const annualizedDemand = netRequirement * (WORKING_DAYS_PER_YEAR / leadTimeDays)
const eoq = calculateEOQ(annualizedDemand, orderingCost, holdingCostPerUnit)

if (eoq > minimumOrder && eoq < minimumOrder * 3) {
  return Math.ceil(eoq)
}
return Math.ceil(minimumOrder)
```

---

#### Step 4: Order Date Calculation

**Purpose**: Determine when to place order based on lead time.

**Formula**:
```
Planned Order Date = Production Start Date - Lead Time Days
Expected Delivery Date = Planned Order Date + Lead Time Days
```

**Example**:
- Production Start: February 1, 2025
- Lead Time: 7 days
- **Planned Order Date**: January 25, 2025
- **Expected Delivery**: February 1, 2025

**Order Date in Past Check**:
```
If Planned Order Date < Today:
  Warning: "Order should have been placed on [date]"
  Recommendation: "Expedite delivery or adjust production schedule"
```

**Implementation**:
```typescript
const plannedOrderDate = new Date(schedule.startDate)
plannedOrderDate.setDate(plannedOrderDate.getDate() - bomItem.leadTimeDays)

const expectedDeliveryDate = new Date(plannedOrderDate)
expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + bomItem.leadTimeDays)

const orderDateInPast = plannedOrderDate < new Date()
```

---

#### Step 5: Status Determination

**Purpose**: Classify material availability status.

**Logic**:
```
Status = {
  'sufficient':  Net Requirement = 0
  'shortage':    0 < Net Requirement < 50% of Gross Requirement
  'critical':    Net Requirement ≥ 50% of Gross Requirement
}
```

**Example**:
- Net Requirement: 1500
- Gross Requirement: 2000
- Percentage: 1500/2000 = 75%
- **Status**: critical (≥50%)

**Implementation**:
```typescript
const CRITICAL_SHORTAGE_THRESHOLD = 0.5

let status: 'sufficient' | 'shortage' | 'critical'
if (netRequirement === 0) {
  status = 'sufficient'
} else if (netRequirement < grossRequirement * CRITICAL_SHORTAGE_THRESHOLD) {
  status = 'shortage'
} else {
  status = 'critical'
}
```

---

### Safety Stock Calculation

**Purpose**: Buffer inventory to prevent stockouts due to demand/supply variability.

**Method**: Standard deviation method with service level Z-score.

**Formula**:
```
Safety Stock = Z × σ_LT

Where:
  Z = Service level Z-score (1.65 for 95% service level)
  σ_LT = Demand standard deviation during lead time
  σ_LT ≈ √(Lead Time) × Daily Demand × Variance Coefficient (0.2)
```

**Service Level Table**:
| Service Level | Z-Score |
|---------------|---------|
| 90% | 1.28 |
| 95% | 1.65 |
| 97% | 1.88 |
| 99% | 2.33 |

**Example**:
- Average Daily Demand: 100 units
- Lead Time: 7 days
- Service Level: 95% (Z = 1.65)
- Variance: 20% of average

```
Demand Std Dev = 100 × 0.2 = 20 units
σ_LT = 20 × √7 = 52.9 units
Safety Stock = 1.65 × 52.9 = 87.3 ≈ 88 units
```

**Implementation**:
```typescript
export function calculateSafetyStock(
  averageDailyDemand: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95
): number {
  const zScore = SERVICE_LEVEL_Z_SCORE // 1.65 for 95%
  const demandStdDev = averageDailyDemand * 0.2
  const safetyStock = zScore * demandStdDev * Math.sqrt(leadTimeDays)
  return Math.ceil(safetyStock)
}
```

---

### Reorder Point Calculation

**Purpose**: Trigger point for placing new orders.

**Formula**:
```
Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
```

**Example**:
- Average Daily Demand: 100 units/day
- Lead Time: 7 days
- Safety Stock: 88 units

```
Reorder Point = (100 × 7) + 88
              = 700 + 88
              = 788 units
```

**Business Rule**: Generate reorder alert when `Current Stock ≤ Reorder Point`

---

## Production Scheduling

**Module**: `src/lib/production-planner.ts`

### Overview

The production planner generates optimal production schedules from sales forecasts, considering capacity constraints, priorities, and historical throughput data.

### Scheduling Algorithm

#### Step 1: Demand Aggregation

**Purpose**: Consolidate sales orders by product.

**Process**:
1. Filter sales orders by date range and priority
2. Group by productId
3. Calculate total units, earliest/latest due dates
4. Determine highest priority

**Example**:
- Order 1: 500 units, Feb 1, High priority
- Order 2: 300 units, Feb 5, Medium priority
- Order 3: 200 units, Feb 10, High priority

**Aggregated**:
- Total Units: 1000
- Earliest Due: Feb 1
- Latest Due: Feb 10
- Highest Priority: High

**Implementation**:
```typescript
const demandMap = new Map<string, ProductDemand>()
for (const order of salesOrders) {
  const existing = demandMap.get(productId)
  if (existing) {
    existing.totalUnits += order.forecastedUnits
    existing.orderCount++
    // Update dates and priority
  }
}
```

---

#### Step 2: Capacity Estimation

**Purpose**: Estimate production capacity based on historical performance.

**Data Source**: ThroughputData table (last 90 days)

**Formulas**:
```
Average Units Per Hour = Total Units Produced / Total Hours Worked
Average Units Per Day = Average Units Per Hour × 8 hours
Effective Units Per Day = Average Units Per Day × Average Efficiency
```

**Example**:
- Last 30 days data:
  - Total Units: 6000
  - Total Hours: 240
  - Average Efficiency: 0.85

```
Avg Units/Hour = 6000 / 240 = 25 units/hour
Avg Units/Day = 25 × 8 = 200 units/day
Effective = 200 × 0.85 = 170 units/day
```

**Implementation**:
```typescript
const totalUnits = throughputData.reduce((sum, d) => sum + d.unitsProduced, 0)
const totalHours = throughputData.reduce((sum, d) => sum + d.hoursWorked, 0)
const avgEfficiency = throughputData.reduce((sum, d) => sum + d.efficiency, 0) / count

const avgUnitsPerHour = totalUnits / totalHours
const avgUnitsPerDay = avgUnitsPerHour * 8
const effectiveUnitsPerDay = avgUnitsPerDay * avgEfficiency
```

---

#### Step 3: Days Required Calculation

**Purpose**: Calculate production duration needed.

**Formula**:
```
Days Required = ceil(Total Units / Effective Units Per Day)
```

**Example**:
- Total Units: 1000
- Effective Units/Day: 170
- **Days Required**: ceil(1000 / 170) = 6 days

**Multi-Shift Adjustment**:
```
Units Per Day (multi-shift) = Effective Units Per Day × Shifts Per Day
Days Required = ceil(Total Units / Multi-Shift Units Per Day)
```

**Implementation**:
```typescript
const unitsPerDay = unitsPerDayPerShift * shiftsPerDay
const effectiveUnitsPerDay = unitsPerDay * efficiency
const daysRequired = Math.ceil(totalUnits / effectiveUnitsPerDay)
```

---

#### Step 4: Capacity Utilization

**Purpose**: Measure how fully capacity is utilized.

**Formula**:
```
Capacity Utilization = (Total Units / Days Required) / Units Per Day
```

**Thresholds**:
- **< 70%**: Underutilized (consider consolidating)
- **70-90%**: Optimal range
- **90-95%**: High utilization (warning)
- **> 95%**: Over capacity (risk of delays)

**Example**:
- Total Units: 1000
- Days Required: 6
- Units Per Day: 200

```
Actual Daily Rate = 1000 / 6 = 166.67 units/day
Utilization = 166.67 / 200 = 0.833 = 83.3%
```

**Implementation**:
```typescript
const capacityUtilization = (totalUnits / daysRequired) / unitsPerDay

if (capacityUtilization > 0.95) {
  warnings.push('Capacity exceeded - risk of delays')
} else if (capacityUtilization > 0.90) {
  warnings.push('High utilization - limited buffer')
}
```

---

#### Step 5: Conflict Detection

**Purpose**: Identify scheduling conflicts and capacity issues.

**Types of Conflicts**:

1. **Workstation Overlap**:
   ```
   Schedule A: WS-001, Feb 1-5
   Schedule B: WS-001, Feb 3-7
   → CONFLICT: Overlapping dates on same workstation
   ```

2. **Capacity Exceeded**:
   ```
   Utilization > 95%
   → WARNING: Risk of production delays
   ```

3. **Date Conflict**:
   ```
   Production End Date > Latest Due Date
   → WARNING: Cannot meet customer deadline
   ```

**Overlap Detection Algorithm**:
```
Dates Overlap = (Start1 ≤ End2) AND (Start2 ≤ End1)
```

**Implementation**:
```typescript
function datesOverlap(start1, end1, start2, end2): boolean {
  return start1 <= end2 && start2 <= end1
}

for (let i = 0; i < schedules.length; i++) {
  for (let j = i + 1; j < schedules.length; j++) {
    if (schedules[i].workstationId === schedules[j].workstationId &&
        datesOverlap(schedules[i].startDate, schedules[i].endDate,
                     schedules[j].startDate, schedules[j].endDate)) {
      conflicts.push({ type: 'workstation_overlap', severity: 'critical' })
    }
  }
}
```

---

## Inventory Management

**Module**: `src/lib/inventory-manager.ts`

### Inventory Decrementation

**Purpose**: Atomically reduce inventory when production completes.

**Process** (Database Transaction):
1. Validate production schedule exists
2. Explode BOM to get component list
3. For each component:
   a. Calculate quantity used
   b. Verify sufficient stock
   c. Update BomItem.currentStock
   d. Create InventoryMovement audit record
   e. Check reorder point
4. Update ProductionSchedule.actualUnitsProduced

**Formula**:
```
Quantity Used = BOM Quantity per Unit × Actual Units Produced
New Stock = Current Stock - Quantity Used
```

**Example**:
- BOM: 2 Bolts per Widget
- Actual Production: 980 Widgets
- Current Stock: 2000 Bolts

```
Quantity Used = 2 × 980 = 1960 Bolts
New Stock = 2000 - 1960 = 40 Bolts
```

**Reorder Check**:
```
If New Stock ≤ Reorder Point:
  Create reorder alert
  Severity = 'critical' if New Stock ≤ Safety Stock
```

**Implementation**:
```typescript
await prisma.$transaction(async (tx) => {
  for (const bomEntry of product.bom) {
    const quantityUsed = bomEntry.quantityNeeded * actualUnitsProduced

    if (previousStock < quantityUsed) {
      throw new Error('Insufficient inventory')
    }

    const newStock = previousStock - quantityUsed

    await tx.bomItem.update({
      where: { partNumber },
      data: { currentStock: newStock }
    })

    await tx.inventoryMovement.create({
      data: {
        partNumber,
        movementType: 'out',
        quantity: quantityUsed,
        previousStock,
        newStock,
        reference: scheduleId
      }
    })

    if (newStock <= reorderPoint) {
      await createReorderAlert(tx, partNumber, newStock)
    }
  }
})
```

---

### Reorder Quantity Calculation

**Purpose**: Recommend optimal order quantity when reorder point reached.

**Formula**:
```
Estimated Daily Usage = (Reorder Point - Safety Stock) / Lead Time
Recommended Order = (Lead Time × Daily Usage) + Safety Stock - Current Stock
Minimum Order = Reorder Point - Current Stock
```

**Example**:
- Reorder Point: 788 units
- Safety Stock: 88 units
- Lead Time: 7 days
- Current Stock: 40 units

```
Daily Usage = (788 - 88) / 7 = 100 units/day
Recommended = (7 × 100) + 88 - 40 = 748 units
Minimum = 788 - 40 = 748 units
```

**Implementation**:
```typescript
function calculateReorderQuantity(
  reorderPoint: number,
  safetyStock: number,
  leadTimeDays: number,
  currentStock: number
): number {
  const estimatedDailyUsage = (reorderPoint - safetyStock) / leadTimeDays
  const recommended = leadTimeDays * estimatedDailyUsage + safetyStock - currentStock
  const minimum = reorderPoint - currentStock
  return Math.ceil(Math.max(recommended, minimum, 0))
}
```

---

## Financial Calculations

**Module**: `src/lib/financial-calculator.ts`

### Inventory Valuation

**Purpose**: Calculate total value of inventory on hand.

**Method**: Standard cost method (unit cost × quantity)

**Formula**:
```
Total Inventory Value = Σ (BomItem.currentStock × BomItem.unitCost)
```

**By Category**:
```
Category Value = Σ (currentStock × unitCost) for items in category
```

**Example**:
| Part | Stock | Unit Cost | Value |
|------|-------|-----------|-------|
| PN-1001 | 500 | $0.25 | $125.00 |
| PN-1002 | 1000 | $0.10 | $100.00 |
| PN-2001 | 50 | $15.00 | $750.00 |
| **Total** | | | **$975.00** |

**Implementation**:
```typescript
const items = await prisma.bomItem.findMany({
  select: { currentStock: true, unitCost: true, category: true }
})

const totalValue = items.reduce((sum, item) =>
  sum + (item.currentStock * item.unitCost), 0
)

const byCategory = items.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) +
    (item.currentStock * item.unitCost)
  return acc
}, {})
```

---

### Work-in-Progress (WIP) Valuation

**Purpose**: Calculate value of partially completed production.

**Formula**:
```
WIP Value = Σ (Schedule Units × Material Cost per Unit)
  for schedules with status 'in_progress'

Material Cost per Unit = Σ (BOM Qty × BOM Unit Cost)
```

**Example**:
- Product: Widget (material cost $10/unit)
- In Progress: 200 units

```
WIP Value = 200 × $10 = $2,000
```

**Implementation**:
```typescript
const inProgressSchedules = await prisma.productionSchedule.findMany({
  where: { status: 'in_progress' },
  include: {
    product: {
      include: { bom: { include: { bomItem: true } } }
    }
  }
})

let wipValue = 0
for (const schedule of inProgressSchedules) {
  const materialCostPerUnit = schedule.product.bom.reduce((sum, bomEntry) =>
    sum + (bomEntry.quantityNeeded * bomEntry.bomItem.unitCost), 0
  )
  wipValue += schedule.unitsToProducePerDay * materialCostPerUnit
}
```

---

### Cost Variance Analysis

**Purpose**: Detect cost trends and anomalies.

**Formula**:
```
Cost Variance = Current Total Cost - Previous Total Cost
Variance Percentage = (Variance / Previous Cost) × 100%
```

**Example**:
- Previous Day Cost: $142,500
- Current Day Cost: $140,000

```
Variance = $140,000 - $142,500 = -$2,500
Variance % = (-$2,500 / $142,500) × 100% = -1.75%
```

**Alert Threshold**: ±5% variance triggers warning

**Implementation**:
```typescript
const today = await prisma.financialMetrics.findUnique({
  where: { date: new Date() }
})
const yesterday = await prisma.financialMetrics.findUnique({
  where: { date: new Date(Date.now() - 86400000) }
})

const variance = today.totalCost - yesterday.totalCost
const variancePercent = (variance / yesterday.totalCost) * 100

if (Math.abs(variancePercent) > 5) {
  createAlert({
    alertType: 'cost_overrun',
    severity: 'warning',
    title: `Cost variance of ${variancePercent.toFixed(1)}% detected`
  })
}
```

---

### Profitability Analysis

**Purpose**: Calculate profit margins by product.

**Formulas**:
```
Material Cost = Σ (BOM Qty × BOM Unit Cost)
Revenue = Units Produced × Selling Price
Gross Profit = Revenue - Material Cost
Profit Margin = (Gross Profit / Revenue) × 100%
```

**Example**:
- Product: Widget
- Units Produced: 1000
- Material Cost/Unit: $10
- Selling Price: $25

```
Total Material Cost = 1000 × $10 = $10,000
Total Revenue = 1000 × $25 = $25,000
Gross Profit = $25,000 - $10,000 = $15,000
Profit Margin = ($15,000 / $25,000) × 100% = 60%
```

**Implementation**:
```typescript
const materialCost = product.bom.reduce((sum, bomEntry) =>
  sum + (bomEntry.quantityNeeded * bomEntry.bomItem.unitCost), 0
)

const revenue = unitsProduced * sellingPrice
const grossProfit = revenue - (materialCost * unitsProduced)
const profitMargin = (grossProfit / revenue) * 100
```

---

## Throughput Analysis

**Module**: `src/lib/throughput-analyzer.ts`

### Throughput Metrics

**Purpose**: Analyze production efficiency and capacity.

**Key Metrics**:

1. **Units Per Hour**:
   ```
   UPH = Units Produced / Hours Worked
   ```

2. **Efficiency**:
   ```
   Efficiency = Actual Output / Planned Output
   ```

3. **Defect Rate**:
   ```
   Defect Rate = Defective Units / Total Units Produced
   ```

4. **Overall Equipment Effectiveness (OEE)**:
   ```
   OEE = Availability × Performance × Quality

   Availability = Actual Runtime / Planned Runtime
   Performance = (Actual Output / Runtime) / Ideal Rate
   Quality = Good Units / Total Units
   ```

**Example**:
- Planned: 200 units in 8 hours
- Actual: 170 units in 8 hours
- Defects: 5 units

```
UPH = 170 / 8 = 21.25 units/hour
Efficiency = 170 / 200 = 0.85 = 85%
Defect Rate = 5 / 170 = 0.029 = 2.9%
```

**Implementation**:
```typescript
const uph = unitsProduced / hoursWorked
const efficiency = actualOutput / plannedOutput
const defectRate = defectiveUnits / totalUnits
const quality = goodUnits / totalUnits
```

---

## Alert Generation

**Module**: `src/lib/alert-manager.ts`

### Alert Types & Triggers

#### 1. Shortage Alert
**Trigger**: MRP calculation finds critical shortage

**Severity**:
- `critical`: Net requirement ≥ 50% of gross requirement
- `warning`: Net requirement < 50% of gross requirement

**Example**:
```
Gross Requirement: 2000 units
Net Requirement: 1500 units (75%)
→ CRITICAL shortage alert
```

---

#### 2. Reorder Alert
**Trigger**: Inventory falls to/below reorder point

**Severity**:
- `critical`: Current stock ≤ Safety stock
- `warning`: Safety stock < Current stock ≤ Reorder point

**Example**:
```
Current Stock: 40 units
Safety Stock: 88 units
Reorder Point: 788 units
→ CRITICAL reorder alert (below safety stock)
```

---

#### 3. Schedule Conflict Alert
**Trigger**: Workstation overlap detected

**Severity**: Always `critical`

**Example**:
```
Schedule A: WS-001, Feb 1-5
Schedule B: WS-001, Feb 3-7
→ CRITICAL schedule conflict
```

---

#### 4. Cost Variance Alert
**Trigger**: Daily cost variance exceeds ±5%

**Severity**: Always `warning`

**Example**:
```
Previous: $142,500
Current: $150,000
Variance: +5.3%
→ WARNING cost variance alert
```

---

#### 5. Capacity Warning
**Trigger**: Production schedule utilization > 90%

**Severity**: Always `warning`

**Example**:
```
Utilization: 95%
→ WARNING high capacity utilization
```

---

## Constants & Defaults

### MRP Constants
```typescript
DEFAULT_ORDERING_COST = $50 per order
DEFAULT_HOLDING_COST_RATE = 25% of unit cost per year
CRITICAL_SHORTAGE_THRESHOLD = 50% of gross requirement
WORKING_DAYS_PER_YEAR = 250 days
SERVICE_LEVEL_Z_SCORE = 1.65 (95% service level)
```

### Production Constants
```typescript
STANDARD_SHIFT_HOURS = 8 hours
SHIFTS_PER_DAY = 2 (configurable)
WORKING_DAYS_PER_WEEK = 5 days
CAPACITY_WARNING_THRESHOLD = 90%
CAPACITY_CRITICAL_THRESHOLD = 95%
```

### Financial Constants
```typescript
DEFAULT_TARGET_MARGIN = 30%
COST_VARIANCE_THRESHOLD = ±5%
INVENTORY_TURNOVER_TARGET = 12 times/year
```

---

**Last Updated**: 2025-01-24
**Related Modules**: mrp-calculator, production-planner, inventory-manager, financial-calculator, throughput-analyzer
