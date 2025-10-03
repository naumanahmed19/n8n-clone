# Edge Button with Node Insertion Implementation

## Overview
Successfully implemented edge button functionality that opens the command dialog to insert a node between two connected nodes. When a node is selected, it automatically removes the old connection and creates two new connections (source → new node → target).

## Implementation Details

### 1. EdgeButton Component Update
**File:** `frontend/src/components/workflow/edges/EdgeButton.tsx`

**Changes:**
- Removed dropdown functionality (no longer needed)
- Integrated with `useAddNodeDialogStore`
- On click, opens the AddNodeCommandDialog with insertion context
- Passes edge connection details (source, target, handles) to the dialog

**Key Features:**
- Simple button that appears on all edges
- Click triggers command dialog with proper context
- Passes source and target node IDs and handle IDs

### 2. AddNodeCommandDialog Enhancement
**File:** `frontend/src/components/workflow/AddNodeCommandDialog.tsx`

**Changes:**
- Added `removeConnection` and `workflow` from store
- Implemented logic to find and remove existing connection between source and target nodes
- When inserting a node with insertion context:
  1. Finds the existing connection between source and target
  2. Removes the old connection
  3. Creates new connection: source → new node
  4. Creates new connection: new node → target

**Connection Matching Logic:**
- Matches source and target node IDs
- Matches source output and target input handles
- Handles cases where handles might be undefined or 'main'

### 3. Store Integration
Uses existing stores:
- **`useAddNodeDialogStore`**: Manages dialog open/close state and insertion context
- **`useWorkflowStore`**: Manages workflow state, nodes, and connections

## How It Works

### User Flow:
1. User clicks the "+" button on an edge connecting Node A → Node B
2. Command dialog opens with all available node types
3. User searches and selects a new node (e.g., "Transform Node")
4. System automatically:
   - Removes the old connection (A → B)
   - Adds the new node (Node C) at the edge midpoint
   - Creates connection: A → C
   - Creates connection: C → B

### Technical Flow:
```
Edge Click
    ↓
EdgeButton.handleClick()
    ↓
openDialog(position, insertionContext)
    ↓
User Selects Node
    ↓
AddNodeCommandDialog.handleSelectNode()
    ↓
1. Find existing connection (A → B)
2. removeConnection(connectionId)
3. addNode(newNode)
4. addConnection(A → newNode)
5. addConnection(newNode → B)
    ↓
Dialog Closes
```

## Benefits

✅ **Seamless Integration**: Works with existing workflow editor and store
✅ **Automatic Reconnection**: No manual wiring needed
✅ **Clean UX**: Simple click interaction
✅ **Handle Support**: Respects source/target handles for complex node connections
✅ **No Breaking Changes**: Existing functionality remains intact

## Edge Cases Handled

1. **Missing Workflow**: Uses optional chaining (`workflow?.connections`)
2. **Handle Matching**: Matches both explicit handle IDs and undefined/default handles
3. **Multiple Outputs**: Respects sourceOutput and targetInput parameters
4. **Connection Not Found**: Gracefully handles if existing connection doesn't exist

## Future Enhancements

Potential improvements:
1. **Visual Feedback**: Highlight the edge when hovering the button
2. **Animation**: Smooth transition when node is inserted
3. **Undo/Redo**: Ensure insertion is tracked in history
4. **Node Positioning**: Smart positioning based on node types and layout
5. **Quick Actions**: Add common node types as quick actions

## Testing Checklist

To test the implementation:
- [ ] Click edge button opens command dialog
- [ ] Search for a node type
- [ ] Select a node
- [ ] Verify old connection is removed
- [ ] Verify new node appears between source and target
- [ ] Verify two new connections are created
- [ ] Test with nodes that have multiple outputs/inputs
- [ ] Test with different handle IDs
- [ ] Verify dialog closes after insertion

## Files Modified

1. `frontend/src/components/workflow/edges/EdgeButton.tsx` - Click handler integration
2. `frontend/src/components/workflow/AddNodeCommandDialog.tsx` - Connection removal and insertion logic

## Dependencies

- `useAddNodeDialogStore` - Dialog state management
- `useWorkflowStore` - Workflow state, addNode, addConnection, removeConnection
- `reactflow` - Position calculations
