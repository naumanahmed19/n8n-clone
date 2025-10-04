# WorkflowCalled Node Implementation Fix

## Date: October 4, 2025

## Issue Summary
The `WorkflowCalled` node was failing with "Node type not found: workflow-called" error when triggered by the `WorkflowTrigger` node, even though the node was registered and active in the database.

## Root Cause
**Race Condition in NodeService**: The `NodeService.executeNode()` method was trying to access nodes from the in-memory `nodeRegistry` before the asynchronous initialization completed. This caused intermittent failures, especially on server startup or when executing workflows quickly.

## Fixes Applied

### 1. Fixed Race Condition in NodeService (Critical Fix)
**File**: `backend/src/services/NodeService.ts`

Added `await this.waitForInitialization()` to ensure nodes are loaded before execution:

```typescript
async executeNode(...) {
  // Wait for built-in nodes to be initialized before executing
  await this.waitForInitialization();
  
  const nodeDefinition = this.nodeRegistry.get(nodeType);
  if (!nodeDefinition) {
    throw new Error(`Node type not found: ${nodeType}`);
  }
  // ... rest of the method
}

async getNodeSchema(nodeType: string) {
  // Wait for built-in nodes to be initialized before accessing registry
  await this.waitForInitialization();
  
  const nodeDefinition = this.nodeRegistry.get(nodeType);
  // ... rest of the method
}
```

### 2. Fixed Trigger Data Format
**File**: `backend/src/services/FlowExecutionEngine.ts`

Updated trigger data wrapping to match expected node input format:

```typescript
// Before
inputData.main = [[context.triggerData]];

// After
inputData.main = [[{ json: context.triggerData }]];
```

This ensures the `WorkflowCalled` node receives data in the correct format: `inputData.main[0][0].json`

### 3. Fixed Error Serialization
**File**: `backend/src/services/ExecutionService.ts`

Properly serialize Error objects before saving to database:

```typescript
// Serialize error properly for database storage
let errorData = undefined;
if (nodeResult.error) {
  if (nodeResult.error instanceof Error) {
    errorData = {
      message: nodeResult.error.message,
      name: nodeResult.error.name,
      stack: nodeResult.error.stack,
    };
  } else if (typeof nodeResult.error === "object") {
    errorData = nodeResult.error;
  } else {
    errorData = { message: String(nodeResult.error) };
  }
}
```

### 4. Added Frontend Validation
**File**: `frontend/src/stores/workflow.ts`

Added parameter validation before node execution to catch missing required fields early:

```typescript
// Validate required parameters before execution
const validation = NodeValidator.validateNode(
  node,
  nodeTypeDefinition.properties
);

if (!validation.isValid) {
  const errorMessage = NodeValidator.formatValidationMessage(
    validation.errors
  );
  const detailedErrors = validation.errors
    .map((e) => `- ${e.message}`)
    .join("\n");

  throw new Error(
    `Cannot execute node: ${errorMessage}\n\n${detailedErrors}`
  );
}
```

## Testing Results

### Before Fix
```json
{
  "error": "Node type not found: workflow-called",
  "status": "ERROR"
}
```

### After Fix
```json
{
  "status": "SUCCESS",
  "result": {
    "message": "Workflow executed successfully",
    "executionDetails": {
      "status": "SUCCESS",
      "nodeExecutions": [
        {
          "nodeId": "node-1759583098742",
          "status": "SUCCESS",
          "outputData": {
            "main": [{
              "json": {
                "message": "This workflow was triggered by another workflow",
                "triggerType": "workflow-called",
                "receivedData": { ... }
              }
            }]
          }
        }
      ]
    }
  }
}
```

## Verification

Run the node status command to verify registration:
```bash
npm run nodes:status
```

Should show:
```
✅ Called by Workflow (workflow-called)
   Receives data when this workflow is called by another workflow
```

## Impact
- ✅ WorkflowTrigger → WorkflowCalled communication now works reliably
- ✅ No more "Node type not found" errors
- ✅ Proper error messages are displayed when they occur
- ✅ Better validation prevents execution with missing parameters
- ✅ Trigger data is properly passed between workflows

## Related Files Modified
1. `backend/src/services/NodeService.ts` - Added initialization wait (Critical)
2. `backend/src/services/FlowExecutionEngine.ts` - Fixed trigger data format
3. `backend/src/services/ExecutionService.ts` - Fixed error serialization
4. `frontend/src/stores/workflow.ts` - Added parameter validation

## Notes
- The fix ensures thread-safe access to the node registry
- All node executions now wait for proper initialization
- The solution is backward compatible with existing workflows
- No database schema changes required
