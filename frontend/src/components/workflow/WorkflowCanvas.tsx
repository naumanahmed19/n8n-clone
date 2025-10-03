import { useReactFlowInteractions } from '@/hooks/workflow'
import ReactFlow, { Background, Controls, Edge, EdgeTypes, MiniMap, Node, NodeTypes } from 'reactflow'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { CustomEdge } from './edges'

const edgeTypes: EdgeTypes = {
    default: CustomEdge,
    smoothstep: CustomEdge,
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
}: WorkflowCanvasProps) {
    const {
        reactFlowWrapper,
        handleNodesChange,
        handleEdgesChange,
        handleConnect,
        handleDrop,
        handleDragOver,
        handleSelectionChange,
        handleNodeDoubleClick,
    } = useReactFlowInteractions()
    
    return (
        <WorkflowCanvasContextMenu>
            <div className="h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={handleConnect}
                    onInit={onInit}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onSelectionChange={handleSelectionChange}
                    onNodeDoubleClick={(event, node) => handleNodeDoubleClick(event, node.id)}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    attributionPosition="bottom-left"
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
            </div>
        </WorkflowCanvasContextMenu>
    )
}
