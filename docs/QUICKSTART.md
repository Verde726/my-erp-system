# ERP/MRP System - Quick Start Guide

## 🚀 Resuming Work

### Step 1: Navigate to Project
```bash
cd C:\Users\green\my-erp-system
```

### Step 2: Start Claude Code
```bash
claude
```

### Step 3: Tell Claude Where You Are
```
Working on ERP/MRP system. 

Current status: [check Progress Tracker in /docs]

@CLAUDE.md review project
@docs/ERP_Project_Progress_Tracker.md check progress

Ready to continue with [next prompt number].
```

---

## 📚 Key Reference Files

- **Implementation Plan**: `/docs/ERP_MRP_Implementation_Plan.md`
  - Complete architecture and strategy
  - Read this for big picture understanding

- **Prompts**: `/docs/Claude_Code_Prompts_Ready_To_Use.md`
  - Copy-paste ready prompts for each phase
  - Use this for step-by-step implementation

- **Progress Tracker**: `/docs/ERP_Project_Progress_Tracker.md`
  - Shows what's complete and what's next
  - Update this after each session

---

## 🎯 Current Project Status

**Working Routes:**
- `/` - Executive Dashboard with analytics
- `/bom` - Bill of Materials inventory management
- `/sales` - Sales forecasting & production planning
- `/mrp` - Material Requirements Planning
- `/finance` - Financial tracking & cost analysis
- `/alerts` - System notifications & warnings

**Technology Stack:**
- Next.js 14 with TypeScript
- Prisma ORM + PostgreSQL
- React Query for data fetching
- shadcn/ui components
- Recharts for visualizations
- Tailwind CSS

---

## 💾 Before Ending Each Session

### 1. Commit Your Work
```bash
git add .
git commit -m "Completed Phase X.Y: [description]"
git push
```

### 2. Update Progress Tracker
Edit `/docs/ERP_Project_Progress_Tracker.md` with:
- What you completed
- What's next
- Any issues encountered

### 3. Update Claude.md
Use memory command in Claude Code:
```
# Remember: Completed Phase X.Y. Next is Phase X.Z
```

---

## 🐛 Common Issues

### Issue: Claude can't find files
**Solution:**
```bash
# Make sure you're in the right directory
pwd
# Should show: C:\Users\green\my-erp-system

# Restart Claude Code
exit
claude
```

### Issue: Database connection error
**Solution:**
```bash
# Check if PostgreSQL is running
# Verify .env file has correct DATABASE_URL
```

### Issue: Module not found
**Solution:**
```bash
npm install
```

### Issue: TypeScript errors
**Solution:**
```bash
npm run typecheck
# Fix errors shown
```

---

## 📞 Quick Commands

```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests (when implemented)
npm run test

# Build for production
npm run build

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 🎯 Working on Specific Features

### Adding a new feature:
```
@docs/Claude_Code_Prompts_Ready_To_Use.md

Find Prompt [X.Y] for [feature name] and paste it.
```

### Fixing a bug:
```
@src/[relevant-file].ts

Review this file. I'm seeing [error description]. 
How can we fix it?
```

### Understanding existing code:
```
@src/lib/[module-name].ts

Explain what this module does and how it works.
```

---

## 📈 Project Phases

- ✅ Phase 1: Foundation
- ✅ Phase 2: Data Management
- ✅ Phase 3: Production Logic
- ✅ Phase 4: Financial Layer
- ✅ Phase 5: Dashboard & UI
- ⏳ Phase 6: Testing & Polish
- ⏳ Phase 7: Deployment

**Current Phase:** [Update this as you progress]

---

## 🎉 Celebrate Milestones!

- ✅ First route working
- ✅ Database connected
- ✅ Three modules operational
- ✅ Phase 5 complete (70% done!)
- ⏳ All phases complete
- ⏳ Production deployment

You're building something impressive! Keep going! 💪
