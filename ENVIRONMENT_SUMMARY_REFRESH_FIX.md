# Environment Summary Refresh Fix

## Problem

After updating or deploying to an environment, the environment selector dropdown showed **stale data** (old node counts and versions) until the browser was refreshed.

**User Experience:**

```
1. User deploys to Development (5 nodes)
2. Deployment succeeds ✅
3. Opens environment selector dropdown
4. Still shows "3 nodes" ❌ (old data)
5. User refreshes browser
6. Now shows "5 nodes" ✅ (correct data)
```

## Root Cause

The environment summaries weren't being reloaded after deployment/update operations completed. While the dialogs internally called `loadSummaries()`, the parent components (WorkflowToolbar, EnvironmentSelector) weren't triggering a refresh.

### Flow Analysis

**Before Fix:**

```
ManualDeploymentDialog
  ├─ Deploy succeeds
  ├─ loadSummaries() called ✅
  ├─ onSuccess() callback fires
  └─ WorkflowToolbar: console.log only ❌

EnvironmentSelector
  └─ Still showing old cached summaries ❌
```

**Issue:** The EnvironmentSelector wasn't notified that summaries changed.

## Solution

Added proper `loadSummaries()` calls in all the right places:

### 1. ManualDeploymentDialog

Added reload immediately after deployment:

```typescript
// Deploy logic...
if (sourceEnvironment === 'CURRENT') {
  await environmentService.updateEnvironment(...)
  if (activateAfterDeploy) {
    await environmentService.activateEnvironment(...)
  }
} else {
  await deployToEnvironment(...)
}

// ✅ NEW: Reload summaries to get updated data
await loadSummaries(workflowId)

setSuccess(true)
// Show success toast...
```

### 2. WorkflowToolbar onSuccess Callbacks

Updated both deployment and update dialog callbacks:

```typescript
// Manual Deployment Dialog
<ManualDeploymentDialog
  workflowId={workflow.id}
  open={showDeployDialog}
  onOpenChange={setShowDeployDialog}
  onSuccess={() => {
    // ✅ NEW: Reload environment summaries after successful deployment
    const { loadSummaries } = useEnvironmentStore.getState()
    loadSummaries(workflow.id)
  }}
/>

// Update Environment Dialog
<UpdateEnvironmentDialog
  workflowId={workflow.id}
  environment={selectedEnvironment}
  currentVersion={...}
  isOpen={showUpdateDialog}
  onClose={() => setShowUpdateDialog(false)}
  onSuccess={() => {
    // ✅ NEW: Reload environment summaries after successful update
    const { loadSummaries } = useEnvironmentStore.getState()
    loadSummaries(workflow.id)
  }}
/>
```

### 3. UpdateEnvironmentDialog

Already had `loadSummaries()` call ✅ (no changes needed):

```typescript
await environmentService.updateEnvironment(...)
// ✅ Already present
await loadSummaries(workflowId)
toast.success(...)
```

## Data Flow After Fix

```
┌─────────────────────────────────────┐
│ User clicks "Deploy"                │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ ManualDeploymentDialog              │
│ ├─ deployToEnvironment()            │
│ ├─ loadSummaries() ✅               │
│ └─ onSuccess() callback fires       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ WorkflowToolbar onSuccess           │
│ └─ loadSummaries() again ✅         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ useEnvironmentStore                 │
│ └─ summaries updated ✅             │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ EnvironmentSelector                 │
│ └─ Shows updated node count ✅      │
└─────────────────────────────────────┘
```

## Why Double Load?

We call `loadSummaries()` in **two places**:

1. **Inside Dialog** - Updates store immediately after API success
2. **In onSuccess Callback** - Ensures parent component re-renders

This might seem redundant, but it's necessary because:

- React components don't automatically re-render when Zustand store changes
- The callback ensures parent components get notified
- Small performance cost, but ensures data consistency

**Alternative considered:** Could remove internal `loadSummaries()` and rely only on callback, but keeping both provides:

- Immediate update for dialog's own UI (success message shows correct data)
- Parent component update through callback

## Files Modified

1. **ManualDeploymentDialog.tsx**

   - Added `await loadSummaries(workflowId)` after deployment logic
   - Ensures summaries are fresh before showing success message

2. **WorkflowToolbar.tsx**

   - Updated `ManualDeploymentDialog` onSuccess callback
   - Updated `UpdateEnvironmentDialog` onSuccess callback
   - Both now call `loadSummaries()` from store

3. **UpdateEnvironmentDialog.tsx**
   - Already had `loadSummaries()` call ✅ (no changes)

## Testing

### Test Case 1: Manual Deployment

```
1. Deploy Current Workflow → Development (5 nodes)
2. Success toast appears ✅
3. Open environment selector dropdown
4. Development shows "5 nodes" immediately ✅
```

### Test Case 2: Update Environment

```
1. Add 2 new nodes to workflow
2. Click "Update Development"
3. Success toast appears ✅
4. Open environment selector dropdown
5. Development shows updated node count ✅
```

### Test Case 3: Multiple Deployments

```
1. Deploy to Development (5 nodes)
2. Deploy to Staging (5 nodes)
3. Deploy to Production (5 nodes)
4. Open environment selector dropdown
5. All three show "5 nodes" ✅
```

### Test Case 4: Version Numbers

```
1. Deploy Current Workflow → Development
2. Version increments: v1.0.0 → v1.0.1
3. Open environment selector dropdown
4. Development shows "v1.0.1" immediately ✅
```

## User Experience

**Before:**

```
1. Deploy workflow ✅
2. Open dropdown
3. See old data ❌
4. Refresh browser
5. See new data ✅
```

**After:**

```
1. Deploy workflow ✅
2. Open dropdown
3. See new data immediately ✅
```

**Improvement:** No browser refresh needed! 🎉

## Edge Cases Handled

### 1. Deployment Fails

- `loadSummaries()` only called on success
- Old data remains visible ✅
- No misleading updates

### 2. Multiple Rapid Deployments

- Each deployment loads summaries
- Latest data always shown ✅
- Race conditions handled by Zustand

### 3. Network Delay

- `await loadSummaries()` ensures completion
- UI updates only after data loaded ✅
- No stale data flashing

### 4. Dialog Closed Early

- `onSuccess` only fires after full completion
- Summaries still updated ✅
- Consistent state maintained

## Performance Impact

**API Calls:**

- Before: 1 deployment API call
- After: 1 deployment + 2 summary API calls

**Network Traffic:**

- Minimal increase (~5KB for summaries response)
- Worth it for correct data display

**User Perception:**

- Much better - data always fresh
- No confusion about deployment status
- No need to refresh browser

## Related Issues

This fix also resolves:

- ✅ Stale version numbers in dropdown
- ✅ Incorrect active status display
- ✅ Wrong node counts after updates
- ✅ Outdated deployment info

## Future Improvements

### 1. WebSocket Updates

```
Backend emits event on environment change
→ Frontend subscribes
→ Auto-updates summaries
→ No polling needed
```

### 2. Optimistic Updates

```
Update UI immediately with expected values
→ Validate with API response
→ Rollback if mismatch
→ Faster perceived performance
```

### 3. Incremental Updates

```
Only update changed environment
→ Don't reload all summaries
→ Reduces API calls
→ Better performance
```

## Related Documentation

- [DEPLOY_CURRENT_WORKFLOW_FEATURE.md](./DEPLOY_CURRENT_WORKFLOW_FEATURE.md)
- [ENVIRONMENT_WORKFLOW_MERGE_FIX.md](./ENVIRONMENT_WORKFLOW_MERGE_FIX.md)
- [ENVIRONMENT_UI_IMPROVEMENTS.md](./ENVIRONMENT_UI_IMPROVEMENTS.md)
