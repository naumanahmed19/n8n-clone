import {
    NodeTypes,
    ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useExecutionAwareEdges } from '@/hooks/useEdgeAnimation'
import {
    useCopyPaste,
    useExecutionControls,
    useExecutionPanelData,
    useKeyboardShortcuts,
    useReactFlowInteractions,
    useWorkflowOperations,
} from '@/hooks/workflow'
import { useAddNodeDialogStore, useReactFlowUIStore, useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { NodeType } from '@/types'
import { AddNodeCommandDialog } from './AddNodeCommandDialog'

import { ChatDialog } from './ChatDialog'
import { CustomNode } from './CustomNode'
import { ExecutionPanel } from './ExecutionPanel'
import { NodeConfigDialog } from './NodeConfigDialog'
import { AnnotationNode, ChatInterfaceNode, GroupNode, ImagePreviewNode } from './nodes'
import { WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'
import {
    transformWorkflowEdgesToReactFlow,
    transformWorkflowNodesToReactFlow,
} from './workflowTransformers'

const nodeTypes = {
    custom: CustomNode,
    chat: ChatInterfaceNode,
    'image-preview': ImagePreviewNode,
    group: GroupNode,
    annotation: AnnotationNode,
} as NodeTypes

interface WorkflowEditorProps {
    nodeTypes: NodeType[]
    readOnly?: boolean
    executionMode?: boolean
}

export function WorkflowEditor({ 
    nodeTypes: availableNodeTypes,
    readOnly = false,
    executionMode = false
}: WorkflowEditorProps) {
    // OPTIMIZATION: Use Zustand selectors to prevent unnecessary re-renders
    // Only subscribe to the specific state slices we need
    const workflow = useWorkflowStore(state => state.workflow)
    const showPropertyPanel = useWorkflowStore(state => state.showPropertyPanel)
    const propertyPanelNodeId = useWorkflowStore(state => state.propertyPanelNodeId)
    const showChatDialog = useWorkflowStore(state => state.showChatDialog)
    const chatDialogNodeId = useWorkflowStore(state => state.chatDialogNodeId)
    const undo = useWorkflowStore(state => state.undo)
    const redo = useWorkflowStore(state => state.redo)
    const closeNodeProperties = useWorkflowStore(state => state.closeNodeProperties)
    const closeChatDialog = useWorkflowStore(state => state.closeChatDialog)

    // Command dialog state
    const { isOpen: showAddNodeDialog, openDialog, closeDialog, position } = useAddNodeDialogStore()

    // Use custom hooks for better organization
    const {
        saveWorkflow,
    } = useWorkflowOperations()

    const {
        nodes,
        edges,
        setNodes,
        setEdges,
        handleNodesChange,
        handleEdgesChange,
        handleConnect,
        handleConnectStart,
        handleConnectEnd,
        handleDrop,
        handleDragOver,
        handleSelectionChange,
        handleNodeDoubleClick,
        handleNodeDragStart,
        handleNodeDrag,
        handleNodeDragStop,
        handleSelectionDragStart,
        handleSelectionDragStop,
        handleNodesDelete,
        handleEdgesDelete,
        blockSync,
    } = useReactFlowInteractions()

    // Copy/paste functionality - automatically registers keyboard shortcuts
    // Ctrl/Cmd+C to copy, Ctrl/Cmd+X to cut, Ctrl/Cmd+V to paste
    // Functions are stored in useCopyPasteStore for use in context menus
    useCopyPaste()

    // OPTIMIZATION: Enhance edges with execution-aware animation
    // Only edges in the current execution path will be animated
    const executionAwareEdges = useExecutionAwareEdges(edges)

    const {
        executionState,
        lastExecutionResult,
        realTimeResults,
        executionLogs,
        getNodeResult,
        getFlowStatus,
        getExecutionMetrics,
        clearLogs,
    } = useExecutionControls()

    const {
        showExecutionPanel,
        toggleExecutionPanel,
        executionPanelSize,
        showMinimap,
        showBackground,
        showControls,
        backgroundVariant,
        setReactFlowInstance,
        reactFlowInstance,
    } = useReactFlowUIStore()

    const {
        showNodePalette,
    } = useWorkflowToolbarStore()

    // Execution panel data
    const { flowExecutionStatus, executionMetrics } = useExecutionPanelData({
        executionId: executionState.executionId,
        getFlowStatus,
        getExecutionMetrics,
    })

    // Sync ReactFlow instance to store (hook gets it automatically via useReactFlow)
    const handleReactFlowInit = useCallback((instance: any) => {
        setReactFlowInstance(instance)
    }, [setReactFlowInstance])

    // Memoize empty delete handler to prevent recreation on every render
    const emptyDeleteHandler = useCallback(() => {}, [])

    // Memoize add node handler - calculate viewport center position
    const handleAddNode = useCallback(() => {
        if (reactFlowInstance) {
            // Calculate center of viewport
            const viewportCenter = reactFlowInstance.screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            })
            openDialog(viewportCenter)
        } else {
            // Fallback if instance not ready
            openDialog()
        }
    }, [openDialog, reactFlowInstance])

    // Keyboard shortcuts - disabled in read-only mode
    useKeyboardShortcuts({
        onSave: saveWorkflow,
        onUndo: undo,
        onRedo: redo,
        onDelete: emptyDeleteHandler,
        onAddNode: handleAddNode,
        disabled: readOnly
    })

    // Convert workflow data to React Flow format with real execution status
    // Using useMemo to prevent unnecessary re-transformations when dependencies haven't changed
    const reactFlowNodes = useMemo(() => {
        if (!workflow) return []

        return transformWorkflowNodesToReactFlow(
            workflow.nodes,
            availableNodeTypes,
            executionState,
            getNodeResult,
            lastExecutionResult
        )
    }, [workflow?.nodes, availableNodeTypes, executionState, realTimeResults, lastExecutionResult, getNodeResult])

    // Create execution state key and edges with memoization
    const reactFlowEdges = useMemo(() => {
        if (!workflow) return []

        // Create a key that changes when execution state changes to force edge re-renders
        // This ensures edge buttons become visible after execution completes
        const executionStateKey = `${executionState.status}-${executionState.executionId || 'none'}`
        return transformWorkflowEdgesToReactFlow(workflow.connections, executionStateKey)
    }, [workflow?.connections, executionState.status, executionState.executionId])

    // Sync Zustand workflow â†’ React Flow
    // Only sync when workflow ID changes (new workflow loaded) OR when blockSync is false
    const workflowId = workflow?.id;
    const prevWorkflowIdRef = useRef<string | undefined>();
    
    useEffect(() => {
        const workflowChanged = workflowId !== prevWorkflowIdRef.current;
        const shouldSync = workflowChanged || !blockSync.current;
        
        if (shouldSync) {
            if (workflowChanged) {
                console.log('ðŸ”„ Syncing Zustand â†’ React Flow (workflow changed)', workflowId);
            } else {
                console.log('ðŸ”„ Syncing Zustand â†’ React Flow (not blocked)');
            }
            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
            prevWorkflowIdRef.current = workflowId;
        } else {
            console.log('â¸ï¸  Sync blocked - drag in progress');
        }
    }, [workflowId, reactFlowNodes, reactFlowEdges, setNodes, setEdges, blockSync]);

    // Memoize node type map for O(1) lookups
    const nodeTypeMap = useMemo(() => {
        return new Map(availableNodeTypes.map(nt => [nt.type, nt]))
    }, [availableNodeTypes])

    // Memoize workflow nodes map for O(1) lookups
    const workflowNodesMap = useMemo(() => {
        if (!workflow?.nodes) return new Map()
        return new Map(workflow.nodes.map(node => [node.id, node]))
    }, [workflow?.nodes])

    // Get selected node data for config panel (O(1) lookup)
    const selectedNode = useMemo(() => {
        return propertyPanelNodeId ? workflowNodesMap.get(propertyPanelNodeId) : null
    }, [propertyPanelNodeId, workflowNodesMap])

    const selectedNodeType = useMemo(() => {
        return selectedNode ? nodeTypeMap.get(selectedNode.type) : null
    }, [selectedNode, nodeTypeMap])
    
    // Get chat node data for chat dialog (O(1) lookup)
    const chatNode = useMemo(() => {
        return chatDialogNodeId ? workflowNodesMap.get(chatDialogNodeId) : null
    }, [chatDialogNodeId, workflowNodesMap])

    const chatNodeName = useMemo(() => {
        return chatNode?.name || 'Chat'
    }, [chatNode])

    return (
        <div className="flex flex-col h-full w-full">
            <WorkflowErrorBoundary>
                {/* Main Content Area with Resizable Panels */}
                <div className="flex-1 flex h-full">
                    <ResizablePanelGroup direction="horizontal" className="flex-1">
                        {/* Main Editor Area - Full Width in Execution Mode */}
                        <ResizablePanel defaultSize={(readOnly || !showNodePalette) ? 100 : 80} minSize={50}>
                            {/* Resizable Layout for Canvas and Execution Panel */}
                            <ResizablePanelGroup direction="vertical" className="h-full">
                                {/* React Flow Canvas */}
                                <ResizablePanel 
                                    key={`canvas-${executionPanelSize}`}
                                    defaultSize={100 - executionPanelSize} 
                                    minSize={30}
                                >
                                    <WorkflowCanvas
                                        nodes={nodes}
                                        edges={executionAwareEdges}
                                        nodeTypes={nodeTypes}
                                        showControls={showControls}
                                        showMinimap={showMinimap}
                                        showBackground={showBackground}
                                        backgroundVariant={backgroundVariant}
                                        onInit={handleReactFlowInit}
                                        readOnly={readOnly}
                                        executionMode={executionMode}
                                        // Event handlers from useReactFlowInteractions
                                        onNodesChange={handleNodesChange}
                                        onEdgesChange={handleEdgesChange}
                                        onConnect={handleConnect}
                                        onConnectStart={handleConnectStart}
                                        onConnectEnd={handleConnectEnd}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onSelectionChange={handleSelectionChange}
                                        onNodeDoubleClick={handleNodeDoubleClick}
                                        onNodeDragStart={handleNodeDragStart}
                                        onNodeDrag={handleNodeDrag}
                                        onNodeDragStop={handleNodeDragStop}
                                        onSelectionDragStart={handleSelectionDragStart}
                                        onSelectionDragStop={handleSelectionDragStop}
                                        onNodesDelete={handleNodesDelete}
                                        onEdgesDelete={handleEdgesDelete}
                                    />
                                </ResizablePanel>

                                {/* Execution Panel */}
                                <>
                                    <ResizableHandle withHandle />
                                    <ResizablePanel
                                        key={`execution-${executionPanelSize}`}
                                        defaultSize={executionPanelSize}
                                        minSize={4}
                                        maxSize={70}
                                    >
                                        <ExecutionPanel
                                            executionState={executionState}
                                            lastExecutionResult={lastExecutionResult}
                                            executionLogs={executionLogs}
                                            realTimeResults={realTimeResults}
                                            flowExecutionStatus={flowExecutionStatus}
                                            executionMetrics={executionMetrics}
                                            isExpanded={showExecutionPanel}
                                            onToggle={toggleExecutionPanel}
                                            onClearLogs={clearLogs}
                                        />
                                    </ResizablePanel>
                                </>
                            </ResizablePanelGroup>
                        </ResizablePanel>

                     
                    </ResizablePanelGroup>
                </div>
            </WorkflowErrorBoundary>

            {/* Node Configuration Dialog */}
            {selectedNode && selectedNodeType && (
                <NodeConfigDialog
                    node={selectedNode}
                    nodeType={selectedNodeType}
                    isOpen={showPropertyPanel}
                    onClose={closeNodeProperties}
                    readOnly={readOnly}
                />
            )}
            
            {/* Chat Dialog */}
            {chatDialogNodeId && (
                <ChatDialog
                    nodeId={chatDialogNodeId}
                    nodeName={chatNodeName}
                    isOpen={showChatDialog}
                    onClose={closeChatDialog}
                />
            )}

      

            {/* Add Node Command Dialog - Hidden in read-only mode */}
            {!readOnly && (
                <AddNodeCommandDialog
                    open={showAddNodeDialog}
                    onOpenChange={closeDialog}
                    position={position}
                />
            )}
        </div>
    )
}

// Wrapper component with ReactFlowProvider
export function WorkflowEditorWrapper(props: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <WorkflowEditor {...props} />
        </ReactFlowProvider>
    )
}
