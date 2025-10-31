import { useAddNodeDialogStore, useWorkflowStore } from "@/stores";
import { NodeType, WorkflowConnection, WorkflowNode } from "@/types";
import {
  Connection,
  Edge,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnSelectionChangeParams,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useRef, useState } from "react";
import { useNodeGroupDragHandlers } from "./useNodeGroupDragHandlers";

/**
 * Custom hook for ReactFlow interactions
 * Handles node/edge changes, connections, drag/drop, and selection
 */
export function useReactFlowInteractions() {
  // OPTIMIZATION: Use Zustand selectors to prevent unnecessary re-renders
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const addNode = useWorkflowStore((state) => state.addNode);
  const addConnection = useWorkflowStore((state) => state.addConnection);
  const removeConnection = useWorkflowStore((state) => state.removeConnection);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const showPropertyPanel = useWorkflowStore(
    (state) => state.showPropertyPanel
  );
  const propertyPanelNodeId = useWorkflowStore(
    (state) => state.propertyPanelNodeId
  );
  const openNodeProperties = useWorkflowStore(
    (state) => state.openNodeProperties
  );
  const closeNodeProperties = useWorkflowStore(
    (state) => state.closeNodeProperties
  );

  const { openDialog } = useAddNodeDialogStore();

  const [connectionInProgress, setConnectionInProgress] =
    useState<Connection | null>(null);

  // Add ref to track connection state as fallback when state gets reset
  const connectionRef = useRef<Connection | null>(null);

  // Track if a connection was successfully made
  const connectionMadeRef = useRef<boolean>(false);

  // Use the useReactFlow hook to get the ReactFlow instance directly
  const reactFlowInstance = useReactFlow();

  // Get group drag handlers for adding nodes to groups
  const { onNodeDrag: onNodeDragGroup, onNodeDragStop: onNodeDragStopGroup } =
    useNodeGroupDragHandlers();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Check if a node exists in the workflow
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
      } else {
        setSelectedNode(null);
        // Close property panel if the node no longer exists in workflow
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

  // Drag operation state tracking
  const dragSnapshotTaken = useRef(false);
  const isDragging = useRef(false);
  const blockSync = useRef(false);
  const resizeSnapshotTaken = useRef(false);
  const isResizing = useRef(false);

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Track dragging state and handle dimension changes
      let isResizeComplete = false;
      let isResizeStart = false;

      changes.forEach((change) => {
        if (change.type === "position" && "dragging" in change) {
          if (change.dragging) {
            isDragging.current = true;
          }
        }

        // Detect dimension changes (from resizing)
        if (change.type === "dimensions") {
          // Check if resize is starting
          if ("resizing" in change && change.resizing === true) {
            isResizeStart = true;
            isResizing.current = true;
            blockSync.current = true; // Block sync during resize
          }
          // Check if resize is complete (resizing becomes false or undefined)
          if ("resizing" in change && change.resizing === false) {
            isResizeComplete = true;
          }
        }
      });

      // Take snapshot at the start of resize operation (only once)
      if (isResizeStart && !resizeSnapshotTaken.current) {
        const { saveToHistory } = useWorkflowStore.getState();
        saveToHistory("Resize group");
        resizeSnapshotTaken.current = true;
      }

      // Only sync to Zustand when resize is COMPLETE, not during continuous resizing
      if (isResizeComplete && reactFlowInstance) {
        // Use a short delay to ensure React Flow state is updated
        setTimeout(() => {
          const { workflow, updateWorkflow, setDirty } =
            useWorkflowStore.getState();
          if (workflow) {
            const currentNodes = reactFlowInstance.getNodes();
            const existingNodesMap = new Map(
              workflow.nodes.map((n) => [n.id, n])
            );
            const updatedNodes: WorkflowNode[] = [];

            currentNodes.forEach((rfNode) => {
              const existingNode = existingNodesMap.get(rfNode.id);

              if (rfNode.type === "group") {
                const baseGroupNode = existingNode || {
                  id: rfNode.id,
                  type: "group",
                  name: `Group ${rfNode.id}`,
                  parameters: {},
                  position: rfNode.position,
                  disabled: false,
                };

                // React Flow stores dimensions in width/height properties
                // Merge them with existing style or create new style object
                const style = {
                  ...(rfNode.style || {}),
                  ...(rfNode.width !== undefined && { width: rfNode.width }),
                  ...(rfNode.height !== undefined && { height: rfNode.height }),
                };



                updatedNodes.push({
                  ...baseGroupNode,
                  position: rfNode.position,
                  style: style as any,
                });
              } else if (existingNode) {
                updatedNodes.push({
                  ...existingNode,
                  position: rfNode.position,
                  parentId: rfNode.parentId || undefined,
                  extent: (rfNode.extent || undefined) as any,
                });
              }
            });

            updateWorkflow({ nodes: updatedNodes });
            setDirty(true);

            // Reset resize flags IMMEDIATELY after updating Zustand
            // This allows WorkflowEditor to sync the updated dimensions back to ReactFlow
            resizeSnapshotTaken.current = false;
            isResizing.current = false;
            blockSync.current = false;
          }
        }, 0);
      }
    },
    [onNodesChange, reactFlowInstance]
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

  // Helper function to sync React Flow positions to Zustand after drag
  const syncPositionsToZustand = useCallback(() => {
    const { workflow, updateWorkflow } = useWorkflowStore.getState();
    if (workflow && reactFlowInstance) {
      const currentNodes = reactFlowInstance.getNodes();

      // Create a map of existing workflow nodes
      const existingNodesMap = new Map(workflow.nodes.map((n) => [n.id, n]));

      // Update existing nodes and add new group nodes
      const updatedNodes: WorkflowNode[] = [];

      currentNodes.forEach((rfNode) => {
        const existingNode = existingNodesMap.get(rfNode.id);

        if (rfNode.type === "group") {
          // Handle group nodes
          const baseGroupNode = existingNode || {
            id: rfNode.id,
            type: "group",
            name: `Group ${rfNode.id}`,
            parameters: {},
            position: rfNode.position,
            disabled: false,
          };

          // React Flow stores dimensions in width/height properties
          // Merge them with existing style or create new style object
          const style = {
            ...(rfNode.style || {}),
            ...(rfNode.width !== undefined && { width: rfNode.width }),
            ...(rfNode.height !== undefined && { height: rfNode.height }),
          };

          updatedNodes.push({
            ...baseGroupNode,
            position: rfNode.position,
            style: style as any,
          });
        } else if (existingNode) {
          // Update existing regular nodes
          updatedNodes.push({
            ...existingNode,
            position: rfNode.position,
            parentId: rfNode.parentId || undefined,
            extent: (rfNode.extent || undefined) as any,
          });
        }
      });

      updateWorkflow({ nodes: updatedNodes });
    }
  }, [reactFlowInstance]);

  // Helper function to reset drag flags
  const resetDragFlags = useCallback(() => {
    setTimeout(() => {
      dragSnapshotTaken.current = false;
      isDragging.current = false;
      blockSync.current = false;
    }, 100);
  }, []);

  // Handle node drag start - take snapshot BEFORE dragging
  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, _node: any) => {
      if (!dragSnapshotTaken.current) {
        const { saveToHistory } = useWorkflowStore.getState();
        saveToHistory("Move node");
        dragSnapshotTaken.current = true;
      }
      isDragging.current = true;
      blockSync.current = true;
    },
    []
  );

  // Handle node drag - check for group intersections and highlight
  const handleNodeDrag = useCallback(
    (event: React.MouseEvent, node: any, nodes: any[]) => {
      // Call the group drag handler to check for intersections
      onNodeDragGroup(event, node, nodes);
    },
    [onNodeDragGroup]
  );

  // Handle node drag stop
  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: any, nodes: any[]) => {
      // First, call the group drag stop handler to attach to group if needed
      onNodeDragStopGroup(event, node, nodes);

      // Then sync positions and reset flags
      syncPositionsToZustand();
      resetDragFlags();
    },
    [onNodeDragStopGroup, syncPositionsToZustand, resetDragFlags]
  );

  // Handle selection drag start - take snapshot BEFORE dragging selection
  const handleSelectionDragStart = useCallback(
    (_event: React.MouseEvent, _nodes: any[]) => {
      if (!dragSnapshotTaken.current) {
        const { saveToHistory } = useWorkflowStore.getState();
        saveToHistory("Move selection");
        dragSnapshotTaken.current = true;
      }
      isDragging.current = true;
      blockSync.current = true;
    },
    []
  );

  // Handle selection drag stop
  const handleSelectionDragStop = useCallback(
    (_event: React.MouseEvent, _nodes: any[]) => {
      syncPositionsToZustand();
      resetDragFlags();
    },
    [syncPositionsToZustand, resetDragFlags]
  );

  // Handle nodes delete
  const handleNodesDelete = useCallback((nodes: any[]) => {
    if (nodes.length === 0) return;

    const nodeIds = nodes.map((node) => node.id);

    // Update Zustand workflow store
    const { workflow, updateWorkflow, saveToHistory } =
      useWorkflowStore.getState();
    if (workflow) {
      // Save to history before deletion
      saveToHistory(`Delete ${nodes.length} node(s)`);

      // Remove nodes and their connections from workflow
      updateWorkflow({
        nodes: workflow.nodes.filter((node) => !nodeIds.includes(node.id)),
        connections: workflow.connections.filter(
          (conn) =>
            !nodeIds.includes(conn.sourceNodeId) &&
            !nodeIds.includes(conn.targetNodeId)
        ),
      });
    }
  }, []);

  // Handle edges delete
  const handleEdgesDelete = useCallback((edges: any[]) => {
    if (edges.length === 0) return;

    const edgeIds = edges.map((edge) => edge.id);

    // Update Zustand workflow store
    const { workflow, updateWorkflow, saveToHistory } =
      useWorkflowStore.getState();
    if (workflow) {
      // Save to history before deletion
      saveToHistory(`Delete ${edges.length} connection(s)`);

      // Remove connections from workflow
      updateWorkflow({
        connections: workflow.connections.filter(
          (conn) => !edgeIds.includes(conn.id)
        ),
      });
    }
  }, []);

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      // Mark that a connection was successfully made
      connectionMadeRef.current = true;

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
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      };

      setEdges((edges) => addEdge(newEdge as Edge, edges));
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

      if (!reactFlowInstance) return;

      // Get the ReactFlow wrapper element from the DOM
      const reactFlowWrapper = document.querySelector(
        ".react-flow"
      ) as HTMLElement;
      const reactFlowBounds = reactFlowWrapper?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const nodeTypeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeTypeData) return;

      try {
        const nodeType: NodeType = JSON.parse(nodeTypeData);

        const position = reactFlowInstance.screenToFlowPosition({
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
        // Reset the connection made flag
        connectionMadeRef.current = false;

        const connection = {
          source: params.nodeId,
          sourceHandle: params.handleId ?? null,
          target: "",
          targetHandle: null,
        };
        setConnectionInProgress(connection);
        connectionRef.current = connection;
      }
    },
    []
  );

  // Handle connection end - if dropped on canvas, show add node dialog
  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Use ref as fallback if state is null
      const activeConnection = connectionInProgress || connectionRef.current;

      if (!activeConnection || !reactFlowInstance) {
        setConnectionInProgress(null);
        connectionRef.current = null;
        connectionMadeRef.current = false;
        return;
      }

      // Use a small delay to allow handleConnect to fire first if a connection was made
      setTimeout(() => {
        // If a connection was successfully made to an existing node, don't open the dialog
        if (connectionMadeRef.current) {
          setConnectionInProgress(null);
          connectionRef.current = null;
          connectionMadeRef.current = false;
          return;
        }

        // Connection was not made to an existing node, so it was dropped on canvas
        if (activeConnection.source) {
          // Get the mouse position
          const clientX =
            "clientX" in event
              ? event.clientX
              : (event as TouchEvent).touches[0].clientX;
          const clientY =
            "clientY" in event
              ? event.clientY
              : (event as TouchEvent).touches[0].clientY;

          // Get the ReactFlow wrapper element from the DOM
          const reactFlowWrapper = document.querySelector(
            ".react-flow"
          ) as HTMLElement;
          const reactFlowBounds = reactFlowWrapper?.getBoundingClientRect();
          if (!reactFlowBounds) {
            setConnectionInProgress(null);
            connectionRef.current = null;
            connectionMadeRef.current = false;
            return;
          }

          // Convert screen coordinates to flow coordinates
          const position = reactFlowInstance.screenToFlowPosition({
            x: clientX - reactFlowBounds.left,
            y: clientY - reactFlowBounds.top,
          });

          // Open the add node dialog at the drop position with source connection context
          openDialog(position, {
            sourceNodeId: activeConnection.source,
            targetNodeId: "", // Empty target since we're adding a new node
            sourceOutput: activeConnection.sourceHandle || undefined,
            targetInput: undefined,
          });
        }

        setConnectionInProgress(null);
        connectionRef.current = null;
        connectionMadeRef.current = false;
      }, 0);
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

    // Create a map of existing workflow nodes for quick lookup
    const existingNodesMap = new Map(workflow.nodes.map((n) => [n.id, n]));

    // Build updated nodes array
    const updatedNodes: WorkflowNode[] = [];

    currentNodes.forEach((rfNode) => {
      const existingNode = existingNodesMap.get(rfNode.id);

      if (rfNode.type === "group") {
        // Handle group nodes - preserve existing data and merge with current state
        const existingGroupNode = existingNodesMap.get(rfNode.id);
        const groupNode: WorkflowNode = existingGroupNode
          ? {
            ...existingGroupNode, // Preserve all existing fields (name, description, etc.)
            position: rfNode.position,
            style: rfNode.style as any,
          }
          : {
            // New group node
            id: rfNode.id,
            type: "group",
            name: "",
            parameters: rfNode.data || {},
            position: rfNode.position,
            disabled: false,
            style: rfNode.style as any,
          };
        updatedNodes.push(groupNode);
      } else if (existingNode) {
        // Update existing regular node with current position and parent info
        updatedNodes.push({
          ...existingNode,
          position: rfNode.position,
          parentId: rfNode.parentId || undefined,
          extent: (rfNode.extent || undefined) as any, // Cast to compatible type
        });
      }
      // Note: We skip nodes that don't exist in workflow and aren't groups
      // These might be temporary UI nodes that shouldn't be persisted
    });

    // Update Zustand workflow with synced nodes
    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes,
    };

    setWorkflow(updatedWorkflow);
  }, [reactFlowInstance]);

  return {
    // Refs and instances
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
    handleNodeDrag,
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
