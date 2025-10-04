# WorkflowEdge - Simplified Version

## Current Status

✅ **Step-based edge routing** - Edges use orthogonal (step-like) paths instead of curves  
✅ **Hover to add nodes** - Add button appears when hovering over edges  
⚠️ **Draggable control points** - Temporarily disabled (implementation complexity)  

## What Works Now

### 1. Step Edge Routing
Edges automatically route with orthogonal paths based on:
- Source and target node positions
- Handle positions (Left, Right, Top, Bottom)
- Automatic corner rounding for smooth appearance

### 2. Add Node Button
- Hover over any edge to see the "+" button
- Click to open command dialog
- New node is inserted at the edge midpoint
- Connections are automatically created

## Why Control Points Are Disabled

The draggable control points feature requires more complex logic:

1. **Control points are midpoints** - They don't exist in the actual path
2. **Dragging requires path insertion** - Need to insert new points into the path array
3. **ID mapping is complex** - Control points have composite IDs (`point-1-point-2`)
4. **State persistence needed** - Modified paths need to be stored and restored

This feature would need:
- Proper path point insertion/removal logic
- State management for custom control points
- Backend persistence for modified paths
- Handling of node movement with custom paths

## Simple Use Case

For most workflows, the automatic step routing is sufficient:
- Clean, predictable paths
- Automatically adjusts when nodes move
- No manual management required

## Current Implementation

```tsx
// WorkflowEdge.tsx - Simplified
export function WorkflowEdge({...}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate step path automatically
  const initialStepPoints = getStepInitialPoints({
    source: { x: sourceX, y: sourceY },
    sourcePosition,
    target: { x: targetX, y: targetY },
    targetPosition,
  });
  
  const edgePath = getStepPath({
    points: currentPoints,
    initialStepPoints,
  });
  
  return (
    <>
      <BaseEdge path={edgePath} ... />
      {isHovered && <EdgeButton ... />}
    </>
  );
}
```

## If You Need Editable Edges

You have two options:

### Option 1: Use CustomEdge (Bezier)
Switch back to bezier curves which are simpler:
```tsx
// WorkflowCanvas.tsx
const edgeTypes: EdgeTypes = {
  default: CustomEdge,  // Bezier curves with add button
};
```

### Option 2: Implement Full Control Point Logic
See the complex implementation in n8n's codebase:
- Store modified paths in edge data
- Handle control point drag → path modification
- Persist to backend
- Handle node movement with custom paths

## Files Structure

```
edges/
├── workflow-edge/
│   ├── WorkflowEdge.tsx          ← Simplified (step routing + add button)
│   ├── ControlPointComponent.tsx  ← Exists but not used
│   ├── ControlPoint.ts            ← Type definitions
│   └── path/
│       └── step.ts                ← Path calculation algorithms
├── CustomEdge.tsx                 ← Simple bezier edge (alternative)
└── EdgeButton.tsx                 ← Add node button (works with both)
```

## Future Enhancement Path

To fully implement editable edges:

1. **Understand n8n's implementation** - Study their approach
2. **Implement path modification** - Insert/remove points when dragging
3. **Add state management** - Store custom paths in Zustand store
4. **Backend persistence** - Save/load modified paths
5. **Handle edge cases** - Node movement, deletion, etc.

## Summary

**Current Focus**: Clean, automatic step routing with add node functionality  
**Postponed**: Manual path editing with control points (requires significant effort)  
**Alternative**: Use CustomEdge for simpler bezier curves

The step edge routing provides a professional n8n-like appearance without the complexity of manual path editing.
