# Command Dialog Node Position Fix

## Problem

When adding a node from the command dialog (opened via Cmd+K keyboard shortcut), the new node was being positioned far away from the center of the canvas instead of at the viewport center where the user expected it.

## Root Cause

There were **two issues**:

### Issue 1: No Position Passed from Keyboard Shortcut Handler

In `WorkflowEditor.tsx`, the `handleAddNode` callback was calling `openDialog()` without any position parameter:

```tsx
// OLD CODE - No position calculated
const handleAddNode = useCallback(() => openDialog(), [openDialog])
```

### Issue 2: Double Coordinate Conversion

In `AddNodeCommandDialog.tsx`, when a position was provided, it was being converted from screen to flow coordinates **again**, even though it was already in flow coordinates:

```tsx
// OLD CODE - Converting position twice!
} else if (position) {
  // If position is provided (e.g., from output connector click), use it
  // Convert screen coordinates to flow coordinates
  if (reactFlowInstance) {
    nodePosition = reactFlowInstance.screenToFlowPosition(position)  // ❌ Already converted!
  } else {
    nodePosition = position
  }
}
```

The position passed to `openDialog()` is already in **flow coordinates** (converted by the caller using `screenToFlowPosition`), but the code was converting it again, resulting in an incorrect final position far from where intended.

## Solution

### Fix 1: Calculate Viewport Center Before Opening Dialog

Updated the `handleAddNode` callback in `WorkflowEditor.tsx` to calculate the viewport center:

```tsx
// NEW CODE - Calculate viewport center position
const handleAddNode = useCallback(() => {
    if (reactFlowInstance) {
        // Calculate center of viewport
        const viewportCenter = reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        })
        openDialog(viewportCenter)
    } else {
        // Fallback if instance not ready
        openDialog()
    }
}, [openDialog, reactFlowInstance])
```

### Fix 2: Use Position Directly Without Double Conversion

Updated `AddNodeCommandDialog.tsx` to use the position directly since it's already in flow coordinates:

```tsx
// NEW CODE - Use position directly (already in flow coordinates)
} else if (position) {
  // Position is already in flow coordinates from openDialog caller
  // (either from WorkflowEditor's viewport center or from connection drag)
  nodePosition = position
} else if (reactFlowInstance) {
  // Get center of viewport as fallback
  nodePosition = reactFlowInstance.screenToFlowPosition({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })
}
```

## How It Works

### Position Flow

1. **Keyboard Shortcut (Cmd+K)**:
   - User presses Cmd+K
   - `handleAddNode` calculates viewport center: `screenToFlowPosition({ x: innerWidth/2, y: innerHeight/2 })`
   - Calls `openDialog(viewportCenter)` with flow coordinates
   - Dialog uses position directly → node appears at viewport center ✅

2. **Connection Drag**:
   - User drags connection and drops on canvas
   - `useReactFlowInteractions` calculates drop position: `screenToFlowPosition({ x, y })`
   - Calls `openDialog(position, insertionContext)` with flow coordinates
   - Dialog uses position directly → node appears at drop location ✅

3. **Add Node Button**:
   - User clicks Add Node button in WorkflowControls
   - Button calculates viewport center: `screenToFlowPosition({ x: innerWidth/2, y: innerHeight/2 })`
   - Calls `openDialog(viewportCenter)` with flow coordinates
   - Dialog uses position directly → node appears at viewport center ✅

### Key Insight

All callers of `openDialog()` convert screen → flow coordinates **before** calling it, so the position stored in the Zustand store is **always in flow coordinates**. The dialog should use this position directly without any additional conversion.

## Benefits

✅ **Consistent Positioning**: Nodes appear exactly where expected
✅ **No Double Conversion**: Position is converted once by the caller
✅ **Zoom Aware**: Works correctly regardless of zoom level
✅ **Pan Aware**: Works correctly regardless of canvas pan position
✅ **Better UX**: User can predict where new nodes will appear

## Testing

To test this fix:

### Test 1: Keyboard Shortcut
1. Open a workflow
2. Pan and zoom the canvas to a specific area
3. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux)
4. Select any node from the command dialog
5. ✅ The new node should appear in the center of your current viewport

### Test 2: Connection Drag
1. Drag a connection from an existing node
2. Drop it on empty canvas
3. Select a node from the command dialog
4. ✅ The new node should appear at the drop location

### Test 3: Add Node Button
1. Click the Add Node button (+ icon)
2. Select a node from the command dialog
3. ✅ The new node should appear at the center of the viewport

## Files Modified

1. **`frontend/src/components/workflow/WorkflowEditor.tsx`**
   - Added `reactFlowInstance` to Zustand store destructuring
   - Updated `handleAddNode` to calculate viewport center before opening dialog
   - Added dependency on `reactFlowInstance` to useCallback dependencies

2. **`frontend/src/components/workflow/AddNodeCommandDialog.tsx`**
   - Removed double coordinate conversion
   - Now uses position directly since it's already in flow coordinates
   - Updated comment to clarify position is pre-converted

## Related Code

This fix ensures consistency with how positions are handled throughout the codebase:

- **WorkflowControls.tsx**: Converts screen → flow before calling `openDialog()`
- **useReactFlowInteractions.ts**: Converts screen → flow before calling `openDialog()`
- **WorkflowEditor.tsx**: Now also converts screen → flow before calling `openDialog()`

All callers follow the same pattern: convert once, pass flow coordinates.
