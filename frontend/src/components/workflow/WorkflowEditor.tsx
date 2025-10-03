import { useCallback, useEffect } from 'react'
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
    useExecutionControls,
    useExecutionPanelData,
    useKeyboardShortcuts,
    useReactFlowInteractions,
    useWorkflowOperations,
} from '@/hooks/workflow'
import { useAddNodeDialogStore, useReactFlowUIStore, useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { NodeType } from '@/types'
import { AddNodeCommandDialog } from './AddNodeCommandDialog'

import { CustomNode } from './CustomNode'
import { ExecutionPanel } from './ExecutionPanel'
import { NodeConfigDialog } from './NodeConfigDialog'
import { WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'
import {
    transformWorkflowEdgesToReactFlow,
    transformWorkflowNodesToReactFlow,
} from './workflowTransformers'


const nodeTypes: NodeTypes = {
    custom: CustomNode,
}

interface WorkflowEditorProps {
    nodeTypes: NodeType[]
}

export function WorkflowEditor({ nodeTypes: availableNodeTypes }: WorkflowEditorProps) {
    const {
        workflow,
        showPropertyPanel,
        propertyPanelNodeId,
        undo,
        redo,
        closeNodeProperties,
    } = useWorkflowStore()

    // Command dialog state
    const { isOpen: showAddNodeDialog, openDialog, closeDialog, position } = useAddNodeDialogStore()

    // Use custom hooks for better organization
    const {
        saveWorkflow,
    } = useWorkflowOperations()

    const {
        reactFlowWrapper,
        setReactFlowInstance: setReactFlowInstanceFromHook,
        nodes,
        edges,
        setNodes,
        setEdges,
        handleSelectionChange,
        handleNodesChange,
        handleEdgesChange,
        handleConnect,
        handleDragOver,
        handleDrop,
        handleNodeDoubleClick,
    } = useReactFlowInteractions()

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

    // Sync ReactFlow instance to both hook and store
    const handleReactFlowInit = useCallback((instance: any) => {
        setReactFlowInstanceFromHook(instance)
        setReactFlowInstance(instance)
    }, [setReactFlowInstanceFromHook, setReactFlowInstance])

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onSave: saveWorkflow,
        onUndo: undo,
        onRedo: redo,
        onDelete: () => {}, // Will be set by the hook
        onAddNode: () => openDialog(),
    })

    // Convert workflow data to React Flow format with real execution status
    useEffect(() => {
        if (!workflow) return

        const reactFlowNodes = transformWorkflowNodesToReactFlow(
            workflow.nodes,
            availableNodeTypes,
            executionState,
            getNodeResult,
            lastExecutionResult
        )

        const reactFlowEdges = transformWorkflowEdgesToReactFlow(workflow.connections)

        setNodes(reactFlowNodes)
        setEdges(reactFlowEdges)
    }, [workflow, executionState, realTimeResults, lastExecutionResult, getNodeResult, availableNodeTypes, setNodes, setEdges])

    // Get selected node data for config panel
    const selectedNode = workflow?.nodes.find(node => node.id === propertyPanelNodeId)
    const selectedNodeType = selectedNode ? availableNodeTypes.find(nt => nt.type === selectedNode.type) : null

    return (
        <div className="flex flex-col h-full w-full">
            <WorkflowErrorBoundary>
                {/* Main Content Area with Resizable Panels */}
                <div className="flex-1 flex h-full">
                    <ResizablePanelGroup direction="horizontal" className="flex-1">
                        {/* Main Editor Area */}
                        <ResizablePanel defaultSize={showNodePalette ? 80 : 100} minSize={50}>
                            {/* Resizable Layout for Canvas and Execution Panel */}
                            <ResizablePanelGroup direction="vertical" className="h-full">
                                {/* React Flow Canvas */}
                                <ResizablePanel 
                                    key={`canvas-${executionPanelSize}`}
                                    defaultSize={100 - executionPanelSize} 
                                    minSize={30}
                                >
                                    <WorkflowCanvasContextMenu>
                                        <WorkflowCanvas
                                            nodes={nodes}
                                            edges={edges}
                                            nodeTypes={nodeTypes}
                                            reactFlowWrapper={reactFlowWrapper}
                                            showControls={showControls}
                                            showMinimap={showMinimap}
                                            showBackground={showBackground}
                                            backgroundVariant={backgroundVariant}
                                            onNodesChange={handleNodesChange}
                                            onEdgesChange={handleEdgesChange}
                                            onConnect={handleConnect}
                                            onInit={handleReactFlowInit}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onSelectionChange={handleSelectionChange}
                                            onNodeDoubleClick={handleNodeDoubleClick}
                                        />
                                    </WorkflowCanvasContextMenu>
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
                />
            )}

      

            {/* Add Node Command Dialog */}
            <AddNodeCommandDialog
                open={showAddNodeDialog}
                onOpenChange={closeDialog}
                nodeTypes={availableNodeTypes}
                position={position}
            />
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