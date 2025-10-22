# ERP/MRP System for C-Suite Executives

A modern Enterprise Resource Planning (ERP) and Manufacturing Resource Planning (MRP) system built with Next.js 14, designed specifically for C-suite executives.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Data Fetching**: React Query (TanStack Query)
- **Validation**: Zod
- **Utilities**:
  - papaparse (CSV parsing)
  - date-fns (date utilities)
  - recharts (charts and visualizations)
  - xlsx (Excel file handling)
  - lucide-react (icons)

## Project Structure

```
/app              # Next.js app router pages and API routes
  /api            # API endpoints
  layout.tsx      # Root layout with providers
  page.tsx        # Home page
  globals.css     # Global styles
  providers.tsx   # React Query provider
/components       # React components
  /ui             # shadcn/ui components
/lib              # Utility functions and business logic
  utils.ts        # Utility functions
  db.ts           # Prisma client instance
/models           # TypeScript interfaces and Zod schemas
/hooks            # Custom React hooks
/prisma           # Database schema and migrations
  schema.prisma   # Prisma schema
/tests            # Test files
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure your PostgreSQL database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_db?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
```

3. Initialize the database:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Management

- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes without migrations

## Features

- **Dashboard**: Executive-level KPI dashboard with real-time metrics
- **Product Management**: Track inventory, SKUs, and stock levels
- **Customer Management**: Manage customer data and relationships
- **Supplier Management**: Track supplier information
- **Type Safety**: Full TypeScript coverage with strict mode
- **Data Validation**: Zod schemas for runtime validation
- **Modern UI**: Beautiful, accessible components from shadcn/ui
- **Responsive Design**: Mobile-first responsive layout

## Adding shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
```

## Development Guidelines

- Use TypeScript strict mode for all files
- Follow the established project structure
- Use Zod schemas for validation
- Implement API routes in `/app/api`
- Create reusable hooks in `/hooks`
- Store business logic in `/lib`
- Define types and schemas in `/models`

## License

MIT
