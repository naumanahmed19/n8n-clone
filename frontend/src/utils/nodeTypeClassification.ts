/**
 * Node type classification utilities for determining execution capabilities
 * and toolbar button visibility
 */

import type {
  NodeExecutionCapability,
  NodeTypeMetadata,
} from "@/components/workflow/types";

/**
 * Node type metadata registry
 * Maps both backend node types and display names to metadata
 */
const NODE_TYPE_REGISTRY: Record<string, NodeTypeMetadata> = {
  // Trigger nodes - backend types
  "manual-trigger": {
    type: "manual-trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "webhook-trigger": {
    type: "webhook-trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "schedule-trigger": {
    type: "schedule-trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "workflow-called": {
    type: "workflow-called",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  webhook: {
    type: "webhook",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },

  // Trigger nodes - display names (for backward compatibility)
  "Manual Trigger": {
    type: "Manual Trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "Webhook Trigger": {
    type: "Webhook Trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "Schedule Trigger": {
    type: "Schedule Trigger",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },
  "Called by Workflow": {
    type: "Called by Workflow",
    group: ["trigger"],
    executionCapability: "trigger",
    canExecuteIndividually: true,
    canBeDisabled: true,
  },

  // Action nodes - backend types
  "http-request": {
    type: "http-request",
    group: ["action"],
    executionCapability: "action",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  set: {
    type: "set",
    group: ["action"],
    executionCapability: "action",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },

  // Action nodes - display names (for backward compatibility)
  "HTTP Request": {
    type: "HTTP Request",
    group: ["action"],
    executionCapability: "action",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  Set: {
    type: "Set",
    group: ["action"],
    executionCapability: "action",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },

  // Transform nodes - backend types
  json: {
    type: "json",
    group: ["transform"],
    executionCapability: "transform",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  code: {
    type: "code",
    group: ["transform"],
    executionCapability: "transform",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },

  // Transform nodes - display names (for backward compatibility)
  JSON: {
    type: "JSON",
    group: ["transform"],
    executionCapability: "transform",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  Code: {
    type: "Code",
    group: ["transform"],
    executionCapability: "transform",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },

  // Condition nodes - backend types
  if: {
    type: "if",
    group: ["condition"],
    executionCapability: "condition",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  switch: {
    type: "switch",
    group: ["condition"],
    executionCapability: "condition",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },

  // Condition nodes - display names (for backward compatibility)
  IF: {
    type: "IF",
    group: ["condition"],
    executionCapability: "condition",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
  Switch: {
    type: "Switch",
    group: ["condition"],
    executionCapability: "condition",
    canExecuteIndividually: false,
    canBeDisabled: true,
  },
};

/**
 * Get node type metadata for a given node type
 */
export function getNodeTypeMetadata(nodeType: string): NodeTypeMetadata | null {
  return NODE_TYPE_REGISTRY[nodeType] || null;
}

/**
 * Check if a node can be executed individually
 */
export function canNodeExecuteIndividually(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.canExecuteIndividually ?? false;
}

/**
 * Check if a node can be disabled
 */
export function canNodeBeDisabled(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.canBeDisabled ?? true;
}

/**
 * Get the execution capability of a node
 */
export function getNodeExecutionCapability(
  nodeType: string
): NodeExecutionCapability | null {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.executionCapability ?? null;
}

/**
 * Check if a node is a trigger type
 */
export function isTriggerNode(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.executionCapability === "trigger";
}

/**
 * Check if a node is an action type
 */
export function isActionNode(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.executionCapability === "action";
}

/**
 * Check if a node is a transform type
 */
export function isTransformNode(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.executionCapability === "transform";
}

/**
 * Check if a node is a condition type
 */
export function isConditionNode(nodeType: string): boolean {
  const metadata = getNodeTypeMetadata(nodeType);
  return metadata?.executionCapability === "condition";
}

/**
 * Get all registered node types
 */
export function getAllNodeTypes(): string[] {
  return Object.keys(NODE_TYPE_REGISTRY);
}

/**
 * Register a new node type (for extensibility)
 */
export function registerNodeType(
  nodeType: string,
  metadata: NodeTypeMetadata
): void {
  NODE_TYPE_REGISTRY[nodeType] = metadata;
}

/**
 * Check if execute button should be visible for a node
 */
export function shouldShowExecuteButton(nodeType: string): boolean {
  return canNodeExecuteIndividually(nodeType);
}

/**
 * Check if disable toggle button should be visible for a node
 */
export function shouldShowDisableButton(nodeType: string): boolean {
  return canNodeBeDisabled(nodeType);
}
