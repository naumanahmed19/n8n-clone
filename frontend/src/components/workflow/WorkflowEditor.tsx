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
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'
import {
    transformWorkflowEdgesToReactFlow,
    transformWorkflowNodesToReactFlow,
} from './workflowTransformers'
import { ChatInterfaceNode } from './nodes'


const nodeTypes: NodeTypes = {
    custom: CustomNode,
    chat: ChatInterfaceNode,
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
        nodes,
        edges,
        setNodes,
        setEdges,
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

    // Sync ReactFlow instance to store (hook gets it automatically via useReactFlow)
    const handleReactFlowInit = useCallback((instance: any) => {
        setReactFlowInstance(instance)
    }, [setReactFlowInstance])

    // Keyboard shortcuts - disabled in read-only mode
    useKeyboardShortcuts({
        onSave: saveWorkflow,
        onUndo: undo,
        onRedo: redo,
        onDelete: () => {}, // Will be set by the hook
        onAddNode: () => openDialog(),
        disabled: readOnly
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