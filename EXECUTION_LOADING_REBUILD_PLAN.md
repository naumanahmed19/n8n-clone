# Complete Execution Loading State Rebuild Plan

## Problem Analysis

### Current Architecture Issues

1. **Multiple Sources of Truth**:

   - `nodeExecutionState.isExecuting` in `useNodeExecution`
   - `nodeVisualState.status` from ProgressTracker
   - `executionState.status` in WorkflowStore
   - `toolbar.isExecuting` passed to components
   - All these can conflict with each other

2. **Shared Global State**:

   - `flowExecutionState.nodeVisualStates` is a single Map for all nodes
   - No execution-to-node membership tracking
   - When Trigger A runs Node 1, the state goes into global Map
   - When Trigger B runs Node 3, Node 1's state is still in the Map
   - **No filtering** to check if a node belongs to current execution

3. **No Execution Context Awareness**:

   - Nodes don't know which execution they belong to
   - Components read from global state without checking execution membership
   - `getNodeVisualState()` returns state but doesn't verify it's for the right execution

4. **Race Conditions**:
   - Multiple executions update the same ProgressTracker
   - Event handlers don't properly isolate execution contexts
   - `currentlyExecuting` arrays not properly maintained

## Root Cause

**The fundamental issue**: When you execute a trigger, nodes get marked as RUNNING in a global state Map. When a different trigger executes, those nodes are STILL marked as RUNNING in the global Map because there's no mechanism to say "only show this node as running if it's part of MY execution".

## New Architecture Design

### Core Principles

1. **Single Source of Truth**: One authority for node execution state
2. **Execution-to-Node Mapping**: Track which nodes belong to which execution
3. **Automatic Filtering**: Components automatically filter based on execution context
4. **No Shared Global State**: Each execution has isolated state

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│  (CustomNode, BaseNodeWrapper, NodeToolbarContent)          │
│                                                              │
│  ✓ Only reads from useExecutionContext hook                 │
│  ✓ Automatically gets filtered state                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Hook Layer (NEW)                                │
│                                                              │
│  useExecutionContext(nodeId)                                 │
│  ├─ Returns: isNodeExecuting(nodeId)                        │
│  ├─ Returns: getNodeStatus(nodeId)                          │
│  └─ Automatically filters by current execution              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│         ExecutionContextManager Service (NEW)                │
│                                                              │
│  Features:                                                   │
│  ├─ executionStates: Map<executionId, ExecutionState>       │
│  ├─ nodeToExecutions: Map<nodeId, Set<executionId>>         │
│  ├─ currentExecutionId: string                               │
│  │                                                           │
│  Methods:                                                    │
│  ├─ startExecution(executionId, nodeIds)                    │
│  ├─ setNodeExecuting(executionId, nodeId)                   │
│  ├─ setNodeCompleted(executionId, nodeId)                   │
│  ├─ isNodeInExecution(executionId, nodeId): boolean         │
│  ├─ getNodeStatus(nodeId, executionId): Status              │
│  └─ clearExecution(executionId)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Storage Layer                                   │
│                                                              │
│  WorkflowStore - Manages global execution state             │
│  ProgressTracker - Track node progress within executions    │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Create ExecutionContextManager ✅

**File**: `frontend/src/services/ExecutionContextManager.ts`

```typescript
interface ExecutionContext {
  executionId: string;
  triggerNodeId: string;
  affectedNodeIds: Set<string>; // Nodes in this execution path
  runningNodes: Set<string>; // Currently executing
  completedNodes: Set<string>; // Done
  failedNodes: Set<string>; // Failed
  status: "running" | "completed" | "failed";
  startTime: number;
  endTime?: number;
}

class ExecutionContextManager {
  private executions: Map<string, ExecutionContext>;
  private currentExecutionId: string | null;
  private nodeToExecutions: Map<string, Set<string>>; // Track which executions affect each node

  // Start a new execution
  startExecution(
    executionId: string,
    triggerNodeId: string,
    affectedNodes: string[]
  );

  // Update node state (only for its execution)
  setNodeRunning(executionId: string, nodeId: string);
  setNodeCompleted(executionId: string, nodeId: string);
  setNodeFailed(executionId: string, nodeId: string);

  // Query methods
  isNodeInExecution(executionId: string, nodeId: string): boolean;
  isNodeExecuting(nodeId: string): boolean; // Check if node is running in ANY active execution
  isNodeExecutingInCurrent(nodeId: string): boolean; // Check only current execution
  getNodeExecutions(nodeId: string): string[]; // Which executions affect this node
  getExecutionForNode(nodeId: string): string | null; // Get current execution for node

  // Current execution management
  setCurrentExecution(executionId: string);
  getCurrentExecution(): ExecutionContext | null;
}
```

### Phase 2: Create useExecutionContext Hook ✅

**File**: `frontend/src/hooks/useExecutionContext.ts`

```typescript
export function useExecutionContext(nodeId: string) {
  const executionManager = useWorkflowStore((state) => state.executionManager);

  // Get node's execution state with proper filtering
  const isExecuting = useMemo(() => {
    // Only return true if node is executing in the CURRENT execution
    return executionManager.isNodeExecutingInCurrent(nodeId);
  }, [executionManager, nodeId /* listen to execution changes */]);

  const status = useMemo(() => {
    return executionManager.getNodeStatus(nodeId);
  }, [executionManager, nodeId]);

  return {
    isExecuting, // TRUE only if node is running in current execution
    status,
    hasError: status === "failed",
    hasSuccess: status === "completed",
    executionId: executionManager.getExecutionForNode(nodeId),
  };
}
```

### Phase 3: Refactor useNodeExecution ✅

**File**: `frontend/src/components/workflow/hooks/useNodeExecution.ts`

```typescript
export function useNodeExecution(nodeId: string, nodeType: string) {
  // Use the new execution context hook
  const { isExecuting, status, hasError, hasSuccess, executionId } =
    useExecutionContext(nodeId);

  const [nodeExecutionState, setNodeExecutionState] = useState({
    isExecuting: false, // Will be synced from context
    hasError: false,
    hasSuccess: false,
  });

  // Sync local state with execution context
  useEffect(() => {
    setNodeExecutionState({
      isExecuting, // Now properly filtered!
      hasError,
      hasSuccess,
    });
  }, [isExecuting, hasError, hasSuccess]);

  // ... rest of the hook
}
```

### Phase 4: Update WorkflowStore ✅

```typescript
// In WorkflowStore
export const useWorkflowStore = create<WorkflowStore>()(
  devtools((set, get) => ({
    // Add execution manager
    executionManager: new ExecutionContextManager(),

    executeNode: async (nodeId, inputData, mode) => {
      const executionId = generateExecutionId();

      if (mode === "workflow") {
        // Calculate affected nodes (nodes reachable from trigger)
        const affectedNodes = getAffectedNodes(nodeId, workflow);

        // Initialize execution context
        get().executionManager.startExecution(
          executionId,
          nodeId,
          affectedNodes
        );

        // Set as current execution
        get().executionManager.setCurrentExecution(executionId);

        // Start workflow execution
        // ... execution logic
      }
    },

    updateNodeExecutionState: (nodeId, status, data) => {
      const currentExecution = get().executionManager.getCurrentExecution();

      if (currentExecution) {
        // Only update if node belongs to this execution
        if (
          get().executionManager.isNodeInExecution(
            currentExecution.executionId,
            nodeId
          )
        ) {
          if (status === NodeExecutionStatus.RUNNING) {
            get().executionManager.setNodeRunning(
              currentExecution.executionId,
              nodeId
            );
          } else if (status === NodeExecutionStatus.COMPLETED) {
            get().executionManager.setNodeCompleted(
              currentExecution.executionId,
              nodeId
            );
          } else if (status === NodeExecutionStatus.FAILED) {
            get().executionManager.setNodeFailed(
              currentExecution.executionId,
              nodeId
            );
          }
        }
      }
    },
  }))
);
```

### Phase 5: Update Components ✅

**CustomNode.tsx**:

```typescript
export const CustomNode = memo(function CustomNode({
  data,
  selected,
  id,
}: NodeProps) {
  // Use new execution context hook
  const { isExecuting, status, hasError, hasSuccess } = useExecutionContext(id);

  // No need to read from multiple sources - single source of truth!

  return (
    <BaseNodeWrapper
      id={id}
      selected={selected}
      data={data}
      toolbar={{
        isExecuting, // Automatically filtered by execution context
        hasError,
        hasSuccess,
        // ...
      }}
    />
  );
});
```

**BaseNodeWrapper.tsx**:

```typescript
export function BaseNodeWrapper({ id, data, toolbar }: BaseNodeWrapperProps) {
  // Use execution context
  const { isExecuting, hasError, hasSuccess } = useExecutionContext(id);

  // Override with toolbar props if provided, otherwise use context
  const actualIsExecuting = toolbar?.isExecuting ?? isExecuting;
  const actualHasError = toolbar?.hasError ?? hasError;
  const actualHasSuccess = toolbar?.hasSuccess ?? hasSuccess;

  return (
    <div
      className={getNodeStatusClasses(
        data.disabled,
        actualIsExecuting /* ... */
      )}
    >
      <NodeToolbarContent
        isExecuting={actualIsExecuting}
        hasError={actualHasError}
        hasSuccess={actualHasSuccess}
        // ...
      />
    </div>
  );
}
```

### Phase 6: Calculate Affected Nodes ✅

**File**: `frontend/src/utils/executionPathAnalyzer.ts`

```typescript
/**
 * Calculate which nodes are affected by executing from a trigger
 * Uses graph traversal to find all downstream nodes
 */
export function getAffectedNodes(
  triggerNodeId: string,
  workflow: Workflow
): string[] {
  const visited = new Set<string>();
  const queue: string[] = [triggerNodeId];
  const affectedNodes: string[] = [triggerNodeId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;

    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    // Find all connections from this node
    const outgoingConnections = workflow.connections.filter(
      (conn) => conn.sourceNodeId === currentNodeId
    );

    for (const conn of outgoingConnections) {
      if (!visited.has(conn.targetNodeId)) {
        queue.push(conn.targetNodeId);
        affectedNodes.push(conn.targetNodeId);
      }
    }
  }

  return affectedNodes;
}
```

## Benefits of New Architecture

### ✅ Single Source of Truth

- `ExecutionContextManager` is the only authority
- No conflicts between different state sources
- Components read from one place

### ✅ Automatic Filtering

- `useExecutionContext` automatically filters by current execution
- Components don't need to manually check execution membership
- No cross-trigger contamination

### ✅ Clear Execution Boundaries

- Each execution knows its affected nodes
- Nodes know which executions they belong to
- Clear separation between concurrent executions

### ✅ No Global State Pollution

- Node states are scoped to executions
- Completing Trigger A doesn't affect Trigger B's node states
- Perfect isolation

## Migration Strategy

1. **Create new services** (ExecutionContextManager, ExecutionPathAnalyzer)
2. **Create new hook** (useExecutionContext)
3. **Update WorkflowStore** to use ExecutionContextManager
4. **Refactor useNodeExecution** to use useExecutionContext
5. **Update components** (CustomNode, BaseNodeWrapper) one by one
6. **Test each phase** before moving to next
7. **Remove old code** once migration complete

## Testing Checklist

- [ ] Single trigger execution shows correct loading states
- [ ] Multiple trigger executions don't interfere
- [ ] Trigger A nodes don't show loading when Trigger B runs
- [ ] Completed executions don't affect new executions
- [ ] Concurrent executions maintain separate states
- [ ] Node toolbars show correct state per execution
- [ ] Loading indicators accurate across all scenarios

---

**Status**: Ready to implement  
**Priority**: HIGH - Critical bug affecting user experience  
**Estimated Time**: 4-6 hours for complete rebuild
