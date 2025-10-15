# Node Tooltips in Compact Mode

## Overview

Added shadcn-style tooltips to workflow nodes when they're in compact mode. When compact mode is enabled and node titles are hidden, hovering over a node displays a tooltip below the node showing the full node title and any additional header information.

## User Experience

### When Tooltips Appear

- ✅ **Compact Mode ON** + **Node Collapsed**: Tooltip shows on hover
- ❌ **Compact Mode OFF**: No tooltip (title already visible)
- ❌ **Compact Mode ON** + **Node Expanded**: No tooltip (title visible when expanded)

### Tooltip Content

The tooltip displays:
1. **Node Title**: Bold font weight for emphasis
2. **Header Info** (if present): Secondary information in smaller, muted text

### Tooltip Position

- **Side**: `bottom` - Appears below the node
- **Alignment**: Centered under the node
- **Max Width**: `max-w-xs` - Prevents overly wide tooltips
- **Style**: Matches shadcn tooltip design system

## Implementation

### BaseNodeWrapper.tsx

The tooltip is implemented at the wrapper level, wrapping the entire collapsed node structure.

#### 1. **Added Tooltip Imports**

```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
```

#### 2. **Wrapped Collapsed Node Content**

The collapsed node content is now conditionally wrapped with a tooltip when in compact mode:

```typescript
// Compact view (collapsed)
if (!isExpanded) {
  const nodeContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {/* ... all node content ... */}
      </ContextMenuTrigger>
      
      <NodeContextMenu {...props} />
    </ContextMenu>
  )

  // Wrap with tooltip when in compact mode
  if (compactMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {nodeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium">{data.label}</p>
          {headerInfo && (
            <p className="text-xs text-muted-foreground">{headerInfo}</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return nodeContent
}
```

### Key Design Decisions

1. **Conditional Rendering**: Tooltip only applies when:
   - `compactMode === true`
   - Node is collapsed (`!isExpanded`)
   
2. **Content Extraction**: Node content is extracted to a variable first, then conditionally wrapped
   
3. **No Tooltip When Not Needed**: When node is expanded or compact mode is off, tooltip is not rendered (no unnecessary DOM elements)

4. **Bottom Placement**: Unlike sidebar tooltips that appear on the side, node tooltips appear below to avoid interfering with:
   - Node connections
   - Node toolbar
   - Other nearby nodes

5. **Uses Existing Data**: Tooltip content comes from existing props:
   - `data.label` - Node title
   - `headerInfo` - Optional secondary info

## Tooltip Styling

### Container
```tsx
<TooltipContent side="bottom" className="max-w-xs">
```

- **Position**: Below the node
- **Max Width**: 320px (max-w-xs)
- **Style**: Inherits shadcn tooltip styles (dark background, white text in light mode)

### Title
```tsx
<p className="font-medium">{data.label}</p>
```

- **Font Weight**: Medium (500)
- **Purpose**: Makes the node name stand out

### Header Info (Optional)
```tsx
{headerInfo && (
  <p className="text-xs text-muted-foreground">{headerInfo}</p>
)}
```

- **Size**: Extra small (text-xs)
- **Color**: Muted foreground color
- **Conditional**: Only shows if `headerInfo` exists

## Behavior Comparison

### Normal Mode (Compact OFF)
```
┌─────────────────┐
│ 📧 Send Email   │  ← Title visible
│ 3 recipients    │  ← Header info visible
└─────────────────┘
No tooltip needed
```

### Compact Mode (Collapsed)
```
┌──────┐
│  📧  │  ← Only icon visible
└──────┘
   ↓
 [Tooltip: "Send Email\n3 recipients"]  ← Shows on hover
```

### Compact Mode (Expanded)
```
┌─────────────────┐
│ 📧 Send Email   │  ← Title visible when expanded
│ 3 recipients    │  ← Header info visible
│                 │
│ [Node content]  │
└─────────────────┘
No tooltip (title already showing)
```

## Integration with Existing Features

### Works With:
- ✅ **Compact Mode Toggle**: Automatically activates/deactivates with compact mode
- ✅ **Node Expansion**: Tooltip disappears when node is expanded
- ✅ **Context Menu**: Right-click still works (tooltip doesn't interfere)
- ✅ **Node Toolbar**: Hover toolbar still appears above tooltip
- ✅ **Node Selection**: Selection highlighting works normally
- ✅ **Node Dragging**: Tooltip doesn't interfere with dragging
- ✅ **Node Connections**: Connection handles still work
- ✅ **All Node Types**: Works with all BaseNodeWrapper-based nodes

### Doesn't Interfere With:
- Node execution states (running, success, error)
- Node disabled state
- Node locked state
- Copy/paste operations
- Keyboard shortcuts
- Undo/redo functionality

## Accessibility

- **`asChild` Prop**: Used to merge TooltipTrigger with the actual node element (maintains semantic structure)
- **Non-Intrusive**: Only appears on hover, doesn't block interactions
- **Screen Readers**: Tooltip content is accessible via aria attributes (handled by shadcn)
- **Keyboard Navigation**: Tooltip appears on keyboard focus as well

## TooltipProvider Context

Tooltips rely on `TooltipProvider` being present in the component tree. This is already set up in `WorkflowEditorPage.tsx`:

```tsx
<TooltipProvider>
  <WorkflowEditor ... />
</TooltipProvider>
```

All nodes within the workflow canvas have access to the tooltip context.

## Performance Considerations

### Minimal Overhead
- Tooltip component only rendered when `compactMode === true`
- No additional state management
- Uses existing `compactMode` from store
- Leverages React's conditional rendering (no wasted renders)

### No Impact on Large Workflows
- Tooltips are lightweight shadcn components
- Only one tooltip visible at a time (on hover)
- No performance degradation with many nodes

## Example Use Cases

### 1. **Long Node Names**
When node names are truncated in regular mode, compact mode + tooltip provides full name on hover:

```
Normal: [📧 Send email to customer suc...]
Compact: [📧] → Hover → "Send email to customer success team"
```

### 2. **Nodes with Status Info**
Nodes showing counts or status information:

```
Normal: [🔄 Transform Data]
        [Processing 150 items]
Compact: [🔄] → Hover → "Transform Data\nProcessing 150 items"
```

### 3. **Dense Workflows**
In workflows with many nodes, compact mode saves space while tooltips maintain discoverability:

```
Before: 20 nodes visible with titles (uses lots of canvas space)
After: 40+ nodes visible as icons, hover to see names
```

## Files Modified

### `frontend/src/components/workflow/nodes/BaseNodeWrapper.tsx`

**Changes:**
1. Added Tooltip component imports
2. Extracted collapsed node content to variable
3. Added conditional tooltip wrapper when `compactMode === true`
4. Tooltip displays `data.label` and optional `headerInfo`
5. Positioned tooltip below node (`side="bottom"`)

**Lines Changed:** ~20 lines added for tooltip logic

**No Breaking Changes:** All existing functionality preserved

## Testing Checklist

- [x] ✅ Tooltip appears when hovering node in compact mode
- [x] ✅ Tooltip shows node title
- [x] ✅ Tooltip shows header info (when present)
- [x] ✅ Tooltip positioned below node
- [x] ✅ Tooltip doesn't appear when compact mode OFF
- [x] ✅ Tooltip doesn't appear when node expanded
- [x] ✅ Context menu still works
- [x] ✅ Node selection still works
- [x] ✅ Node dragging still works
- [x] ✅ Node connections still work
- [x] ✅ No console errors
- [x] ✅ Works with all node types
- [x] ✅ Tooltip disappears when not hovering
- [x] ✅ No performance issues

## Comparison with Sidebar Tooltips

### Similarities
- Same shadcn Tooltip component
- Same styling and animation
- Same delay behavior
- Same accessibility features

### Differences

| Feature | Sidebar Tooltips | Node Tooltips |
|---------|-----------------|---------------|
| **Position** | `side="right"` | `side="bottom"` |
| **When Active** | Sidebar collapsed | Compact mode ON |
| **Content** | Menu item label | Node title + info |
| **Context** | Navigation | Workflow canvas |
| **Conditional** | Sidebar state | Compact mode + collapsed |

## Future Enhancements

Potential improvements for future iterations:

1. **Rich Tooltip Content**
   - Show node type badge
   - Display last execution time
   - Show input/output count

2. **Tooltip Position Options**
   - User preference for tooltip position
   - Smart positioning to avoid canvas edges

3. **Tooltip Delay**
   - Configurable delay before showing
   - Faster for frequently hovered nodes

4. **Extended Info**
   - Show node description on longer hover
   - Display last execution result summary

5. **Keyboard Shortcut**
   - Show tooltip on keyboard focus
   - Keyboard shortcut to pin tooltip

## Related Features

- **Compact Mode** (COMPACT_MODE_FEATURE.md) - The mode that triggers tooltips
- **Node Header** (NodeHeader component) - Provides the hidden title
- **Workflow Controls** (WORKFLOW_CONTROLS_TOOLTIPS_UPDATE.md) - Control bar tooltips
- **Sidebar** (sidebar.tsx) - Similar tooltip pattern for collapsed sidebar

## Benefits Summary

### For Users
1. ✅ **Space Efficiency**: More nodes visible on screen
2. ✅ **Quick Reference**: Hover to see full node names
3. ✅ **No Context Loss**: Easy to identify nodes despite hidden titles
4. ✅ **Professional UX**: Matches sidebar and control tooltips
5. ✅ **Smooth Workflow**: Doesn't interrupt node interactions

### For Developers
1. ✅ **Reusable Pattern**: Same tooltip system as sidebar
2. ✅ **Clean Implementation**: Minimal code changes
3. ✅ **Maintainable**: Uses existing compactMode state
4. ✅ **No Side Effects**: Doesn't affect other node features
5. ✅ **Type Safe**: Fully typed with TypeScript
