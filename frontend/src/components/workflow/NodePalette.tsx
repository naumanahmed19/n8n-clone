import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { NodeType } from '@/types'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
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
    <div className="h-full bg-muted/30 flex flex-col">
      {/* Header */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Nodes</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </CardHeader>
      </Card>

      <Separator />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
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
                className="w-full justify-between p-3 h-auto hover:bg-muted/50 border border-border/30 rounded-md"
              >
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                    {category.nodes.length}
                  </span>
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="pt-2 pb-2 px-2">
                <div className="space-y-1">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node)}
                      className="group p-3 bg-background hover:bg-muted/50 rounded-md cursor-move transition-all duration-200 border border-transparent hover:border-border/50 hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Node icon */}
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: node.color || '#6b7280' }}
                        >
                          {node.icon || node.displayName.charAt(0).toUpperCase()}
                        </div>

                        {/* Node info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate group-hover:text-foreground">
                            {node.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {node.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {categories.length === 0 && (
          <Card className="border border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">No nodes found</p>
              {searchTerm && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}