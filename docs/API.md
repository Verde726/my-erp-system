# API Documentation

Complete reference for all REST API endpoints in the ERP/MRP system.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this structure:

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "error": "Error message description",
  "details": { /* optional additional context */ }
}
```

## Authentication

🚧 **Not yet implemented** - All endpoints are currently public.

Future implementation will use NextAuth with session-based authentication.

---

## Bill of Materials (BOM) Endpoints

### GET /api/bom

Get all BOM items with optional filtering.

**Query Parameters**:
- `category` (optional): Filter by category
- `supplier` (optional): Filter by supplier
- `lowStock` (optional): Boolean, filter items below reorder point

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "partNumber": "PN-1001",
      "description": "Bolt M8x20",
      "category": "Fasteners",
      "currentStock": 500,
      "unitCost": 0.25,
      "reorderPoint": 200,
      "safetyStock": 100,
      "leadTimeDays": 7,
      "supplier": "Acme Fasteners",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T14:30:00Z"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3000/api/bom
curl http://localhost:3000/api/bom?category=Fasteners
curl http://localhost:3000/api/bom?lowStock=true
```

---

### POST /api/bom/upload

Upload BOM inventory data via CSV file.

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: CSV file with BOM data

**CSV Format**:
```csv
partNumber,description,category,currentStock,unitCost,reorderPoint,safetyStock,leadTimeDays,supplier
PN-1001,Bolt M8x20,Fasteners,500,0.25,200,100,7,Acme Fasteners
PN-1002,Washer M8,Fasteners,1000,0.10,300,150,7,Acme Fasteners
PN-2001,Steel Plate 100x100,Raw Materials,50,15.00,20,10,14,SteelCo
```

**Required CSV Columns**:
- `partNumber` (string, unique)
- `description` (string)
- `category` (string)
- `currentStock` (number)
- `unitCost` (number, > 0)
- `reorderPoint` (number)
- `safetyStock` (number)
- `leadTimeDays` (number, ≥ 0)
- `supplier` (string)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRows": 100,
    "inserted": 85,
    "updated": 15,
    "failed": 0,
    "errors": []
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/bom/upload \
  -F "file=@bom_inventory.csv"
```

---

### GET /api/bom/:id

Get a single BOM item by ID.

**URL Parameters**:
- `id`: BOM item ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "partNumber": "PN-1001",
    "description": "Bolt M8x20",
    "category": "Fasteners",
    "currentStock": 500,
    "unitCost": 0.25,
    "reorderPoint": 200,
    "safetyStock": 100,
    "leadTimeDays": 7,
    "supplier": "Acme Fasteners",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-20T14:30:00Z"
  }
}
```

---

### POST /api/bom/:id/adjust

Manually adjust inventory quantity for a BOM item.

**URL Parameters**:
- `id`: BOM item ID

**Request Body**:
```json
{
  "newQuantity": 1000,
  "reason": "Physical inventory count correction"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "partNumber": "PN-1001",
    "previousStock": 500,
    "newStock": 1000,
    "adjustment": 500,
    "reason": "Physical inventory count correction"
  }
}
```

---

### GET /api/bom/categories

Get list of all unique BOM categories.

**Response**:
```json
{
  "success": true,
  "data": [
    "Fasteners",
    "Raw Materials",
    "Electronics",
    "Packaging"
  ]
}
```

---

### GET /api/bom/suppliers

Get list of all unique suppliers.

**Response**:
```json
{
  "success": true,
  "data": [
    "Acme Fasteners",
    "SteelCo",
    "ElectroSupply",
    "PackagePro"
  ]
}
```

---

## Sales Order Endpoints

### GET /api/sales

Get all sales orders.

**Query Parameters**:
- `status` (optional): Filter by status (pending, confirmed, completed, cancelled)
- `priority` (optional): Filter by priority (high, medium, low)
- `startDate` (optional): Filter by time period >= date (ISO 8601)
- `endDate` (optional): Filter by time period <= date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "orderId": "SO-2025-001",
      "productId": "clxxx...",
      "forecastedUnits": 1000,
      "timePeriod": "2025-02-01T00:00:00Z",
      "priority": "high",
      "status": "confirmed",
      "createdAt": "2025-01-15T10:00:00Z",
      "product": {
        "sku": "PROD-001",
        "name": "Widget Assembly"
      }
    }
  ]
}
```

---

### POST /api/sales/upload

Upload sales forecast via CSV file.

**CSV Format**:
```csv
productSku,forecastedUnits,timePeriod,priority
PROD-001,1000,2025-02-01,high
PROD-002,500,2025-02-01,medium
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRows": 50,
    "inserted": 48,
    "updated": 2,
    "failed": 0
  }
}
```

---

## Production Schedule Endpoints

### GET /api/schedules

Get all production schedules.

**Query Parameters**:
- `status` (optional): planned, approved, in_progress, completed, cancelled
- `startDate` (optional): Filter by start date >= (ISO 8601)
- `endDate` (optional): Filter by end date <= (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "scheduleId": "SCH-2025-001",
      "productId": "clxxx...",
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2025-02-05T00:00:00Z",
      "unitsToProducePerDay": 200,
      "actualUnitsProduced": 0,
      "workstationId": "WS-001",
      "shiftNumber": 1,
      "shiftsPerDay": 2,
      "status": "planned",
      "product": {
        "sku": "PROD-001",
        "name": "Widget Assembly"
      }
    }
  ]
}
```

---

### POST /api/schedules/generate

Generate production schedules from sales forecasts.

**Request Body**:
```json
{
  "dateRange": {
    "start": "2025-02-01",
    "end": "2025-02-28"
  },
  "priorityFilter": "high",
  "workstationId": "WS-001",
  "shiftsPerDay": 2
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "productSku": "PROD-001",
        "productName": "Widget Assembly",
        "unitsToProducePerDay": 200,
        "totalUnits": 1000,
        "startDate": "2025-02-01T00:00:00Z",
        "endDate": "2025-02-05T00:00:00Z",
        "workstationId": "WS-001",
        "daysRequired": 5,
        "capacityUtilization": 0.85,
        "warnings": []
      }
    ],
    "conflicts": [],
    "summary": {
      "totalProducts": 3,
      "totalUnits": 2500,
      "averageCapacityUtilization": 0.78,
      "highPriorityCount": 2,
      "warningCount": 0
    }
  }
}
```

---

### POST /api/schedules/save

Save generated schedules to database.

**Request Body**:
```json
{
  "schedules": [
    {
      "productId": "clxxx...",
      "startDate": "2025-02-01",
      "endDate": "2025-02-05",
      "unitsToProducePerDay": 200,
      "workstationId": "WS-001",
      "shiftNumber": 1,
      "shiftsPerDay": 2
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "created": 3,
    "scheduleIds": ["SCH-2025-001", "SCH-2025-002", "SCH-2025-003"]
  }
}
```

---

## MRP (Material Requirements Planning) Endpoints

### POST /api/mrp/calculate

Calculate MRP for a production schedule.

**Request Body**:
```json
{
  "scheduleId": "SCH-2025-001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "partNumber": "PN-1001",
        "description": "Bolt M8x20",
        "scheduleId": "SCH-2025-001",
        "productSku": "PROD-001",
        "productName": "Widget Assembly",
        "grossRequirement": 2000,
        "currentStock": 500,
        "allocatedStock": 0,
        "availableStock": 500,
        "netRequirement": 1500,
        "plannedOrderQuantity": 1600,
        "plannedOrderDate": "2025-01-25T00:00:00Z",
        "expectedDeliveryDate": "2025-02-01T00:00:00Z",
        "status": "shortage",
        "orderDateInPast": false,
        "leadTimeDays": 7,
        "safetyStock": 100,
        "reorderPoint": 200,
        "unitCost": 0.25,
        "totalCost": 400.00,
        "recommendations": ["Order 1600 units"],
        "warnings": ["Shortage detected"]
      }
    ],
    "summary": {
      "scheduleId": "SCH-2025-001",
      "totalComponents": 5,
      "sufficientCount": 2,
      "shortageCount": 2,
      "criticalCount": 1,
      "totalCost": 15000.00,
      "urgentActions": ["1 critical shortage(s) - order immediately"]
    }
  }
}
```

---

### POST /api/mrp/create

Calculate MRP and save MaterialRequirement records to database.

**Request Body**:
```json
{
  "scheduleId": "SCH-2025-001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduleId": "SCH-2025-001",
    "requirementsCreated": 5,
    "alertsGenerated": 2
  }
}
```

---

### POST /api/mrp/batch

Run MRP for multiple schedules.

**Request Body**:
```json
{
  "status": "planned"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "processed": 10,
    "errors": []
  }
}
```

---

## Inventory Endpoints

### POST /api/inventory/adjust

Manually adjust inventory quantity.

**Request Body**:
```json
{
  "partNumber": "PN-1001",
  "newQuantity": 1000,
  "reason": "Physical count correction"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "partNumber": "PN-1001",
    "previousStock": 500,
    "newStock": 1000,
    "adjustment": 500
  }
}
```

---

### POST /api/inventory/receive

Receive inventory from purchase order.

**Request Body**:
```json
{
  "items": [
    {
      "partNumber": "PN-1001",
      "quantity": 1000,
      "reference": "PO-2025-001"
    },
    {
      "partNumber": "PN-1002",
      "quantity": 2000,
      "reference": "PO-2025-001"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "received": 2,
    "movements": [
      {
        "partNumber": "PN-1001",
        "quantity": 1000,
        "previousStock": 500,
        "newStock": 1500
      }
    ]
  }
}
```

---

### GET /api/inventory/history

Get inventory movement history.

**Query Parameters**:
- `partNumber` (required): Part number to query
- `startDate` (optional): Filter movements >= date (ISO 8601)
- `endDate` (optional): Filter movements <= date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "partNumber": "PN-1001",
      "movementType": "out",
      "quantity": 200,
      "reference": "SCH-2025-001",
      "reason": "Production: Widget Assembly (100 units)",
      "previousStock": 1500,
      "newStock": 1300,
      "timestamp": "2025-02-01T10:00:00Z"
    }
  ]
}
```

---

## Production Completion Endpoint

### POST /api/production/complete

Complete a production schedule and decrement inventory.

**Request Body**:
```json
{
  "scheduleId": "SCH-2025-001",
  "actualUnitsProduced": 980
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "scheduleId": "SCH-2025-001",
    "unitsProduced": 980,
    "componentsDecremented": [
      {
        "partNumber": "PN-1001",
        "description": "Bolt M8x20",
        "quantityUsed": 1960,
        "previousStock": 2000,
        "newStock": 40,
        "triggeredReorder": true
      }
    ],
    "alerts": [
      {
        "alertType": "reorder",
        "title": "Reorder Required: PN-1001",
        "severity": "critical"
      }
    ]
  }
}
```

---

## Financial Endpoints

### POST /api/financial/snapshot

Trigger daily financial snapshot calculation.

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2025-01-24T00:00:00Z",
    "totalInventoryValue": 125000.50,
    "wipValue": 15000.00,
    "totalCost": 140000.50,
    "costVariance": -2500.00,
    "profitMargin": 0.25
  }
}
```

---

### GET /api/financial/profitability

Get profitability analysis by product.

**Query Parameters**:
- `startDate` (optional): Filter >= date (ISO 8601)
- `endDate` (optional): Filter <= date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "productSku": "PROD-001",
      "productName": "Widget Assembly",
      "totalRevenue": 50000.00,
      "totalCost": 30000.00,
      "grossProfit": 20000.00,
      "profitMargin": 0.40,
      "unitsProduced": 1000
    }
  ]
}
```

---

### GET /api/financial/inventory-value

Get current inventory valuation.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalValue": 125000.50,
    "byCategory": [
      {
        "category": "Fasteners",
        "totalValue": 15000.00,
        "itemCount": 50
      },
      {
        "category": "Raw Materials",
        "totalValue": 80000.00,
        "itemCount": 25
      }
    ]
  }
}
```

---

### GET /api/financial/cost-variance

Get cost variance analysis.

**Query Parameters**:
- `days` (optional, default: 30): Number of days to analyze

**Response**:
```json
{
  "success": true,
  "data": {
    "currentCost": 140000.50,
    "previousCost": 142500.50,
    "variance": -2500.00,
    "variancePercent": -0.0175,
    "trend": "decreasing"
  }
}
```

---

## Alert Endpoints

### GET /api/alerts

Get all alerts.

**Query Parameters**:
- `status` (optional): active, acknowledged, resolved
- `severity` (optional): critical, warning, info
- `alertType` (optional): shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "alertType": "shortage",
      "severity": "critical",
      "title": "Critical Material Shortage: PN-1001",
      "description": "Production schedule SCH-2025-001 requires 1500 units...",
      "reference": "SCH-2025-001",
      "status": "active",
      "createdAt": "2025-01-24T10:00:00Z"
    }
  ]
}
```

---

### PATCH /api/alerts/:id

Update alert status.

**URL Parameters**:
- `id`: Alert ID

**Request Body**:
```json
{
  "status": "acknowledged"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "status": "acknowledged",
    "updatedAt": "2025-01-24T11:00:00Z"
  }
}
```

---

## Analytics Endpoints

### GET /api/analytics/throughput

Get throughput analytics.

**Query Parameters**:
- `productId` (optional): Filter by product
- `startDate` (optional): Filter >= date (ISO 8601)
- `endDate` (optional): Filter <= date (ISO 8601)
- `workstationId` (optional): Filter by workstation

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "productSku": "PROD-001",
      "averageUnitsPerDay": 185,
      "averageEfficiency": 0.85,
      "averageDefectRate": 0.03,
      "totalUnitsProduced": 3700,
      "dataPoints": 20
    }
  ]
}
```

---

## Export Endpoints

### POST /api/export

Export data to CSV, Excel, or PDF.

**Request Body**:
```json
{
  "entity": "bom",
  "format": "csv",
  "filters": {
    "category": "Fasteners"
  }
}
```

**Supported Entities**:
- `bom`
- `sales`
- `schedules`
- `inventory`
- `financial`
- `alerts`

**Supported Formats**:
- `csv`
- `excel`
- `pdf`

**Response**:
Returns file download with appropriate Content-Type header.

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Example Error Response**:
```json
{
  "error": "Validation failed",
  "details": {
    "field": "partNumber",
    "message": "Part number is required"
  }
}
```

---

## Rate Limiting

🚧 **Not yet implemented**

Future implementation will include:
- 100 requests/minute per IP
- 1000 requests/hour per IP
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

**Last Updated**: 2025-01-24
