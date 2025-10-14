# Deploy Current Workflow to Environment

## Feature Overview

Added the ability to deploy the **current working workflow** (with unsaved or saved changes) directly to any environment from the Manual Deployment dialog.

## Problem Solved

Previously, users could only deploy between existing environments (Development → Staging → Production). There was no way to deploy the current workflow they were actively working on to an environment without first:

1. Saving the main workflow
2. Creating/updating an environment
3. Then deploying to another environment

This workflow was cumbersome when users wanted to quickly test their current changes in an environment.

## Solution

Added a **"Current Workflow"** option to the Source Environment dropdown in the Manual Deployment dialog.

### User Flow

```
1. User is editing workflow in main editor
2. Makes changes (nodes, connections, settings)
3. Opens Manual Deployment dialog (Save → Deploy)
4. Selects "Current Workflow" as source
5. Selects target environment (Development/Staging/Production)
6. Clicks Deploy
7. Current workflow state deploys to target environment ✅
```

## Implementation Details

### UI Changes

**1. Source Environment Dropdown**

Added "Current Workflow" as the first option:

```typescript
<SelectContent>
  {/* New: Current Workflow Option */}
  <SelectItem value="CURRENT">
    <div className="flex items-center gap-2">
      <FileEdit className="w-4 h-4" />
      <span className="font-medium">Current Workflow</span>
      <span className="text-xs text-muted-foreground">(Working changes)</span>
    </div>
  </SelectItem>

  {/* Existing: Environment options */}
  {availableEnvironments.map((env) => (
    <SelectItem key={env.environment} value={env.environment}>
      ...
    </SelectItem>
  ))}
</SelectContent>
```

**2. Visual Flow Indicator**

Shows "Current Workflow" with purple styling:

```
┌─────────────────────┐       ┌─────────────────┐
│ Current Workflow    │  ───→ │  Development    │
│ (Working changes)   │       │  v1.2.0         │
└─────────────────────┘       └─────────────────┘
```

**3. Source Info Display**

When "Current Workflow" is selected, shows:

- File edit icon
- "Current working version" label
- Node count from current workflow
- Active status

**4. Color Coding**

- **Purple** - Current Workflow (working changes)
- **Blue** - Development environment
- **Yellow** - Staging environment
- **Green** - Production environment

### Backend Integration

**Deploy Logic:**

```typescript
if (sourceEnvironment === 'CURRENT') {
  // Deploy current workflow to target environment
  await environmentService.updateEnvironment(workflowId, targetEnvironment, {
    version: version || undefined,
    deploymentNote: deploymentNote || undefined,
    copyVariables,
  })

  // Optionally activate after deploy
  if (activateAfterDeploy) {
    await environmentService.activateEnvironment(workflowId, targetEnvironment)
  }
} else {
  // Normal deployment between two environments
  await deployToEnvironment(workflowId, {
    sourceEnvironment,
    targetEnvironment,
    ...
  })
}
```

**Why updateEnvironment?**

The `deployToEnvironment` API expects both source and target to be existing environments. When deploying from "Current Workflow", we use `updateEnvironment` which:

- Takes the current workflow state from the main workflow
- Updates the target environment with that state
- Increments version appropriately
- Records deployment history

### Files Modified

1. **ManualDeploymentDialog.tsx**
   - Added "Current Workflow" option to source dropdown
   - Updated state type: `EnvironmentType | 'CURRENT' | ''`
   - Added purple color styling for "CURRENT"
   - Updated visual flow to show "Current Workflow"
   - Split deployment logic based on source type
   - Added FileEdit icon import

### Code Changes

```typescript
// State type updated
const [sourceEnvironment, setSourceEnvironment] = useState<
  EnvironmentType | "CURRENT" | ""
>(defaultSource || "");

// Access current workflow
const { workflow } = useWorkflowStore();

// Conditional deployment
if (sourceEnvironment === "CURRENT") {
  // Use updateEnvironment for current workflow
} else {
  // Use deployToEnvironment for env-to-env
}
```

## Use Cases

### Use Case 1: Quick Testing

```
Developer makes changes to workflow
→ Wants to test in Development immediately
→ Selects "Current Workflow" → Development
→ Deploys without saving to main
→ Tests in Development environment ✅
```

### Use Case 2: Hotfix

```
Production bug found
→ Developer fixes in main workflow
→ Selects "Current Workflow" → Production
→ Deploys hotfix directly
→ Production updated immediately ✅
```

### Use Case 3: Experimentation

```
Developer experimenting with new nodes
→ Not ready to commit to main workflow
→ Selects "Current Workflow" → Development
→ Tests experimental changes
→ Can discard or save later ✅
```

### Use Case 4: Unsaved Changes

```
Developer has unsaved changes
→ Wants to deploy to Staging for review
→ Selects "Current Workflow" → Staging
→ Deploys without saving main workflow
→ Can continue editing ✅
```

## Benefits

### ✅ Advantages

1. **Faster Iteration** - No need to save first
2. **Flexible Testing** - Deploy working changes instantly
3. **Reduced Steps** - Skip intermediate save/update steps
4. **Experiment Friendly** - Test without committing
5. **Clear Intent** - Purple color shows it's current working state

### 🎯 User Experience

**Before:**

```
1. Make changes
2. Save workflow
3. Open Update Environment dialog
4. Update Development
5. (Now can test)
```

**After:**

```
1. Make changes
2. Deploy → Current Workflow → Development
3. (Now can test)
```

**Saved:** 3 steps, much faster! ⚡

## Visual Design

### Source Dropdown Options

```
┌─────────────────────────────────────┐
│ Current Workflow (Working changes)  │ ← Purple, FileEdit icon
├─────────────────────────────────────┤
│ Development          v1.0.0         │ ← Blue, Wrench icon
│ Staging              v1.0.0         │ ← Yellow, Flask icon
│ Production           v1.0.0         │ ← Green, Rocket icon
└─────────────────────────────────────┘
```

### Selected State

```
┌─────────────────────────────────┐
│ 📝 Current Workflow              │
│                                 │
│ 📝 Current working version      │
│ Nodes: 5                        │
│ ● Active                        │
└─────────────────────────────────┘
```

## Edge Cases Handled

### 1. No Workflow Loaded

- "Current Workflow" option still shows
- Shows "0 nodes" if no workflow
- Deploy will fail gracefully

### 2. New Workflow (id="new")

- "Current Workflow" can deploy to environment
- Creates environment snapshot before workflow is saved
- Useful for testing before committing

### 3. Source = CURRENT, Target = same env user is viewing

- Validation: Cannot deploy to same environment
- Shows error: "Source and target must be different"

### 4. Unsaved Title/Category Changes

- Only deploys node/connection/settings data
- Title/category changes not included (matches updateEnvironment behavior)
- User should save first if title/category matter

## Testing Checklist

- [ ] "Current Workflow" appears first in source dropdown
- [ ] Shows purple styling when selected
- [ ] Displays FileEdit icon
- [ ] Shows current node count
- [ ] Visual flow shows "Current Workflow"
- [ ] Deploy from Current → Development works
- [ ] Deploy from Current → Staging works
- [ ] Deploy from Current → Production works
- [ ] Activates after deploy if checkbox checked
- [ ] Success toast shows "from Current Workflow"
- [ ] Version auto-increments correctly
- [ ] Deployment note saves correctly
- [ ] Copy variables option works
- [ ] Works with unsaved changes
- [ ] Works with saved changes
- [ ] Error handling for deployment failures

## Future Enhancements

### 1. Save & Deploy Button

```
Add quick action:
"Save & Deploy to Development"
Saves main workflow + deploys in one click
```

### 2. Diff Preview

```
Show what changed since last deployment:
- 2 nodes added
- 1 connection modified
- 3 settings changed
```

### 3. Validation Before Deploy

```
Check workflow validity before deploying:
✅ All nodes configured
✅ No disconnected nodes
⚠️ Missing required fields
```

### 4. Deployment Templates

```
Save common deployment patterns:
- "Quick Dev Deploy" (Current → Dev)
- "Staging Release" (Dev → Staging)
- "Production Push" (Staging → Prod)
```

## Related Features

- **Update Environment** - Updates single environment from main workflow
- **Environment Selector** - Switch between viewing different environments
- **Manual Deployment** - Deploy between existing environments
- **Workflow Save** - Save main workflow changes

## Related Documentation

- [ENVIRONMENT_SAVE_BEHAVIOR.md](./ENVIRONMENT_SAVE_BEHAVIOR.md)
- [ENVIRONMENT_UI_IMPROVEMENTS.md](./ENVIRONMENT_UI_IMPROVEMENTS.md)
- [ENVIRONMENTS_USER_GUIDE.md](./ENVIRONMENTS_USER_GUIDE.md)
- [WORKFLOW_ENVIRONMENTS.md](./WORKFLOW_ENVIRONMENTS.md)
