import { CustomNodeUpload } from '@/components/customNode/CustomNodeUpload'
import { NodeMarketplace } from '@/components/node/NodeMarketplace'
import { NodesHeader } from '@/components/node/NodesHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useSidebarContext } from '@/contexts'
import { globalToastManager } from '@/hooks/useToast'
import { nodeTypeService } from '@/services/nodeType'
import { useNodeTypes } from '@/stores'
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
  GripVertical,
  Play,
  Power,
  PowerOff,
  Settings,
  Trash2,
  Zap
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

// Extended node type that might have additional properties for custom nodes
interface ExtendedNodeType extends NodeType {
  id?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface NodeTypesListProps {}

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

export function NodeTypesList({}: NodeTypesListProps) {
  const { 
    nodeTypesData: nodeTypesFromContext,
    setNodeTypesData,
    setIsNodeTypesLoaded,
    setNodeTypesError: setError,
    setHeaderSlot
  } = useSidebarContext()
  
  // Search term for nodes
  const [searchTerm, setSearchTerm] = useState("")
  
  const { 
    nodeTypes, 
    isLoading, 
    error: storeError, 
    fetchNodeTypes, 
    refetchNodeTypes
  } = useNodeTypes()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<string>('available')
  const [processingNode, setProcessingNode] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<NodeType | null>(null)

  // Initialize store on mount
  useEffect(() => {
    if (nodeTypes.length === 0 && !isLoading) {
      fetchNodeTypes()
    }
  }, [nodeTypes.length, isLoading, fetchNodeTypes])

  // Update context when store data changes
  useEffect(() => {
    if (nodeTypes.length > 0) {
      setNodeTypesData(nodeTypes)
      setIsNodeTypesLoaded(true)
    }
  }, [nodeTypes, setNodeTypesData, setIsNodeTypesLoaded])

  // Update error state
  useEffect(() => {
    setError(storeError)
  }, [storeError, setError])

  // Use data from context if available, otherwise use hook data
  const activeNodeTypes = nodeTypesFromContext.length > 0 ? nodeTypesFromContext : nodeTypes

  // Callback to refresh nodes after upload
  const handleUploadSuccess = () => {
    refetchNodeTypes()
    setActiveTab('available')
  }

  // Filter node types based on search term (use search for available nodes)
  const filteredNodeTypes = useMemo(() => {
    const effectiveSearchTerm = searchTerm
    if (!effectiveSearchTerm) return activeNodeTypes
    
    return activeNodeTypes.filter(nodeType =>
      nodeType.displayName.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      nodeType.description.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      nodeType.type.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      nodeType.group.some(group => group.toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
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

  // Set header slot for nodes
  useEffect(() => {
    setHeaderSlot(
      <NodesHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        nodeCount={activeNodeTypes.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onRefresh={refetchNodeTypes}
        isRefreshing={isLoading}
      />
    )
    
    // Clean up header slot when component unmounts
    return () => {
      setHeaderSlot(null)
    }
  }, [setHeaderSlot, activeTab, setActiveTab, activeNodeTypes.length, searchTerm, setSearchTerm, refetchNodeTypes, isLoading])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Show delete confirmation dialog
  const showDeleteDialog = (nodeType: NodeType) => {
    setNodeToDelete(nodeType);
    setDeleteDialogOpen(true);
  };

  // Delete/uninstall a custom node
  const handleDeleteNode = async () => {
    if (!nodeToDelete) return;

    setProcessingNode(nodeToDelete.type);
    setDeleteDialogOpen(false);
    
    try {
      console.log('Attempting to delete node:', nodeToDelete.type);
      console.log('Full node details:', nodeToDelete);
      
      // Check if this is a database node (has id) vs a service node (only has type)
      const extendedNode = nodeToDelete as ExtendedNodeType;
      console.log('Extended node properties:', {
        id: extendedNode.id,
        type: nodeToDelete.type,
        hasId: !!extendedNode.id,
        createdAt: extendedNode.createdAt
      });
      
      // For database nodes, we might need to check if they actually exist in the database
      if (!extendedNode.id || !extendedNode.createdAt) {
        throw new Error('This appears to be a core system node that cannot be uninstalled. Only custom uploaded nodes can be removed.');
      }
      
      await nodeTypeService.deleteNodeType(nodeToDelete.type);
      console.log('Delete successful');
      
      globalToastManager.showSuccess(
        'Node Uninstalled',
        { message: `Successfully uninstalled ${nodeToDelete.displayName}` }
      );
      
      // Refresh the list
      await refetchNodeTypes();
      
    } catch (error: any) {
      console.error('Failed to delete node:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        url: error?.config?.url
      });
      
      let errorMessage = `Failed to uninstall ${nodeToDelete.displayName}`;
      
      if (error?.response?.status === 404) {
        errorMessage = 'This node was not found in the database. It may be a core system node that cannot be uninstalled, or it may have already been removed.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'You are not authorized to delete this node.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this node.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      globalToastManager.showError(
        'Uninstall Failed',
        { 
          message: errorMessage,
          duration: 10000
        }
      );
    } finally {
      setProcessingNode(null);
      setNodeToDelete(null);
    }
  };

  // Toggle node active status
  const handleToggleNodeStatus = async (nodeType: NodeType) => {
    
    const nodeWithStatus = nodeType as ExtendedNodeType;
    const newStatus = !(nodeWithStatus.active ?? true); // Default to true if not set
    setProcessingNode(nodeType.type);
    
    try {
      await nodeTypeService.updateNodeTypeStatus(nodeType.type, newStatus);
      
      // Refresh the list immediately after successful update
      await refetchNodeTypes();
      
      globalToastManager.showSuccess(
        `Node ${newStatus ? 'Enabled' : 'Disabled'}`,
        { message: `${nodeType.displayName} is now ${newStatus ? 'active' : 'inactive'}` }
      );
      
    } catch (error: any) {
      console.error('Failed to toggle node status:', error);
      globalToastManager.showError(
        'Status Update Failed',
        { 
          message: error?.response?.data?.message || `Failed to update ${nodeType.displayName}`,
          duration: 8000
        }
      );
    } finally {
      setProcessingNode(null);
    }
  };

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
            <div className="p-3 space-y-0">
              {group.nodeTypes.map((nodeType) => {
                const IconComponent = getNodeIcon(nodeType)
                
                
                const nodeElement = (
                  <div
                    className={`bg-card hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-start gap-3 p-3 text-sm leading-tight border border-border rounded-md mb-2 cursor-move group h-16 overflow-hidden transition-colors ${
                      (nodeType as ExtendedNodeType).active === false ? 'opacity-50 bg-muted/30' : ''
                    }`}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    draggable

                    onDragStart={(e) => {
                      // Use the same data format as NodePalette for consistency
                      e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
                      e.dataTransfer.effectAllowed = 'move'
                      
                      // Add visual feedback during drag - only to this element
                      const target = e.currentTarget as HTMLElement
                      target.style.opacity = '0.5'
                      target.style.transform = 'scale(0.98)'
                    }}
                    onDragEnd={(e) => {
                      // Reset visual feedback after drag
                      const target = e.currentTarget as HTMLElement
                      target.style.opacity = '1'
                      target.style.transform = 'scale(1)'
                    }}
                  >
                    <div 
                      className="w-4 h-4 shrink-0 flex items-center justify-center rounded mt-0.5"
                      style={{ color: nodeType.color || '#666' }}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium truncate flex items-center gap-2">
                        {nodeType.displayName}
                        {(nodeType as ExtendedNodeType).active === false && (
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            <PowerOff className="h-2 w-2 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {nodeType.description && (
                        <div 
                          className="text-xs text-muted-foreground overflow-hidden leading-relaxed mt-1"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {nodeType.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        v{nodeType.version}
                      </div>
                      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>
                  </div>
                )

                // Check if this is a deletable custom node
                const extendedNode = nodeType as ExtendedNodeType;
                const isDeletable = !!(extendedNode.id && extendedNode.createdAt);
                
                // Wrap with context menu
                return (
                  <ContextMenu key={`${nodeType.type}-${(nodeType as ExtendedNodeType).active}`}>
                    <ContextMenuTrigger className="block w-full">
                      {nodeElement}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem
                        onClick={() => handleToggleNodeStatus(nodeType)}
                        disabled={processingNode === nodeType.type}
                      >
                        {(nodeType as ExtendedNodeType).active !== false ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Disable Node
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Enable Node
                          </>
                        )}
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => {
                          if (isDeletable) {
                            showDeleteDialog(nodeType);
                          } else {
                            globalToastManager.showError(
                              'Cannot Uninstall',
                              { message: 'This is a core system node that cannot be uninstalled. Only custom uploaded nodes can be removed.' }
                            );
                          }
                        }}
                        disabled={processingNode === nodeType.type}
                        className={isDeletable ? "text-destructive focus:text-destructive" : "text-muted-foreground"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeletable ? 'Uninstall Node' : 'Cannot Uninstall (Core)'}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">      
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
        ) : storeError ? (
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              <Command className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">{storeError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={refetchNodeTypes}
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
      
      <TabsContent value="marketplace" className="mt-0 p-0">
        <NodeMarketplace searchTerm={searchTerm} />
      </TabsContent>
      
      <TabsContent value="upload" className="mt-0 p-0">
        <div className="p-4">
          <CustomNodeUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      </TabsContent>
    </Tabs>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={deleteDialogOpen}
      onClose={() => {
        setDeleteDialogOpen(false);
        setNodeToDelete(null);
      }}
      onConfirm={handleDeleteNode}
      title="Uninstall Node"
      message={`Are you sure you want to uninstall "${nodeToDelete?.displayName}"? This action cannot be undone and will remove the node from your workflow editor.`}
      confirmText={processingNode === nodeToDelete?.type ? 'Uninstalling...' : 'Uninstall Node'}
      cancelText="Cancel"
      severity="danger"
      loading={processingNode === nodeToDelete?.type}
      disabled={processingNode === nodeToDelete?.type}
    />
    </>
  )
}
