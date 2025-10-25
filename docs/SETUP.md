# Setup & Installation Guide

Complete guide for setting up the ERP/MRP system from scratch.

## Prerequisites

Ensure you have the following installed on your system:

### Required Software

- **Node.js**: Version 18.x or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm**: Version 9.x or higher (comes with Node.js)
  - Verify: `npm --version`

- **PostgreSQL**: Version 14.x or higher
  - Download from [postgresql.org](https://www.postgresql.org/download/)
  - Verify: `psql --version`

- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

### Optional But Recommended

- **VS Code**: Recommended code editor with TypeScript support
- **Postman** or **Insomnia**: For API testing
- **pgAdmin** or **DBeaver**: PostgreSQL GUI client

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd my-erp-system
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages from `package.json`
- Automatically run `prisma generate` via postinstall script
- Generate Prisma Client for database access

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL

Create a new database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE erp_system;

# Create user (optional)
CREATE USER erp_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;

# Exit psql
\q
```

#### Option B: Docker PostgreSQL

```bash
docker run --name erp-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=erp_system \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Configure Environment Variables

Create `.env` file in the project root:

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_system?schema=public"

# NextAuth Configuration (optional - for future auth implementation)
NEXTAUTH_SECRET="generate-a-random-32-character-string"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Important**: Replace the DATABASE_URL with your actual credentials:
- `postgres:postgres` → `username:password`
- `localhost:5432` → your database host and port
- `erp_system` → your database name

### 5. Run Database Migrations

Apply all database migrations to create tables:

```bash
npx prisma migrate dev
```

This will:
- Read `prisma/schema.prisma`
- Create all tables, indexes, and relationships
- Generate Prisma Client
- Display migration summary

You should see output like:
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

### 6. Seed Test Data (Optional)

Populate the database with sample data for testing:

```bash
npm run db:seed
```

This creates:
- Sample BOM items (10+ components)
- Products with BOM relationships
- Sample sales orders
- Production schedules
- Throughput data
- Financial metrics

### 7. Verify Installation

Start the development server:

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Verify Database Connection

Open Prisma Studio to browse database:

```bash
npx prisma studio
```

This opens a GUI at [http://localhost:5555](http://localhost:5555) to inspect all tables.

## Development Workflow

### Daily Commands

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Open database GUI
npx prisma studio
```

### Database Commands

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# Push schema changes without migration (dev only)
npx prisma db push

# Regenerate Prisma Client after schema changes
npx prisma generate

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

### Adding UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components:

```bash
# Add a new component
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add form
```

## Project Configuration Files

### TypeScript Configuration

**File**: `tsconfig.json`

- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- Target: ES2015
- All strict type checking enabled

### ESLint Configuration

**File**: `.eslintrc.json`

Extends Next.js and TypeScript rules with custom overrides:
- No unused variables
- No explicit `any` types
- Consistent type imports
- Function return types required
- No console.log in production

### Prettier Configuration

**File**: `.prettierrc`

Code formatting rules:
- Semicolons: true
- Single quotes: true
- Tab width: 2
- Print width: 100
- Trailing commas: es5

### Prisma Configuration

**File**: `prisma/schema.prisma`

Database schema defining:
- 14 database models
- Relationships and constraints
- Indexes for performance
- Enum types

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution**:
```bash
npx prisma generate
```

### Issue: Database connection refused

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`
4. Check firewall/network settings

### Issue: Migration fails

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Reset database (⚠️ destroys data)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev
```

### Issue: Port 3000 already in use

**Solution**:
```bash
# Use different port
PORT=3001 npm run dev
```

Or kill process on port 3000:
```bash
# Windows
npx kill-port 3000

# macOS/Linux
lsof -ti:3000 | xargs kill
```

### Issue: TypeScript errors after pulling changes

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Issue: ESLint errors in IDE

**Solution**:
1. Install ESLint extension for your editor
2. Restart editor
3. Run `npm run lint` to see actual errors

## Testing Your Installation

### 1. Test Database Connection

```bash
npx prisma studio
```
Should open GUI at localhost:5555

### 2. Test API Endpoints

Start dev server (`npm run dev`), then test:

```bash
# Health check
curl http://localhost:3000/api/bom

# Should return empty array or test data
```

### 3. Run Test Suite

```bash
npm run test:run
```

All 79 tests should pass:
```
✓ lib/__tests__/mrp-calculator.test.ts (15 tests)
✓ lib/__tests__/inventory-manager.test.ts (20 tests)
✓ lib/__tests__/financial-calculator.test.ts (24 tests)
✓ lib/__tests__/throughput-analyzer.test.ts (20 tests)
```

## Environment-Specific Setup

### Development

Already covered above. Uses:
- Local PostgreSQL
- Hot reload enabled
- Debug logging active
- Prisma Studio access

### Production

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

Additional production setup:
1. Use managed PostgreSQL (AWS RDS, Railway, etc.)
2. Set `NODE_ENV=production`
3. Configure proper `NEXTAUTH_SECRET`
4. Enable HTTPS
5. Set up monitoring and logging

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t erp-system .
docker run -p 3000:3000 --env-file .env erp-system
```

## Next Steps

1. ✅ Verify all tests pass
2. ✅ Open Prisma Studio and explore schema
3. ✅ Upload sample BOM CSV (see `/docs/API.md` for format)
4. ✅ Create a sales order
5. ✅ Generate production schedule
6. ✅ Run MRP calculation
7. ✅ Review alerts and financial metrics

## Additional Resources

- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **React Query Docs**: [tanstack.com/query](https://tanstack.com/query/latest)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)
- **TypeScript**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs)

---

**Need Help?**
- Check existing issues in project tracker
- Review error logs: `.next/` directory
- Inspect database: `npx prisma studio`
- Run diagnostics: `npm run lint && npm test`
