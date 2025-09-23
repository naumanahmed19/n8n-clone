import { NodeType } from '@/types'
import { useCallback, useMemo } from 'react'
import { useReactFlow } from 'reactflow'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types'
import { Badge } from '@/components/ui/badge'

interface AddNodeCommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeTypes: NodeType[]
  position?: { x: number; y: number }
}

export function AddNodeCommandDialog({
  open,
  onOpenChange,
  nodeTypes,
  position,
}: AddNodeCommandDialogProps) {
  const { addNode } = useWorkflowStore()
  const reactFlowInstance = useReactFlow()

  // Group nodes by category
  const groupedNodes = useMemo(() => {
    const groups = new Map<string, NodeType[]>()
    
    nodeTypes.forEach(node => {
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
  }, [nodeTypes])

  const handleSelectNode = useCallback((nodeType: NodeType) => {
    // Calculate position where to add the node
    let nodePosition = { x: 300, y: 300 }
    
    if (position) {
      nodePosition = position
    } else if (reactFlowInstance) {
      // Get center of viewport
      nodePosition = reactFlowInstance.project({
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
    }

    addNode(newNode)
    onOpenChange(false)
  }, [addNode, onOpenChange, position, reactFlowInstance])

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