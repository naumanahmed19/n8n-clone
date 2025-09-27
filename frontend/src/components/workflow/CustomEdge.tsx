import { useAddNodeDialogStore, useWorkflowStore } from '@/stores'
import { Plus, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath,
    useReactFlow,
} from 'reactflow'

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const { getNode, setEdges } = useReactFlow()
    const { removeConnection, workflow } = useWorkflowStore()
    const { openDialog } = useAddNodeDialogStore()
    const [isHovered, setIsHovered] = useState(false)

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    const onEdgeRemove = useCallback((event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault()
        
        // Remove from workflow store
        removeConnection(id)
        
        // Remove from ReactFlow edges state
        setEdges((edges) => edges.filter((edge) => edge.id !== id))
    }, [id, removeConnection, setEdges])

    const onAddNodeBetween = useCallback((event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault()
        
        if (!workflow) return

        const connection = workflow.connections.find(conn => conn.id === id)
        if (!connection) return

        const sourceNode = getNode(connection.sourceNodeId)
        const targetNode = getNode(connection.targetNodeId)
        
        if (!sourceNode || !targetNode) return

        // Calculate position between source and target nodes
        const newPosition = {
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2,
        }

        // Remove the current connection first
        removeConnection(id)
        
        // Remove from ReactFlow edges state
        setEdges((edges) => edges.filter((edge) => edge.id !== id))

        // Create insertion context to reconnect after node is added
        const insertionContext = {
            sourceNodeId: connection.sourceNodeId,
            targetNodeId: connection.targetNodeId,
            sourceOutput: connection.sourceOutput,
            targetInput: connection.targetInput,
        }

        // Open the command dialog at the calculated position with insertion context
        openDialog(newPosition, insertionContext)
    }, [id, workflow, getNode, removeConnection, setEdges, openDialog])

    return (
        <>
            <BaseEdge 
                path={edgePath} 
                markerEnd={markerEnd} 
                style={{ 
                    ...style, 
                    strokeWidth: isHovered ? 3 : 2,
                    stroke: isHovered ? '#3b82f6' : (style.stroke || '#b1b1b7'),
                    transition: 'all 0.2s ease',
                }} 
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                        zIndex: 1000,
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Invisible hover area to make it easier to trigger */}
                    <div 
                        className="absolute inset-0 -inset-8 nodrag nopan"
                        style={{ pointerEvents: 'all', zIndex: 1001 }}
                    />
                    
                    <div 
                        className={`flex gap-0.5 transition-opacity duration-200 nodrag nopan ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ zIndex: 1002 }}
                    >
                        <button
                            className="w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-110 nodrag nopan"
                            onClick={onAddNodeBetween}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Add node between"
                            style={{ pointerEvents: 'all', zIndex: 1003 }}
                        >
                            <Plus size={8} strokeWidth={2.5} />
                        </button>
                        <button
                            className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-110 nodrag nopan"
                            onClick={onEdgeRemove}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Remove connection"
                            style={{ pointerEvents: 'all', zIndex: 1003 }}
                        >
                            <X size={8} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    )
}