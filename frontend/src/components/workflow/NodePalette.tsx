import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { NodeType } from '@/types'
import { ChevronDown, GripVertical, Search } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface NodePaletteProps {
  nodeTypes: NodeType[]
  onNodeDragStart: (event: React.DragEvent, nodeType: NodeType) => void
}

export function NodePalette({ nodeTypes, onNodeDragStart }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core']))

  const categories = useMemo(() => {
    const filtered = nodeTypes.filter(node =>
      node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categoryMap = new Map<string, NodeType[]>()
    
    filtered.forEach(node => {
      node.group.forEach(group => {
        if (!categoryMap.has(group)) {
          categoryMap.set(group, [])
        }
        categoryMap.get(group)!.push(node)
      })
    })

    return Array.from(categoryMap.entries()).map(([name, nodes]) => ({
      name,
      nodes: nodes.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }))
  }, [nodeTypes, searchTerm])

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
    onNodeDragStart(event, nodeType)
  }

  return (
    <div className="h-full bg-background border-r flex flex-col">
      {/* Header */}
      <div className=" border-b">
        <h3 className="text-xs font-semibold p-2 border-b">Nodes</h3>
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto ">
        {categories.map((category) => (
          <Collapsible
            key={category.name}
            open={expandedCategories.has(category.name)}
            onOpenChange={() => toggleCategory(category.name)}
            className="mb-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-muted"
              >
                <span className="font-medium capitalize">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {category.nodes.length}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedCategories.has(category.name) ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="p-2 space-y-2">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    className="group p-3 bg-card hover:bg-muted/50 rounded-md cursor-move transition-colors border"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#6b7280' }}
                      >
                        
                        {node?.icon || node.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {node.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {node.description}
                        </div>
                      </div>
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No nodes found</p>
            {searchTerm && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a different search term
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}