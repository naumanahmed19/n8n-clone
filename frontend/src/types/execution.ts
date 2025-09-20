// Enhanced execution types for visual progress system

export enum NodeExecutionStatus {
  IDLE = "idle",
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SKIPPED = "skipped",
}

export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress?: number;
  error?: ExecutionError;
  inputData?: any;
  outputData?: any;
  dependencies: string[];
  dependents: string[];
}

export interface ExecutionError {
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

export interface ExecutionFlowStatus {
  executionId: string;
  overallStatus: "running" | "completed" | "failed" | "cancelled";
  progress: number;
  nodeStates: Map<string, NodeExecutionState>;
  currentlyExecuting: string[];
  completedNodes: string[];
  failedNodes: string[];
  queuedNodes: string[];
  executionPath: string[];
  estimatedTimeRemaining?: number;
}

export interface NodeVisualState {
  nodeId: string;
  status: NodeExecutionStatus;
  progress: number;
  animationState: "idle" | "pulsing" | "spinning" | "success" | "error";
  lastUpdated: number;
  executionTime?: number;
  errorMessage?: string;
}

export interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  averageNodeDuration: number;
  longestRunningNode: string;
  bottleneckNodes: string[];
  parallelismUtilization: number;
}

export interface ExecutionHistoryEntry {
  executionId: string;
  workflowId: string;
  triggerType: string;
  startTime: number;
  endTime?: number;
  status: string;
  executedNodes: string[];
  executionPath: string[];
  metrics: ExecutionMetrics;
}

export interface FlowExecutionState {
  activeExecutions: Map<string, ExecutionFlowStatus>;
  nodeVisualStates: Map<string, NodeVisualState>;
  executionHistory: ExecutionHistoryEntry[];
  realTimeUpdates: boolean;
  selectedExecution?: string;
}
