# Group Node Customization Feature

## Overview
Added ability to customize group nodes with editable names and background colors. Users can now personalize groups to better organize and visually distinguish different sections of their workflows.

## Features

### 1. Edit Group Dialog
A dedicated dialog for editing group properties with:
- **Group Name**: Custom text label for the group
- **Background Color**: Visual customization with predefined palette or custom colors
- **Color Picker**: Built-in color selector with 10 predefined colors plus custom input

### 2. Group Properties Available for Customization

#### Name
- Display name for the group
- Shows at the top-left corner of the group
- Default: `Group {groupId}`
- Stored in: `WorkflowNode.name`

#### Background Color
- Semi-transparent background color for the group
- Predefined palette with 10 colors:
  - Blue (#dbeafe)
  - Green (#d1fae5)
  - Purple (#ede9fe)
  - Pink (#fce7f3)
  - Orange (#ffedd5)
  - Red (#fee2e2)
  - Yellow (#fef9c3)
  - Teal (#ccfbf1)
  - Indigo (#e0e7ff)
  - Gray (#f3f4f6)
- Custom color input (hex, rgb, or color picker)
- Stored in: `WorkflowNode.style.backgroundColor`

#### Border Color
- Solid border color for the group outline
- Same predefined palette with 10 colors (uses the main color value):
  - Blue (#3b82f6)
  - Green (#10b981)
  - Purple (#8b5cf6)
  - Pink (#ec4899)
  - Orange (#f97316)
  - Red (#ef4444)
  - Yellow (#eab308)
  - Teal (#14b8a6)
  - Indigo (#6366f1)
  - Gray (#6b7280)
- Custom color input (hex, rgb, or color picker)
- Stored in: `WorkflowNode.style.borderColor`

#### Size (via resize handles)
- Width and height
- Resizable via drag handles
- Stored in: `WorkflowNode.style.width` and `WorkflowNode.style.height`

## User Interface

### Context Menu
Right-click on a group node to access:
1. **Edit Group** - Opens edit dialog
2. **Ungroup** - Detaches all child nodes (only if group has children)
3. **Delete Group** - Removes group and detaches children

### Group Label
- Displayed at top-left corner of group
- Font: 14px, semi-bold
- Opacity: 0.7 (light mode), 0.8 (dark mode)
- Non-interactive (pointer-events: none)

### Edit Dialog Layout
```
┌─────────────────────────────────┐
│  Edit Group                     │
│  Customize the group's name     │
│  and appearance                 │
├─────────────────────────────────┤
│  📝 Group Name                  │
│  [Enter group name______]       │
│                                 │
│  🎨 Background Color            │
│  [Color Palette Grid]           │
│  Or enter a custom color        │
│  [#hexcode____] [🎨]            │
│  [Clear Background Color]       │
│                                 │
│  🎨 Border Color                │
│  [Border Color Palette Grid]    │
│  Or enter a custom border color │
│  [#hexcode____] [🎨]            │
│  [Clear Border Color]           │
├─────────────────────────────────┤
│          [Cancel] [Save Changes]│
└─────────────────────────────────┘
```

## Implementation Details

### Files Created

#### `frontend/src/components/workflow/GroupEditDialog.tsx`
Dialog component for editing group properties:
- Form inputs for name and color
- Predefined color palette grid
- Custom color input with native color picker
- Save/Cancel actions with undo/redo support

Key features:
- Loads current group data on open
- Validates and applies changes
- Integrates with workflow store
- Marks workflow as dirty on change
- Creates history snapshot for undo

### Files Modified

#### `frontend/src/components/workflow/nodes/GroupNode.tsx`
Enhanced group node component:
- Added Edit menu item to context menu
- Display group name label
- Integrated GroupEditDialog
- Reordered context menu for better UX

#### `frontend/src/components/workflow/reactflow-theme.css`
Added styles for group label:
```css
.group-node-label {
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  opacity: 0.7;
  pointer-events: none;
  user-select: none;
  z-index: 10;
}
```

### Data Structure

#### WorkflowNode Interface
```typescript
export interface WorkflowNode {
  id: string;
  type: string;
  name: string;  // ← Group name displayed
  // ... other fields
  style?: {
    width?: number;
    height?: number;
    backgroundColor?: string;  // ← Group background color
    [key: string]: any;
  };
}
```

## Usage Flow

### Editing a Group

1. **Open Dialog**
   - Right-click on group node
   - Select "Edit Group"

2. **Customize Name**
   - Type new name in text input
   - Leave empty to use default

3. **Choose Color**
   - **Background**: Click a predefined color swatch, OR
     - Enter custom hex/rgb value, OR
     - Use native color picker
     - Click "Clear Background Color" to remove
   - **Border**: Click a predefined border color swatch, OR
     - Enter custom hex/rgb value, OR
     - Use native color picker
     - Click "Clear Border Color" to remove

4. **Save Changes**
   - Click "Save Changes"
   - Changes are applied immediately
   - Workflow is marked as dirty
   - Undo/redo history is updated

### Visual Feedback

- **Group Label**: Always visible at top-left
- **Background Color**: Applied to entire group area
- **Selected State**: Border highlights on selection
- **Hover State**: Border appears on hover

## Technical Considerations

### State Management
- Group properties stored in Zustand workflow store
- Changes sync to React Flow nodes
- Undo/redo support via history snapshots
- Dirty state tracking for save indication

### Color Handling
- Light color variants used for backgrounds (better contrast)
- Main color values used for borders (more prominent)
- Custom colors validated and applied as-is
- Undefined backgroundColor/borderColor removes custom styling

### Performance
- Dialog only renders when open
- Group name computed from workflow store
- Memoized component to prevent unnecessary re-renders
- Efficient color palette rendering with grid layout

## Integration Points

### With Existing Features
- **Drag to Add**: New nodes inherit group membership
- **Resize**: Size changes preserved with color
- **Copy/Paste**: Group properties copied
- **Undo/Redo**: All changes are tracked
- **Save/Load**: Properties persist to database
- **Dark Mode**: Colors adapt to theme

### Workflow Store Methods Used
- `updateNode()` - Apply property changes
- `saveToHistory()` - Create undo snapshot
- `setDirty()` - Mark workflow as modified
- `workflow.nodes.find()` - Get current group data

## Future Enhancements

### Potential Additions
1. ~~**Border Color**: Separate color for group border~~ ✅ COMPLETED
2. **Border Style**: Dashed, dotted, solid options
3. **Border Width**: Adjustable border thickness
4. **Label Position**: Top, bottom, left, right options
5. **Label Styling**: Font size, weight, color
6. **Collapse/Expand**: Toggle child visibility
7. **Lock**: Prevent accidental changes
8. **Templates**: Save and reuse group styles
9. **Batch Edit**: Edit multiple groups at once
10. **Description**: Add group description/notes

### Keyboard Shortcuts
- `E` - Edit selected group
- `Delete` - Delete selected group
- `Ctrl+G` - Group selected nodes
- `Ctrl+Shift+G` - Ungroup selected group

## Testing Checklist

- ✅ Edit dialog opens from context menu
- ✅ Group name displays on node
- ✅ Name persists after save/reload
- ✅ Predefined background colors apply correctly
- ✅ Predefined border colors apply correctly
- ✅ Custom background color input works
- ✅ Custom border color input works
- ✅ Native color pickers work for both
- ✅ Clear background color removes styling
- ✅ Clear border color removes styling
- ✅ Changes trigger save button
- ✅ Undo/redo works for all changes
- ✅ Dialog closes on cancel
- ✅ Dialog closes on save
- ✅ Dark mode compatibility
- ✅ Label visibility on all backgrounds
- ✅ Border color visible with all backgrounds
- ✅ Properties persist to database

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Focus management in dialog
- ARIA labels for color buttons
- Screen reader friendly
- Color picker with keyboard input alternative
- High contrast label text

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Native color picker support
- Fallback to text input if color picker unavailable
- CSS custom properties for theming
- No IE11 support required
