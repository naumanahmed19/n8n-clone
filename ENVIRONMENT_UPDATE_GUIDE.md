# Environment Update Guide

## Overview

After creating an environment (e.g., Development), you can update it with your current workflow changes without deploying from another environment.

## When to Update an Environment

Update an environment when you:

- Made changes to your workflow and want to sync them to Development
- Fixed bugs or added features in the main workflow
- Want to save a new snapshot of your workflow to an environment
- Need to update environment variables

## How to Update

### Method 1: Using the Update Button (Recommended)

1. **Select the Environment**

   - Click the Environment Selector dropdown in the workflow toolbar
   - Select the environment you want to update (e.g., Development)

2. **Click the Update Button**

   - Look for the **RefreshCw icon** (🔄) button next to the Deploy button
   - This button only appears when an environment is selected
   - Tooltip shows: "Update DEVELOPMENT with current workflow"

3. **Configure Update Settings**

   - **New Version** (optional): Enter a version number or leave empty to auto-increment
     - Auto-increment: If current is `1.0.0`, new will be `1.0.1`
   - **Copy Variables**: Check to copy workflow variables to environment
   - **Deployment Note** (optional): Add a note about what changed

4. **Click "Update Environment"**
   - Environment is updated with current workflow state
   - Version is incremented automatically
   - Deployment record is created for audit trail

### Method 2: Using the API Directly

```typescript
POST /api/workflows/:workflowId/environments/:environment/update
{
  "version": "1.0.1",          // optional
  "deploymentNote": "Fixed bug in webhook handler",
  "copyVariables": false        // optional, default false
}
```

## Update vs Deploy

| Feature         | Update Environment                   | Deploy Between Environments     |
| --------------- | ------------------------------------ | ------------------------------- |
| **Source**      | Current workflow                     | Another environment             |
| **Use Case**    | Sync workflow changes to environment | Copy one environment to another |
| **Button Icon** | 🔄 RefreshCw                         | 📦 Package                      |
| **Variables**   | Optional copy                        | Optional copy                   |
| **Version**     | Auto-increment or manual             | Auto-increment or manual        |

## Workflow

### Creating and Updating Development

```
1. Create Development Environment
   ├─ Workflow: Initial state
   ├─ Action: Click Environment Selector → Create Development
   └─ Result: Development v1.0.0 created

2. Make changes to workflow
   ├─ Add new webhook node
   ├─ Update HTTP request
   └─ Test locally

3. Update Development Environment
   ├─ Action: Click Update button (🔄)
   ├─ Version: Auto to 1.0.1
   ├─ Note: "Added webhook trigger"
   └─ Result: Development v1.0.1 updated

4. Continue working
   ├─ More changes...
   └─ Update again to v1.0.2
```

### Full Deployment Cycle

```
Main Workflow
    │
    ├─ Update → Development v1.0.0
    │           │
    │           ├─ Update → v1.0.1
    │           ├─ Update → v1.0.2
    │           │
    │           └─ Deploy → Staging v1.0.0
    │                      │
    │                      └─ Deploy → Production v1.0.0
    │
    ├─ Update → Development v1.1.0
    │           │
    │           └─ Deploy → Staging v1.1.0
    │
    └─ Continue...
```

## Best Practices

### 1. Frequent Development Updates

```
✅ Update Development frequently as you make changes
✅ Use descriptive deployment notes
✅ Test in Development before deploying to Staging
```

### 2. Version Management

```
✅ Let version auto-increment for minor updates
✅ Use manual version for major changes (e.g., 1.0.0 → 2.0.0)
✅ Follow semantic versioning: MAJOR.MINOR.PATCH
```

### 3. Deployment Notes

```
✅ "Added new webhook endpoint for order processing"
✅ "Fixed validation bug in customer form"
✅ "Updated HTTP timeout to 30 seconds"

❌ "Updates"
❌ "Changes"
❌ (empty note)
```

### 4. Variable Management

```
✅ Copy variables when you've added new ones to the workflow
✅ Keep environment variables separate if they're environment-specific
✅ Review variables before copying to avoid overwriting
```

## Technical Details

### Backend Implementation

**Service Method**: `WorkflowEnvironmentService.updateEnvironment()`

```typescript
async updateEnvironment(
  workflowId: string,
  userId: string,
  input: UpdateEnvironmentInput
): Promise<WorkflowEnvironment>
```

**What it does**:

1. Verifies workflow ownership
2. Gets current workflow state (nodes, connections, triggers, settings)
3. Gets existing environment
4. Updates environment with current workflow state
5. Increments version automatically or uses provided version
6. Copies variables if requested
7. Creates deployment record for audit trail

### Frontend Implementation

**Component**: `UpdateEnvironmentDialog.tsx`

**Features**:

- Current version display
- Version input with auto-increment suggestion
- Copy variables checkbox
- Deployment note textarea
- Loading states and error handling

**Integration**:

- Button in `WorkflowToolbar` next to Deploy button
- Only visible when an environment is selected
- Uses `environmentService.updateEnvironment()` API call

### API Endpoint

```typescript
POST /api/workflows/:workflowId/environments/:environment/update
```

**Request Body**:

```typescript
{
  version?: string          // Optional: manual version
  deploymentNote?: string   // Optional: deployment note
  copyVariables?: boolean   // Optional: copy workflow vars
}
```

**Response**:

```typescript
{
  success: true,
  data: WorkflowEnvironment  // Updated environment
}
```

## Common Scenarios

### Scenario 1: Daily Development Updates

```
Day 1:
  - Create Development v1.0.0
  - Make changes
  - Update to v1.0.1 "Added webhook"

Day 2:
  - Make more changes
  - Update to v1.0.2 "Fixed validation"
  - Update to v1.0.3 "Updated timeout"

Day 3:
  - Ready for testing
  - Deploy Development v1.0.3 → Staging v1.0.0
```

### Scenario 2: Feature Branch Workflow

```
1. Create Development from main workflow
2. Work on feature
3. Update Development multiple times
4. When ready:
   - Deploy Development → Staging
   - Test in Staging
   - Deploy Staging → Production
```

### Scenario 3: Hotfix in Production

```
1. Fix bug in main workflow
2. Update Development v1.0.4 "Hotfix: critical bug"
3. Deploy Development → Staging v1.0.1
4. Quick test
5. Deploy Staging → Production v1.0.1
```

## Troubleshooting

### Update Button Not Visible

**Issue**: Can't find the update button (🔄)

**Solutions**:

- Make sure an environment is selected in the Environment Selector
- Verify the environment exists (created previously)
- Check that you're in the workflow editor view

### Update Fails

**Issue**: Error when trying to update

**Solutions**:

- Verify you have permission to edit the workflow
- Check that the environment exists
- Ensure version format is correct (e.g., 1.0.0)
- Look at deployment note - it might have invalid characters

### Variables Not Copied

**Issue**: Variables not showing in environment after update

**Solutions**:

- Make sure "Copy Variables" checkbox was checked
- Verify variables exist in the main workflow
- Check if variables were accidentally set to empty in workflow

## Summary

- **Update**: Syncs current workflow changes to an environment
- **Button**: 🔄 RefreshCw icon next to Deploy button
- **When**: Use for frequent Development updates
- **Version**: Auto-increments or manual
- **Variables**: Optional copy
- **Record**: Creates deployment record for audit trail

The update feature makes it easy to keep your Development (or any) environment in sync with your current workflow changes, providing a smooth development workflow.
