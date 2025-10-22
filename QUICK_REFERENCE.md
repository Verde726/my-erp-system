# ERP/MRP Database Quick Reference

## Schema Validation Status

✅ **Schema is valid** - 13 models, 4 enums, 20+ indexes

## Model Summary

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **BomItem** | Raw materials/parts | partNumber, currentStock, reorderPoint, unitCost |
| **Product** | Finished goods | sku, name, category, targetMargin |
| **ProductBom** | BOM mapping | productId, partNumber, quantityNeeded |
| **SalesOrder** | Demand forecasts | orderId, forecastedUnits, priority, timePeriod |
| **ProductionSchedule** | Production plans | scheduleId, workstationId, shiftNumber, status |
| **MaterialRequirement** | MRP calculations | scheduleId, partNumber, requiredQuantity, allocatedQuantity |
| **ThroughputData** | Production metrics | date, productId, efficiency, defectRate |
| **InventoryMovement** | Stock audit trail | partNumber, movementType, quantity, timestamp |
| **FinancialMetrics** | Financial snapshots | date, totalInventoryValue, wipValue |
| **Alert** | System notifications | alertType, severity, status |
| **User** | System users | email, role |
| **Customer** | Customers | name, email, phone |
| **Supplier** | Suppliers | name, email, phone |

## Enums Quick Reference

```typescript
enum Priority { high, medium, low }
enum MovementType { in, out, adjustment }
enum AlertType { shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue }
enum Severity { critical, warning, info }
```

## Key Relationships

```
Product
  ├─ ProductBom ──> BomItem
  ├─ SalesOrder
  ├─ ProductionSchedule ──> MaterialRequirement ──> BomItem
  └─ ThroughputData

BomItem
  ├─ ProductBom
  ├─ MaterialRequirement
  └─ InventoryMovement
```

## Essential Commands

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Generate Prisma Client
npx prisma generate

# Create migration (after setting up PostgreSQL)
npx prisma migrate dev --name initial_erp_schema

# Open database GUI
npx prisma studio

# Reset database (CAUTION: destroys all data)
npx prisma migrate reset
```

## Common Queries Pattern

### Check inventory levels
```typescript
const lowStock = await prisma.bomItem.findMany({
  where: {
    currentStock: { lte: prisma.bomItem.fields.reorderPoint }
  }
})
```

### Get product BOM
```typescript
const bom = await prisma.productBom.findMany({
  where: { productId: 'product_id' },
  include: { bomItem: true }
})
```

### Get material requirements for schedule
```typescript
const materials = await prisma.materialRequirement.findMany({
  where: { scheduleId: 'schedule_id' },
  include: { bomItem: true }
})
```

### Get active alerts
```typescript
const alerts = await prisma.alert.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' }
})
```

### Record inventory movement
```typescript
const movement = await prisma.inventoryMovement.create({
  data: {
    partNumber: 'PART-001',
    movementType: 'out',
    quantity: 100,
    previousStock: 500,
    newStock: 400,
    reference: 'SCHED-001'
  }
})
```

## File Locations

- **Schema**: `prisma/schema.prisma`
- **Documentation**: `DATABASE_SCHEMA.md` (detailed ERD and queries)
- **Summary**: `SCHEMA_SUMMARY.md` (implementation overview)
- **Developer Guide**: `CLAUDE.md` (architecture and patterns)

## Next Steps Checklist

- [ ] Set up PostgreSQL database
- [ ] Update `.env` with DATABASE_URL
- [ ] Run `npx prisma migrate dev --name initial_erp_schema`
- [ ] Create Zod schemas in `models/index.ts`
- [ ] Implement API routes in `app/api/`
- [ ] Create React Query hooks in `hooks/`
- [ ] Build UI components for dashboards

## Important Notes

⚠️ **Before first migration:**
1. Ensure PostgreSQL is running
2. Create database: `CREATE DATABASE erp_db;`
3. Update `.env` with correct DATABASE_URL
4. Run migration to create tables

⚠️ **Schema changes:**
- Always update both Prisma schema AND Zod schemas
- Run `npx prisma migrate dev --name <description>` after changes
- Test migrations in development before production

⚠️ **Data integrity:**
- Cascade deletes are configured for Product, ProductionSchedule
- Unique constraints on partNumber, sku, orderId, scheduleId
- Foreign key constraints enforce referential integrity
