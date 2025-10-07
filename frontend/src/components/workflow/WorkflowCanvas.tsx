import { useReactFlowInteractions } from '@/hooks/workflow'
import ReactFlow, { Background, BackgroundVariant, Controls, Edge, EdgeTypes, MiniMap, Node, NodeTypes } from 'reactflow'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { WorkflowEdge } from './edges'

const edgeTypes: EdgeTypes = {
    default: WorkflowEdge,
    smoothstep: WorkflowEdge,
}

interface WorkflowCanvasProps {
    nodes: Node[]
    edges: Edge[]
    nodeTypes: NodeTypes
    showControls: boolean
    showMinimap: boolean
    showBackground: boolean
    backgroundVariant: string
    onInit: (instance: any) => void
    isExecuting?: boolean
    readOnly?: boolean
    executionMode?: boolean
}

export function WorkflowCanvas({
    nodes,
    edges,
    nodeTypes,
    showControls,
    showMinimap,
    showBackground,
    backgroundVariant,
    onInit,
    isExecuting = false,
    readOnly = false,
    executionMode = false,
}: WorkflowCanvasProps) {
    const {
        reactFlowWrapper,
        handleNodesChange,
        handleEdgesChange,
        handleConnect,
        handleConnectStart,
        handleConnectEnd,
        handleDrop,
        handleDragOver,
        handleSelectionChange,
        handleNodeDoubleClick,
    } = useReactFlowInteractions()
    
    // Determine if interactions should be disabled
    const isDisabled = readOnly || executionMode
    
    // Change background pattern for disabled/read-only mode
    const displayBackgroundVariant = isDisabled ? BackgroundVariant.Cross : (backgroundVariant as any)
    const backgroundColor = isDisabled ? '#f8fafc' : undefined
    

    return (
        <WorkflowCanvasContextMenu readOnly={isDisabled}>
            <div className="h-full" ref={reactFlowWrapper} style={{ backgroundColor }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={isDisabled ? undefined : handleNodesChange}
                    onEdgesChange={isDisabled ? undefined : handleEdgesChange}
                    onConnect={isDisabled ? undefined : handleConnect}
                    onConnectStart={isDisabled ? undefined : handleConnectStart}
                    onConnectEnd={isDisabled ? undefined : handleConnectEnd}
                    onInit={onInit}
                    onDrop={isDisabled ? undefined : handleDrop}
                    onDragOver={isDisabled ? undefined : handleDragOver}
                    onSelectionChange={handleSelectionChange}
                    onNodeDoubleClick={(event, node) => handleNodeDoubleClick(event, node.id)}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    nodesDraggable={!isDisabled}
                    nodesConnectable={!isDisabled}
                    elementsSelectable={true}
                    fitView
                    attributionPosition="bottom-left"
                    edgeUpdaterRadius={isDisabled ? 0 : 10}
                    connectionRadius={isDisabled ? 0 : 20}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: isExecuting,
                    }}
                >
                    {showControls && <Controls />}
                    {showMinimap && <MiniMap />}
                    {showBackground && (
                        <Background 
                            variant={displayBackgroundVariant} 
                            gap={isDisabled ? 20 : 12} 
                            size={isDisabled ? 2 : 1}
                            color={isDisabled ? '#cbd5e1' : undefined}
                        />
                    )}
                </ReactFlow>
            </div>
        </WorkflowCanvasContextMenu>
    )
}
