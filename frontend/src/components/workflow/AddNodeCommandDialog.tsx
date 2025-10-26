import { Badge } from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { useAddNodeDialogStore, useNodeTypes, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowConnection, WorkflowNode } from '@/types'
import { fuzzyFilter } from '@/utils/fuzzySearch'
import { getIconComponent, isTextIcon } from '@/utils/iconMapper'
import { useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // Get only active node types from the store
  const { activeNodeTypes, fetchNodeTypes, refetchNodeTypes, isLoading, hasFetched } = useNodeTypes()
  
  // Initialize store if needed
  useEffect(() => {
    if (activeNodeTypes.length === 0 && !isLoading && !hasFetched) {
      fetchNodeTypes()
    }
  }, [activeNodeTypes.length, isLoading, hasFetched, fetchNodeTypes])

  // Refresh node types when dialog opens to ensure we have the latest nodes
  useEffect(() => {
    if (open && hasFetched) {
      // Silently refresh to get any newly uploaded nodes
      refetchNodeTypes()
    }
  }, [open, hasFetched, refetchNodeTypes])

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setDebouncedSearchQuery('')
    }
  }, [open])

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 150) // Small delay for debouncing

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoize the getter function to avoid creating new arrays on every render
  const nodeSearchGetter = useCallback((node: NodeType) => [
    node.displayName,
    node.description,
    node.type,
    ...node.group
  ], [])

  // Filter nodes using fuzzy search when there's a search query
  const filteredNodeTypes = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return activeNodeTypes
    }
    
    // Use fuzzy search to filter and sort nodes
    return fuzzyFilter(
      activeNodeTypes,
      debouncedSearchQuery,
      nodeSearchGetter
    )
  }, [activeNodeTypes, debouncedSearchQuery, nodeSearchGetter])

  // Group nodes by category - only filtered nodes will be shown
  const groupedNodes = useMemo(() => {
    const hasSearch = debouncedSearchQuery.trim().length > 0
    const groups = new Map<string, NodeType[]>()
    
    filteredNodeTypes.forEach(node => {
      node.group.forEach(group => {
        if (!groups.has(group)) {
          groups.set(group, [])
        }
        groups.get(group)!.push(node)
      })
    })

    // Sort groups alphabetically
    const sortedGroups = Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
    
    // When searching, fuzzy filter already sorted by relevance - don't re-sort
    // When not searching, sort nodes alphabetically within groups
    return sortedGroups.map(([groupName, nodes]) => ({
      name: groupName,
      nodes: hasSearch ? nodes : nodes.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }))
  }, [filteredNodeTypes, debouncedSearchQuery])

  const handleSelectNode = useCallback((nodeType: NodeType) => {
    if (!reactFlowInstance) return
    
    // Calculate position where to add the node
    let nodePosition = { x: 300, y: 300 }
    let parentGroupId: string | undefined = undefined
    let sourceNodeIdForConnection: string | undefined = undefined
    
    if (insertionContext) {
      // Check if this is a connection drop (source but no target)
      const isConnectionDrop = insertionContext.sourceNodeId && !insertionContext.targetNodeId
      
      if (isConnectionDrop) {
        // Connection was dropped on canvas - use the exact drop position
        const sourceNode = reactFlowInstance.getNode(insertionContext.sourceNodeId)
        sourceNodeIdForConnection = insertionContext.sourceNodeId
        
        if (sourceNode && sourceNode.parentId) {
          // Check if source node is in a group
          parentGroupId = sourceNode.parentId
        }
        
        if (position) {
          // Use the exact drop position (already in flow coordinates)
          nodePosition = position
        } else if (sourceNode) {
          // Fallback: position to the right of the source node
          nodePosition = {
            x: sourceNode.position.x + 200,
            y: sourceNode.position.y
          }
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
    } else {
      // No insertion context - check if there's a selected node to connect from
      const selectedNodes = reactFlowInstance.getNodes().filter(node => node.selected)
      
      if (selectedNodes.length === 1) {
        // Single node selected - position new node to the right and connect
        const selectedNode = selectedNodes[0]
        sourceNodeIdForConnection = selectedNode.id
        
        // Check if selected node is in a group
        if (selectedNode.parentId) {
          parentGroupId = selectedNode.parentId
        }
        
        // Position to the right of the selected node
        nodePosition = {
          x: selectedNode.position.x + 250,
          y: selectedNode.position.y
        }
      } else if (position) {
        // Position is already in flow coordinates from openDialog caller
        // (either from WorkflowEditor's viewport center or from connection drag)
        nodePosition = position
      } else {
        // Get center of viewport as fallback
        nodePosition = reactFlowInstance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      }
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
      // Add icon and color from node type definition
      icon: nodeType.icon,
      color: nodeType.color,
      // If source node is in a group, add new node to the same group
      ...(parentGroupId && { 
        parentId: parentGroupId,
        extent: 'parent' as const
      }),
    }

    // Add the node first
    addNode(newNode)

    // Create connection if we have a source node
    // Either from insertionContext (drag from connector) or sourceNodeIdForConnection (selected node)
    const effectiveSourceNodeId = insertionContext?.sourceNodeId || sourceNodeIdForConnection
    
    if (effectiveSourceNodeId) {
      // Check if this is inserting between nodes (only possible with insertionContext)
      const isInsertingBetweenNodes = insertionContext?.targetNodeId && insertionContext.targetNodeId !== ''
      
      if (isInsertingBetweenNodes && insertionContext) {
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
        id: `${effectiveSourceNodeId}-${newNode.id}-${Date.now()}`,
        sourceNodeId: effectiveSourceNodeId,
        sourceOutput: insertionContext?.sourceOutput || 'main',
        targetNodeId: newNode.id,
        targetInput: 'main',
      }

      addConnection(sourceConnection)

      // If there's a target node specified (inserting between nodes), wire the new node to it
      if (isInsertingBetweenNodes && insertionContext?.targetNodeId) {
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

    // Auto-select the newly added node
    // First, deselect all existing nodes
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === newNode.id, // Only select the new node
      }))
    )

    onOpenChange(false)
  }, [addNode, addConnection, removeConnection, updateNode, workflow, onOpenChange, position, reactFlowInstance, insertionContext])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search nodes..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No nodes found.</CommandEmpty>
        {(() => {
          // Track which nodes have already been rendered to avoid duplicates
          const renderedNodeTypes = new Set<string>()
          
          return groupedNodes.map((group, index) => (
            <div key={group.name}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup>
                {group.nodes.map((node) => {
                  // Skip if this node has already been rendered in a previous group
                  if (renderedNodeTypes.has(node.type)) {
                    return null
                  }
                  renderedNodeTypes.add(node.type)
                  
                  // Get the appropriate icon component
                  const IconComponent = getIconComponent(node.icon, node.type, node.group)
                  const useTextIcon = !IconComponent && isTextIcon(node.icon)
                  const isSvgPath = typeof IconComponent === 'string'
                  
                  return (
                    <CommandItem
                      key={node.type}
                      value={`${node.displayName} ${node.description} ${node.group.join(' ')}`}
                      onSelect={() => handleSelectNode(node)}
                      className="flex items-center gap-3 p-3"
                    >
                      <div 
                        className={`w-8 h-8 flex items-center justify-center text-white flex-shrink-0 ${node.group.includes('trigger') ? 'rounded-full' : 'rounded-md'} shadow-sm`}
                        style={{ backgroundColor: node.color || '#6b7280' }}
                      >
                        {isSvgPath ? (
                          <img 
                            src={IconComponent as string} 
                            alt={node.displayName}
                            className="w-4 h-4"
                            crossOrigin="anonymous"
                          />
                        ) : IconComponent ? (
                          // @ts-ignore - IconComponent is LucideIcon here
                          <IconComponent className="w-4 h-4 text-white" />
                        ) : useTextIcon ? (
                          <span className="text-xs font-bold">{node.icon}</span>
                        ) : (
                          <span className="text-xs font-bold">{node.displayName.charAt(0).toUpperCase()}</span>
                        )}
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
                  )
                })}
              </CommandGroup>
            </div>
          ))
        })()}
      </CommandList>
    </CommandDialog>
  )
}
