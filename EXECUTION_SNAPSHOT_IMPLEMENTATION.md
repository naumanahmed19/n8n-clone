# Execution Snapshot Implementation

## Problem

When viewing an execution, the system was displaying the **current workflow state** instead of the **workflow state at the time of execution**. This meant that if you modified nodes after an execution, the execution view would show the modified workflow, not what actually ran.

## Solution

Implemented workflow snapshot capture to store the workflow state (nodes, connections, settings) at the time of execution.

## Changes Made

### 1. Database Schema (backend/prisma/schema.prisma)

Added three new fields to the `Execution` model:

- `workflowSnapshot` (Json?) - Stores the complete workflow state at execution time
- `snapshotVersion` (String?) - Version tracking for future use
- `snapshotHash` (String?) - Hash of workflow structure for comparison

```prisma
model Execution {
  // ... existing fields ...
  workflowSnapshot    Json?                // Workflow state at execution time
  snapshotVersion     String?              // Snapshot version for tracking
  snapshotHash        String?              // Hash of workflow structure
}
```

### 2. Backend - ExecutionService (backend/src/services/ExecutionService.ts)

#### Modified `createFlowExecutionRecord` method

Now accepts and stores workflow snapshot:

```typescript
private async createFlowExecutionRecord(
  flowResult: FlowExecutionResult,
  workflowId: string,
  userId: string,
  triggerData?: any,
  workflowSnapshot?: { nodes: any[]; connections: any[]; settings?: any }
): Promise<any>
```

#### Updated execution creation calls

All places where executions are created now pass the workflow snapshot:

- `executeWorkflow()` - Passes parsed workflow data
- `executeFromNode()` - Passes parsed workflow data
- `executeSingleNode()` - Passes workflow data or nodes array

### 3. Frontend - Execution Details Service (frontend/src/services/execution.ts)

Updated `ExecutionDetails` interface to include workflow snapshot:

```typescript
export interface ExecutionDetails {
  // ... existing fields ...
  workflowSnapshot?: {
    nodes: any[];
    connections: any[];
    settings?: any;
  };
}
```

### 4. Frontend - WorkflowEditorPage (frontend/src/pages/WorkflowEditorPage.tsx)

Enhanced execution loading logic to use workflow snapshot:

```typescript
// When loading execution with snapshot
if (executionData.workflowSnapshot) {
  const snapshotWorkflow: Workflow = {
    id: executionData.workflowId,
    nodes: executionData.workflowSnapshot.nodes,
    connections: executionData.workflowSnapshot.connections,
    settings: executionData.workflowSnapshot.settings,
    // ... other metadata from current workflow
  };
  setWorkflow(snapshotWorkflow);
}
```

## How It Works

### During Execution

1. User triggers workflow execution (via manual trigger or node execution in workflow mode)
2. `ExecutionService.executeWorkflow()` or `executeSingleNode()` is called
3. Current workflow data (nodes, connections, settings) is captured
4. Execution proceeds normally
5. When creating the execution record, the snapshot is saved alongside execution results

### When Viewing Execution

1. User navigates to execution view (e.g., `/workflow/:id/execution/:executionId`)
2. Frontend loads execution details including `workflowSnapshot`
3. If snapshot exists, it's used to reconstruct the workflow state
4. Workflow editor displays the snapshot, showing exact state at execution time
5. Node execution results overlay on the snapshot nodes

## Benefits

### ✅ Accurate Historical View

- Executions now show exactly what ran, not the current state
- Can modify workflow without affecting past execution views

### ✅ Debugging & Troubleshooting

- Compare what ran vs what exists now
- Identify if changes caused new issues
- Track workflow evolution

### ✅ Compliance & Audit Trail

- Complete record of what executed
- Immutable execution history
- Prove exactly what configuration was used

### ✅ Backward Compatible

- Existing executions without snapshots still work
- Snapshot is optional (null for old executions)
- Gracefully falls back to current workflow if snapshot missing

## Testing

### Test Case 1: New Execution with Snapshot

1. Create a workflow with 2-3 nodes
2. Execute the workflow
3. Verify execution is created with `workflowSnapshot` populated
4. Modify the workflow (add/remove/change nodes)
5. View the execution
6. Verify execution view shows original workflow state, not modified state

### Test Case 2: Old Execution without Snapshot

1. View an old execution (created before this change)
2. Verify it loads correctly (falls back to current workflow)
3. No errors should occur

### Test Case 3: Single Node Execution

1. Execute a single node in "workflow" mode
2. Verify snapshot is captured
3. View execution
4. Verify correct workflow state is shown

## Database Migration

Migration created: `20251005220111_add_workflow_snapshot`

- Adds `workflowSnapshot`, `snapshotVersion`, `snapshotHash` columns
- All nullable to maintain backward compatibility
- No data migration needed for existing executions

## Future Enhancements

### Phase 1 (Completed)

- ✅ Capture workflow snapshot at execution time
- ✅ Store in execution record
- ✅ Display snapshot in execution view

### Phase 2 (Future)

- [ ] Calculate and store snapshot hash for comparison
- [ ] Implement snapshot versioning
- [ ] Add snapshot comparison UI (diff view)
- [ ] Snapshot compression for large workflows

### Phase 3 (Future)

- [ ] Dedicated ExecutionSnapshot table (as per EXECUTION_SNAPSHOT_PLAN.md)
- [ ] Full git-like versioning system
- [ ] Execution replay capability
- [ ] Snapshot annotations and tags

## Related Files

### Modified

- `backend/prisma/schema.prisma` - Added snapshot fields
- `backend/src/services/ExecutionService.ts` - Capture and store snapshots
- `frontend/src/services/execution.ts` - ExecutionDetails interface
- `frontend/src/pages/WorkflowEditorPage.tsx` - Load and display snapshots

### Created

- `backend/prisma/migrations/20251005220111_add_workflow_snapshot/` - Database migration
- `EXECUTION_SNAPSHOT_IMPLEMENTATION.md` - This file

## References

- See `EXECUTION_SNAPSHOT_PLAN.md` for complete feature roadmap
- See `docs/execution-system/` for execution system documentation
