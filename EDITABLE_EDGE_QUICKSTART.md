# Editable Step Edge - Quick Start Guide

## What You Just Got

You now have **editable step edges** in your workflow editor! This means:

✅ **Step-based routing** - Edges use orthogonal lines (like n8n)  
✅ **Draggable control points** - Reshape edges by dragging control points  
✅ **Hover interactions** - Control points appear when hovering over edges  
✅ **Add node button** - Still works with the new edge type  
✅ **Auto-adjusting paths** - Edges update when nodes move  

## Try It Out

1. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open the workflow editor**

3. **Connect two nodes** - You'll see a step edge (not a curve)

4. **Hover over the edge** - Control points will appear as small circles

5. **Drag a control point** - The edge will reshape to follow your drag

6. **Move nodes** - The edge automatically adjusts its path

## Component Structure

```
edges/
├── workflow-edge/
│   ├── WorkflowEdge.tsx          ← Main edge component
│   ├── ControlPointComponent.tsx  ← Draggable control points
│   ├── ControlPoint.ts            ← Type definitions
│   └── path/
│       └── step.ts                ← Path calculation algorithms
├── CustomEdge.tsx                 ← Old bezier edge (still available)
├── EdgeButton.tsx                 ← Add node button
└── index.ts                       ← Exports
```

## How It Works

### 1. Edge Rendering
```tsx
// WorkflowCanvas.tsx
const edgeTypes: EdgeTypes = {
  default: WorkflowEdge,    // Uses step edges
  smoothstep: WorkflowEdge, // Uses step edges
};
```

### 2. Step Path Generation
The edge calculates an orthogonal path based on:
- Source node position and handle
- Target node position and handle
- Any existing control points

### 3. Control Points
When you hover over an edge:
- Control points appear at segment midpoints
- Each control point can move horizontally OR vertically (not both)
- Dragging updates the edge path in real-time

### 4. Path Updates
When nodes move, the edge automatically:
1. Recalculates the initial path
2. Updates control point positions
3. Regenerates the SVG path
4. Renders the updated edge

## Customization

### Change Control Point Appearance
Edit `ControlPointComponent.tsx`:
```tsx
<circle
  r={4}                              // Size: 4px radius
  fill={isDragging ? '#3b82f6' : '#6366f1'}  // Colors
  stroke="#fff"                      // Border color
  strokeWidth={2}                    // Border width
/>
```

### Change Edge Style
Edit `WorkflowEdge.tsx`:
```tsx
<BaseEdge 
  path={edgePath} 
  markerEnd={markerEnd} 
  style={{
    ...style,
    stroke: '#6366f1',      // Edge color
    strokeWidth: 2,         // Edge thickness
  }}
/>
```

### Persist Control Points
Currently, control points are stored in local component state. To persist them:

1. **Update store when control points change:**
```tsx
// In WorkflowEdge.tsx
const handleControlPointDrag = useCallback((controlPointId, position) => {
  setLocalControlPoints((prev) => {
    const updated = /* ... update logic ... */;
    
    // Persist to store/backend
    updateEdgeData(id, { controlPoints: updated });
    
    return updated;
  });
}, [id]);
```

2. **Load control points from edge data:**
```tsx
// Edge data includes control points
const edge = {
  id: 'e1-2',
  source: 'node1',
  target: 'node2',
  data: {
    controlPoints: [/* saved control points */]
  }
};
```

## API Reference

### WorkflowEdge Props
Extends ReactFlow's `EdgeProps`:
```tsx
interface WorkflowEdgeData {
  controlPoints?: ControlPointData[];
}

<WorkflowEdge
  id="e1-2"
  source="node1"
  target="node2"
  sourceX={100}
  sourceY={200}
  targetX={300}
  targetY={400}
  sourcePosition={Position.Right}
  targetPosition={Position.Left}
  data={{ controlPoints: [] }}
/>
```

### ControlPointData
```typescript
interface ControlPointData {
  id: string;              // Unique identifier
  x: number;               // X position
  y: number;               // Y position
  direction: ControlDirection;  // Horizontal | Vertical
  active: boolean;         // Whether control point is active
  prev?: string;           // Previous control point ID
}
```

## Comparison with Previous Edge

| Feature | Before (CustomEdge) | Now (WorkflowEdge) |
|---------|---------------------|-------------------|
| Path | Bezier curve | Step (orthogonal) |
| Editable | ❌ | ✅ |
| Control Points | ❌ | ✅ Draggable |
| Add Node Button | ✅ | ✅ |
| Hover State | ✅ | ✅ |
| Style | Smooth curves | Sharp corners + bends |

## Known Issues & Limitations

1. **No persistence** - Control points reset on page reload
   - *Solution: Implement store integration (see "Persist Control Points")*

2. **No auto-routing** - Edges don't avoid overlapping nodes
   - *Future enhancement: Implement collision detection*

3. **Manual positioning** - Control points must be dragged manually
   - *Future enhancement: Add smart routing algorithms*

## Troubleshooting

### Control points don't appear
- ✓ Check that you're hovering over the edge
- ✓ Verify WorkflowEdge is being used (not CustomEdge)
- ✓ Check console for errors

### Edge looks wrong
- ✓ Verify node positions are valid
- ✓ Check sourcePosition and targetPosition props
- ✓ Try refreshing the page

### Can't drag control points
- ✓ Make sure you're clicking directly on the circle
- ✓ Check that pointer events are enabled
- ✓ Verify no conflicting event handlers

## Next Steps

Consider implementing:

1. **Persistence Layer**
   ```tsx
   // Save control points to backend
   const saveEdgeData = async (edgeId, data) => {
     await api.updateEdge(edgeId, data);
   };
   ```

2. **Keyboard Shortcuts**
   - Double-click edge to add control point
   - Delete key to remove control point
   - Escape to cancel drag

3. **Visual Enhancements**
   - Edge labels/conditions
   - Branch indicators (true/false paths)
   - Animated flow direction

4. **Smart Routing**
   - Auto-avoid nodes
   - Minimize edge crossings
   - Optimize path length

## Resources

- 📄 [Full Implementation Documentation](./EDITABLE_STEP_EDGE_IMPLEMENTATION.md)
- 📁 Component Files: `frontend/src/components/workflow/edges/workflow-edge/`
- 🔧 Usage: `frontend/src/components/workflow/WorkflowCanvas.tsx`

## Questions?

Check the main documentation file for:
- Detailed algorithm explanations
- State management patterns
- Performance considerations
- Testing guidelines
