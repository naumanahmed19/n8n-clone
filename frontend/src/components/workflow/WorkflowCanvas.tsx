import { useReactFlowInteractions } from '@/hooks/workflow'
import { useReactFlowUIStore } from '@/stores'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, BackgroundVariant, Controls, Edge, EdgeTypes, MiniMap, Node, NodeTypes } from 'reactflow'
import { WorkflowCanvasContextMenu } from './WorkflowCanvasContextMenu'
import { WorkflowEdge } from './edges'
import './reactflow-theme.css'

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
    
    // Get panOnDrag and zoomOnScroll settings from store
    const { panOnDrag, zoomOnScroll, reactFlowInstance } = useReactFlowUIStore()
    
    // Determine if interactions should be disabled
    const isDisabled = readOnly || executionMode
    
    // Change background pattern for disabled/read-only mode
    const displayBackgroundVariant = isDisabled ? BackgroundVariant.Cross : (backgroundVariant as any)
    const backgroundColor = isDisabled ? 'hsl(var(--muted))' : undefined
    
    // Detect dark mode and listen for changes
    const [isDarkMode, setIsDarkMode] = useState(() => 
        document.documentElement.classList.contains('dark')
    )
    
    // Add resize observer to handle container dimension changes
    const containerRef = useRef<HTMLDivElement>(null)
    
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'))
        })
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })
        
        return () => observer.disconnect()
    }, [])
    
    // Add ResizeObserver to handle layout changes
    useEffect(() => {
        if (!containerRef.current || !reactFlowInstance) return
        
        const resizeObserver = new ResizeObserver(() => {
          // Delay slightly to ensure DOM has updated
          setTimeout(() => {
            if (reactFlowInstance && nodes.length > 0) {
              reactFlowInstance.fitView({ padding: 0.1, duration: 0 })
            }
          }, 50)
        })
        
        resizeObserver.observe(containerRef.current)
        
        return () => {
          resizeObserver.disconnect()
        }
    }, [reactFlowInstance, nodes.length])
    
    // Edge styles based on theme
    const edgeStyle = useMemo(() => ({
        stroke: isDarkMode ? 'hsl(var(--border))' : '#b1b1b7',
        strokeWidth: 2,
    }), [isDarkMode])
    
    const connectionLineStyle = useMemo(() => ({
        stroke: isDarkMode ? 'hsl(var(--primary))' : '#5865f2',
        strokeWidth: 2,
    }), [isDarkMode])

    

    return (
        <WorkflowCanvasContextMenu readOnly={isDisabled}>
            <div className="h-full"  ref={(el) => {
                if (reactFlowWrapper) {
                    (reactFlowWrapper as any).current = el
                }
                if (el) {
                    (containerRef as any).current = el
                }
            }} style={{ backgroundColor }}>
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
                    panOnDrag={panOnDrag}
                    zoomOnScroll={zoomOnScroll}
                    connectionLineStyle={connectionLineStyle}
                    fitView
                    attributionPosition="bottom-left"
                    edgeUpdaterRadius={isDisabled ? 0 : 10}
                    connectionRadius={isDisabled ? 0 : 20}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: isExecuting,
                        style: edgeStyle,
                    }}
                >
                    {showControls && <Controls />}
                    {showMinimap && (
                        <MiniMap
                            nodeColor={isDarkMode ? '#334155' : '#e2e8f0'}
                            maskColor={isDarkMode ? 'rgba(28, 37, 51, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
                            style={{
                                backgroundColor: isDarkMode ? 'hsl(var(--card))' : '#fff',
                            }}
                        />
                    )}
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
