# Design Document

## Overview

This design addresses the critical flow execution issues in the current workflow system. The main problems are: (1) nodes don't automatically cascade execution to connected downstream nodes, (2) there's no visual progress indication during execution, and (3) multiple triggers don't work independently. 

The solution involves enhancing the execution engine with proper flow control logic, implementing a visual execution state system, and creating independent trigger execution contexts.

## Architecture

### Current System Analysis

The existing system has:
- **ExecutionEngine**: Handles individual node execution but lacks flow control
- **WorkflowStore**: Manages execution state but doesn't track node-level progress
- **Node Connections**: Defined in workflow but not used for execution flow
- **Real-time Updates**: Socket-based but limited to overall execution status

### Enhanced Flow Execution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  WorkflowEditor → ExecutionProgressUI → NodeStatusDisplay   │
│       ↓               ↓                      ↓              │
│  FlowController → ProgressTracker → StatusManager           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Flow Engine                      │
├─────────────────────────────────────────────────────────────┤
│  FlowExecutionEngine → DependencyResolver → ProgressBroadcaster │
│         ↓                    ↓                    ↓         │
│  ExecutionContext → NodeQueue → StatusTracker               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node Execution Layer                        │
├─────────────────────────────────────────────────────────────┤
│  NodeExecutor → ResultProcessor → FlowContinuation          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Flow Execution Engine

#### FlowExecutionEngine
```typescript
interface FlowExecutionEngine {
  executeFromNode(nodeId: string, executionContext: ExecutionContext): Promise<FlowExecutionResult>
  executeFromTrigger(triggerId: string, triggerData: any): Promise<FlowExecutionResult>
  cancelExecution(executionId: string): Promise<void>
  pauseExecution(executionId: string): Promise<void>
  resumeExecution(executionId: string): Promise<void>
  getExecutionStatus(executionId: string): ExecutionFlowStatus
}

interface ExecutionContext {
  executionId: string
  workflowId: string
  userId: string
  triggerNodeId?: string
  triggerData?: any
  executionOptions: ExecutionOptions
  nodeStates: Map<string, NodeExecutionState>
  executionPath: string[]
  startTime: number
}

interface FlowExecutionResult {
  executionId: string
  status: 'completed' | 'failed' | 'cancelled' | 'partial'
  executedNodes: string[]
  failedNodes: string[]
  executionPath: string[]
  totalDuration: number
  nodeResults: Map<string, NodeExecutionResult>
}
```

#### DependencyResolver
```typescript
interface DependencyResolver {
  getExecutableNodes(workflowNodes: WorkflowNode[], connections: WorkflowConnection[], completedNodes: Set<string>): string[]
  getDependencies(nodeId: string, connections: WorkflowConnection[]): string[]
  getDownstreamNodes(nodeId: string, connections: WorkflowConnection[]): string[]
  validateExecutionPath(nodes: WorkflowNode[], connections: WorkflowConnection[]): ValidationResult
  detectCircularDependencies(connections: WorkflowConnection[]): CircularDependency[]
}

interface CircularDependency {
  nodes: string[]
  path: string[]
  severity: 'warning' | 'error'
}
```

### 2. Visual Progress System

#### NodeExecutionState
```typescript
enum NodeExecutionStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

interface NodeExecutionState {
  nodeId: string
  status: NodeExecutionStatus
  startTime?: number
  endTime?: number
  duration?: number
  progress?: number
  error?: ExecutionError
  inputData?: any
  outputData?: any
  dependencies: string[]
  dependents: string[]
}

interface ExecutionFlowStatus {
  executionId: string
  overallStatus: 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  nodeStates: Map<string, NodeExecutionState>
  currentlyExecuting: string[]
  completedNodes: string[]
  failedNodes: string[]
  queuedNodes: string[]
  executionPath: string[]
  estimatedTimeRemaining?: number
}
```

#### ProgressTracker
```typescript
interface ProgressTracker {
  updateNodeStatus(executionId: string, nodeId: string, status: NodeExecutionStatus, data?: any): void
  calculateOverallProgress(nodeStates: Map<string, NodeExecutionState>): number
  estimateTimeRemaining(nodeStates: Map<string, NodeExecutionState>, executionHistory: ExecutionHistory[]): number
  getExecutionMetrics(executionId: string): ExecutionMetrics
}

interface ExecutionMetrics {
  totalNodes: number
  completedNodes: number
  failedNodes: number
  averageNodeDuration: number
  longestRunningNode: string
  bottleneckNodes: string[]
  parallelismUtilization: number
}
```

### 3. Independent Trigger System

#### TriggerExecutionContext
```typescript
interface TriggerExecutionContext extends ExecutionContext {
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event'
  triggerNodeId: string
  isolatedExecution: boolean
  affectedNodes: Set<string>
  parallelTriggers: string[]
}

interface TriggerManager {
  executeTrigger(triggerId: string, triggerData: any, options?: TriggerOptions): Promise<string>
  getActiveTriggers(workflowId: string): ActiveTrigger[]
  cancelTriggerExecution(executionId: string): Promise<void>
  getTriggerExecutionStatus(executionId: string): TriggerExecutionStatus
}

interface TriggerOptions {
  isolateExecution?: boolean
  skipDependencyCheck?: boolean
  overrideRunningExecution?: boolean
  executionTimeout?: number
}

interface ActiveTrigger {
  triggerId: string
  executionId: string
  startTime: number
  affectedNodes: string[]
  status: 'running' | 'completed' | 'failed'
}
```

### 4. Enhanced Frontend State Management

#### FlowExecutionState
```typescript
interface FlowExecutionState {
  activeExecutions: Map<string, ExecutionFlowStatus>
  nodeVisualStates: Map<string, NodeVisualState>
  executionHistory: ExecutionHistoryEntry[]
  realTimeUpdates: boolean
  selectedExecution?: string
}

interface NodeVisualState {
  nodeId: string
  status: NodeExecutionStatus
  progress: number
  animationState: 'idle' | 'pulsing' | 'spinning' | 'success' | 'error'
  lastUpdated: number
  executionTime?: number
  errorMessage?: string
}

interface ExecutionHistoryEntry {
  executionId: string
  workflowId: string
  triggerType: string
  startTime: number
  endTime?: number
  status: string
  executedNodes: string[]
  executionPath: string[]
  metrics: ExecutionMetrics
}
```

## Data Models

### 1. Enhanced Execution Tracking

#### Flow Execution Table
```sql
CREATE TABLE FlowExecution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES Workflow(id) ON DELETE CASCADE,
  trigger_node_id VARCHAR(255),
  trigger_type VARCHAR(50) NOT NULL,
  trigger_data JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  execution_path TEXT[],
  affected_nodes TEXT[],
  parallel_executions UUID[],
  user_id UUID REFERENCES User(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flow_execution_workflow ON FlowExecution(workflow_id);
CREATE INDEX idx_flow_execution_status ON FlowExecution(status);
CREATE INDEX idx_flow_execution_trigger ON FlowExecution(trigger_node_id);
```

#### Node Execution State Table
```sql
CREATE TABLE NodeExecutionState (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_execution_id UUID REFERENCES FlowExecution(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration INTEGER,
  progress INTEGER DEFAULT 0,
  input_data JSONB,
  output_data JSONB,
  error_details JSONB,
  dependencies TEXT[],
  dependents TEXT[],
  execution_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_node_execution_state_flow ON NodeExecutionState(flow_execution_id);
CREATE INDEX idx_node_execution_state_node ON NodeExecutionState(node_id);
CREATE INDEX idx_node_execution_state_status ON NodeExecutionState(status);
```

### 2. Execution Dependencies

#### Execution Dependencies Table
```sql
CREATE TABLE ExecutionDependency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_execution_id UUID REFERENCES FlowExecution(id) ON DELETE CASCADE,
  dependent_node_id VARCHAR(255) NOT NULL,
  dependency_node_id VARCHAR(255) NOT NULL,
  dependency_type VARCHAR(20) DEFAULT 'sequential',
  is_satisfied BOOLEAN DEFAULT FALSE,
  satisfied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execution_dependency_flow ON ExecutionDependency(flow_execution_id);
CREATE INDEX idx_execution_dependency_dependent ON ExecutionDependency(dependent_node_id);
CREATE INDEX idx_execution_dependency_dependency ON ExecutionDependency(dependency_node_id);
```

## Error Handling

### 1. Flow Execution Errors

#### Flow Control Errors
```typescript
enum FlowExecutionErrorType {
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
  NODE_EXECUTION_FAILED = 'NODE_EXECUTION_FAILED',
  INVALID_FLOW_STATE = 'INVALID_FLOW_STATE',
  CONCURRENT_EXECUTION_CONFLICT = 'CONCURRENT_EXECUTION_CONFLICT'
}

interface FlowExecutionError extends ExecutionError {
  flowErrorType: FlowExecutionErrorType
  affectedNodes: string[]
  executionPath: string[]
  dependencyChain?: string[]
  suggestedResolution: string
}
```

#### Recovery Strategies
```typescript
interface FlowRecoveryStrategy {
  continueOnNodeFailure: boolean
  skipFailedBranches: boolean
  retryFailedNodes: boolean
  maxRetryAttempts: number
  fallbackToPartialExecution: boolean
}

interface FlowRecoveryAction {
  type: 'retry' | 'skip' | 'abort' | 'continue'
  targetNodes: string[]
  parameters?: Record<string, any>
  reason: string
}
```

### 2. Dependency Resolution Errors

#### Dependency Validation
```typescript
interface DependencyValidationResult {
  isValid: boolean
  errors: DependencyError[]
  warnings: DependencyWarning[]
  circularDependencies: CircularDependency[]
  unreachableNodes: string[]
  orphanedNodes: string[]
}

interface DependencyError {
  type: 'circular' | 'missing' | 'invalid'
  nodes: string[]
  message: string
  severity: 'error' | 'warning'
}
```

## Testing Strategy

### 1. Flow Execution Testing

#### Unit Tests
```typescript
interface FlowExecutionTestSuite {
  testLinearFlow(): Promise<TestResult>
  testParallelFlow(): Promise<TestResult>
  testConditionalFlow(): Promise<TestResult>
  testMergeFlow(): Promise<TestResult>
  testCircularDependencyDetection(): Promise<TestResult>
  testNodeFailureHandling(): Promise<TestResult>
  testExecutionCancellation(): Promise<TestResult>
}
```

#### Integration Tests
```typescript
interface FlowIntegrationTestSuite {
  testMultipleTriggerExecution(): Promise<TestResult>
  testConcurrentFlowExecution(): Promise<TestResult>
  testLongRunningFlowExecution(): Promise<TestResult>
  testFlowExecutionRecovery(): Promise<TestResult>
  testRealTimeProgressUpdates(): Promise<TestResult>
}
```

### 2. Visual Progress Testing

#### UI Component Tests
```typescript
interface ProgressUITestSuite {
  testNodeStatusVisualization(): Promise<TestResult>
  testProgressAnimations(): Promise<TestResult>
  testExecutionTimeline(): Promise<TestResult>
  testErrorStateDisplay(): Promise<TestResult>
  testRealTimeUpdates(): Promise<TestResult>
}
```

### 3. Performance Testing

#### Flow Performance Tests
```typescript
interface FlowPerformanceTestSuite {
  testLargeWorkflowExecution(nodeCount: number): Promise<PerformanceResult>
  testHighConcurrencyExecution(concurrentFlows: number): Promise<PerformanceResult>
  testMemoryUsageDuringExecution(): Promise<ResourceUsageResult>
  testExecutionLatency(): Promise<LatencyResult>
}
```

## Implementation Phases

### Phase 1: Core Flow Control (Requirements 1, 4)
1. Implement FlowExecutionEngine with dependency resolution
2. Add automatic cascade execution for connected nodes
3. Create circular dependency detection and prevention
4. Update ExecutionService to use flow-based execution

### Phase 2: Visual Progress System (Requirement 2)
1. Implement NodeExecutionState tracking
2. Add real-time progress updates via WebSocket
3. Create visual progress indicators in WorkflowEditor
4. Add execution timeline and metrics display

### Phase 3: Independent Trigger System (Requirement 3)
1. Implement TriggerExecutionContext for isolated execution
2. Add support for multiple concurrent trigger executions
3. Create trigger management and coordination logic
4. Update frontend to handle multiple active executions

### Phase 4: Execution State Management (Requirement 5)
1. Add execution pause/resume functionality
2. Implement execution cancellation with proper cleanup
3. Create execution state persistence and recovery
4. Add timeout handling and manual intervention options

### Phase 5: Execution History and Debugging (Requirement 6)
1. Implement comprehensive execution logging
2. Add execution path tracking and visualization
3. Create debugging tools for flow analysis
4. Add performance metrics and bottleneck detection

## Security Considerations

### 1. Execution Isolation
- Ensure trigger executions don't interfere with each other
- Implement proper resource isolation between concurrent flows
- Prevent execution state tampering or unauthorized access

### 2. Resource Management
- Limit concurrent executions per user/workflow
- Implement memory and CPU usage monitoring
- Add execution timeout enforcement to prevent runaway processes

### 3. Data Security
- Ensure node output data is properly isolated between executions
- Implement secure data passing between nodes
- Add audit logging for all execution state changes

## Performance Considerations

### 1. Execution Efficiency
- Optimize dependency resolution algorithms
- Implement efficient node queuing and scheduling
- Use connection pooling for database operations

### 2. Real-time Updates
- Minimize WebSocket message frequency and size
- Implement efficient state diffing for progress updates
- Use batching for multiple simultaneous node updates

### 3. Memory Management
- Clean up completed execution states after retention period
- Implement streaming for large node output data
- Use efficient data structures for execution tracking