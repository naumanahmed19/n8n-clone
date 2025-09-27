import { CustomNodeUpload } from '@/components/customNode/CustomNodeUpload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSidebarContext } from '@/contexts'
import { useNodeTypes } from '@/hooks/useNodeTypes'
import { NodeType } from '@/types'
import {
    ChevronDown,
    ChevronRight,
    Clock,
    Code,
    Command,
    Database,
    FolderOpen,
    Globe,
    List,
    Play,
    Settings,
    Upload,
    Zap
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface NodeTypesListProps {
  searchTerm?: string
}

// Icon mapping for different node types
const getNodeIcon = (nodeType: NodeType) => {
  if (nodeType.icon?.startsWith('fa:')) {
    // Font Awesome icons - map to Lucide equivalents
    switch (nodeType.icon) {
      case 'fa:globe':
        return Globe
      case 'fa:code':
        return Code
      default:
        return Command
    }
  }
  
  // Default icons based on node type or group
  if (nodeType.group.includes('trigger')) {
    return Play
  } else if (nodeType.group.includes('transform')) {
    return Zap
  } else if (nodeType.type.toLowerCase().includes('http')) {
    return Globe
  } else if (nodeType.type.toLowerCase().includes('json')) {
    return Code
  } else if (nodeType.type.toLowerCase().includes('set')) {
    return Settings
  } else if (nodeType.type.toLowerCase().includes('schedule') || nodeType.type.toLowerCase().includes('cron')) {
    return Clock
  } else if (nodeType.type.toLowerCase().includes('database')) {
    return Database
  }
  
  return Command
}

export function NodeTypesList({ searchTerm = "" }: NodeTypesListProps) {
  const { 
    nodeTypesData: nodeTypesFromContext,
    setNodeTypesData,
    isNodeTypesLoaded,
    setIsNodeTypesLoaded,
    nodeTypesError: error,
    setNodeTypesError: setError
  } = useSidebarContext()
  
  const { nodeTypes, isLoading, error: hookError, refetch } = useNodeTypes()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<string>('available')

  // Update context when hook data changes
  useEffect(() => {
    if (nodeTypes.length > 0 && !isNodeTypesLoaded) {
      setNodeTypesData(nodeTypes)
      setIsNodeTypesLoaded(true)
    }
  }, [nodeTypes, setNodeTypesData, isNodeTypesLoaded, setIsNodeTypesLoaded])

  // Update error state
  useEffect(() => {
    setError(hookError)
  }, [hookError, setError])

  // Use data from context if available, otherwise use hook data
  const activeNodeTypes = nodeTypesFromContext.length > 0 ? nodeTypesFromContext : nodeTypes

  // Callback to refresh nodes after upload
  const handleUploadSuccess = () => {
    refetch()
    setActiveTab('available')
  }

  // Filter node types based on search term
  const filteredNodeTypes = useMemo(() => {
    if (!searchTerm) return activeNodeTypes
    
    return activeNodeTypes.filter(nodeType =>
      nodeType.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nodeType.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nodeType.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nodeType.group.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [activeNodeTypes, searchTerm])

  // Auto-switch to available tab when searching
  useEffect(() => {
    if (searchTerm && activeTab !== 'available') {
      setActiveTab('available')
    }
  }, [searchTerm, activeTab])

  // Group node types by category
  const categorizedNodeTypes = useMemo(() => {
    const groups: Record<string, NodeType[]> = {}
    
    filteredNodeTypes.forEach(nodeType => {
      // Use the first group as primary category, or 'Other' if no group
      const category = nodeType.group[0] || 'Other'
      const categoryKey = category.charAt(0).toUpperCase() + category.slice(1)
      
      if (!groups[categoryKey]) {
        groups[categoryKey] = []
      }
      groups[categoryKey].push(nodeType)
    })

    // Sort categories alphabetically, but put common ones first
    const categoryOrder = ['Core', 'Trigger', 'Transform', 'Other']
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a)
      const bIndex = categoryOrder.indexOf(b)
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      return a.localeCompare(b)
    })

    return sortedCategories.map(category => ({
      category,
      nodeTypes: groups[category],
      count: groups[category].length
    }))
  }, [filteredNodeTypes])

  // Initialize expanded state for all categories
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {}
    categorizedNodeTypes.forEach(group => {
      if (!(group.category in expandedCategories)) {
        initialExpanded[group.category] = true // Start expanded
      }
    })
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedCategories(prev => ({ ...prev, ...initialExpanded }))
    }
  }, [categorizedNodeTypes, expandedCategories])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }



  const renderNodeList = () => (
    <div className="space-y-0">
      {categorizedNodeTypes.map((group) => (
        <div key={group.category} className="border-b last:border-b-0">
          {/* Category Header */}
          <div
            className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleCategory(group.category)}
          >
            <div className="flex items-center gap-2">
              {expandedCategories[group.category] ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {group.category}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs h-5">
              {group.count}
            </Badge>
          </div>

          {/* Category Node Types */}
          {expandedCategories[group.category] && (
            <div className="space-y-0">
              {group.nodeTypes.map((nodeType) => {
                const IconComponent = getNodeIcon(nodeType)
                
                return (
                  <div
                    key={nodeType.type}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-start gap-3 p-3 text-sm leading-tight border-b last:border-b-0 cursor-move group min-h-0 overflow-hidden transition-colors"
                    draggable
                    onDragStart={(e) => {
                      // Use the same data format as NodePalette for consistency
                      e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
                      e.dataTransfer.effectAllowed = 'move'
                      
                      // Add visual feedback during drag
                      e.currentTarget.style.opacity = '0.5'
                    }}
                    onDragEnd={(e) => {
                      // Reset visual feedback after drag
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <div 
                      className="w-4 h-4 shrink-0 flex items-center justify-center rounded mt-0.5"
                      style={{ color: nodeType.color || '#666' }}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium truncate">{nodeType.displayName}</div>
                      {nodeType.description && (
                        <div 
                          className="text-xs text-muted-foreground overflow-hidden leading-relaxed mt-1"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {nodeType.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start mt-0.5">
                      v{nodeType.version}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-0 rounded-none border-b bg-transparent h-auto p-0">
        <TabsTrigger 
          value="available" 
          className="rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none flex items-center gap-2 px-3 py-2"
        >
          <List className="h-4 w-4" />
          Available ({activeNodeTypes.length})
        </TabsTrigger>
        <TabsTrigger 
          value="upload" 
          className="rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none flex items-center gap-2 px-3 py-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="available" className="mt-0 p-0">
        {isLoading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="animate-pulse">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                  </div>
                  <div className="animate-pulse flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              <Command className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={refetch}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredNodeTypes.length === 0 ? (
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              <Command className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">
                {searchTerm ? 'No nodes match your search' : 'No nodes available'}
              </p>
            </div>
          </div>
        ) : (
          renderNodeList()
        )}
      </TabsContent>
      
      <TabsContent value="upload" className="mt-0 p-0">
        <div className="p-4">
          <CustomNodeUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      </TabsContent>
    </Tabs>
  )
}