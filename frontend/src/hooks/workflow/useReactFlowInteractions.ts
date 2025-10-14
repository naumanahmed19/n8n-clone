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

  // Track if we've taken a snapshot for current drag operation
  const dragSnapshotTaken = useRef(false);
  // Track if we're currently dragging nodes (prevents sync from parent)
  const isDragging = useRef(false);
  // Track if we should block sync from parent
  const blockSync = useRef(false);

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // IMPORTANT: Pass all changes directly to React Flow's internal handler
      // React Flow handles the visual updates internally
      onNodesChange(changes);

      // Track dragging state
      changes.forEach((change) => {
        if (change.type === "position" && "dragging" in change) {
          if (change.dragging) {
            isDragging.current = true;
          }
        }
      });

      // We DON'T update Zustand store here anymore!
      // Store updates happen in onNodeDragStop instead
    },
    [onNodesChange]
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

  // Handle node drag start - take snapshot BEFORE dragging
  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, _node: any) => {
      // Take snapshot only once per drag operation
      if (!dragSnapshotTaken.current) {
        const { saveToHistory } = useWorkflowStore.getState();
        saveToHistory("Move node");
        dragSnapshotTaken.current = true;
      }
      // Block sync from parent during drag
      isDragging.current = true;
      blockSync.current = true;
    },
    []
  );

  // Handle node drag stop - DON'T update Zustand store here!
  // React Flow is the source of truth during editing
  // Zustand store is only updated when explicitly saving workflow
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: any) => {
      console.log("✅ Node drag stopped:", node.id);
      // Reset flags after a small delay to allow any pending updates
      setTimeout(() => {
        dragSnapshotTaken.current = false;
        isDragging.current = false;
        blockSync.current = false;
      }, 100);

      // NOTE: We deliberately DON'T update Zustand store here!
      // React Flow maintains the node positions internally
      // Zustand store will be updated when user saves the workflow
    },
    []
  );

  // Handle selection drag start - take snapshot BEFORE dragging selection
  const handleSelectionDragStart = useCallback(
    (_event: React.MouseEvent, _nodes: any[]) => {
      // Take snapshot only once per drag operation
      if (!dragSnapshotTaken.current) {
        const { saveToHistory } = useWorkflowStore.getState();
        saveToHistory("Move selection");
        dragSnapshotTaken.current = true;
      }
      // Block sync from parent during drag
      isDragging.current = true;
      blockSync.current = true;
    },
    []
  );

  // Handle selection drag stop - DON'T update Zustand store here!
  const handleSelectionDragStop = useCallback(
    (_event: React.MouseEvent, nodes: any[]) => {
      console.log("✅ Selection drag stopped:", nodes.length, "nodes");
      // Reset flags after a small delay to allow any pending updates
      setTimeout(() => {
        dragSnapshotTaken.current = false;
        isDragging.current = false;
        blockSync.current = false;
      }, 100);

      // NOTE: We deliberately DON'T update Zustand store here!
      // React Flow maintains the node positions internally
      // Zustand store will be updated when user saves the workflow
    },
    []
  );

  // Handle nodes delete - take snapshot BEFORE deletion
  const handleNodesDelete = useCallback((nodes: any[]) => {
    const { saveToHistory } = useWorkflowStore.getState();
    saveToHistory(`Delete ${nodes.length} node(s)`);
  }, []);

  // Handle edges delete - take snapshot BEFORE deletion
  const handleEdgesDelete = useCallback((edges: any[]) => {
    const { saveToHistory } = useWorkflowStore.getState();
    saveToHistory(`Delete ${edges.length} connection(s)`);
  }, []);

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

  // Sync React Flow state back to Zustand (call this before saving)
  const syncToZustand = useCallback(() => {
    const { workflow, setWorkflow } = useWorkflowStore.getState();
    if (!workflow) return;

    // Get current React Flow nodes
    const currentNodes = reactFlowInstance?.getNodes() || [];

    // Update Zustand workflow with current React Flow positions
    const updatedWorkflow = {
      ...workflow,
      nodes: workflow.nodes.map((node) => {
        const reactFlowNode = currentNodes.find(
          (rfNode) => rfNode.id === node.id
        );
        if (reactFlowNode && reactFlowNode.position) {
          return { ...node, position: reactFlowNode.position };
        }
        return node;
      }),
    };

    setWorkflow(updatedWorkflow);
    console.log("💾 Synced React Flow → Zustand");
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

    // Drag state
    isDragging,
    blockSync,

    // Sync utility
    syncToZustand,

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

    // Undo/Redo optimized handlers
    handleNodeDragStart,
    handleNodeDragStop,
    handleSelectionDragStart,
    handleSelectionDragStop,
    handleNodesDelete,
    handleEdgesDelete,

    // Controls
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleZoomToFit,

    // State
    selectedNodeId,
  };
}
