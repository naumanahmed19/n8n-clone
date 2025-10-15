import { useWorkflowStore } from "@/stores";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

function useDetachNodes() {
  const { setNodes, getNodes, getInternalNode } = useReactFlow();
  const { saveToHistory, setDirty } = useWorkflowStore();

  const detachNodes = useCallback(
    (ids: string[], removeParentId?: string) => {
      // Take snapshot for undo/redo
      saveToHistory("Ungroup nodes");

      const nextNodes = getNodes().map((n) => {
        if (ids.includes(n.id) && n.parentId) {
          const parentNode = getInternalNode(n.parentId);

          return {
            ...n,
            position: {
              x: n.position.x + (parentNode?.internals.positionAbsolute.x ?? 0),
              y: n.position.y + (parentNode?.internals.positionAbsolute.y ?? 0),
            },
            expandParent: undefined,
            parentId: undefined,
            extent: undefined,
          };
        }
        return n;
      });

      setNodes(
        nextNodes.filter((n) => !removeParentId || n.id !== removeParentId)
      );

      // Mark workflow as dirty
      setDirty(true);
    },
    [setNodes, getNodes, getInternalNode, saveToHistory, setDirty]
  );

  return detachNodes;
}

export default useDetachNodes;
