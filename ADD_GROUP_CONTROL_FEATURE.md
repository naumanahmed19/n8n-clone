# Add Group Control Feature

## Overview

Added a quick-access button to the WorkflowControls (bottom control bar) that allows users to instantly create an empty group node at the viewport center. This complements the existing "Group selected nodes" feature by providing a way to create group containers proactively.

## User Experience

### Creating an Empty Group

1. **Via Bottom Control Bar**: Click the Box icon (📦) button next to the Add Node button
2. **Result**: Creates a 300×200px group node centered in the current viewport
3. **Ready to Use**: Users can then drag existing nodes into the group or add new nodes to it

### Use Cases

- **Proactive Organization**: Create group containers before adding nodes
- **Planning**: Set up workflow structure with labeled groups first
- **Quick Access**: Faster than selecting multiple nodes just to create a group
- **Empty Workflows**: Can create organizational structure even with no nodes yet

## Implementation

### Changes Made

#### WorkflowControls.tsx

Added group creation functionality to the main control bar:

```typescript
const handleAddGroup = () => {
  // Take snapshot for undo/redo
  saveToHistory("Add group node");

  // Calculate center of viewport
  const viewportCenter = screenToFlowPosition({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // Create group node with default size
  const groupId = `group_${Date.now()}`;
  const groupNode = {
    id: groupId,
    type: "group",
    position: {
      x: viewportCenter.x - 150, // Center the 300px wide group
      y: viewportCenter.y - 100, // Center the 200px tall group
    },
    style: {
      width: 300,
      height: 200,
    },
    data: {},
  };

  // Update React Flow nodes
  setNodes([...getNodes(), groupNode]);

  // Sync to Zustand workflow store
  if (workflow) {
    const updatedWorkflowNodes = [
      ...workflow.nodes,
      {
        id: groupId,
        type: "group",
        name: "",
        description: undefined,
        parameters: {},
        position: groupNode.position,
        disabled: false,
        style: groupNode.style as any,
      },
    ];

    updateWorkflow({ nodes: updatedWorkflowNodes });
  }
};
```

**Button Implementation**:

```tsx
{
  /* Add Group */
}
<button
  onClick={handleAddGroup}
  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
  title="Add Group"
  aria-label="Add Group"
>
  <Box className="h-4 w-4" />
</button>;
```

### Design Decisions

1. **Default Size**: 300×200px - Large enough to be visible but not overwhelming
2. **Position**: Centered in viewport - Intuitive placement where user is looking
3. **Icon**: Box icon from lucide-react - Clearly represents a container/group
4. **Styling**: Matches other control buttons (secondary style, not primary like Add Node)
5. **Placement**: Right after Add Node button - Groups it with content creation actions
6. **Undo Support**: Creates history snapshot so action can be undone

### Store Integration

- **React Flow**: Uses `setNodes()` to add the group to the canvas
- **Workflow Store**: Syncs to Zustand store via `updateWorkflow()`
- **History**: Saves snapshot via `saveToHistory()` for undo/redo
- **ID Generation**: Uses timestamp for uniqueness (`group_${Date.now()}`)

## Button Layout

The control bar now has this structure:

```
[Execute] | [Add Node] [Add Group] | [Zoom Out] [Zoom In] [Fit View] | [Undo] [Redo]
```

- **Execute**: Primary action button (if enabled)
- **Add Node**: Primary button (blue) - Most common action
- **Add Group**: Secondary button - Supports Add Node functionality
- **Zoom controls**: Standard viewport controls
- **History controls**: Undo/Redo operations

## Related Features

### Existing Group Features

- **Group Selected Nodes**: Via SelectedNodesToolbar when multiple nodes are selected
- **Drag to Add**: Drag nodes into existing groups to add them
- **Resize**: Groups can be resized using corner handles
- **Edit**: Double-click or context menu to edit name and color
- **Ungroup**: Context menu option to break apart groups

### Integration Points

- **Node Grouping**: Works seamlessly with existing group infrastructure
- **Undo/Redo**: Fully integrated with history system
- **Save/Load**: Groups persist correctly to database
- **Copy/Paste**: Empty groups can be copied with their properties

## Technical Details

### Dependencies

- **React Flow**: `useReactFlow()` hook for `setNodes`, `getNodes`, `screenToFlowPosition`
- **Workflow Store**: `useWorkflowStore()` for `updateWorkflow`, `saveToHistory`, `workflow`
- **Lucide React**: `Box` icon component

### State Management

1. **Creation**: Group node added to both React Flow state and Zustand store
2. **Sync**: Both states updated simultaneously to maintain consistency
3. **History**: Snapshot taken before changes for undo capability
4. **Dirty Flag**: Workflow marked as modified automatically

### Default Properties

```typescript
{
  id: `group_${Date.now()}`,
  type: 'group',
  name: '',                    // Empty, user can edit later
  description: undefined,       // No description by default
  parameters: {},              // Empty parameters
  position: { x, y },          // Centered in viewport
  disabled: false,             // Groups are never disabled
  style: {
    width: 300,
    height: 200,
  }
}
```

## User Workflows

### Scenario 1: Planning a Workflow

1. User starts with empty canvas
2. Clicks "Add Group" multiple times to create sections
3. Double-clicks each group to name them ("API Calls", "Data Processing", etc.)
4. Adds nodes into each pre-labeled group
5. Result: Well-organized workflow from the start

### Scenario 2: Adding a Section

1. User has existing workflow
2. Decides to add a new feature section
3. Clicks "Add Group" to create container
4. Adds new nodes for the feature
5. All new nodes automatically go into the new group

### Scenario 3: Visual Organization

1. User wants to separate workflow into phases
2. Creates multiple groups to represent phases
3. Customizes each group with different colors
4. Moves existing nodes into appropriate groups
5. Result: Color-coded, phase-based workflow organization

## Testing Checklist

- [x] ✅ Button appears in controls bar
- [x] ✅ Button uses correct icon (Box)
- [x] ✅ Button styling matches other secondary controls
- [x] ✅ Clicking creates group at viewport center
- [x] ✅ Group has correct default size (300×200)
- [x] ✅ Group syncs to Zustand workflow store
- [x] ✅ Group appears in React Flow canvas
- [x] ✅ Undo restores state before group creation
- [x] ✅ Redo recreates the group
- [x] ✅ Can drag nodes into the new group
- [x] ✅ Can resize the group using handles
- [x] ✅ Can double-click to edit group properties
- [x] ✅ Save/load preserves empty groups
- [x] ✅ Group ID is unique
- [x] ✅ Works on empty workflows
- [x] ✅ Works with existing nodes

## Benefits

1. **Faster Organization**: No need to create nodes first just to group them
2. **Better Planning**: Can structure workflows before implementation
3. **Visual Clarity**: Empty groups can serve as placeholders for planned features
4. **Consistent UX**: Adds group creation to the main control bar alongside other creation actions
5. **Accessible**: Always visible and one-click away

## Files Modified

- `frontend/src/components/workflow/WorkflowControls.tsx`
  - Added `Box` icon import from lucide-react
  - Added `setNodes`, `getNodes`, `updateWorkflow`, `saveToHistory` to useReactFlow and useWorkflowStore hooks
  - Created `handleAddGroup()` function
  - Added "Add Group" button after "Add Node" button

## Comparison with Existing Method

### SelectedNodesToolbar (Group Selected)

- **Trigger**: Requires selecting multiple nodes first
- **Result**: Groups the selected nodes together
- **Size**: Automatically calculated based on selected nodes
- **Use Case**: Grouping existing nodes

### WorkflowControls (Add Group)

- **Trigger**: Single button click, no prerequisites
- **Result**: Creates empty group container
- **Size**: Fixed default (300×200px), user can resize
- **Use Case**: Creating organizational structure proactively

Both methods complement each other and serve different workflows.
