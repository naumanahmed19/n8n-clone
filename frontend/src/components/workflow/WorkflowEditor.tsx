import { Component, ErrorInfo, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    Controls,
    MiniMap,
    NodeTypes,
    OnConnect,
    OnEdgesChange,
    OnNodesChange,
    OnSelectionChangeParams,
    ReactFlowInstance,
    ReactFlowProvider,
    useEdgesState,
    useNodesState
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { workflowService } from '@/services'
import { useAuthStore, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowConnection, WorkflowNode } from '@/types'
import { CustomNode } from './CustomNode'
import { ExecutionPanel } from './ExecutionPanel'
import { ExecutionsHistory } from './ExecutionsHistory'
import { NodeConfigDialog } from './NodeConfigDialog'
import { NodePalette } from './NodePalette'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { WorkflowToolbar } from './WorkflowToolbar'

const nodeTypes: NodeTypes = {
    custom: CustomNode,
}

// Error Boundary Component
interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

class WorkflowErrorBoundary extends Component<
    { children: ReactNode; onError?: (error: string) => void },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode; onError?: (error: string) => void }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('WorkflowEditor Error Boundary caught an error:', error, errorInfo)
        this.setState({ error, errorInfo })
        
        if (this.props.onError) {
            this.props.onError(`Workflow editor error: ${error.message}`)
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-full bg-red-50">
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            Workflow Editor Error
                        </h2>
                        <p className="text-gray-700 mb-4">
                            Something went wrong with the workflow editor.
                        </p>
                        <details className="text-left bg-white p-4 rounded border">
                            <summary className="cursor-pointer font-semibold">
                                Error Details
                            </summary>
                            <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                                {this.state.error?.message}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                                window.location.reload()
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Reload Editor
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

interface WorkflowEditorProps {
    nodeTypes: NodeType[]
}

export function WorkflowEditor({ nodeTypes: availableNodeTypes }: WorkflowEditorProps) {
    const {
        workflow,
        selectedNodeId,
        addNode,
        updateNode,
        removeNode,
        addConnection,
        removeConnection,
        setSelectedNode,
        undo,
        redo,
        canUndo,
        canRedo,
        validateWorkflow,
        setWorkflow,
        isDirty,
        setDirty,
        // Title management
        workflowTitle,
        updateTitle,
        saveTitle,
        isTitleDirty,
        titleValidationError,
        // Import/Export
        exportWorkflow,
        importWorkflow,
        isExporting,
        isImporting,
        exportProgress,
        importProgress,
        exportError,
        importError,
        clearImportExportErrors,
        // Execution state
        executionState,
        lastExecutionResult,
        realTimeResults,
        executionLogs,
        getNodeExecutionResult,
        initializeRealTimeUpdates,
        toggleWorkflowActive,
        // Flow execution state
        // flowExecutionState,
        getExecutionFlowStatus,
        progressTracker,
        // Node interaction
        showPropertyPanel,
        propertyPanelNodeId,
        // setShowPropertyPanel,
        // setPropertyPanelNode,
        openNodeProperties,
        closeNodeProperties
    } = useWorkflowStore()
    
    const { user } = useAuthStore()

    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    // Remove local showConfigPanel state - now using store state
    const [isSaving, setIsSaving] = useState(false)
    const [showExecutionPanel, setShowExecutionPanel] = useState(false)
    const [executionPanelSize, setExecutionPanelSize] = useState(4) // Start minimized
    const [showExecutionsPanel, setShowExecutionsPanel] = useState(false)
    const [showNodePalette, setShowNodePalette] = useState(true)
    
    // ReactFlow view state
    const [showMinimap, setShowMinimap] = useState(true)
    const [showBackground, setShowBackground] = useState(true)
    const [showControls, setShowControls] = useState(true)
    const [backgroundVariant, setBackgroundVariant] = useState<'dots' | 'lines' | 'cross'>('dots')

    // Initialize real-time updates on component mount
    useEffect(() => {
        initializeRealTimeUpdates()
    }, [initializeRealTimeUpdates])

    // Convert workflow data to React Flow format with real execution status
    useEffect(() => {
        if (!workflow) return

        const reactFlowNodes = workflow.nodes.map(node => {
            // Get real-time execution result for this node
            const nodeResult = getNodeExecutionResult(node.id)
            
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
            targetHandle: conn.targetInput
        }))

        setNodes(reactFlowNodes)
        setEdges(reactFlowEdges)
    }, [workflow, executionState, realTimeResults, lastExecutionResult, getNodeExecutionResult, setNodes, setEdges])

    // Handle node selection (but don't automatically open property panel)
    const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selectedNode = params.nodes[0]
        if (selectedNode) {
            setSelectedNode(selectedNode.id)
            // Don't automatically open config panel - only set selection
        } else {
            setSelectedNode(null)
            // Close config panel if no node is selected
            closeNodeProperties()
        }
    }, [setSelectedNode])

    // Handle node position changes
    const handleNodesChange: OnNodesChange = useCallback((changes) => {
        onNodesChange(changes)

        // Update workflow store with position changes
        changes.forEach(change => {
            if (change.type === 'position' && change.position) {
                updateNode(change.id, { position: change.position })
            }
        })
    }, [onNodesChange, updateNode])

    // Handle edge changes
    const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
        onEdgesChange(changes)

        // Handle edge removal
        changes.forEach(change => {
            if (change.type === 'remove') {
                removeConnection(change.id)
            }
        })
    }, [onEdgesChange, removeConnection])

    // Handle new connections
    const handleConnect: OnConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) return

        const newConnection: WorkflowConnection = {
            id: `${connection.source}-${connection.target}-${Date.now()}`,
            sourceNodeId: connection.source,
            sourceOutput: connection.sourceHandle || 'main',
            targetNodeId: connection.target,
            targetInput: connection.targetHandle || 'main'
        }

        addConnection(newConnection)

        const newEdge = {
            id: newConnection.id,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle || undefined,
            targetHandle: connection.targetHandle || undefined
        }

        setEdges(edges => addEdge(newEdge, edges))
    }, [addConnection, setEdges])

    // Handle drag over for node dropping
    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    // Handle node drop from palette
    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault()

        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
        if (!reactFlowBounds || !reactFlowInstance) return

        const nodeTypeData = event.dataTransfer.getData('application/reactflow')
        if (!nodeTypeData) return

        try {
            const nodeType: NodeType = JSON.parse(nodeTypeData)

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            })

            const newNode: WorkflowNode = {
                id: `node-${Date.now()}`,
                type: nodeType.type,
                name: nodeType.displayName,
                parameters: { ...nodeType.defaults },
                position,
                credentials: [],
                disabled: false
            }

            addNode(newNode)
        } catch (error) {
            console.error('Failed to parse dropped node data:', error)
        }
    }, [reactFlowInstance, addNode])

    // Handle node drag start from palette
    const handleNodeDragStart = useCallback((_event: React.DragEvent, _nodeType: NodeType) => {
        // This is handled in NodePalette component
    }, [])

    // Handle node double-click to open properties
    const handleNodeDoubleClick = useCallback((event: React.MouseEvent, nodeId: string) => {
        event.preventDefault()
        event.stopPropagation()
        openNodeProperties(nodeId)
    }, [openNodeProperties])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'z':
                        event.preventDefault()
                        if (event.shiftKey) {
                            redo()
                        } else {
                            undo()
                        }
                        break
                    case 'y':
                        event.preventDefault()
                        redo()
                        break
                    case 's':
                        event.preventDefault()
                        // Save both workflow and title changes
                        handleSave()
                        break
                }
            }

            if (event.key === 'Delete' && selectedNodeId) {
                removeNode(selectedNodeId)
                closeNodeProperties()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, selectedNodeId, removeNode])

    // Error and success notification handlers
    const handleShowError = useCallback((error: string) => {
        toast.error(error, {
            description: 'Please check your workflow configuration and try again.',
        })
    }, [])

    const handleShowSuccess = useCallback((message: string) => {
        toast.success(message)
    }, [])

    // Title management handlers
    const handleTitleChange = useCallback((title: string) => {
        updateTitle(title)
    }, [updateTitle])

    const handleTitleSave = useCallback((title: string) => {
        try {
            updateTitle(title)
            saveTitle()
            handleShowSuccess('Title saved successfully')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save title'
            handleShowError(errorMessage)
        }
    }, [updateTitle, saveTitle, handleShowError, handleShowSuccess])

    // Import/Export handlers
    const handleExport = useCallback(async () => {
        try {
            await exportWorkflow()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Export failed'
            handleShowError(errorMessage)
        }
    }, [exportWorkflow, handleShowError])

    const handleImport = useCallback(async (file: File) => {
        try {
            await importWorkflow(file)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Import failed'
            handleShowError(errorMessage)
        }
    }, [importWorkflow, handleShowError])

    // ReactFlow view handlers
    const handleZoomIn = useCallback(() => {
        if (reactFlowInstance) {
            reactFlowInstance.zoomIn()
        }
    }, [reactFlowInstance])

    const handleZoomOut = useCallback(() => {
        if (reactFlowInstance) {
            reactFlowInstance.zoomOut()
        }
    }, [reactFlowInstance])

    const handleFitView = useCallback(() => {
        if (reactFlowInstance) {
            reactFlowInstance.fitView()
        }
    }, [reactFlowInstance])

    const handleZoomToFit = useCallback(() => {
        if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.1 })
        }
    }, [reactFlowInstance])

    // Execution handlers moved to individual node toolbars
    // Main workflow execution is now triggered from trigger node toolbar buttons

    // Execution panel toggle handler
    const handleToggleExecutionPanel = useCallback(() => {
        if (showExecutionPanel) {
            // If panel is expanded, minimize it
            setExecutionPanelSize(4) // Minimum size for just the header
            setShowExecutionPanel(false)
        } else {
            // If panel is minimized, expand it to default size
            setExecutionPanelSize(30)
            setShowExecutionPanel(true)
        }
    }, [showExecutionPanel])

    // Save workflow function
    const handleSave = useCallback(async () => {
        if (!workflow || !user) return
        
        setIsSaving(true)
        try {
            // Save title changes first if needed
            if (isTitleDirty) {
                saveTitle()
            }

            if (workflow.id === 'new') {
                // Create new workflow
                const workflowData = {
                    name: workflowTitle || workflow.name,
                    description: workflow.description,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    settings: workflow.settings,
                    active: workflow.active
                }
                
                const savedWorkflow = await workflowService.createWorkflow(workflowData)
                setWorkflow(savedWorkflow)
                setDirty(false)
                
                // Update URL to reflect the new workflow ID
                window.history.replaceState(null, '', `/workflows/${savedWorkflow.id}/edit`)
                handleShowSuccess('Workflow created successfully')
            } else {
                // Update existing workflow
                const workflowData = {
                    name: workflowTitle || workflow.name,
                    description: workflow.description,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    settings: workflow.settings,
                    active: workflow.active
                }
                
                const updatedWorkflow = await workflowService.updateWorkflow(workflow.id, workflowData)
                setWorkflow(updatedWorkflow)
                setDirty(false)
                handleShowSuccess('Workflow saved successfully')
            }
        } catch (error) {
            console.error('Failed to save workflow:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to save workflow. Please try again.'
            handleShowError(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }, [workflow, user, workflowTitle, isTitleDirty, saveTitle, setWorkflow, setDirty, handleShowError, handleShowSuccess])

    // Get selected node data for config panel
    const selectedNode = workflow?.nodes.find(node => node.id === propertyPanelNodeId)
    const selectedNodeType = selectedNode ? availableNodeTypes.find(nt => nt.type === selectedNode.type) : null

    return (
        <div className="flex flex-col h-screen w-screen">
            {/* Full Width Toolbar */}
            <WorkflowErrorBoundary onError={handleShowError}>
                <WorkflowToolbar
                    // Existing props
                    canUndo={canUndo()}
                    canRedo={canRedo()}
                    onUndo={undo}
                    onRedo={redo}
                    onSave={handleSave}
                    isSaving={isSaving}
                    isDirty={isDirty}
                    onValidate={() => {
                        const result = validateWorkflow()
                        if (result.isValid) {
                            handleShowSuccess('Workflow is valid!')
                        } else {
                            handleShowError(`Workflow has errors: ${result.errors.join(', ')}`)
                        }
                    }}
                    // Title management props
                    workflowTitle={workflowTitle}
                    onTitleChange={handleTitleChange}
                    onTitleSave={handleTitleSave}
                    isTitleDirty={isTitleDirty}
                    titleValidationError={titleValidationError}
                    // Import/Export props
                    onExport={handleExport}
                    onImport={handleImport}
                    isExporting={isExporting}
                    isImporting={isImporting}
                    exportProgress={exportProgress}
                    importProgress={importProgress}
                    exportError={exportError}
                    importError={importError}
                    onClearImportExportErrors={clearImportExportErrors}
                    // Execution state (for display only - execution moved to individual node toolbars)
                    executionState={executionState}
                    // Error handling props
                    onShowError={handleShowError}
                    onShowSuccess={handleShowSuccess}
                    // Executions history props
                    showExecutionsPanel={showExecutionsPanel}
                    onToggleExecutionsPanel={() => setShowExecutionsPanel(!showExecutionsPanel)}
                    workflowExecutions={[]} // Will be populated from API
                    // Workflow activation props
                    isWorkflowActive={workflow?.active || false}
                    onToggleWorkflowActive={toggleWorkflowActive}
                    // Node palette toggle props
                    showNodePalette={showNodePalette}
                    onToggleNodePalette={() => setShowNodePalette(!showNodePalette)}
                />

                {/* Main Content Area with Resizable Panels */}
                <div className="flex-1 flex">
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
                                        <WorkflowCanvasContextMenu
                                            canUndo={canUndo()}
                                            canRedo={canRedo()}
                                            onUndo={undo}
                                            onRedo={redo}
                                            onSave={handleSave}
                                            isSaving={isSaving}
                                            isDirty={isDirty}
                                            isWorkflowActive={workflow?.active || false}
                                            onToggleWorkflowActive={toggleWorkflowActive}
                                            showExecutionPanel={showExecutionPanel}
                                            onToggleExecutionPanel={handleToggleExecutionPanel}
                                            showExecutionsPanel={showExecutionsPanel}
                                            onToggleExecutionsPanel={() => setShowExecutionsPanel(!showExecutionsPanel)}
                                            showNodePalette={showNodePalette}
                                            onToggleNodePalette={() => setShowNodePalette(!showNodePalette)}
                                            onExport={handleExport}
                                            onImport={handleImport}
                                            isExporting={isExporting}
                                            isImporting={isImporting}
                                            onValidate={() => {
                                                const result = validateWorkflow()
                                                if (result.isValid) {
                                                    handleShowSuccess('Workflow is valid!')
                                                } else {
                                                    handleShowError(`Workflow has errors: ${result.errors.join(', ')}`)
                                                }
                                            }}
                                            showMinimap={showMinimap}
                                            onToggleMinimap={() => setShowMinimap(!showMinimap)}
                                            showBackground={showBackground}
                                            onToggleBackground={() => setShowBackground(!showBackground)}
                                            showControls={showControls}
                                            onToggleControls={() => setShowControls(!showControls)}
                                            onFitView={handleFitView}
                                            onZoomIn={handleZoomIn}
                                            onZoomOut={handleZoomOut}
                                            onZoomToFit={handleZoomToFit}
                                            onChangeBackgroundVariant={(variant) => {
                                                if (variant === 'none') {
                                                    setShowBackground(false)
                                                } else {
                                                    setShowBackground(true)
                                                    setBackgroundVariant(variant)
                                                }
                                            }}
                                        >
                                            <ReactFlow
                                                nodes={nodes}
                                                edges={edges}
                                                onNodesChange={handleNodesChange}
                                                onEdgesChange={handleEdgesChange}
                                                onConnect={handleConnect}
                                                onInit={setReactFlowInstance}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                                onSelectionChange={handleSelectionChange}
                                                onNodeDoubleClick={(event, node) => handleNodeDoubleClick(event, node.id)}
                                                nodeTypes={nodeTypes}
                                                fitView
                                                attributionPosition="bottom-left"
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
                                            flowExecutionStatus={executionState.executionId ? getExecutionFlowStatus(executionState.executionId) : null}
                                            executionMetrics={executionState.executionId ? progressTracker.getExecutionMetrics(executionState.executionId) : null}
                                            isExpanded={showExecutionPanel}
                                            onToggle={handleToggleExecutionPanel}
                                        />
                                    </ResizablePanel>
                                </>
                            </ResizablePanelGroup>
                        </ResizablePanel>

                        {/* Node Palette Panel */}
                        {showNodePalette && (
                            <>
                                <ResizableHandle withHandle />
                                <ResizablePanel defaultSize={15} minSize={0.2} maxSize={15}>
                                    <NodePalette
                                        nodeTypes={availableNodeTypes}
                                        onNodeDragStart={handleNodeDragStart}
                                    />
                                </ResizablePanel>
                            </>
                        )}
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

            {/* Executions History Panel */}
            <ExecutionsHistory
                workflowId={workflow?.id || ''}
                isVisible={showExecutionsPanel}
                onClose={() => setShowExecutionsPanel(false)}
                onSelectExecution={(executionId) => {
                    console.log('Selected execution:', executionId)
                    // TODO: Load and display execution details
                    setShowExecutionsPanel(false)
                }}
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