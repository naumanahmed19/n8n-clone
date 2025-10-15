# Edge Buttons - shadcn UI Styling Upgrade

## Overview
Updated the connection edge buttons (Add Node and Delete Connection) to match the modern shadcn UI styling of our WorkflowControls, creating a consistent visual design across the canvas.

## Changes Made

### File: `frontend/src/components/workflow/edges/EdgeButton.tsx`

#### Before:
```tsx
// Old styling - inconsistent with controls
<div className="nodrag nopan pointer-events-auto absolute flex gap-1">
  <Button
    variant="secondary"
    className="border h-6 w-6 rounded-xl hover:bg-card shadow-sm"
  >
    +
  </Button>
  <Button
    variant="destructive"
    className="h-6 w-6 rounded-xl shadow-sm"
  >
    <Trash2 />
  </Button>
</div>
```

#### After:
```tsx
// New styling - matches WorkflowControls aesthetic
<div
  className="nodrag nopan pointer-events-auto absolute flex items-center gap-1 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border border-border/40 rounded-lg p-1 shadow-sm"
>
  <Button
    variant="ghost"
    className="h-6 w-6 rounded-md hover:bg-accent/50"
    title="Add node"
  >
    <Plus className="h-3.5 w-3.5" />
  </Button>
  <div className="w-px h-4 bg-border/40" />
  <Button
    variant="ghost"
    className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive"
    title="Delete connection"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
```

## Design Improvements

### 1. **Container Styling**
- ✅ **Background**: `bg-card/95` with backdrop blur (glassmorphism effect)
- ✅ **Border**: Subtle `border-border/40` for definition
- ✅ **Rounded**: `rounded-lg` for modern appearance
- ✅ **Padding**: `p-1` for proper spacing
- ✅ **Shadow**: `shadow-sm` for depth

### 2. **Button Updates**
- ✅ **Variant**: Changed from `secondary`/`destructive` to `ghost` for subtlety
- ✅ **Size**: Consistent `h-6 w-6`
- ✅ **Rounded**: `rounded-md` instead of `rounded-xl`
- ✅ **Icons**: Proper Lucide icons (`Plus`, `Trash2`) at `h-3.5 w-3.5`
- ✅ **Hover States**: 
  - Add button: `hover:bg-accent/50` (subtle highlight)
  - Delete button: `hover:bg-destructive/10 hover:text-destructive` (red on hover)
- ✅ **Tooltips**: Added `title` attributes for accessibility

### 3. **Visual Separator**
- ✅ Added divider between buttons: `<div className="w-px h-4 bg-border/40" />`
- ✅ Creates clear visual separation
- ✅ Matches WorkflowControls separator style

## Visual Consistency

### Now Matches:
- ✅ **WorkflowControls** - Same glassmorphism background
- ✅ **Control Buttons** - Same ghost variant and hover states
- ✅ **Icon Sizing** - Consistent h-3.5 w-3.5 dimensions
- ✅ **Border Styling** - Same border-border/40 opacity
- ✅ **Shadow Depth** - Same shadow-sm
- ✅ **Rounded Corners** - Same rounded-lg for containers

## Benefits

### User Experience
- **Visual Cohesion**: Edge buttons now feel part of the same design system
- **Better Readability**: Glassmorphism background makes buttons stand out over connections
- **Clear Actions**: Proper icons (Plus for add) more intuitive than "+" text
- **Hover Feedback**: Destructive hover state clearly indicates delete action

### Technical
- **CSS Variables**: Uses shadcn theme variables for dark mode support
- **Backdrop Blur**: Modern glassmorphism effect
- **Accessibility**: Added title attributes for tooltips
- **Consistent Sizing**: All buttons and icons use same dimensions

## Before vs After

### Before:
- Plain secondary button with "+" text
- Bright red destructive button
- Rounded-xl (too rounded)
- No container background
- Inconsistent with other controls

### After:
- Professional glassmorphism container
- Ghost buttons with subtle hover states
- Proper Plus icon instead of text
- Visual separator between buttons
- Matches WorkflowControls exactly
- Tooltips for better UX

## Dark Mode Support

All styling uses CSS variables from shadcn theme:
- `bg-card` - Adapts to theme
- `border-border` - Theme-aware borders
- `bg-accent` - Theme accent colors
- `bg-destructive` - Theme destructive colors
- Backdrop blur works in both themes

## Testing

✅ Hover over connection
✅ Verify buttons appear in glassmorphism container
✅ Test Add button - opens node dialog
✅ Test Delete button - removes connection
✅ Check hover states (accent for add, red for delete)
✅ Verify tooltips appear
✅ Test in dark mode
✅ Verify buttons hidden in read-only mode

## Related Components

- **WorkflowControls** - Main canvas controls (same styling)
- **WorkflowControlButton** - Reusable button component
- **NodeHandles** - Output handle Plus button (separate styling)
- **WorkflowEdge** - Displays EdgeButton on hover

## Future Enhancements

Possible improvements:
- [ ] Use WorkflowControlButton component for consistency
- [ ] Add keyboard shortcuts (A for add, Delete for remove)
- [ ] Animate button appearance
- [ ] Add confirmation for delete
- [ ] Show connection info on hover

## Files Modified

1. `frontend/src/components/workflow/edges/EdgeButton.tsx` - Complete styling overhaul

## CSS Classes Used

### Container:
- `bg-card/95` - Semi-transparent card background
- `backdrop-blur` - Blur effect
- `supports-[backdrop-filter]:bg-card/60` - Enhanced transparency when supported
- `border border-border/40` - Subtle border
- `rounded-lg` - Large rounded corners
- `p-1` - Small padding
- `shadow-sm` - Small shadow

### Buttons:
- `variant="ghost"` - Subtle button style
- `h-6 w-6` - Consistent size
- `rounded-md` - Medium rounded corners
- `hover:bg-accent/50` - Add button hover
- `hover:bg-destructive/10 hover:text-destructive` - Delete button hover

### Separator:
- `w-px` - 1px width
- `h-4` - 16px height
- `bg-border/40` - Subtle separator color
