# Quick Guide: Manual Deployment Location Change

## ⚠️ Location Changed

The **Manual Deployment** button has moved!

### ❌ Old Location (Removed)

```
Toolbar:
[Environment ▼] [📦] [↶] [↷] [💾 Save ▼] [⚙️]
                 ↑
         Standalone button
         (NO LONGER HERE)
```

### ✅ New Location

```
Toolbar:
[Environment ▼] [↶] [↷] [💾 Save ▼] [⚙️]
                                     ↑
                            Click Settings menu

Settings Menu:
┌──────────────────────────────┐
│ ⚙️ Workflow Settings         │
│ 📦 Manual Deployment         │ ← HERE NOW!
├──────────────────────────────┤
│ ⬆️ Import Workflow           │
│ ⬇️ Export Workflow           │
└──────────────────────────────┘
```

## How to Deploy Now

### Step-by-Step

```
1. Click Settings Button (⚙️)
   ┌──────────────────────────────┐
   │ ⚙️ Workflow Settings         │
   │ 📦 Manual Deployment    ← 2. Click this
   ├──────────────────────────────┤
   │ ⬆️ Import Workflow           │
   │ ⬇️ Export Workflow           │
   └──────────────────────────────┘

3. Configure Deployment
   ┌───────────────────────────────┐
   │  Manual Deployment            │
   │                               │
   │  Source: Development    ▼     │
   │  Target: Staging        ▼     │
   │                               │
   │  Version: [auto: 1.0.1]       │
   │  Note: Ready for testing      │
   │                               │
   │  ☑ Copy Variables             │
   │  ☑ Auto-activate              │
   │                               │
   │     [Cancel]  [Deploy] ✅     │
   └───────────────────────────────┘

4. Done!
```

## All Environment Features

### Quick Reference Card

```
┌─────────────────────────────────────────┐
│  ENVIRONMENT FEATURES ACCESS GUIDE      │
├─────────────────────────────────────────┤
│                                         │
│  SELECT ENVIRONMENT                     │
│  └─ Environment Selector ▼              │
│     Click dropdown to choose:           │
│     • Development                       │
│     • Staging                           │
│     • Production                        │
│                                         │
│  UPDATE ENVIRONMENT                     │
│  └─ Save Button ▼                       │
│     Click dropdown arrow:               │
│     • Save Workflow                     │
│     • Update [Selected Environment]     │
│                                         │
│  DEPLOY BETWEEN ENVIRONMENTS            │
│  └─ Settings Menu ⚙️                    │
│     Click settings, then:               │
│     • Manual Deployment                 │
│                                         │
└─────────────────────────────────────────┘
```

## Why the Change?

### Before (Cluttered)

```
[Environment ▼] [📦 Deploy] [↶] [↷] [💾 Save ▼] [⚙️]
                 ↑ Taking up valuable space
```

### After (Clean)

```
[Environment ▼] [↶] [↷] [💾 Save ▼] [⚙️]
                                     ↑ Deploy is here now
```

**Result:** Cleaner toolbar! ✨

## Common Tasks

### Task 1: Update Development

```
1. Select "Development" in Environment Selector
2. Make changes to workflow
3. Click Save ▼ (dropdown arrow)
4. Select "Update Development"
5. Done! ✅
```

### Task 2: Deploy to Staging

```
1. Click Settings ⚙️
2. Select "Manual Deployment"
3. Source: Development
4. Target: Staging
5. Click Deploy
6. Done! ✅
```

### Task 3: Deploy to Production

```
1. Click Settings ⚙️
2. Select "Manual Deployment"
3. Source: Staging
4. Target: Production
5. Add note: "v1.0 release"
6. Click Deploy
7. Done! ✅
```

## Quick Tips

### 💡 Tip 1: Update vs Deploy

```
UPDATE (Save ▼):
  Current Workflow → Environment
  Use for: Development iterations

DEPLOY (Settings ⚙️):
  Environment → Environment
  Use for: Promoting to next stage
```

### 💡 Tip 2: Keyboard Shortcuts

```
Ctrl+S → Save Workflow
(No shortcut for Deploy - use Settings menu)
```

### 💡 Tip 3: Find Settings Menu

```
Look for ⚙️ icon (More Options)
Rightmost button in toolbar
```

## Toolbar Layout

### Complete Toolbar Map

```
Left Side:
┌──────┐ ┌─────────────┐
│  ≡   │ │  My Workflow│
└──────┘ └─────────────┘
Sidebar    Breadcrumb

Center:
┌──────────────┐ ┌─────────┐ ┌──────────────┐
│Environment ▼ │ │    ▶    │ │ ⌘K Add Node  │
└──────────────┘ └─────────┘ └──────────────┘
  Select Env     Execute      Command Palette

Right Side:
┌──┐ ┌──┐ ┌─────────┐ ┌──┐
│↶│ │↷│ │💾 Save▼│ │⚙️│ ← Settings (Deploy is here!)
└──┘ └──┘ └─────────┘ └──┘
Undo Redo   Save      Settings
```

## Settings Menu Contents

```
Click ⚙️ to see:

┌──────────────────────────────┐
│                              │
│  ⚙️ Workflow Settings        │ ← Configure workflow
│  📦 Manual Deployment        │ ← Deploy between envs
│  ─────────────────────────   │
│  ⬆️ Import Workflow          │ ← Import JSON
│  ⬇️ Export Workflow          │ ← Export JSON
│                              │
└──────────────────────────────┘
```

## Migration Checklist

### For Existing Users

- [x] ~~Look for Deploy button (📦) in toolbar~~ **REMOVED**
- [ ] Learn new location: Settings ⚙️ → Manual Deployment
- [ ] Practice: Click Settings → Select Manual Deployment
- [ ] Remember: Same dialog, same functionality
- [ ] Benefit: Enjoy cleaner toolbar!

## Summary

### What Changed

```
FROM: Standalone button in toolbar
TO:   Menu item in Settings dropdown
```

### How to Access

```
1. Click Settings (⚙️)
2. Select "Manual Deployment"
3. Configure and deploy
```

### Why It's Better

```
✅ Cleaner toolbar
✅ Better organization
✅ More professional
✅ Room for future features
```

### The Trade-off

```
➖ One extra click
✅ Much cleaner interface

Worth it! ✨
```

---

## Need Help?

### Can't find Manual Deployment?

→ Look in Settings menu (⚙️ More Options button)

### Want to update an environment?

→ Use Save dropdown (▼) instead

### Want to select an environment?

→ Use Environment Selector dropdown

### Still confused?

→ Check full documentation: `MANUAL_DEPLOYMENT_MOVED_TO_DROPDOWN.md`

---

**Remember:** Settings button (⚙️) → Manual Deployment 🎯
