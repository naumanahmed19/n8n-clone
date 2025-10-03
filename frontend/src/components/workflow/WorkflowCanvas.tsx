import ReactFlow, { Background, Controls, MiniMap, Node, Edge, NodeTypes } from 'reactflow'

interface WorkflowCanvasProps {
    nodes: Node[]
    edges: Edge[]
    nodeTypes: NodeTypes
    reactFlowWrapper: React.RefObject<HTMLDivElement>
    showControls: boolean
    showMinimap: boolean
    showBackground: boolean
    backgroundVariant: string
    onNodesChange: (changes: any) => void
    onEdgesChange: (changes: any) => void
    onConnect: (connection: any) => void
    onInit: (instance: any) => void
    onDrop: (event: React.DragEvent) => void
    onDragOver: (event: React.DragEvent) => void
    onSelectionChange: (params: any) => void
    onNodeDoubleClick: (event: React.MouseEvent, nodeId: string) => void
}

export function WorkflowCanvas({
    nodes,
    edges,
    nodeTypes,
    reactFlowWrapper,
    showControls,
    showMinimap,
    showBackground,
    backgroundVariant,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onInit,
    onDrop,
    onDragOver,
    onSelectionChange,
    onNodeDoubleClick,
}: WorkflowCanvasProps) {
    return (
        <div className="h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={onInit}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSelectionChange={onSelectionChange}
                onNodeDoubleClick={(event, node) => onNodeDoubleClick(event, node.id)}
                nodeTypes={nodeTypes}
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
    )
}
