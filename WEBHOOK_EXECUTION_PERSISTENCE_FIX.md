# Webhook Execution Persistence & Socket Events Fix

## Problem

Webhook triggers were executing workflows successfully, but:

1. ❌ Executions were not being saved to the database
2. ❌ No socket messages were being sent to the frontend
3. ❌ Users couldn't see execution history or real-time updates

## Root Cause

The `TriggerManager` was using `FlowExecutionEngine` directly, which only executes workflows in memory without persisting results. The flow was:

```
Webhook Request → TriggerService → TriggerManager → FlowExecutionEngine → ✅ Execution (in memory only)
                                                                         → ❌ No database save
                                                                         → ❌ No socket events
```

## Solution

Enhanced `TriggerManager` to save execution results to the database and emit socket events after workflow completion.

### Changes Made

#### 1. Modified `TriggerManager.handleTriggerCompletion()` (backend/src/services/TriggerManager.ts)

Added database persistence and socket event emission:

```typescript
private async handleTriggerCompletion(
  context: TriggerExecutionContext,
  result: FlowExecutionResult
): Promise<void> {
  // ... existing cleanup code ...

  // Save execution to database
  try {
    await this.saveExecutionToDatabase(context, result);
  } catch (error) {
    logger.error("Failed to save execution to database", {
      executionId: context.executionId,
      error,
    });
  }

  // Emit socket event for real-time updates
  try {
    this.socketService.emitToUser(context.userId, "executionCompleted", {
      executionId: context.executionId,
      workflowId: context.workflowId,
      status: result.status,
      duration: Date.now() - context.startTime,
    });
  } catch (error) {
    logger.error("Failed to emit socket event", {
      executionId: context.executionId,
      error,
    });
  }

  // ... rest of completion handling ...
}
```

#### 2. Added `TriggerManager.saveExecutionToDatabase()` method

New private method that mirrors the functionality in `ExecutionService.createFlowExecutionRecord()`:

```typescript
private async saveExecutionToDatabase(
  context: TriggerExecutionContext,
  result: FlowExecutionResult
): Promise<void> {
  // Map flow status to execution status
  let executionStatus: "SUCCESS" | "ERROR" | "CANCELLED" | "RUNNING";
  switch (result.status) {
    case "completed": executionStatus = "SUCCESS"; break;
    case "failed": executionStatus = "ERROR"; break;
    case "cancelled": executionStatus = "CANCELLED"; break;
    case "partial": executionStatus = "ERROR"; break;
    default: executionStatus = "ERROR";
  }

  // Load workflow for snapshot
  const workflow = await this.loadWorkflow(context.workflowId);

  // Create main execution record
  await this.prisma.execution.create({
    data: {
      id: result.executionId,
      workflowId: context.workflowId,
      status: executionStatus,
      startedAt: new Date(context.startTime),
      finishedAt: new Date(),
      triggerData: context.triggerData || undefined,
      workflowSnapshot: workflow ? {
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
      } : undefined,
      error: (result.status === "failed" || result.status === "partial") ? {
        message: "Flow execution failed",
        failedNodes: result.failedNodes,
        executionPath: result.executionPath,
      } : undefined,
    },
  });

  // Create node execution records
  for (const [nodeId, nodeResult] of result.nodeResults) {
    let nodeStatus: "SUCCESS" | "ERROR" | "CANCELLED";
    switch (nodeResult.status) {
      case "completed": nodeStatus = "SUCCESS"; break;
      case "failed": nodeStatus = "ERROR"; break;
      case "cancelled": nodeStatus = "CANCELLED"; break;
      default: nodeStatus = "ERROR";
    }

    // Serialize error properly
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

    await this.prisma.nodeExecution.create({
      data: {
        id: `${result.executionId}_${nodeId}`,
        executionId: result.executionId,
        nodeId: nodeId,
        status: nodeStatus as any,
        startedAt: new Date(context.startTime),
        finishedAt: new Date(context.startTime + nodeResult.duration),
        inputData: {},
        outputData: nodeResult.data ? JSON.parse(JSON.stringify(nodeResult.data)) : undefined,
        error: errorData,
      },
    });
  }

  logger.info("Execution saved to database", {
    executionId: result.executionId,
    workflowId: context.workflowId,
    status: executionStatus,
  });
}
```

## What This Fixes

### ✅ Database Persistence

- Execution records are now saved to the `Execution` table
- Node execution details are saved to the `NodeExecution` table
- Workflow snapshots are stored for historical reference
- Errors and execution metadata are properly recorded

### ✅ Real-time Updates

- Socket events are emitted when executions complete
- Frontend can receive live updates about workflow execution status
- Users see execution progress in real-time

### ✅ Execution History

- Users can view past webhook executions in the execution history
- Execution details include trigger data, timestamps, and results
- Failed executions are properly logged with error information

## Updated Flow

```
Webhook Request → TriggerService → TriggerManager → FlowExecutionEngine → ✅ Execution
                                         ↓                                       ↓
                                         ↓                                       ↓
                                         ↓ ← handleTriggerCompletion ← ← ← ← ← ←
                                         ↓
                                         ├→ saveExecutionToDatabase() → ✅ Database record
                                         └→ socketService.emitToUser() → ✅ Real-time update
```

## Testing

After this fix, webhook executions should:

1. Appear in the execution history list
2. Show real-time status updates in the UI
3. Display detailed node execution information
4. Persist trigger data and workflow snapshots

## Related Files

- `backend/src/services/TriggerManager.ts` - Added persistence logic
- `backend/src/services/TriggerService.ts` - Webhook handling
- `backend/src/services/ExecutionService.ts` - Reference implementation

## Previous Fixes in This Session

1. Fixed missing `triggerNodeId` - TriggerManager was passing `triggerId` instead of `triggerNodeId`
2. Fixed webhook registration - Implemented singleton pattern and automatic trigger sync
3. Now: Fixed execution persistence and socket events

## Next Steps

- Test webhook execution and verify database records
- Check frontend receives socket events
- Verify execution history shows webhook executions
