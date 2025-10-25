# ERP/MRP System Documentation

## Overview

A comprehensive Enterprise Resource Planning (ERP) and Material Requirements Planning (MRP) system designed for C-suite executives to manage manufacturing operations, production scheduling, inventory, and financial metrics.

Built with **Next.js 14**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, this system provides real-time insights into production planning, material requirements, inventory management, and financial performance.

## Key Features

### 📦 Bill of Materials (BOM) Management
- Import BOM data via CSV upload
- Track components, parts, and raw materials
- Multi-level BOM support with quantity relationships
- Real-time stock levels and supplier information

### 📊 Production Planning & Scheduling
- Automated schedule generation from sales forecasts
- Capacity-aware scheduling with workstation allocation
- Multi-shift planning capabilities
- Conflict detection and capacity utilization analysis
- Historical throughput data integration

### 🔧 Material Requirements Planning (MRP)
- Time-phased MRP calculations
- Gross-to-net requirements analysis
- Economic Order Quantity (EOQ) optimization
- Safety stock and reorder point calculations
- Lead time-based order date determination
- Multi-schedule allocation algorithms

### 📈 Sales Order Management
- Sales forecast tracking
- Priority-based order management
- Due date monitoring
- Demand aggregation by product

### 🏭 Inventory Management
- Automated inventory decrementation during production
- Complete audit trail (InventoryMovement table)
- Reorder point alerts
- Manual adjustment capabilities
- Receiving and shipment tracking
- Real-time stock availability

### 💰 Financial Analytics
- Daily financial snapshots
- Inventory valuation (FIFO, average cost)
- Work-in-progress (WIP) tracking
- Cost variance analysis
- Profitability metrics by product
- Material cost breakdowns

### 🔔 Alert System
- Critical shortage notifications
- Reorder point triggers
- Schedule conflict warnings
- Capacity overrun alerts
- Cost variance notifications
- Quality issue flagging

### 📤 Data Export & Reporting
- CSV export for all data entities
- Excel export with formatting
- PDF reports with charts and tables
- Scheduled daily/weekly reports
- Custom date range exports

## Technology Stack

- **Framework**: Next.js 14 (App Router, React Server Components)
- **Language**: TypeScript 5 (strict mode enabled)
- **Database**: PostgreSQL via Prisma ORM 5
- **State Management**: React Query (TanStack Query) v5
- **Validation**: Zod v3
- **Styling**: Tailwind CSS v3 + shadcn/ui (Radix UI primitives)
- **Testing**: Vitest (unit tests) with 79 comprehensive tests
- **Utilities**:
  - papaparse (CSV parsing)
  - date-fns (date manipulation)
  - recharts (data visualization)
  - xlsx (Excel export)
  - jspdf + jspdf-autotable (PDF generation)
  - lucide-react (icons)

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed test data (optional)
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

For detailed installation instructions, see [SETUP.md](./SETUP.md)

## Documentation

- **[Setup & Installation](./SETUP.md)** - Complete installation guide with environment setup
- **[API Documentation](./API.md)** - All REST API endpoints with examples
- **[Database Schema](./DATABASE.md)** - Entity relationship diagrams and table definitions
- **[Business Logic](./BUSINESS_LOGIC.md)** - MRP calculations, formulas, and algorithms
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference for resuming work
- **[RESUME_GUIDE.md](./RESUME_GUIDE.md)** - Detailed session startup guide

## Project Structure

```
/src
  /app
    /api                    # REST API routes
      /bom                  # BOM management endpoints
      /sales                # Sales order endpoints
      /schedules            # Production scheduling
      /mrp                  # MRP calculation endpoints
      /inventory            # Inventory transactions
      /financial            # Financial metrics & reports
      /alerts               # Alert management
      /analytics            # Throughput & performance analytics
      /export               # Data export endpoints
    layout.tsx              # Root layout with providers
    page.tsx                # Dashboard home page
    globals.css             # Tailwind base + design tokens
  /components
    /ui                     # shadcn/ui components
  /hooks                    # React Query custom hooks
  /lib                      # Core business logic
    mrp-calculator.ts       # MRP engine
    production-planner.ts   # Scheduling algorithms
    inventory-manager.ts    # Inventory transactions
    financial-calculator.ts # Financial metrics
    throughput-analyzer.ts  # Performance analytics
    alert-manager.ts        # Alert generation
    /exporters              # CSV/Excel/PDF export utilities
    /jobs                   # Scheduled background jobs
    /__tests__              # Unit tests
  /models                   # Zod validation schemas
/prisma
  schema.prisma             # Database schema (source of truth)
  /migrations               # Migration history
  seed.ts                   # Test data seeding script
/docs                       # Documentation (you are here)
```

## Architecture Highlights

### Dual Schema Pattern
- **Prisma schema**: Database structure and relationships
- **Zod schemas**: Runtime validation and TypeScript types
- Both must be kept in sync for consistency

### API Route Pattern
1. Parse and validate request body with Zod
2. Use Prisma client singleton for database operations
3. Return JSON responses with proper HTTP status codes
4. Separate error handling (400 for validation, 500 for server errors)

### React Query Integration
- Centralized data fetching with caching
- Automatic refetching on window focus disabled
- 1-minute stale time by default
- Optimistic updates for better UX

### Database Transaction Safety
- Inventory decrementation uses Prisma transactions
- Atomic updates prevent race conditions
- Audit trails for all inventory movements
- Rollback on failure ensures data integrity

## Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

**Test Coverage**: 79 comprehensive tests across all core business logic modules

## Code Quality

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

### TypeScript Strict Mode

All strict compiler options enabled:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

## Key Workflows

### 1. Upload BOM Data
```
User uploads CSV → API validates format → Parse with papaparse →
Upsert BomItem records → Create ProductBom relationships → Return summary
```

### 2. Generate Production Schedule
```
Sales forecasts → Aggregate by product → Fetch throughput data →
Calculate capacity → Generate schedule proposals → Detect conflicts →
Save to database → Return schedule
```

### 3. Calculate MRP
```
Production schedule → Explode BOM → Calculate gross requirements →
Net against inventory → Calculate EOQ → Determine order dates →
Create MaterialRequirement records → Generate shortage alerts
```

### 4. Execute Production
```
Complete production → Decrement inventory (transaction) →
Create audit trail → Check reorder points → Generate alerts →
Update schedule status
```

### 5. Daily Financial Snapshot
```
Scheduled job → Calculate inventory value → Sum WIP →
Aggregate costs → Store snapshot → Compare to previous day →
Generate cost variance alerts
```

## Performance Considerations

- **Database Indexing**: Unique indexes on part numbers, SKUs, schedule IDs
- **Query Optimization**: Strategic use of `include` and `select` in Prisma
- **Batch Processing**: MRP calculations can run for multiple schedules
- **Caching**: React Query caches API responses client-side
- **Transaction Safety**: Critical operations use database transactions

## Security

- **Input Validation**: All API inputs validated with Zod schemas
- **Type Safety**: TypeScript strict mode prevents common errors
- **SQL Injection Protection**: Prisma ORM uses parameterized queries
- **Environment Variables**: Sensitive config in `.env` (not committed)

## Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

Recommended deployment platforms:
- **Vercel** (optimal for Next.js)
- **Railway** (with PostgreSQL addon)
- **AWS** (EC2 + RDS)
- **DigitalOcean** (App Platform)

## Support & Contributing

- **Issues**: Report bugs and feature requests in project tracker
- **Documentation**: Update this guide when adding features
- **Testing**: Add unit tests for all business logic
- **Code Style**: Follow ESLint + Prettier configurations

## License

Proprietary - All rights reserved

---

**Last Updated**: 2025-01-24
**Version**: 0.1.0
**Phase**: 6.1 Complete (79 tests, full testing infrastructure)
