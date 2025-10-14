# Copy/Paste Implementation Summary

## ✅ Completed Implementation

### Files Created/Modified

1. ✅ `frontend/src/hooks/workflow/useCopyPaste.ts` - Main hook (243 lines)
2. ✅ `frontend/src/hooks/workflow/index.ts` - Export added
3. ✅ `frontend/src/components/workflow/WorkflowEditor.tsx` - Integration
4. ✅ `COPY_PASTE_IMPLEMENTATION.md` - Full documentation
5. ✅ `COPY_PASTE_QUICK_START.md` - User guide

### Core Functionality

- ✅ Copy nodes: `Ctrl/Cmd+C`
- ✅ Cut nodes: `Ctrl/Cmd+X`
- ✅ Paste nodes: `Ctrl/Cmd+V`
- ✅ Mouse position tracking for paste location
- ✅ Internal edge detection and copying
- ✅ Unique ID generation for pasted nodes
- ✅ Relative position preservation
- ✅ Undo/redo integration
- ✅ Smart text selection detection
- ✅ Input field safety

### Key Features

#### 1. **Copy Selected Nodes**

```typescript
// Copies all selected nodes + internal connections
// Preserves all node data and configuration
const copy = useCallback(() => {
  const selectedNodes = getNodes().filter(node => node.selected);
  const selectedEdges = getConnectedEdges(selectedNodes, getEdges())
    .filter(edge => /* only internal edges */);
  setBufferedNodes(selectedNodes);
  setBufferedEdges(selectedEdges);
}, [getNodes, getEdges]);
```

#### 2. **Cut Nodes (Copy + Remove)**

```typescript
// Same as copy, but removes original nodes
// Saves to history for undo
const cut = useCallback(
  () => {
    // ... copy logic ...
    saveToHistory(`Cut ${selectedNodes.length} node(s)`);
    setNodes((nodes) => nodes.filter((node) => !node.selected));
    setEdges((edges) => edges.filter((edge) => !selectedEdges.includes(edge)));
  },
  [
    /* deps */
  ]
);
```

#### 3. **Paste at Mouse Position**

```typescript
// Pastes buffered nodes at current mouse position
// Creates unique IDs using timestamp
// Maintains relative positions between nodes
const paste = useCallback(
  (position?) => {
    const pastePosition = position || screenToFlowPosition(mousePosRef.current);
    const now = Date.now();
    const newNodes = bufferedNodes.map((node) => ({
      ...node,
      id: `${node.id}-${now}`,
      position: { x: pasteX + offset, y: pasteY + offset },
    }));
    // ... update edges, save history, add to canvas ...
  },
  [bufferedNodes, bufferedEdges]
);
```

#### 4. **Mouse Position Tracking**

```typescript
// Tracks mouse position without causing re-renders
useEffect(() => {
  const onMouseMove = (event: MouseEvent) => {
    mousePosRef.current = { x: event.clientX, y: event.clientY };
  };
  rfDomNode.addEventListener("mousemove", onMouseMove);
}, [rfDomNode]);
```

#### 5. **Internal Edge Detection**

```typescript
// Only copies edges where BOTH source and target are selected
const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
  (edge) => {
    const isSourceSelected = selectedNodes.some((n) => n.id === edge.source);
    const isTargetSelected = selectedNodes.some((n) => n.id === edge.target);
    return isSourceSelected && isTargetSelected;
  }
);
```

### Integration Pattern

```typescript
// WorkflowEditor.tsx
import { useCopyPaste } from "@/hooks/workflow";

export function WorkflowEditor() {
  // Automatically registers keyboard shortcuts!
  useCopyPaste();

  // That's it! Copy/paste now works.
}
```

### User Workflows

#### Workflow 1: Duplicate Single Node

```
1. Click node → Select
2. Ctrl+C → Copy
3. Move mouse → Position
4. Ctrl+V → Paste
✅ Node duplicated at new position
```

#### Workflow 2: Duplicate Multiple Connected Nodes

```
1. Drag selection box → Select multiple
2. Ctrl+C → Copy all
3. Move mouse → Position
4. Ctrl+V → Paste all
✅ All nodes + connections duplicated
✅ Relative positions maintained
```

#### Workflow 3: Move Nodes (Cut/Paste)

```
1. Select nodes → Select
2. Ctrl+X → Cut (remove original)
3. Move mouse → Position
4. Ctrl+V → Paste at new location
✅ Nodes moved to new position
✅ Can undo to restore
```

#### Workflow 4: Create Template Pattern

```
1. Build a pattern (e.g., HTTP + Transform + Save)
2. Ctrl+C → Copy pattern
3. Paste multiple times → Ctrl+V, Ctrl+V, Ctrl+V
✅ Same pattern duplicated multiple times
✅ Each copy has unique IDs
```

### Technical Highlights

#### Smart Paste Position

```typescript
// Uses top-left corner as reference point
const minX = Math.min(...bufferedNodes.map((node) => node.position.x));
const minY = Math.min(...bufferedNodes.map((node) => node.position.y));

// Paste maintains relative distances
const newPosition = {
  x: pasteX + (node.position.x - minX),
  y: pasteY + (node.position.y - minY),
};
```

#### Unique ID Generation

```typescript
// Timestamp ensures unique IDs
const now = Date.now();
const newId = `${originalId}-${now}`;

// Edge IDs and references updated
const newEdge = {
  id: `${edge.id}-${now}`,
  source: `${edge.source}-${now}`,
  target: `${edge.target}-${now}`,
};
```

#### Text Selection Respect

```typescript
// Only intercepts copy if no text is selected
function useShortcut(keyCode, callback, isCopyAction = false) {
  const selection = window.getSelection()?.toString();
  const allowCopy = isCopyAction ? !selection : true;
  if (shouldRun && !didRun && allowCopy) {
    callback();
  }
}
```

### Undo/Redo Integration

```typescript
// Cut saves history before removing
cut() {
  saveToHistory(`Cut ${selectedNodes.length} node(s)`);
  // ... remove nodes ...
}

// Paste saves history before adding
paste() {
  saveToHistory(`Paste ${newNodes.length} node(s)`);
  // ... add nodes ...
}

// Undo/Redo works seamlessly
Ctrl+Z → Undo paste/cut
Ctrl+Shift+Z → Redo paste/cut
```

### Edge Cases Handled

| Scenario              | Behavior                         |
| --------------------- | -------------------------------- |
| No nodes selected     | Copy/Cut do nothing, log message |
| Text selected on page | Copy respects text selection     |
| Active input field    | Shortcuts disabled in inputs     |
| External edges        | Not copied (only internal edges) |
| Paste empty buffer    | Does nothing, log message        |
| Multiple paste        | Each creates unique IDs          |

### Performance Characteristics

- **Copy**: O(n + m) where n=nodes, m=edges
- **Cut**: O(n + m) + store update
- **Paste**: O(n + m) + store update
- **Memory**: Only stores copied nodes/edges, not entire graph

### Testing Checklist

- [x] Copy single node → works
- [x] Copy multiple nodes → works
- [x] Copy with connections → connections preserved
- [x] Cut nodes → removes from canvas
- [x] Paste at mouse position → correct position
- [x] Paste multiple times → unique IDs each time
- [x] Undo cut → restores nodes
- [x] Undo paste → removes pasted nodes
- [x] Copy with text selected → text copy works
- [x] Copy in input field → input copy works

### Console Output Examples

```
📋 Copied 3 nodes and 2 edges
✂️ Cut 2 nodes and 1 edges
📌 Pasted 3 nodes and 2 edges
📋 No nodes selected to copy
📌 No nodes in buffer to paste
```

### Architecture Alignment

✅ **React Flow Pro Pattern**

- Same buffer approach
- Same keyboard shortcuts
- Same mouse position tracking
- Same edge filtering logic
- Same ID generation strategy

✅ **n8n-clone Integration**

- Zustand store integration
- History/undo integration
- TypeScript types
- Error handling
- Console logging

### Benefits

1. **Productivity** - Quickly duplicate common patterns
2. **Efficiency** - Keyboard-driven workflow
3. **Intuitive** - Familiar shortcuts (Ctrl+C/X/V)
4. **Reliable** - Based on React Flow Pro example
5. **Safe** - Respects text selection and inputs
6. **Undoable** - Full undo/redo support

### Related Files

```
frontend/src/hooks/workflow/
├── useCopyPaste.ts          ← New: Main implementation
├── useReactFlowInteractions.ts ← Existing: Node interactions
├── index.ts                 ← Updated: Export added

frontend/src/components/workflow/
├── WorkflowEditor.tsx       ← Updated: Hook integrated

docs/
├── COPY_PASTE_IMPLEMENTATION.md ← New: Full docs
├── COPY_PASTE_QUICK_START.md    ← New: User guide
└── COPY_PASTE_SUMMARY.md        ← This file
```

## 🎉 Ready to Use!

The copy/paste feature is now **fully implemented** and **automatically enabled**. Users can:

- Copy nodes with `Ctrl/Cmd+C`
- Cut nodes with `Ctrl/Cmd+X`
- Paste nodes with `Ctrl/Cmd+V`

No additional configuration needed - just use the shortcuts! 🚀

## Next Steps (Optional Enhancements)

1. **Context Menu** - Right-click copy/paste options
2. **Duplicate Command** - `Cmd+D` to duplicate in place
3. **UI Buttons** - Toolbar buttons for copy/paste
4. **Clipboard API** - Copy to system clipboard as JSON
5. **Paste Preview** - Show ghost nodes before pasting

## Summary

✅ **Complete** - All core functionality implemented
✅ **Tested** - Edge cases handled
✅ **Documented** - Full documentation provided
✅ **Integrated** - Works with undo/redo system
✅ **Professional** - Matches industry standards

**Status**: ✨ READY FOR USE ✨
