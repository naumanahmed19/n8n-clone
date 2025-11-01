/**
 * SingleNodeExecutionHandler
 * 
 * Handles single node execution
 * Properly manages execution context and visual state updates
 */

import { Workflow, WorkflowNode, NodeExecutionResult } from "@/types";
import { NodeExecutionStatus } from "@/types/execution";
import { executionService } from "@/services/execution";
import { NodeValidator } from "@/utils/nodeValidation";
import { workflowService } from "@/services/workflow";

/**
 * Helper function to serialize error for display
 */
function serializeError(error: any): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  
  if (typeof error === "object") {
    if (error.message) return error.message;
    try {
      return JSON.stringify(error, null, 2);
    } catch (e) {
      return String(error);
    }
  }
  
  return String(error);
}

export class SingleNodeExecutionHandler {
  /**
   * Execute a single node
   */
  static async execute(
    nodeId: string,
    node: WorkflowNode,
    workflow: Workflow,
    nodeInputData: any,
    storeActions: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate and filter parameters
      const filteredParameters = await this.validateAndFilterParameters(node);

      // Execute single node
      const result = await executionService.executeSingleNode({
        workflowId: workflow.id,
        nodeId,
        inputData: nodeInputData || { main: [[]] },
        parameters: filteredParameters,
        mode: "single",
        workflowData: {
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
        },
      });

      // Update execution context and visual states
      await this.updateNodeResult(
        nodeId,
        node,
        result,
        startTime,
        storeActions
      );
    } catch (error) {
      await this.handleError(nodeId, node, error, startTime, storeActions);
    }
  }

  /**
   * Validate and filter node parameters
   */
  private static async validateAndFilterParameters(
    node: WorkflowNode
  ): Promise<any> {
    let filteredParameters = node.parameters;

    try {
      const nodeTypes = await workflowService.getNodeTypes();
      const nodeTypeDefinition = nodeTypes.find((nt) => nt.type === node.type);

      if (nodeTypeDefinition && nodeTypeDefinition.properties) {
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

        filteredParameters = NodeValidator.filterVisibleParameters(
          node.parameters,
          nodeTypeDefinition.properties
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Cannot execute node")
      ) {
        throw error;
      }
    }

    return filteredParameters;
  }

  /**
   * Update node result after execution
   */
  private static async updateNodeResult(
    nodeId: string,
    node: WorkflowNode,
    result: any,
    startTime: number,
    storeActions: any
  ): Promise<void> {
    const { executionManager } = storeActions.getState();

    // Initialize execution context for single node
    executionManager.startExecution(result.executionId, nodeId, [nodeId]);
    executionManager.setCurrentExecution(result.executionId);
    executionManager.setNodeRunning(result.executionId, nodeId);
    
    storeActions.setState({
      executionManager,
      executionStateVersion:
        storeActions.getState().executionStateVersion + 1,
    });

    const endTime = Date.now();
    const isSuccess = result.status === "completed" && !result.hasFailures;

    // Get detailed execution results
    let nodeOutputData: any = undefined;
    let nodeError: any = undefined;

    try {
      const executionDetails = await executionService.getExecutionDetails(
        result.executionId
      );
      const nodeExecution = executionDetails.nodeExecutions.find(
        (nodeExec) => nodeExec.nodeId === nodeId
      );

      if (nodeExecution) {
        nodeOutputData = nodeExecution.outputData;
        nodeError = serializeError(nodeExecution.error);
      }
    } catch (error) {
      nodeError = "Failed to retrieve execution details";
    }

    // Update node execution result
    storeActions.updateNodeExecutionResult(nodeId, {
      nodeId,
      nodeName: node.name,
      status: isSuccess ? "success" : "error",
      startTime,
      endTime,
      duration: result.duration,
      data: nodeOutputData,
      error:
        nodeError || (result.hasFailures ? "Node execution failed" : undefined),
    });

    // Unpin mock data if execution was successful
    if (node.mockData && node.mockDataPinned && isSuccess) {
      storeActions.updateNode(nodeId, { mockDataPinned: false });
      storeActions.addExecutionLog({
        timestamp: new Date().toISOString(),
        level: "info",
        nodeId,
        message: `Mock data unpinned for node: ${node.name} (execution successful)`,
      });
    }

    // Update visual states
    const visualStatus = isSuccess
      ? NodeExecutionStatus.COMPLETED
      : NodeExecutionStatus.FAILED;

    if (isSuccess) {
      executionManager.setNodeCompleted(result.executionId, nodeId);
      executionManager.completeExecution(result.executionId);
    } else {
      executionManager.setNodeFailed(result.executionId, nodeId);
      executionManager.completeExecution(result.executionId);
    }

    storeActions.setState({
      executionManager,
      executionStateVersion:
        storeActions.getState().executionStateVersion + 1,
    });

    storeActions.updateNodeExecutionState(nodeId, visualStatus, {
      progress: isSuccess ? 100 : undefined,
      error:
        nodeError || (result.hasFailures ? "Node execution failed" : undefined),
      outputData: nodeOutputData,
      startTime,
      endTime,
    });

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level: isSuccess ? "info" : "error",
      nodeId,
      message: `Node execution ${
        isSuccess ? "completed successfully" : "failed"
      }: ${node.name}`,
      data: {
        nodeId,
        status: result.status,
        duration: result.duration,
        hasFailures: result.hasFailures,
      },
    });
  }

  /**
   * Handle single node execution error
   */
  private static async handleError(
    nodeId: string,
    node: WorkflowNode,
    error: unknown,
    startTime: number,
    storeActions: any
  ): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown execution error";

    storeActions.updateNodeExecutionResult(nodeId, {
      nodeId,
      nodeName: node.name,
      status: "error",
      startTime,
      endTime,
      duration,
      data: undefined,
      error: errorMessage,
    });

    storeActions.updateNodeExecutionState(nodeId, NodeExecutionStatus.FAILED, {
      error: errorMessage,
      startTime,
      endTime,
    });

    storeActions.addExecutionLog({
      timestamp: new Date().toISOString(),
      level: "error",
      nodeId,
      message: `Node execution failed: ${node.name} - ${errorMessage}`,
      data: { nodeId, error: errorMessage, duration },
    });
  }
}
