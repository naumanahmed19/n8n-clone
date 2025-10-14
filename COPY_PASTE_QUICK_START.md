# Copy/Paste Quick Reference

## 🎯 Feature Overview

Copy, cut, and paste workflow nodes with keyboard shortcuts - just like in any professional application!

## ⌨️ Keyboard Shortcuts

| Action    | Windows/Linux | Mac     | Description             |
| --------- | ------------- | ------- | ----------------------- |
| **Copy**  | `Ctrl+C`      | `Cmd+C` | Copy selected nodes     |
| **Cut**   | `Ctrl+X`      | `Cmd+X` | Cut selected nodes      |
| **Paste** | `Ctrl+V`      | `Cmd+V` | Paste at mouse position |

## ✅ What Gets Copied

When you copy/cut nodes:

- ✅ All selected nodes
- ✅ Node configuration and data
- ✅ **Internal connections** (edges between selected nodes)
- ❌ External connections (edges to unselected nodes)

## 📋 How to Use

### Copy Nodes

1. Select one or more nodes (click or drag selection box)
2. Press `Ctrl/Cmd+C`
3. Move mouse to desired location
4. Press `Ctrl/Cmd+V`
5. Nodes appear at mouse position!

### Cut Nodes (Move)

1. Select nodes to move
2. Press `Ctrl/Cmd+X`
3. Original nodes disappear
4. Move mouse to new location
5. Press `Ctrl/Cmd+V`
6. Nodes appear at new location

### Copy Multiple Times

1. Copy nodes once
2. Paste at multiple locations
3. Each paste creates unique copies

## 🔄 Undo/Redo Integration

- **Cut**: Can undo to restore original nodes
- **Paste**: Can undo to remove pasted nodes
- **Copy**: No history (non-destructive)

## 🎨 Features

✅ **Maintains Relative Positions** - Nodes stay in same layout
✅ **Preserves Connections** - Internal edges are copied
✅ **Smart Text Detection** - Won't interfere with text copy
✅ **Input Field Safe** - Works in inputs without triggering shortcuts
✅ **Unique IDs** - Each paste creates new unique node IDs
✅ **Auto-Selection** - Pasted nodes are automatically selected

## 🧪 Try It Out

1. Add a few nodes to your workflow
2. Connect them together
3. Select all nodes (Ctrl/Cmd+A or drag selection box)
4. Copy them (Ctrl/Cmd+C)
5. Move mouse to empty area
6. Paste (Ctrl/Cmd+V)
7. See the magic! ✨

## 🐛 Console Logs

Watch the browser console for feedback:

```
📋 Copied 3 nodes and 2 edges
✂️ Cut 2 nodes and 1 edges
📌 Pasted 3 nodes and 2 edges
```

## 📝 Implementation

- **Hook**: `frontend/src/hooks/workflow/useCopyPaste.ts`
- **Pattern**: React Flow Pro example
- **Integration**: `WorkflowEditor.tsx` - automatically enabled
- **Documentation**: `COPY_PASTE_IMPLEMENTATION.md`

## 🚀 That's It!

No configuration needed - just use the keyboard shortcuts and it works! 🎉
