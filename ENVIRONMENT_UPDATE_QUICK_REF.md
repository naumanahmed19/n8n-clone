# Environment Update - Quick Reference

## The Answer

**Q: After creating Development environment it saves snapshot, but how do we update Development?**

**A: Use the Update button (🔄) in the toolbar!**

## Quick Steps

```
1. Select Environment in dropdown (e.g., Development)
2. Click Update button (🔄) next to Deploy button
3. Configure:
   - Version: [Leave empty for auto-increment]
   - Copy Variables: [Check if you added new variables]
   - Note: "What changed"
4. Click "Update Environment"
5. Done! ✅
```

## Button Location

```
Workflow Toolbar:
[≡] [Workflow Name] | [Environment ▼] [🔄] [📦] | [↶] [↷] [💾] [▶]
                                      ↑
                                   Update!
                          (Only visible when
                           environment selected)
```

## What It Does

```
Current Workflow State
  ├─ Nodes
  ├─ Connections
  ├─ Triggers
  ├─ Settings
  └─ Variables (optional)
        │
        ↓
Update Environment
        │
        ↓
Environment Updated
  ├─ Version incremented (1.0.0 → 1.0.1)
  ├─ Snapshot saved
  ├─ Deployment record created
  └─ Ready for use! ✅
```

## Update vs Deploy

|          | **Update** 🔄        | **Deploy** 📦       |
| -------- | -------------------- | ------------------- |
| **From** | Current workflow     | Another environment |
| **To**   | Selected environment | Target environment  |
| **Use**  | Sync changes         | Promote version     |

## Typical Workflow

```
Day 1:
  Create Dev v1.0.0 → Make changes → Update to v1.0.1

Day 2:
  Make changes → Update to v1.0.2 → Update to v1.0.3

Day 3:
  Deploy Dev v1.0.3 → Staging v1.0.0 → Production v1.0.0
```

## Version Auto-Increment

```
Current: 1.0.0  → New: 1.0.1  (auto)
Current: 1.0.1  → New: 1.0.2  (auto)
Current: 1.2.5  → New: 1.2.6  (auto)
Current: 2.0.0  → New: 2.0.1  (auto)

Or enter manually: 1.5.0, 2.0.0, etc.
```

## Files

### Backend

- `backend/src/services/WorkflowEnvironmentService.ts` - `updateEnvironment()` method
- `backend/src/routes/environment.ts` - POST `.../update` endpoint
- `backend/src/types/environment.ts` - `UpdateEnvironmentInput` type

### Frontend

- `frontend/src/components/environment/UpdateEnvironmentDialog.tsx` - Update dialog
- `frontend/src/components/workflow/WorkflowToolbar.tsx` - Update button
- `frontend/src/services/environment.ts` - `updateEnvironment()` API call
- `frontend/src/types/environment.ts` - `UpdateEnvironmentInput` type

### Docs

- `ENVIRONMENT_UPDATE_GUIDE.md` - Full guide
- `ENVIRONMENT_UPDATE_SUMMARY.md` - Detailed summary
- `ENVIRONMENT_UPDATE_QUICK_REF.md` - This file

## API

```typescript
POST /api/workflows/:workflowId/environments/:environment/update

Body:
{
  version?: string          // e.g., "1.0.1" or empty for auto
  deploymentNote?: string   // e.g., "Fixed webhook bug"
  copyVariables?: boolean   // true to copy workflow vars
}

Response:
{
  success: true,
  data: WorkflowEnvironment  // Updated environment
}
```

## Component Props

```typescript
<UpdateEnvironmentDialog
  workflowId={string}
  environment={EnvironmentType}
  currentVersion={string}
  isOpen={boolean}
  onClose={() => void}
  onSuccess={() => void}
/>
```

## Common Tasks

### Update Development with current changes

```
1. Select Development
2. Click Update (🔄)
3. Leave version empty
4. Add note: "Added webhook handler"
5. Click Update
```

### Update with new variables

```
1. Select Development
2. Click Update (🔄)
3. Check "Copy Variables"
4. Add note: "Added API key variable"
5. Click Update
```

### Major version update

```
1. Select Development
2. Click Update (🔄)
3. Enter version: "2.0.0"
4. Add note: "Major refactor"
5. Click Update
```

## Troubleshooting

**Update button not visible?**
→ Make sure an environment is selected in dropdown

**Update fails?**
→ Check you have edit permissions on workflow

**Variables not copied?**
→ Make sure "Copy Variables" checkbox was checked

**Version error?**
→ Use format: "1.0.0" (MAJOR.MINOR.PATCH)

## Summary

**Before**: Could only create environment snapshot once, couldn't update.

**After**: Can update any environment with current workflow changes anytime!

Just click the Update button (🔄) → Done! ✅
