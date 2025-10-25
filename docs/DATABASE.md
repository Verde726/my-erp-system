# Database Schema Documentation

Complete reference for the ERP/MRP system database schema.

## Overview

The system uses **SQLite** (development) with a future migration path to **PostgreSQL** (production) via Prisma ORM.

**Total Tables**: 14
- **Core ERP/MRP**: 11 tables
- **Legacy**: 3 tables (User, Customer, Supplier)

## Entity Relationship Diagram

```
┌─────────────┐        ┌──────────────┐        ┌──────────────────┐
│   Product   │◄───────│  ProductBom  │───────►│    BomItem       │
│             │ 1:N    │              │ N:1    │                  │
└──────┬──────┘        └──────────────┘        └────────┬─────────┘
       │                                                 │
       │ 1:N                                             │ 1:N
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                               ┌──────────────────┐
│ SalesOrder  │                               │ InventoryMovement│
│             │                               │                  │
└─────────────┘                               └──────────────────┘
       │
       │ drives
       ▼
┌─────────────────────┐         ┌─────────────────────┐
│ ProductionSchedule  │◄────────│MaterialRequirement  │
│                     │ 1:N     │                     │
└──────────┬──────────┘         └─────────────────────┘
           │
           │ 1:N
           ▼
    ┌──────────────┐
    │ThroughputData│
    │              │
    └──────────────┘

┌──────────────────┐
│ FinancialMetrics │  (daily snapshots)
└──────────────────┘

┌──────────────────┐
│     Alert        │  (system notifications)
└──────────────────┘
```

## Core Tables

---

### BomItem

**Purpose**: Stores bill of materials components, raw materials, and parts.

**Table Name**: `BomItem`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| partNumber | String | UNIQUE, NOT NULL | Unique part number (e.g., "PN-1001") |
| description | String | NOT NULL | Part description |
| quantityPerUnit | Float | NOT NULL | Default quantity needed per unit |
| currentStock | Float | NOT NULL | Current inventory level |
| unitCost | Float | NOT NULL | Cost per unit ($) |
| supplier | String | NOT NULL | Supplier name |
| reorderPoint | Float | NOT NULL | Reorder threshold |
| leadTimeDays | Int | NOT NULL | Supplier lead time (days) |
| category | String | NOT NULL | Part category (e.g., "Fasteners") |
| safetyStock | Float | DEFAULT 0 | Safety stock buffer |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modified timestamp |

**Indexes**:
- `partNumber` (unique)
- `category`
- `(currentStock, reorderPoint)` - For low stock queries

**Relationships**:
- **One-to-Many** → `ProductBom`: Parts used in products
- **One-to-Many** → `MaterialRequirement`: MRP calculations
- **One-to-Many** → `InventoryMovement`: Stock movement audit trail

**Business Rules**:
- `currentStock` decremented during production
- Reorder alert when `currentStock ≤ reorderPoint`
- Critical alert when `currentStock ≤ safetyStock`
- `leadTimeDays` used for MRP order date calculation

---

### Product

**Purpose**: Finished goods produced by the manufacturing system.

**Table Name**: `Product`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| sku | String | UNIQUE, NOT NULL | Stock Keeping Unit (e.g., "PROD-001") |
| name | String | NOT NULL | Product name |
| description | String | NULLABLE | Product description |
| category | String | NOT NULL | Product category |
| targetMargin | Float | DEFAULT 0.3 | Target profit margin (30%) |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modified timestamp |

**Indexes**:
- `sku` (unique)
- `category`

**Relationships**:
- **One-to-Many** → `ProductBom`: BOM components needed
- **One-to-Many** → `SalesOrder`: Sales forecasts
- **One-to-Many** → `ProductionSchedule`: Production plans
- **One-to-Many** → `ThroughputData`: Performance history

---

### ProductBom

**Purpose**: Many-to-many junction table mapping products to their BOM components.

**Table Name**: `ProductBom`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| productId | String | FOREIGN KEY | Reference to Product.id |
| partNumber | String | FOREIGN KEY | Reference to BomItem.partNumber |
| quantityNeeded | Float | NOT NULL | Quantity of part per product unit |

**Unique Constraints**:
- `(productId, partNumber)` - Prevents duplicate BOM entries

**Indexes**:
- `productId`
- `partNumber`

**Relationships**:
- **Many-to-One** → `Product`: Product this BOM entry belongs to
- **Many-to-One** → `BomItem`: Part required

**Business Rules**:
- `quantityNeeded` × `ProductionSchedule.unitsToProducePerDay` = gross requirement
- Used by MRP calculator to explode BOM
- CASCADE DELETE when Product or BomItem deleted

---

### SalesOrder

**Purpose**: Sales forecasts and customer orders driving production planning.

**Table Name**: `SalesOrder`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| orderId | String | UNIQUE, NOT NULL | Order ID (e.g., "SO-2025-001") |
| productId | String | FOREIGN KEY | Reference to Product.id |
| forecastedUnits | Float | NOT NULL | Forecasted/ordered quantity |
| timePeriod | DateTime | NOT NULL | Due date or forecast period |
| priority | String | DEFAULT "medium" | Priority: high, medium, low |
| customerSegment | String | NULLABLE | Customer segment classification |
| status | String | DEFAULT "pending" | Status: pending, confirmed, completed, cancelled |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Indexes**:
- `orderId` (unique)
- `productId`
- `timePeriod`
- `(priority, status)` - For filtering high-priority active orders

**Relationships**:
- **Many-to-One** → `Product`: Product being ordered

**Business Rules**:
- Aggregated by product to generate production schedules
- High priority orders scheduled first
- Status "pending" or "confirmed" included in planning

---

### ProductionSchedule

**Purpose**: Production planning and execution tracking.

**Table Name**: `ProductionSchedule`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| scheduleId | String | UNIQUE, NOT NULL | Schedule ID (e.g., "SCH-2025-001") |
| productId | String | FOREIGN KEY | Reference to Product.id |
| unitsToProducePerDay | Float | NOT NULL | Daily production target |
| startDate | DateTime | NOT NULL | Production start date |
| endDate | DateTime | NOT NULL | Production end date |
| workstationId | String | NOT NULL | Workstation assignment (e.g., "WS-001") |
| shiftNumber | Int | NOT NULL | Shift number (1, 2, 3) |
| status | String | DEFAULT "planned" | Status: planned, approved, in_progress, completed, cancelled |
| actualUnitsProduced | Float | NULLABLE | Actual units produced (set on completion) |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modified timestamp |

**Indexes**:
- `scheduleId` (unique)
- `productId`
- `(startDate, endDate)` - For date range queries
- `(workstationId, shiftNumber)` - For conflict detection
- `status`

**Relationships**:
- **Many-to-One** → `Product`: Product being manufactured
- **One-to-Many** → `MaterialRequirement`: MRP calculations for this schedule

**Business Rules**:
- Generated from SalesOrder aggregation
- Used by MRP to calculate material needs
- Status updated to "completed" after production
- Inventory decremented when `actualUnitsProduced` set

---

### MaterialRequirement

**Purpose**: MRP calculation results and material allocation tracking.

**Table Name**: `MaterialRequirement`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| scheduleId | String | FOREIGN KEY | Reference to ProductionSchedule.scheduleId |
| partNumber | String | FOREIGN KEY | Reference to BomItem.partNumber |
| requiredQuantity | Float | NOT NULL | Gross requirement (from BOM explosion) |
| allocatedQuantity | Float | DEFAULT 0 | Quantity allocated from inventory |
| status | String | DEFAULT "pending" | Status: pending, fulfilled, ordered |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Indexes**:
- `scheduleId`
- `partNumber`
- `status`

**Relationships**:
- **Many-to-One** → `ProductionSchedule`: Schedule requiring materials
- **Many-to-One** → `BomItem`: Part required

**Business Rules**:
- Created by MRP calculator
- `requiredQuantity` = BOM qty × schedule total units
- `allocatedQuantity` tracks reserved inventory
- Status "fulfilled" when `allocatedQuantity >= requiredQuantity`

---

### ThroughputData

**Purpose**: Historical production performance metrics for capacity planning.

**Table Name**: `ThroughputData`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| date | DateTime | NOT NULL | Production date |
| productId | String | FOREIGN KEY | Reference to Product.id |
| unitsProduced | Float | NOT NULL | Units produced |
| hoursWorked | Float | NOT NULL | Total hours worked |
| defectRate | Float | NOT NULL | Defect rate (0.0 - 1.0) |
| workstationId | String | NOT NULL | Workstation identifier |
| efficiency | Float | NOT NULL | Efficiency rate (0.0 - 1.0) |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Indexes**:
- `(date, productId)` - For time-series queries
- `workstationId`

**Relationships**:
- **Many-to-One** → `Product`: Product manufactured

**Business Rules**:
- Used by production planner to estimate capacity
- `efficiency` = actual output / planned output
- Last 90 days used for capacity calculations
- `unitsProduced / hoursWorked` = units per hour

---

### InventoryMovement

**Purpose**: Complete audit trail for all inventory changes.

**Table Name**: `InventoryMovement`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| partNumber | String | FOREIGN KEY | Reference to BomItem.partNumber |
| movementType | String | NOT NULL | Movement type: in, out, adjustment |
| quantity | Float | NOT NULL | Quantity moved (absolute value) |
| reference | String | NULLABLE | Reference (e.g., schedule ID, PO number) |
| reason | String | NULLABLE | Human-readable reason |
| previousStock | Float | NOT NULL | Stock before movement |
| newStock | Float | NOT NULL | Stock after movement |
| timestamp | DateTime | DEFAULT now() | Movement timestamp |

**Indexes**:
- `(partNumber, timestamp)` - For part history queries
- `movementType`
- `timestamp`

**Relationships**:
- **Many-to-One** → `BomItem`: Part being moved

**Business Rules**:
- **Type "in"**: Receiving inventory (`newStock` = `previousStock` + `quantity`)
- **Type "out"**: Production consumption (`newStock` = `previousStock` - `quantity`)
- **Type "adjustment"**: Manual correction (`quantity` can be positive or negative)
- Immutable audit trail (no updates/deletes)

---

### FinancialMetrics

**Purpose**: Daily financial snapshots for trend analysis.

**Table Name**: `FinancialMetrics`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| date | DateTime | UNIQUE, NOT NULL | Snapshot date (one per day) |
| totalInventoryValue | Float | NOT NULL | Total inventory value ($) |
| wipValue | Float | NOT NULL | Work-in-progress value ($) |
| finishedGoodsValue | Float | NOT NULL | Finished goods value ($) |
| totalMaterialCost | Float | NOT NULL | Material cost for the day ($) |
| productionCostEst | Float | NOT NULL | Estimated production cost ($) |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Indexes**:
- `date` (unique)

**Business Rules**:
- Generated daily by cron job
- `totalInventoryValue` = Σ (BomItem.currentStock × BomItem.unitCost)
- `wipValue` = in-progress schedules × material cost
- Used for cost variance analysis
- Compared day-over-day for trend detection

---

### Alert

**Purpose**: System notifications, warnings, and critical issues.

**Table Name**: `Alert`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PRIMARY KEY | Unique identifier (CUID) |
| alertType | String | NOT NULL | Type: shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue, delivery_risk |
| severity | String | NOT NULL | Severity: critical, warning, info |
| title | String | NOT NULL | Alert title |
| description | String | NOT NULL | Detailed description |
| reference | String | NULLABLE | Related entity ID (scheduleId, partNumber, etc.) |
| status | String | DEFAULT "active" | Status: active, acknowledged, resolved |
| createdAt | DateTime | DEFAULT now() | Alert creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last status change |
| resolvedAt | DateTime | NULLABLE | Resolution timestamp |
| resolution | String | NULLABLE | Resolution notes |
| resolvedBy | String | NULLABLE | User who resolved (future) |
| dismissedAt | DateTime | NULLABLE | Dismissal timestamp |
| dismissalReason | String | NULLABLE | Reason for dismissal |

**Indexes**:
- `(status, createdAt)` - For active alerts query
- `(alertType, severity)` - For filtering by type/severity
- `reference`

**Business Rules**:
- **shortage**: Critical - immediate material shortage
- **reorder**: Warning - stock at/below reorder point
- **schedule_conflict**: Critical - workstation overlap
- **cost_overrun**: Warning - costs exceeding budget
- Auto-generated by MRP, inventory, and financial modules
- Status "active" shown to users by default

---

## Legacy Tables

### User

**Purpose**: User accounts (future authentication).

**Columns**: id, email (unique), name, role, createdAt, updatedAt

🚧 **Not yet integrated** with authentication system.

---

### Customer

**Purpose**: Customer master data.

**Columns**: id, name, email, phone, address, createdAt, updatedAt

🚧 **Not yet integrated** with sales orders.

---

### Supplier

**Purpose**: Supplier master data.

**Columns**: id, name, email, phone, address, createdAt, updatedAt

🚧 **Not yet integrated** with BOM items (using string supplier field).

---

## Database Operations

### Schema Modification Workflow

1. **Edit Schema**: Modify `prisma/schema.prisma`
2. **Update Zod**: Update corresponding schemas in `models/index.ts`
3. **Create Migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
4. **Review Migration**: Check `prisma/migrations/` SQL
5. **Regenerate Client**: Automatic via postinstall hook

### Common Queries

#### Get Items Below Reorder Point
```typescript
const lowStock = await prisma.bomItem.findMany({
  where: {
    currentStock: {
      lte: prisma.bomItem.fields.reorderPoint
    }
  },
  orderBy: { currentStock: 'asc' }
})
```

#### Get Active Alerts by Severity
```typescript
const criticalAlerts = await prisma.alert.findMany({
  where: {
    status: 'active',
    severity: 'critical'
  },
  orderBy: { createdAt: 'desc' }
})
```

#### Calculate Total Inventory Value
```typescript
const items = await prisma.bomItem.findMany({
  select: {
    currentStock: true,
    unitCost: true
  }
})
const totalValue = items.reduce((sum, item) =>
  sum + (item.currentStock * item.unitCost), 0
)
```

#### Get Production Schedule with BOM
```typescript
const schedule = await prisma.productionSchedule.findUnique({
  where: { scheduleId: 'SCH-2025-001' },
  include: {
    product: {
      include: {
        bom: {
          include: {
            bomItem: true
          }
        }
      }
    }
  }
})
```

## Database Constraints

### Foreign Key Relationships
- All foreign keys use `CASCADE DELETE` for referential integrity
- Deleting a Product cascades to ProductBom, SalesOrder, ProductionSchedule, ThroughputData
- Deleting a BomItem cascades to ProductBom, MaterialRequirement, InventoryMovement

### Unique Constraints
- `BomItem.partNumber` - Prevents duplicate parts
- `Product.sku` - Prevents duplicate products
- `SalesOrder.orderId` - Prevents duplicate orders
- `ProductionSchedule.scheduleId` - Prevents duplicate schedules
- `ProductBom.(productId, partNumber)` - Prevents duplicate BOM entries
- `FinancialMetrics.date` - One snapshot per day

### Check Constraints
🚧 **Not implemented in SQLite** - Enforced at application layer:
- `unitCost > 0`
- `currentStock >= 0`
- `reorderPoint >= 0`
- `leadTimeDays >= 0`
- `efficiency >= 0 AND efficiency <= 1`
- `defectRate >= 0 AND defectRate <= 1`

## Performance Optimization

### Indexes Strategy
- **Unique indexes** on all foreign key reference columns
- **Composite indexes** on frequently queried column pairs
- **DateTime indexes** for time-range queries
- **Status indexes** for filtering active/pending records

### Query Optimization Tips
1. Use `select` to fetch only needed columns
2. Use `include` sparingly (joins can be expensive)
3. Filter before ordering (use `where` before `orderBy`)
4. Paginate large result sets with `skip` and `take`
5. Use database transactions for multi-step operations

## Migration History

Migrations stored in `prisma/migrations/` directory.

Key migrations:
- **Initial**: Core schema setup
- **Add Safety Stock**: Added `BomItem.safetyStock` field
- **Add Financial Metrics**: Financial snapshot table
- **Add Alerts**: Alert system tables

View migration status:
```bash
npx prisma migrate status
```

## Data Integrity

### Transactional Operations
Critical operations use Prisma transactions:
- **Inventory decrementation**: Update BomItem + Create InventoryMovement
- **Batch receiving**: Update multiple BomItems atomically
- **Manual adjustments**: Update stock + Create audit record

### Audit Trail
Complete audit trail maintained for:
- ✅ Inventory movements (InventoryMovement table)
- ✅ Production completions (ProductionSchedule.updatedAt)
- ✅ Alert lifecycle (Alert.createdAt, resolvedAt, dismissedAt)
- 🚧 User actions (future with authentication)

---

**Last Updated**: 2025-01-24
**Database Provider**: SQLite (development), PostgreSQL (production recommended)
**ORM**: Prisma 5.x
