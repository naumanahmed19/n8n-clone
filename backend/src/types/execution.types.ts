// Execution engine type definitions

import { Node, Connection, Workflow, Execution, NodeExecution } from './database';
import { NodeInputData, NodeOutputData } from './node.types';

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerData?: any;
  startedAt: Date;
  nodeExecutions: Map<string, NodeExecution>;
  nodeOutputs: Map<string, NodeOutputData[]>;
  cancelled: boolean;
}

export interface ExecutionJob {
  type: 'execute-workflow' | 'execute-node' | 'cancel-execution';
  data: ExecutionJobData;
}

export interface ExecutionJobData {
  executionId: string;
  workflowId?: string;
  nodeId?: string;
  userId: string;
  triggerData?: any;
  inputData?: NodeInputData;
  retryCount?: number;
}

export interface NodeExecutionJob {
  nodeId: string;
  executionId: string;
  inputData: NodeInputData;
  retryCount: number;
}

export interface ExecutionGraph {
  nodes: Map<string, Node>;
  connections: Connection[];
  adjacencyList: Map<string, string[]>;
  inDegree: Map<string, number>;
  executionOrder: string[];
}

export interface ExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  saveProgress?: boolean;
  saveData?: boolean;
  manual?: boolean; // Allow execution even if workflow is inactive (for testing/manual runs)
}

export interface ExecutionProgress {
  executionId: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  currentNode?: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  error?: ExecutionEngineError;
}

export interface ExecutionEngineError {
  message: string;
  stack?: string;
  nodeId?: string;
  timestamp: Date;
  code?: string;
  retryable?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  retryableErrors: string[];
}

export interface ExecutionMetrics {
  executionId: string;
  totalDuration: number;
  nodeMetrics: Map<string, NodeMetrics>;
  memoryUsage: number;
  cpuUsage: number;
}

export interface NodeMetrics {
  nodeId: string;
  duration: number;
  memoryUsage: number;
  inputSize: number;
  outputSize: number;
  retryCount: number;
}

export interface ExecutionEventData {
  executionId: string;
  type: 'started' | 'node-started' | 'node-completed' | 'node-failed' | 'completed' | 'failed' | 'cancelled';
  nodeId?: string;
  data?: any;
  error?: ExecutionEngineError;
  timestamp: Date;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  concurrency: number;
  removeOnComplete: number;
  removeOnFail: number;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
  };
}

export interface ExecutionStats {
  totalExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  averageExecutionTime: number;
  queueSize: number;
}