# Claude Code Prompts - Ready to Use

This document contains copy-paste ready prompts for building your ERP/MRP system with Claude Code. Use these prompts sequentially, and Claude Code will build out each component of your system.

---

## 🚀 GETTING STARTED

### Before You Begin

1. Install Claude Code
2. Create a new project directory
3. Open Claude Code in that directory
4. Use these prompts in order

---

## Phase 1: Foundation

### Prompt 1.1: Project Initialization

```
Create a new Next.js 14 project with TypeScript for an ERP/MRP system designed for C-suite executives.

Project Requirements:
- Next.js 14 with App Router
- TypeScript in strict mode
- Tailwind CSS with shadcn/ui component library
- Prisma ORM configured for PostgreSQL
- React Query for data fetching
- Zod for validation

Dependencies to include:
- papaparse (CSV parsing)
- date-fns (date utilities)
- recharts (charts and visualizations)
- xlsx (Excel file handling)
- lucide-react (icons)

Project Structure:
/src
  /app          # Next.js app router pages
  /components   # React components
    /ui         # shadcn/ui components
  /lib          # Utility functions and business logic
  /models       # TypeScript interfaces and types
  /hooks        # Custom React hooks
/prisma         # Database schema and migrations
/tests          # Test files

Environment Setup:
- Create .env.example with: DATABASE_URL, NEXTAUTH_SECRET
- Add .gitignore for node_modules, .env, .next

After setup, run /init command to create comprehensive Claude.md documenting:
- Project purpose and goals
- Technology stack
- Folder structure
- Key business requirements
```

---

### Prompt 1.2: Database Schema Design

```
Create a comprehensive database schema for the ERP/MRP system.

File: prisma/schema.prisma

Models to create:

1. BomItem (Bill of Materials)
   - id: String (cuid, primary key)
   - partNumber: String (unique)
   - description: String
   - quantityPerUnit: Float
   - currentStock: Float
   - unitCost: Float
   - supplier: String
   - reorderPoint: Float
   - leadTimeDays: Int
   - category: String
   - safetyStock: Float (default 0)
   - timestamps: createdAt, updatedAt

2. Product (Finished Products)
   - id: String (cuid)
   - sku: String (unique)
   - name: String
   - description: String (optional)
   - category: String
   - targetMargin: Float (default 0.3)
   - timestamps

3. ProductBom (Product to BOM mapping)
   - id: String
   - productId: String (foreign key)
   - partNumber: String
   - quantityNeeded: Float
   - Unique constraint on [productId, partNumber]

4. SalesOrder (Sales Forecasts)
   - id: String
   - orderId: String (unique)
   - productId: String (foreign key)
   - forecastedUnits: Float
   - timePeriod: DateTime
   - priority: String (enum: high, medium, low)
   - customerSegment: String (optional)
   - status: String (default "pending")
   - createdAt: DateTime

5. ProductionSchedule (Production Planning)
   - id: String
   - scheduleId: String (unique)
   - productId: String (foreign key)
   - unitsToProducePerDay: Float
   - startDate: DateTime
   - endDate: DateTime
   - workstationId: String
   - shiftNumber: Int
   - status: String (default "planned")
   - actualUnitsProduced: Float (optional)
   - timestamps

6. MaterialRequirement (MRP Calculations)
   - id: String
   - scheduleId: String (foreign key to ProductionSchedule)
   - partNumber: String (foreign key to BomItem)
   - requiredQuantity: Float
   - allocatedQuantity: Float (default 0)
   - status: String (default "pending")
   - createdAt: DateTime

7. ThroughputData (Historical Production)
   - id: String
   - date: DateTime
   - productId: String (foreign key)
   - unitsProduced: Float
   - hoursWorked: Float
   - defectRate: Float
   - workstationId: String
   - efficiency: Float
   - createdAt: DateTime
   - Index on [date, productId]

8. InventoryMovement (Audit Trail)
   - id: String
   - partNumber: String (foreign key)
   - movementType: String (enum: in, out, adjustment)
   - quantity: Float
   - reference: String (optional)
   - reason: String (optional)
   - previousStock: Float
   - newStock: Float
   - timestamp: DateTime (default now)
   - Index on [partNumber, timestamp]

9. FinancialMetrics (Daily Financial Snapshots)
   - id: String
   - date: DateTime
   - totalInventoryValue: Float
   - wipValue: Float
   - finishedGoodsValue: Float
   - totalMaterialCost: Float
   - productionCostEst: Float
   - createdAt: DateTime
   - Index on [date]

10. Alert (System Notifications)
    - id: String
    - alertType: String (shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue)
    - severity: String (critical, warning, info)
    - title: String
    - description: String
    - reference: String (optional)
    - status: String (default "active")
    - createdAt: DateTime
    - resolvedAt: DateTime (optional)
    - Index on [status, createdAt]

After creating schema:
1. Generate Prisma Client
2. Create initial migration
3. Update Claude.md to reference prisma/schema.prisma as critical file
```

---

### Prompt 1.3: Core TypeScript Types

```
Create comprehensive TypeScript interfaces and types for the ERP system.

File: src/models/types.ts

Create interfaces matching the Prisma schema plus additional utility types:

1. Business Logic Types:

interface MRPResult {
  partNumber: string;
  description: string;
  grossRequirement: number;
  currentStock: number;
  netRequirement: number;
  plannedOrderQuantity: number;
  orderDate: Date;
  requiredDate: Date;
  status: 'sufficient' | 'shortage' | 'critical';
}

interface FinancialSnapshot {
  totalInventoryValue: number;
  wipValue: number;
  finishedGoodsValue: number;
  totalMaterialCost: number;
  productionCostEstimate: number;
  breakdown: {
    rawMaterialsValue: number;
    componentsValue: number;
    overheadAllocation: number;
  };
}

interface ThroughputMetrics {
  averageUnitsPerHour: number;
  averageUnitsPerDay: number;
  standardDeviation: number;
  efficiencyTrend: 'improving' | 'stable' | 'declining';
  defectRateTrend: 'improving' | 'stable' | 'worsening';
}

interface CapacityPrediction {
  productId: string;
  predictedUnitsPerDay: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  basedOnDays: number;
}

2. CSV Upload Types:

interface BomUploadRow {
  partNumber: string;
  description: string;
  quantityPerUnit: number;
  currentStock: number;
  unitCost: number;
  supplier: string;
  reorderPoint: number;
  leadTimeDays: number;
  category: string;
}

interface SalesUploadRow {
  orderId: string;
  productSku: string;
  forecastedUnits: number;
  date: string;
  priority: 'high' | 'medium' | 'low';
  customerSegment?: string;
}

interface ThroughputUploadRow {
  date: string;
  productSku: string;
  unitsProduced: number;
  hoursWorked: number;
  defectRate: number;
  workstationId: string;
}

3. API Response Types:

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UploadResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

4. Dashboard Types:

interface DashboardKPIs {
  production: {
    unitsToday: number;
    scheduleAdherence: number;
    nextScheduled: string;
  };
  inventory: {
    totalValue: number;
    itemsBelowReorder: number;
    daysRemaining: number;
  };
  alerts: {
    criticalCount: number;
    pendingActionsCount: number;
  };
  financial: {
    todayProductionCost: number;
    costVariance: number;
    wipValue: number;
  };
}

Export all types and create a comprehensive types file that can be imported throughout the application.

Also create: src/models/constants.ts for:
- Alert types and severities
- Priority levels
- Status values
- Category definitions
- Business rules constants (overhead %, safety stock %, etc.)
```

---

## Phase 2: Data Management

### Prompt 2.1: CSV Parser Infrastructure

```
Create a robust, reusable CSV parsing and validation system.

File: src/lib/csv-parser.ts

Requirements:

1. Create generic CSV parser using PapaParse:

function parseCSV<T>(
  file: File,
  validator: ZodSchema<T>
): Promise<ParseResult<T>>

Features:
- Handle files up to 10MB
- For larger files, use streaming
- Detect delimiter automatically
- Trim whitespace from fields
- Handle empty rows gracefully
- Convert numeric strings to numbers
- Parse date strings to Date objects

2. Return type:

interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warnings: string[];
  };
}

interface ParseError {
  row: number;
  field?: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

3. Error handling:
- Validate each row against Zod schema
- Collect all errors (don't stop at first error)
- Provide helpful error messages with row numbers
- Distinguish between errors and warnings
- Warnings for optional fields with minor issues
- Errors for required fields or invalid data

4. Add helper function:

function downloadTemplate(type: 'bom' | 'sales' | 'throughput'): void

This generates and downloads a CSV template with:
- Correct headers
- Example rows
- Data type hints in headers

File: src/lib/validators/schemas.ts

Create Zod schemas for each upload type:

1. BomUploadSchema:
- partNumber: string, min 1 char
- description: string, min 1 char
- quantityPerUnit: positive number
- currentStock: non-negative number
- unitCost: positive number
- supplier: string
- reorderPoint: non-negative number
- leadTimeDays: positive integer
- category: string

2. SalesUploadSchema:
- orderId: string, unique format validation
- productSku: string
- forecastedUnits: positive number
- date: valid ISO date string (parse to Date)
- priority: enum ['high', 'medium', 'low']
- customerSegment: optional string

3. ThroughputUploadSchema:
- date: valid ISO date string
- productSku: string
- unitsProduced: non-negative number
- hoursWorked: positive number
- defectRate: number between 0 and 1
- workstationId: string

Add custom validation:
- Check for duplicate part numbers in BOM
- Validate dates are not in far past/future
- Check that defect rate is reasonable (< 0.5)
- Validate product SKUs against existing products (optional)

Include helpful error messages in schemas.
```

---

### Prompt 2.2: BOM Upload API

```
Create API endpoint for BOM CSV upload with validation and database insertion.

File: src/app/api/upload/bom/route.ts

POST endpoint requirements:

1. Accept multipart/form-data with CSV file
2. Parse CSV using csv-parser utility
3. Validate all rows using BomUploadSchema
4. If validation errors exist, return them immediately
5. For valid data:
   - Begin database transaction
   - For each row:
     * Check if partNumber exists
     * If exists: Update existing record
     * If new: Insert new record
   - Calculate safety stock (20% of reorder point)
   - Commit transaction
6. Return detailed response

Response format:

{
  success: boolean,
  message: string,
  data: {
    totalRows: number,
    inserted: number,
    updated: number,
    failed: number,
    errors: ParseError[]
  }
}

Error handling:
- Invalid file format → 400 error
- Parsing errors → 400 with detailed error list
- Database errors → 500 error
- Duplicate partNumbers in same file → 400 error
- Missing required fields → 400 error

Add logging:
- Log upload attempts
- Log number of records processed
- Log errors with context

Also create:

File: src/app/api/upload/sales/route.ts
Similar structure for sales data upload

File: src/app/api/upload/throughput/route.ts
Similar structure for throughput data upload

For each:
- Validate uploaded data
- Check foreign key references (productIds, partNumbers)
- Handle duplicates appropriately
- Return detailed upload results

Use Plan Mode for this multi-file task to ensure consistent patterns across all upload endpoints.
```

---

### Prompt 2.3: BOM Management UI

```
Create comprehensive BOM inventory management interface.

File: src/app/bom/page.tsx

Page structure:

1. Header Section:
   - Page title: "Bill of Materials Inventory"
   - Total inventory value (live calculation)
   - Items below reorder point badge (red if > 0)
   - Upload CSV button
   - Export current inventory button
   - Add new item button

2. Upload Section (collapsible):
   - Drag & drop zone for CSV upload
   - File input as fallback
   - "Download Template" link
   - Progress bar during upload
   - Upload results display:
     * Success count (green)
     * Error count (red)
     * List of errors with row numbers

3. Filters & Search:
   - Search bar (searches part number and description)
   - Category filter dropdown
   - Status filter: All | Sufficient | Low Stock | Out of Stock
   - Supplier filter dropdown

4. Data Table:
   Use TanStack Table or AG-Grid

   Columns:
   - Status indicator (colored dot)
   - Part Number (sortable, clickable)
   - Description (searchable)
   - Category (filterable)
   - Current Stock (sortable, color-coded)
   - Reorder Point
   - Unit Cost (sortable)
   - Total Value (calculated: stock × cost)
   - Supplier
   - Actions (Edit, View History, Adjust Stock)

   Features:
   - Sort by any column
   - Click row to open detail drawer
   - Pagination (50 rows per page)
   - Row selection for bulk operations
   - Export selected rows

5. Detail Drawer (slides in from right):
   When clicking a row, show:
   - Full item details
   - Current stock level with visual gauge
   - Reorder point indicator
   - Recent movements (last 10)
   - Upcoming requirements (from production schedules)
   - Stock adjustment form
   - Edit item button
   - Delete item button (with confirmation)

6. Stock Status Color Coding:
   - Green: Stock > 1.5 × Reorder Point
   - Yellow: Stock between Reorder Point and 1.5 × Reorder Point
   - Red: Stock ≤ Reorder Point
   - Gray: Stock = 0

7. Modals:
   
   a. Upload Modal:
   - Drag/drop zone
   - File validation
   - Preview first 5 rows before upload
   - Upload button
   - Results display

   b. Edit Item Modal:
   - Form with all BOM fields
   - Validation
   - Save button
   - Cancel button

   c. Stock Adjustment Modal:
   - Current stock (read-only)
   - Adjustment type: Add | Remove | Set
   - Quantity input
   - Reason (required)
   - New stock preview
   - Confirm button

Styling:
- Use shadcn/ui components throughout
- Tailwind for layout
- Responsive design (mobile-friendly)
- Professional color scheme
- Loading states for all async operations

State Management:
- Use React Query for data fetching
- Auto-refresh every 30 seconds
- Optimistic updates for adjustments
- Error boundary for graceful error handling

Create reusable components:
- src/components/bom/BomTable.tsx
- src/components/bom/BomDetailDrawer.tsx
- src/components/bom/UploadModal.tsx
- src/components/bom/StockAdjustmentModal.tsx

Use @ to reference design examples if needed, or take a screenshot of a similar UI and paste with Control-V to iterate on design.
```

---

### Prompt 2.4: Sales Data Management

```
Create sales data import and production schedule generation.

File: src/app/sales/page.tsx

Page structure:

1. Header:
   - Title: "Sales Forecasts & Production Planning"
   - Date range selector (default: next 90 days)
   - Upload sales CSV button
   - Generate schedule button (primary action)

2. Sales Orders Table:
   Columns:
   - Order ID
   - Product (SKU + Name)
   - Forecasted Units
   - Due Date
   - Priority (badge: red/yellow/green)
   - Customer Segment
   - Status
   - Actions

   Features:
   - Filter by product, priority, date range
   - Sort by any column
   - Highlight overdue or urgent orders
   - Group by product (collapsible)

3. Production Schedule Generation Section:
   
   Button: "Generate Production Schedule"
   
   On click:
   - Open modal with options:
     * Date range
     * Include only high priority? (checkbox)
     * Preferred workstation (dropdown)
     * Shifts per day (1-3)
   - Calculate button
   
   Process:
   - Aggregate demand by product and time period
   - Check production capacity using throughput data
   - Generate optimal schedule
   - Display preview before saving
   
   Preview shows:
   - Product
   - Total units to produce
   - Start/end dates
   - Daily production rate
   - Capacity warnings (if demand > typical throughput)

4. Generated Schedules View (below orders):
   Timeline visualization:
   - Horizontal gantt-style chart
   - X-axis: dates
   - Y-axis: products
   - Bars showing production periods
   - Color-coded by priority
   - Hover shows details

   List view option:
   - Schedule ID
   - Product
   - Units/Day
   - Start Date
   - End Date
   - Status
   - Actions (View, Edit, Cancel)

File: src/lib/production-planner.ts

Create production scheduling logic:

async function generateProductionSchedule(
  dateRange: { start: Date; end: Date },
  options: {
    priorityFilter?: 'high' | 'medium' | 'low',
    workstationId?: string,
    shiftsPerDay: number
  }
): Promise<ProductionSchedule[]>

Algorithm:
1. Get all sales orders in date range
2. Aggregate by product (sum forecasted units)
3. Get historical throughput data for each product
4. Calculate average units per day per product
5. For each product:
   - Calculate days needed = total units / (throughput × shifts)
   - Schedule high priority items first
   - Assign to workstations
   - Set start date (work backward from due date - lead time)
   - Check for conflicts
6. Create ProductionSchedule records
7. Return schedules with warnings

Warning triggers:
- Demand exceeds 90% of typical capacity
- Multiple products scheduled simultaneously on same workstation
- Schedule requires working backward from due date

Also create helper functions:
- calculateProductionDays()
- checkCapacityConstraints()
- detectScheduleConflicts()
- optimizeWorkstationAllocation()

Use Thinking Mode for the scheduling algorithm - it's complex and needs to handle multiple constraints.
```

---

## Phase 3: Production Logic

### Prompt 3.1: MRP Calculation Engine

```
Implement Material Requirements Planning (MRP) calculation engine.

File: src/lib/mrp-calculator.ts

Core function:

async function calculateMRP(
  scheduleId: string
): Promise<MRPResult[]>

Algorithm:
1. Get production schedule by ID
2. Get product and its BOM components
3. Calculate production duration (days between start and end)
4. Calculate total units = units per day × duration
5. For each BOM component:
   a. Calculate gross requirement = component quantity × total units
   b. Get current stock level from inventory
   c. Calculate net requirement = max(0, gross - stock)
   d. Determine status:
      - 'sufficient' if net requirement = 0
      - 'shortage' if net > 0 but < critical threshold
      - 'critical' if net >= critical threshold
   e. Calculate planned order quantity:
      - Use Economic Order Quantity (EOQ) formula
      - Or minimum: safety stock + lead time demand
   f. Calculate order date = schedule start - lead time
   g. Flag if order date is in the past
6. Return array of MRPResult objects

Helper functions:

function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCost: number
): number

function calculateSafetyStock(
  averageDailyDemand: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95
): number

Additional function:

async function createMaterialRequirements(
  scheduleId: string
): Promise<void>

This function:
1. Runs calculateMRP()
2. Creates MaterialRequirement records in database
3. Links requirements to production schedule
4. Triggers alerts for shortages

Integration:

async function runMRPForAllSchedules(
  status: 'planned' | 'in-progress' = 'planned'
): Promise<void>

Runs MRP for all schedules with given status.

Error handling:
- Schedule not found
- Product has no BOM defined
- BOM item not found in inventory
- Database transaction failures

Testing requirements:
- Unit tests for calculation accuracy
- Test edge cases:
  * Zero inventory
  * Extremely long lead times
  * Multiple products sharing components
  * Insufficient inventory across multiple schedules

File: src/lib/__tests__/mrp-calculator.test.ts

Create comprehensive test suite:
- Test basic MRP calculation
- Test with zero inventory
- Test with multiple schedules competing for same parts
- Test lead time calculations
- Test EOQ calculations
- Test error conditions

Use Plan Mode to design the MRP logic carefully. This is critical business logic that must be accurate.
```

---

### Prompt 3.2: Inventory Decrementation System

```
Implement automatic inventory decrementation when production occurs.

File: src/lib/inventory-manager.ts

Core function:

async function decrementInventoryForProduction(
  scheduleId: string,
  actualUnitsProduced: number
): Promise<DecrementResult>

Process:
1. Get production schedule and product BOM
2. Begin database transaction
3. For each BOM component:
   a. Calculate quantity used = qty per unit × units produced
   b. Get current stock from BomItem
   c. Validate: currentStock >= quantity used
      - If insufficient: throw error and rollback
   d. Calculate new stock = current - used
   e. Update BomItem.currentStock
   f. Create InventoryMovement record:
      - movementType: 'out'
      - quantity: used
      - reference: schedule ID
      - previousStock: old value
      - newStock: new value
      - timestamp: now
   g. Check if newStock <= reorderPoint:
      - If yes: call createReorderAlert()
4. Commit transaction
5. Update ProductionSchedule.actualUnitsProduced
6. Return summary

Return type:

interface DecrementResult {
  success: boolean;
  scheduleId: string;
  unitsProduced: number;
  componentsDecremented: Array<{
    partNumber: string;
    quantityUsed: number;
    previousStock: number;
    newStock: number;
    triggeredReorder: boolean;
  }>;
  alerts: Alert[];
}

Helper functions:

async function recordInventoryMovement(
  partNumber: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  reference?: string,
  reason?: string
): Promise<InventoryMovement>

Records audit trail of inventory changes.

async function adjustInventory(
  partNumber: string,
  newQuantity: number,
  reason: string
): Promise<void>

Manual inventory adjustment (for corrections, receiving, etc.)

async function checkReorderPoint(
  partNumber: string,
  currentStock: number
): Promise<Alert | null>

Logic:
1. Get BOM item details
2. If currentStock <= reorderPoint:
   - Calculate recommended order quantity
   - Consider lead time and daily usage rate
   - Create alert (avoid duplicates for same part)
   - Return alert
3. Return null if no reorder needed

Recommended order quantity calculation:
- Base: (lead time × daily usage) + safety stock - current stock
- Minimum: reorder point
- Round up to supplier's minimum order quantity if applicable

async function getInventoryHistory(
  partNumber: string,
  dateRange?: { start: Date; end: Date }
): Promise<InventoryMovement[]>

Returns movement history for audit purposes.

File: src/app/api/production/complete/route.ts

POST endpoint to mark production complete:

Request body:
{
  scheduleId: string,
  actualUnitsProduced: number,
  notes?: string
}

Process:
1. Validate schedule exists and is 'in-progress'
2. Call decrementInventoryForProduction()
3. Update schedule status to 'completed'
4. Return result with any alerts

Error handling:
- Insufficient inventory → 400 with details
- Schedule not found → 404
- Transaction failures → 500

Create test suite:
File: src/lib/__tests__/inventory-manager.test.ts

Tests:
- Successful decrementation
- Insufficient stock error
- Reorder point triggering
- Audit trail creation
- Manual adjustments
- Concurrent updates (race conditions)

Use database transactions properly to ensure data consistency. This is critical for inventory accuracy.
```

---

### Prompt 3.3: Throughput Analysis

```
Create throughput analysis system for capacity planning.

File: src/lib/throughput-analyzer.ts

Core functions:

1. async function analyzeThroughput(
  productId: string,
  dateRange: { start: Date; end: Date }
): Promise<ThroughputMetrics>

Calculate:
- Average units per hour = sum(unitsProduced) / sum(hoursWorked)
- Average units per day (assuming 8-hour shifts)
- Standard deviation of daily production
- Efficiency trend:
  * Compare first half vs second half of period
  * 'improving' if recent > earlier by >5%
  * 'declining' if recent < earlier by >5%
  * 'stable' otherwise
- Defect rate trend (same logic)

Return comprehensive metrics.

2. async function predictCapacity(
  productId: string,
  futureDays: number
): Promise<CapacityPrediction>

Prediction method:
- Use exponential moving average of recent throughput (last 30 days)
- Weight recent data more heavily
- Calculate confidence interval (±10% of prediction)
- Consider working days only (exclude weekends)
- Account for seasonal patterns if >90 days of data

Return prediction with confidence bounds.

3. async function identifyBottlenecks(
  scheduleId: string
): Promise<BottleneckWarning[]>

Compare:
- Scheduled production rate (units/day)
- Historical average throughput
- If scheduled > historical × 1.1:
  * Flag as bottleneck
  * Calculate shortage: (scheduled - historical) × days
  * Recommend: extend timeline or reduce daily rate

Return list of warnings.

4. async function getProductionEfficiency(
  workstationId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<EfficiencyReport>

Calculate:
- Overall equipment effectiveness (OEE)
- Downtime analysis
- Quality rate (1 - defect rate)
- Performance rate (actual / theoretical throughput)

Return efficiency metrics by workstation.

5. async function calculateDailyUsageRate(
  partNumber: string,
  days: number = 30
): Promise<number>

Based on recent production history:
1. Get production schedules from last N days
2. For each schedule, calculate parts used
3. Average daily usage = total used / days

Used for reorder calculations.

File: src/app/api/analytics/throughput/route.ts

GET endpoint:

Query params:
- productId (optional)
- workstationId (optional)
- dateRange (start/end)
- analysisType: 'metrics' | 'prediction' | 'bottlenecks'

Returns appropriate analysis based on type.

File: src/app/analytics/throughput/page.tsx

Analytics dashboard:

1. Header:
   - Title: "Production Throughput Analytics"
   - Date range selector
   - Product filter
   - Workstation filter

2. Metrics Cards:
   - Average Units/Hour
   - Average Units/Day
   - Efficiency Trend (with arrow indicator)
   - Quality Rate (1 - defect rate)

3. Charts Section:
   
   a. Throughput Trend (Line Chart):
   - X-axis: Date
   - Y-axis: Units produced
   - Multiple lines if multiple products selected
   - Show moving average overlay
   - Recharts implementation

   b. Efficiency Over Time (Area Chart):
   - Show efficiency percentage
   - Highlight target efficiency line (e.g., 85%)
   - Color regions: green (above target), red (below)

   c. Defect Rate Trend (Bar Chart):
   - Daily defect rates
   - Target line at acceptable rate (e.g., 2%)

   d. Capacity Prediction (Bar Chart with error bars):
   - Predicted daily capacity
   - Confidence interval shown as error bars
   - Current average as reference line

4. Bottleneck Warnings:
   - Alert-style cards
   - Show upcoming schedules that exceed capacity
   - Recommendations for each

5. Workstation Comparison:
   - Table comparing all workstations
   - Sortable by any metric
   - Identify underperforming stations

Styling:
- Professional analytics aesthetic
- Use Chart.js or Recharts
- Interactive charts (hover for details)
- Export charts as images

Use Thinking Mode for the capacity prediction algorithm - it needs statistical analysis and trend detection.
```

---

## Phase 4: Financial Layer

### Prompt 4.1: Financial Calculation Engine

```
Implement comprehensive cost tracking and financial calculations.

File: src/lib/financial-calculator.ts

Core functions:

1. async function calculateMaterialCostPerUnit(
  productId: string
): Promise<number>

Process:
- Get product's BOM components
- For each component:
  * Get unit cost from BomItem
  * Multiply by quantity needed
- Sum all component costs
- Return total material cost per unit

2. async function calculateProductionCost(
  scheduleId: string
): Promise<ProductionCostBreakdown>

Return type:
interface ProductionCostBreakdown {
  scheduleId: string;
  productName: string;
  totalUnits: number;
  materialCostPerUnit: number;
  totalMaterialCost: number;
  overheadAllocation: number;
  totalProductionCost: number;
  costPerUnit: number;
}

Calculation:
- Material cost = units × material cost per unit
- Overhead = material cost × 0.15 (15%)
- Total = material + overhead
- Per unit = total / units

3. async function calculateInventoryValue(): Promise<InventoryValuation>

Return type:
interface InventoryValuation {
  totalValue: number;
  breakdown: {
    rawMaterials: number;
    components: number;
    finishedGoods: number;
  };
  byCategory: Record<string, number>;
  itemCount: number;
}

Process:
- Query all BOM items
- For each: value = currentStock × unitCost
- Group by category
- Sum totals

4. async function calculateWIPValue(): Promise<number>

Work-In-Progress valuation:
- Get all 'in-progress' production schedules
- For each:
  * Calculate units in progress
  * Get material cost per unit
  * Add proportional overhead
  * Sum WIP value
- Return total

5. async function calculateFinancialSnapshot(): Promise<FinancialSnapshot>

Comprehensive snapshot including:
- Total inventory value
- WIP value
- Finished goods value (if tracked)
- Projected production costs (next 30 days)
- Material cost breakdown
- Cash flow impact
- Inventory turnover ratio
- Days of inventory on hand

Store result in FinancialMetrics table.

6. async function trackCostVariance(
  scheduleId: string,
  actualCosts: {
    materialCost: number;
    laborCost?: number;
    overheadCost?: number;
  }
): Promise<CostVarianceReport>

Compare actual vs estimated:
- Calculate variances ($ and %)
- Classify: favorable (under budget) or unfavorable (over budget)
- If variance > 10%: create alert
- Store variance data for trending

7. async function calculateProductProfitability(
  productId: string,
  sellingPrice: number
): Promise<ProfitabilityAnalysis>

Return:
- Material cost
- Total cost (with overhead)
- Gross margin $
- Gross margin %
- Target margin comparison

8. Helper function:

async function getAverageDailyProductionCost(
  days: number = 30
): Promise<number>

Based on recent production schedules.

Scheduled Job:

Create cron job to run daily at midnight:
- Calculate financial snapshot
- Store in database
- Send summary email to finance team

File: src/app/api/financial/snapshot/route.ts

GET endpoint:
- Query params: date (optional, defaults to today)
- Returns financial snapshot for date
- If not exists, calculates on-the-fly

POST endpoint:
- Trigger manual snapshot calculation
- Useful for testing or ad-hoc analysis

File: src/lib/jobs/daily-financial-snapshot.ts

Cron job using node-cron:
Schedule: '0 0 * * *' (midnight daily)

Function:
1. Calculate financial snapshot
2. Store in FinancialMetrics table
3. Compare to previous day
4. If significant change (>15%), create alert
5. Log completion

Error handling:
- Missing cost data
- Division by zero
- Database errors
- Email failures

Use Plan Mode to design the comprehensive financial snapshot function - it aggregates data from multiple sources.
```

---

### Prompt 4.2: Financial Dashboard

```
Create comprehensive financial dashboard for C-suite executives.

File: src/app/finance/page.tsx

Layout: Three-column responsive grid

**Top Section: Key Financial Metrics (Cards)**

Card 1: Total Inventory Value
- Large number display
- $ amount
- Change from last week (% and $)
- Arrow indicator (up/down)
- Color: green if increased, red if decreased
- Subtitle: "As of [date]"

Card 2: Work-In-Progress Value
- WIP $ amount
- Number of units in progress
- Average value per unit
- Subtitle: "Active production"

Card 3: Projected Production Costs
- Next 30 days forecast
- Daily average
- Comparison to last 30 days
- Subtitle: "30-day forecast"

Card 4: Cost Efficiency
- Cost variance metric
- Percentage above/below target
- Trend indicator
- Subtitle: "Actual vs. planned"

**Middle Section: Visualizations**

Left Column:

1. Inventory Value by Category (Donut Chart)
   - Segments: Raw Materials, Components, Finished Goods
   - Percentages and $ values
   - Interactive: click to see item list
   - Center shows total value

2. Inventory Value Trend (Line Chart)
   - Last 90 days
   - Daily inventory value
   - Moving average overlay
   - Highlight significant changes

Right Column:

1. Production Costs Over Time (Area Chart)
   - Last 90 days
   - Material costs (bottom layer)
   - Overhead costs (top layer)
   - Stacked area chart
   - Show budget line if available

2. Cost Per Unit by Product (Horizontal Bar Chart)
   - Top 10 products by volume
   - Bars show material cost vs total cost
   - Target margin indicator
   - Sortable

**Bottom Section: Detailed Tables**

Tab 1: Cost Breakdown
Table columns:
- Category
- Item Count
- Total Value
- Average Unit Cost
- % of Total Inventory
- Actions (View Items)

Tab 2: Cost Variances
Table columns:
- Schedule ID
- Product
- Estimated Cost
- Actual Cost
- Variance ($)
- Variance (%)
- Status (favorable/unfavorable)
- Date
- Actions (View Details)

Filter variances by:
- Date range
- Product
- Variance threshold (e.g., >10%)

Tab 3: Profitability Analysis
Table columns:
- Product
- Selling Price
- Material Cost
- Total Cost
- Gross Margin ($)
- Gross Margin (%)
- vs Target Margin
- Status indicator

**Right Sidebar: Financial Alerts**

Alert panel showing:
- Cost overruns (variance >10%)
- Inventory value significant changes
- WIP value unusual patterns
- Budget warnings

Each alert:
- Icon (color-coded by severity)
- Title
- Description
- Timestamp
- Quick action buttons

**Export Functionality**

Add buttons:
- Export to PDF (full dashboard)
- Export to Excel (data tables)
- Email report (schedule or send now)

PDF includes:
- Company logo
- Date range
- All charts and tables
- Executive summary at top

File: src/components/financial/InventoryDonutChart.tsx
File: src/components/financial/CostTrendChart.tsx
File: src/components/financial/ProductCostBarChart.tsx
File: src/components/financial/FinancialAlerts.tsx

Create reusable chart components.

Styling:
- Professional financial aesthetic
- Use blue/green color scheme
- Subtle shadows and borders
- Consistent spacing
- Responsive (mobile-friendly)
- Print-friendly styles for PDF export

Data refresh:
- Auto-refresh every 60 seconds
- Manual refresh button
- Loading states for all async data
- Error boundaries

Use shadcn/ui for all UI components. For charts, use Recharts. Take a screenshot of a financial dashboard you admire and paste with Control-V to iterate on the design.
```

---

## Phase 5: Dashboard & UI

### Prompt 5.1: Main Executive Dashboard

```
Create the primary executive dashboard - single-pane-of-glass view for C-suite.

File: src/app/dashboard/page.tsx

This is the landing page after login. Design for maximum insight with minimum clutter.

**Top Bar:**
- Company logo
- Dashboard title
- Date/time (live)
- User profile dropdown
- Settings icon
- Notifications bell (badge with count)

**KPI Cards (4 across, responsive)**

Card 1: Production Status
- Icon: Factory/cog
- Metric 1: Units produced today (large number)
- Metric 2: Schedule adherence %
  * Green if >95%
  * Yellow if 85-95%
  * Red if <85%
- Metric 3: Next scheduled production
  * Product name
  * Start time
- Quick action: "View Schedule"

Card 2: Inventory Health
- Icon: Package/boxes
- Metric 1: Total inventory value ($)
- Metric 2: Items below reorder point
  * Red badge if >0
  * Number displayed prominently
- Metric 3: Days of inventory remaining
  * Based on average daily usage
- Quick action: "View Inventory"

Card 3: Active Alerts
- Icon: Alert triangle
- Metric 1: Critical alerts count
  * Red badge
  * Large number
- Metric 2: Warnings count
  * Yellow badge
- Metric 3: Pending actions
- Quick action: "View All Alerts"
- If critical >0, entire card pulses red

Card 4: Financial Summary
- Icon: Dollar sign/money
- Metric 1: Today's production cost ($)
- Metric 2: Cost variance
  * Green if under budget
  * Red if over budget
  * Show %
- Metric 3: WIP value ($)
- Quick action: "View Financials"

**Main Content Area (2 columns on desktop, stacked on mobile)**

Left Column:

1. Production Schedule Timeline (Gantt-style)
   - Next 30 days
   - Each row = product
   - Bars = production periods
   - Color-coded by priority:
     * Red: High
     * Yellow: Medium
     * Blue: Low
   - Show capacity utilization %
   - Hover shows details
   - Click to see full schedule
   - Warning indicators for over-capacity

2. Throughput Trends
   - Line chart
   - Last 30 days
   - Actual production vs planned
   - Two lines:
     * Solid: Actual units/day
     * Dashed: Planned units/day
   - Shaded area showing ±10% variance
   - Highlight days with significant variance

Right Column:

1. Inventory Status
   - Horizontal bar chart
   - Top 10 critical items (by importance)
   - For each item:
     * Bar shows current stock
     * Red line shows reorder point
     * Background shows max stock
   - Color coding:
     * Green: Healthy
     * Yellow: Low
     * Red: Critical/stockout
   - Click bar to see item details

2. Material Requirements (Next 7 Days)
   - Table view
   - Columns:
     * Part Number
     * Description
     * Required Quantity
     * Available Stock
     * Shortage (if any)
     * Order Status
   - Highlight shortages in red
   - Show "Order Now" button for shortages
   - Group by date

**Bottom Section: Active Alerts & Actions**

Table showing critical and warning alerts:
- Columns:
  * Severity icon
  * Alert Type
  * Description
  * Reference (clickable)
  * Created (time ago)
  * Actions (Resolve, Dismiss, View)

Features:
- Filter by severity
- Search alerts
- Bulk actions (dismiss all warnings)
- Auto-refresh every 30 seconds

**Real-time Updates:**
- Use WebSocket or polling (every 30s)
- Animate number changes
- Toast notifications for new critical alerts
- Sound alert option for critical issues

**Responsive Design:**
- Desktop: 4 KPI cards, 2 columns
- Tablet: 2 KPI cards per row, 1 column content
- Mobile: Stacked cards, vertical scroll

**Loading States:**
- Skeleton loaders for all sections
- Graceful degradation if data unavailable
- Error boundaries with retry buttons

**Quick Actions (Floating Action Button):**
- Primary: "Generate Schedule"
- Secondary options:
  * Upload BOM
  * Upload Sales Data
  * Add Manual Alert
  * Export Dashboard

File: src/components/dashboard/KPICard.tsx
File: src/components/dashboard/ProductionTimeline.tsx
File: src/components/dashboard/ThroughputChart.tsx
File: src/components/dashboard/InventoryBarChart.tsx
File: src/components/dashboard/MaterialRequirementsTable.tsx
File: src/components/dashboard/AlertsTable.tsx

Create reusable components.

Styling:
- Modern, clean design
- Professional color palette
- Subtle shadows and depth
- Smooth animations
- High contrast for readability
- Accessible (WCAG AA compliant)

Use shadcn/ui components throughout. Use Recharts for visualizations. Add micro-interactions for better UX.

Take a screenshot of an executive dashboard you find impressive and paste with Control-V to iterate on the design until it matches that quality.
```

---

### Prompt 5.2: Comprehensive Alert System

```
Implement complete alert management system.

File: src/lib/alert-manager.ts

Core functions:

1. async function createAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  description: string,
  reference?: string
): Promise<Alert>

Alert types:
- 'shortage': Inventory below critical level
- 'reorder': Time to reorder
- 'schedule_conflict': Production schedule overlap/conflict
- 'cost_overrun': Cost variance >10%
- 'capacity_warning': Schedule exceeds typical throughput
- 'quality_issue': Defect rate above threshold
- 'delivery_risk': At risk of missing due date

Severity levels:
- 'critical': Requires immediate action, blocks production
- 'warning': Attention needed soon
- 'info': FYI, no action required

Function:
- Validate inputs
- Check for duplicate active alerts (same type + reference)
- If duplicate exists, update instead of create
- Create Alert record with status 'active'
- Trigger notification (email for critical)
- Return alert

2. async function resolveAlert(
  alertId: string,
  resolution: string,
  userId?: string
): Promise<Alert>

- Update alert status to 'resolved'
- Set resolvedAt timestamp
- Add resolution notes
- Log who resolved it
- Return updated alert

3. async function dismissAlert(
  alertId: string,
  reason?: string
): Promise<Alert>

- Update status to 'dismissed'
- Keep in database for audit trail
- Add dismissal reason
- Return updated alert

4. async function getActiveAlerts(
  filters?: {
    type?: AlertType | AlertType[];
    severity?: AlertSeverity | AlertSeverity[];
    reference?: string;
    createdAfter?: Date;
  },
  pagination?: {
    page: number;
    limit: number;
  }
): Promise<{
  alerts: Alert[];
  total: number;
  page: number;
  totalPages: number;
}>

Query active alerts with optional filters.
Sort by: severity (critical first), then createdAt (newest first).

5. async function getAlertHistory(
  reference: string,
  includeResolved: boolean = true
): Promise<Alert[]>

Get all alerts for a specific reference (e.g., part number, schedule ID).

6. Alert Trigger Functions:

async function checkInventoryAlerts(
  partNumber: string,
  currentStock: number
): Promise<Alert[]>

Logic:
- If stock = 0: Create critical shortage alert
- If stock <= reorder point: Create warning reorder alert
- If stock <= safety stock: Create warning low stock alert
- Return created alerts

async function checkScheduleConflicts(
  scheduleId: string
): Promise<Alert[]>

Check for:
- Same workstation, overlapping dates
- Capacity exceeded
- Material shortages
- Create alerts for conflicts

async function checkCostVariances(
  scheduleId: string,
  actualCost: number,
  estimatedCost: number
): Promise<Alert | null>

If variance > 10%:
- Calculate variance % and $
- Create cost overrun alert
- Include breakdown

async function checkQualityIssues(
  productId: string,
  defectRate: number
): Promise<Alert | null>

If defect rate > threshold (e.g., 5%):
- Create quality issue alert
- Include trend data

7. Notification function:

async function sendAlertNotification(
  alert: Alert,
  recipients: string[]
): Promise<void>

For critical alerts:
- Send email using nodemailer or SendGrid
- Include alert details
- Add link to dashboard
- Log notification sent

File: src/app/api/alerts/route.ts

GET endpoint:
- Query params: type, severity, page, limit
- Returns paginated alerts

POST endpoint:
- Create manual alert
- Body: type, severity, title, description, reference

PATCH endpoint (/:id):
- Resolve or dismiss alert
- Body: action ('resolve' | 'dismiss'), notes

DELETE endpoint (/:id):
- Soft delete alert (for cleanup)

File: src/components/alerts/AlertPanel.tsx

Reusable alert panel component:

Props:
- filters: AlertFilters
- maxAlerts?: number
- showDismissed?: boolean
- onAlertClick?: (alert) => void

Features:
- Display alerts in list
- Color-coded by severity
- Icon for each alert type
- Time ago (e.g., "5 minutes ago")
- Quick actions: Resolve, Dismiss
- Expandable details
- Real-time updates (SWR or React Query)

File: src/components/alerts/AlertBadge.tsx

Small badge component:
- Shows alert count
- Color-coded by highest severity
- Pulsing animation for critical
- Click to open alert panel

File: src/app/alerts/page.tsx

Full alerts management page:

Layout:
1. Header with filters:
   - Severity filter
   - Type filter
   - Date range
   - Status filter (active/resolved/dismissed)
   - Search by reference

2. Alert cards/list:
   - Grouped by severity
   - Show all details
   - Bulk actions (resolve selected, dismiss selected)
   - Sort options

3. Alert detail modal:
   - Full alert information
   - History (if alert was updated)
   - Related alerts (same reference)
   - Actions
   - Notes field for resolution

4. Alert analytics:
   - Alert frequency over time (chart)
   - Most common alert types
   - Average resolution time
   - Alerts by category

Integration:

Automatically trigger alerts from:
- Inventory decrementation (inventory-manager.ts)
- MRP calculation (mrp-calculator.ts)
- Production scheduling (production-planner.ts)
- Cost tracking (financial-calculator.ts)

Create webhook support for external integrations (Slack, Teams, etc.)

Use Plan Mode for this multi-file implementation.
```

---

### Prompt 5.3: Export & Reporting System

```
Create comprehensive export and reporting capabilities.

File: src/lib/exporters/pdf-exporter.ts

Use jsPDF or Puppeteer for PDF generation.

Functions:

1. async function exportInventoryReport(
  dateRange: { start: Date; end: Date },
  options?: {
    includeMovements: boolean;
    groupByCategory: boolean;
  }
): Promise<Buffer>

Report contents:
- Header: Company name, report title, date range, generated date
- Executive summary:
  * Total inventory value
  * Item count
  * Items below reorder point
  * Value by category
- Detailed inventory list (table):
  * Part Number
  * Description
  * Current Stock
  * Unit Cost
  * Total Value
  * Reorder Point
  * Status
- If includeMovements:
  * Movement history for period
- Charts:
  * Inventory value by category (pie chart)
  * Stock levels bar chart
- Footer: Page numbers, generation timestamp

Styling:
- Professional corporate template
- Company colors
- Clear typography
- Page breaks appropriately

2. async function exportProductionReport(
  dateRange: { start: Date; end: Date }
): Promise<Buffer>

Report contents:
- Production summary:
  * Total units produced
  * Number of schedules completed
  * Schedule adherence %
  * Average daily production
- Production schedules table:
  * Schedule ID
  * Product
  * Planned Units
  * Actual Units
  * Variance
  * Status
  * Start/End dates
- Material consumption:
  * Parts used
  * Quantities
  * Costs
- Throughput metrics:
  * Units per hour by product
  * Efficiency trends
  * Quality metrics (defect rates)
- Charts:
  * Production over time (line chart)
  * Actual vs planned (bar chart)
  * Efficiency by workstation (bar chart)

3. async function exportFinancialReport(
  dateRange: { start: Date; end: Date }
): Promise<Buffer>

Report contents:
- Financial summary:
  * Total inventory value
  * WIP value
  * Production costs for period
  * Cost variances
- Cost analysis table:
  * By product
  * By category
  * Material vs overhead
- Inventory valuation:
  * Beginning balance
  * Additions
  * Reductions
  * Ending balance
- Cost variance analysis:
  * Schedules with variances
  * Favorable vs unfavorable
  * Root causes (if noted)
- Charts:
  * Cost trends (line chart)
  * Cost breakdown (pie chart)
  * Variance distribution (histogram)

4. async function exportCustomReport(
  reportConfig: ReportConfig
): Promise<Buffer>

Flexible report generator:
- Accept custom sections
- Include/exclude elements
- Custom charts
- Custom tables

File: src/lib/exporters/csv-exporter.ts

Generic CSV export function:

async function exportToCSV<T>(
  data: T[],
  columns: ColumnConfig[],
  filename: string
): Promise<string>

Features:
- Map data to columns
- Format dates
- Handle null values
- Quote strings with commas
- Add BOM for Excel compatibility

Example usage:
```typescript
await exportToCSV(
  bomItems,
  [
    { header: 'Part Number', key: 'partNumber' },
    { header: 'Description', key: 'description' },
    { header: 'Stock', key: 'currentStock' },
    { header: 'Cost', key: 'unitCost', format: (v) => `$${v.toFixed(2)}` }
  ],
  'bom_inventory.csv'
);
```

File: src/lib/exporters/excel-exporter.ts

Use xlsx library for Excel exports:

async function exportToExcel(
  data: Record<string, any[]>,
  filename: string
): Promise<Buffer>

Features:
- Multiple sheets (one per data set)
- Formatted headers
- Auto-column width
- Number formatting
- Date formatting
- Formulas for totals

Example:
```typescript
await exportToExcel({
  'Inventory': bomItems,
  'Movements': movements,
  'Summary': summaryData
}, 'inventory_report.xlsx');
```

File: src/app/api/export/route.ts

GET endpoint:

Query params:
- type: 'inventory' | 'production' | 'financial' | 'custom'
- format: 'pdf' | 'csv' | 'xlsx'
- dateRange: start and end dates
- options: JSON string with report options

Response:
- Stream file download
- Set appropriate headers:
  * Content-Type
  * Content-Disposition (filename)
  * Cache-Control

Handle large exports:
- Stream data if >1000 rows
- Progress updates for long-running exports
- Timeout protection

File: src/components/export/ExportModal.tsx

Reusable export modal:

Features:
- Select report type
- Select format
- Date range picker
- Options checkboxes (e.g., include movements)
- Preview option
- Export button with loading state
- Download trigger

Props:
- reportTypes: string[]
- onExport: (config) => Promise<void>

File: src/lib/jobs/scheduled-reports.ts

Scheduled reports using node-cron:

1. Weekly inventory report:
   - Schedule: '0 9 * * 1' (Monday 9 AM)
   - Generate inventory PDF
   - Email to operations team

2. Monthly financial report:
   - Schedule: '0 9 1 * *' (1st of month, 9 AM)
   - Generate financial PDF
   - Email to finance team

3. Daily production summary:
   - Schedule: '0 18 * * *' (6 PM daily)
   - Generate production CSV
   - Email to production manager

Email delivery:

async function sendReportEmail(
  recipients: string[],
  subject: string,
  body: string,
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>
): Promise<void>

Use nodemailer or SendGrid.

Add UI for scheduling:
File: src/app/reports/schedule/page.tsx

Features:
- List scheduled reports
- Add new scheduled report
- Edit schedule (cron expression)
- Change recipients
- Enable/disable reports
- Test run (send now)

Use Plan Mode to coordinate all export functionality across multiple files and formats.
```

---

## Phase 6: Testing & Polish

### Prompt 6.1: Comprehensive Testing

```
Create comprehensive test suite for the entire ERP/MRP system.

File: vitest.config.ts

Configure Vitest with:
- TypeScript support
- Path aliases
- Coverage reporting (v8)
- Test environment: node for backend, jsdom for frontend

**Unit Tests**

File: src/lib/__tests__/mrp-calculator.test.ts

Test suite for MRP calculations:

Describe block: MRP Calculator

Tests:
1. "calculates correct gross requirements for single product"
   - Setup: Product with 2 components, schedule for 100 units
   - Expect: Gross requirements = component qty × 100

2. "calculates net requirements with current stock"
   - Setup: Gross req = 500, current stock = 200
   - Expect: Net req = 300

3. "handles zero inventory scenario"
   - Setup: Current stock = 0
   - Expect: Net req = Gross req, status = 'critical'

4. "calculates correct order dates based on lead time"
   - Setup: Schedule starts Jan 15, lead time = 7 days
   - Expect: Order date = Jan 8

5. "handles multiple products sharing same component"
   - Setup: 2 products, both use component X
   - Expect: Aggregated requirements

6. "throws error for schedule without BOM data"
   - Setup: Product with no BOM components
   - Expect: Error thrown

7. "calculates EOQ correctly"
   - Setup: Known parameters
   - Expect: Correct EOQ value

Mock Prisma client for all tests.

File: src/lib/__tests__/inventory-manager.test.ts

Test suite for inventory management:

Tests:
1. "successfully decrements inventory for production"
   - Setup: Schedule with sufficient inventory
   - Expect: Inventory updated, movement recorded

2. "throws error for insufficient inventory"
   - Setup: Required = 500, available = 300
   - Expect: Error, transaction rolled back

3. "triggers reorder alert when below threshold"
   - Setup: Decrement causes stock to fall below reorder point
   - Expect: Alert created

4. "records accurate inventory movements"
   - Setup: Decrement 100 units
   - Expect: Movement record with correct before/after values

5. "handles manual inventory adjustment"
   - Setup: Adjust stock to specific value
   - Expect: Stock updated, movement recorded with reason

6. "prevents negative inventory"
   - Setup: Try to remove more than available
   - Expect: Error thrown

File: src/lib/__tests__/financial-calculator.test.ts

Test suite for financial calculations:

Tests:
1. "calculates material cost per unit correctly"
   - Setup: Product with multiple components
   - Expect: Sum of (qty × cost) for all components

2. "calculates total inventory value"
   - Setup: Multiple BOM items with stock
   - Expect: Sum of (stock × cost) for all items

3. "calculates WIP value for in-progress schedules"
   - Setup: 2 schedules in progress
   - Expect: Correct WIP value with overhead

4. "calculates cost variance"
   - Setup: Estimated = $1000, Actual = $1150
   - Expect: Variance = $150, 15%

5. "creates alert for variance >10%"
   - Setup: 15% variance
   - Expect: Alert created

File: src/lib/__tests__/throughput-analyzer.test.ts

Test suite for throughput analysis:

Tests:
1. "calculates average throughput correctly"
   - Setup: 10 days of production data
   - Expect: Correct average units/day

2. "identifies efficiency trend"
   - Setup: Production increasing over time
   - Expect: Trend = 'improving'

3. "predicts capacity based on historical data"
   - Setup: 30 days of consistent throughput
   - Expect: Prediction within range

4. "identifies bottlenecks"
   - Setup: Schedule exceeds historical throughput
   - Expect: Bottleneck warning created

Coverage target: >80% for all calculator modules.

**Integration Tests (Playwright)**

File: tests/e2e/bom-management.spec.ts

Test flows:
1. "upload BOM CSV successfully"
   - Navigate to BOM page
   - Upload valid CSV
   - Verify success message
   - Check database for records

2. "shows validation errors for invalid CSV"
   - Upload CSV with errors
   - Verify error display
   - Check specific error messages

3. "adjusts inventory manually"
   - Find item in table
   - Click adjust stock
   - Enter adjustment
   - Verify updated stock

4. "filters and searches inventory"
   - Enter search term
   - Verify filtered results
   - Apply category filter
   - Verify results

File: tests/e2e/production-workflow.spec.ts

Test complete production workflow:
1. "full production cycle from sales to completion"
   - Upload sales data
   - Generate production schedule
   - Run MRP calculation
   - Mark production complete
   - Verify inventory decremented
   - Verify alerts created if needed

File: tests/e2e/dashboard.spec.ts

Test dashboard functionality:
1. "loads dashboard with all KPIs"
   - Navigate to dashboard
   - Verify all cards load
   - Check KPI values are displayed

2. "refreshes data automatically"
   - Load dashboard
   - Wait for refresh interval
   - Verify data updated

3. "navigates to detail pages"
   - Click on each KPI card
   - Verify navigation to correct page

File: tests/e2e/alerts.spec.ts

Test alert system:
1. "creates alert when inventory low"
   - Decrement inventory below reorder
   - Verify alert appears on dashboard
   - Click to see alert details

2. "resolves alert"
   - Find active alert
   - Click resolve
   - Enter notes
   - Verify status changed

**Performance Tests**

File: tests/performance/load-test.ts

Use k6 or Artillery for load testing:

Test scenarios:
1. Dashboard load with 10,000+ BOM items
2. MRP calculation with 100 concurrent schedules
3. Concurrent inventory updates
4. Large CSV uploads (5000+ rows)

Benchmarks:
- Dashboard load: <2s
- MRP calculation: <5s per schedule
- CSV upload: <10s for 1000 rows
- API response time: <500ms (95th percentile)

File: scripts/generate-test-data.ts

Generate realistic test data:
- 1000 BOM items across categories
- 50 products with complete BOM definitions
- 90 days of throughput data
- 30 days of sales orders
- 20 production schedules
- Include edge cases

Run tests:
```bash
npm run test:unit     # Unit tests
npm run test:e2e      # Playwright tests
npm run test:load     # Performance tests
npm run test:coverage # Coverage report
```

Set up pre-commit hook:
File: .husky/pre-commit

```bash
#!/bin/sh
npm run typecheck
npm run test:unit
npm run lint
```

Create custom command: /audit-tests
This command runs all tests and generates coverage report.

Use Plan Mode to ensure consistent test patterns across all test files.
```

---

### Prompt 6.2: Documentation & Code Quality

```
Improve code quality, add comprehensive documentation, and establish standards.

**Code Cleanup**

1. Run ESLint with strict configuration:

File: .eslintrc.json

Add rules:
- No unused variables
- No console.log in production
- Consistent return types
- Prefer const over let
- No any types
- Explicit function return types

Run:
```bash
npm run lint:fix
```

2. Add Prettier for formatting:

File: .prettierrc

Configuration:
- Semi: true
- Single quotes: true
- Tab width: 2
- Trailing comma: es5
- Print width: 100

Format all files:
```bash
npm run format
```

3. TypeScript strict checks:

In tsconfig.json, ensure:
- strict: true
- noImplicitAny: true
- strictNullChecks: true
- noUnusedLocals: true
- noUnusedParameters: true

Fix all TypeScript errors.

4. Add JSDoc comments:

For all public functions, add:
```typescript
/**
 * Calculates Material Requirements Planning for a production schedule
 * 
 * @param scheduleId - Unique identifier for the production schedule
 * @returns Array of material requirement results with gross/net requirements
 * @throws {Error} If schedule not found or BOM data missing
 * 
 * @example
 * const results = await calculateMRP('schedule-123');
 * console.log(results[0].netRequirement);
 */
async function calculateMRP(scheduleId: string): Promise<MRPResult[]>
```

**Documentation**

File: docs/README.md

Contents:
# ERP/MRP System Documentation

## Overview
Brief description of system purpose and capabilities.

## Table of Contents
- Setup & Installation
- Project Structure
- Key Features
- API Documentation
- Database Schema
- Business Logic
- Deployment
- Troubleshooting

File: docs/SETUP.md

Contents:
# Setup & Installation Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

## Installation Steps
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Setup database
5. Run migrations
6. Seed test data
7. Start development server

## Environment Variables
List all required variables with descriptions.

## Development Workflow
- Running tests
- Building for production
- Linting and formatting

File: docs/API.md

Contents:
# API Documentation

For each endpoint:
## POST /api/upload/bom

**Description**: Upload BOM inventory CSV file

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: file (CSV)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRows": 100,
    "inserted": 95,
    "updated": 5,
    "failed": 0
  }
}
```

**Errors**:
- 400: Invalid file format or validation errors
- 500: Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/upload/bom \
  -F "file=@bom_inventory.csv"
```

Document ALL endpoints.

File: docs/DATABASE.md

Contents:
# Database Schema Documentation

## Entity Relationship Diagram
[Include ERD image]

## Tables

### BomItem
**Purpose**: Stores bill of materials components

**Columns**:
- id (String, PK): Unique identifier
- partNumber (String, Unique): Part number
- description (String): Part description
- ...

**Indexes**:
- partNumber (unique)
- category

**Relationships**:
- One-to-many with InventoryMovement
- ...

Document ALL tables.

## Important Queries

Common queries with explanations:
- Get items below reorder point
- Calculate total inventory value
- Get production schedule for date range

File: docs/BUSINESS_LOGIC.md

Contents:
# Business Logic Documentation

## MRP Calculation

### Overview
Material Requirements Planning calculates material needs based on production schedules.

### Process Flow
1. Input: Production schedule
2. Get product BOM
3. Calculate gross requirements
4. Check available inventory
5. Calculate net requirements
6. Generate purchase orders

### Formulas

**Gross Requirement**:
```
Gross Requirement = Quantity Per Unit × Total Units to Produce
```

**Net Requirement**:
```
Net Requirement = max(0, Gross Requirement - Current Stock)
```

**Safety Stock**:
```
Safety Stock = 20% × Reorder Point
```

**Reorder Point**:
```
Reorder Point = (Daily Usage × Lead Time) + Safety Stock
```

### Edge Cases
- Zero inventory
- Multiple schedules sharing components
- Long lead times

Document ALL major business logic areas.

File: docs/USER_GUIDE.md

Contents:
# User Guide

## Getting Started
Welcome message and overview.

## Common Tasks

### Uploading BOM Data
Step-by-step with screenshots:
1. Navigate to BOM page
2. Click "Upload CSV"
3. Select file
4. Review validation
5. Confirm upload

### Generating Production Schedule
...

### Interpreting the Dashboard
...

Include screenshots for each section.

**Type Definitions**

File: src/types/index.ts

Consolidate all TypeScript types:
- Import and re-export from model files
- Add utility types
- Add shared types

Ensure every function has proper types.

**Error Handling**

File: src/lib/errors.ts

Create custom error classes:

```typescript
export class MRPCalculationError extends Error {
  constructor(message: string, public scheduleId: string) {
    super(message);
    this.name = 'MRPCalculationError';
  }
}

export class InsufficientInventoryError extends Error {
  constructor(
    message: string,
    public partNumber: string,
    public required: number,
    public available: number
  ) {
    super(message);
    this.name = 'InsufficientInventoryError';
  }
}
```

Use these throughout codebase.

**Code Comments**

Add inline comments for:
- Complex algorithms
- Business rule implementations
- Non-obvious calculations
- Workarounds or TODOs

Use Compact command if conversation gets cluttered during documentation phase.
```

---

### Prompt 6.3: Performance Optimization

```
Optimize application for production performance and scalability.

**Database Optimization**

1. Add missing indexes:

File: prisma/schema.prisma

Add indexes to:
```prisma
model BomItem {
  // ... existing fields
  
  @@index([category])
  @@index([currentStock])
  @@index([reorderPoint])
}

model SalesOrder {
  @@index([timePeriod, productId])
  @@index([priority])
  @@index([status])
}

model ProductionSchedule {
  @@index([startDate, endDate])
  @@index([status, startDate])
  @@index([workstationId, startDate])
}

model ThroughputData {
  @@index([date, productId])
  @@index([workstationId, date])
}

model InventoryMovement {
  @@index([partNumber, timestamp])
  @@index([movementType, timestamp])
}

model Alert {
  @@index([status, severity, createdAt])
  @@index([alertType, status])
}
```

Generate migration:
```bash
npx prisma migrate dev --name add_performance_indexes
```

2. Query optimization:

File: src/lib/database/queries.ts

Create optimized queries:

```typescript
// Instead of loading all fields
const bomItems = await prisma.bomItem.findMany();

// Select only needed fields
const bomItems = await prisma.bomItem.findMany({
  select: {
    partNumber: true,
    currentStock: true,
    unitCost: true
  }
});

// Use pagination
const bomItems = await prisma.bomItem.findMany({
  skip: page * limit,
  take: limit
});

// Use where clause to filter at database level
const lowStock = await prisma.bomItem.findMany({
  where: {
    currentStock: {
      lte: prisma.bomItem.fields.reorderPoint
    }
  }
});
```

3. Connection pooling:

File: src/lib/database/client.ts

Configure Prisma connection pool:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Add to DATABASE_URL:
```
?connection_limit=10&pool_timeout=60
```

**Frontend Optimization**

1. Code splitting:

File: src/app/dashboard/page.tsx

Use dynamic imports:

```typescript
import dynamic from 'next/dynamic';

const ThroughputChart = dynamic(
  () => import('@/components/dashboard/ThroughputChart'),
  { loading: () => <ChartSkeleton /> }
);

const InventoryBarChart = dynamic(
  () => import('@/components/dashboard/InventoryBarChart'),
  { loading: () => <ChartSkeleton /> }
);
```

2. Data fetching optimization:

File: src/lib/hooks/useData.ts

Use React Query with caching:

```typescript
import { useQuery } from '@tanstack/react-query';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchInterval: 30000 // Auto-refresh every 30s
  });
}
```

3. Table virtualization:

For large tables (>1000 rows):

File: src/components/bom/VirtualizedBomTable.tsx

Use @tanstack/react-virtual:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedBomTable({ items }: { items: BomItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10
  });
  
  // Render only visible items
}
```

4. Memoization:

File: src/lib/calculations/memoized.ts

Use useMemo for expensive calculations:

```typescript
const totalValue = useMemo(() => {
  return bomItems.reduce((sum, item) => 
    sum + (item.currentStock * item.unitCost), 0
  );
}, [bomItems]);
```

5. Debouncing:

For search inputs:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value) => setSearchTerm(value),
  500
);
```

**API Optimization**

1. Response compression:

File: next.config.js

Enable compression:

```javascript
module.exports = {
  compress: true,
  // ...
};
```

2. Caching strategy:

File: src/app/api/dashboard/route.ts

Add cache headers:

```typescript
export async function GET() {
  const data = await fetchDashboardData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
    }
  });
}
```

3. Rate limiting:

File: src/middleware.ts

Add rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m')
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  return NextResponse.next();
}
```

**Monitoring & Logging**

File: src/lib/monitoring/logger.ts

Use structured logging:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Usage
logger.info({ userId, action: 'upload_bom' }, 'BOM uploaded');
logger.error({ error, scheduleId }, 'MRP calculation failed');
```

File: src/lib/monitoring/metrics.ts

Track performance metrics:

```typescript
export class PerformanceMonitor {
  static startTimer(operation: string) {
    return {
      end: () => {
        const duration = performance.now() - start;
        logger.info({ operation, duration }, 'Operation completed');
      }
    };
  }
}

// Usage
const timer = PerformanceMonitor.startTimer('mrp_calculation');
await calculateMRP(scheduleId);
timer.end();
```

**Load Testing**

File: tests/load/dashboard-load.ts

Create load test script:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Spike
    { duration: '5m', target: 50 }, // Stay at spike
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% failures
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/dashboard');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

Run:
```bash
k6 run tests/load/dashboard-load.ts
```

**Performance Benchmarks**

Create benchmark tests:

File: tests/benchmark/calculations.bench.ts

```typescript
import { describe, bench } from 'vitest';

describe('MRP Calculation Performance', () => {
  bench('calculate MRP for 100 components', async () => {
    await calculateMRP(scheduleWith100Components);
  });
  
  bench('calculate inventory value for 10,000 items', async () => {
    await calculateInventoryValue();
  });
});
```

Target benchmarks:
- MRP calculation: <100ms per product
- Inventory value calculation: <200ms
- Dashboard data aggregation: <500ms
- CSV parsing (1000 rows): <1s

Run profiling and optimize bottlenecks.

Use Plan Mode to coordinate optimization across database, frontend, and backend.
```

---

## Phase 7: Final Polish & Deployment

### Prompt 7.1: Deployment Setup

```
Prepare application for production deployment.

**Environment Configuration**

File: .env.production.example

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/erp_prod?schema=public

# Authentication (if using NextAuth)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_strong_secret_here

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=alerts@yourcompany.com

# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=erp-uploads-prod

# Redis (for caching)
REDIS_URL=redis://default:password@host:6379

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Feature Flags
ENABLE_SCHEDULED_REPORTS=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

**Build Configuration**

File: next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },
  
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
```

**Docker Setup**

File: Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

File: docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: erp_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://erp_user:secure_password@postgres:5432/erp_production
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

**CI/CD Pipeline**

File: .github/workflows/ci-cd.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type checking
        run: npm run typecheck
      
      - name: Setup database
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
        run: |
          npx prisma migrate deploy
          npx prisma db seed
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Build Docker image
        run: docker build -t erp-system:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag erp-system:${{ github.sha }} yourregistry/erp-system:latest
          docker push yourregistry/erp-system:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          # Add deployment commands (e.g., kubectl, AWS ECS, etc.)
          echo "Deploying to production..."
```

**Database Migrations**

Create migration strategy:

File: scripts/migrate-production.sh

```bash
#!/bin/bash

# Backup database before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status

echo "Migration complete. Backup created."
```

**Health Checks**

File: src/app/api/health/route.ts

```typescript
import { prisma } from '@/lib/database/client';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection (if using)
    // await redis.ping();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    );
  }
}
```

**Monitoring Setup**

File: src/lib/monitoring/sentry.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});
```

**Production Checklist**

Create checklist file:

File: docs/DEPLOYMENT_CHECKLIST.md

```markdown
# Production Deployment Checklist

## Pre-Deployment
- [ ] All tests passing
- [ ] No console.logs in production code
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring configured (Sentry, DataDog, etc.)
- [ ] Logging configured
- [ ] Error tracking enabled

## Database
- [ ] Migrations tested on staging
- [ ] Indexes created
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] Database credentials secured

## Security
- [ ] API keys rotated
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection enabled

## Performance
- [ ] Caching configured
- [ ] CDN setup for static assets
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Database queries optimized

## Monitoring
- [ ] Health check endpoint working
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup

## Documentation
- [ ] API documentation up to date
- [ ] User guide published
- [ ] Deployment guide written
- [ ] Troubleshooting guide available

## Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance tests passed
- [ ] Monitor for errors
- [ ] Check logs for issues
- [ ] Verify scheduled jobs running
- [ ] Test email notifications
- [ ] Verify backups working
```

Use Plan Mode to coordinate all deployment configurations and ensure nothing is missed.
```

---

## Appendix: Quick Reference

### Custom Commands Summary

```bash
/validate-bom        # Validate BOM CSV structure
/run-mrp [scheduleId]  # Run MRP calculation
/generate-mock-data [type]  # Generate test data
/audit-tests        # Check test coverage
/calculate-costs [sku]  # Run cost calculations
```

### Keyboard Shortcuts

- `Shift + Tab` (twice): Enable Plan Mode
- `Control-V`: Paste screenshot
- `Escape`: Stop current response
- `Double Escape`: Rewind conversation
- `#`: Add to memory
- `@filename`: Reference specific file

### Important File Paths

```
/prisma/schema.prisma          # Database schema
/src/models/types.ts           # TypeScript types
/src/lib/mrp-calculator.ts     # MRP engine
/src/lib/inventory-manager.ts  # Inventory logic
/src/lib/financial-calculator.ts  # Financial calculations
/src/app/dashboard/page.tsx    # Main dashboard
/.claude/commands/             # Custom commands
/.claude/settings.local.json   # Hooks configuration
```

### Common Patterns

**Creating a new feature:**
1. Read relevant SKILL.md if applicable
2. Enable Plan Mode for multi-file changes
3. Use @ to reference related files
4. Create types first
5. Implement logic with tests
6. Create UI components
7. Add to dashboard if needed

**Debugging:**
1. Use Escape to stop unhelpful responses
2. Add debugging details to memory with #
3. Use Thinking Mode for complex issues
4. Check hooks aren't blocking needed operations

**Testing:**
1. Write tests alongside features
2. Use hooks for automatic test running
3. Target >80% coverage
4. Include edge cases

---

## Final Notes

This is a comprehensive plan. You don't have to implement everything at once. Start with Phase 1-2 to get the foundation, then add features incrementally.

Key success factors:
1. **Use Claude.md effectively** - It's the memory of your project
2. **Enable Plan Mode for complex tasks** - It helps Claude think through multi-step implementations
3. **Create custom commands early** - They save time on repetitive tasks
4. **Set up hooks for quality** - Prevent errors automatically
5. **Iterate on UI with screenshots** - Visual feedback helps Claude understand what you want
6. **Test as you go** - Don't wait until the end

Good luck building your ERP/MRP system! 🚀
