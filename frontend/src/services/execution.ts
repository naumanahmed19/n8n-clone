import { apiClient } from "./api";

export interface ExecutionRequest {
  workflowId: string;
  triggerData?: any;
  triggerNodeId?: string;
  // Optional workflow data to avoid requiring database save
  workflowData?: {
    nodes?: any[];
    connections?: any[];
    settings?: any;
  };
  options?: {
    timeout?: number;
    priority?: "low" | "normal" | "high";
    manual?: boolean;
  };
}

export interface ExecutionResponse {
  executionId: string;
  status?: "completed" | "failed" | "cancelled" | "partial";
  executedNodes?: string[];
  failedNodes?: string[];
  duration?: number;
  hasFailures?: boolean;
}

export interface ExecutionProgress {
  executionId: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  currentNode?: string;
  status: "running" | "success" | "error" | "cancelled" | "paused" | "partial";
  startedAt: string;
  finishedAt?: string;
  error?: {
    message: string;
    stack?: string;
    nodeId?: string;
    timestamp: string;
  };
}

export interface ExecutionDetails {
  id: string;
  workflowId: string;
  status: "running" | "success" | "error" | "cancelled" | "paused" | "partial";
  startedAt: string;
  finishedAt?: string;
  triggerData: any;
  error?: any;
  nodeExecutions: Array<{
    id: string;
    nodeId: string;
    status: "running" | "success" | "error";
    startedAt: string;
    finishedAt?: string;
    inputData?: any;
    outputData?: any;
    error?: any;
  }>;
}

export interface SingleNodeExecutionRequest {
  workflowId: string;
  nodeId: string;
  inputData?: any;
  parameters?: Record<string, any>;
  mode?: "single" | "workflow";
}

// Note: SingleNodeExecutionResult is now identical to ExecutionResponse
// due to unified API - keeping interface for backward compatibility
export type SingleNodeExecutionResult = ExecutionResponse;

export class ExecutionService {
  /**
   * Execute a workflow with optional trigger data
   */
  async executeWorkflow(request: ExecutionRequest): Promise<ExecutionResponse> {
    const response = await apiClient.post<ExecutionResponse>(
      "/executions",
      request
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to start workflow execution");
    }

    return response.data;
  }

  /**
   * Get execution progress
   */
  async getExecutionProgress(executionId: string): Promise<ExecutionProgress> {
    const response = await apiClient.get<ExecutionProgress>(
      `/executions/${executionId}/progress`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to get execution progress");
    }

    return response.data;
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string): Promise<ExecutionDetails> {
    const response = await apiClient.get<ExecutionDetails>(
      `/executions/${executionId}`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to get execution details");
    }

    return response.data;
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const response = await apiClient.post(`/executions/${executionId}/cancel`);

    if (!response.success) {
      throw new Error("Failed to cancel execution");
    }
  }

  /**
   * Pause a running execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    const response = await apiClient.post(
      `/flow-execution/${executionId}/pause`
    );

    if (!response.success) {
      throw new Error("Failed to pause execution");
    }
  }

  /**
   * Resume a paused execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const response = await apiClient.post(
      `/flow-execution/${executionId}/resume`
    );

    if (!response.success) {
      throw new Error("Failed to resume execution");
    }
  }

  /**
   * Poll execution progress until completion
   */
  async pollExecutionProgress(
    executionId: string,
    onProgress?: (progress: ExecutionProgress) => void,
    pollInterval: number = 1000
  ): Promise<ExecutionProgress> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const progress = await this.getExecutionProgress(executionId);

          if (onProgress) {
            onProgress(progress);
          }

          // Check if execution is complete
          if (
            progress.status === "success" ||
            progress.status === "error" ||
            progress.status === "cancelled" ||
            progress.status === "partial"
          ) {
            resolve(progress);
            return;
          }

          // For paused executions, we poll at a slower rate to reduce server load
          const interval =
            progress.status === "paused" ? pollInterval * 3 : pollInterval;

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Execute a single node using the unified executions endpoint
   */
  async executeSingleNode(
    request: SingleNodeExecutionRequest
  ): Promise<SingleNodeExecutionResult> {
    const response = await apiClient.post<SingleNodeExecutionResult>(
      `/executions`,
      {
        workflowId: request.workflowId,
        nodeId: request.nodeId,
        inputData: request.inputData,
        parameters: request.parameters,
        mode: request.mode || "single", // Default to single mode
      }
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to execute single node");
    }

    return response.data;
  }

  /**
   * Prepare trigger data for manual trigger
   */
  prepareTriggerData(customData?: any): any {
    const triggerData = {
      timestamp: new Date().toISOString(),
      source: "manual",
      ...(customData || {}),
    };

    // Validate trigger data size (max 1MB)
    const dataSize = JSON.stringify(triggerData).length;
    if (dataSize > 1024 * 1024) {
      throw new Error(`Trigger data too large: ${dataSize} bytes (max 1MB)`);
    }

    return triggerData;
  }
}

export const executionService = new ExecutionService();
