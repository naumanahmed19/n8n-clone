# Execution Snapshot Implementation Plan

## Overview
Implement git-like versioning for workflow executions, capturing complete state snapshots including nodes, connections, errors, and execution states for each run.

## Current State Analysis

### ✅ Already Implemented:
1. **Execution Records** - Basic execution metadata
2. **Node Execution States** - Per-node status, progress, errors, input/output
3. **Flow Execution States** - Real-time node states during execution
4. **Execution History** - High-level execution summaries

### ❌ Missing for Git-Like Snapshots:
1. Complete workflow structure snapshot (nodes, connections, settings)
2. Version tracking and hashing
3. Immutable snapshot storage
4. Comparison/diff capability
5. Full context (variables, credentials references)
6. Replay capability

---

## Implementation Plan

### Phase 1: Database Schema Enhancement (Priority: High)

#### 1.1 Add ExecutionSnapshot Table

```prisma
model ExecutionSnapshot {
  id                String    @id @default(cuid())
  executionId       String    @unique
  workflowId        String
  snapshotVersion   String    // Semantic version: 1.0.0
  snapshotHash      String    // SHA-256 hash of workflow structure
  
  // Complete workflow structure at execution time
  workflowSnapshot  Json      // Full workflow: nodes, connections, settings
  nodesSnapshot     Json      // All node configurations
  connectionsSnapshot Json    // All connections
  settingsSnapshot  Json      // Workflow settings
  
  // Execution environment
  variablesSnapshot Json?     // Variables state (sanitized)
  credentialsRefs   Json?     // Credential references (not actual data)
  triggersSnapshot  Json?     // Trigger configurations
  
  // Metadata
  userId            String
  triggerType       String    // manual, webhook, schedule, etc.
  createdAt         DateTime  @default(now())
  
  // Relations
  execution         Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  
  @@index([executionId])
  @@index([workflowId])
  @@index([snapshotHash])
  @@index([createdAt])
  @@map("execution_snapshots")
}
```

#### 1.2 Enhance Existing Tables

**Update `Execution` table:**
```prisma
model Execution {
  // ... existing fields ...
  snapshotVersion   String?   // Reference to snapshot version
  snapshotHash      String?   // Quick reference to snapshot hash
  
  // Add relation
  snapshot          ExecutionSnapshot?
}
```

**Update `FlowExecutionState` table:**
Add immutability flag:
```prisma
model FlowExecutionState {
  // ... existing fields ...
  isSnapshot        Boolean   @default(false)  // Mark as immutable snapshot
  snapshotTakenAt   DateTime? // When snapshot was captured
}
```

---

### Phase 2: Snapshot Service Implementation (Priority: High)

#### 2.1 Create ExecutionSnapshotService

**File**: `backend/src/services/ExecutionSnapshotService.ts`

```typescript
export interface ExecutionSnapshotService {
  // Core snapshot operations
  captureSnapshot(
    executionId: string,
    workflow: Workflow,
    nodeStates: Map<string, NodeExecutionState>,
    variables?: any[],
    triggerType?: string
  ): Promise<ExecutionSnapshot>;
  
  getSnapshot(executionId: string): Promise<ExecutionSnapshot | null>;
  
  compareSnapshots(
    snapshotId1: string,
    snapshotId2: string
  ): Promise<SnapshotDiff>;
  
  // Version management
  generateSnapshotHash(workflow: Workflow): Promise<string>;
  
  getSnapshotVersion(workflowId: string): Promise<string>;
  
  // Replay capability
  validateSnapshotForReplay(snapshotId: string): Promise<ValidationResult>;
  
  prepareReplayContext(snapshotId: string): Promise<ReplayContext>;
}

export interface ExecutionSnapshot {
  id: string;
  executionId: string;
  workflowId: string;
  snapshotVersion: string;
  snapshotHash: string;
  workflowSnapshot: WorkflowSnapshot;
  nodesSnapshot: NodeSnapshot[];
  connectionsSnapshot: ConnectionSnapshot[];
  settingsSnapshot: WorkflowSettings;
  variablesSnapshot?: VariableSnapshot[];
  credentialsRefs?: CredentialReference[];
  triggersSnapshot?: TriggerSnapshot[];
  userId: string;
  triggerType: string;
  createdAt: Date;
}

export interface WorkflowSnapshot {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  nodes: any[];
  connections: any[];
  settings: any;
  version: string;
}

export interface NodeSnapshot {
  id: string;
  type: string;
  name: string;
  position: [number, number];
  parameters: any;
  credentials?: any;
  disabled?: boolean;
}

export interface SnapshotDiff {
  snapshotId1: string;
  snapshotId2: string;
  nodesAdded: string[];
  nodesRemoved: string[];
  nodesModified: NodeModification[];
  connectionsAdded: ConnectionSnapshot[];
  connectionsRemoved: ConnectionSnapshot[];
  settingsChanged: SettingChange[];
  variablesChanged: VariableChange[];
}
```

---

### Phase 3: Integration with Execution Flow (Priority: High)

#### 3.1 Modify ExecutionService

Update execution flow to capture snapshots:

```typescript
// In ExecutionService.executeWorkflow()
async executeWorkflow(...) {
  try {
    // ... existing execution setup ...
    
    // CAPTURE SNAPSHOT BEFORE EXECUTION
    const snapshot = await this.snapshotService.captureSnapshot(
      executionId,
      workflow,
      initialNodeStates,
      variables,
      triggerType
    );
    
    // Link snapshot to execution
    await this.prisma.execution.update({
      where: { id: executionId },
      data: {
        snapshotVersion: snapshot.snapshotVersion,
        snapshotHash: snapshot.snapshotHash
      }
    });
    
    // ... continue with execution ...
    
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 3.2 Enhance FlowExecutionEngine

```typescript
// After execution completes
async completeExecution(...) {
  // ... existing completion logic ...
  
  // CAPTURE FINAL STATE SNAPSHOT
  await this.snapshotService.updateSnapshotWithFinalState(
    executionId,
    finalNodeStates,
    executionResult
  );
  
  // Mark node states as immutable
  await this.persistenceService.markStatesAsSnapshot(executionId);
}
```

---

### Phase 4: Snapshot Retrieval & Comparison (Priority: Medium)

#### 4.1 Create Snapshot API Endpoints

**File**: `backend/src/routes/execution-snapshots.ts`

```typescript
// GET /api/execution-snapshots/:executionId
router.get('/:executionId', authenticateToken, async (req, res) => {
  const snapshot = await snapshotService.getSnapshot(executionId);
  // Return complete snapshot
});

// GET /api/execution-snapshots/:executionId/compare/:otherExecutionId
router.get('/:executionId/compare/:otherExecutionId', authenticateToken, async (req, res) => {
  const diff = await snapshotService.compareSnapshots(executionId, otherExecutionId);
  // Return detailed diff
});

// GET /api/execution-snapshots/:executionId/replay-context
router.get('/:executionId/replay-context', authenticateToken, async (req, res) => {
  const context = await snapshotService.prepareReplayContext(executionId);
  // Return context for replay
});

// GET /api/execution-snapshots/workflow/:workflowId/history
router.get('/workflow/:workflowId/history', authenticateToken, async (req, res) => {
  // Return all snapshots for a workflow (timeline view)
});
```

---

### Phase 5: Frontend Visualization (Priority: Medium)

#### 5.1 Snapshot Viewer Component

**File**: `frontend/src/components/execution/ExecutionSnapshotViewer.tsx`

Features:
- Display complete workflow state at execution time
- Show node-by-node execution results
- Highlight errors and failures
- Display execution timeline
- Visual comparison between snapshots

#### 5.2 Snapshot Comparison View

**File**: `frontend/src/components/execution/SnapshotComparison.tsx`

Features:
- Side-by-side workflow comparison
- Diff highlighting (added/removed/modified nodes)
- Parameter changes visualization
- Connection changes
- Settings differences

#### 5.3 Execution Timeline

**File**: `frontend/src/components/execution/ExecutionTimeline.tsx`

Features:
- Git-like commit history view
- Snapshot timeline for workflow
- Branch visualization (for different execution paths)
- Quick snapshot navigation

---

### Phase 6: Advanced Features (Priority: Low)

#### 6.1 Snapshot Compression

- Implement delta storage for similar snapshots
- Store only differences from previous snapshot
- Compress JSON data for large workflows

#### 6.2 Snapshot Tagging

```prisma
model SnapshotTag {
  id            String    @id @default(cuid())
  snapshotId    String
  tag           String    // "production", "testing", "baseline", etc.
  description   String?
  createdAt     DateTime  @default(now())
  
  @@index([snapshotId])
  @@index([tag])
}
```

#### 6.3 Execution Replay

- Reconstruct exact workflow state from snapshot
- Re-execute with same inputs
- Compare results with original execution

#### 6.4 Snapshot Annotations

```prisma
model SnapshotAnnotation {
  id            String    @id @default(cuid())
  snapshotId    String
  nodeId        String?   // Optional: annotation for specific node
  userId        String
  annotation    String
  type          String    // "note", "bug", "insight", etc.
  createdAt     DateTime  @default(now())
  
  @@index([snapshotId])
}
```

---

## Implementation Priority

### Must Have (Phase 1-3): 4-5 days
1. Database schema updates
2. ExecutionSnapshotService implementation
3. Integration with execution flow
4. Basic snapshot capture and retrieval

### Should Have (Phase 4): 2-3 days
1. Snapshot API endpoints
2. Comparison functionality
3. Snapshot history queries

### Nice to Have (Phase 5-6): 3-4 days
1. Frontend visualization components
2. Advanced features (compression, tagging, replay)
3. Annotations and collaboration features

---

## Benefits

### 1. **Complete Audit Trail**
- Every execution has immutable snapshot
- Full workflow state at execution time
- Can prove what was executed

### 2. **Debugging & Troubleshooting**
- Compare failed execution with successful one
- See exact configuration that caused error
- Track changes over time

### 3. **Compliance & Governance**
- Immutable execution records
- Complete audit trail
- Version tracking

### 4. **Development Workflow**
- Test and compare workflow versions
- Rollback to previous working state
- A/B testing different configurations

### 5. **Replay Capability**
- Re-run exact same execution
- Reproduce bugs reliably
- Test fixes against historical data

---

## Technical Considerations

### Storage Optimization
- Average workflow: ~50-200 KB JSON
- 1000 executions/day: ~50-200 MB/day
- Consider compression after 30 days
- Archive old snapshots to cold storage

### Query Performance
- Index on executionId, workflowId, snapshotHash
- Partition by date for large datasets
- Cache frequently accessed snapshots

### Data Privacy
- Sanitize sensitive data in snapshots
- Don't store actual credential values
- Store references only
- Implement data retention policies

### Backward Compatibility
- Make snapshot creation optional initially
- Gradual rollout with feature flag
- Existing executions work without snapshots

---

## Migration Strategy

1. **Create new tables** without breaking existing functionality
2. **Deploy snapshot service** with feature flag disabled
3. **Enable for new executions only** (phased rollout)
4. **Optionally backfill** recent executions if needed
5. **Monitor storage and performance**
6. **Gradually enable frontend features**

---

## Success Metrics

1. **100% snapshot capture rate** for new executions
2. **< 100ms overhead** for snapshot creation
3. **< 500ms query time** for snapshot retrieval
4. **Storage growth** within acceptable limits
5. **User adoption** of comparison and debugging features

---

## Next Steps

1. **Review and approve** this plan
2. **Create database migration** for new tables
3. **Implement ExecutionSnapshotService** core functionality
4. **Add snapshot capture** to execution flow
5. **Create API endpoints** for snapshot access
6. **Build basic frontend viewer**
7. **Test and validate** with real workflows
8. **Document** for users and developers

---

## Related Files to Modify

### Backend:
- `backend/prisma/schema.prisma` - Add new tables
- `backend/src/services/ExecutionSnapshotService.ts` - New service
- `backend/src/services/ExecutionService.ts` - Integration
- `backend/src/services/FlowExecutionEngine.ts` - Capture logic
- `backend/src/routes/execution-snapshots.ts` - New API endpoints
- `backend/src/types/snapshot.types.ts` - New types

### Frontend:
- `frontend/src/services/execution-snapshot.ts` - API client
- `frontend/src/components/execution/ExecutionSnapshotViewer.tsx` - Viewer
- `frontend/src/components/execution/SnapshotComparison.tsx` - Comparison
- `frontend/src/components/execution/ExecutionTimeline.tsx` - Timeline
- `frontend/src/stores/execution-snapshot.ts` - State management

### Documentation:
- `docs/execution-system/execution-snapshots.md` - Complete guide
- `docs/api/execution-snapshots.md` - API documentation

