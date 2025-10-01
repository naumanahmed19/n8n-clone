# Routable React Flow Connections

## Overview
Updated React Flow connections to use **step** (routable) paths instead of bezier curves. This creates orthogonal routing that automatically routes around nodes.

**⚠️ Performance Note:** Initial implementation with `getSmoothStepPath` caused slow drag operations. See [PERFORMANCE_OPTIMIZATION_EDGES.md](./PERFORMANCE_OPTIMIZATION_EDGES.md) for the optimized solution using custom simple step paths.

## Changes Made

### 1. CustomEdge.tsx
- **Changed import**: Replaced `getBezierPath` with `getSmoothStepPath`
- **Updated path calculation**: Now uses `getSmoothStepPath()` with `borderRadius: 8` for rounded corners
- **Removed manual extension logic**: The smooth step path handles routing automatically
- **Simplified rendering**: Removed the separate straight extension line for branch edges

```tsx
// Before: Bezier path
const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: adjustedSourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
})

// After: Smooth step path (routable)
const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
})
```

### 2. WorkflowEditor.tsx
- **Added edge type**: Registered `smoothstep` edge type in addition to `default`
- **Updated edge creation**: Set `type: 'smoothstep'` for all workflow connections

```tsx
// Edge types configuration
const edgeTypes: EdgeTypes = {
    default: CustomEdge,
    smoothstep: CustomEdge,
}

// Edge creation with type
const reactFlowEdges = workflow.connections.map(conn => ({
    id: conn.id,
    source: conn.sourceNodeId,
    target: conn.targetNodeId,
    sourceHandle: conn.sourceOutput,
    targetHandle: conn.targetInput,
    type: 'smoothstep', // ← Added this
    data: {
        label: conn.sourceOutput !== 'main' ? conn.sourceOutput : undefined
    }
}))
```

## Benefits

1. **Better Visualization**: Connections now route around nodes automatically
2. **Cleaner Layout**: Orthogonal lines are easier to follow than bezier curves
3. **Professional Look**: Similar to industry tools like n8n, Node-RED, etc.
4. **Automatic Routing**: React Flow handles the routing logic, no manual calculations needed
5. **Maintains Features**: All existing features (hover controls, branch labels, add/remove) still work

## Visual Difference

**Before (Bezier)**:
- Curved lines that could overlap nodes
- Manual straight extensions for branch nodes
- Less predictable routing

**After (Smooth Step)**:
- Orthogonal routing that avoids nodes
- Clean right-angle turns with rounded corners
- Predictable, grid-like routing

## Configuration Options

The `borderRadius: 8` parameter controls the corner rounding:
- `0` = Sharp right angles
- `8` = Slightly rounded (current)
- `16+` = More rounded corners

You can adjust this value in `CustomEdge.tsx` to customize the appearance.

## Backward Compatibility

All existing functionality is preserved:
- ✅ Branch labels still display
- ✅ Hover controls (add node, remove connection) still work
- ✅ Edge styling and animations maintained
- ✅ Connection management unchanged

## Testing

Test the following scenarios:
1. Create new connections - should use smooth step routing
2. Move nodes around - connections should re-route automatically
3. Branch nodes (IF, Switch) - labels should still appear correctly
4. Hover over edges - controls should appear as before
5. Add node between connections - should work seamlessly
6. Delete connections - should work as expected
