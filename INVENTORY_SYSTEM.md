# Inventory Decrementation System

## Overview

The Inventory Decrementation System provides automatic inventory management when production occurs, ensuring accurate stock tracking, audit trails, and reorder alerts.

## Architecture

### Core Components

1. **`src/lib/inventory-manager.ts`** - Core business logic
2. **API Routes** - REST endpoints for inventory operations
3. **Database Transactions** - ACID compliance for data consistency
4. **Audit Trail** - Complete history via `InventoryMovement` table

### Data Flow

```
Production Complete
    ↓
API: POST /api/production/complete
    ↓
decrementInventoryForProduction()
    ↓
[Database Transaction]
    ├─ Update BomItem.currentStock
    ├─ Create InventoryMovement records
    ├─ Check reorder points
    └─ Create alerts if needed
    ↓
Update ProductionSchedule.actualUnitsProduced
    ↓
Return DecrementResult with alerts
```

## API Endpoints

### 1. Complete Production

**POST** `/api/production/complete`

Marks a production schedule as complete and decrements inventory.

**Request:**
```json
{
  "scheduleId": "SCHED-001",
  "actualUnitsProduced": 150,
  "notes": "Production completed successfully"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Production completed for Widget A",
  "result": {
    "scheduleId": "SCHED-001",
    "productSku": "WGT-A-001",
    "productName": "Widget A",
    "unitsProduced": 150,
    "componentsDecremented": [
      {
        "partNumber": "PART-001",
        "description": "Steel Frame",
        "quantityUsed": 300,
        "previousStock": 1000,
        "newStock": 700,
        "triggeredReorder": false
      },
      {
        "partNumber": "PART-002",
        "description": "Rubber Gasket",
        "quantityUsed": 450,
        "previousStock": 500,
        "newStock": 50,
        "triggeredReorder": true
      }
    ],
    "alertsGenerated": 1,
    "alerts": [
      {
        "id": "alert-123",
        "type": "reorder",
        "severity": "critical",
        "title": "Reorder Required: PART-002",
        "description": "Stock level (50) at or below reorder point (100)..."
      }
    ]
  }
}
```

**Response (Error - Insufficient Stock):**
```json
{
  "error": "Insufficient inventory to complete production",
  "message": "Insufficient inventory for PART-002 (Rubber Gasket). Required: 450, Available: 400, Shortage: 50",
  "details": {
    "partNumber": "PART-002",
    "required": 450,
    "available": 400,
    "shortage": 50
  },
  "recommendation": "Please receive additional inventory or reduce actual units produced"
}
```

### 2. Get Production Status

**GET** `/api/production/complete?scheduleId=SCHED-001`

**Response:**
```json
{
  "scheduleId": "SCHED-001",
  "productSku": "WGT-A-001",
  "productName": "Widget A",
  "status": "in_progress",
  "plannedUnits": 200,
  "actualUnitsProduced": null,
  "startDate": "2025-01-15T08:00:00Z",
  "endDate": "2025-01-17T17:00:00Z",
  "workstationId": "WS-001",
  "shiftNumber": 1,
  "isCompleted": false,
  "canComplete": true
}
```

### 3. Adjust Inventory

**POST** `/api/inventory/adjust`

Manual inventory adjustment for corrections, cycle counts, etc.

**Request:**
```json
{
  "partNumber": "PART-001",
  "newQuantity": 1200,
  "reason": "Physical count found 200 extra units in warehouse B"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory adjusted for PART-001",
  "partNumber": "PART-001",
  "newQuantity": 1200
}
```

### 4. Receive Inventory

**POST** `/api/inventory/receive`

Receive inventory from purchase orders or deliveries.

**Request:**
```json
{
  "items": [
    {
      "partNumber": "PART-001",
      "quantity": 500,
      "reference": "PO-12345"
    },
    {
      "partNumber": "PART-002",
      "quantity": 1000,
      "reference": "PO-12345"
    }
  ],
  "purchaseOrderId": "PO-12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Received 2 item(s)",
  "movements": [
    {
      "partNumber": "PART-001",
      "quantity": 500,
      "previousStock": 700,
      "newStock": 1200,
      "timestamp": "2025-01-15T14:30:00Z"
    },
    {
      "partNumber": "PART-002",
      "quantity": 1000,
      "previousStock": 50,
      "newStock": 1050,
      "timestamp": "2025-01-15T14:30:00Z"
    }
  ]
}
```

### 5. Get Inventory History

**GET** `/api/inventory/history?partNumber=PART-001&startDate=2025-01-01&endDate=2025-01-31`

**Response:**
```json
{
  "partNumber": "PART-001",
  "totalMovements": 15,
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "movements": [
    {
      "id": "mov-123",
      "movementType": "out",
      "quantity": 300,
      "reference": "SCHED-001",
      "reason": "Production: Widget A (150 units)",
      "previousStock": 1000,
      "newStock": 700,
      "timestamp": "2025-01-15T16:00:00Z"
    },
    {
      "id": "mov-122",
      "movementType": "in",
      "quantity": 500,
      "reference": "PO-12345",
      "reason": "Received 500 units",
      "previousStock": 500,
      "newStock": 1000,
      "timestamp": "2025-01-10T09:00:00Z"
    }
  ]
}
```

## Library Functions

### Core Function

```typescript
import { decrementInventoryForProduction } from '@/lib/inventory-manager'

const result = await decrementInventoryForProduction(
  'SCHED-001',
  150
)

console.log(result.success) // true
console.log(result.componentsDecremented) // Array of components used
console.log(result.alerts) // Reorder alerts generated
```

### Helper Functions

```typescript
import {
  adjustInventory,
  recordInventoryMovement,
  checkReorderPoint,
  getInventoryHistory,
  receiveInventory,
} from '@/lib/inventory-manager'

// Manual adjustment
await adjustInventory('PART-001', 1200, 'Cycle count correction')

// Record a movement
const movement = await recordInventoryMovement(
  'PART-001',
  'in',
  500,
  'PO-12345',
  'Received from supplier'
)

// Check reorder point
const alert = await checkReorderPoint('PART-001', 150)

// Get history
const history = await getInventoryHistory('PART-001', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
})

// Receive inventory batch
const movements = await receiveInventory([
  { partNumber: 'PART-001', quantity: 500, reference: 'PO-12345' },
  { partNumber: 'PART-002', quantity: 1000, reference: 'PO-12345' },
])
```

## Transaction Safety

All inventory operations use database transactions to ensure:

1. **Atomicity** - All updates succeed or all fail (no partial updates)
2. **Consistency** - Stock levels always match movement records
3. **Isolation** - Concurrent operations don't interfere
4. **Durability** - Committed changes persist

### Example: Production Decrementation

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update stock levels
  await tx.bomItem.update({ ... })

  // 2. Create movement record
  await tx.inventoryMovement.create({ ... })

  // 3. Check reorder point
  if (newStock <= reorderPoint) {
    await tx.alert.create({ ... })
  }

  // If ANY step fails, ALL changes are rolled back
})
```

## Reorder Point Logic

### When Reorder Alert is Triggered

```
if (currentStock <= reorderPoint) {
  // Calculate recommended order quantity
  recommendedOrder = (leadTime × dailyUsage) + safetyStock - currentStock

  // Create alert with severity
  severity = (currentStock <= safetyStock) ? 'critical' : 'warning'
}
```

### Recommended Order Quantity Calculation

```typescript
// Estimate daily usage from reorder point
estimatedDailyUsage = (reorderPoint - safetyStock) / leadTimeDays

// Calculate recommended order
recommendedOrder = (leadTimeDays × estimatedDailyUsage) + safetyStock - currentStock

// Ensure minimum brings stock back to reorder point
minimumOrder = reorderPoint - currentStock

finalRecommendation = Math.max(recommendedOrder, minimumOrder)
```

### Alert Deduplication

- System checks for existing active reorder alerts before creating new ones
- Prevents duplicate alerts for the same part
- Alerts remain active until manually resolved or stock is replenished

## Error Handling

### Insufficient Inventory

```typescript
try {
  await decrementInventoryForProduction('SCHED-001', 500)
} catch (error) {
  // Error: "Insufficient inventory for PART-002 (Rubber Gasket).
  //         Required: 1500, Available: 500, Shortage: 1000"

  // Transaction automatically rolled back - no partial changes
}
```

### Invalid Schedules

```typescript
// 404 - Schedule not found
// 400 - Schedule already completed
// 400 - Invalid units produced
```

### Validation Errors

```typescript
// 400 - Negative quantities
// 400 - Missing required fields
// 400 - Invalid part numbers
```

## Testing

Run the test suite:

```bash
npm test src/lib/__tests__/inventory-manager.test.ts
```

### Test Coverage

- ✅ Successful inventory decrementation
- ✅ Insufficient stock errors with rollback
- ✅ Reorder point triggering
- ✅ Complete audit trail creation
- ✅ Manual adjustments
- ✅ Batch receiving
- ✅ Concurrent updates (race conditions)
- ✅ Alert deduplication
- ✅ Date range filtering for history

## Production Workflow Example

```typescript
// 1. Create production schedule (via /bom or /sales modules)
const schedule = await createProductionSchedule({
  productId: 'prod-123',
  unitsToProducePerDay: 50,
  startDate: new Date('2025-01-20'),
  endDate: new Date('2025-01-22'),
})

// 2. Start production (manual status update)
await updateScheduleStatus(schedule.scheduleId, 'in_progress')

// 3. Complete production (inventory automatically decremented)
const result = await fetch('/api/production/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scheduleId: schedule.scheduleId,
    actualUnitsProduced: 145,
    notes: 'Shift 1 completed, 5 units rejected in QC',
  }),
})

// 4. Handle result
if (result.success) {
  console.log('Production complete!')

  // Check for reorder alerts
  if (result.alertsGenerated > 0) {
    console.log('ALERTS:', result.alerts)
    // Notify purchasing team to order materials
  }
} else {
  console.error('Insufficient inventory:', result.error)
  // Option 1: Reduce actualUnitsProduced
  // Option 2: Receive more inventory first
}

// 5. View audit trail
const history = await fetch(
  `/api/inventory/history?partNumber=PART-001&startDate=2025-01-20`
)
```

## Database Schema

### InventoryMovement Table

```prisma
model InventoryMovement {
  id            String       @id @default(cuid())
  partNumber    String
  movementType  MovementType // 'in', 'out', 'adjustment'
  quantity      Float
  reference     String?      // Schedule ID, PO number, etc.
  reason        String?      // Human-readable reason
  previousStock Float
  newStock      Float
  timestamp     DateTime     @default(now())

  bomItem BomItem @relation(fields: [partNumber], references: [partNumber])

  @@index([partNumber, timestamp])
  @@index([movementType])
}
```

### Alert Table

```prisma
model Alert {
  id          String    @id @default(cuid())
  alertType   AlertType // 'shortage', 'reorder', etc.
  severity    Severity  // 'critical', 'warning', 'info'
  title       String
  description String
  reference   String?   // Part number for reorder alerts
  status      String    @default("active")
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?

  @@index([status, createdAt])
  @@index([alertType, severity])
}
```

## Best Practices

### 1. Always Use Transactions

```typescript
// ❌ BAD - Race condition possible
const bomItem = await prisma.bomItem.findUnique({ where: { partNumber } })
await prisma.bomItem.update({ data: { currentStock: bomItem.currentStock - qty } })

// ✅ GOOD - Atomic update
await prisma.$transaction(async (tx) => {
  const bomItem = await tx.bomItem.findUnique({ where: { partNumber } })
  await tx.bomItem.update({ data: { currentStock: bomItem.currentStock - qty } })
})
```

### 2. Record Every Movement

```typescript
// Always create InventoryMovement records for audit trail
await tx.inventoryMovement.create({
  data: {
    partNumber,
    movementType: 'out',
    quantity: used,
    reference: scheduleId,
    reason: `Production: ${productName}`,
    previousStock,
    newStock,
  },
})
```

### 3. Check Reorder Points

```typescript
// After any stock decrease, check reorder points
if (newStock <= bomItem.reorderPoint) {
  await createReorderAlert(tx, partNumber, newStock, ...)
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  await decrementInventoryForProduction(scheduleId, units)
} catch (error) {
  if (error.message.includes('Insufficient inventory')) {
    // Provide actionable guidance to user
    notifyUser({
      type: 'error',
      message: 'Cannot complete production - not enough materials',
      actions: ['Order more inventory', 'Reduce production quantity'],
    })
  }
}
```

## Future Enhancements

- [ ] Batch allocation across multiple schedules
- [ ] Inventory reservations (soft allocation)
- [ ] Multi-warehouse support
- [ ] Lot/serial number tracking
- [ ] FIFO/LIFO cost accounting
- [ ] Inventory valuation reports
- [ ] Automated purchase order generation
- [ ] Integration with external ERP systems

## Support

For issues or questions:
1. Check the test suite for usage examples
2. Review API documentation above
3. Examine source code: `src/lib/inventory-manager.ts`
4. File an issue with reproduction steps
