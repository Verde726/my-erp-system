# ERP/MRP System Implementation Plan for Claude Code

## Executive Summary

This plan outlines the development of a lightweight ERP/MRP system designed for C-suite executives, focusing on production planning, inventory management, and financial tracking. The system will be built using Claude Code with a modern web stack, emphasizing clarity, real-time insights, and actionable data.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Components Breakdown](#core-components-breakdown)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Implementation Phases](#implementation-phases)
6. [Claude Code Strategy](#claude-code-strategy)
7. [Detailed Component Specifications](#detailed-component-specifications)
8. [Claude Code Prompts](#claude-code-prompts)
9. [Testing & Validation Strategy](#testing-validation-strategy)
10. [Deployment & Maintenance](#deployment-maintenance)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Executive Dashboard                      │
│  (Real-time KPIs, Charts, Alerts, Financial Summary)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Production   │  │ Inventory    │  │ Financial    │     │
│  │ Scheduler    │  │ Manager      │  │ Tracker      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Processing Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CSV Parser   │  │ Calculation  │  │ Alert        │     │
│  │ & Validator  │  │ Engine       │  │ Engine       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SQLite/      │  │ Historical   │  │ Configuration│     │
│  │ PostgreSQL   │  │ Data Store   │  │ Store        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Modularity**: Each component is independent and communicable
2. **Scalability**: Start simple, expand as needed
3. **Executive-First**: Dashboard shows what matters to C-suite
4. **Real-Time**: Live calculations and updates
5. **Audit Trail**: Track all changes for compliance

---

## 2. Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts or Chart.js
- **State Management**: Zustand or React Context
- **Data Grid**: AG-Grid or TanStack Table

### Backend
- **Runtime**: Node.js with Express or Next.js API routes
- **Language**: TypeScript
- **Database**: PostgreSQL (production) or SQLite (development)
- **ORM**: Prisma
- **Validation**: Zod

### File Processing
- **CSV Parsing**: PapaParse
- **Excel Support**: xlsx library
- **Data Validation**: Custom validators + Zod schemas

### Testing
- **Unit Tests**: Vitest
- **Integration Tests**: Playwright
- **Type Checking**: TypeScript compiler

---

## 3. Core Components Breakdown

### Component 1: BoM (Bill of Materials) Manager

**Purpose**: Track all components needed to build products

**Features**:
- Upload BoM CSV with columns: Part Number, Description, Quantity Per Unit, Current Stock, Unit Cost, Supplier, Reorder Point, Lead Time
- Hierarchical BoM support (assemblies with sub-components)
- Real-time stock level tracking
- Automatic reorder alerts
- Cost rollup calculations

**Data Model**:
```typescript
interface BomItem {
  partNumber: string;
  description: string;
  quantityPerUnit: number;
  currentStock: number;
  unitCost: number;
  supplier: string;
  reorderPoint: number;
  leadTimeDays: number;
  category: string;
  lastUpdated: Date;
}
```

### Component 2: Sales Data Processor

**Purpose**: Convert sales forecasts into production requirements

**Features**:
- Upload sales CSV with: Product SKU, Forecasted Units, Time Period, Priority
- Automatic production schedule generation
- Demand aggregation by product
- Priority-based scheduling

**Data Model**:
```typescript
interface SalesOrder {
  orderId: string;
  productSku: string;
  forecastedUnits: number;
  timePeriod: Date;
  priority: 'high' | 'medium' | 'low';
  customerSegment: string;
}
```

### Component 3: Production Scheduler

**Purpose**: Create optimal production schedules based on demand and capacity

**Features**:
- Generate production schedule from sales data
- Consider historical throughput rates
- Resource constraint checking
- Multi-shift support
- Bottleneck identification

**Data Model**:
```typescript
interface ProductionSchedule {
  scheduleId: string;
  productSku: string;
  unitsToProducePerDay: number;
  startDate: Date;
  endDate: Date;
  workstationId: string;
  shiftNumber: number;
  status: 'planned' | 'in-progress' | 'completed';
}
```

### Component 4: Throughput Analyzer

**Purpose**: Track and predict production capacity

**Features**:
- Upload historical production data: Date, Product, Units Produced, Hours Worked, Defect Rate
- Calculate units per hour/day metrics
- Identify trends and seasonality
- Capacity planning recommendations

**Data Model**:
```typescript
interface ThroughputData {
  date: Date;
  productSku: string;
  unitsProduced: number;
  hoursWorked: number;
  defectRate: number;
  workstationId: string;
  efficiency: number;
}
```

### Component 5: Inventory Decrementation Engine

**Purpose**: Automatically update inventory as production occurs

**Features**:
- Calculate material requirements based on production schedule
- Decrement inventory in real-time
- Track inventory movements (in/out/adjustments)
- Generate shortage alerts
- Suggest reorder quantities

**Logic Flow**:
```
Production Schedule → Calculate Material Needs → Check Current Inventory → 
Decrement Stock → Update Reorder Status → Alert if Below Reorder Point
```

### Component 6: Financial Tracker

**Purpose**: Provide cost visibility and financial analysis

**Features**:
- Material cost tracking (BoM × quantities)
- Production cost allocation
- Work-in-progress (WIP) valuation
- Finished goods valuation
- Cost variance analysis
- Profitability by product

**Metrics**:
- Total inventory value
- Production costs (material + labor estimates)
- Cost per unit
- Margin analysis
- Cash flow impact

### Component 7: Executive Dashboard

**Purpose**: Single-pane-of-glass view for C-suite

**Key Sections**:

**A. Production Overview**
- Current production status
- Units produced today/week/month
- Schedule adherence %
- Upcoming production pipeline

**B. Inventory Health**
- Total inventory value
- Items below reorder point
- Days of inventory remaining
- Slow-moving items

**C. Financial Summary**
- Total material cost
- WIP value
- Projected production costs
- Cost trends

**D. Alerts & Actions**
- Critical shortages
- Overdue reorders
- Schedule conflicts
- Cost overruns

**E. Analytics**
- Production efficiency trends
- Throughput by product
- Cost per unit trends
- Forecast accuracy

---

## 4. Data Flow Architecture

### Workflow Sequence

```
1. UPLOAD PHASE
   ├─ BoM CSV → Parse → Validate → Store in DB
   ├─ Sales CSV → Parse → Validate → Store in DB
   └─ Historical Production CSV → Parse → Calculate Throughput Rates

2. PROCESSING PHASE
   ├─ Sales Data → Generate Production Schedule
   ├─ Production Schedule → Calculate Material Requirements
   └─ Material Requirements → Check Inventory Availability

3. EXECUTION PHASE
   ├─ Production Schedule → Decrement Inventory
   ├─ Track Actual vs Planned Production
   └─ Update Financial Metrics

4. ANALYSIS PHASE
   ├─ Calculate KPIs
   ├─ Generate Alerts
   └─ Update Dashboard

5. REORDER PHASE
   ├─ Identify Items Below Reorder Point
   ├─ Calculate Optimal Order Quantities
   └─ Generate Purchase Recommendations
```

### Data Integration Points

- **CSV Upload → Database**: Bulk insert with validation
- **Database → Calculation Engine**: Queries for material requirements
- **Calculation Engine → Alert System**: Threshold-based triggers
- **All Systems → Dashboard**: Real-time aggregation queries

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up project structure and core data models

**Deliverables**:
- Project scaffolding with TypeScript + React
- Database schema design and implementation
- CSV upload and parsing infrastructure
- Basic data validation

**Claude Code Approach**:
- Use **/init** to analyze project structure
- Enable **Plan Mode** for architecture decisions
- Create Claude.md with project requirements

### Phase 2: Data Management (Week 3-4)
**Goal**: Implement BoM and Sales data management

**Deliverables**:
- BoM CRUD operations
- Sales data import and storage
- Historical production data import
- Data validation rules

**Claude Code Approach**:
- Custom command: **/validate-bom** for data quality checks
- Hook: TypeScript type checking post-edit
- Memory: Add critical data schemas to Claude.md

### Phase 3: Production Logic (Week 5-6)
**Goal**: Build production scheduling and inventory decrementation

**Deliverables**:
- Production scheduler algorithm
- Material requirements planning (MRP) logic
- Inventory decrementation engine
- Reorder point calculations

**Claude Code Approach**:
- Use **Thinking Mode** for complex scheduling algorithms
- Custom command: **/run-mrp** to test calculations
- Hook: Run unit tests after logic changes

### Phase 4: Financial Layer (Week 7-8)
**Goal**: Add cost tracking and financial analysis

**Deliverables**:
- Cost calculation engine
- Inventory valuation
- Financial reporting functions
- Cost variance tracking

**Claude Code Approach**:
- Plan Mode for financial logic design
- Custom command: **/calculate-costs** for testing
- Memory: Add financial formulas to Claude.md

### Phase 5: Dashboard & UI (Week 9-10)
**Goal**: Create executive dashboard with visualizations

**Deliverables**:
- Interactive dashboard with charts
- Real-time KPI displays
- Alert notifications
- Responsive design

**Claude Code Approach**:
- Use **screenshots** (Control-V) to iterate on UI design
- MCP Server: Consider Playwright for UI testing
- Custom command: **/generate-mock-data** for testing

### Phase 6: Testing & Refinement (Week 11-12)
**Goal**: Comprehensive testing and optimization

**Deliverables**:
- Unit test coverage
- Integration tests
- Performance optimization
- Documentation

**Claude Code Approach**:
- Hook: Duplicate code detection for queries
- Custom command: **/audit-tests** for coverage checks
- Use **Compact** command to maintain clean context

---

## 6. Claude Code Strategy

### Initial Setup

**Step 1: Initialize Project**
```bash
# Run Claude Code initialization
/init
```

This creates Claude.md with project understanding.

**Step 2: Configure Claude.md**

Create three levels of context:

**Project-level Claude.md** (shared with team):
```markdown
# ERP/MRP System

## Project Overview
Lightweight production planning system for C-suite executives.

## Core Functionality
1. BoM inventory tracking
2. Production scheduling from sales data
3. Throughput analysis
4. Inventory decrementation
5. Financial tracking
6. Executive dashboard

## Key Files
- /src/models/schemas.ts - All TypeScript interfaces
- /src/lib/calculations.ts - Core MRP logic
- /prisma/schema.prisma - Database schema
- /src/config/constants.ts - Business rules

## Technology Stack
- Next.js 14 with App Router
- TypeScript (strict mode)
- Prisma ORM with PostgreSQL
- Tailwind + shadcn/ui
- Recharts for visualizations

## Business Rules
- Reorder point = (Lead Time × Daily Usage) + Safety Stock
- Safety Stock = 20% of monthly average usage
- Production schedule uses FIFO for high priority orders
- Cost calculations include 15% overhead allocation
```

**Local Claude.md** (personal notes):
```markdown
# Personal Notes

## Development Preferences
- Prefer functional components with hooks
- Use Zod for all validations
- Keep files under 300 lines
- Always include error handling
- Write tests alongside features
```

**Machine-level Claude.md** (global settings):
```markdown
# Global Preferences

- Always use TypeScript strict mode
- Prefer explicit return types
- Use async/await over promises
- Include JSDoc comments for public functions
```

### Custom Commands

Create `.claude/commands/` directory with these commands:

**1. validate-bom.md**
```markdown
Validate the BoM CSV file structure and data integrity.

Steps:
1. Check required columns: Part Number, Description, Quantity Per Unit, Current Stock, Unit Cost
2. Validate data types (numbers for quantities, valid dates)
3. Check for duplicate part numbers
4. Verify unit costs are positive numbers
5. Ensure reorder points are logical (> 0)
6. Report any validation errors with line numbers
7. Provide summary statistics

Return validation results in structured format.
```

**2. run-mrp.md**
```markdown
Execute Material Requirements Planning calculation for production schedule.

Parameters: $arguments (production schedule ID or date range)

Process:
1. Load production schedule for given period
2. Calculate gross material requirements per product
3. Check current inventory levels
4. Calculate net requirements (gross - available)
5. Generate planned orders considering lead times
6. Flag any shortages or conflicts
7. Display summary with reorder recommendations

Show results in table format with material shortages highlighted.
```

**3. generate-mock-data.md**
```markdown
Generate realistic mock data for testing.

Parameters: $arguments (data type: bom|sales|production|all)

Generate:
- BoM: 50-100 parts with realistic costs and stock levels
- Sales: 3 months of forecast data with seasonal variations
- Production: 90 days of historical throughput data
- Include edge cases (stockouts, rush orders, high/low volumes)

Insert mock data into test database and confirm counts.
```

**4. audit-tests.md**
```markdown
Audit test coverage and identify gaps.

Check:
1. Unit test coverage by module (target: >80%)
2. Integration test coverage for critical paths
3. Missing edge case tests
4. Untested error conditions
5. Mock data quality

Generate report with:
- Current coverage percentage
- List of untested functions
- Recommendations for additional tests
- Priority ranking
```

**5. calculate-costs.md**
```markdown
Run comprehensive cost calculations across system.

Parameters: $arguments (product SKU or "all")

Calculate:
1. Material costs (BoM × quantities × unit costs)
2. Overhead allocation (15% of material costs)
3. WIP valuation (in-progress production)
4. Finished goods value
5. Total inventory value
6. Cost per unit by product
7. Variance from standard costs

Display results with drill-down capability by component.
```

### Hooks for Quality Control

**1. TypeScript Type Checker Hook**

`.claude/settings.local.json`:
```json
{
  "hooks": {
    "post-tool-use": [
      {
        "matcher": "edit|create_file",
        "command": "npm run typecheck"
      }
    ]
  }
}
```

This runs TypeScript compiler after file edits to catch type errors immediately.

**2. Test Runner Hook**

`.claude/settings.local.json`:
```json
{
  "hooks": {
    "post-tool-use": [
      {
        "matcher": "edit|create_file",
        "command": "npm run test:related"
      }
    ]
  }
}
```

Runs relevant tests after code changes.

**3. Duplicate Query Detection Hook**

For preventing duplicate database queries, create:

`hooks/query_dedup_hook.js`:
```javascript
const fs = require('fs');
const path = require('path');

// Read stdin to get tool call data
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const toolData = JSON.parse(input);
  
  // Only check files in /src/queries/ directory
  if (toolData.tool_input.path?.includes('/src/queries/')) {
    const newCode = toolData.tool_input.content;
    
    // Check for similar patterns in existing queries
    const queriesDir = './src/queries/';
    const files = fs.readdirSync(queriesDir);
    
    for (const file of files) {
      const existingCode = fs.readFileSync(path.join(queriesDir, file), 'utf8');
      
      // Simple similarity check (enhance with AST parsing)
      if (areSimilar(newCode, existingCode)) {
        console.error(`Duplicate query detected! Similar to ${file}. Please reuse existing query.`);
        process.exit(2); // Block the operation
      }
    }
  }
  
  process.exit(0); // Allow the operation
});

function areSimilar(code1, code2) {
  // Implement similarity detection (simplified here)
  // In production, use AST comparison or semantic analysis
  const normalized1 = code1.replace(/\s+/g, '').toLowerCase();
  const normalized2 = code2.replace(/\s+/g, '').toLowerCase();
  
  // Check for significant overlap (>70% similarity)
  return calculateSimilarity(normalized1, normalized2) > 0.7;
}
```

### MCP Servers

Consider adding these MCP servers:

**1. Database Inspector MCP**
- Allows Claude to query database directly for analysis
- Useful for debugging data issues

**2. Playwright MCP** (if building web UI)
- Enables Claude to test UI interactions
- Take screenshots for design iteration

**Installation**:
```bash
claude mcp add playwright npx -y playwright-mcp
```

### Context Management Strategy

**Use @ mentions for specific files**:
```
@src/models/schemas.ts review the BomItem interface
```

**Use # for memory updates**:
```
# Remember: Always validate inventory quantities are non-negative before updating
```

**Use Escape strategically**:
- Press Escape to stop unhelpful responses
- Press Escape + # to add permanent memory about repeated mistakes
- Double Escape to rewind conversation and skip debugging tangents

**Use Compact command**:
- After long debugging sessions, use `/compact` to maintain Claude's understanding while removing clutter

**Use Clear command**:
- Only when switching to completely different task: `/clear`

---

## 7. Detailed Component Specifications

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model BomItem {
  id              String   @id @default(cuid())
  partNumber      String   @unique
  description     String
  quantityPerUnit Float
  currentStock    Float
  unitCost        Float
  supplier        String
  reorderPoint    Float
  leadTimeDays    Int
  category        String
  safetyStock     Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  movements       InventoryMovement[]
  requirements    MaterialRequirement[]
}

model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  description String?
  category    String
  targetMargin Float   @default(0.3)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  salesOrders        SalesOrder[]
  productionSchedules ProductionSchedule[]
  bomComponents      ProductBom[]
  throughputData     ThroughputData[]
}

model ProductBom {
  id              String   @id @default(cuid())
  productId       String
  partNumber      String
  quantityNeeded  Float
  
  product         Product  @relation(fields: [productId], references: [id])
  @@unique([productId, partNumber])
}

model SalesOrder {
  id              String   @id @default(cuid())
  orderId         String   @unique
  productId       String
  forecastedUnits Float
  timePeriod      DateTime
  priority        String   // 'high', 'medium', 'low'
  customerSegment String?
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  
  product         Product  @relation(fields: [productId], references: [id])
}

model ProductionSchedule {
  id                  String   @id @default(cuid())
  scheduleId          String   @unique
  productId           String
  unitsToProducePerDay Float
  startDate           DateTime
  endDate             DateTime
  workstationId       String
  shiftNumber         Int
  status              String   @default("planned") // 'planned', 'in-progress', 'completed'
  actualUnitsProduced Float?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  product             Product  @relation(fields: [productId], references: [id])
  materialRequirements MaterialRequirement[]
}

model MaterialRequirement {
  id              String   @id @default(cuid())
  scheduleId      String
  partNumber      String
  requiredQuantity Float
  allocatedQuantity Float   @default(0)
  status          String   @default("pending") // 'pending', 'allocated', 'insufficient'
  createdAt       DateTime @default(now())
  
  schedule        ProductionSchedule @relation(fields: [scheduleId], references: [id])
  bomItem         BomItem @relation(fields: [partNumber], references: [partNumber])
}

model ThroughputData {
  id              String   @id @default(cuid())
  date            DateTime
  productId       String
  unitsProduced   Float
  hoursWorked     Float
  defectRate      Float
  workstationId   String
  efficiency      Float
  createdAt       DateTime @default(now())
  
  product         Product  @relation(fields: [productId], references: [id])
  
  @@index([date, productId])
}

model InventoryMovement {
  id              String   @id @default(cuid())
  partNumber      String
  movementType    String   // 'in', 'out', 'adjustment'
  quantity        Float
  reference       String?  // e.g., "Production Schedule #123"
  reason          String?
  previousStock   Float
  newStock        Float
  timestamp       DateTime @default(now())
  
  bomItem         BomItem  @relation(fields: [partNumber], references: [partNumber])
  
  @@index([partNumber, timestamp])
}

model FinancialMetrics {
  id                  String   @id @default(cuid())
  date                DateTime
  totalInventoryValue Float
  wipValue            Float
  finishedGoodsValue  Float
  totalMaterialCost   Float
  productionCostEst   Float
  createdAt           DateTime @default(now())
  
  @@index([date])
}

model Alert {
  id          String   @id @default(cuid())
  alertType   String   // 'shortage', 'reorder', 'schedule_conflict', 'cost_overrun'
  severity    String   // 'critical', 'warning', 'info'
  title       String
  description String
  reference   String?  // e.g., part number or schedule ID
  status      String   @default("active") // 'active', 'resolved', 'dismissed'
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
  
  @@index([status, createdAt])
}
```

### Core Calculation Functions

**MRP Calculation Engine** (`src/lib/mrp-calculator.ts`):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MRPResult {
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

/**
 * Calculate Material Requirements Planning for production schedule
 */
export async function calculateMRP(
  scheduleId: string
): Promise<MRPResult[]> {
  const schedule = await prisma.productionSchedule.findUnique({
    where: { id: scheduleId },
    include: { product: { include: { bomComponents: true } } }
  });

  if (!schedule) throw new Error('Schedule not found');

  const totalUnits = 
    schedule.unitsToProducePerDay * 
    daysBetween(schedule.startDate, schedule.endDate);

  const results: MRPResult[] = [];

  for (const bomComponent of schedule.product.bomComponents) {
    const bomItem = await prisma.bomItem.findUnique({
      where: { partNumber: bomComponent.partNumber }
    });

    if (!bomItem) continue;

    const grossRequirement = bomComponent.quantityNeeded * totalUnits;
    const netRequirement = Math.max(0, grossRequirement - bomItem.currentStock);
    
    const status = 
      netRequirement === 0 ? 'sufficient' :
      netRequirement < bomItem.reorderPoint ? 'shortage' :
      'critical';

    const leadTimeDate = new Date(schedule.startDate);
    leadTimeDate.setDate(leadTimeDate.getDate() - bomItem.leadTimeDays);

    results.push({
      partNumber: bomItem.partNumber,
      description: bomItem.description,
      grossRequirement,
      currentStock: bomItem.currentStock,
      netRequirement,
      plannedOrderQuantity: calculateOrderQuantity(netRequirement, bomItem),
      orderDate: leadTimeDate,
      requiredDate: schedule.startDate,
      status
    });
  }

  return results;
}

function calculateOrderQuantity(netReq: number, bomItem: any): number {
  // Economic Order Quantity or minimum order quantity logic
  const minOrderQty = bomItem.reorderPoint * 2;
  return Math.max(netReq, minOrderQty);
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
```

**Inventory Decrementation** (`src/lib/inventory-manager.ts`):

```typescript
/**
 * Decrement inventory based on production schedule
 */
export async function decrementInventoryForProduction(
  scheduleId: string,
  actualUnitsProduced: number
): Promise<void> {
  const schedule = await prisma.productionSchedule.findUnique({
    where: { id: scheduleId },
    include: { product: { include: { bomComponents: true } } }
  });

  if (!schedule) throw new Error('Schedule not found');

  // Start transaction
  await prisma.$transaction(async (tx) => {
    for (const component of schedule.product.bomComponents) {
      const quantityUsed = component.quantityNeeded * actualUnitsProduced;
      
      const bomItem = await tx.bomItem.findUnique({
        where: { partNumber: component.partNumber }
      });

      if (!bomItem) continue;

      if (bomItem.currentStock < quantityUsed) {
        throw new Error(
          `Insufficient stock for ${component.partNumber}. ` +
          `Required: ${quantityUsed}, Available: ${bomItem.currentStock}`
        );
      }

      const newStock = bomItem.currentStock - quantityUsed;

      // Update inventory
      await tx.bomItem.update({
        where: { partNumber: component.partNumber },
        data: { currentStock: newStock }
      });

      // Log movement
      await tx.inventoryMovement.create({
        data: {
          partNumber: component.partNumber,
          movementType: 'out',
          quantity: quantityUsed,
          reference: `Production Schedule ${schedule.scheduleId}`,
          reason: 'Production consumption',
          previousStock: bomItem.currentStock,
          newStock: newStock
        }
      });

      // Check reorder point
      if (newStock <= bomItem.reorderPoint) {
        await createReorderAlert(tx, bomItem, newStock);
      }
    }
  });
}

async function createReorderAlert(tx: any, bomItem: any, currentStock: number) {
  await tx.alert.create({
    data: {
      alertType: 'reorder',
      severity: currentStock === 0 ? 'critical' : 'warning',
      title: `Reorder Required: ${bomItem.partNumber}`,
      description: 
        `Stock level (${currentStock}) is at or below reorder point (${bomItem.reorderPoint}). ` +
        `Lead time: ${bomItem.leadTimeDays} days. Supplier: ${bomItem.supplier}`,
      reference: bomItem.partNumber
    }
  });
}
```

**Financial Calculator** (`src/lib/financial-calculator.ts`):

```typescript
export interface FinancialSnapshot {
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

/**
 * Calculate current financial metrics
 */
export async function calculateFinancialSnapshot(): Promise<FinancialSnapshot> {
  // Get all BOM items and their values
  const bomItems = await prisma.bomItem.findMany();
  
  const rawMaterialsValue = bomItems
    .filter(item => item.category === 'raw_material')
    .reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

  const componentsValue = bomItems
    .filter(item => item.category !== 'raw_material')
    .reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

  const totalInventoryValue = rawMaterialsValue + componentsValue;

  // Get WIP value (in-progress production)
  const inProgressSchedules = await prisma.productionSchedule.findMany({
    where: { status: 'in-progress' },
    include: { product: { include: { bomComponents: true } } }
  });

  let wipValue = 0;
  for (const schedule of inProgressSchedules) {
    const unitsInProgress = schedule.unitsToProducePerDay;
    const materialCostPerUnit = await calculateMaterialCostPerUnit(schedule.productId);
    wipValue += unitsInProgress * materialCostPerUnit;
  }

  // Calculate production cost estimate (next 30 days)
  const futureSchedules = await prisma.productionSchedule.findMany({
    where: {
      status: 'planned',
      startDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  });

  let productionCostEstimate = 0;
  for (const schedule of futureSchedules) {
    const units = schedule.unitsToProducePerDay * 
      daysBetween(schedule.startDate, schedule.endDate);
    const costPerUnit = await calculateMaterialCostPerUnit(schedule.productId);
    productionCostEstimate += units * costPerUnit;
  }

  const overheadAllocation = productionCostEstimate * 0.15; // 15% overhead

  return {
    totalInventoryValue,
    wipValue,
    finishedGoodsValue: 0, // Implement based on finished goods tracking
    totalMaterialCost: totalInventoryValue,
    productionCostEstimate: productionCostEstimate + overheadAllocation,
    breakdown: {
      rawMaterialsValue,
      componentsValue,
      overheadAllocation
    }
  };
}

async function calculateMaterialCostPerUnit(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { bomComponents: true }
  });

  if (!product) return 0;

  let totalCost = 0;
  for (const component of product.bomComponents) {
    const bomItem = await prisma.bomItem.findUnique({
      where: { partNumber: component.partNumber }
    });
    if (bomItem) {
      totalCost += component.quantityNeeded * bomItem.unitCost;
    }
  }

  return totalCost;
}
```

---

## 8. Claude Code Prompts

Below are detailed prompts to use with Claude Code, organized by implementation phase. Use these sequentially or adapt as needed.

### Phase 1: Foundation

#### Prompt 1.1: Initialize Project

```
Create a new Next.js 14 project with TypeScript for an ERP/MRP system. 

Requirements:
- Use App Router
- Set up Tailwind CSS with shadcn/ui
- Configure TypeScript in strict mode
- Add Prisma ORM with PostgreSQL
- Include these dependencies: zod, papaparse, date-fns, recharts
- Create folder structure: /src/app, /src/lib, /src/components, /src/models
- Set up environment variables template (.env.example)

Initialize with /init command and create comprehensive Claude.md file documenting the project structure and goals.
```

#### Prompt 1.2: Database Schema

```
@prisma/schema.prisma

Implement the database schema for our ERP/MRP system with these models:

1. BomItem - Bill of Materials components
   - Fields: id, partNumber (unique), description, quantityPerUnit, currentStock, unitCost, supplier, reorderPoint, leadTimeDays, category, safetyStock, timestamps

2. Product - Finished products
   - Fields: id, sku (unique), name, description, category, targetMargin, timestamps

3. ProductBom - Product to BOM mapping (many-to-many)
   - Links products to their required components with quantities

4. SalesOrder - Sales forecasts
   - Fields: orderId, productId, forecastedUnits, timePeriod, priority, customerSegment, status, timestamp

5. ProductionSchedule - Production planning
   - Fields: scheduleId, productId, unitsToProducePerDay, startDate, endDate, workstationId, shiftNumber, status, actualUnitsProduced, timestamps

6. MaterialRequirement - MRP calculations
   - Links schedules to required materials with quantities

7. ThroughputData - Historical production data
   - Fields: date, productId, unitsProduced, hoursWorked, defectRate, workstationId, efficiency

8. InventoryMovement - Audit trail
   - Tracks all inventory in/out/adjustments

9. FinancialMetrics - Daily snapshots
   - Aggregated financial data

10. Alert - System notifications
    - Shortage alerts, reorder notifications, etc.

Include proper indexes, foreign keys, and constraints. Generate Prisma migration after schema creation.
```

### Phase 2: Data Management

#### Prompt 2.1: CSV Upload Infrastructure

```
Create a robust CSV upload and parsing system.

Components needed:

1. /src/lib/csv-parser.ts
   - Generic CSV parser using PapaParse
   - Type-safe parsing with Zod validation
   - Error collection and reporting
   - Support for large files (streaming if >10MB)

2. /src/lib/validators/bom-validator.ts
   - Zod schema for BOM CSV
   - Required fields: Part Number, Description, Qty Per Unit, Current Stock, Unit Cost, Supplier, Reorder Point, Lead Time Days
   - Validation rules:
     * Part numbers must be unique
     * Quantities and costs must be positive numbers
     * Lead times must be integers > 0
   - Return detailed error messages with row numbers

3. /src/lib/validators/sales-validator.ts
   - Zod schema for Sales CSV
   - Required fields: Order ID, Product SKU, Forecasted Units, Date, Priority
   - Validate dates are future dates
   - Priority must be 'high', 'medium', or 'low'

4. /src/app/api/upload/bom/route.ts
   - API endpoint for BOM CSV upload
   - Parse → Validate → Bulk insert to database
   - Return success/error response with statistics
   - Handle duplicate part numbers gracefully

Use Plan Mode for this multi-file task. Create error handling patterns that we can reuse for other upload endpoints.
```

#### Prompt 2.2: BOM Management UI

```
Create a BOM inventory management interface.

Requirements:

1. /src/app/bom/page.tsx
   - Display all BOM items in sortable, filterable table
   - Use AG-Grid or TanStack Table
   - Columns: Part Number, Description, Current Stock, Unit Cost, Reorder Point, Status
   - Color code status: Green (sufficient), Yellow (below reorder point), Red (out of stock)
   - Search/filter by part number, description, category
   - Click row to see detailed view

2. Upload section at top
   - Drag-and-drop CSV upload
   - Show upload progress
   - Display validation results
   - Show success/error summary

3. Inventory Actions
   - Manual stock adjustment with reason tracking
   - Bulk update via CSV
   - Export current inventory to CSV

4. Use shadcn/ui components for consistent styling

Take a screenshot of a similar data table UI you like, paste it with Control-V, and iterate on the design to match that aesthetic.
```

#### Prompt 2.3: Sales Data Import

```
Create sales data import functionality.

1. /src/app/api/upload/sales/route.ts
   - Parse sales CSV
   - Validate product SKUs exist in database
   - Create SalesOrder records
   - Handle duplicate order IDs (update vs insert)

2. /src/lib/production-planner.ts
   - Function: generateProductionSchedule(timePeriod: DateRange)
   - Aggregate sales orders by product and time period
   - Consider priority levels (high priority orders scheduled first)
   - Check production capacity using throughput data
   - Create ProductionSchedule records
   - Return schedule with capacity warnings if demand exceeds capacity

3. /src/app/sales/page.tsx
   - Display upcoming sales orders
   - Show aggregated demand by product
   - Trigger production schedule generation button
   - Display generated schedule in timeline view

Use Thinking Mode to design the production scheduling algorithm - it needs to handle priority, capacity constraints, and time windows intelligently.
```

### Phase 3: Production Logic

#### Prompt 3.1: MRP Engine

```
Implement Material Requirements Planning (MRP) calculation engine.

Create /src/lib/mrp-calculator.ts with:

1. calculateMRP(scheduleId: string): Promise<MRPResult[]>
   - Input: Production schedule ID
   - Process:
     a. Get production schedule and associated product
     b. Get product's BOM components
     c. Calculate total units to produce (units/day × days)
     d. For each component:
        - Calculate gross requirement (qty needed × total units)
        - Get current stock level
        - Calculate net requirement (gross - available)
        - Determine order date (schedule start - lead time)
        - Calculate economic order quantity
        - Classify status (sufficient/shortage/critical)
   - Return array of MaterialRequirement objects

2. createMaterialRequirements(scheduleId: string): Promise<void>
   - Execute MRP calculation
   - Create MaterialRequirement records in database
   - Link to production schedule
   - Generate alerts for shortages

3. Error handling:
   - Missing BOM data
   - Invalid schedule
   - Negative stock situations

Include comprehensive unit tests using Vitest. Test edge cases like:
- Zero inventory scenarios
- Multiple products sharing same components
- Long lead times that push order dates into the past

Use Plan Mode to think through the MRP logic carefully before implementing.
```

#### Prompt 3.2: Inventory Decrementation

```
Implement automatic inventory decrementation when production occurs.

Create /src/lib/inventory-manager.ts:

1. decrementInventoryForProduction(scheduleId, actualUnitsProduced)
   - Get production schedule and product BOM
   - For each component:
     a. Calculate quantity used (qty per unit × units produced)
     b. Check if sufficient stock exists
     c. Update currentStock (use database transaction)
     d. Create InventoryMovement record for audit trail
     e. Check if new stock level triggers reorder alert
   - Throw error if insufficient stock for any component
   - Return list of decremented items

2. recordInventoryMovement(partNumber, type, quantity, reference, reason)
   - Create audit trail entry
   - Capture before/after stock levels
   - Timestamp all movements

3. checkReorderPoint(partNumber)
   - Get current stock and reorder point
   - If stock ≤ reorder point:
     a. Calculate recommended order quantity (consider lead time, daily usage, safety stock)
     b. Create Alert record
     c. Return alert details
   - Consider: Don't create duplicate alerts for same part

4. Add database transaction handling to ensure atomicity

Include TypeScript strict types for all parameters. Add JSDoc comments explaining the business logic.

Use a custom command /run-mrp to test the complete flow: schedule → MRP → decrementation.
```

#### Prompt 3.3: Throughput Analysis

```
Create throughput analysis and capacity planning tools.

1. /src/lib/throughput-analyzer.ts

Functions:

a. analyzeThroughput(productId: string, dateRange: DateRange)
   - Query ThroughputData for historical production
   - Calculate metrics:
     * Average units per hour
     * Average units per day
     * Standard deviation (variability)
     * Efficiency trend (improving/declining)
     * Defect rate trend
   - Return summary statistics

b. predictCapacity(productId: string, futureDays: number)
   - Use historical throughput to predict capacity
   - Consider:
     * Moving average of recent performance
     * Seasonal patterns (if data available)
     * Working days (exclude weekends)
   - Return predicted units per day with confidence interval

c. identifyBottlenecks(scheduleId: string)
   - Compare scheduled production vs historical throughput
   - Flag schedules that exceed typical capacity
   - Return bottleneck warnings with recommendations

2. /src/app/api/upload/throughput/route.ts
   - API endpoint for historical production data CSV upload
   - Parse CSV with columns: Date, Product SKU, Units Produced, Hours Worked, Defect Rate, Workstation
   - Calculate efficiency metric: (Units Produced / Hours Worked) / Expected Rate
   - Bulk insert ThroughputData records

3. /src/app/analytics/throughput/page.tsx
   - Display throughput trends over time
   - Use Recharts for line charts showing:
     * Units per day by product
     * Efficiency trends
     * Defect rates
   - Filterable by product, date range, workstation
   - Show capacity planning predictions

Use Thinking Mode for the capacity prediction algorithm - it needs statistical analysis and trend detection.
```

### Phase 4: Financial Layer

#### Prompt 4.1: Cost Calculation Engine

```
Implement comprehensive cost tracking and financial calculations.

Create /src/lib/financial-calculator.ts:

1. calculateMaterialCostPerUnit(productId: string)
   - Get product's BOM components
   - Sum: (quantity needed × unit cost) for all components
   - Return total material cost per unit

2. calculateProductionCost(scheduleId: string)
   - Get material cost per unit
   - Multiply by scheduled units
   - Add overhead allocation (15% of material cost)
   - Return total production cost estimate

3. calculateInventoryValue()
   - Sum (currentStock × unitCost) for all BOM items
   - Group by category for breakdown
   - Return total value and category breakdown

4. calculateWIPValue()
   - Get all 'in-progress' production schedules
   - For each:
     a. Calculate material cost of units in progress
     b. Add proportional overhead
   - Return total WIP value

5. calculateFinancialSnapshot()
   - Aggregate function returning:
     * Total inventory value
     * WIP value
     * Projected production costs (next 30 days)
     * Material cost breakdown by category
     * Cost per unit by product
     * Inventory turnover ratio
   - Store snapshot in FinancialMetrics table

6. trackCostVariance(scheduleId: string, actualCosts: number)
   - Compare actual costs vs estimated costs
   - Calculate variance percentage
   - Create alert if variance > 10%
   - Return variance analysis

Add a scheduled job (using node-cron or similar) to run calculateFinancialSnapshot() daily at midnight.

Include error handling for missing cost data. Use Plan Mode to design the comprehensive financial snapshot function.
```

#### Prompt 4.2: Financial Dashboard UI

```
Create financial overview dashboard for C-suite.

Create /src/app/finance/page.tsx:

Layout (3-column grid):

**Column 1: Key Metrics (Cards)**
- Total Inventory Value ($ amount, % change from last week)
- WIP Value ($ amount, units in progress)
- Projected Production Costs (next 30 days)
- Average Cost Per Unit (by top 5 products)

**Column 2: Cost Breakdown (Pie/Donut Chart)**
- Inventory value by category
  * Raw Materials
  * Components
  * Finished Goods
- Interactive: click to see detailed list

**Column 3: Trends (Line Charts)**
- Inventory value over time (last 90 days)
- Production costs over time
- Cost per unit trend by product

**Bottom Section: Cost Alerts**
- Table showing cost variances
- Highlight items with >10% variance
- Show recommended actions

Styling:
- Use shadcn/ui card components
- Recharts for visualizations
- Tailwind for responsive grid
- Professional color scheme (blues, greens for positive, reds for alerts)

Add export to PDF functionality using jsPDF or similar.

Take a screenshot of a financial dashboard you like (Control-V) and iterate on the design to create a similar aesthetic.
```

### Phase 5: Dashboard & UI

#### Prompt 5.1: Executive Dashboard

```
Create the main executive dashboard - single-pane-of-glass view for C-suite.

Create /src/app/dashboard/page.tsx:

**Top Section: KPI Cards (4 across)**
1. Production Status
   - Units produced today
   - Schedule adherence % (green >95%, yellow 85-95%, red <85%)
   - Next scheduled production

2. Inventory Health
   - Total inventory value
   - Items below reorder point (red alert badge if >0)
   - Days of inventory remaining

3. Alerts & Actions
   - Critical alerts count (red badge)
   - Pending actions count
   - Click to see alert details

4. Financial Summary
   - Total production cost (today)
   - Cost variance (green/red indicator)
   - WIP value

**Middle Section: Visualizations (2 columns)**

Left Column:
- Production Schedule Timeline
  * Gantt-style view of next 30 days
  * Color-coded by product
  * Show capacity utilization %

- Throughput Trend Chart
  * Line chart showing units/day over last 30 days
  * Compare actual vs planned

Right Column:
- Inventory Status Chart
  * Bar chart showing current stock vs reorder point for critical items
  * Color-coded: green (healthy), yellow (low), red (critical)

- Material Requirements
  * Upcoming material needs for next 7 days
  * Flag shortages in red

**Bottom Section: Active Alerts Table**
- Columns: Type, Severity, Description, Created, Action
- Filter by severity (Critical, Warning, Info)
- Click to dismiss or resolve
- Auto-refresh every 30 seconds

Responsive Design:
- Desktop: 3-column layout
- Tablet: 2-column layout
- Mobile: Single column, cards stack

Use shadcn/ui for all components. Make the dashboard visually appealing with appropriate use of color, spacing, and typography. Add subtle animations for loading states.

Implement real-time updates using React Query or SWR for automatic data refresh.
```

#### Prompt 5.2: Alert System

```
Implement comprehensive alert and notification system.

1. /src/lib/alert-manager.ts

Functions:

a. createAlert(type, severity, title, description, reference)
   - Create Alert record
   - Validate severity level
   - Add metadata (timestamp, status = 'active')
   - Return alert ID

b. Alert Types:
   - 'shortage': Inventory below reorder point
   - 'reorder': Time to reorder
   - 'schedule_conflict': Production schedule conflict
   - 'cost_overrun': Cost variance >10%
   - 'capacity_warning': Schedule exceeds typical throughput
   - 'quality_issue': Defect rate above threshold

c. resolveAlert(alertId, resolution)
   - Update alert status to 'resolved'
   - Add resolution timestamp
   - Add resolution notes
   - Return updated alert

d. dismissAlert(alertId)
   - Update alert status to 'dismissed'
   - Keep for audit trail

e. getActiveAlerts(filters?: { type?, severity? })
   - Query active alerts
   - Sort by severity (critical first), then by date
   - Return paginated results

2. /src/app/api/alerts/route.ts
   - GET: Fetch active alerts with filters
   - POST: Create manual alert
   - PATCH: Resolve/dismiss alert

3. /src/components/AlertPanel.tsx
   - Reusable alert panel component
   - Props: filters, limit, showDismissed
   - Display alerts in list or grid
   - Actions: Resolve, Dismiss, View Details
   - Real-time updates

4. Alert Triggering Logic:
   - Integrate into inventory decrementation (shortage alerts)
   - Integrate into MRP calculation (reorder alerts)
   - Integrate into schedule generation (capacity warnings)
   - Integrate into financial calculations (cost overrun alerts)

Add email notification capability for critical alerts using nodemailer or SendGrid.
```

#### Prompt 5.3: Data Export & Reporting

```
Add comprehensive export and reporting capabilities.

1. /src/lib/exporters/pdf-exporter.ts
   - Use jsPDF or PDFKit
   - Functions:
     a. exportInventoryReport(dateRange)
        - Current inventory levels
        - Items below reorder point
        - Inventory value by category
        - Movement history
     b. exportProductionReport(dateRange)
        - Production schedules
        - Actual vs planned production
        - Material consumption
        - Throughput metrics
     c. exportFinancialReport(dateRange)
        - Cost analysis
        - Inventory valuation
        - WIP value
        - Cost variances
   - Include company logo/header
   - Professional formatting with tables and charts

2. /src/lib/exporters/csv-exporter.ts
   - Generic CSV export function
   - Export any dataset to CSV
   - Include column headers
   - Handle date formatting
   - Support for large datasets (streaming)

3. /src/app/api/export/route.ts
   - GET endpoint with query params: type, format, dateRange, filters
   - Support formats: pdf, csv, xlsx
   - Stream large exports
   - Return file download response

4. UI Integration:
   - Add "Export" button to all major views
   - Modal to select format and options
   - Progress indicator for large exports
   - Download trigger when complete

5. Scheduled Reports:
   - Weekly inventory status email
   - Monthly financial summary
   - Daily production report
   - Use node-cron for scheduling

Implement email delivery of scheduled reports with attachment.
```

### Phase 6: Testing & Refinement

#### Prompt 6.1: Comprehensive Testing Suite

```
Create comprehensive test suite for the ERP/MRP system.

1. Unit Tests (Vitest)

Create test files for each module:

a. /src/lib/__tests__/mrp-calculator.test.ts
   - Test MRP calculations with various scenarios:
     * Single product, single component
     * Multiple products sharing components
     * Zero inventory scenarios
     * Insufficient stock scenarios
     * Long lead times
   - Mock Prisma client
   - Test error handling

b. /src/lib/__tests__/inventory-manager.test.ts
   - Test inventory decrementation
   - Test reorder point detection
   - Test audit trail creation
   - Test transaction rollback on errors

c. /src/lib/__tests__/financial-calculator.test.ts
   - Test cost calculations
   - Test inventory valuation
   - Test WIP calculations
   - Test variance analysis

d. /src/lib/__tests__/throughput-analyzer.test.ts
   - Test capacity predictions
   - Test trend analysis
   - Test bottleneck identification

Target >80% code coverage for all calculation engines.

2. Integration Tests (Playwright)

Create /tests/e2e/ directory:

a. bom-upload.spec.ts
   - Test CSV upload flow
   - Test validation error handling
   - Test successful import
   - Verify database records created

b. production-scheduling.spec.ts
   - Test sales data import
   - Test schedule generation
   - Test MRP calculation trigger
   - Verify material requirements created

c. inventory-decrementation.spec.ts
   - Test production completion flow
   - Verify inventory updated
   - Verify alerts created when needed
   - Check audit trail

d. dashboard.spec.ts
   - Test dashboard loads all data
   - Test real-time updates
   - Test filtering and sorting
   - Test export functionality

3. Create /scripts/generate-test-data.ts
   - Generate realistic test datasets
   - Create interconnected test data (products → BOM → sales → schedules)
   - Include edge cases
   - Seed test database

4. Performance Testing
   - Test with large datasets (10,000+ BOM items)
   - Test concurrent user scenarios
   - Identify slow queries
   - Add database indexes as needed

Use custom command /audit-tests to check coverage and identify gaps.
Set up pre-commit hook to run tests automatically.
```

#### Prompt 6.2: Code Quality & Documentation

```
Improve code quality, add documentation, and establish coding standards.

1. Code Cleanup
   - Run ESLint with strict rules
   - Add Prettier for consistent formatting
   - Remove unused imports and variables
   - Ensure all functions have TypeScript types
   - Add JSDoc comments to public functions

2. Documentation

Create /docs directory:

a. README.md
   - Project overview
   - Setup instructions
   - Environment variables guide
   - Running in development
   - Building for production

b. API.md
   - Document all API endpoints
   - Request/response examples
   - Authentication requirements
   - Error responses

c. DATABASE.md
   - Entity relationship diagram
   - Table descriptions
   - Important queries
   - Migration strategy

d. BUSINESS_LOGIC.md
   - MRP calculation methodology
   - Inventory decrementation rules
   - Reorder point calculation
   - Financial calculation formulas
   - Alert triggering conditions

e. USER_GUIDE.md
   - How to upload CSVs
   - How to generate schedules
   - How to interpret dashboard
   - How to handle alerts

3. Code Comments
   - Add inline comments for complex logic
   - Explain business rules
   - Document assumptions
   - Note any workarounds or TODOs

4. Type Safety
   - Create /src/types/ directory
   - Define shared TypeScript interfaces
   - Use discriminated unions for alert types
   - Create Zod schemas that match TypeScript types

5. Error Handling
   - Create custom error classes
   - Standardize error response format
   - Add proper error logging
   - User-friendly error messages

Use Compact command if conversation gets cluttered, then continue with documentation.
```

#### Prompt 6.3: Performance Optimization

```
Optimize the application for performance and scalability.

1. Database Optimization

a. Add missing indexes:
   - BomItem: (partNumber), (category)
   - SalesOrder: (timePeriod, productId)
   - ProductionSchedule: (startDate, endDate, status)
   - ThroughputData: (date, productId)
   - InventoryMovement: (partNumber, timestamp)
   - Alert: (status, createdAt, severity)

b. Query Optimization:
   - Review slow queries using Prisma query logging
   - Add compound indexes for common query patterns
   - Use select statements to limit returned fields
   - Implement pagination for large result sets

c. Database Configuration:
   - Connection pooling settings
   - Query timeout configurations
   - Transaction isolation levels

2. Frontend Optimization

a. Code Splitting:
   - Use Next.js dynamic imports for large components
   - Lazy load dashboard charts
   - Implement route-based code splitting

b. Data Fetching:
   - Implement React Query for caching
   - Use SWR for real-time updates
   - Add optimistic updates for better UX
   - Prefetch critical data

c. Rendering:
   - Virtualize large tables (react-window)
   - Memoize expensive calculations
   - Use React.memo for pure components
   - Debounce search/filter inputs

3. API Optimization

a. Response Compression:
   - Enable gzip compression
   - Minify JSON responses

b. Caching Strategy:
   - Cache slow calculation results (Redis)
   - Set appropriate cache headers
   - Implement cache invalidation strategy

c. Rate Limiting:
   - Add rate limits to API endpoints
   - Protect against abuse

4. Monitoring & Logging

a. Add performance monitoring:
   - API response times
   - Database query times
   - Error rates
   - User activity tracking

b. Logging:
   - Use structured logging (Winston or Pino)
   - Log levels (error, warn, info, debug)
   - Log to file and console
   - Integrate with logging service (DataDog, LogRocket)

5. Load Testing
   - Use Artillery or k6 for load testing
   - Test with realistic traffic patterns
   - Identify bottlenecks
   - Set performance benchmarks

Run performance profiling and create optimization plan with prioritized improvements.
```

---

## 9. Testing & Validation Strategy

### Test Data Requirements

**Sample BoM CSV**:
```csv
Part Number,Description,Quantity Per Unit,Current Stock,Unit Cost,Supplier,Reorder Point,Lead Time Days,Category
PN-001,Steel Rod 1m,2,500,15.50,MetalCorp,100,7,raw_material
PN-002,Bearing 608ZZ,4,1000,2.75,BearingSupply,200,14,component
PN-003,Motor 12V,1,50,45.00,MotorTech,20,21,component
PN-004,Circuit Board,1,150,22.50,ElectronicsInc,50,10,component
```

**Sample Sales CSV**:
```csv
Order ID,Product SKU,Forecasted Units,Date,Priority,Customer Segment
ORD-001,PROD-A,100,2025-11-15,high,enterprise
ORD-002,PROD-A,200,2025-11-30,medium,smb
ORD-003,PROD-B,50,2025-11-20,high,enterprise
```

**Sample Throughput CSV**:
```csv
Date,Product SKU,Units Produced,Hours Worked,Defect Rate,Workstation
2025-10-01,PROD-A,45,8,0.02,WS-001
2025-10-02,PROD-A,48,8,0.015,WS-001
2025-10-03,PROD-A,42,7.5,0.03,WS-001
```

### Validation Checklist

- [ ] All CSV uploads successfully parse
- [ ] Data validation catches invalid entries
- [ ] MRP calculations produce correct material requirements
- [ ] Inventory decrements accurately
- [ ] Reorder alerts trigger at correct thresholds
- [ ] Financial calculations match manual verification
- [ ] Dashboard displays real-time data
- [ ] Exports produce correct files
- [ ] API endpoints handle errors gracefully
- [ ] Database transactions maintain consistency
- [ ] Performance acceptable with 10,000+ records
- [ ] UI responsive on mobile devices
- [ ] Scheduled jobs run on time
- [ ] Tests achieve >80% coverage

---

## 10. Deployment & Maintenance

### Deployment Strategy

**Infrastructure**:
- **Frontend & API**: Vercel or AWS Amplify
- **Database**: AWS RDS (PostgreSQL) or Supabase
- **File Storage**: AWS S3 for CSV uploads
- **Caching**: Redis Cloud
- **Monitoring**: DataDog or New Relic

**Environment Variables**:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SMTP_HOST=smtp.example.com
SMTP_USER=alerts@company.com
SMTP_PASSWORD=...
S3_BUCKET=erp-uploads
AWS_REGION=us-east-1
```

**CI/CD Pipeline**:
1. GitHub Actions on push to main
2. Run tests (unit + integration)
3. Run type checking
4. Build application
5. Deploy to staging
6. Run smoke tests
7. Deploy to production (manual approval)

### Maintenance Plan

**Daily**:
- Monitor error logs
- Check alert queue
- Verify scheduled jobs ran
- Review performance metrics

**Weekly**:
- Review new alerts patterns
- Check inventory accuracy
- Analyze production variances
- Database backup verification

**Monthly**:
- Code quality review
- Security updates
- Performance optimization
- User feedback incorporation

**Quarterly**:
- Major feature updates
- Comprehensive testing
- Documentation updates
- Capacity planning review

---

## Claude Code Best Practices Summary

### Do's:
✅ Use `/init` to start and create comprehensive Claude.md
✅ Use @ mentions for specific files
✅ Use # for memory updates about repeated issues
✅ Enable Plan Mode (Shift + Tab twice) for complex multi-file tasks
✅ Enable Thinking Mode for complex algorithms
✅ Use custom commands for repetitive tasks
✅ Set up hooks for automatic validation
✅ Use Escape to stop and redirect unhelpful responses
✅ Use Compact to clean up long conversations
✅ Paste screenshots (Control-V) for UI iteration
✅ Read relevant skill files before starting (e.g., /mnt/skills/public/pptx/SKILL.md for presentations)

### Don'ts:
❌ Don't let Claude search for files when you know the exact path (use @ mentions)
❌ Don't skip creating Claude.md - it provides essential context
❌ Don't forget to restart Claude after hook changes
❌ Don't use Clear command unless switching to completely different task
❌ Don't ignore TypeScript errors - set up type checking hook
❌ Don't create duplicate code - consider deduplication hook

### Command Reference:
- `/init` - Initialize project and create Claude.md
- `/commandname` - Run custom command
- `#` - Add to memory
- `@filename` - Reference specific file
- `Shift + Tab twice` - Enable Plan Mode
- `"Ultra think"` - Enable Thinking Mode
- `Escape` - Stop current response
- `Double Escape` - Rewind conversation
- `/compact` - Summarize conversation
- `/clear` - Clear conversation history

---

## Conclusion

This plan provides a comprehensive roadmap for building a professional ERP/MRP system using Claude Code. The key to success is:

1. **Start with solid foundations** - proper schema and data models
2. **Use Claude Code features strategically** - Plan Mode for complex tasks, custom commands for repetition
3. **Maintain clean context** - good Claude.md files and memory management
4. **Iterate incrementally** - build in phases, test thoroughly
5. **Leverage hooks** - automatic validation prevents errors
6. **Document as you build** - capture business logic and decisions

The prompts provided are designed to be used sequentially, with each building on the previous work. Adapt them to your specific needs and requirements.

**Estimated Timeline**: 10-12 weeks for full implementation
**Team Size**: 1-2 developers using Claude Code
**Complexity**: Medium-High (production-ready system)

Good luck building your ERP/MRP system! 🚀
