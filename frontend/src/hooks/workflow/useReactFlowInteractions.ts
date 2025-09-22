import { useWorkflowStore } from "@/stores";
import { NodeType, WorkflowConnection, WorkflowNode } from "@/types";
import { useCallback, useRef, useState } from "react";
import {
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnSelectionChangeParams,
  ReactFlowInstance,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";

/**
 * Custom hook for ReactFlow interactions
 * Handles node/edge changes, connections, drag/drop, and selection
 */
export function useReactFlowInteractions() {
  const {
    workflow,
    selectedNodeId,
    addNode,
    updateNode,
    addConnection,
    removeConnection,
    setSelectedNode,
    showPropertyPanel,
    propertyPanelNodeId,
    openNodeProperties,
    closeNodeProperties,
  } = useWorkflowStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Handle node selection
  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const selectedNode = params.nodes[0];
      if (selectedNode) {
        setSelectedNode(selectedNode.id);
        // Don't automatically open config panel - only set selection
      } else {
        setSelectedNode(null);
        // Only close config panel if no node is selected AND the property panel is open
        // but the propertyPanelNodeId doesn't match any existing workflow node
        // This prevents the dialog from closing during execution state changes
        // while still allowing it to close when a node is actually removed or user clicks away
        if (showPropertyPanel && propertyPanelNodeId) {
          const nodeExists = workflow?.nodes.find(
            (node) => node.id === propertyPanelNodeId
          );
          if (!nodeExists) {
            closeNodeProperties();
          }
        }
      }
    },
    [
      setSelectedNode,
      showPropertyPanel,
      propertyPanelNodeId,
      workflow,
      closeNodeProperties,
    ]
  );

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Update workflow store with position changes
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          updateNode(change.id, { position: change.position });
        }
      });
    },
    [onNodesChange, updateNode]
  );

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);

      // Handle edge removal
      changes.forEach((change) => {
        if (change.type === "remove") {
          removeConnection(change.id);
        }
      });
    },
    [onEdgesChange, removeConnection]
  );

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      const newConnection: WorkflowConnection = {
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        sourceNodeId: connection.source,
        sourceOutput: connection.sourceHandle || "main",
        targetNodeId: connection.target,
        targetInput: connection.targetHandle || "main",
      };

      addConnection(newConnection);

      const newEdge = {
        id: newConnection.id,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      setEdges((edges) => addEdge(newEdge, edges));
    },
    [addConnection, setEdges]
  );

  // Handle drag over for node dropping
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle node drop from palette
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      const nodeTypeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeTypeData) return;

      try {
        const nodeType: NodeType = JSON.parse(nodeTypeData);

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: nodeType.type,
          name: nodeType.displayName,
          parameters: { ...nodeType.defaults },
          position,
          credentials: [],
          disabled: false,
        };

        addNode(newNode);
      } catch (error) {
        console.error("Failed to parse dropped node data:", error);
      }
    },
    [reactFlowInstance, addNode]
  );

  // Handle node double-click to open properties
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault();
      event.stopPropagation();
      openNodeProperties(nodeId);
    },
    [openNodeProperties]
  );

  // ReactFlow control functions
  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  }, [reactFlowInstance]);

  const handleZoomToFit = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
  }, [reactFlowInstance]);

  return {
    // Refs and instances
    reactFlowWrapper,
    reactFlowInstance,
    setReactFlowInstance,

    // Node and edge state
    nodes,
    edges,
    setNodes,
    setEdges,

    // Event handlers
    handleSelectionChange,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleDragOver,
    handleDrop,
    handleNodeDoubleClick,

    // Controls
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleZoomToFit,

    // State
    selectedNodeId,
  };
}
