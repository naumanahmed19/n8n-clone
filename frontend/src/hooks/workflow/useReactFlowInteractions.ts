import { useAddNodeDialogStore, useWorkflowStore } from "@/stores";
import { NodeType, WorkflowConnection, WorkflowNode } from "@/types";
import { useCallback, useRef, useState } from "react";
import {
  Connection,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnSelectionChangeParams,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

/**
 * Custom hook for ReactFlow interactions
 * Handles node/edge changes, connections, drag/drop, and selection
 */
export function useReactFlowInteractions() {
  const {
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

  const { openDialog } = useAddNodeDialogStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [connectionInProgress, setConnectionInProgress] =
    useState<Connection | null>(null);

  // Use the useReactFlow hook to get the ReactFlow instance directly
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Optimized: Use a selector to check node existence without subscribing to entire workflow
  const checkNodeExists = useCallback((nodeId: string) => {
    const workflow = useWorkflowStore.getState().workflow;
    return workflow?.nodes.some((node) => node.id === nodeId) ?? false;
  }, []);

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
          const nodeExists = checkNodeExists(propertyPanelNodeId);
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
      checkNodeExists,
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

        // Initialize parameters with defaults from node type and properties
        const parameters: Record<string, any> = { ...nodeType.defaults };

        // Add default values from properties
        nodeType.properties.forEach((property) => {
          if (
            property.default !== undefined &&
            parameters[property.name] === undefined
          ) {
            parameters[property.name] = property.default;
          }
        });

        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: nodeType.type,
          name: nodeType.displayName,
          parameters,
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

  // Handle connection start - track the connection being created
  const handleConnectStart = useCallback(
    (
      _event: React.MouseEvent | React.TouchEvent,
      params: {
        nodeId: string | null;
        handleId: string | null;
        handleType: string | null;
      }
    ) => {
      if (params.nodeId && params.handleType === "source") {
        setConnectionInProgress({
          source: params.nodeId,
          sourceHandle: params.handleId,
          target: null,
          targetHandle: null,
        });
      }
    },
    []
  );

  // Handle connection end - if dropped on canvas, show add node dialog
  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectionInProgress || !reactFlowInstance) {
        setConnectionInProgress(null);
        return;
      }

      const targetIsPane = (event.target as HTMLElement).classList.contains(
        "react-flow__pane"
      );

      if (targetIsPane && connectionInProgress.source) {
        // Connection was dropped on the canvas (not on a node)
        // Get the mouse position
        const clientX =
          "clientX" in event
            ? event.clientX
            : (event as TouchEvent).touches[0].clientX;
        const clientY =
          "clientY" in event
            ? event.clientY
            : (event as TouchEvent).touches[0].clientY;

        const reactFlowBounds =
          reactFlowWrapper.current?.getBoundingClientRect();
        if (!reactFlowBounds) {
          setConnectionInProgress(null);
          return;
        }

        // Convert screen coordinates to flow coordinates
        const position = reactFlowInstance.project({
          x: clientX - reactFlowBounds.left,
          y: clientY - reactFlowBounds.top,
        });

        // Open the add node dialog at the drop position with source connection context
        openDialog(position, {
          sourceNodeId: connectionInProgress.source,
          targetNodeId: "", // Empty target since we're adding a new node
          sourceOutput: connectionInProgress.sourceHandle || undefined,
          targetInput: undefined,
        });
      }

      setConnectionInProgress(null);
    },
    [connectionInProgress, reactFlowInstance, openDialog]
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
    handleConnectStart,
    handleConnectEnd,
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
