# Environment Workflow Merge Fix

## Problem

When selecting an environment (e.g., Development), the workflow title and category were not loading correctly. The UI would show:

- ❌ Workflow ID instead of workflow name
- ❌ Empty/missing category
- ❌ Missing description and tags

### Root Cause

The `EnvironmentSelector` was replacing the **entire workflow object** with environment data:

```typescript
// ❌ OLD CODE - Wrong approach
setWorkflow({
  id: workflowId,
  name: envData.workflowId || "Workflow", // Wrong! Shows ID, not name
  userId: "", // Empty
  nodes: envData.nodes,
  connections: envData.connections,
  settings: envData.settings,
  // Missing: description, category, tags, etc.
});
```

### Why It Happened

**Data Structure Mismatch:**

**WorkflowEnvironment** (backend response):

```typescript
{
  id: string,
  workflowId: string,  // Just the ID, not the name
  environment: "DEVELOPMENT",
  nodes: [],
  connections: [],
  settings: {},
  active: boolean,
  // No name, category, description, tags
}
```

**Workflow** (what editor needs):

```typescript
{
  id: string,
  name: string,  // Actual workflow name
  description: string,
  category: string,
  tags: string[],
  nodes: [],
  connections: [],
  settings: {},
  // ... full metadata
}
```

The environment data only contains **execution data** (nodes, connections, settings), not **workflow metadata** (name, category, description).

## Solution

**Option 1: Merge Strategy (Implemented) ✅**

Keep the original workflow metadata and only override environment-specific execution data:

```typescript
// ✅ NEW CODE - Correct approach
const currentWorkflow = useWorkflowStore.getState().workflow;
const envData = await loadEnvironmentWorkflow(workflowId, environment);

setWorkflow({
  ...currentWorkflow, // Keep: name, description, category, tags, userId, dates
  nodes: envData.nodes, // Override: environment-specific nodes
  connections: envData.connections, // Override: environment-specific connections
  settings: envData.settings, // Override: environment-specific settings
  active: envData.active, // Override: environment-specific active state
});
```

### Why This Works

**Workflow Metadata Should Be Consistent:**

- Workflow name, description, category, tags are **same across all environments**
- Only the **execution data** (nodes, connections, settings) differs between environments
- User expects to see the same workflow name/category regardless of which environment they're viewing

**Benefits:**

- ✅ Preserves workflow name, category, description, tags
- ✅ Only updates environment-specific data
- ✅ No extra API calls
- ✅ No backend changes needed
- ✅ Matches user expectations

## Implementation Details

### Files Modified

**1. EnvironmentSelector.tsx - handleEnvironmentSelect()**

```typescript
const handleEnvironmentSelect = async (environment: EnvironmentType) => {
  selectEnvironment(environment);
  onEnvironmentChange?.(environment);

  if (workflowId) {
    try {
      const { loadEnvironmentWorkflow } = useEnvironmentStore.getState();
      const { workflow: currentWorkflow, setWorkflow } = await import(
        "@/stores/workflow"
      ).then((m) => ({
        workflow: m.useWorkflowStore.getState().workflow,
        setWorkflow: m.useWorkflowStore.getState().setWorkflow,
      }));

      const envData = await loadEnvironmentWorkflow(workflowId, environment);
      if (envData && currentWorkflow) {
        // Merge: Keep metadata, override execution data
        setWorkflow({
          ...currentWorkflow, // Original workflow metadata
          nodes: envData.nodes || [],
          connections: envData.connections || [],
          settings: envData.settings || {},
          active: envData.active,
        });
      }
    } catch (error) {
      console.error("Failed to load environment workflow:", error);
    }
  }
};
```

**2. EnvironmentSelector.tsx - handleExitEnvironmentView()**

Also improved exit behavior to reload main workflow from API instead of full page reload:

```typescript
const handleExitEnvironmentView = async () => {
  selectEnvironment(null as any);

  if (workflowId) {
    try {
      const { setWorkflow } = await import("@/stores/workflow").then((m) => ({
        setWorkflow: m.useWorkflowStore.getState().setWorkflow,
      }));
      const { workflowService } = await import("@/services");

      // Reload main workflow from server
      const mainWorkflow = await workflowService.getWorkflow(workflowId);
      setWorkflow(mainWorkflow);
    } catch (error) {
      console.error("Failed to reload main workflow:", error);
      window.location.reload(); // Fallback
    }
  }
};
```

## User Flow Examples

### Scenario 1: Viewing Development Environment

```
1. User opens "My API Workflow" (category: "Integration")
2. Title shows: "My API Workflow" ✅
3. Category shows: "Integration" ✅
4. User selects "Development" environment
5. Title STILL shows: "My API Workflow" ✅
6. Category STILL shows: "Integration" ✅
7. Canvas loads Development nodes/connections ✅
```

### Scenario 2: Switching Between Environments

```
1. User viewing "My API Workflow" in main
2. Title: "My API Workflow" ✅
3. Selects "Development"
4. Title: "My API Workflow" ✅ (preserved)
5. Canvas shows Development nodes
6. Selects "Staging"
7. Title: "My API Workflow" ✅ (still preserved)
8. Canvas shows Staging nodes
```

### Scenario 3: Exiting Environment View

```
1. User viewing "Development" environment
2. Title: "My API Workflow" ✅
3. User clicks "Exit Development"
4. Main workflow reloads from API
5. Title: "My API Workflow" ✅
6. Canvas shows main workflow nodes
7. No page refresh needed ✅
```

## What Gets Preserved vs. Overridden

### Preserved (From Original Workflow):

- ✅ `id` - Workflow ID
- ✅ `name` - Workflow name
- ✅ `description` - Workflow description
- ✅ `category` - Workflow category
- ✅ `tags` - Workflow tags
- ✅ `userId` - Owner
- ✅ `createdAt` - Creation date
- ✅ `updatedAt` - Last update date
- ✅ Any other metadata fields

### Overridden (From Environment Data):

- 🔄 `nodes` - Environment-specific nodes
- 🔄 `connections` - Environment-specific connections
- 🔄 `settings` - Environment-specific settings
- 🔄 `active` - Environment-specific active state

## Edge Cases Handled

### 1. First Time Loading Workflow

```
- Main workflow loads first
- Has full metadata
- Environment selector can merge correctly ✅
```

### 2. Direct URL to Environment

```
- Need to ensure main workflow loads first
- Then environment data overlays
- May need route guard to load main workflow ⚠️
```

### 3. Environment Doesn't Exist

```
- loadEnvironmentWorkflow returns null
- Current workflow stays unchanged ✅
- User sees error message
```

### 4. Network Error on Exit

```
- API call to reload main workflow fails
- Falls back to window.location.reload() ✅
- User gets fresh data either way
```

## Alternative Solutions Considered

### Option 2: Fetch Main Workflow Every Time (Not Chosen)

```typescript
// Always fetch main workflow + environment data
const mainWorkflow = await workflowService.getWorkflow(workflowId);
const envData = await loadEnvironmentWorkflow(workflowId, environment);

setWorkflow({
  ...mainWorkflow,
  nodes: envData.nodes,
  connections: envData.connections,
});
```

**Pros:**

- Always fresh metadata
- Guaranteed correct

**Cons:**

- ❌ Extra API call (slower)
- ❌ More complex
- ❌ Unnecessary if metadata doesn't change

### Option 3: Backend Returns Full Data (Not Chosen)

```typescript
// Backend includes workflow metadata in environment response
{
  ...envData,
  workflowName: workflow.name,
  workflowDescription: workflow.description,
  workflowCategory: workflow.category,
}
```

**Pros:**

- Single API call
- Complete data

**Cons:**

- ❌ Requires backend changes
- ❌ Data duplication
- ❌ More to maintain

## Testing Checklist

- [ ] Load workflow → Select Development → Title shows correctly
- [ ] Load workflow → Select Development → Category shows correctly
- [ ] Load workflow → Select Development → Nodes load correctly
- [ ] Switch from Development → Staging → Title preserved
- [ ] Switch from Development → Staging → Nodes update
- [ ] Exit Development → Main workflow loads correctly
- [ ] Exit without network → Fallback to page reload works
- [ ] Workflow with no category → No errors
- [ ] Workflow with no description → No errors
- [ ] New workflow (id="new") → No environment selector shown

## Related Files

- `EnvironmentSelector.tsx` - Environment selection and workflow loading
- `environment.ts` (store) - Environment state management
- `workflow.ts` (store) - Workflow state management
- `environment.ts` (types) - WorkflowEnvironment interface
- `workflow.ts` (types) - Workflow interface

## Related Documentation

- [ENVIRONMENT_UI_IMPROVEMENTS.md](./ENVIRONMENT_UI_IMPROVEMENTS.md)
- [ENVIRONMENT_SAVE_BEHAVIOR.md](./ENVIRONMENT_SAVE_BEHAVIOR.md)
- [ENVIRONMENTS_USER_GUIDE.md](./ENVIRONMENTS_USER_GUIDE.md)
