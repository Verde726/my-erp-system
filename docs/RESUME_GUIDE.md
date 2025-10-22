# How to Resume Work - ERP/MRP System

## 🎯 Every Time You Start Working

### The 3-Step Process

```bash
# 1. Navigate
cd C:\Users\green\my-erp-system

# 2. Start Claude Code  
claude

# 3. Give Context (choose one below)
```

---

## 💬 What to Say to Claude Code

### Option 1: Quick Resume (Recommended)
```
Resuming ERP/MRP system.

@CLAUDE.md
@docs/ERP_Project_Progress_Tracker.md

Review progress and tell me what's next.
```

### Option 2: Detailed Resume
```
Working on ERP/MRP system.

COMPLETED: [List from Progress Tracker]
✅ Phase 1: Foundation
✅ Phase 2: Data Management
... [etc]

CURRENT: Phase [X]
NEXT: Prompt [X.Y] - [Feature Name]

@CLAUDE.md review context
```

### Option 3: Continue Specific Feature
```
Continuing work on [feature name].

Last session completed: [what you finished]
Next step: [what you're doing now]

@CLAUDE.md
@src/[relevant-file].ts
```

---

## 📋 Full Resume Template

Copy-paste this and fill in the blanks:

```
Resuming ERP/MRP system work.

LAST SESSION:
- Completed: [Phase X.Y - Feature Name]
- Date: [when you last worked]

CURRENT STATUS:
- System has [X] working modules
- Routes operational: /bom, /sales, /mrp, /finance, /
- Phase [X] is [X]% complete

NEXT TASK:
- Prompt [X.Y]: [Feature Name]
- Estimated time: [X hours]

@CLAUDE.md review project
@docs/ERP_Project_Progress_Tracker.md check status

Ready to start [feature name].
```

---

## 🔍 If You Forgot Where You Were

### Step 1: Check Your Progress Tracker
```
@docs/ERP_Project_Progress_Tracker.md

What was the last completed item?
```

### Step 2: Check Git History
```bash
git log --oneline -10
```

This shows your last 10 commits with descriptions.

### Step 3: Ask Claude to Assess
```
@CLAUDE.md
@src/app

Review the project structure and tell me:
1. What routes are implemented?
2. What features are working?
3. What phase are we in?
4. What should we work on next?
```

---

## 🎯 Working on Different Projects

### Your Project Locations:
```
ERP System:
cd C:\Users\green\my-erp-system

Other Projects:
cd C:\Users\green\CascadeProjects\[project-name]
```

### Universal Resume Pattern:
```bash
cd [project-path]
claude
```
```
Working on [project-name].

@CLAUDE.md

[Brief status or goal for this session]
```

---

## 💡 Pro Tips

### 1. Always Reference Claude.md
```
@CLAUDE.md
```
This reminds Claude of your project structure and goals.

### 2. Use @ to Show Files
```
@src/lib/mrp-calculator.ts

Review this implementation before we add the new feature.
```

### 3. Update Memory After Big Changes
```
# Remember: Completed Phase 5. Next is Phase 6 - Testing.
```

### 4. Reference Docs for Prompts
```
@docs/Claude_Code_Prompts_Ready_To_Use.md

Show me Prompt 6.1 for Testing.
```

---

## 🐛 Troubleshooting

### "Claude doesn't know about my project"
**Fix:**
- Make sure you're in the right directory (`pwd`)
- Reference `@CLAUDE.md` explicitly
- Give a brief project summary

### "Claude Code can't find my files"
**Fix:**
```bash
# Check where you are
pwd

# Should show: C:\Users\green\my-erp-system
# If not, navigate there
cd C:\Users\green\my-erp-system

# Restart Claude Code
exit
claude
```

### "I don't remember what phase I'm on"
**Fix:**
```
@docs/ERP_Project_Progress_Tracker.md

What's the current phase and progress?
```

---

## 📅 End of Session Checklist

Before closing Claude Code:

```
☐ 1. Commit your changes
   git add .
   git commit -m "Completed [feature]"
   git push

☐ 2. Update Progress Tracker
   Edit /docs/ERP_Project_Progress_Tracker.md
   Mark completed items ✅
   Note what's next ⏭️

☐ 3. Update Claude.md memory
   # Remember: [what you did and what's next]

☐ 4. Test what you built
   npm run dev
   Check routes work

☐ 5. Make notes
   Any issues? Write them down.
   Questions for next time? Note them.
```

---

## 🎯 Common Session Patterns

### Pattern 1: Implementing Next Prompt
```bash
cd C:\Users\green\my-erp-system
claude
```
```
Resuming ERP. @CLAUDE.md review.

Ready for Prompt [X.Y]: [Feature Name]

[Paste prompt from docs/Claude_Code_Prompts_Ready_To_Use.md]
```

### Pattern 2: Fixing a Bug
```bash
cd C:\Users\green\my-erp-system  
claude
```
```
Found a bug in [feature]. 

@src/[file-with-bug].ts

The issue is: [description]

How should we fix this?
```

### Pattern 3: Adding Polish
```bash
cd C:\Users\green\my-erp-system
claude
```
```
Want to improve [feature] by adding [enhancement].

@src/[relevant-file].ts

Current implementation above. How can we enhance it?
```

---

## 📊 Progress Tracking

### After Each Session, Update:

**Progress Tracker** (`/docs/ERP_Project_Progress_Tracker.md`):
- Mark completed items with ✅
- Update percentage complete
- Note next steps with ⏭️
- Add session notes

**Claude.md** (via memory command):
```
# Remember: Completed Phase X.Y on [date]. Next is X.Z.
# Note: [any important context for next session]
```

**Git Commits**:
```bash
git commit -m "Phase X.Y: [Feature Name] - [brief description]"
```

---

## 🚀 You've Got This!

Remember:
- Your code is ALWAYS saved (it's in real files)
- Claude.md preserves project context
- Progress Tracker shows where you are
- Prompts document guides next steps

Just navigate to project → start Claude → reference docs → keep building!

Happy coding! 💪
