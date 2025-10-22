# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14 ERP/MRP system designed for C-suite executives with TypeScript strict mode, Prisma ORM, React Query, and shadcn/ui components.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm install          # Install dependencies (auto-runs `prisma generate`)
```

### Database Commands (Prisma)
```bash
npx prisma studio              # Open Prisma Studio GUI at http://localhost:5555
npx prisma migrate dev         # Create and apply new migration
npx prisma migrate dev --name <name>  # Create migration with specific name
npx prisma generate            # Regenerate Prisma Client after schema changes
npx prisma db push             # Push schema changes without creating migration (dev only)
npx prisma db seed             # Run seed script (if configured)
```

### Adding UI Components (shadcn/ui)
```bash
npx shadcn-ui@latest add <component>  # Add shadcn/ui component
# Examples: card, table, dialog, form, input, select, dropdown-menu
```

## Architecture

### Data Flow Architecture
1. **Client** → React Query hooks (`/hooks`) → API Routes (`/app/api`)
2. **API Routes** → Zod validation (`/models`) → Prisma Client (`/lib/db.ts`) → PostgreSQL
3. **Types**: Prisma schema defines DB models → Zod schemas in `/models` provide runtime validation → TypeScript types inferred from Zod

### Key Architectural Patterns

**Dual Schema Pattern**: Each entity has both a Prisma schema (database) and a Zod schema (validation/types):
- Prisma schema: `prisma/schema.prisma` - Database structure
- Zod schemas: `models/index.ts` - Runtime validation and TypeScript types
- Keep these in sync when adding/modifying entities

**Prisma Client Singleton**: `lib/db.ts` exports a singleton Prisma client instance that prevents connection pool exhaustion in development (hot reload safe).

**React Query Provider**: `app/providers.tsx` wraps the app with QueryClientProvider. Default config:
- `staleTime: 60000` (1 minute)
- `refetchOnWindowFocus: false`

**API Route Pattern**: All API routes in `/app/api` follow this structure:
1. Parse and validate request body with Zod schema
2. Use Prisma client from `lib/db.ts` for database operations
3. Return JSON responses with appropriate HTTP status codes
4. Handle Zod validation errors separately (400) from server errors (500)

**Path Aliases**: `@/*` maps to project root via `tsconfig.json` and `components.json`
- Import as `@/components/ui/button` not `../../components/ui/button`
- Import as `@/lib/utils` not `../lib/utils`

### Project Structure
```
/app
  /api              # API routes - RESTful endpoints
  layout.tsx        # Root layout with Providers wrapper
  providers.tsx     # React Query client provider (client component)
  page.tsx          # Home/dashboard page
  globals.css       # Tailwind base + design tokens (CSS variables)
/components
  /ui               # shadcn/ui components installed here
/hooks              # Custom React hooks using React Query
/lib
  db.ts             # Prisma client singleton instance
  utils.ts          # Utility functions (cn for className merging)
/models             # Zod schemas + TypeScript types (inferred from Zod)
/prisma
  schema.prisma     # Prisma database schema
  /migrations       # Auto-generated migration files (gitignored)
```

## Database Schema

**Critical File**: `prisma/schema.prisma` - Comprehensive ERP/MRP database schema

### Core ERP/MRP Models

**Manufacturing & Production:**
- `BomItem` - Bill of Materials (raw materials, components, parts)
- `Product` - Finished goods with target margins
- `ProductBom` - Many-to-many mapping (which parts make which products)
- `ProductionSchedule` - Production planning with workstation/shift allocation
- `MaterialRequirement` - MRP calculations and material allocation
- `ThroughputData` - Historical production performance metrics

**Sales & Planning:**
- `SalesOrder` - Sales forecasts and customer orders with priority levels

**Inventory & Finance:**
- `InventoryMovement` - Complete audit trail for all stock changes
- `FinancialMetrics` - Daily financial snapshots (inventory value, WIP, costs)
- `Alert` - System notifications (shortages, reorders, conflicts, overruns)

**Legacy Models:**
- `User`, `Customer`, `Supplier` - Basic entity management

### Key Schema Relationships

```
Product ──< ProductBom >── BomItem
   │                          │
   ├─< SalesOrder             ├─< MaterialRequirement
   ├─< ProductionSchedule     └─< InventoryMovement
   └─< ThroughputData
```

**Critical Foreign Keys:**
- `ProductBom.partNumber` → `BomItem.partNumber` (unique constraint)
- `MaterialRequirement.scheduleId` → `ProductionSchedule.scheduleId`
- `MaterialRequirement.partNumber` → `BomItem.partNumber`

### Schema Modification Workflow

When modifying the schema:
1. Update `prisma/schema.prisma`
2. Update corresponding Zod schema in `models/index.ts`
3. Run `npx prisma migrate dev --name <descriptive_name>`
4. Prisma Client auto-regenerates via `postinstall` script

### Enums Defined
- `Priority`: high, medium, low
- `MovementType`: in, out, adjustment
- `AlertType`: shortage, reorder, schedule_conflict, cost_overrun, capacity_warning, quality_issue
- `Severity`: critical, warning, info

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth (if implementing auth)
- `NEXTAUTH_URL` - Base URL for NextAuth (if implementing auth)

## Technology Stack
- **Framework**: Next.js 14 (App Router, React Server Components)
- **Language**: TypeScript 5 (strict mode enabled)
- **Database**: PostgreSQL via Prisma ORM 5
- **State/Data**: React Query (TanStack Query) v5
- **Validation**: Zod v3
- **Styling**: Tailwind CSS v3 + shadcn/ui (Radix UI primitives)
- **Utilities**: papaparse (CSV), date-fns (dates), recharts (charts), xlsx (Excel), lucide-react (icons)
## 📚 Documentation

Key reference documents in /docs:
- ERP_MRP_Implementation_Plan.md - Complete architecture and strategy
- Claude_Code_Prompts_Ready_To_Use.md - Step-by-step prompts for each phase
- ERP_Project_Progress_Tracker_UPDATED.md - Current progress and next steps
- QUICKSTART.md - Quick reference for resuming work
- RESUME_GUIDE.md - Detailed guide for starting each session

To reference these docs, use: @docs/[filename].md
