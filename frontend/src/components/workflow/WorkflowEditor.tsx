import { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    Connection,
    NodeTypes,
    ReactFlowProvider,
    ReactFlowInstance,
    OnConnect,
    OnNodesChange,
    OnEdgesChange,
    OnSelectionChangeParams
} from 'reactflow'
import 'reactflow/dist/style.css'

import { CustomNode } from './CustomNode'
import { NodePalette } from './NodePalette'
import { NodeConfigPanel } from './NodeConfigPanel'
import { WorkflowToolbar } from './WorkflowToolbar'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode, WorkflowConnection, NodeType } from '@/types'

const nodeTypes: NodeTypes = {
    custom: CustomNode,
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
        validateWorkflow
    } = useWorkflowStore()

    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [showConfigPanel, setShowConfigPanel] = useState(false)

    // Convert workflow data to React Flow format
    useEffect(() => {
        if (!workflow) return

        const reactFlowNodes = workflow.nodes.map(node => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            data: {
                label: node.name,
                nodeType: node.type,
                parameters: node.parameters,
                disabled: node.disabled,
                // TODO: Add status from execution state
                status: 'idle' as const
            }
        }))

        const reactFlowEdges = workflow.connections.map(conn => ({
            id: conn.id,
            source: conn.sourceNodeId,
            target: conn.targetNodeId,
            sourceHandle: conn.sourceOutput,
            targetHandle: conn.targetInput
        }))

        setNodes(reactFlowNodes)
        setEdges(reactFlowEdges)
    }, [workflow, setNodes, setEdges])

    // Handle node selection
    const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selectedNode = params.nodes[0]
        if (selectedNode) {
            setSelectedNode(selectedNode.id)
            setShowConfigPanel(true)
        } else {
            setSelectedNode(null)
            setShowConfigPanel(false)
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
                        // TODO: Implement save
                        break
                }
            }

            if (event.key === 'Delete' && selectedNodeId) {
                removeNode(selectedNodeId)
                setShowConfigPanel(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo, selectedNodeId, removeNode])

    // Get selected node data for config panel
    const selectedNode = workflow?.nodes.find(node => node.id === selectedNodeId)
    const selectedNodeType = selectedNode ? availableNodeTypes.find(nt => nt.type === selectedNode.type) : null

    return (
        <div className="flex h-full w-full">
            {/* Node Palette */}
            <NodePalette
                nodeTypes={availableNodeTypes}
                onNodeDragStart={handleNodeDragStart}
            />

            {/* Main Editor */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <WorkflowToolbar
                    canUndo={canUndo()}
                    canRedo={canRedo()}
                    onUndo={undo}
                    onRedo={redo}
                    onSave={() => {/* TODO: Implement save */ }}
                    onValidate={() => {
                        const result = validateWorkflow()
                        if (result.isValid) {
                            alert('Workflow is valid!')
                        } else {
                            alert(`Workflow has errors:\n${result.errors.join('\n')}`)
                        }
                    }}
                />

                {/* React Flow Canvas */}
                <div className="flex-1 min-h-0" ref={reactFlowWrapper}>
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
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-left"
                    >
                        <Controls />
                        <MiniMap />
                        <Background variant={'dots' as any} gap={12} size={1} />
                    </ReactFlow>
                </div>
            </div>

            {/* Node Configuration Panel */}
            {showConfigPanel && selectedNode && selectedNodeType && (
                <NodeConfigPanel
                    node={selectedNode}
                    nodeType={selectedNodeType}
                    onClose={() => setShowConfigPanel(false)}
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