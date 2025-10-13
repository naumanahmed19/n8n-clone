/**
 * Utility functions for handling workflow triggers
 */

import { WorkflowNode } from "@/types/workflow";

export interface TriggerDefinition {
  id: string;
  type: "webhook" | "schedule" | "manual" | "workflow-called";
  nodeId: string;
  settings: Record<string, any>;
}

/**
 * Extract trigger definitions from workflow nodes
 */
export function extractTriggersFromNodes(
  nodes: WorkflowNode[]
): TriggerDefinition[] {
  const triggers: TriggerDefinition[] = [];

  nodes.forEach((node) => {
    const triggerType = getTriggerTypeFromNodeType(node.type);
    if (triggerType) {
      triggers.push({
        id: `trigger-${node.id}`,
        type: triggerType,
        nodeId: node.id,
        settings: node.parameters || {},
      });
    }
  });

  return triggers;
}

/**
 * Determine if a node type is a trigger type and return the trigger type
 */
function getTriggerTypeFromNodeType(
  nodeType: string
): "webhook" | "schedule" | "manual" | "workflow-called" | null {
  switch (nodeType) {
    case "webhook-trigger":
      return "webhook";
    case "schedule-trigger":
      return "schedule";
    case "manual-trigger":
      return "manual";
    case "workflow-called":
      return "workflow-called";
    default:
      return null;
  }
}

/**
 * Check if a node type is a trigger type
 */
export function isTriggerNode(nodeType: string): boolean {
  return getTriggerTypeFromNodeType(nodeType) !== null;
}
