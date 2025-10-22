# Quick Start Guide

## Project Setup Complete! ✓

Your Next.js 14 ERP/MRP system has been successfully initialized with all required dependencies and configurations.

## What's Been Set Up

### Core Technologies
- ✅ Next.js 14 with App Router
- ✅ TypeScript in strict mode
- ✅ Tailwind CSS configured
- ✅ shadcn/ui component library ready
- ✅ Prisma ORM configured for PostgreSQL
- ✅ React Query (TanStack Query) for data fetching
- ✅ Zod for schema validation

### Utility Libraries
- ✅ papaparse (CSV parsing)
- ✅ date-fns (date utilities)
- ✅ recharts (charts and visualizations)
- ✅ xlsx (Excel file handling)
- ✅ lucide-react (icons)

### Project Structure
```
my-erp-system/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── products/      # Sample product API
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Executive dashboard home
│   ├── providers.tsx      # React Query provider
│   └── globals.css        # Global styles with design tokens
├── components/            # React components
│   └── ui/               # shadcn/ui components
│       └── button.tsx    # Sample button component
├── hooks/                # Custom React hooks
│   └── useProducts.ts    # Sample product hook
├── lib/                  # Utility functions
│   ├── db.ts            # Prisma client instance
│   └── utils.ts         # Utility functions
├── models/              # TypeScript types and Zod schemas
│   └── index.ts        # Sample schemas (User, Product, etc.)
├── prisma/             # Database configuration
│   └── schema.prisma   # Database schema with sample models
└── tests/              # Test files
```

## Next Steps

### 1. Configure Your Database

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/erp_db?schema=public"
```

### 2. Initialize the Database

Run the initial migration:
```bash
npx prisma migrate dev --name init
```

This will:
- Create your PostgreSQL database
- Apply the initial schema (User, Customer, Product, Supplier tables)
- Generate the Prisma Client

### 3. (Optional) Open Prisma Studio

Explore your database with a GUI:
```bash
npx prisma studio
```

This opens at http://localhost:5555

### 4. Start the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your ERP dashboard!

## Sample Data Models

The project includes these initial models:

- **User** - System users with roles
- **Customer** - Customer management
- **Product** - Inventory tracking with SKU, stock levels, reorder points
- **Supplier** - Supplier information

All models include:
- Zod schemas for validation (`models/index.ts`)
- Prisma database models (`prisma/schema.prisma`)
- Type-safe TypeScript interfaces

## Adding shadcn/ui Components

To add more UI components:

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
```

## Sample API Usage

The project includes a sample Products API:

```typescript
// GET all products
fetch('/api/products')

// POST new product
fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sku: 'PROD-001',
    name: 'Sample Product',
    unitPrice: 99.99,
    stockLevel: 100,
    reorderPoint: 20
  })
})
```

## Sample React Query Hook

```typescript
import { useProducts, useCreateProduct } from '@/hooks/useProducts'

function ProductList() {
  const { data: products, isLoading } = useProducts()
  const createProduct = useCreateProduct()

  // Use products and createProduct...
}
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Create and apply migrations
npx prisma generate     # Regenerate Prisma Client
npx prisma db push      # Push schema changes (dev only)

# shadcn/ui
npx shadcn-ui@latest add [component]  # Add UI components
```

## Project Features

- **Type-Safe**: Full TypeScript coverage with strict mode
- **Validated**: Zod schemas ensure runtime type safety
- **Responsive**: Mobile-first design with Tailwind CSS
- **Modern UI**: Beautiful components from shadcn/ui
- **Efficient**: React Query for smart data caching
- **Database**: PostgreSQL with Prisma ORM
- **Executive-Focused**: Dashboard designed for C-suite decision makers

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify database credentials

### Missing Dependencies
Run `npm install` to ensure all packages are installed

### Type Errors
Run `npx prisma generate` to regenerate the Prisma Client

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Ready to build your ERP system!** Start by customizing the models in `prisma/schema.prisma` and adding your business logic.
