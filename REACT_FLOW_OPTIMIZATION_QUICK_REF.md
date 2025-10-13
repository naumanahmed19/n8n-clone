# React Flow Optimization - Quick Reference

## 🚀 Quick Checklist for ReactFlow Components

### ✅ Main ReactFlow Component

```typescript
// ✅ DO: Memoize all props
const nodeTypes = useMemo(() => ({ custom: CustomNode }), [])
const edgeTypes = useMemo(() => ({ default: CustomEdge }), [])
const defaultEdgeOptions = useMemo(() => ({ type: 'smoothstep' }), [])
const onNodesChange = useCallback((changes) => { ... }, [deps])

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  defaultEdgeOptions={defaultEdgeOptions}
  onNodesChange={onNodesChange}
/>
```

```typescript
// ❌ DON'T: Pass inline objects/functions
<ReactFlow
  nodeTypes={{ custom: CustomNode }}  // ❌ New object every render
  onNodesChange={(changes) => { ... }}  // ❌ New function every render
/>
```

---

### ✅ Custom Nodes

```typescript
// ✅ DO: Wrap in React.memo
export const MyNode = memo(function MyNode({ data, selected, id }) {
  const heavyContent = useMemo(() => <DataGrid data={data} />, [data])
  const config = useMemo(() => getIcon(data.type), [data.type])
  
  return <BaseNodeWrapper {...props} />
})
```

```typescript
// ❌ DON'T: Create without memo
export function MyNode({ data, selected, id }) {
  return <BaseNodeWrapper {...props} />  // ❌ Re-renders on every change
}
```

---

### ✅ Custom Edges

```typescript
// ✅ DO: Wrap in React.memo
export const MyEdge = memo(function MyEdge(props: EdgeProps) {
  return <BaseEdge {...props} />
})
```

```typescript
// ❌ DON'T: Create without memo
export function MyEdge(props: EdgeProps) {
  return <BaseEdge {...props} />  // ❌ Re-renders constantly
}
```

---

### ✅ Heavy Node Content

```typescript
// ✅ DO: Memoize heavy components
const NodeContent = memo(({ data }) => (
  <div>
    <DataGrid data={data.rows} />
    <Form fields={data.fields} />
  </div>
))

export const MyNode = memo(function MyNode({ data }) {
  return (
    <BaseNodeWrapper>
      <NodeContent data={data} />
    </BaseNodeWrapper>
  )
})
```

```typescript
// ❌ DON'T: Render heavy components directly
export const MyNode = memo(function MyNode({ data }) {
  return (
    <BaseNodeWrapper>
      <DataGrid data={data.rows} />  {/* ❌ Re-renders on every node change */}
      <Form fields={data.fields} />
    </BaseNodeWrapper>
  )
})
```

---

### ✅ Zustand Store

```typescript
// ✅ DO: Use createWithEqualityFn with shallow
import { createWithEqualityFn } from "zustand/traditional"
import { shallow } from "zustand/shallow"

export const useMyStore = createWithEqualityFn<State>((set) => ({
  nodes: [],
  edges: [],
  // ...
}), shallow)
```

```typescript
// ❌ DON'T: Use basic create
import { create } from "zustand"

export const useMyStore = create<State>((set) => ({
  nodes: [],
  edges: [],  // ❌ Selectors won't be memoized
}))
```

---

### ✅ Store Selectors

```typescript
// ✅ DO: Extract specific fields
const { name, color } = useStore()

// ✅ DO: Use selector for derived data
const nodeIds = useStore(state => state.nodes.map(n => n.id))  // Memoized with shallow
```

```typescript
// ❌ DON'T: Extract entire objects
const node = useStore(state => state.nodes.find(n => n.id === id))  // ❌ Re-renders on ANY node change

// ❌ DON'T: Depend on entire array
const selectedNodes = useStore(state => state.nodes)  // ❌ Changes on every position update
```

---

## 🎯 Performance Targets

| Scenario | Target FPS | Status |
|----------|-----------|--------|
| 100 default nodes | 60 FPS | ✅ Achieved |
| 100 heavy nodes | 50-60 FPS | ✅ Achieved |
| Drag operation | Smooth | ✅ Achieved |
| Node selection | Instant | ✅ Achieved |

---

## 🐛 Debugging Performance Issues

### Step 1: Open React DevTools Profiler
1. Open browser DevTools
2. Go to "Profiler" tab
3. Click "Record" (⏺)

### Step 2: Reproduce Issue
1. Drag a node for 3-5 seconds
2. Click "Stop" (⏹)

### Step 3: Analyze Flamegraph
**Good (Optimized):**
```
ReactFlow
└─ NodeRenderer
   └─ MyNode (highlighted - only dragged node)
   └─ MyNode (grey - not rendered)
   └─ MyNode (grey - not rendered)
   ...
```

**Bad (Needs Optimization):**
```
ReactFlow
└─ NodeRenderer
   └─ MyNode (highlighted - all nodes rendering!)
   └─ MyNode (highlighted)
   └─ MyNode (highlighted)
   ...
```

### Step 4: Fix Based on Issue

| Symptom | Cause | Fix |
|---------|-------|-----|
| All nodes highlighted | Node not wrapped in memo | `export const Node = memo(...)` |
| Many nodes highlighted | Props not memoized | Use `useMemo`/`useCallback` |
| Flickering during drag | Object props recreated | Move outside or `useMemo` |
| Heavy components slow | Not memoized internally | Wrap in separate `memo` |

---

## 📋 Pre-Merge Checklist

Before merging ReactFlow-related code:

- [ ] Custom nodes wrapped in `React.memo`
- [ ] Custom edges wrapped in `React.memo`
- [ ] Heavy components memoized separately
- [ ] All `<ReactFlow>` props use `useMemo`/`useCallback`
- [ ] No inline objects/functions in props
- [ ] Store selectors optimized
- [ ] Tested with 100+ nodes
- [ ] FPS maintained at 60
- [ ] React DevTools Profiler shows only dragged node rendering

---

## 🚨 Common Mistakes

### Mistake 1: Inline Functions
```typescript
// ❌ BAD
<ReactFlow onNodeClick={(e, node) => console.log(node)} />

// ✅ GOOD
const handleNodeClick = useCallback((e, node) => {
  console.log(node)
}, [])
<ReactFlow onNodeClick={handleNodeClick} />
```

### Mistake 2: Recreating Objects
```typescript
// ❌ BAD
<ReactFlow defaultEdgeOptions={{ type: 'smoothstep' }} />

// ✅ GOOD
const defaultEdgeOptions = useMemo(() => ({ type: 'smoothstep' }), [])
<ReactFlow defaultEdgeOptions={defaultEdgeOptions} />
```

### Mistake 3: Not Memoizing Node Content
```typescript
// ❌ BAD
export const Node = memo(({ data }) => (
  <div>
    <DataGrid data={data.rows} />  {/* Not memoized */}
  </div>
))

// ✅ GOOD
const DataGridContent = memo(({ rows }) => <DataGrid data={rows} />)

export const Node = memo(({ data }) => (
  <div>
    <DataGridContent rows={data.rows} />
  </div>
))
```

### Mistake 4: Wrong Store Dependencies
```typescript
// ❌ BAD
const nodes = useStore(state => state.nodes)  // Re-renders on EVERY change

// ✅ GOOD
const nodeCount = useStore(state => state.nodes.length)  // Only when count changes
const nodeIds = useStore(state => state.nodes.map(n => n.id))  // Shallow memoized
```

---

## 💡 Pro Tips

1. **Define static objects outside components:**
   ```typescript
   const NODE_TYPES = { custom: CustomNode }  // Once per module
   
   function MyComponent() {
     return <ReactFlow nodeTypes={NODE_TYPES} />
   }
   ```

2. **Use displayName for debugging:**
   ```typescript
   export const MyNode = memo(function MyNode() { ... })
   // displayName is automatically set to "MyNode"
   ```

3. **Test early and often:**
   - Add 100 nodes while developing
   - Don't wait until production

4. **Profile before optimizing:**
   - Use React DevTools Profiler
   - Find actual bottlenecks
   - Optimize what matters

---

## 📖 Full Documentation

For detailed explanations, see:
- **REACT_FLOW_OPTIMIZATION.md** - Complete guide
- **REACT_FLOW_OPTIMIZATION_SUMMARY.md** - Implementation summary

---

## ⚡ Quick Win Commands

```bash
# Test your app
npm run dev

# Build production
npm run build

# Check TypeScript errors
npm run type-check
```

---

**Remember:** One non-optimized component = entire canvas slowdown! 🐌  
Always wrap, always memoize, always test with 100+ nodes! 🚀
