# Group Node Resize - Zustand Sync Fix

# Group Node Resize - Zustand Sync Fix

## Problem
When resizing a group node using the NodeResizer component, multiple issues occurred:
1. **Save button remained disabled** - workflow was not marked as dirty
2. **Changes not persisted** - resize changes were lost on save/reload
3. **No undo/redo support** - resize operations couldn't be undone
4. **Resize reverted immediately** - group snapped back to original size

## Root Causes

### Issue 1: No Sync to Zustand
The `handleNodesChange` handler was only tracking position changes (dragging) but not dimension changes (resizing).

### Issue 2: Continuous Sync During Resize
Initial fix synced on every dimension change event, causing performance issues with hundreds of updates per second.

### Issue 3: Sync Overwriting Resize (Critical!)
The most critical issue: The Zustand → React Flow sync was **overwriting the resize** as it happened:
- User starts resizing group
- React Flow updates node dimensions locally
- **Zustand → React Flow sync runs** (from useEffect in WorkflowEditor)
- Sync recreates nodes from Zustand state (old dimensions)
- **Resize is overwritten and reverts back!**

This created a constant battle between:
- React Flow trying to resize the node
- Zustand sync constantly reverting it back

## Root Cause
The `handleNodesChange` handler in `useReactFlowInteractions` was only tracking position changes (dragging) but not dimension changes (resizing). React Flow v12 emits dimension change events when nodes are resized, but we weren't:
- Detecting these changes
- Syncing them to Zustand store
- Marking the workflow as dirty
- Creating undo/redo snapshots

## Solution

### 1. Added Resize State Tracking
```typescript
const resizeSnapshotTaken = useRef(false);
const isResizing = useRef(false); // NEW: Track if resize is in progress
```

### 2. Block Zustand → React Flow Sync During Resize
This is the **critical fix** that prevents resize from being overwritten:

```typescript
// When resize starts
if ('resizing' in change && change.resizing === true) {
  isResizeStart = true;
  isResizing.current = true;
  blockSync.current = true; // 🔒 BLOCK SYNC - prevents overwriting!
}
```

The `blockSync.current` flag is checked in WorkflowEditor's useEffect:
```typescript
// WorkflowEditor.tsx
useEffect(() => {
  const shouldSync = workflowChanged || !blockSync.current;
  
  if (shouldSync) {
    setNodes(reactFlowNodes); // Only runs if NOT blocked
  } else {
    console.log('⏸️ Sync blocked - resize in progress');
  }
}, [workflowId, reactFlowNodes, blockSync]);
```

### 3. Sync Only When Resize Completes
```typescript
// Only sync when resize is complete (resizing: false)
if (isResizeComplete && reactFlowInstance) {
  setTimeout(() => {
    // Update workflow with final dimensions
    updateWorkflow({ nodes: updatedNodes });
    setDirty(true);
    
    // 🔓 UNBLOCK SYNC after update is complete
    setTimeout(() => {
      resizeSnapshotTaken.current = false;
      isResizing.current = false;
      blockSync.current = false; // Resume normal sync
    }, 100);
  }, 0);
}
```

## How It Works Now

### 1. User Starts Resizing Group
- User grabs resize handle on group node
- React Flow emits dimension change with `resizing: true`
- Handler sets `blockSync.current = true` 🔒
- **Zustand → React Flow sync is now blocked!**
- Takes **one snapshot** for undo/redo

### 2. During Resize
- React Flow continuously emits dimension changes with `resizing: true`
- **No Zustand sync happens** (performance optimization)
- **Zustand → React Flow sync is blocked** (prevents overwriting!)
- Visual updates handled by React Flow internally
- User sees smooth resize without any "jumping back"

### 3. User Releases Resize Handle
- React Flow emits **final** dimension change with `resizing: false`
- **Now we sync to Zustand** with the final dimensions
- Workflow marked as dirty (enables save button)
- Sets `blockSync.current = false` 🔓 (after 100ms delay)
- Resize snapshot flag reset

### 4. Save Workflow
- Workflow is dirty, so save button is enabled
- User can save changes
- Group dimensions are persisted in the database
- On reload, group keeps its new size ✅

### 5. Undo/Redo
- User can press Ctrl+Z to undo the resize
- Group returns to previous size
- Can redo with Ctrl+Y

## Technical Details

### Why setTimeout?
```typescript
setTimeout(() => {
  // Sync logic
}, 0);
```
The `setTimeout` with 0ms delay ensures React Flow's internal state is fully updated before we read from it. This is a common pattern when working with React Flow to ensure we get the latest node dimensions.

### Style Property
Group node dimensions are stored in the `style` property:
```typescript
style: {
  width: 300,
  height: 200
}
```
By syncing the entire `style` object, we preserve all dimension information.

### Snapshot Management
- **dragSnapshotTaken**: Tracks drag operation snapshots
- **resizeSnapshotTaken**: Tracks resize operation snapshots
- Both use refs to persist across renders
- Both reset after operation completes

## Benefits

✅ **Save button works** - Workflow marked as dirty on resize  
✅ **Changes persist** - Dimensions saved to database  
✅ **Undo/Redo support** - Resize operations can be undone  
✅ **Real-time sync** - Zustand store stays in sync with React Flow  
✅ **Optimized performance** - Only syncs once when resize completes  
✅ **No continuous updates** - Avoids re-render storms during drag  
✅ **Type safe** - Full TypeScript support  

## Key Performance Optimization

### Problem 1: Continuous Sync During Resize
Initial implementation synced on every dimension change event:
```typescript
// ❌ BAD - Syncs continuously during resize
if (hasDimensionChange && reactFlowInstance) {
  updateWorkflow({ nodes: updatedNodes }); // Called 100+ times!
}
```

### Problem 2: Zustand Overwriting Resize (CRITICAL!)
Even worse - the Zustand → React Flow sync was constantly overwriting the resize:
```typescript
// ❌ BAD - WorkflowEditor constantly syncing old dimensions back
useEffect(() => {
  setNodes(reactFlowNodes); // Overwrites resize with old dimensions!
}, [reactFlowNodes]); // Runs every render during resize
```

**Result:** Group would resize then immediately snap back to original size!

### Solution: Block Sync During Resize
```typescript
// ✅ GOOD - Only sync once when resize finishes
if (isResizeComplete && reactFlowInstance) {
  updateWorkflow({ nodes: updatedNodes }); // Called once!
}

// ✅ GOOD - Block Zustand → React Flow sync during resize
if (isResizeStart) {
  blockSync.current = true; // Prevents overwriting!
}

// ✅ GOOD - WorkflowEditor respects block flag
useEffect(() => {
  if (!blockSync.current) { // Only sync if not blocked
    setNodes(reactFlowNodes);
  }
}, [reactFlowNodes, blockSync]);
```

This prevents:
- Hundreds of Zustand updates during resize ✅
- Zustand constantly overwriting React Flow's resize ✅
- Continuous re-renders of components ✅
- Performance degradation with many nodes ✅
- Browser lag during resize operations ✅
- **Group snapping back to original size** ✅

## Testing

### Manual Testing Checklist:
- [x] Resize a group node
- [x] Verify save button becomes enabled
- [x] Save the workflow
- [x] Reload the page
- [x] Verify group has the new size
- [x] Resize a group
- [x] Press Ctrl+Z to undo
- [x] Verify group returns to original size
- [x] Press Ctrl+Y to redo
- [x] Verify group resizes again

### Edge Cases Covered:
- [x] Resizing empty groups
- [x] Resizing groups with child nodes
- [x] Multiple rapid resizes
- [x] Resize then drag
- [x] Resize then undo then redo
- [x] Resize in read-only mode (disabled)
- [x] Resize in execution mode (disabled)

## Related Files
- `frontend/src/hooks/workflow/useReactFlowInteractions.ts` - Main fix
- `frontend/src/components/workflow/nodes/GroupNode.tsx` - Uses NodeResizer
- `frontend/src/stores/workflow.ts` - Zustand store

## Related Features
- Group node creation and deletion
- Drag-to-add nodes to groups
- Group node styling and theming
- Undo/Redo system
- Workflow save functionality
