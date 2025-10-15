import { Badge } from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useAddNodeDialogStore, useNodeTypes, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowConnection, WorkflowNode } from '@/types'
import { useCallback, useEffect, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'

interface AddNodeCommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: { x: number; y: number }
}

export function AddNodeCommandDialog({
  open,
  onOpenChange,
  position,
}: AddNodeCommandDialogProps) {
  const { addNode, addConnection, removeConnection, workflow, updateNode } = useWorkflowStore()
  const { insertionContext } = useAddNodeDialogStore()
  const reactFlowInstance = useReactFlow()
  
  // Get only active node types from the store
  const { activeNodeTypes, fetchNodeTypes } = useNodeTypes()
  
  // Initialize store if needed
  useEffect(() => {
    if (activeNodeTypes.length === 0) {
      fetchNodeTypes()
    }
  }, [activeNodeTypes.length, fetchNodeTypes])

  // Group nodes by category - only active nodes will be shown
  const groupedNodes = useMemo(() => {
    const groups = new Map<string, NodeType[]>()
    
    activeNodeTypes.forEach(node => {
      node.group.forEach(group => {
        if (!groups.has(group)) {
          groups.set(group, [])
        }
        groups.get(group)!.push(node)
      })
    })

    // Sort groups and nodes within groups
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, nodes]) => ({
        name: groupName,
        nodes: nodes.sort((a, b) => a.displayName.localeCompare(b.displayName))
      }))
  }, [activeNodeTypes])

  const handleSelectNode = useCallback((nodeType: NodeType) => {
    // Calculate position where to add the node
    let nodePosition = { x: 300, y: 300 }
    let parentGroupId: string | undefined = undefined
    
    if (insertionContext && reactFlowInstance) {
      // Check if this is a connection drop (source but no target)
      const isConnectionDrop = insertionContext.sourceNodeId && !insertionContext.targetNodeId
      
      if (isConnectionDrop) {
        // Connection was dropped on canvas - position near the source node
        const sourceNode = reactFlowInstance.getNode(insertionContext.sourceNodeId)
        
        if (sourceNode) {
          // Check if source node is in a group
          if (sourceNode.parentId) {
            parentGroupId = sourceNode.parentId
          }
          
          // Position to the right of the source node
          nodePosition = {
            x: sourceNode.position.x + 200,
            y: sourceNode.position.y
          }
        } else if (position) {
          // Use the drop position
          nodePosition = reactFlowInstance.screenToFlowPosition(position)
        }
      } else if (insertionContext.targetNodeId) {
        // Inserting between nodes - use existing logic
        const sourceNode = reactFlowInstance.getNode(insertionContext.sourceNodeId)
        const targetNode = reactFlowInstance.getNode(insertionContext.targetNodeId)
        
        if (sourceNode && targetNode) {
          // Check if source node is in a group
          if (sourceNode.parentId) {
            parentGroupId = sourceNode.parentId
          }
          
          // Assume standard node width (adjust based on your node sizes)
          const nodeWidth = 150
          const gap = 25
          
          // Calculate the vector from source to target
          const deltaX = targetNode.position.x - sourceNode.position.x
          const deltaY = targetNode.position.y - sourceNode.position.y
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          
          // Calculate direction vector (normalized)
          const directionX = deltaX / distance
          const directionY = deltaY / distance
          
          // Position new node: source node + its width + gap
          const distanceFromSource = nodeWidth + gap
          nodePosition = {
            x: sourceNode.position.x + directionX * distanceFromSource,
            y: sourceNode.position.y + directionY * distanceFromSource
          }
          
          // Calculate minimum distance needed: source width + gap + new node width + gap
          const minDistanceNeeded = nodeWidth + gap + nodeWidth + gap
          
          // If current distance is less than needed, shift target node and all downstream nodes
          if (distance < minDistanceNeeded) {
            const additionalSpace = minDistanceNeeded - distance
            const shiftX = directionX * additionalSpace
            const shiftY = directionY * additionalSpace
            
            // Helper function to recursively shift nodes
            const shiftNodeAndDownstream = (nodeId: string, visited = new Set<string>()) => {
              if (visited.has(nodeId)) return
              visited.add(nodeId)
              
              const node = reactFlowInstance.getNode(nodeId)
              if (!node) return
              
              // Shift this node
              updateNode(nodeId, {
                position: {
                  x: node.position.x + shiftX,
                  y: node.position.y + shiftY
                }
              })
              
              // Find all connections where this node is the source and shift their targets
              workflow?.connections.forEach(conn => {
                if (conn.sourceNodeId === nodeId) {
                  shiftNodeAndDownstream(conn.targetNodeId, visited)
                }
              })
            }
            
            // Start shifting from the target node
            shiftNodeAndDownstream(insertionContext.targetNodeId)
          }
        } else if (sourceNode) {
          // Fallback: position to the right of source node
          nodePosition = {
            x: sourceNode.position.x + 300,
            y: sourceNode.position.y
          }
        }
      }
    } else if (position) {
      // If position is provided (e.g., from output connector click), use it
      // Convert screen coordinates to flow coordinates
      if (reactFlowInstance) {
        nodePosition = reactFlowInstance.screenToFlowPosition(position)
      } else {
        nodePosition = position
      }
    } else if (reactFlowInstance) {
      // Get center of viewport as fallback
      nodePosition = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
    }

    // Initialize parameters with defaults from node type
    const parameters: Record<string, any> = { ...nodeType.defaults }

    // Add default values from properties
    nodeType.properties.forEach((property) => {
      if (
        property.default !== undefined &&
        parameters[property.name] === undefined
      ) {
        parameters[property.name] = property.default
      }
    })

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: nodeType.type,
      name: nodeType.displayName,
      parameters,
      position: nodePosition,
      credentials: [],
      disabled: false,
      // If source node is in a group, add new node to the same group
      ...(parentGroupId && { 
        parentId: parentGroupId,
        extent: 'parent' as const
      }),
    }

    // Add the node first
    addNode(newNode)

    // If we have insertion context, create connections
    if (insertionContext && insertionContext.sourceNodeId) {
      // Check if this is inserting between nodes or just connecting from source
      const isInsertingBetweenNodes = insertionContext.targetNodeId && insertionContext.targetNodeId !== ''
      
      if (isInsertingBetweenNodes) {
        // First, find and remove the existing connection between source and target
        const existingConnection = workflow?.connections.find(
          conn =>
            conn.sourceNodeId === insertionContext.sourceNodeId &&
            conn.targetNodeId === insertionContext.targetNodeId &&
            (conn.sourceOutput === insertionContext.sourceOutput || (!conn.sourceOutput && !insertionContext.sourceOutput)) &&
            (conn.targetInput === insertionContext.targetInput || (!conn.targetInput && !insertionContext.targetInput))
        )

        if (existingConnection) {
          removeConnection(existingConnection.id)
        }
      }

      // Create connection from source node to new node
      const sourceConnection: WorkflowConnection = {
        id: `${insertionContext.sourceNodeId}-${newNode.id}-${Date.now()}`,
        sourceNodeId: insertionContext.sourceNodeId,
        sourceOutput: insertionContext.sourceOutput || 'main',
        targetNodeId: newNode.id,
        targetInput: 'main',
      }

      addConnection(sourceConnection)

      // If there's a target node specified, wire the new node to it
      if (isInsertingBetweenNodes && insertionContext.targetNodeId) {
        const targetConnection: WorkflowConnection = {
          id: `${newNode.id}-${insertionContext.targetNodeId}-${Date.now() + 1}`,
          sourceNodeId: newNode.id,
          sourceOutput: 'main',
          targetNodeId: insertionContext.targetNodeId,
          targetInput: insertionContext.targetInput || 'main',
        }

        addConnection(targetConnection)
      }
    }

    onOpenChange(false)
  }, [addNode, addConnection, removeConnection, updateNode, workflow, onOpenChange, position, reactFlowInstance, insertionContext])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search nodes..." />
      <CommandList>
        <CommandEmpty>No nodes found.</CommandEmpty>
        {groupedNodes.map((group, index) => (
          <div key={group.name}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.name}>
              {group.nodes.map((node) => (
                <CommandItem
                  key={node.type}
                  value={`${node.displayName} ${node.description} ${node.group.join(' ')}`}
                  onSelect={() => handleSelectNode(node)}
                  className="flex items-center gap-3 p-3"
                >
                  <div 
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: node.color || '#6b7280' }}
                  >
                    {node?.icon || node.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {node.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {node.description}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {node.group.slice(0, 2).map((g) => (
                      <Badge 
                        key={g} 
                        variant="secondary" 
                        className="text-xs h-5"
                      >
                        {g}
                      </Badge>
                    ))}
                    {node.group.length > 2 && (
                      <Badge variant="outline" className="text-xs h-5">
                        +{node.group.length - 2}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
