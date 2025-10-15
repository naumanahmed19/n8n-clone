# React Flow Controls - shadcn UI Upgrade

## Overview

The React Flow controls have been upgraded to use shadcn UI styles for a consistent design language throughout the application. The custom `WorkflowControls` component replaces the default React Flow `Controls` component with a fully styled, accessible control panel.

## Changes Made

### 1. Created `WorkflowControls.tsx`

**Location:** `frontend/src/components/workflow/WorkflowControls.tsx`

**Purpose:** Custom controls component using shadcn UI design system

**Features:**

- ✅ Consistent styling with shadcn UI theme
- ✅ Automatic dark mode support via CSS variables
- ✅ Smooth hover transitions
- ✅ Focus-visible ring for accessibility
- ✅ Proper ARIA labels
- ✅ Support for custom control buttons
- ✅ Clean separation with vertical divider
- ✅ Figma-style horizontal layout, centered at bottom

**Components:**

1. **`WorkflowControls`** - Main container component

   - Displays add node button (primary colored)
   - Displays zoom out, zoom in, and fit view buttons (in that order)
   - Horizontal layout like Figma controls
   - Centered at bottom of canvas
   - Accepts children for custom control buttons
   - Fully customizable via className prop
   - Can hide add node button via showAddNode prop (for read-only mode)

2. **`WorkflowControlButton`** - Reusable button component
   - Consistent styling for custom controls
   - Accepts icon, title, and onClick handler
   - Used by `AddAnnotationControl`
   - Clean design with no borders, muted color on idle

### 2. Updated `AddAnnotationControl.tsx`

**Changes:**

- Replaced `ControlButton` from `@xyflow/react` with `WorkflowControlButton`
- Now uses consistent shadcn UI styling
- Properly sized icon with explicit className

### 3. Updated `WorkflowCanvas.tsx`

**Changes:**

- Replaced `Controls` import from `@xyflow/react` with `WorkflowControls`
- Updated JSX to use new component
- Removed dependency on default React Flow controls

### 4. Cleaned up `reactflow-theme.css`

**Changes:**

- Removed legacy dark mode styles for `.react-flow__controls`
- Added comment noting that custom controls now use shadcn UI
- Kept other React Flow component styles (MiniMap, edges, etc.)

## Design System Integration

### Color Variables Used

The controls use CSS variables from the shadcn theme:

```css
--card            /* Background of control panel */
--border          /* Border colors */
--background      /* Button backgrounds */
--foreground      /* Icon/text colors */
--accent          /* Hover state */
--ring            /* Focus ring */
```

### Styling Classes

All buttons use consistent Tailwind classes:

- `rounded-md` - Rounded corners
- `text-muted-foreground` - Subtle icon color when idle
- `hover:bg-accent` - Hover background effect
- `hover:text-accent-foreground` - Hover text color
- `focus-visible:ring-1` - Accessibility focus indicator
- `disabled:opacity-50` - Disabled state

Container uses:

- `flex items-center gap-1` - Horizontal layout with tight spacing
- `left-1/2 -translate-x-1/2` - Perfect centering
- `bottom-4` - Positioned at bottom with spacing
- `rounded-lg border bg-card shadow-lg` - Card-like appearance

## Benefits

1. **Consistency** - Controls now match the rest of the application's design
2. **Maintainability** - Single source of truth for button styles
3. **Accessibility** - Built-in focus indicators and ARIA labels
4. **Dark Mode** - Automatic theme support via CSS variables
5. **Extensibility** - Easy to add new custom controls
6. **Performance** - No need for additional CSS overrides
7. **Figma-like UX** - Centered horizontal controls for modern workflow editor feel
8. **Quick Access** - Add node button for instant node creation from center viewport

## Usage

### Basic Usage

```tsx
import { WorkflowControls } from "./WorkflowControls";

// In your component
{
  showControls && (
    <WorkflowControls showAddNode={!readOnly}>
      {/* Add custom controls here */}
    </WorkflowControls>
  );
}
```

### Adding Custom Controls

```tsx
import { WorkflowControlButton } from "./WorkflowControls";
import { MyIcon } from "lucide-react";

export function MyCustomControl() {
  const handleClick = () => {
    // Your logic here
  };

  return (
    <WorkflowControlButton
      onClick={handleClick}
      title="My Custom Action"
      icon={<MyIcon className="h-4 w-4" />}
    />
  );
}

// Then use it in WorkflowCanvas
<WorkflowControls>
  <MyCustomControl />
</WorkflowControls>;
```

## Visual Comparison

### Before (Default React Flow Controls)

- Generic styling
- Required CSS overrides for dark mode
- Inconsistent with app design
- Limited customization
- Vertical layout on left side

### After (Figma-Style shadcn UI Controls)

- Matches application design language
- Automatic dark mode support
- Consistent hover/focus states
- Easy to extend with custom controls
- Better accessibility
- Horizontal layout, centered at bottom
- Clean, borderless buttons with subtle icons
- Compact and unobtrusive

## File Structure

```
frontend/src/components/workflow/
├── WorkflowControls.tsx          ← New custom controls
├── AddAnnotationControl.tsx      ← Updated to use WorkflowControlButton
├── WorkflowCanvas.tsx            ← Uses WorkflowControls
└── reactflow-theme.css           ← Cleaned up legacy styles
```

## Testing

The controls have been tested for:

- ✅ Add node button (opens dialog at viewport center)
- ✅ Zoom in/out functionality
- ✅ Fit view functionality
- ✅ Custom control buttons (annotation)
- ✅ Dark mode switching
- ✅ Hover states
- ✅ Focus indicators (keyboard navigation)
- ✅ Responsive layout
- ✅ Read-only mode (add button hidden)

## Migration Notes

No breaking changes for users. The controls functionality remains identical, only the visual styling has improved.

## Future Enhancements

Potential improvements:

1. Add tooltips using shadcn Tooltip component
2. Add keyboard shortcuts display
3. Add zoom percentage indicator
4. Add toggle for lock/unlock canvas
5. Add mini-toolbar for quick actions
6. Support different positions (top-left, bottom-right, etc.)

## Related Files

- `frontend/src/components/workflow/WorkflowControls.tsx`
- `frontend/src/components/workflow/AddAnnotationControl.tsx`
- `frontend/src/components/workflow/WorkflowCanvas.tsx`
- `frontend/src/components/workflow/reactflow-theme.css`
- `frontend/src/components/ui/button.tsx` (shadcn button styles)
