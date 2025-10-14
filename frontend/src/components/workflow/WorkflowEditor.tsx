import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
    NodeTypes,
    ReactFlowProvider
} from 'reactflow'
import 'reactflow/dist/style.css'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
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
import { ChatInterfaceNode, ImagePreviewNode } from './nodes'
import { WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'
import {
    transformWorkflowEdgesToReactFlow,
    transformWorkflowNodesToReactFlow,
} from './workflowTransformers'


const nodeTypes: NodeTypes = {
    custom: CustomNode,
    chat: ChatInterfaceNode,
    'image-preview': ImagePreviewNode,
}

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
    const {
        workflow,
        showPropertyPanel,
        propertyPanelNodeId,
        showChatDialog,
        chatDialogNodeId,
        undo,
        redo,
        closeNodeProperties,
        closeChatDialog,
    } = useWorkflowStore()

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

    // Memoize add node handler
    const handleAddNode = useCallback(() => openDialog(), [openDialog])

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

    // Sync Zustand workflow → React Flow
    // Only sync when workflow ID changes (new workflow loaded) OR when blockSync is false
    const workflowId = workflow?.id;
    const prevWorkflowIdRef = useRef<string | undefined>();
    
    useEffect(() => {
        const workflowChanged = workflowId !== prevWorkflowIdRef.current;
        const shouldSync = workflowChanged || !blockSync.current;
        
        if (shouldSync) {
            if (workflowChanged) {
                console.log('🔄 Syncing Zustand → React Flow (workflow changed)', workflowId);
            } else {
                console.log('🔄 Syncing Zustand → React Flow (not blocked)');
            }
            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
            prevWorkflowIdRef.current = workflowId;
        } else {
            console.log('⏸️  Sync blocked - drag in progress');
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
                                        edges={edges}
                                        nodeTypes={nodeTypes}
                                        showControls={showControls}
                                        showMinimap={showMinimap}
                                        showBackground={showBackground}
                                        backgroundVariant={backgroundVariant}
                                        onInit={handleReactFlowInit}
                                        isExecuting={executionState.status === 'running'}
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