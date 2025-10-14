/**
 * useEdgeAnimation Hook
 *
 * Determines which edges should be animated based on execution state.
 * Uses the same execution state flag that controls node loading and toolbar buttons,
 * but only animates edges that are part of the current execution path.
 *
 * Features:
 * - Uses executionState.status === 'running' (same as buttons/loading)
 * - Only animates edges where both source AND target are in execution path
 * - Prevents animation of unrelated edges in complex workflows
 */

import { useWorkflowStore } from "@/stores/workflow";
import { useMemo } from "react";
import type { Edge } from "reactflow";

/**
 * Hook to get edge animation states based on execution state
 *
 * @param edges - All edges in the workflow
 * @returns Map of edge IDs to animation state (true/false)
 */
export function useEdgeAnimation(edges: Edge[]): Map<string, boolean> {
  // Use the same executionState.status that controls buttons and node loading
  const isExecuting = useWorkflowStore(
    (state) => state.executionState.status === "running"
  );

  // Get the nodes in the current execution path
  const executionNodeIds = useWorkflowStore((state) => {
    // Check executionManager for affected nodes (most reliable)
    if (state.executionManager) {
      const currentExecution = state.executionManager.getCurrentExecution();
      if (currentExecution?.affectedNodeIds) {
        return currentExecution.affectedNodeIds;
      }
    }

    // Fallback: check flowExecutionState for execution path
    const currentExecutionId = state.executionState.executionId;
    if (currentExecutionId) {
      const flowStatus =
        state.flowExecutionState.activeExecutions.get(currentExecutionId);
      if (flowStatus?.executionPath) {
        return new Set(flowStatus.executionPath);
      }
    }

    // No execution path found
    return new Set<string>();
  });

  // Calculate which edges should be animated
  const edgeAnimationMap = useMemo(() => {
    const animationMap = new Map<string, boolean>();

    // If not executing, no edges should animate
    if (!isExecuting) {
      edges.forEach((edge) => animationMap.set(edge.id, false));
      return animationMap;
    }

    // If executing but no execution path, don't animate any edges
    if (executionNodeIds.size === 0) {
      edges.forEach((edge) => animationMap.set(edge.id, false));
      return animationMap;
    }

    // Only animate edges where BOTH source AND target are in execution path
    edges.forEach((edge) => {
      const isInExecutionPath =
        executionNodeIds.has(edge.source) && executionNodeIds.has(edge.target);
      animationMap.set(edge.id, isInExecutionPath);
    });

    return animationMap;
  }, [edges, isExecuting, executionNodeIds]);

  return edgeAnimationMap;
}

/**
 * Hook to check if ANY edge should be animated (for global controls)
 *
 * @returns boolean - true if any edge should be animated
 */
export function useHasAnimatedEdges(): boolean {
  return useWorkflowStore((state) => state.executionState.status === "running");
}

/**
 * Hook to enhance edges with execution-aware animation
 *
 * @param edges - Original edges
 * @returns Edges with animated property set based on execution context
 */
export function useExecutionAwareEdges(edges: Edge[]): Edge[] {
  const edgeAnimationMap = useEdgeAnimation(edges);

  return useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      animated: edgeAnimationMap.get(edge.id) || false,
    }));
  }, [edges, edgeAnimationMap]);
}
