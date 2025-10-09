import { NodeType } from "@/types";

// Type definitions for workflow data
type WorkflowNode = {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters?: Record<string, any>;
  disabled?: boolean;
};

type WorkflowConnection = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
};

type NodeExecutionResult = {
  nodeId: string;
  status: "idle" | "running" | "success" | "error" | "skipped";
  [key: string]: any;
};

type ExecutionState = {
  status: "idle" | "running" | "success" | "error" | "cancelled" | "paused";
  executionId?: string;
};

type ExecutionResult = {
  nodeResults: NodeExecutionResult[];
};

/**
 * Determines the execution status of a node based on current execution state
 */
export function getNodeExecutionStatus(
  nodeId: string,
  executionState: ExecutionState,
  nodeResult: NodeExecutionResult | undefined,
  lastExecutionResult: ExecutionResult | null
): "idle" | "running" | "success" | "error" | "skipped" {
  if (executionState.status === "running") {
    if (nodeResult) {
      return nodeResult.status;
    }
    return "idle";
  }

  if (
    executionState.status === "success" ||
    executionState.status === "error" ||
    executionState.status === "cancelled"
  ) {
    if (nodeResult) {
      return nodeResult.status;
    }

    if (lastExecutionResult) {
      const lastNodeResult = lastExecutionResult.nodeResults.find(
        (nr) => nr.nodeId === nodeId
      );
      if (lastNodeResult) {
        return lastNodeResult.status;
      }
    }
  }

  return "idle";
}

/**
 * Gets the dynamic outputs for a node based on its configuration
 */
function getNodeOutputs(
  node: WorkflowNode,
  nodeTypeDefinition: NodeType | undefined
): string[] {
  if (node.type === "switch" && node.parameters?.outputs) {
    return (node.parameters.outputs as any[]).map(
      (output: any, index: number) => output.outputName || `Output ${index + 1}`
    );
  }
  return nodeTypeDefinition?.outputs || [];
}

/**
 * Gets the custom style configuration for a node
 */
function getNodeCustomStyle(
  node: WorkflowNode,
  nodeTypeDefinition: NodeType | undefined
) {
  const isTrigger = nodeTypeDefinition?.executionCapability === "trigger";

  return {
    backgroundColor: nodeTypeDefinition?.color || "#666",
    borderColor: undefined, // Will be handled by CSS based on selection state
    borderWidth: 2,
    borderRadius: isTrigger ? 32 : 8,
    shape: isTrigger ? ("trigger" as const) : ("rectangle" as const),
    opacity: node.disabled ? 0.5 : 1.0,
  };
}

/**
 * Transforms workflow nodes into React Flow node format
 */
export function transformWorkflowNodesToReactFlow(
  workflowNodes: WorkflowNode[],
  availableNodeTypes: NodeType[],
  executionState: ExecutionState,
  getNodeResult: (nodeId: string) => NodeExecutionResult | undefined,
  lastExecutionResult: ExecutionResult | null
) {
  return workflowNodes.map((node) => {
    const nodeResult = getNodeResult(node.id);
    const nodeStatus = getNodeExecutionStatus(
      node.id,
      executionState,
      nodeResult,
      lastExecutionResult
    );
    const nodeTypeDefinition = availableNodeTypes.find(
      (nt) => nt.type === node.type
    );

    // Use specific node type for special nodes, otherwise use 'custom'
    const reactFlowNodeType = node.type === "chat" ? "chat" : "custom";

    return {
      id: node.id,
      type: reactFlowNodeType,
      position: node.position,
      data: {
        label: node.name,
        nodeType: node.type,
        parameters: node.parameters,
        disabled: node.disabled,
        status: nodeStatus,
        inputs: nodeTypeDefinition?.inputs || [],
        outputs: getNodeOutputs(node, nodeTypeDefinition),
        position: node.position,
        dimensions: { width: 64, height: 64 },
        customStyle: getNodeCustomStyle(node, nodeTypeDefinition),
        executionResult: nodeResult,
        lastExecutionData: lastExecutionResult?.nodeResults.find(
          (nr) => nr.nodeId === node.id
        ),
        // Add node type definition and execution capability
        nodeTypeDefinition,
        executionCapability: nodeTypeDefinition?.executionCapability,
      },
    };
  });
}

/**
 * Transforms workflow connections into React Flow edge format
 */
export function transformWorkflowEdgesToReactFlow(
  connections: WorkflowConnection[]
) {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceNodeId,
    target: conn.targetNodeId,
    sourceHandle: conn.sourceOutput,
    targetHandle: conn.targetInput,
    type: "smoothstep",
    data: {
      label: conn.sourceOutput !== "main" ? conn.sourceOutput : undefined,
    },
  }));
}
