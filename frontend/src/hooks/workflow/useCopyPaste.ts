import { useCopyPasteStore, useWorkflowStore } from "@/stores";
import {
  Edge,
  Node,
  XYPosition,
  getConnectedEdges,
  useKeyPress,
  useReactFlow,
  useStore,
  type KeyCode,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for copy/paste/cut functionality in React Flow
 * Based on React Flow Pro example with adaptations for our Zustand store
 *
 * Features:
 * - Copy: Ctrl/Cmd+C - Copy selected nodes and their connections
 * - Cut: Ctrl/Cmd+X - Copy and remove selected nodes
 * - Paste: Ctrl/Cmd+V - Paste at mouse position
 * - Supports pasting multiple times
 * - Maintains relative positions of nodes
 * - Preserves connections between pasted nodes
 */
export function useCopyPaste() {
  const mousePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const rfDomNode = useStore((state) => state.domNode);

  const { getNodes, setNodes, getEdges, setEdges, screenToFlowPosition } =
    useReactFlow();
  // OPTIMIZATION: Use Zustand selector to prevent unnecessary re-renders
  const saveToHistory = useWorkflowStore((state) => state.saveToHistory);
  const { setCopyPasteFunctions } = useCopyPasteStore();

  // Set up the paste buffers to store the copied nodes and edges
  const [bufferedNodes, setBufferedNodes] = useState<Node[]>([]);
  const [bufferedEdges, setBufferedEdges] = useState<Edge[]>([]);

  // Initialize the copy/paste hook
  // 1. Track mouse position for paste location
  // 2. Prevent default browser copy/paste within React Flow
  useEffect(() => {
    const events = ["cut", "copy", "paste"];

    if (rfDomNode) {
      const preventDefault = (e: Event) => e.preventDefault();

      const onMouseMove = (event: MouseEvent) => {
        mousePosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      };

      for (const event of events) {
        rfDomNode.addEventListener(event, preventDefault);
      }
      rfDomNode.addEventListener("mousemove", onMouseMove);

      return () => {
        for (const event of events) {
          rfDomNode.removeEventListener(event, preventDefault);
        }
        rfDomNode.removeEventListener("mousemove", onMouseMove);
      };
    }
  }, [rfDomNode]);

  /**
   * Copy selected nodes and their internal connections to buffer
   * Only copies edges where both source and target are selected
   */
  const copy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);

    if (selectedNodes.length === 0) {
      console.log("📋 No nodes selected to copy");
      return;
    }

    // Get all edges connected to selected nodes
    // Filter to only include edges where BOTH source and target are selected
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
      (edge) => {
        const isSourceSelected = selectedNodes.some(
          (n) => n.id === edge.source
        );
        const isTargetSelected = selectedNodes.some(
          (n) => n.id === edge.target
        );
        return isSourceSelected && isTargetSelected;
      }
    );

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);

    console.log(
      `📋 Copied ${selectedNodes.length} nodes and ${selectedEdges.length} edges`
    );
  }, [getNodes, getEdges]);

  /**
   * Copy selected nodes and remove them from the canvas
   * Same as copy + delete
   */
  const cut = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);

    if (selectedNodes.length === 0) {
      console.log("✂️ No nodes selected to cut");
      return;
    }

    // Get internal edges (where both source and target are selected)
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter(
      (edge) => {
        const isSourceSelected = selectedNodes.some(
          (n) => n.id === edge.source
        );
        const isTargetSelected = selectedNodes.some(
          (n) => n.id === edge.target
        );
        return isSourceSelected && isTargetSelected;
      }
    );

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);

    // Get selected node IDs for removal from workflow
    const selectedNodeIds = selectedNodes.map((node) => node.id);

    // Update Zustand workflow store - remove nodes and connections
    const { workflow, updateWorkflow } = useWorkflowStore.getState();
    if (workflow) {
      updateWorkflow({
        nodes: workflow.nodes.filter(
          (node) => !selectedNodeIds.includes(node.id)
        ),
        connections: workflow.connections.filter(
          (conn) =>
            !selectedNodeIds.includes(conn.sourceNodeId) &&
            !selectedNodeIds.includes(conn.targetNodeId)
        ),
      });
    }

    // Save to history
    saveToHistory(`Cut ${selectedNodes.length} node(s)`);

    // Remove the cut nodes and their edges from React Flow
    setNodes((nodes) => nodes.filter((node) => !node.selected));
    setEdges((edges) => edges.filter((edge) => !selectedEdges.includes(edge)));

    console.log(
      `✂️ Cut ${selectedNodes.length} nodes and ${selectedEdges.length} edges`
    );
  }, [getNodes, setNodes, getEdges, setEdges, saveToHistory]);

  /**
   * Paste buffered nodes at the specified position (or mouse position)
   * Creates new IDs for pasted nodes and updates edge connections
   * Maintains relative positions of nodes
   */
  const paste = useCallback(
    (position?: XYPosition) => {
      if (bufferedNodes.length === 0) {
        console.log("📌 No nodes in buffer to paste");
        return;
      }

      // Use provided position or convert mouse position to flow coordinates
      const pastePosition =
        position ||
        screenToFlowPosition({
          x: mousePosRef.current.x,
          y: mousePosRef.current.y,
        });

      // Find the top-left corner of the buffered nodes (for relative positioning)
      const minX = Math.min(...bufferedNodes.map((node) => node.position.x));
      const minY = Math.min(...bufferedNodes.map((node) => node.position.y));

      // Use timestamp to create unique IDs
      const now = Date.now();

      // Create new nodes with updated IDs and positions
      const newNodes: Node[] = bufferedNodes.map((node) => {
        const id = `${node.id}-${now}`;
        const x = pastePosition.x + (node.position.x - minX);
        const y = pastePosition.y + (node.position.y - minY);

        return {
          ...node,
          id,
          position: { x, y },
          selected: true, // Select the pasted nodes
        };
      });

      // Create new edges with updated IDs and node references
      const newEdges: Edge[] = bufferedEdges.map((edge) => {
        const id = `${edge.id}-${now}`;
        const source = `${edge.source}-${now}`;
        const target = `${edge.target}-${now}`;

        return {
          ...edge,
          id,
          source,
          target,
          selected: true, // Select the pasted edges
        };
      });

      // Get current workflow from Zustand store
      const { workflow, updateWorkflow } = useWorkflowStore.getState();
      if (!workflow) return;

      // Convert React Flow nodes to workflow nodes
      const workflowNodes = newNodes.map((node) => {
        // Find the original workflow node to preserve all properties
        const originalId = node.id.replace(`-${now}`, "");
        const originalNode = workflow.nodes.find((n) => n.id === originalId);

        return {
          id: node.id,
          type: originalNode?.type || node.type || "default",
          name: (typeof originalNode?.name === 'string' ? originalNode.name : '') || 
                (typeof node.data?.label === 'string' ? node.data.label : '') || 
                node.id,
          position: node.position,
          parameters: originalNode?.parameters || {},
          disabled: originalNode?.disabled || false,
          credentials: originalNode?.credentials,
          locked: originalNode?.locked,
          mockData: originalNode?.mockData,
          mockDataPinned: originalNode?.mockDataPinned,
        };
      });

      // Convert React Flow edges to workflow connections
      const workflowConnections = newEdges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.source,
        sourceOutput: edge.sourceHandle || "main",
        targetNodeId: edge.target,
        targetInput: edge.targetHandle || "main",
      }));

      // Update Zustand workflow store with new nodes and connections
      updateWorkflow({
        nodes: [...workflow.nodes, ...workflowNodes],
        connections: [...workflow.connections, ...workflowConnections],
      });

      // Save to history
      saveToHistory(`Paste ${newNodes.length} node(s)`);

      // Add new nodes and edges to React Flow, deselecting existing ones
      setNodes((nodes) => [
        ...nodes.map((node) => ({ ...node, selected: false })),
        ...newNodes,
      ]);
      setEdges((edges) => [
        ...edges.map((edge) => ({ ...edge, selected: false })),
        ...newEdges,
      ]);

      console.log(
        `📌 Pasted ${newNodes.length} nodes and ${newEdges.length} edges`
      );
    },
    [
      bufferedNodes,
      bufferedEdges,
      screenToFlowPosition,
      setNodes,
      setEdges,
      saveToHistory,
    ]
  );

  // Set up keyboard shortcuts
  useShortcut(["Meta+x", "Control+x"], cut);
  useShortcut(["Meta+c", "Control+c"], copy, true);
  useShortcut(["Meta+v", "Control+v"], paste);

  // Calculate canCopy and canPaste
  const canCopy = getNodes().some((node) => node.selected);
  const canPaste = bufferedNodes.length > 0;

  // Update store with current functions and state
  useEffect(() => {
    setCopyPasteFunctions({
      copy,
      cut,
      paste,
      canCopy,
      canPaste,
    });
  }, [copy, cut, paste, canCopy, canPaste, setCopyPasteFunctions]);

  return {
    cut,
    copy,
    paste,
    bufferedNodes,
    bufferedEdges,
    canCopy,
    canPaste,
  };
}

/**
 * Custom hook to handle keyboard shortcuts
 * @param keyCode - Keyboard shortcut(s) to listen for
 * @param callback - Function to call when shortcut is pressed
 * @param isCopyAction - Special handling for copy to respect text selection
 */
function useShortcut(
  keyCode: KeyCode,
  callback: () => void,
  isCopyAction = false
): void {
  const [didRun, setDidRun] = useState(false);

  const shouldRun = useKeyPress(keyCode, {
    // Keep default browser behavior within input fields
    actInsideInputWithModifier: false,
  });

  useEffect(() => {
    // Check if there's any selected text on the page
    const selection = window.getSelection()?.toString();

    // For copy actions, only allow if there's no text selected
    // This preserves default browser copy behavior for text
    const allowCopy = isCopyAction ? !selection : true;

    if (shouldRun && !didRun && allowCopy) {
      callback();
      setDidRun(true);
    } else {
      setDidRun(shouldRun);
    }
  }, [shouldRun, didRun, callback, isCopyAction]);
}
