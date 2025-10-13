import { useEffect, useRef } from "react";
import { ReactFlowInstance } from "reactflow";

interface UseReactFlowAutoLayoutOptions {
  reactFlowInstance: ReactFlowInstance | null;
  nodesCount: number;
  enabled?: boolean;
  delay?: number;
}

/**
 * Hook to automatically adjust ReactFlow viewport when container size changes
 * Uses ResizeObserver to detect container dimension changes and triggers fitView
 *
 * @param options - Configuration options
 * @param options.reactFlowInstance - The ReactFlow instance to control
 * @param options.nodesCount - Number of nodes (to avoid unnecessary fitView calls)
 * @param options.enabled - Whether the auto-layout is enabled (default: true)
 * @param options.delay - Delay in ms before triggering fitView (default: 50)
 *
 * @returns containerRef - Ref to attach to the container element
 */
export function useReactFlowAutoLayout({
  reactFlowInstance,
  nodesCount,
  enabled = true,
  delay = 50,
}: UseReactFlowAutoLayoutOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current || !reactFlowInstance) return;

    const resizeObserver = new ResizeObserver(() => {
      // Delay slightly to ensure DOM has updated
      setTimeout(() => {
        if (reactFlowInstance && nodesCount > 0) {
          reactFlowInstance.fitView({ padding: 0.1, duration: 0 });
        }
      }, delay);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [reactFlowInstance, nodesCount, enabled, delay]);

  return containerRef;
}

/**
 * Utility function to trigger ReactFlow fitView with a delay
 * Useful for manual layout recalculation after data changes
 *
 * @param reactFlowInstance - The ReactFlow instance
 * @param delay - Delay in ms before triggering fitView (default: 100)
 */
export function triggerReactFlowFitView(
  reactFlowInstance: ReactFlowInstance | null | undefined,
  delay = 100
) {
  if (!reactFlowInstance) return;

  setTimeout(() => {
    reactFlowInstance.fitView({ padding: 0.1, duration: 200 });
  }, delay);
}
