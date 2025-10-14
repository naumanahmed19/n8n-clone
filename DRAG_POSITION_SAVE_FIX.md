# Drag Position Save Fix

## 🐛 Issue

After optimizing the undo/redo system by removing real-time Zustand updates during drag operations, we introduced a bug: **dragged node positions were not being saved** (isDirty flag was not set).

### Root Cause

The original optimization removed all Zustand store updates from `handleNodeDragStop` and `handleSelectionDragStop` to prevent:

1. Excessive history pollution (50-200 snapshots per drag)
2. Sync loop issues causing laggy dragging

However, this created a new problem:

- React Flow maintained the new positions internally
- Zustand store still had the old positions
- When user tried to save, the old positions were saved
- `isDirty` flag was never set because Zustand workflow never changed

## ✅ Solution

We now sync React Flow positions back to Zustand **AFTER** drag completes, but:

1. ✅ Still take history snapshot BEFORE drag (not during)
2. ✅ Still block sync during drag to prevent lag
3. ✅ **NEW:** Update Zustand with final positions after drag stops
4. ✅ This triggers isDirty flag without polluting history

### Updated Flow

```
User starts dragging
    ↓
handleNodeDragStart
    ↓
Save history snapshot (ONCE)
Set blockSync = true
    ↓
User drags node (smooth, no interruptions)
React Flow updates internally
Zustand sync is BLOCKED
    ↓
User releases mouse
    ↓
handleNodeDragStop
    ↓
Sync React Flow → Zustand (ONCE)
This sets isDirty = true
Reset blockSync = false after 100ms
```

## 📝 Code Changes

### File: `frontend/src/hooks/workflow/useReactFlowInteractions.ts`

#### Before (Broken - positions not saved)

```typescript
const handleNodeDragStop = useCallback(
  (_event: React.MouseEvent, node: any) => {
    console.log("✅ Node drag stopped:", node.id);
    setTimeout(() => {
      dragSnapshotTaken.current = false;
      isDragging.current = false;
      blockSync.current = false;
    }, 100);

    // NOTE: We deliberately DON'T update Zustand store here!
    // ❌ BUG: This means positions are never saved!
  },
  []
);
```

#### After (Fixed - positions saved, isDirty set correctly)

```typescript
const handleNodeDragStop = useCallback(
  (_event: React.MouseEvent, node: any) => {
    console.log("✅ Node drag stopped:", node.id);

    // ✅ Sync React Flow positions to Zustand to update isDirty flag
    const { workflow, updateWorkflow } = useWorkflowStore.getState();
    if (workflow && reactFlowInstance) {
      const currentNodes = reactFlowInstance.getNodes();
      const updatedNodes = workflow.nodes.map((wfNode) => {
        const rfNode = currentNodes.find((n) => n.id === wfNode.id);
        if (rfNode && rfNode.position) {
          return { ...wfNode, position: rfNode.position };
        }
        return wfNode;
      });
      // ✅ Use updateWorkflow to set isDirty: true
      updateWorkflow({ nodes: updatedNodes });
    }

    setTimeout(() => {
      dragSnapshotTaken.current = false;
      isDragging.current = false;
      blockSync.current = false;
    }, 100);
  },
  [reactFlowInstance]
);
```

**Key change:** Now uses `updateWorkflow({ nodes: updatedNodes })` instead of `setWorkflow(updatedWorkflow)`.

**Why this matters:**

- `setWorkflow()` sets `isDirty: false` (designed for loading workflows)
- `updateWorkflow()` sets `isDirty: true` (designed for user edits)

Same fix applied to `handleSelectionDragStop`.

## 🎯 Benefits

### What We Keep (The Good Parts)

✅ **Smooth dragging** - No sync interruptions during drag
✅ **Clean history** - Only ONE snapshot per drag operation
✅ **No lag** - blockSync prevents parent component sync during drag
✅ **React Flow as source of truth** - Positions managed internally during editing

### What We Fixed (The Bug)

✅ **Positions saved** - Final positions synced to Zustand after drag
✅ **isDirty works** - Workflow marked as modified after drag
✅ **Save works** - Correct positions persisted to backend
✅ **Undo/Redo works** - Can undo back to pre-drag positions

## 🔄 Complete Drag Flow

### Phase 1: Drag Start

```typescript
handleNodeDragStart
├─ Check if snapshot taken (dragSnapshotTaken.current)
├─ If not taken:
│  └─ saveToHistory("Move node")  // ONCE per drag operation
├─ Set isDragging.current = true
└─ Set blockSync.current = true    // Prevent parent sync
```

### Phase 2: During Drag

```typescript
React Flow internal updates (smooth!)
├─ Node position changes in React Flow state
├─ Parent component's useEffect sees blockSync = true
└─ Parent component SKIPS sync (no interference)
```

### Phase 3: Drag Stop

```typescript
handleNodeDragStop
├─ Get current React Flow nodes
├─ Update Zustand workflow with new positions  // Sets isDirty!
├─ Wait 100ms
└─ Reset flags (dragSnapshotTaken, isDragging, blockSync)
```

### Phase 4: Save

```typescript
User clicks Save
├─ Workflow in Zustand has correct positions ✓
├─ isDirty = true (because we updated Zustand) ✓
└─ Positions persisted to backend ✓
```

## 📊 Comparison

| Aspect              | Before Fix            | After Fix             |
| ------------------- | --------------------- | --------------------- |
| Dragging smoothness | ✅ Smooth             | ✅ Smooth             |
| History pollution   | ✅ Clean (1 snapshot) | ✅ Clean (1 snapshot) |
| Positions saved     | ❌ **NOT SAVED**      | ✅ **SAVED**          |
| isDirty flag        | ❌ Not set            | ✅ Set correctly      |
| Save button         | ❌ Positions wrong    | ✅ Positions correct  |
| Undo/Redo           | ✅ Works              | ✅ Works              |
| Performance         | ✅ Fast               | ✅ Fast               |

## 🧪 Testing

### Test Case 1: Single Node Drag

```
1. Drag a node to new position
2. Check isDirty flag → Should be TRUE ✓
3. Click Save
4. Reload page
5. Node should be at new position ✓
```

### Test Case 2: Multiple Node Drag

```
1. Select multiple nodes
2. Drag selection to new position
3. Check isDirty flag → Should be TRUE ✓
4. Click Save
5. Reload page
6. All nodes should be at new positions ✓
```

### Test Case 3: Undo After Drag

```
1. Note original positions
2. Drag node(s) to new position
3. Press Ctrl+Z
4. Nodes should return to original positions ✓
5. isDirty should still be TRUE (because undo changes state) ✓
```

### Test Case 4: Drag Without Save

```
1. Drag node to new position
2. isDirty = TRUE ✓
3. Reload page without saving
4. Node returns to original position ✓
```

## 💡 Why This Works

### The Key Insight

We separate two concerns:

1. **Visual updates** - React Flow handles during drag (fast, no Zustand)
2. **State persistence** - Zustand handles after drag completes (marks dirty)

### The Timing Strategy

```
BEFORE drag: Take history snapshot (for undo)
DURING drag: Let React Flow do its thing (smooth)
AFTER drag:  Sync to Zustand (set isDirty)
```

This gives us:

- Fast dragging (no store updates during drag)
- Clean history (one snapshot per drag)
- Correct saving (final positions synced)
- Proper dirty tracking (isDirty set)

## 🎯 Success Criteria

All requirements met:

- [x] Dragging is smooth (no lag)
- [x] Undo/redo has clean history (1 snapshot per drag)
- [x] Positions are saved correctly
- [x] isDirty flag is set
- [x] Save button works
- [x] Undo/redo works
- [x] No performance regressions

## 🚀 Summary

**Problem:** Positions not saving after drag optimization
**Root Cause:** No Zustand update meant no isDirty flag
**Solution:** Sync React Flow → Zustand AFTER drag completes
**Result:** Best of both worlds - smooth drag + correct save

**Status: ✅ FIXED**
