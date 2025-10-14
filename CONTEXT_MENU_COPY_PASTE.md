# Context Menu Copy/Paste & Select All Implementation

## ✅ What Was Added

### 1. Node Context Menu (Right-click on a node)

Added copy/paste/cut options:

- **Copy** - Copy the selected node(s)
- **Cut** - Cut the selected node(s)
- **Paste** - Paste copied/cut nodes

### 2. Canvas Context Menu (Right-click on canvas)

Added selection and clipboard operations:

- **Select All** - Select all nodes in the workflow
- **Copy** - Copy selected nodes
- **Cut** - Cut selected nodes
- **Paste** - Paste copied/cut nodes

## 📁 Files Modified

### 1. **`frontend/src/stores/copyPaste.ts`** (NEW)

Created a Zustand store to share copy/paste functions across components:

```typescript
interface CopyPasteStore {
  copy: (() => void) | null;
  cut: (() => void) | null;
  paste: (() => void) | null;
  canCopy: boolean;
  canPaste: boolean;
  setCopyPasteFunctions: (functions) => void;
}
```

### 2. **`frontend/src/hooks/workflow/useCopyPaste.ts`**

Updated to store functions in the copy/paste store:

```typescript
useEffect(() => {
  setCopyPasteFunctions({
    copy,
    cut,
    paste,
    canCopy,
    canPaste,
  });
}, [copy, cut, paste, canCopy, canPaste, setCopyPasteFunctions]);
```

### 3. **`frontend/src/components/workflow/components/NodeContextMenu.tsx`**

Added new props and menu items:

```typescript
interface NodeContextMenuProps {
  // ... existing props ...
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  canCopy?: boolean;
  canPaste?: boolean;
}
```

Menu items added:

- Copy (with scissors icon)
- Cut (with scissors icon)
- Paste (with clipboard icon)

### 4. **`frontend/src/components/workflow/nodes/BaseNodeWrapper.tsx`**

- Import `useCopyPasteStore`
- Get copy/paste functions from store
- Pass functions to NodeContextMenu

```typescript
const { copy, cut, paste, canCopy, canPaste } = useCopyPasteStore()

<NodeContextMenu
  // ... existing props ...
  onCopy={copy || undefined}
  onCut={cut || undefined}
  onPaste={paste || undefined}
  canCopy={canCopy}
  canPaste={canPaste}
/>
```

### 5. **`frontend/src/components/workflow/WorkflowCanvasContextMenu.tsx`**

Added:

- `useReactFlow` hook for Select All functionality
- `useCopyPasteStore` for copy/paste functions
- New menu section with 4 operations

```typescript
// Select All handler
const handleSelectAll = useCallback(() => {
  const nodes = getNodes()
  setNodes(nodes.map(node => ({ ...node, selected: true })))
}, [getNodes, setNodes])

// Menu items
<ContextMenuItem onClick={handleSelectAll}>
  <MousePointerClick className="mr-2 h-4 w-4" />
  Select All
</ContextMenuItem>

<ContextMenuItem onClick={copy} disabled={!canCopy || readOnly}>
  <Copy className="mr-2 h-4 w-4" />
  Copy
</ContextMenuItem>

<ContextMenuItem onClick={cut} disabled={!canCopy || readOnly}>
  <Scissors className="mr-2 h-4 w-4" />
  Cut
</ContextMenuItem>

<ContextMenuItem onClick={paste} disabled={!canPaste || readOnly}>
  <Clipboard className="mr-2 h-4 w-4" />
  Paste
</ContextMenuItem>
```

### 6. **`frontend/src/stores/index.ts`**

Added export for new store:

```typescript
export * from "./copyPaste";
```

## 🎯 How It Works

### Architecture Flow

```
1. useCopyPaste hook (in WorkflowEditor)
   ↓
2. Creates copy/cut/paste functions
   ↓
3. Stores them in useCopyPasteStore
   ↓
4. Components access store:
   - BaseNodeWrapper (for node context menu)
   - WorkflowCanvasContextMenu (for canvas context menu)
   ↓
5. User right-clicks → Context menu shows options
   ↓
6. Click option → Calls function from store
```

### Store Pattern

Instead of prop drilling through multiple components, we use a Zustand store:

- **Hook**: `useCopyPaste` creates functions and stores them
- **Store**: `useCopyPasteStore` makes functions globally accessible
- **Consumers**: Any component can access via `useCopyPasteStore()`

### State Management

- `canCopy`: `true` when nodes are selected
- `canPaste`: `true` when clipboard has nodes
- Menu items are disabled when operations aren't available

## 🎨 User Experience

### Node Context Menu (Right-click on node)

```
┌─────────────────────┐
│ ⚙️  Properties      │
│ ▶️  Execute Node    │
├─────────────────────┤
│ 🔒 Lock/Unlock Node │
├─────────────────────┤
│ 📋 Duplicate        │  ← Existing
│ 📋 Copy             │  ← NEW
│ ✂️  Cut             │  ← NEW
│ 📌 Paste            │  ← NEW
├─────────────────────┤
│ 🗑️  Delete          │
└─────────────────────┘
```

### Canvas Context Menu (Right-click on canvas)

```
┌──────────────────────┐
│ 💾 Save Workflow     │
│ 📁 Import/Export     │
├──────────────────────┤
│ ↩️  Undo             │
│ ↪️  Redo             │
├──────────────────────┤
│ 🖱️  Select All       │  ← NEW
│ 📋 Copy             │  ← NEW
│ ✂️  Cut              │  ← NEW
│ 📌 Paste            │  ← NEW
├──────────────────────┤
│ ⚡ Activate Workflow │
│ ✓  Validate Workflow│
│ ...                  │
└──────────────────────┘
```

## 🎮 Usage Examples

### Example 1: Copy a Single Node via Context Menu

1. Right-click on a node
2. Click "Copy"
3. Right-click on empty canvas
4. Click "Paste"
5. Node is duplicated

### Example 2: Select All and Copy

1. Right-click on canvas
2. Click "Select All"
3. Right-click on canvas again
4. Click "Copy"
5. Right-click elsewhere
6. Click "Paste"
7. All nodes duplicated

### Example 3: Cut Nodes via Node Menu

1. Select multiple nodes (drag or Shift+Click)
2. Right-click on one selected node
3. Click "Cut"
4. Original nodes disappear
5. Right-click on canvas
6. Click "Paste"
7. Nodes appear at new location

## ⌨️ Keyboard Shortcuts Still Work

Context menu is complementary to keyboard shortcuts:

- **Keyboard**: `Ctrl/Cmd+C`, `Ctrl/Cmd+X`, `Ctrl/Cmd+V`
- **Mouse**: Right-click → Select from menu

Both methods work identically!

## 🔒 Read-Only Mode

All clipboard operations are disabled in read-only mode:

- Copy: Disabled
- Cut: Disabled
- Paste: Disabled
- Select All: Enabled (safe operation)

## ✨ Smart Disable States

Menu items are automatically disabled when:

- **Copy/Cut**: No nodes are selected (`canCopy === false`)
- **Paste**: Clipboard is empty (`canPaste === false`)
- **All**: Workflow is in read-only mode

## 🧪 Testing Checklist

- [x] Node context menu shows copy/cut/paste options
- [x] Canvas context menu shows select all/copy/cut/paste
- [x] Copy from node menu → works
- [x] Cut from node menu → works
- [x] Paste from canvas menu → works
- [x] Select All from canvas menu → works
- [x] Disabled states work correctly
- [x] Read-only mode disables operations
- [x] Keyboard shortcuts still work
- [x] Context menu and keyboard work together

## 💡 Benefits

### 1. **Discoverability**

- Users can find copy/paste without knowing keyboard shortcuts
- Context menus show what operations are available

### 2. **Accessibility**

- Mouse-only users can now copy/paste
- Keyboard-only users already had shortcuts

### 3. **Consistency**

- Standard UX pattern (right-click → context menu)
- Familiar to users from other applications

### 4. **Efficiency**

- Select All in one click
- Quick access to common operations

## 🚀 Summary

**Added 5 new context menu options:**

1. ✅ **Select All** (canvas menu)
2. ✅ **Copy** (both menus)
3. ✅ **Cut** (both menus)
4. ✅ **Paste** (both menus)
5. ✅ Smart disable states

**Works seamlessly with:**

- ✅ Keyboard shortcuts (Ctrl/Cmd+C/X/V)
- ✅ Undo/Redo system
- ✅ Read-only mode
- ✅ Multiple node selection

**No breaking changes** - all existing functionality preserved!
