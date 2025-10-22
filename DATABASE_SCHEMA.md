# Database Schema Documentation

## Overview

This ERP/MRP system uses a comprehensive PostgreSQL database schema designed for manufacturing resource planning, inventory management, production scheduling, and financial tracking.

## Entity Relationship Diagram

```
┌─────────────────┐
│     Product     │ (Finished Goods)
│  - sku          │
│  - name         │
│  - category     │
│  - targetMargin │
└────┬────┬───┬───┘
     │    │   │
     │    │   └──────────────────┐
     │    │                      │
     │    └─────────┐            │
     │              │            │
     ▼              ▼            ▼
┌─────────┐   ┌──────────────┐  ┌──────────────┐
│SalesOrder│  │ProductionSched│  │ThroughputData│
│- orderId│   │- scheduleId  │  │- date        │
│- forecast│  │- workstation │  │- efficiency  │
└─────────┘   │- shiftNumber │  └──────────────┘
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │MaterialReq   │
              │- required    │
              │- allocated   │
              └──────┬───────┘
                     │
     ┌───────────────┴────────────┐
     │                            │
     ▼                            ▼
┌──────────┐                 ┌─────────┐
│ProductBom│◄────────────────┤ BomItem │ (Raw Materials)
│- quantity│                 │- partNum│
└──────────┘                 │- stock  │
                             │- cost   │
                             └────┬────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │InventoryMovement│
                          │- movementType │
                          │- quantity     │
                          │- timestamp    │
                          └───────────────┘

┌──────────────────┐        ┌────────┐
│FinancialMetrics  │        │ Alert  │
│- date            │        │- type  │
│- inventoryValue  │        │- severity│
│- wipValue        │        │- status│
└──────────────────┘        └────────┘
```

## Core Models

### 1. BomItem (Bill of Materials)

Raw materials, components, and parts inventory.

**Fields:**
- `partNumber` (unique) - Part identifier
- `description` - Part description
- `currentStock` - Current inventory level
- `unitCost` - Cost per unit
- `supplier` - Supplier name
- `reorderPoint` - Minimum stock level before reorder
- `leadTimeDays` - Supplier lead time
- `safetyStock` - Buffer inventory

**Relationships:**
- One-to-many with `ProductBom` (which products use this part)
- One-to-many with `MaterialRequirement` (production needs)
- One-to-many with `InventoryMovement` (audit trail)

**Indexes:**
- `category` - Quick filtering by part category
- `currentStock, reorderPoint` - Identify parts needing reorder

---

### 2. Product (Finished Goods)

Products manufactured and sold.

**Fields:**
- `sku` (unique) - Stock Keeping Unit
- `name` - Product name
- `category` - Product category
- `targetMargin` - Target profit margin (default 0.3 = 30%)

**Relationships:**
- One-to-many with `ProductBom` (parts needed to make this product)
- One-to-many with `SalesOrder` (demand forecasts)
- One-to-many with `ProductionSchedule` (production plans)
- One-to-many with `ThroughputData` (historical performance)

---

### 3. ProductBom (Bill of Materials Mapping)

Defines which parts are needed to manufacture each product.

**Fields:**
- `productId` - Foreign key to Product
- `partNumber` - Foreign key to BomItem
- `quantityNeeded` - How many units of this part per product

**Unique Constraint:** `[productId, partNumber]` - One entry per product-part combination

**Example:**
```
Product: "Widget A" (SKU: WDGT-A)
  ├─ Part: "Bolt-M5" × 4 units
  ├─ Part: "Plate-Steel" × 1 unit
  └─ Part: "Paint-Red" × 0.5 liters
```

---

### 4. SalesOrder (Demand Forecasting)

Sales forecasts and customer orders driving production planning.

**Fields:**
- `orderId` (unique) - Order identifier
- `productId` - Which product
- `forecastedUnits` - Expected demand
- `timePeriod` - When needed
- `priority` - Enum: high, medium, low
- `customerSegment` - Customer type (optional)
- `status` - Order status (default "pending")

**Indexes:**
- `productId` - Quick lookup by product
- `timePeriod` - Time-based queries
- `priority, status` - Filter urgent pending orders

---

### 5. ProductionSchedule (Production Planning)

Production schedules with workstation and shift allocation.

**Fields:**
- `scheduleId` (unique) - Schedule identifier
- `productId` - What to produce
- `unitsToProducePerDay` - Daily production target
- `startDate`, `endDate` - Schedule timeframe
- `workstationId` - Which workstation/line
- `shiftNumber` - Which shift (1, 2, 3)
- `status` - planned, in_progress, completed, cancelled
- `actualUnitsProduced` - Actual output (optional)

**Relationships:**
- One-to-many with `MaterialRequirement` (materials needed)

**Indexes:**
- `productId` - Schedule by product
- `startDate, endDate` - Time-based queries
- `workstationId, shiftNumber` - Capacity planning
- `status` - Active schedules

---

### 6. MaterialRequirement (MRP Calculations)

Material requirements calculated from production schedules.

**Fields:**
- `scheduleId` - Which production schedule
- `partNumber` - Which part is needed
- `requiredQuantity` - How much needed
- `allocatedQuantity` - How much reserved (default 0)
- `status` - pending, allocated, fulfilled

**Relationships:**
- Many-to-one with `ProductionSchedule`
- Many-to-one with `BomItem`

**MRP Logic:**
```
Schedule: Produce 100 units of "Widget A"
  → ProductBom says "Widget A" needs 4× "Bolt-M5"
  → MaterialRequirement: 400 units of "Bolt-M5" required
  → Check BomItem: Current stock of "Bolt-M5"
  → If insufficient, create Alert
```

---

### 7. ThroughputData (Production Performance)

Historical production performance metrics for analysis.

**Fields:**
- `date` - Production date
- `productId` - Which product
- `unitsProduced` - Actual output
- `hoursWorked` - Labor hours
- `defectRate` - Quality metric (0-1)
- `workstationId` - Which workstation
- `efficiency` - Calculated efficiency metric

**Indexes:**
- `date, productId` - Time-series analysis by product
- `workstationId` - Performance by workstation

**Use Cases:**
- Calculate average production rates
- Identify bottleneck workstations
- Forecast realistic production capacity
- Track quality trends

---

### 8. InventoryMovement (Audit Trail)

Complete audit log of all inventory changes.

**Fields:**
- `partNumber` - Which part moved
- `movementType` - Enum: in, out, adjustment
- `quantity` - How much (positive or negative)
- `reference` - Purchase order, production order, etc. (optional)
- `reason` - Explanation (optional)
- `previousStock` - Stock before movement
- `newStock` - Stock after movement
- `timestamp` - When it happened

**Indexes:**
- `partNumber, timestamp` - Part history
- `movementType` - Filter by type
- `timestamp` - Chronological queries

**Movement Types:**
- `in` - Receiving from supplier, returns
- `out` - Consumption in production, sales
- `adjustment` - Stock corrections, cycle counts

---

### 9. FinancialMetrics (Daily Snapshots)

Daily financial summary for executive dashboards.

**Fields:**
- `date` (unique) - Date of snapshot
- `totalInventoryValue` - Total value of all inventory
- `wipValue` - Work-in-progress value
- `finishedGoodsValue` - Finished goods value
- `totalMaterialCost` - Material costs
- `productionCostEst` - Estimated production costs

**Use Cases:**
- Executive dashboard KPIs
- Cash flow analysis
- Inventory turnover metrics
- Cost tracking over time

---

### 10. Alert (System Notifications)

System-generated alerts for inventory, production, and quality issues.

**Fields:**
- `alertType` - Enum: shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue
- `severity` - Enum: critical, warning, info
- `title` - Alert title
- `description` - Detailed description
- `reference` - Related entity ID (optional)
- `status` - active, acknowledged, resolved
- `resolvedAt` - When resolved (optional)

**Indexes:**
- `status, createdAt` - Active alerts sorted by time
- `alertType, severity` - Filter critical alerts

**Alert Types:**
- `shortage` - Part stock below safety level
- `reorder` - Part reached reorder point
- `schedule_conflict` - Overlapping production schedules
- `cost_overrun` - Production cost exceeds budget
- `capacity_warning` - Workstation over-allocated
- `quality_issue` - High defect rate detected

---

## Common Queries

### Find parts needing reorder
```sql
SELECT * FROM "BomItem"
WHERE "currentStock" <= "reorderPoint"
ORDER BY "currentStock" ASC;
```

### Calculate total material cost for a product
```sql
SELECT p.name, SUM(pb."quantityNeeded" * b."unitCost") as total_cost
FROM "Product" p
JOIN "ProductBom" pb ON p.id = pb."productId"
JOIN "BomItem" b ON pb."partNumber" = b."partNumber"
WHERE p.id = '<product_id>'
GROUP BY p.name;
```

### Check material availability for production schedule
```sql
SELECT
  mr."partNumber",
  b."description",
  mr."requiredQuantity",
  b."currentStock",
  CASE
    WHEN b."currentStock" >= mr."requiredQuantity" THEN 'Available'
    ELSE 'Shortage'
  END as status
FROM "MaterialRequirement" mr
JOIN "BomItem" b ON mr."partNumber" = b."partNumber"
WHERE mr."scheduleId" = '<schedule_id>';
```

### Get active critical alerts
```sql
SELECT * FROM "Alert"
WHERE status = 'active'
  AND severity = 'critical'
ORDER BY "createdAt" DESC;
```

## Data Integrity Rules

1. **Cascade Deletes**: Deleting a Product cascades to ProductBom, SalesOrder, ProductionSchedule, ThroughputData
2. **Part Number Integrity**: BomItem.partNumber must exist before creating ProductBom or MaterialRequirement
3. **Unique Constraints**: Prevent duplicate product-part mappings in ProductBom
4. **Stock Tracking**: InventoryMovement captures before/after stock levels for audit trail
5. **Financial Snapshots**: One FinancialMetrics record per date (unique constraint)

## Performance Considerations

- Composite indexes on frequently queried combinations (e.g., `date, productId`)
- Separate index on status fields for filtering active records
- Denormalized fields (e.g., `currentStock` in BomItem) avoid expensive aggregations
- Timestamp indexes support chronological queries and audit trails
