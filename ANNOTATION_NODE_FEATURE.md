# Annotation Node Feature

## Overview

Annotation nodes allow you to add text notes and labels to your workflow canvas with optional arrow indicators pointing to specific elements.

## Implementation

### Component: AnnotationNode

Location: `frontend/src/components/workflow/nodes/AnnotationNode.tsx`

The annotation node is a special node type that displays:

- **Label**: The main annotation text
- **Level** (optional): A numbered prefix (e.g., "1.", "2.")
- **Arrow** (optional): A decorative arrow (⤹) that can be positioned using custom styles

### Data Structure

```typescript
interface AnnotationNodeData {
  label: string; // Required: The annotation text
  level?: string; // Optional: Number/letter prefix
  arrowStyle?: React.CSSProperties; // Optional: Custom positioning for arrow
}
```

### Usage Example

```typescript
const annotationNode = {
  id: "annotation-1",
  type: "annotation",
  position: { x: 100, y: 100 },
  data: {
    label: "This step processes the data",
    level: "1",
    arrowStyle: {
      right: "-20px",
      bottom: "10px",
    },
  },
};
```

### Styling

- **Default appearance**: Light card with border and shadow
- **No connections**: Annotation nodes don't have connection handles by default
- **Flexible positioning**: Use `arrowStyle` to position the arrow indicator anywhere around the annotation
- **Responsive**: Max width of 200px with text wrapping

### Features

- ✅ Clean, minimal design
- ✅ Optional numbering system (level)
- ✅ Optional directional arrow
- ✅ Dark mode support
- ✅ Customizable arrow positioning
- ✅ No drag interference (pointer-events on arrow)

### CSS Classes

- `.react-flow__node-annotation` - Main node wrapper
- `.annotation-content` - Content container
- `.annotation-level` - Number/level prefix
- `.annotation-label` - Main text
- `.annotation-arrow` - Arrow indicator

### Integration

The annotation node is exported from `frontend/src/components/workflow/nodes/index.ts` and can be registered in your React Flow node types configuration.

### Next Steps

To fully integrate annotation nodes:

1. **Register node type** in WorkflowEditor:

```typescript
const nodeTypes = {
  // ... existing types
  annotation: AnnotationNode,
};
```

2. **Add to toolbar** (optional): Add annotation button to create annotations
3. **Configure interactions**: Decide if annotations should be connectable, draggable, etc.

### Customization

You can extend the annotation node with:

- Different arrow styles (↗, ↘, →, etc.)
- Color themes
- Size variants
- Connection handles (if needed)
- Rich text formatting

### References

- React Flow Examples: https://reactflow.dev/examples/overview
- Based on React Flow annotation pattern
