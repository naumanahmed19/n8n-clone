/**
 * WorkflowExecutionHandler
 * 
 * Handles workflow mode execution (trigger-based execution)
 * Properly manages execution context and visual state updates
 */

import { Workflow, WorkflowNode, WorkflowExecutionResult } from "@/types";
import { NodeExecutionStatus } from "@/types/execution";
import { getAffectedNodes } from "@/utils/executionPathAnalyzer";
import { executionService } from "@/services/execution";
import { executionWebSocket } from "@/services/ExecutionWebSocket";

export interface WorkflowExecutionContext {
  executionId: string;
  nodeId: string;
  node: WorkflowNode;
  workflow: Workflow;
  startTime: number;
}

export class WorkflowExecutionHandler {
  /**
   * Execute workflow from a trigger node
   */
  static async execute(
    nodeId: string,
    node: WorkflowNode,
    workflow: Workflow,
    storeActions: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Clear execution logs
      storeActions.clearExecutionLogs();

      // Set initial execution state
      storeActions.setExecutionState({
        status: "running",
        progress: 0,
        startTime,
        endTime: undefined,
        error: undefined,
        executionId: undefined,
      });

      // Prepare execution context
      const tempExecutionId = `temp_${Date.now()}`;
      const affectedNodes = getAffectedNodes(nodeId, workflow);
      
      await this.prepareExecutionContext(
        tempExecutionId,
        nodeId,
        affectedNodes,
        workflow,
        storeActions
      );

      // Start workflow execution
      const executionId = await this.startWorkflowExecution(
        workflow,
        nodeId,
        node,
        tempExecutionId,
        storeActions
      );

      // Wait for completion
      await this.waitForCompletion(
        executionId,
        nodeId,
        node,
        startTime,
        storeActions
      );

    } catch (error) {
      await this.handleError(error, nodeId, node, startTime, storeActions);
    }
  }

  /**
   * Prepare execution context - clear old states and initialize new execution
   */
  private static async prepareExecutionContext(
    tempExecutionId: string,
    nodeId: string,
    affectedNodes: string[],
    workflow: Workflow,
    storeActions: any
  ): Promise<void> {
    const { executionManager, progressTracker } = storeActions.getState();

    // CRITICAL: Clear old completed executions to prevent cross-trigger contamination
    const allExecutions: string[] = Array.from(
      (executionManager as any).executions.keys()
    );
    
    allExecutions.forEach((execId) => {
      const exec = (executionManager as any).executions.get(execId);
      if (
        exec &&
        (exec.status === "completed" ||
          exec.status === "failed" ||
          exec.status === "cancelled")
      ) {
        executionManager.clearExecution(execId);
        progressTracker.clearExecution(execId);
      }
    });

    // Clear ALL node visual states
    const currentFlowState = storeActions.getState().flowExecutionState;
    currentFlowState.nodeVisualStates.clear();
    storeActions.setState({ flowExecutionState: { ...currentFlowState } });

    // Reset all nodes to IDLE
    if (workflow?.nodes) {
      workflow.nodes.forEach((node: any) => {
        progressTracker.updateNodeStatus(
          tempExecutionId,
          node.id,
          NodeExecutionStatus.IDLE,
          {}
        );
      });
    }

    // Start new execution context
    executionManager.startExecution(tempExecutionId, nodeId, affectedNodes);
    executionManager.setCurrentExecution(tempExecutionId);
    executionManager.updateNodeStatus(
      nodeId,
      NodeExecutionStatus.RUNNING,
      tempExecutionId
    );

    storeActions.setState({
      executionManager,
      executionStateVersion: storeActions.getState().executionStateVersion + 1,
    });

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level: "info",
      nodeId,
      message: `Prepared execution context for workflow from trigger: ${nodeId}`,
    });
  }

  /**
   * Start workflow execution via WebSocket
   */
  private static async startWorkflowExecution(
    workflow: Workflow,
    nodeId: string,
    node: WorkflowNode,
    tempExecutionId: string,
    storeActions: any
  ): Promise<string> {
    // Ensure WebSocket is connected
    if (!executionWebSocket.isConnected()) {
      await executionWebSocket.connect();
    }

    // Prepare trigger data
    const triggerData = executionService.prepareTriggerData({
      triggeredBy: "user",
      workflowName: workflow.name,
      nodeCount: workflow.nodes.length,
      triggerNodeId: nodeId,
      triggerNodeType: node.type,
    });

    // Start execution via WebSocket
    const executionResponse = await new Promise<{ executionId: string }>(
      (resolve, reject) => {
        executionWebSocket.getSocket()?.emit(
          "start-workflow-execution",
          {
            workflowId: workflow.id,
            triggerData,
            triggerNodeId: nodeId,
            workflowData: {
              nodes: workflow.nodes,
              connections: workflow.connections,
              settings: workflow.settings,
            },
            options: {
              timeout: 300000,
              manual: true,
            },
          },
          (response: any) => {
            if (response.success) {
              resolve({ executionId: response.executionId });
            } else {
              reject(
                new Error(response.error || "Failed to start execution")
              );
            }
          }
        );

        setTimeout(
          () => reject(new Error("Execution start timeout")),
          10000
        );
      }
    );

    // Update execution state with real execution ID
    storeActions.setExecutionState({
      executionId: executionResponse.executionId,
    });

    // Replace temporary execution ID with real one
    const { executionManager } = storeActions.getState();
    executionManager.replaceExecutionId(
      tempExecutionId,
      executionResponse.executionId
    );
    executionManager.setCurrentExecution(executionResponse.executionId);
    
    storeActions.setState({
      executionManager,
      executionStateVersion: storeActions.getState().executionStateVersion + 1,
    });

    // Set as current tracked execution
    storeActions.setCurrentExecutionId(executionResponse.executionId);

    // Subscribe to real-time updates
    await storeActions.subscribeToExecution(executionResponse.executionId);

    // Initialize flow execution tracking
    const nodeIds = workflow.nodes.map((n) => n.id);
    storeActions.initializeFlowExecution(
      executionResponse.executionId,
      nodeIds
    );

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level: "info",
      nodeId,
      message: `Workflow execution started: ${executionResponse.executionId}`,
    });

    return executionResponse.executionId;
  }

  /**
   * Wait for execution completion
   */
  private static async waitForCompletion(
    executionId: string,
    nodeId: string,
    node: WorkflowNode,
    startTime: number,
    storeActions: any
  ): Promise<void> {
    await new Promise<void>((resolve) => {
      const checkCompletion = () => {
        const currentState = storeActions.getState().executionState;
        return (
          currentState.executionId === executionId &&
          (currentState.status === "success" ||
            currentState.status === "error" ||
            currentState.status === "cancelled")
        );
      };

      if (checkCompletion()) {
        resolve();
        return;
      }

      const unsubscribe = storeActions.subscribe((state: any) => {
        if (
          state.executionState.executionId === executionId &&
          (state.executionState.status === "success" ||
            state.executionState.status === "error" ||
            state.executionState.status === "cancelled")
        ) {
          unsubscribe();
          resolve();
        }
      });

      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 300000);
    });

    // Finalize execution
    const endTime = Date.now();
    const duration = endTime - startTime;
    const currentExecutionState = storeActions.getState().executionState;
    const finalStatus = currentExecutionState.status;
    const finalError = currentExecutionState.error;

    const resultStatus: "success" | "error" | "cancelled" =
      finalStatus === "success"
        ? "success"
        : finalStatus === "cancelled"
        ? "cancelled"
        : "error";

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level:
        finalStatus === "success"
          ? "info"
          : finalStatus === "error"
          ? "error"
          : "warn",
      nodeId,
      message: `Workflow execution ${
        finalStatus === "success"
          ? "completed successfully"
          : finalStatus === "error"
          ? "failed"
          : "completed"
      } from trigger: ${node.name}`,
      data: {
        nodeId,
        executionId,
        status: finalStatus,
        duration,
        error: finalError,
      },
    });

    const executionResult: WorkflowExecutionResult = {
      executionId,
      workflowId: storeActions.getState().workflow?.id || "",
      status: resultStatus,
      startTime,
      endTime,
      duration,
      nodeResults: Array.from(
        storeActions.getState().realTimeResults.values()
      ),
      error: finalError,
      triggerNodeId: nodeId,
    };

    storeActions.setState({
      executionState: {
        status: finalStatus,
        progress: 100,
        startTime,
        endTime,
        error: finalError,
        executionId,
      },
      lastExecutionResult: executionResult,
    });

    // Keep subscription active for 30 seconds
    setTimeout(async () => {
      try {
        await storeActions.unsubscribeFromExecution(executionId);
      } catch (error) {
        // Silently handle unsubscribe errors
      }
    }, 30000);
  }

  /**
   * Handle workflow execution error
   */
  private static async handleError(
    error: unknown,
    nodeId: string,
    node: WorkflowNode,
    startTime: number,
    storeActions: any
  ): Promise<void> {
    const endTime = Date.now();
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level: "error",
      nodeId,
      message: `Workflow execution failed: ${errorMessage}`,
      data: { nodeId, error: errorMessage, mode: "workflow" },
    });

    storeActions.setState({
      executionState: {
        status: "error",
        progress: 0,
        startTime,
        endTime,
        error: errorMessage,
        executionId: storeActions.getState().executionState.executionId,
      },
    });

    const currentExecutionId =
      storeActions.getState().executionState.executionId;
    if (currentExecutionId) {
      setTimeout(async () => {
        try {
          await storeActions.unsubscribeFromExecution(currentExecutionId);
        } catch (error) {
          // Silently handle unsubscribe errors
        }
      }, 30000);
    }
  }
}
