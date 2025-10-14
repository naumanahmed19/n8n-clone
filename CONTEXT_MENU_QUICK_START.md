# Context Menu Enhancements - Quick Reference

## 🎯 What's New

### Node Context Menu (Right-click a node)

- ✅ **Copy** - Copy selected node(s)
- ✅ **Cut** - Cut selected node(s)
- ✅ **Paste** - Paste nodes from clipboard

### Canvas Context Menu (Right-click canvas)

- ✅ **Select All** - Select all workflow nodes
- ✅ **Copy** - Copy selected nodes
- ✅ **Cut** - Cut selected nodes
- ✅ **Paste** - Paste nodes from clipboard

## 🖱️ How to Use

### Copy & Paste Nodes

```
1. Right-click node → Click "Copy"
2. Right-click canvas → Click "Paste"
3. Done! Node duplicated
```

### Select All Nodes

```
1. Right-click canvas → Click "Select All"
2. All nodes selected
3. Now copy/cut/paste as needed
```

### Cut & Move Nodes

```
1. Select nodes → Right-click → "Cut"
2. Right-click new location → "Paste"
3. Nodes moved!
```

## ⌨️ Keyboard Shortcuts

Still work as before:

- `Ctrl/Cmd+A` - Select All
- `Ctrl/Cmd+C` - Copy
- `Ctrl/Cmd+X` - Cut
- `Ctrl/Cmd+V` - Paste

Context menu = Mouse alternative! Both work the same.

## 💡 Smart Features

- **Auto-disable**: Options disabled when not applicable
  - Copy/Cut: Disabled when nothing selected
  - Paste: Disabled when clipboard empty
- **Read-only safe**: Clipboard operations disabled in read-only mode

- **Visual feedback**: Icons show what each option does
  - 📋 Copy
  - ✂️ Cut
  - 📌 Paste
  - 🖱️ Select All

## 🎨 Menu Layout

### Node Menu

```
Properties
Execute Node
───────────
Lock/Unlock Node
───────────
Duplicate
Copy      ← NEW
Cut       ← NEW
Paste     ← NEW
───────────
Delete
```

### Canvas Menu

```
Save Workflow
Import/Export
───────────
Undo
Redo
───────────
Select All ← NEW
Copy       ← NEW
Cut        ← NEW
Paste      ← NEW
───────────
Activate Workflow
...
```

## ✨ Benefits

✅ **Easier for new users** - Discoverable without memorizing shortcuts
✅ **Mouse-only friendly** - No keyboard needed
✅ **Consistent UX** - Standard right-click pattern
✅ **Quick access** - Operations at your fingertips

## 📝 Files Changed

- `stores/copyPaste.ts` - New store for sharing functions
- `hooks/workflow/useCopyPaste.ts` - Updated to use store
- `components/workflow/components/NodeContextMenu.tsx` - Added options
- `components/workflow/WorkflowCanvasContextMenu.tsx` - Added options
- `components/workflow/nodes/BaseNodeWrapper.tsx` - Wired up store

## 🚀 Try It Now!

1. Right-click any node or canvas
2. See the new options
3. Try copying/pasting/selecting!

It just works! 🎉
