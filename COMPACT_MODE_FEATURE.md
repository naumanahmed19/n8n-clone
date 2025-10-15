# Compact Mode Feature - Node Title Hide/Show

## Overview
Added a **Compact Mode** feature that hides node titles to create a cleaner, more icon-focused canvas view. This is useful for workflows with many nodes where space is limited.

## Features
- ✅ Toggle compact mode on/off from canvas context menu
- ✅ Hides node labels/titles when **collapsed** in compact mode
- ✅ **Shows titles when expanded** - Even in compact mode, expanded nodes show full titles
- ✅ **Reduces node size** - Collapsed nodes shrink from 180px to 80px width
- ✅ **Reduces padding** - Padding changes from p-3 to p-2 when collapsed
- ✅ **Removes gaps** - Gap between icon and content removed when collapsed
- ✅ **Smaller expand/collapse button** - Compact button (h-6) with smaller icon
- ✅ Keeps node icons visible for identification
- ✅ Persists preference to localStorage and database
- ✅ Works across all node types (BaseNodeWrapper, NodeHeader)
- ✅ Smooth UI updates without page refresh

## Implementation Details

### 1. Store Updates
**File**: `frontend/src/stores/reactFlowUI.ts`

Added compact mode state management:
```typescript
interface ReactFlowUIState {
  // ... existing state
  compactMode: boolean;
  
  // ... existing methods
  toggleCompactMode: () => void;
  setCompactMode: (compact: boolean) => void;
}
```

Initial state:
```typescript
compactMode: false,  // Default: show titles
```

Persistence in localStorage and database via existing preference system.

### 2. Service Types Update
**File**: `frontend/src/services/user.ts`

Updated user preferences interface:
```typescript
export interface UserPreferences {
  canvas?: {
    // ... existing properties
    compactMode?: boolean;
  };
}
```

### 3. NodeHeader Component
**File**: `frontend/src/components/workflow/components/NodeHeader.tsx`

Conditionally renders title and adjusts sizing based on compact mode and expansion state:
```tsx
export const NodeHeader = memo(function NodeHeader({...}) {
  const { compactMode } = useReactFlowUIStore()
  
  return (
    <div className={`flex items-center justify-between ${compactMode && !isExpanded ? 'p-2' : 'p-3'} ${showBorder ? 'border-b border-border' : ''}`}>
      <div className={`flex items-center ${compactMode && !isExpanded ? 'gap-0' : 'gap-2'} flex-1 min-w-0`}>
        {icon && <NodeIcon {...} />}
        
        {/* Title hidden ONLY when compact AND collapsed */}
        {(!compactMode || isExpanded) && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate">{label}</span>
            {headerInfo && <span className="text-xs text-muted-foreground truncate">{headerInfo}</span>}
          </div>
        )}
      </div>
      
      {/* Expand button always visible if node can expand */}
      {canExpand && onToggleExpand && (
        <Button className={`${compactMode ? 'h-6 w-6' : 'h-8 w-8'} p-0 flex-shrink-0`}>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      )}
    </div>
  )
})
```

**Key Changes**:
- Padding: `p-3` → `p-2` **only when compact AND collapsed**
- Gap: `gap-2` → `gap-0` **only when compact AND collapsed**
- Title: Hidden **only when compact AND collapsed**, shown when expanded
- Expand button: Smaller in compact mode (h-6 vs h-8), always visible if node can expand

### 4. BaseNodeWrapper Component
**File**: `frontend/src/components/workflow/nodes/BaseNodeWrapper.tsx`

Adjusts node width and padding based on compact mode:
```tsx
export function BaseNodeWrapper({...}) {
  const { compactMode } = useReactFlowUIStore()
  
  // Dynamic width calculation
  const effectiveCollapsedWidth = compactMode ? '80px' : collapsedWidth
  const effectiveExpandedWidth = compactMode ? '280px' : expandedWidth
  
  // In collapsed view with nodeConfig:
  {nodeConfig ? (
    <div className={`flex items-center ${compactMode ? 'gap-0 p-2' : 'gap-2 p-3'}`}>
      <NodeIcon config={nodeConfig} isExecuting={...} />
      {!compactMode && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{data.label}</span>
        </div>
      )}
    </div>
  ) : (
    <NodeHeader label={data.label} {...} />
  )}
}
```

**Key Changes**:
- Collapsed width: `180px` → `80px` in compact mode
- Expanded width: `320px` → `280px` in compact mode
- Padding: `p-3` → `p-2` in compact mode
- Gap: `gap-2` → `gap-0` in compact mode

### 5. Context Menu Integration
**File**: `frontend/src/components/workflow/WorkflowCanvasContextMenu.tsx`

Added toggle in Canvas View submenu:
```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger>
    <Eye className="mr-2 h-4 w-4" />
    Canvas View
  </ContextMenuSubTrigger>
  <ContextMenuSubContent>
    {/* ... existing view options */}
    
    <ContextMenuSeparator />
    <ContextMenuItem onClick={toggleCompactMode}>
      {compactMode ? (
        <>
          <Maximize className="mr-2 h-4 w-4" />
          Show Node Titles
        </>
      ) : (
        <>
          <Minimize2 className="mr-2 h-4 w-4" />
          Compact Mode
        </>
      )}
    </ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>
```

## Usage

### For Users:

1. **Enable Compact Mode**:
   - Right-click on canvas
   - Navigate to "Canvas View" submenu
   - Click "Compact Mode"
   - Collapsed nodes will shrink to icon-only (80px wide)
   - **Expand any node to see its full title and details**

2. **Working with Compact Nodes**:
   - **Collapsed nodes**: Show only icon (minimal size)
   - **Expanded nodes**: Show full title and content (even in compact mode)
   - Click expand button (chevron) to see details
   - Expanded nodes use normal width (280px) for readability

3. **Disable Compact Mode**:
   - Right-click on canvas
   - Navigate to "Canvas View" submenu  
   - Click "Show Node Titles"
   - All nodes return to normal size with visible titles

4. **Preference Persistence**:
   - Setting is automatically saved
   - Persists across browser sessions
   - Syncs to user account database

### For Developers:

Access compact mode state anywhere:
```typescript
import { useReactFlowUIStore } from '@/stores'

function MyComponent() {
  const { compactMode, toggleCompactMode } = useReactFlowUIStore()
  
  return (
    <div>
      {!compactMode && <span>This text is hidden in compact mode</span>}
      <button onClick={toggleCompactMode}>Toggle</button>
    </div>
  )
}
```

## Benefits

### Space Efficiency
- **55% smaller nodes** - From 180px to 80px width
- More nodes visible on screen (2-3x more)
- Reduced visual clutter
- Perfect for large, complex workflows
- Better for dense node arrangements

### Visual Clarity
- Icon-focused design
- Cleaner, more minimal aesthetic
- Matches modern UI patterns (like Figma)
- Easier to scan workflow structure

### Performance
- Smaller DOM footprint
- Less rendering overhead
- Faster canvas interactions

### User Control
- Easy toggle via context menu
- Preference persists
- No data loss (just hidden)

## Technical Notes

### Performance
- No additional re-renders
- Uses existing Zustand store infrastructure
- Debounced preference saves (1 second)

### Compatibility
- Works with all node types
- Compatible with existing features:
  - Expand/collapse functionality
  - Node execution states
  - Selection states
  - Drag and drop

### Styling Consistency
- Maintains node border styling
- Keeps hover effects
- Preserves icon visibility
- Expand/collapse buttons still work

## Future Enhancements

Possible improvements:
- [ ] Keyboard shortcut for toggle (e.g., Ctrl+Shift+T)
- [ ] Option to show titles on hover
- [ ] Per-node compact mode override
- [ ] Adjust node width in compact mode
- [ ] Show abbreviated titles (first letter)

## Files Modified

1. `frontend/src/stores/reactFlowUI.ts` - Added compact mode state
2. `frontend/src/services/user.ts` - Updated preferences interface
3. `frontend/src/components/workflow/components/NodeHeader.tsx` - Conditional title rendering
4. `frontend/src/components/workflow/nodes/BaseNodeWrapper.tsx` - Compact mode support
5. `frontend/src/components/workflow/WorkflowCanvasContextMenu.tsx` - Toggle menu item

## Testing Checklist

- [x] Toggle compact mode on/off
- [x] Verify titles disappear in compact mode
- [x] Verify icons remain visible
- [x] Test with different node types
- [x] Verify preference persists on reload
- [x] Test expand/collapse still works
- [x] Test with selected nodes
- [x] Test with executing nodes
- [x] Check dark mode compatibility

## Related Features

- **WorkflowControls**: Modern canvas controls with shadcn styling
- **Node Styling**: Subtle borders and modern aesthetic
- **Canvas Context Menu**: View settings and preferences
- **User Preferences**: Persistent settings system
