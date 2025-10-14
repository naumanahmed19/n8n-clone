/**
 * useEdgeAnimation Hook
 *
 * Determines which edges should be animated based on execution context.
 * Only animates edges that are part of the current active execution path.
 *
 * Features:
 * - Per-execution edge animation
 * - Prevents animation of edges from other executions
 * - Optimized with custom selectors
 */

import { useWorkflowStore } from "@/stores/workflow";
import { useMemo } from "react";
import type { Edge } from "reactflow";

/**
 * Hook to get edge animation states based on execution context
 *
 * @param edges - All edges in the workflow
 * @returns Map of edge IDs to animation state (true/false)
 */
export function useEdgeAnimation(edges: Edge[]): Map<string, boolean> {
  // Get current execution context
  const currentExecution = useWorkflowStore(
    (state) => {
      if (!state.executionManager) return null;
      return state.executionManager.getCurrentExecution();
    },
    // Only re-render if execution ID or status changes
    (a, b) => {
      if (a === b) return true;
      if (!a || !b) return false;
      return a.executionId === b.executionId && a.status === b.status;
    }
  );

  // Calculate which edges should be animated
  const edgeAnimationMap = useMemo(() => {
    const animationMap = new Map<string, boolean>();

    // If no current execution or not running, no edges should animate
    if (!currentExecution || currentExecution.status !== "running") {
      edges.forEach((edge) => animationMap.set(edge.id, false));
      return animationMap;
    }

    // Get nodes that are part of current execution
    const affectedNodeIds = currentExecution.affectedNodeIds;

    // Only animate edges where BOTH source and target are in current execution
    for (const edge of edges) {
      const isInCurrentExecution =
        affectedNodeIds.has(edge.source) && affectedNodeIds.has(edge.target);

      animationMap.set(edge.id, isInCurrentExecution);
    }

    return animationMap;
  }, [edges, currentExecution]);

  return edgeAnimationMap;
}

/**
 * Hook to check if ANY edge should be animated (for global controls)
 *
 * @returns boolean - true if any edge should be animated
 */
export function useHasAnimatedEdges(): boolean {
  return useWorkflowStore(
    (state) => {
      if (!state.executionManager) return false;

      const currentExecution = state.executionManager.getCurrentExecution();
      return currentExecution?.status === "running" || false;
    },
    (a, b) => a === b
  );
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
