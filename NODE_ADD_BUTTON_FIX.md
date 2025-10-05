# Node Add Button Disabled in Read-Only Mode

## Issue
The "Add Node" button (Plus icon) was still appearing on node output handles in execution view, allowing users to potentially add nodes in read-only mode.

## Solution Implemented

### 1. CustomNode Component
**File**: `frontend/src/components/workflow/CustomNode.tsx`

Added execution mode detection:
```typescript
// Check if in execution mode (read-only)
const { executionState } = useWorkflowStore()
const isReadOnly = !!executionState.executionId
```

Passed `readOnly` prop to child components:
```typescript
<NodeHandles
  // ... other props
  readOnly={isReadOnly}
/>

<NodeContextMenu
  // ... other props
  readOnly={isReadOnly}
/>
```

### 2. NodeHandles Component
**File**: `frontend/src/components/workflow/components/NodeHandles.tsx`

Updated interface and component to accept `readOnly` prop:
```typescript
interface NodeHandlesProps {
  // ... existing props
  readOnly?: boolean
}
```

Passed to `OutputHandle`:
```typescript
<OutputHandle
  // ... other props
  readOnly={readOnly}
/>
```

### 3. OutputHandle Component
**File**: `frontend/src/components/workflow/components/NodeHandles.tsx`

Updated to hide Plus icon in read-only mode:
```typescript
interface OutputHandleProps {
  // ... existing props
  readOnly: boolean
}

// Hide Plus icon when readOnly
{isHovered && !disabled && !readOnly && (
  <div>
    <div className="bg-primary rounded-full p-0.5 shadow-lg">
      <Plus className="w-3 h-3 text-primary-foreground" />
    </div>
  </div>
)}
```

### 4. NodeContextMenu Component
**File**: `frontend/src/components/workflow/components/NodeContextMenu.tsx`

Added `readOnly` prop and disabled editing operations:
```typescript
interface NodeContextMenuProps {
  // ... existing props
  readOnly?: boolean
}

// Disabled operations in read-only mode
<ContextMenuItem
  onClick={onExecute}
  disabled={readOnly}  // NEW
>
  Execute Node
</ContextMenuItem>

<ContextMenuItem
  onClick={onDuplicate}
  disabled={readOnly}  // NEW
>
  Duplicate
</ContextMenuItem>

<ContextMenuItem
  onClick={onDelete}
  disabled={readOnly}  // NEW
>
  Delete
</ContextMenuItem>
```

Note: "Properties" remains enabled to allow viewing node properties in read-only mode.

## Data Flow

```
executionState.executionId (from store)
  ↓
CustomNode (detects read-only mode)
  ↓ readOnly={true}
  ├─→ NodeHandles
  │     ↓ readOnly={true}
  │     └─→ OutputHandle
  │           ↓
  │           └─→ Plus icon hidden
  │
  └─→ NodeContextMenu
        ↓
        └─→ Execute, Duplicate, Delete disabled
```

## What's Disabled in Execution View

### Node Output Handles
- ✅ **Plus icon** - Hidden on hover (cannot add nodes from handle)
- ✅ Handle still clickable for viewing connections (read-only)

### Node Context Menu (Right-Click)
- ✅ **Execute Node** - Disabled
- ✅ **Duplicate** - Disabled  
- ✅ **Delete** - Disabled
- ✅ **Properties** - Still enabled (view-only)

## Complete Read-Only Protection Summary

### Previously Protected:
1. ✅ Toolbar hidden
2. ✅ Nodes not draggable
3. ✅ Nodes not connectable
4. ✅ Canvas context menu operations disabled
5. ✅ Keyboard shortcuts disabled
6. ✅ No node/edge changes allowed

### Newly Protected (This Update):
7. ✅ **Plus icon on node outputs hidden**
8. ✅ **Node context menu operations disabled**

## User Experience

### In Execution View, Users CANNOT:
- ❌ See Plus icon on node outputs
- ❌ Add nodes by clicking output handles
- ❌ Right-click and execute nodes
- ❌ Right-click and duplicate nodes
- ❌ Right-click and delete nodes

### In Execution View, Users CAN:
- ✅ View node properties (read-only)
- ✅ See node execution states
- ✅ Navigate the canvas
- ✅ View node connections

## Testing Checklist

- [ ] Navigate to execution view: `/workflows/:id/executions/:executionId`
- [ ] Hover over node output handles → Plus icon should NOT appear
- [ ] Right-click on a node
- [ ] Verify "Execute Node" is disabled (grayed out)
- [ ] Verify "Duplicate" is disabled
- [ ] Verify "Delete" is disabled
- [ ] Verify "Properties" is still enabled
- [ ] Click "Properties" → Should open in read-only mode
- [ ] Exit execution view
- [ ] Hover over node output handles → Plus icon should appear
- [ ] Right-click on a node → All options should be enabled

## Files Modified

1. `frontend/src/components/workflow/CustomNode.tsx`
   - Added execution mode detection
   - Passed `readOnly` to NodeHandles and NodeContextMenu

2. `frontend/src/components/workflow/components/NodeHandles.tsx`
   - Added `readOnly` prop to interfaces
   - Passed to OutputHandle
   - Hidden Plus icon when `readOnly={true}`

3. `frontend/src/components/workflow/components/NodeContextMenu.tsx`
   - Added `readOnly` prop
   - Disabled Execute, Duplicate, Delete operations

## Implementation Notes

- Read-only state is derived from `executionState.executionId` in the workflow store
- When executionId exists, the workflow is in execution viewing mode
- All node-level interactions cascade from this single source of truth
- Properties remain accessible for viewing execution data
- Visual feedback (grayed out menu items) clearly indicates disabled state
