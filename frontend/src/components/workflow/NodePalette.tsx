import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { NodeType } from '@/types'

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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Nodes</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.name} className="border-b border-gray-100">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{category.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.nodes.length}
                </span>
                {expandedCategories.has(category.name) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Category nodes */}
            {expandedCategories.has(category.name) && (
              <div className="pb-2">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    className="mx-2 mb-1 p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Node icon */}
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: node.color || '#666' }}
                      >
                        {node.icon || node.displayName.charAt(0).toUpperCase()}
                      </div>

                      {/* Node info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {node.displayName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {node.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No nodes found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}