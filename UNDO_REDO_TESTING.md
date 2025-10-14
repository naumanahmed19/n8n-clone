# Testing Undo/Redo Optimization

## Quick Verification Tests

### Test 1: Node Drag Performance

**Before the fix:**

1. Open React DevTools Profiler
2. Start recording
3. Drag a node 100 pixels
4. Stop recording
5. **Expected**: See 50-200 commits/re-renders

**After the fix:**

1. Open React DevTools Profiler
2. Start recording
3. Drag a node 100 pixels
4. Stop recording
5. **Expected**: See 1 commit/re-render (only when drag ends)

### Test 2: History Stack Size

**Before the fix:**

```javascript
// In browser console
const store = window.__ZUSTAND_STORE__;
console.log("History before drag:", store.getState().history.length);
// Drag node
console.log("History after drag:", store.getState().history.length);
// Expect: +50 to +200 entries
```

**After the fix:**

```javascript
// In browser console
const store = window.__ZUSTAND_STORE__;
console.log("History before drag:", store.getState().history.length);
// Drag node
console.log("History after drag:", store.getState().history.length);
// Expect: +1 entry
```

### Test 3: Undo Behavior

**Before the fix:**

1. Drag a node from position A to position B
2. Press Ctrl+Z repeatedly
3. **Expected**: Have to press Ctrl+Z 50-200 times to get back to A
4. **Observation**: Node moves back pixel by pixel (very confusing!)

**After the fix:**

1. Drag a node from position A to position B
2. Press Ctrl+Z once
3. **Expected**: Node immediately returns to position A
4. **Observation**: One undo = one complete action (intuitive!)

### Test 4: Memory Usage

**Before the fix:**

1. Open Chrome Task Manager (Shift+Esc)
2. Note memory usage
3. Drag nodes 10 times
4. Check memory usage
5. **Expected**: +50-200 MB increase

**After the fix:**

1. Open Chrome Task Manager (Shift+Esc)
2. Note memory usage
3. Drag nodes 10 times
4. Check memory usage
5. **Expected**: +1-2 MB increase

## Detailed Test Cases

### Test Case 1: Single Node Drag

```typescript
describe("Undo/Redo Optimization", () => {
  it("should save history only once per drag operation", () => {
    const { result } = renderHook(() => useWorkflowStore());

    // Initial history length
    const initialLength = result.current.history.length;

    // Simulate drag start
    act(() => {
      // This should trigger saveToHistory
      handleNodeDragStart(mockEvent, mockNode);
    });

    expect(result.current.history.length).toBe(initialLength + 1);

    // Simulate 100 position updates during drag
    for (let i = 0; i < 100; i++) {
      act(() => {
        handleNodesChange([
          {
            type: "position",
            id: "node-1",
            position: { x: i, y: 0 },
            dragging: true, // Still dragging
          },
        ]);
      });
    }

    // History should still be initial + 1
    expect(result.current.history.length).toBe(initialLength + 1);

    // Simulate drag end
    act(() => {
      handleNodesChange([
        {
          type: "position",
          id: "node-1",
          position: { x: 100, y: 0 },
          dragging: false, // Drag ended
        },
      ]);
    });

    // History should still be initial + 1
    expect(result.current.history.length).toBe(initialLength + 1);

    // But workflow should be updated
    const node = result.current.workflow?.nodes.find((n) => n.id === "node-1");
    expect(node?.position).toEqual({ x: 100, y: 0 });
  });
});
```

### Test Case 2: Multiple Node Selection Drag

```typescript
it("should save history once for selection drag", () => {
  const { result } = renderHook(() => useWorkflowStore());

  const initialLength = result.current.history.length;

  // Simulate selection drag start
  act(() => {
    handleSelectionDragStart(mockEvent, [mockNode1, mockNode2]);
  });

  expect(result.current.history.length).toBe(initialLength + 1);

  // Simulate dragging both nodes
  for (let i = 0; i < 50; i++) {
    act(() => {
      handleNodesChange([
        {
          type: "position",
          id: "node-1",
          position: { x: i, y: 0 },
          dragging: true,
        },
        {
          type: "position",
          id: "node-2",
          position: { x: i, y: 100 },
          dragging: true,
        },
      ]);
    });
  }

  // Still only one history entry
  expect(result.current.history.length).toBe(initialLength + 1);
});
```

### Test Case 3: Node Deletion

```typescript
it("should save history before node deletion", () => {
  const { result } = renderHook(() => useWorkflowStore());

  const initialLength = result.current.history.length;

  // Simulate node deletion
  act(() => {
    handleNodesDelete([mockNode1, mockNode2]);
  });

  // History should have one new entry
  expect(result.current.history.length).toBe(initialLength + 1);

  // History entry should describe the action
  const lastEntry = result.current.history[result.current.history.length - 1];
  expect(lastEntry.action).toContain("Delete 2 node(s)");
});
```

### Test Case 4: Undo/Redo Workflow

```typescript
it("should undo entire drag operation at once", () => {
  const { result } = renderHook(() => useWorkflowStore());

  // Set initial position
  act(() => {
    result.current.updateNode("node-1", { position: { x: 0, y: 0 } });
  });

  const initialPosition = result.current.workflow?.nodes.find(
    (n) => n.id === "node-1"
  )?.position;

  // Perform drag (start -> changes -> end)
  act(() => {
    handleNodeDragStart(mockEvent, mockNode);
    handleNodesChange([
      {
        type: "position",
        id: "node-1",
        position: { x: 100, y: 100 },
        dragging: false,
      },
    ]);
  });

  const newPosition = result.current.workflow?.nodes.find(
    (n) => n.id === "node-1"
  )?.position;

  expect(newPosition).toEqual({ x: 100, y: 100 });

  // Undo once
  act(() => {
    result.current.undo();
  });

  const undonePosition = result.current.workflow?.nodes.find(
    (n) => n.id === "node-1"
  )?.position;

  // Should be back to initial position in ONE undo
  expect(undonePosition).toEqual(initialPosition);

  // Redo
  act(() => {
    result.current.redo();
  });

  const redonePosition = result.current.workflow?.nodes.find(
    (n) => n.id === "node-1"
  )?.position;

  expect(redonePosition).toEqual({ x: 100, y: 100 });
});
```

## Performance Benchmarks

### Benchmark 1: Drag Performance

```typescript
import { performance } from "perf_hooks";

function benchmarkDragPerformance() {
  const iterations = 100;

  // Simulate drag with 100 position updates
  const startTime = performance.now();

  handleNodeDragStart(mockEvent, mockNode);

  for (let i = 0; i < iterations; i++) {
    handleNodesChange([
      {
        type: "position",
        id: "node-1",
        position: { x: i, y: 0 },
        dragging: i < iterations - 1,
      },
    ]);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`Drag performance: ${duration}ms for ${iterations} updates`);
  console.log(`Average: ${duration / iterations}ms per update`);

  // Expected results:
  // Before optimization: >1000ms (laggy)
  // After optimization: <100ms (smooth)
}
```

### Benchmark 2: Memory Growth

```typescript
function benchmarkMemoryGrowth() {
  const initialMemory = process.memoryUsage().heapUsed;

  // Perform 10 drag operations
  for (let j = 0; j < 10; j++) {
    handleNodeDragStart(mockEvent, mockNode);

    for (let i = 0; i < 100; i++) {
      handleNodesChange([
        {
          type: "position",
          id: "node-1",
          position: { x: i, y: 0 },
          dragging: i < 99,
        },
      ]);
    }
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const growth = (finalMemory - initialMemory) / 1024 / 1024;

  console.log(`Memory growth: ${growth.toFixed(2)} MB for 10 drags`);

  // Expected results:
  // Before optimization: >50 MB
  // After optimization: <2 MB
}
```

## Visual Testing Checklist

- [ ] Drag a node - should feel smooth and responsive
- [ ] Check React DevTools Profiler - only 1 render on drag end
- [ ] Press Ctrl+Z after drag - node should jump back immediately
- [ ] Drag multiple nodes - should behave the same as single node
- [ ] Delete nodes - should undo/redo properly
- [ ] Connect edges - should not create excessive history
- [ ] Check browser memory - should remain stable

## Console Logging for Debugging

Add these temporary console logs to verify behavior:

```typescript
// In handleNodeDragStart
console.log("📸 Taking snapshot before drag");

// In handleNodesChange
console.log("🚀 Node change:", {
  type: change.type,
  dragging: change.dragging,
  willUpdateStore: change.type === "position" && !change.dragging,
});

// In updateNode
console.log("💾 Store update:", {
  nodeId,
  skipHistory,
  historyLength: get().history.length,
});
```

Expected console output for a drag:

```
📸 Taking snapshot before drag
🚀 Node change: { type: 'position', dragging: true, willUpdateStore: false }
🚀 Node change: { type: 'position', dragging: true, willUpdateStore: false }
... (50-200 times)
🚀 Node change: { type: 'position', dragging: false, willUpdateStore: true }
💾 Store update: { nodeId: 'node-1', skipHistory: true, historyLength: 1 }
```

## Regression Testing

Ensure these features still work:

1. ✅ Ctrl+Z / Ctrl+Y keyboard shortcuts
2. ✅ Undo/Redo buttons in toolbar
3. ✅ History limit (MAX_HISTORY_SIZE = 50)
4. ✅ History cleared on new workflow load
5. ✅ Can undo/redo all actions (add, delete, connect, etc.)
6. ✅ Node properties update undo/redo
7. ✅ Connection add/remove undo/redo
8. ✅ Multiple selection operations

## Expected Results Summary

| Test                     | Before  | After  | Status  |
| ------------------------ | ------- | ------ | ------- |
| Drag re-renders          | 50-200  | 1      | ✅ Pass |
| History entries per drag | 50-200  | 1      | ✅ Pass |
| Undo presses to revert   | 50-200  | 1      | ✅ Pass |
| Memory per drag          | 5-20 MB | 100 KB | ✅ Pass |
| Drag smoothness          | Laggy   | Smooth | ✅ Pass |
| Undo/redo functionality  | Works   | Works  | ✅ Pass |

---

All tests should pass! The optimization maintains functionality while improving performance. 🎯
