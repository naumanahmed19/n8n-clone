# Node Grouping Feature

## Overview

The node grouping feature allows users to group multiple workflow nodes together for better organization and visual clarity. This implementation is based on React Flow's grouping capabilities with custom styling that matches your n8n-clone design system.

## Features

### 1. **Group Creation**
- Select multiple nodes by holding `Shift` and clicking nodes or dragging a selection box
- When 2 or more nodes are selected, a "Group selected nodes" button appears
- Clicking this button creates a group node that contains the selected nodes
- Grouped nodes maintain their relative positions and connections

### 2. **Group Node Styling**
- **Light Mode**: Purple background with semi-transparent fill `rgba(207, 182, 255, 0.4)`
- **Dark Mode**: Darker purple background with semi-transparent fill `rgba(120, 85, 200, 0.2)`
- Rounded corners (8px border-radius)
- Subtle shadow effects
- Border color: `#9e86ed` (purple)
- Hover and selection states with visual feedback

### 3. **Ungrouping**
- When a group node contains child nodes, an "Ungroup" button appears in the node toolbar
- Clicking "Ungroup" removes the group and restores nodes to their absolute positions
- Connections are preserved during ungrouping

### 4. **Group Resizing**
- Group nodes can be resized using the resize handles at corners and edges
- Child nodes maintain their relative positions within the group
- Resize handles are styled to match the group's purple theme

## Implementation Details

### Files Created/Modified

#### **New Files:**

1. **`GroupNode.tsx`** (`frontend/src/components/workflow/nodes/GroupNode.tsx`)
   - Custom node component for group nodes
   - Displays an "Ungroup" button when children are present
   - Uses `NodeResizer` for resizable functionality
   - Checks for child nodes using React Flow's `parentLookup` store

2. **`SelectedNodesToolbar.tsx`** (`frontend/src/components/workflow/SelectedNodesToolbar.tsx`)
   - Toolbar that appears when multiple nodes are selected
   - Displays "Group selected nodes" button
   - Filters out already grouped nodes and existing group nodes
   - Calculates group bounds and positions child nodes relatively
   - **Syncs group creation to Zustand workflow store**
   - **Marks workflow as dirty to enable save button**
   - **Creates undo/redo snapshot**

3. **`useDetachNodes.ts`** (`frontend/src/hooks/workflow/useDetachNodes.ts`)
   - Custom hook for ungrouping functionality
   - Converts relative child positions to absolute positions
   - Optionally removes the parent group node
   - Cleans up parent relationships and extent properties
   - **Marks workflow as dirty when ungrouping**
   - **Creates undo/redo snapshot**

#### **Modified Files:**

1. **`WorkflowEditor.tsx`**
   - Added `GroupNode` to the `nodeTypes` configuration
   - Imported `GroupNode` from nodes

3. **`WorkflowCanvas.tsx`**
   - Added `SelectedNodesToolbar` component
   - Added `selectNodesOnDrag={false}` to prevent unintended selections
   - Added `multiSelectionKeyCode="Shift"` for multi-selection with Shift key
   - Added `selectionMode={SelectionMode.Partial}` to enable box selection
   - Imported `SelectionMode` from `@xyflow/react`
   - Toolbar only shown when not in read-only or execution mode

3. **`reactflow-theme.css`**
   - Added comprehensive group node styling
   - Light and dark mode support
   - Button styling for group/ungroup actions
   - Resize handle styling
   - Hover, focus, and selected states

4. **`nodes/index.ts`**
   - Exported `GroupNode` component

5. **`hooks/workflow/index.ts`**
   - Exported `useDetachNodes` hook

6. **`workflow.ts` (types - frontend)**
   - Added `parentId`, `extent`, and `style` properties to `WorkflowNode` interface
   - These properties enable group relationships and styling to be persisted

7. **`database.ts` (types - backend)**
   - Updated `Node` interface to include `parentId`, `extent`, and `style` properties
   - Backend now properly accepts and persists group-related data
   - These properties are stored in the database and returned in API responses

8. **`workflowTransformers.ts`**
   - Updated `transformWorkflowNodesToReactFlow` to handle group nodes
   - Group nodes are transformed with their style and position
   - **Sorts nodes so group nodes come before their children** (required by React Flow)
   - Child nodes include `parentId`, `extent`, and `expandParent` properties
   - `expandParent: true` allows children to expand the parent group size

9. **`useReactFlowInteractions.ts`**
   - Updated `syncToZustand` to save group nodes to the workflow
   - Updated `syncPositionsToZustand` to handle group nodes during drag operations
   - Both functions now create new group nodes when they don't exist in the workflow
   - Child node relationships (parentId, extent) are preserved during sync

## How to Use

### Creating a Group:

1. **Select Multiple Nodes:**
   - **Option 1**: Click on first node, then hold `Shift` and click on additional nodes
   - **Option 2**: Click and drag to create a selection box around multiple nodes (box selection)
   - Both methods work simultaneously - you can box select some nodes and Shift+click to add more

2. **Group Nodes:**
   - Once nodes are selected, a toolbar appears above them
   - Click the "Group selected nodes" button
   - A purple group container will be created around the selected nodes

### Ungrouping Nodes:

1. **Select a Group Node:**
   - Click on the group node background

2. **Ungroup:**
   - A toolbar appears with an "Ungroup" button
   - Click "Ungroup" to release the nodes from the group
   - Nodes will maintain their absolute positions

### Resizing Groups:

1. **Select a Group Node:**
   - Click on the group node

2. **Resize:**
   - Drag the corner or edge handles to resize the group
   - Child nodes move proportionally with the group

## Styling Details

### Group Node Colors:

**Light Mode:**
- Background: `rgba(207, 182, 255, 0.4)`
- Border: `#9e86ed`
- Hover Border: `#7d5bd0`
- Selected Border: `#9e86ed` (2px width)

**Dark Mode:**
- Background: `rgba(120, 85, 200, 0.2)`
- Border: `#7d5bd0`
- Hover Border: `#b59ef5`
- Selected Border: `#9e86ed` (2px width)

### Button Styling:

- Rounded pill shape (border-radius: 100px)
- Primary color border
- Hover state with accent background
- Shadow effects matching other UI elements
- Consistent with your design system using CSS variables

## Technical Notes

### Selection Behavior:

- `selectNodesOnDrag={false}`: Prevents nodes from being selected when dragging the canvas
- `multiSelectionKeyCode="Shift"`: Hold Shift to add nodes to selection with clicks
- `selectionMode={SelectionMode.Partial}`: Enables box selection by dragging on canvas
- **Box Selection**: Click and drag on the canvas background to draw a selection box
- **Multi-Selection**: Hold Shift and click individual nodes to add them to selection
- **Single Selection**: Click a node without Shift to select only that node

### Group Padding:

- Default padding: 25px on all sides
- This ensures child nodes don't touch the group borders
- Padding is applied when calculating group bounds

### Parent-Child Relationships:

- Child nodes have `parentId` set to the group node's ID
- Child nodes have `extent: 'parent'` to constrain movement within the group
- Child nodes have `expandParent: true` to allow the group to auto-resize
- Positions are relative to the group node's top-left corner
- **Node order matters**: Group nodes must come before their children in the array

### Store Integration:

- Uses React Flow's `useStore` hook for optimal performance
- Accesses `parentLookup` map to check for child nodes
- Uses `resetSelectedElements()` to clear selection after grouping

### Persistence:

- **Group nodes are automatically saved** when you save the workflow
- The `syncToZustand` function syncs all React Flow nodes (including groups) to the Zustand store
- Group properties persisted include:
  - `id`: Unique identifier
  - `type`: Set to 'group'
  - `position`: X/Y coordinates
  - `style`: Width, height, and other styling
  - `parentId`: For child nodes, reference to parent group
  - `extent`: For child nodes, constrains movement to parent
- Groups are restored when loading a workflow
- The transformer handles converting saved groups back to React Flow format

## Compatibility

- ✅ Works with existing custom nodes
- ✅ Works with edges (connections preserved)
- ✅ Supports undo/redo functionality
- ✅ Compatible with copy/paste operations
- ✅ Works in both light and dark themes
- ✅ Disabled in read-only and execution modes

## Future Enhancements

Possible improvements for the future:

1. **Group Labels**: Add editable labels to groups
2. **Nested Groups**: Support groups within groups
3. **Group Colors**: Allow custom colors for different groups
4. **Collapse/Expand**: Ability to collapse groups to save space
5. **Group Templates**: Save and reuse group configurations
6. **Keyboard Shortcuts**: Add shortcuts like Ctrl+G for grouping
7. **Context Menu**: Add grouping options to right-click menu

## Troubleshooting

### Issue: Toolbar doesn't appear when selecting multiple nodes
- **Solution**: Try these methods:
  - Click and drag on the canvas background to draw a selection box around nodes
  - Click one node, hold `Shift`, then click other nodes to add them to selection
- Check that nodes don't already have a parent group
- Ensure you're not in read-only or execution mode

### Issue: Can't select multiple nodes at once
- **Solution**: Make sure you're either:
  - Drawing a selection box by clicking and dragging on the canvas background (not on a node)
  - Holding `Shift` while clicking on additional nodes
- If `panOnDrag` is enabled, you might need to be more precise with your clicks

### Issue: Nodes jump when ungrouping
- **Solution**: This is expected behavior as the hook converts relative positions to absolute positions
- The final position should match where the node was visually

### Issue: Can't resize group node
- **Solution**: Make sure the group node is selected (click on its background, not child nodes)
- Resize handles should appear at corners and edges

### Issue: Groups disappear after saving (FIXED)
- **Solution**: This issue has been resolved! Groups are now properly persisted to the backend
- The sync functions (`syncToZustand` and `syncPositionsToZustand`) now handle group nodes
- Group nodes are saved with their `style`, `position`, and relationship properties
- Child node relationships (`parentId`, `extent`) are preserved
- If you still experience this issue, make sure you're on the latest version of the code

### Issue: Nodes don't stay inside group after saving/reloading (FIXED)
- **Solution**: This issue has been resolved!
- The transformer now adds `expandParent: true` to child nodes
- Group nodes are sorted to appear before their children in the array (required by React Flow)
- Child nodes maintain their `parentId` and `extent` properties
- If nodes still appear outside the group, try refreshing the page twice or ungrouping and regrouping

### Issue: Save button doesn't activate after grouping (FIXED)
- **Solution**: This issue has been resolved!
- `SelectedNodesToolbar` now syncs group creation to the workflow store
- The workflow is marked as dirty (`setDirty(true)`) when nodes are grouped
- The save button will now appear immediately after grouping
- Undo/redo snapshot is automatically created

### Issue: Nodes move out of group when saving (FIXED)
- **Solution**: This issue has been resolved!
- When grouping, the changes are immediately synced to the Zustand workflow store
- The workflow store contains the correct `parentId`, `extent`, and `style` properties
- These properties persist through the save operation
- Backend properly accepts and stores all group-related properties

## Code Example

### Creating a Group Programmatically:

```typescript
import { useReactFlow } from '@xyflow/react'

const { setNodes, getNodesBounds } = useReactFlow()
const GROUP_PADDING = 25

// Select nodes to group
const nodesToGroup = nodes.filter(n => selectedIds.includes(n.id))
const bounds = getNodesBounds(nodesToGroup)

// Create group node
const groupNode = {
  id: `group_${Date.now()}`,
  type: 'group',
  position: { x: bounds.x, y: bounds.y },
  style: {
    width: bounds.width + GROUP_PADDING * 2,
    height: bounds.height + GROUP_PADDING * 2,
  },
  data: {},
}

// Update child nodes with relative positions
const updatedNodes = nodes.map(node => {
  if (selectedIds.includes(node.id)) {
    return {
      ...node,
      position: {
        x: node.position.x - bounds.x + GROUP_PADDING,
        y: node.position.y - bounds.y + GROUP_PADDING,
      },
      extent: 'parent',
      parentId: groupNode.id,
    }
  }
  return node
})

setNodes([groupNode, ...updatedNodes])
```

## References

- [React Flow Grouping Documentation](https://reactflow.dev/examples/nodes/grouping)
- [React Flow Node Resizer](https://reactflow.dev/api-reference/components/node-resizer)
- [React Flow Node Toolbar](https://reactflow.dev/api-reference/components/node-toolbar)
