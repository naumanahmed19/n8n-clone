# Editable Step Edge Implementation

## Overview
This document describes the implementation of editable step edges in the workflow editor. Unlike simple bezier curves, step edges allow users to add control points to reshape connection paths, similar to n8n and Miro's workflow editors.

## Architecture

### Core Components

#### 1. **WorkflowEdge.tsx**
The main edge component that renders:
- Step-based path (orthogonal lines with smooth corners)
- Interactive control points (shown on hover)
- Add node button at the edge midpoint
- Hover detection for better UX

**Key Features:**
- Uses ReactFlow's `BaseEdge` for rendering
- Manages local control point state
- Dynamically updates path when nodes move
- Shows control points and buttons only on hover

#### 2. **ControlPoint.ts** (Type Definitions)
```typescript
export enum ControlDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export interface ControlPointData extends XYPosition {
  id: string;
  direction: ControlDirection;  // Whether point moves horizontally or vertically
  active: boolean;              // Whether this control point is active
  prev?: string;                // Previous control point ID for ordering
}
```

#### 3. **ControlPointComponent.tsx**
Interactive control point component that:
- Renders as a small circular handle
- Supports drag-to-reposition functionality
- Provides visual feedback (hover, dragging states)
- Uses larger invisible hit area for easier interaction

#### 4. **step.ts** (Path Calculation Functions)
Core algorithms for step edge path generation:

**`getStepInitialPoints()`**
- Creates initial path points when no control points exist
- Mimics ReactFlow's smooth step edge behavior
- Handles all handle position combinations (Left, Right, Top, Bottom)

**`getPointsBasedOnNodePositions()`**
- Updates control points when source/target nodes move
- Maintains proper orthogonal routing
- Adjusts first and second points from each end

**`getStepPath()`**
- Generates SVG path string from control points
- Creates smooth bends at corners using `getBend()`
- Returns path suitable for `<path d={...} />`

**`getStepControlPoints()`**
- Calculates positions for interactive control points
- Places controls at midpoints of line segments
- Determines if control should move horizontally or vertically

## Usage

### Basic Setup

1. **Import the edge type:**
```tsx
import { WorkflowEdge } from './edges';
```

2. **Configure edge types:**
```tsx
const edgeTypes: EdgeTypes = {
  default: WorkflowEdge,
  smoothstep: WorkflowEdge,
};
```

3. **Use in ReactFlow:**
```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  // ... other props
/>
```

### Edge Data Structure

Edges can optionally store control point data:
```typescript
interface WorkflowEdgeData {
  controlPoints?: ControlPointData[];
}

const edge: Edge<WorkflowEdgeData> = {
  id: 'e1-2',
  source: 'node1',
  target: 'node2',
  type: 'default',
  data: {
    controlPoints: [
      { id: 'cp1', x: 100, y: 200, direction: ControlDirection.Horizontal, active: true }
    ]
  }
};
```

## User Interactions

### Hover State
- **Trigger:** Mouse enters edge area (20px wide detection zone)
- **Shows:** 
  - Control points (small circles at path segment midpoints)
  - Add node button at edge midpoint
- **Hides:** When mouse leaves edge area

### Dragging Control Points
1. User hovers over edge → control points appear
2. User clicks and drags a control point
3. Edge path updates in real-time
4. Control point position is stored in local state
5. Downstream segments adjust to maintain orthogonal routing

### Adding Nodes
- Click the "+" button on the edge
- Opens command dialog to select node type
- Node is inserted at edge midpoint
- Old connection is removed, two new connections are created
- Downstream nodes are shifted to make space

## Implementation Details

### Path Generation Algorithm

1. **Calculate initial points** using handle positions and offsets
2. **Handle opposite positions** (Right → Left):
   - Create vertical or horizontal splits based on direction
3. **Handle same positions** (Right → Right):
   - Add intermediate points to route around
4. **Handle mixed positions** (Right → Bottom):
   - Determine optimal routing based on spatial relationships
5. **Apply bends** at corners for smooth transitions

### Control Point Placement

Control points are placed at:
- Midpoints of horizontal segments
- Midpoints of vertical segments
- **Not placed** between source handle and first point
- **Not placed** between last point and target handle

### Dynamic Updates

When nodes move:
1. `getPointsBasedOnNodePositions()` is called
2. First two points from source side are updated
3. Last two points from target side are updated
4. Direction (horizontal/vertical) is preserved
5. Path is regenerated with updated points

## State Management

### Local State (Component)
```tsx
const [localControlPoints, setLocalControlPoints] = useState<ControlPointData[]>(
  data?.controlPoints || []
);
```
- Stores control point positions
- Updates during drag operations
- Can be persisted to edge `data` if needed

### Hover State
```tsx
const [isHovered, setIsHovered] = useState(false);
```
- Controls visibility of control points and buttons
- Updated by mouse events on invisible hover path

## Performance Considerations

### Memoization
All expensive calculations are memoized:
- `initialStepPoints` - Only recalculates when node positions change
- `currentPoints` - Only updates when control points or node positions change
- `edgePath` - Only regenerates when points change
- `controlPoints` - Only recalculates when points change
- `labelPosition` - Only updates when points change

### Hit Area Optimization
- Invisible 20px wide path for hover detection
- Reduces need for precise hovering
- Improves UX on touch devices

## Comparison: CustomEdge vs WorkflowEdge

| Feature | CustomEdge | WorkflowEdge |
|---------|-----------|--------------|
| Path Type | Bezier curve | Step (orthogonal) |
| Editable | No | Yes (control points) |
| Control Points | None | Multiple, draggable |
| Path Style | Smooth curves | Straight + rounded corners |
| Use Case | Simple connections | Complex routing |
| Performance | Lighter | Slightly heavier |

## Future Enhancements

### Potential Features
1. **Persist control points** to backend/store
2. **Auto-routing** to avoid node overlaps
3. **Snap-to-grid** for control points
4. **Label support** on edge segments
5. **Conditional routing** indicators (if/else branches)
6. **Path smoothing** options
7. **Double-click to add** control points
8. **Delete control points** by clicking them

### Known Limitations
1. Control points don't persist across page reloads (stored in local state)
2. No collision avoidance with other nodes
3. Manual control point placement (no auto-routing)
4. Limited to orthogonal routing only

## Testing

### Manual Testing Checklist
- [ ] Edge renders correctly between nodes
- [ ] Hover shows control points
- [ ] Control points can be dragged
- [ ] Path updates smoothly during drag
- [ ] Moving nodes updates edge path
- [ ] Add button appears on hover
- [ ] Adding node works correctly
- [ ] Multiple control points work together
- [ ] Edge works with all handle positions (L/R/T/B)

### Edge Cases
- Very close nodes (< 40px apart)
- Same-side handle connections (Right → Right)
- Diagonal connections
- Long-distance connections
- Multiple control points on same edge

## Related Files
- `frontend/src/components/workflow/edges/workflow-edge/WorkflowEdge.tsx`
- `frontend/src/components/workflow/edges/workflow-edge/ControlPointComponent.tsx`
- `frontend/src/components/workflow/edges/workflow-edge/ControlPoint.ts`
- `frontend/src/components/workflow/edges/workflow-edge/path/step.ts`
- `frontend/src/components/workflow/WorkflowCanvas.tsx`
- `frontend/src/components/workflow/AddNodeCommandDialog.tsx`

## References
- n8n workflow editor edge implementation
- Miro editable edges pattern
- ReactFlow smooth step edge algorithm
- [ReactFlow Edge Documentation](https://reactflow.dev/api-reference/types/edge)
