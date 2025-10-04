import { useWorkflowStore } from "@/stores/workflow";
import { NodeExecutionStatus } from "@/types/execution";
import {
  createNodeExecutionError,
  logExecutionError,
} from "@/utils/errorHandling";
import { useEffect, useState } from "react";
import type { NodeExecutionError } from "../types";

interface NodeExecutionState {
  isExecuting: boolean;
  hasError: boolean;
  hasSuccess: boolean;
  lastExecutionTime?: number;
  executionError?: NodeExecutionError;
}

export function useNodeExecution(nodeId: string, nodeType: string) {
  const executeNode = useWorkflowStore((state) => state.executeNode);
  const executionState = useWorkflowStore((state) => state.executionState);
  const getNodeExecutionResult = useWorkflowStore(
    (state) => state.getNodeExecutionResult
  );
  const getNodeVisualState = useWorkflowStore(
    (state) => state.getNodeVisualState
  );

  const [nodeExecutionState, setNodeExecutionState] =
    useState<NodeExecutionState>({
      isExecuting: false,
      hasError: false,
      hasSuccess: false,
    });

  // Get real-time execution result for this node
  const nodeExecutionResult = getNodeExecutionResult(nodeId);
  const nodeVisualState = getNodeVisualState(nodeId);

  // Extract specific values for useEffect dependencies
  const nodeStatus = nodeVisualState?.status;
  const nodeErrorMessage = nodeVisualState?.errorMessage;
  const nodeExecutionTime = nodeVisualState?.executionTime;
  const executionResultStatus = nodeExecutionResult?.status;
  const executionResultError = nodeExecutionResult?.error;
  const executionResultEndTime = nodeExecutionResult?.endTime;

  // Update local state based on flow execution results
  useEffect(() => {
    // Prioritize flow execution state over legacy execution results
    if (nodeVisualState && nodeStatus !== NodeExecutionStatus.IDLE) {
      const isExecuting =
        nodeStatus === NodeExecutionStatus.RUNNING ||
        nodeStatus === NodeExecutionStatus.QUEUED;
      const hasError = nodeStatus === NodeExecutionStatus.FAILED;
      const hasSuccess = nodeStatus === NodeExecutionStatus.COMPLETED;

      let executionError: NodeExecutionError | undefined;
      if (hasError && nodeErrorMessage) {
        executionError = createNodeExecutionError(
          nodeErrorMessage,
          nodeId,
          nodeType
        );
        logExecutionError(nodeId, nodeType, executionError, nodeErrorMessage);
      }

      setNodeExecutionState({
        isExecuting,
        hasError,
        hasSuccess: !!hasSuccess,
        lastExecutionTime: nodeExecutionTime,
        executionError,
      });
    } else if (nodeExecutionResult) {
      // Fallback to legacy execution results
      const isExecuting =
        executionResultStatus === "success" &&
        (nodeExecutionResult.endTime === nodeExecutionResult.startTime ||
          !nodeExecutionResult.endTime);
      const hasError = executionResultStatus === "error";
      const hasSuccess =
        executionResultStatus === "success" &&
        nodeExecutionResult.endTime &&
        nodeExecutionResult.endTime > nodeExecutionResult.startTime;

      let executionError: NodeExecutionError | undefined;
      if (hasError && executionResultError) {
        executionError = createNodeExecutionError(
          executionResultError,
          nodeId,
          nodeType
        );
        logExecutionError(
          nodeId,
          nodeType,
          executionError,
          executionResultError
        );
      }

      setNodeExecutionState({
        isExecuting,
        hasError,
        hasSuccess: !!hasSuccess,
        lastExecutionTime: executionResultEndTime,
        executionError,
      });
    } else {
      setNodeExecutionState({
        isExecuting: false,
        hasError: false,
        hasSuccess: false,
      });
    }
  }, [
    nodeStatus,
    nodeErrorMessage,
    nodeExecutionTime,
    executionResultStatus,
    executionResultError,
    executionResultEndTime,
    nodeId,
    nodeType,
  ]);

  const handleExecuteNode = async (nodeId: string, nodeType: string) => {
    if (executionState.status === "running") {
      console.warn("Cannot execute individual node while workflow is running");
      return;
    }

    setNodeExecutionState((prev) => ({
      ...prev,
      isExecuting: true,
      hasError: false,
      hasSuccess: false,
      executionError: undefined,
    }));

    try {
      const triggerNodeTypes = [
        "manual-trigger",
        "webhook-trigger",
        "schedule-trigger",
        "workflow-called",
      ];
      const mode = triggerNodeTypes.includes(nodeType) ? "workflow" : "single";

      await executeNode(nodeId, undefined, mode);
    } catch (error) {
      console.error("Failed to execute node:", error);

      const executionError = createNodeExecutionError(error, nodeId, nodeType);
      logExecutionError(nodeId, nodeType, executionError, error);

      setNodeExecutionState((prev) => ({
        ...prev,
        isExecuting: false,
        hasError: true,
        executionError,
      }));
    }
  };

  const handleRetryNode = async (nodeId: string, nodeType: string) => {
    await handleExecuteNode(nodeId, nodeType);
  };

  return {
    nodeExecutionState,
    executionState,
    nodeVisualState,
    handleExecuteNode,
    handleRetryNode,
  };
}
