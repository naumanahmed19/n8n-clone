# Copy/Paste/Cut Implementation

## Overview

Implemented copy/paste/cut functionality for workflow nodes based on React Flow Pro example. Users can now duplicate nodes and their connections easily.

## Features

### ✅ Keyboard Shortcuts (Auto-enabled)

- **Copy**: `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac)
  - Copies selected nodes and their internal connections
  - Preserves node data and configuration
- **Cut**: `Ctrl+X` (Windows/Linux) or `Cmd+X` (Mac)
  - Copies selected nodes and removes them from canvas
  - Adds to undo history
- **Paste**: `Ctrl+V` (Windows/Linux) or `Cmd+V` (Mac)
  - Pastes at current mouse position
  - Creates new unique IDs for nodes
  - Maintains relative positions
  - Automatically selects pasted nodes

### 📋 How It Works

#### Copy Flow

1. User selects one or more nodes
2. Presses `Ctrl/Cmd+C`
3. Selected nodes + their internal edges are buffered
4. Original nodes remain on canvas

#### Cut Flow

1. User selects one or more nodes
2. Presses `Ctrl/Cmd+X`
3. Selected nodes + edges are buffered
4. **Saves to history** (for undo)
5. Original nodes are removed from canvas

#### Paste Flow

1. User presses `Ctrl/Cmd+V`
2. Hook finds mouse position on canvas
3. Calculates relative positions (top-left corner as reference)
4. Creates new nodes with timestamp-based IDs
5. Updates edge connections to new node IDs
6. **Saves to history** (for undo)
7. Deselects all existing nodes
8. Selects newly pasted nodes

## Technical Details

### File: `frontend/src/hooks/workflow/useCopyPaste.ts`

```typescript
export function useCopyPaste() {
  const mousePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const [bufferedNodes, setBufferedNodes] = useState<Node[]>([]);
  const [bufferedEdges, setBufferedEdges] = useState<Edge[]>([]);

  return {
    cut, // Copies and removes
    copy, // Copies to buffer
    paste, // Pastes at mouse position
    canCopy, // Boolean - has selected nodes
    canPaste, // Boolean - has buffered nodes
  };
}
```

### Key Implementation Points

#### 1. Mouse Position Tracking

```typescript
useEffect(() => {
  const onMouseMove = (event: MouseEvent) => {
    mousePosRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };
  rfDomNode.addEventListener("mousemove", onMouseMove);
}, [rfDomNode]);
```

#### 2. Internal Edge Detection

Only copies edges where **both** source and target are selected:

```typescript
const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
  (edge) => {
    const isSourceSelected = selectedNodes.some((n) => n.id === edge.source);
    const isTargetSelected = selectedNodes.some((n) => n.id === edge.target);
    return isSourceSelected && isTargetSelected;
  }
);
```

#### 3. Unique ID Generation

Uses timestamp to ensure unique IDs on paste:

```typescript
const now = Date.now();
const newNodes = bufferedNodes.map((node) => ({
  ...node,
  id: `${node.id}-${now}`,
  position: {
    x: pasteX + (node.position.x - minX),
    y: pasteY + (node.position.y - minY),
  },
}));
```

#### 4. Relative Position Preservation

Finds top-left corner of selection, uses as offset:

```typescript
const minX = Math.min(...bufferedNodes.map((node) => node.position.x));
const minY = Math.min(...bufferedNodes.map((node) => node.position.y));
// Paste maintains relative distances between nodes
```

#### 5. Smart Copy Detection

Respects text selection on page:

```typescript
function useShortcut(keyCode, callback, isCopyAction = false) {
  const selection = window.getSelection()?.toString();
  const allowCopy = isCopyAction ? !selection : true;
  // Only intercept copy if no text is selected
}
```

## Integration in WorkflowEditor

### Automatic Activation

```typescript
const { cut, copy, paste, canCopy, canPaste } = useCopyPaste();

// Keyboard shortcuts are automatically registered!
// No additional setup needed
```

### Optional UI Buttons (Future Enhancement)

```tsx
<Button onClick={copy} disabled={!canCopy}>
  📋 Copy
</Button>
<Button onClick={cut} disabled={!canCopy}>
  ✂️ Cut
</Button>
<Button onClick={paste} disabled={!canPaste}>
  📌 Paste
</Button>
```

## User Experience

### Scenarios

#### Scenario 1: Duplicate a Single Node

1. Click a node to select it
2. Press `Ctrl/Cmd+C`
3. Move mouse to desired location
4. Press `Ctrl/Cmd+V`
5. Node is duplicated at mouse position

#### Scenario 2: Duplicate Multiple Connected Nodes

1. Select multiple nodes (drag selection box or Shift+Click)
2. Press `Ctrl/Cmd+C`
3. Move mouse to new location
4. Press `Ctrl/Cmd+V`
5. All nodes and their internal connections are duplicated
6. Relative positions are maintained

#### Scenario 3: Move Nodes via Cut/Paste

1. Select nodes to move
2. Press `Ctrl/Cmd+X` (cut)
3. Original nodes disappear
4. Move mouse to new location
5. Press `Ctrl/Cmd+V` (paste)
6. Nodes appear at new location
7. Can undo to restore original positions

#### Scenario 4: Paste Multiple Times

1. Copy nodes once
2. Paste at location 1
3. Paste at location 2
4. Paste at location 3
5. Creates 3 separate copies

## Undo/Redo Integration

### History Snapshots

- **Cut**: Saves snapshot before removing nodes
- **Paste**: Saves snapshot before adding nodes
- **Copy**: No history snapshot (non-destructive)

### Undo Behavior

```typescript
// After cutting nodes
Ctrl/Cmd+Z → Restores cut nodes to original positions

// After pasting nodes
Ctrl/Cmd+Z → Removes pasted nodes
Ctrl/Cmd+Z again → Restores previous state
```

## Edge Cases Handled

### ✅ No Nodes Selected

- Copy/Cut do nothing, log message
- User can safely press shortcuts without side effects

### ✅ Text Selected on Page

- Copy respects text selection
- Only intercepts if no text is selected
- Preserves default browser copy behavior

### ✅ Input Fields Active

- `actInsideInputWithModifier: false` prevents shortcuts in inputs
- Users can type in node configs without triggering copy/paste

### ✅ External Edges Not Copied

- Only copies edges where both nodes are selected
- Prevents broken connections after paste

### ✅ Multiple Paste Operations

- Each paste creates unique IDs
- Can paste same nodes multiple times
- No ID conflicts

## Performance

### Optimizations

1. **Memoized Callbacks**: `useCallback` prevents recreating functions
2. **Ref for Mouse Position**: No re-renders on mouse move
3. **Minimal Buffer State**: Only stores copied data, not entire graph
4. **Efficient Filtering**: Single pass to find internal edges

### Complexity

- **Copy**: O(n + m) where n=nodes, m=edges
- **Paste**: O(n + m) to create new nodes/edges
- **Cut**: O(n + m) to copy + filter

## Testing Checklist

- [ ] Copy single node → paste → verify new node created
- [ ] Copy multiple nodes → paste → verify all nodes created
- [ ] Copy nodes with connections → paste → verify connections preserved
- [ ] Cut nodes → verify removed from canvas
- [ ] Cut nodes → undo → verify restored
- [ ] Paste → undo → verify pasted nodes removed
- [ ] Paste multiple times → verify unique IDs each time
- [ ] Copy with text selected → verify text copy works
- [ ] Copy in input field → verify input copy works
- [ ] Copy nodes → paste at different positions → verify relative positions maintained

## Future Enhancements

### Optional Context Menu

```typescript
// Right-click menu options
onContextMenu={(event) => {
  showMenu([
    { label: 'Copy', onClick: copy, disabled: !canCopy },
    { label: 'Cut', onClick: cut, disabled: !canCopy },
    { label: 'Paste', onClick: paste, disabled: !canPaste },
  ]);
}}
```

### Duplicate Command

```typescript
// Cmd+D to duplicate in place (copy + paste)
const duplicate = useCallback(() => {
  copy();
  paste({ x: position.x + 50, y: position.y + 50 });
}, [copy, paste]);
```

### Clipboard API Integration

```typescript
// Copy to system clipboard as JSON
navigator.clipboard.writeText(JSON.stringify(bufferedNodes));
```

## Comparison with React Flow Pro Example

### Similarities ✅

- Same keyboard shortcuts
- Same mouse position tracking
- Same buffer approach
- Same ID generation strategy
- Same edge filtering logic

### Adaptations for n8n-clone

- ✅ Integrated with Zustand store
- ✅ Added `saveToHistory` calls for undo/redo
- ✅ Exported `canCopy` and `canPaste` state
- ✅ Added detailed logging for debugging
- ✅ TypeScript types matching our codebase

## Related Files

- `frontend/src/hooks/workflow/useCopyPaste.ts` - Main implementation
- `frontend/src/hooks/workflow/index.ts` - Hook export
- `frontend/src/components/workflow/WorkflowEditor.tsx` - Integration
- `copy-paste-pro-example/` - Reference implementation

## Console Logs

For debugging, the hook logs all operations:

```
📋 Copied 3 nodes and 2 edges
✂️ Cut 2 nodes and 1 edges
📌 Pasted 3 nodes and 2 edges
📋 No nodes selected to copy
```

## Summary

The copy/paste implementation provides a professional, intuitive experience for duplicating workflow nodes. It seamlessly integrates with our existing undo/redo system and follows React Flow Pro best practices. Users can work efficiently using familiar keyboard shortcuts while maintaining data integrity and connection relationships.
