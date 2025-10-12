# Multiple Triggers Output Preservation Fix

## Problem Summary

When having multiple trigger nodes (chat nodes, webhooks, etc.) in a workflow:

- Triggering the first node → Execution 1 completes → Outputs stored
- Triggering the second node → **Outputs from Execution 1 are cleared** → Connected nodes receive empty inputs
- Result: Only the most recently triggered workflow path has outputs; previous paths lose their data

## Root Cause

### The Issue

In `frontend/src/stores/workflow.ts`, when starting a new workflow execution, the code was clearing `realTimeResults`:

```typescript
// OLD CODE - Line ~1030
if (mode === "workflow") {
  get().clearExecutionLogs();
  set({ realTimeResults: new Map() }); // ❌ This clears ALL previous execution results!
}
```

### Why This Breaks Multiple Triggers

#### Execution Timeline

1. **User sends message in Chat Node 1**

   - Chat Node 1 executes → OpenAI node executes
   - Results stored: `realTimeResults.set("node-openai-1", { data: {...} })`
   - OpenAI output is available for display

2. **User sends message in Chat Node 2**

   - `realTimeResults.clear()` is called ← **ALL PREVIOUS RESULTS DELETED**
   - Chat Node 2 executes → Anthropic node executes
   - Results stored: `realTimeResults.set("node-anthropic-1", { data: {...} })`
   - OpenAI output from Chat Node 1 is **GONE**

3. **User tries to view Chat Node 1's conversation**
   - Tries to get OpenAI response from `realTimeResults`
   - Returns `undefined` because it was cleared
   - Chat shows empty response

### The Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ realTimeResults: Map<nodeId, NodeExecutionResult>          │
├─────────────────────────────────────────────────────────────┤
│ After Chat Node 1 execution:                                │
│   ├─ "node-chat-1": { status: "success", data: {...} }     │
│   └─ "node-openai-1": { status: "success", data: {...} }   │
│                                                             │
│ ❌ Starting Chat Node 2 execution:                          │
│   realTimeResults.clear() ← ALL DATA LOST                   │
│                                                             │
│ After Chat Node 2 execution:                                │
│   ├─ "node-chat-2": { status: "success", data: {...} }     │
│   └─ "node-anthropic-1": { status: "success", data: {...} }│
└─────────────────────────────────────────────────────────────┘
```

## Solution

### Code Change

**File**: `frontend/src/stores/workflow.ts` (Line ~1030)

```typescript
// NEW CODE - Preserves previous execution results
if (mode === "workflow") {
  // Clear execution logs but DON'T clear realTimeResults
  // We keep previous execution results so multiple triggers can maintain their outputs
  get().clearExecutionLogs();

  // NOTE: We intentionally DON'T clear realTimeResults here anymore
  // This allows multiple triggers to maintain their execution outputs independently
  // Results will be updated/overwritten per node as new executions complete
  // set({ realTimeResults: new Map() }); // REMOVED
}
```

### How It Works Now

#### New Execution Timeline

1. **User sends message in Chat Node 1**

   - Chat Node 1 executes → OpenAI node executes
   - Results stored: `realTimeResults.set("node-openai-1", { data: {...} })`
   - ✅ OpenAI output is available

2. **User sends message in Chat Node 2**

   - **Results from Chat Node 1 are PRESERVED** ✅
   - Chat Node 2 executes → Anthropic node executes
   - Results stored: `realTimeResults.set("node-anthropic-1", { data: {...} })`
   - ✅ Both OpenAI and Anthropic outputs are available

3. **User views either chat node**
   - Chat Node 1 → Retrieves OpenAI response from `realTimeResults`
   - Chat Node 2 → Retrieves Anthropic response from `realTimeResults`
   - ✅ Both show their respective AI responses

### Data Flow After Fix

```
┌─────────────────────────────────────────────────────────────┐
│ realTimeResults: Map<nodeId, NodeExecutionResult>          │
├─────────────────────────────────────────────────────────────┤
│ After Chat Node 1 execution:                                │
│   ├─ "node-chat-1": { status: "success", data: {...} }     │
│   └─ "node-openai-1": { status: "success", data: {...} }   │
│                                                             │
│ ✅ Starting Chat Node 2 execution:                          │
│   Results from Chat Node 1 PRESERVED                        │
│                                                             │
│ After Chat Node 2 execution:                                │
│   ├─ "node-chat-1": { status: "success", data: {...} }     │ ← Preserved
│   ├─ "node-openai-1": { status: "success", data: {...} }   │ ← Preserved
│   ├─ "node-chat-2": { status: "success", data: {...} }     │ ← New
│   └─ "node-anthropic-1": { status: "success", data: {...} }│ ← New
└─────────────────────────────────────────────────────────────┘
```

## Result Retrieval Logic

The store uses a fallback chain to get node execution results:

```typescript
getNodeExecutionResult: (nodeId: string) => {
  // 1. Check for pinned mock data (highest priority)
  if (node.mockData && node.mockDataPinned) {
    return mockDataAsResult;
  }

  // 2. Check realTimeResults (active/recent executions)
  const realTimeResult = get().realTimeResults.get(nodeId);
  if (realTimeResult) {
    return realTimeResult; // ✅ Now returns results from ANY execution
  }

  // 3. Fall back to persistentNodeResults (old executions)
  const persistentResult = get().persistentNodeResults.get(nodeId);
  if (persistentResult) {
    return persistentResult;
  }

  return undefined;
};
```

## Benefits

### ✅ Multiple Triggers Work Independently

- Each trigger can execute its workflow path
- Outputs from all triggers are maintained
- No interference between different execution paths

### ✅ Connected Nodes Get Correct Inputs

- When a node executes, it can find outputs from its connected source nodes
- Input data gathering works across different trigger executions
- No "empty input" errors

### ✅ UI Shows All Results

- Chat nodes display their conversation histories correctly
- All node execution results are visible
- Status indicators reflect actual execution state

### ✅ Memory Management

- Results naturally get overwritten when the same node executes again
- Old results are moved to `persistentNodeResults` when execution completes
- No memory leaks from accumulating results

## Edge Cases Handled

### Same Node Executed Multiple Times

```typescript
// First execution of node-openai-1
realTimeResults.set("node-openai-1", { data: "First response" });

// Second execution of node-openai-1
realTimeResults.set("node-openai-1", { data: "Second response" }); // Overwrites
```

✅ Latest execution result takes precedence

### Node in Multiple Execution Paths

If a node is shared between multiple trigger paths:

```typescript
Chat Node 1 → Shared Node → OpenAI
Chat Node 2 → Shared Node → Anthropic
```

✅ Shared Node's most recent execution result is used by both paths

### Execution Cleanup

When an execution completes and unsubscribes:

```typescript
clearExecutionState: (preserveLogs = true) => {
  // Move realTimeResults to persistentNodeResults
  currentRealTimeResults.forEach((result, nodeId) => {
    updatedPersistentResults.set(nodeId, result);
  });

  // Then clear realTimeResults
  set({ realTimeResults: new Map() });
};
```

✅ Results are preserved in `persistentNodeResults` before clearing

## Testing Scenarios

### ✅ Test 1: Two Chat Nodes with Different AI Providers

1. Create workflow with Chat Node 1 → OpenAI
2. Create workflow with Chat Node 2 → Anthropic
3. Send message in Chat Node 1 → Verify OpenAI response appears
4. Send message in Chat Node 2 → Verify Anthropic response appears
5. Check Chat Node 1 → **Verify OpenAI response is still there** ✅

### ✅ Test 2: Webhook Triggers with Different Endpoints

1. Create Webhook 1 → Node A → Node B
2. Create Webhook 2 → Node C → Node D
3. Trigger Webhook 1 → Verify Node A and B execute and show outputs
4. Trigger Webhook 2 → Verify Node C and D execute and show outputs
5. Check Node A → **Verify output is still there** ✅

### ✅ Test 3: Manual Triggers

1. Create Manual Trigger 1 → Transform Node 1
2. Create Manual Trigger 2 → Transform Node 2
3. Execute Trigger 1 → Verify Transform Node 1 output
4. Execute Trigger 2 → Verify Transform Node 2 output
5. View both transforms → **Both show their outputs** ✅

## Related Fixes

This fix works in conjunction with:

1. **CHAT_NODE_MULTIPLE_INSTANCES_FINAL_FIX.md** - Ensures chat nodes filter executions by `triggerNodeId`
2. Backend trigger recognition - Chat nodes recognized as valid trigger nodes
3. Infinite loop prevention - Processing flags prevent re-execution issues

## Files Modified

- `frontend/src/stores/workflow.ts` (Line ~1030)
  - Removed `set({ realTimeResults: new Map() })` from workflow execution start
  - Added explanatory comments about preserving results

## Migration Notes

### No Breaking Changes

- Existing workflows continue to work
- Results are still cleared when calling `clearExecutionState()`
- Persistent results mechanism unchanged

### Memory Considerations

- `realTimeResults` may contain more entries now (multiple execution paths)
- This is expected and necessary for multiple triggers
- Memory is managed through the existing `persistentNodeResults` mechanism
- Cleanup happens when executions complete

## Date: October 12, 2025
