# Environment View Feature

## Overview

The Environment View feature allows users to view and inspect the workflow content saved in different environments (Development, Staging, Production) without deploying or modifying them.

## User Interface

### 1. View Button in Environment Selector

- Each environment in the dropdown now has an **Eye icon** button
- Clicking the Eye icon opens the View Environment Dialog
- The button is positioned on the right side of each environment item

### 2. View Environment Dialog

The dialog displays:

- **Environment Info**: Name, version, status (Active/Inactive)
- **Deployment Date**: When the environment was last deployed
- **Workflow Stats**: Number of nodes and connections
- **Deployment Note**: Any notes added during deployment
- **Warning**: Reminds users that loading will replace current editor content

#### Actions in Dialog:

- **Load in Editor**: Loads the environment workflow into the editor
- **Cancel**: Closes the dialog without loading
- **Retry**: Re-attempts loading if an error occurred

### 3. Environment Viewing Indicator

When viewing an environment, the toolbar shows:

- **Blue Badge**: "Viewing: [Environment Name]" with an Eye icon
- **Exit View Button**: Returns to main workflow editing
- Located between the breadcrumb and environment selector

## User Flow

### Viewing an Environment

1. Open the **Environment Selector** dropdown (left side of toolbar)
2. Click the **Eye icon** next to any environment (Development, Staging, or Production)
3. Review the environment details in the dialog
4. Click **"Load in Editor"** to view the workflow
5. The editor now displays the environment's saved workflow
6. A blue badge appears: "Viewing: [Environment Name]"

### Returning to Main Workflow

1. Click the **"Exit View"** button next to the viewing badge
2. The viewing indicator disappears
3. You're back in main workflow editing mode
4. Note: You may need to reload the main workflow if you want to see your current changes

## Technical Implementation

### Frontend Components

#### ViewEnvironmentDialog.tsx

```typescript
// New component at: frontend/src/components/environment/ViewEnvironmentDialog.tsx
- Fetches environment data using loadEnvironmentWorkflow()
- Displays environment metadata and workflow statistics
- Loads environment workflow into editor on confirmation
- Sets viewingEnvironment state when loading
```

#### EnvironmentSelector.tsx

```typescript
// Updated component: frontend/src/components/environment/EnvironmentSelector.tsx
- Added Eye icon button to each environment item
- Added ViewEnvironmentDialog integration
- Prevents dropdown close when clicking View button
```

#### WorkflowToolbar.tsx

```typescript
// Updated component: frontend/src/components/workflow/WorkflowToolbar.tsx
- Added environment viewing indicator badge
- Added "Exit View" button
- Shows/hides based on viewingEnvironment state
```

### State Management

#### Environment Store

```typescript
// Updated store: frontend/src/stores/environment.ts
interface EnvironmentStore {
  viewingEnvironment: EnvironmentType | null; // NEW: Track viewing state
  setViewingEnvironment: (environment: EnvironmentType | null) => void; // NEW
  loadEnvironmentWorkflow: (
    workflowId,
    environment
  ) => Promise<WorkflowEnvironment | null>;
}
```

### API Endpoints

```typescript
// Existing endpoint used:
GET /api/workflows/:workflowId/environments/:environment
// Returns: Full environment data including nodes, connections, settings
```

## Use Cases

### 1. Inspect Development Environment

**Scenario**: Check what was saved to Development before deploying to Staging

**Steps**:

1. Click Eye icon next to "Development"
2. Review version number and deployment date
3. Click "Load in Editor" to see the nodes
4. Inspect node configurations and connections
5. Click "Exit View" when done

### 2. Compare Environments

**Scenario**: See differences between Staging and Production

**Steps**:

1. View Staging environment workflow
2. Note the node count and configuration
3. Click "Exit View"
4. View Production environment workflow
5. Compare the workflows manually

### 3. Verify Deployment

**Scenario**: Confirm that deployment to Production was successful

**Steps**:

1. After deploying to Production
2. Click Eye icon next to "Production"
3. Check version number matches expected version
4. Review deployment date and note
5. Load in editor to verify nodes are correct

## Features

### ✅ Implemented

- View button in environment dropdown
- Environment details dialog
- Load environment workflow into editor
- Viewing indicator badge in toolbar
- Exit view functionality
- Loading states and error handling
- Workflow statistics display
- Deployment notes display

### 🚧 Future Enhancements

- **Read-only Mode**: Lock editor when viewing environments
- **Compare View**: Side-by-side comparison of two environments
- **Diff Highlighting**: Visual indication of changes between environments
- **Quick Switch**: Dropdown to quickly switch between environment views
- **Environment History**: View previous versions of an environment
- **Export Environment**: Download environment as JSON file

## Important Notes

### Workflow State

- **Loading an environment replaces the current workflow in the editor**
- Users should save any unsaved changes before viewing an environment
- The main workflow is not automatically reloaded when exiting view mode
- Consider adding a warning dialog if there are unsaved changes

### Environment Selector State

- `selectedEnvironment`: Which environment is currently selected (for filtering, updates, etc.)
- `viewingEnvironment`: Which environment's workflow is loaded in the editor
- These are independent states - you can view Production while having Development selected

### Best Practices

1. **Always save before viewing**: Warn users about unsaved changes
2. **Clear indication**: The blue badge makes it obvious you're viewing an environment
3. **Easy exit**: The "Exit View" button is prominently displayed
4. **Metadata first**: Dialog shows key info before loading into editor

## Error Handling

### Common Errors

1. **Environment not found**: Show error if environment doesn't exist
2. **Network error**: Allow retry with "Retry" button
3. **Invalid data**: Handle corrupted environment data gracefully
4. **Permission error**: Display appropriate error message

### Error Recovery

- Retry button in dialog
- Clear error messages
- Graceful fallback to previous state

## Testing Scenarios

### Manual Testing

1. ✅ View an existing environment
2. ✅ View multiple environments sequentially
3. ✅ Exit view mode
4. ✅ View environment with many nodes
5. ✅ View environment with no nodes
6. ✅ Handle network errors during loading
7. ⚠️ Verify unsaved changes warning
8. ⚠️ Test with missing environment data

### Integration Testing

- Verify API endpoint returns correct data
- Test environment store state updates
- Confirm workflow store receives environment data
- Validate viewing indicator shows/hides correctly

## Related Documentation

- [ENVIRONMENT_UI_IMPROVEMENTS.md](./ENVIRONMENT_UI_IMPROVEMENTS.md) - Environment UI enhancements
- [EXECUTION_SNAPSHOT_IMPLEMENTATION.md](./EXECUTION_SNAPSHOT_IMPLEMENTATION.md) - How environments store snapshots
- [WORKFLOW_ENVIRONMENTS.md](./WORKFLOW_ENVIRONMENTS.md) - Core environment system
- [MANUAL_DEPLOYMENT_IMPLEMENTATION.md](./MANUAL_DEPLOYMENT_IMPLEMENTATION.md) - Manual deployment feature

## Summary

The Environment View feature provides a simple, intuitive way for users to inspect the workflow content saved in different environments. By adding a View button to each environment and showing a clear indicator when viewing, users can easily navigate between their main workflow and environment snapshots without confusion.

**Key Benefits**:

- ✅ Non-destructive viewing (doesn't modify environments)
- ✅ Clear visual indication when viewing
- ✅ Easy navigation between main workflow and environments
- ✅ Comprehensive environment metadata display
- ✅ Seamless integration with existing UI
