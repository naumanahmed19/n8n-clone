# Workflow Controls - Quick Reference

## Summary of Changes

✅ **Created** `WorkflowControls.tsx` - Custom controls with shadcn UI styles  
✅ **Updated** `AddAnnotationControl.tsx` - Uses new WorkflowControlButton  
✅ **Updated** `WorkflowCanvas.tsx` - Uses WorkflowControls instead of default Controls  
✅ **Cleaned** `reactflow-theme.css` - Removed legacy control styles

## Key Features

🎨 **Design System Integration**

- Uses shadcn UI design tokens
- Automatic dark mode support
- Consistent hover/focus states

♿ **Accessibility**

- Proper ARIA labels
- Keyboard navigation support
- Focus-visible rings

🔧 **Extensibility**

- Easy to add custom controls
- Reusable WorkflowControlButton component
- Clean separation with divider

## Component API

### WorkflowControls

```tsx
interface WorkflowControlsProps {
  children?: ReactNode; // Custom control buttons
  className?: string; // Additional CSS classes
  showAddNode?: boolean; // Show/hide add node button (default: true)
  showExecute?: boolean; // Show/hide execute button (default: true)
  showUndoRedo?: boolean; // Show/hide undo/redo buttons (default: true)
}
```

**Default Controls:**

- Execute/Play Button (▶) - Executes workflow from trigger nodes
  - Single trigger: Simple play button
  - Multiple triggers: Dropdown to select trigger
- Add Node (+ button with primary styling) - Opens add node dialog
- Zoom Out (-)
- Zoom In (+)
- Fit View (maximize icon)
- Undo (↶) - Undo last action (Ctrl+Z)
- Redo (↷) - Redo last undone action (Ctrl+Y)

### WorkflowControlButton

```tsx
interface ControlButtonProps {
  onClick: () => void;
  title: string; // Tooltip text & ARIA label
  icon: ReactNode; // Lucide icon component
  className?: string; // Additional CSS classes
}
```

## Visual Style

```
┌──────────────────────────────────────────────────────────┐
│ [▶] | [+] | [-] [+] [⊡] | [↶] [↷] | [💬]              │  Card background
│                                                          │  with border
│ Play  Add  Zoom controls  Undo Redo  Annotation        │
│       Node (Out/In/Fit)                (custom)         │
│                                                          │
│ Green Primary Muted icons Muted icons Muted icons       │
│ icon  colored                                            │
└──────────────────────────────────────────────────────────┘
            Centered at bottom
```

## Usage Example

```tsx
import { WorkflowControls, WorkflowControlButton } from './WorkflowControls'
import { Sparkles } from 'lucide-react'

// Basic usage with all default controls
<WorkflowControls>
  {/* Add custom controls here */}
</WorkflowControls>

// Hide add node button (e.g., in read-only mode)
<WorkflowControls showAddNode={false}>
  {/* Custom controls */}
</WorkflowControls>

// Hide execute button (e.g., no triggers available)
<WorkflowControls showExecute={false}>
  {/* Custom controls */}
</WorkflowControls>

// Hide undo/redo buttons
<WorkflowControls showUndoRedo={false}>
  {/* Custom controls */}
</WorkflowControls>

// Read-only mode: hide all edit controls
<WorkflowControls showAddNode={false} showExecute={false} showUndoRedo={false}>
  {/* Only zoom controls and custom controls */}
</WorkflowControls>

// With custom control
<WorkflowControls>
  <WorkflowControlButton
    onClick={handleMagic}
    title="AI Assistant"
    icon={<Sparkles className="h-4 w-4" />}
  />
</WorkflowControls>
```

## CSS Variables (from shadcn)

| Variable       | Usage                    |
| -------------- | ------------------------ |
| `--card`       | Control panel background |
| `--border`     | Border colors            |
| `--background` | Button background        |
| `--foreground` | Icons & text             |
| `--accent`     | Hover state              |
| `--ring`       | Focus indicator          |

## Position

Default: `bottom-4 left-1/2 -translate-x-1/2` (centered at bottom, Figma-style)

Override with className:

```tsx
<WorkflowControls className="top-4 left-1/2">
  {/* Positioned top-center */}
</WorkflowControls>
```

## Browser Support

✅ Modern browsers (Chrome, Firefox, Safari, Edge)  
✅ Dark mode via prefers-color-scheme  
✅ Keyboard navigation  
✅ Touch devices

## Performance

- Components are memoized where appropriate
- No unnecessary re-renders
- Lightweight (uses existing shadcn styles)
- No additional CSS bundle size

## Testing Checklist

- [ ] Zoom in/out works
- [ ] Fit view works
- [ ] Custom controls render
- [ ] Dark mode styling
- [ ] Hover states
- [ ] Focus indicators (tab navigation)
- [ ] Accessibility (screen readers)

## Related Documentation

- `WORKFLOW_CONTROLS_SHADCN_UPGRADE.md` - Detailed changes
- shadcn UI button docs: https://ui.shadcn.com/docs/components/button
