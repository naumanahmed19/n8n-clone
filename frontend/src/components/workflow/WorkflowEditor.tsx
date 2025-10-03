import { useCallback, useEffect } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
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
    useKeyboardShortcuts,
    useReactFlowInteractions,
    useWorkflowOperations,
} from '@/hooks/workflow'
import { useAddNodeDialogStore, useReactFlowUIStore, useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { NodeType } from '@/types'
import { isTriggerNode } from '@/utils/nodeTypeClassification'
import { AddNodeCommandDialog } from './AddNodeCommandDialog'

import { CustomNode } from './CustomNode'
import { ExecutionPanel } from './ExecutionPanel'
import { NodeConfigDialog } from './NodeConfigDialog'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'


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

        const reactFlowNodes = workflow.nodes.map(node => {
            // Get real-time execution result for this node
            const nodeResult = getNodeResult(node.id)
            
            // Determine node status based on execution state and real-time results
            let nodeStatus: 'idle' | 'running' | 'success' | 'error' | 'skipped' = 'idle'
            
            if (executionState.status === 'running') {
                if (nodeResult) {
                    // Use real-time result status
                    if (nodeResult.status === 'success') nodeStatus = 'success'
                    else if (nodeResult.status === 'error') nodeStatus = 'error'
                    else if (nodeResult.status === 'skipped') nodeStatus = 'skipped'
                    else nodeStatus = 'running'
                } else {
                    // Node hasn't started yet or no real-time data
                    nodeStatus = 'idle'
                }
            } else if (executionState.status === 'success' || executionState.status === 'error' || executionState.status === 'cancelled') {
                // Execution completed, use final results
                if (nodeResult) {
                    nodeStatus = nodeResult.status
                } else if (lastExecutionResult) {
                    // Fallback to last execution result
                    const lastNodeResult = lastExecutionResult.nodeResults.find(nr => nr.nodeId === node.id)
                    if (lastNodeResult) {
                        nodeStatus = lastNodeResult.status
                    }
                }
            }

            // Find the corresponding node type definition to get inputs/outputs info
            const nodeTypeDefinition = availableNodeTypes.find(nt => nt.type === node.type)
            
            return {
                id: node.id,
                type: 'custom',
                position: node.position,
                data: {
                    label: node.name,
                    nodeType: node.type,
                    parameters: node.parameters,
                    disabled: node.disabled,
                    status: nodeStatus,
                    // Add inputs/outputs information from node type definition
                    inputs: nodeTypeDefinition?.inputs || [],
                    // Dynamic outputs for Switch node based on configured outputs
                    outputs: node.type === 'switch' && node.parameters?.outputs
                        ? (node.parameters.outputs as any[]).map((output: any, index: number) => 
                            output.outputName || `Output ${index + 1}`
                          )
                        : nodeTypeDefinition?.outputs || [],
                    // Add position and style information
                    position: node.position,
                    dimensions: { width: 64, height: 64 }, // Default dimensions for now
                    customStyle: {
                        backgroundColor: nodeTypeDefinition?.color || '#666',
                        borderColor: undefined, // Will be handled by CSS based on selection state
                        borderWidth: 2,
                        borderRadius: isTriggerNode(node.type) ? 32 : 8, // Rounded for triggers
                        shape: isTriggerNode(node.type) ? 'trigger' : 'rectangle',
                        opacity: node.disabled ? 0.5 : 1.0
                    },
                    // Add execution result data for display
                    executionResult: nodeResult,
                    lastExecutionData: lastExecutionResult?.nodeResults.find(nr => nr.nodeId === node.id)
                }
            }
        })

        const reactFlowEdges = workflow.connections.map(conn => ({
            id: conn.id,
            source: conn.sourceNodeId,
            target: conn.targetNodeId,
            sourceHandle: conn.sourceOutput,
            targetHandle: conn.targetInput,
            type: 'smoothstep',
            data: {
                label: conn.sourceOutput !== 'main' ? conn.sourceOutput : undefined
            }
        }))

        setNodes(reactFlowNodes)
        setEdges(reactFlowEdges)
    }, [workflow, executionState, realTimeResults, lastExecutionResult, getNodeResult, setNodes, setEdges])

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
                                    <div className="h-full " ref={reactFlowWrapper}>
                                        <WorkflowCanvasContextMenu>
                                            <ReactFlow
                                                nodes={nodes}
                                                edges={edges}
                                                onNodesChange={handleNodesChange}
                                                onEdgesChange={handleEdgesChange}
                                                onConnect={handleConnect}
                                                onInit={handleReactFlowInit}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                                onSelectionChange={handleSelectionChange}
                                                onNodeDoubleClick={(event, node) => handleNodeDoubleClick(event, node.id)}
                                                nodeTypes={nodeTypes}
                                          
                                                fitView
                                                attributionPosition="bottom-left"
                                                // Performance optimizations
                                                edgeUpdaterRadius={10}
                                                connectionRadius={20}
                                       
                                                defaultEdgeOptions={{
                                                    type: 'smoothstep',
                                                    animated: false,
                                                }}
                                            >
                                                {showControls && <Controls />}
                                                {showMinimap && <MiniMap />}
                                                {showBackground && <Background variant={backgroundVariant as any} gap={12} size={1} />}
                                            </ReactFlow>
                                        </WorkflowCanvasContextMenu>
                                    </div>
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
                                            flowExecutionStatus={executionState.executionId ? getFlowStatus(executionState.executionId) : null}
                                            executionMetrics={executionState.executionId ? getExecutionMetrics(executionState.executionId) : null}
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