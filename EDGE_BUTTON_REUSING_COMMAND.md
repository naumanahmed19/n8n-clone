# Edge Button Implementation - Using Existing Command Dialog

## Overview
The edge button functionality has been successfully integrated with the **existing** AddNodeCommandDialog system. No new dialog was created - we're reusing the same command dialog that's already used throughout the application.

## How It Works

### Existing Infrastructure (Already in place)

1. **`useAddNodeDialogStore`** - Global store managing dialog state
   - `isOpen`: Dialog open/close state
   - `position`: Where to place the new node
   - `insertionContext`: Contains source/target node info for connecting
   - `openDialog(position, context)`: Opens dialog with context
   - `closeDialog()`: Closes dialog

2. **`AddNodeCommandDialog`** - Already handles insertion context
   - Takes `open`, `onOpenChange`, `nodeTypes`, `position` props
   - Already connected to `useAddNodeDialogStore`
   - Already has logic to wire nodes when insertion context exists
   - Now enhanced to **remove the old connection** before creating new ones

3. **`WorkflowEditor`** - Already renders the dialog
   ```tsx
   const { isOpen: showAddNodeDialog, openDialog, closeDialog, position } = useAddNodeDialogStore()
   
   <AddNodeCommandDialog
       open={showAddNodeDialog}
       onOpenChange={closeDialog}
       nodeTypes={availableNodeTypes}
       position={position}
   />
   ```

### What We Added

#### 1. EdgeButton Component
**File:** `frontend/src/components/workflow/edges/EdgeButton.tsx`

Simply calls the existing `openDialog` function with insertion context:

```tsx
const { openDialog } = useAddNodeDialogStore();

const handleClick = () => {
  openDialog(
    { x, y },  // Position for new node
    {
      sourceNodeId: source,
      targetNodeId: target,
      sourceOutput: sourceHandleId || undefined,
      targetInput: targetHandleId || undefined,
    }
  );
};
```

#### 2. Enhanced AddNodeCommandDialog
**File:** `frontend/src/components/workflow/AddNodeCommandDialog.tsx`

Added one feature: **Remove old connection before creating new ones**

```tsx
if (insertionContext) {
  // NEW: Find and remove existing connection
  const existingConnection = workflow?.connections.find(
    conn =>
      conn.sourceNodeId === insertionContext.sourceNodeId &&
      conn.targetNodeId === insertionContext.targetNodeId &&
      // ... match handles
  )
  
  if (existingConnection) {
    removeConnection(existingConnection.id)  // Remove old A→B connection
  }

  // EXISTING: Create new connections
  addConnection(source → newNode)
  addConnection(newNode → target)
}
```

## The Flow

```
1. User clicks [+] on edge (A → B)
        ↓
2. EdgeButton.handleClick() 
        ↓
3. openDialog(position, { sourceNodeId: A, targetNodeId: B })
        ↓
4. useAddNodeDialogStore updates: isOpen = true, insertionContext = {...}
        ↓
5. WorkflowEditor re-renders
        ↓
6. AddNodeCommandDialog shows (open={true})
        ↓
7. User selects node type "Transform"
        ↓
8. AddNodeCommandDialog.handleSelectNode()
        - Remove connection A → B
        - Add node C
        - Add connection A → C
        - Add connection C → B
        ↓
9. Dialog closes
```

## Benefits of Reusing Existing System

✅ **No Duplication**: Uses the same dialog for all node additions
✅ **Consistent UX**: Same search, same categorization, same behavior
✅ **Maintainable**: One place to update dialog behavior
✅ **Integrated**: Works with keyboard shortcuts (Ctrl+A already opens it)
✅ **State Management**: Uses existing Zustand store patterns
✅ **Already Tested**: The dialog logic is already in use and tested

## Comparison with Other Add Node Methods

| Method | Calls | insertionContext | Position |
|--------|-------|------------------|----------|
| Keyboard (Ctrl+A) | `openDialog()` | `undefined` | Center of viewport |
| Output Connector Click | `openDialog(position)` | `{ sourceNodeId }` | Near connector |
| **Edge Button Click** | `openDialog(position, context)` | `{ source, target }` | **Edge midpoint** |

## Key Enhancement

The **only new logic** added to the existing system:
- Before: Dialog would create connections but leave old connection intact
- Now: Dialog removes old connection when both source AND target are specified

This makes the edge button insertion feel seamless and automatic!

## Files Modified

1. ✅ `frontend/src/components/workflow/edges/EdgeButton.tsx` - Calls existing `openDialog`
2. ✅ `frontend/src/components/workflow/edges/CustomEdge.tsx` - Renders EdgeButton
3. ✅ `frontend/src/components/workflow/AddNodeCommandDialog.tsx` - Enhanced to remove old connection

## No Changes Needed To

- ❌ WorkflowEditor (already has dialog)
- ❌ useAddNodeDialogStore (already has all we need)
- ❌ WorkflowCanvas (just passes props)

## Testing

The command dialog is already being used, so test:
1. Edge button opens the existing dialog ✓
2. Dialog search works ✓
3. Old connection is removed ✓
4. New connections are created ✓
5. Node positioning is correct ✓
