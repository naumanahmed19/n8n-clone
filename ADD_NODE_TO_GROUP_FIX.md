# Add Node to Group via Connection Dialog - Fix

## Problem
When adding a node via the connection dialog (command dialog) by dragging from a node that's inside a group, the new node was not being added to the same group.

## Root Cause
The `AddNodeCommandDialog` component's `handleSelectNode` function wasn't checking if the source node had a `parentId` (indicating it's in a group) and therefore wasn't setting the same `parentId` on the newly created node.

## Solution

### Changes Made

#### 1. Track Parent Group ID
Added `parentGroupId` variable to track if the source node is in a group:

```typescript
let parentGroupId: string | undefined = undefined
```

#### 2. Detect Source Node's Parent
When positioning the new node, check if the source node has a `parentId`:

```typescript
const sourceNode = reactFlowInstance.getNode(insertionContext.sourceNodeId)

if (sourceNode) {
  // Check if source node is in a group
  if (sourceNode.parentId) {
    parentGroupId = sourceNode.parentId
  }
  
  // Position to the right of the source node
  nodePosition = {
    x: sourceNode.position.x + 200,
    y: sourceNode.position.y
  }
}
```

#### 3. Add New Node to Same Group
When creating the new node, include `parentId` and `extent` if the source was in a group:

```typescript
const newNode: WorkflowNode = {
  id: `node-${Date.now()}`,
  type: nodeType.type,
  name: nodeType.displayName,
  parameters,
  position: nodePosition,
  credentials: [],
  disabled: false,
  // If source node is in a group, add new node to the same group
  ...(parentGroupId && { 
    parentId: parentGroupId,
    extent: 'parent' as const
  }),
}
```

## How It Works

1. **Connection Initiated**: User drags connection from a node inside a group
2. **Dialog Opens**: Add node command dialog opens at the drop position
3. **Parent Detection**: Code checks `sourceNode.parentId` to see if it's in a group
4. **Position Calculation**: New node position is calculated relative to source (already relative to parent if in group)
5. **Node Creation**: New node is created with same `parentId` and `extent: 'parent'`
6. **Result**: New node appears inside the same group as the source node

## Related Properties

- `parentId`: ID of the parent group node
- `extent: 'parent'`: Constrains child node to stay within parent boundaries
- `expandParent: false`: Prevents group from auto-resizing when child moves (set in `workflowTransformers.ts`)

## Testing

To test this fix:

1. Create a group node
2. Add a node to the group (drag it in)
3. Drag a connection from that node
4. Select a node from the command dialog
5. ✅ The new node should be added inside the same group
6. ✅ The new node should be positioned relative to the source node
7. ✅ The new node should have proper connection to the source

## Files Modified

- `frontend/src/components/workflow/AddNodeCommandDialog.tsx`
  - Added `parentGroupId` tracking
  - Added parent detection in both connection drop and insert-between-nodes scenarios
  - Added conditional `parentId` and `extent` to new node creation

## Benefits

- **Consistent Grouping**: Nodes stay organized within their logical groups
- **Better UX**: Users don't have to manually drag new nodes into groups
- **Maintains Context**: New nodes inherit the group membership of their source
- **Relative Positioning**: Works correctly with React Flow's parent-child coordinate system
