import { nodeService } from '@/services/node'
import { NodeType } from '@/types'
import { create } from 'zustand'

// Extended node type that might have additional properties for custom nodes
interface ExtendedNodeType extends NodeType {
  id?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface NodeTypesState {
  // Data
  nodeTypes: ExtendedNodeType[]
  
  // Loading states
  isLoading: boolean
  isRefetching: boolean
  
  // Error state
  error: string | null
  
  // Actions
  fetchNodeTypes: () => Promise<void>
  refetchNodeTypes: () => Promise<void>
  setNodeTypes: (nodeTypes: ExtendedNodeType[]) => void
  updateNodeType: (nodeType: ExtendedNodeType) => void
  removeNodeType: (nodeTypeId: string) => void
  clearError: () => void
  
  // Computed getters
  getActiveNodeTypes: () => ExtendedNodeType[]
  getNodeTypeById: (id: string) => ExtendedNodeType | undefined
  getNodeTypesByCategory: () => Record<string, ExtendedNodeType[]>
  getActiveNodeTypesByCategory: () => Record<string, ExtendedNodeType[]>
}

export const useNodeTypesStore = create<NodeTypesState>((set, get) => ({
  // Initial state
  nodeTypes: [],
  isLoading: false,
  isRefetching: false,
  error: null,

  // Actions
  fetchNodeTypes: async () => {
    const { isLoading } = get()
    
    // Prevent multiple simultaneous fetches
    if (isLoading) return
    
    set({ isLoading: true, error: null })
    
    try {
      console.log('Fetching node types from store...')
      const response = await nodeService.getNodeTypes()
      console.log(`Fetched ${response.length} node types`)
      
      set({ 
        nodeTypes: response,
        isLoading: false,
        error: null 
      })
    } catch (error: any) {
      console.error('Failed to fetch node types:', error)
      set({ 
        error: error?.message || 'Failed to load node types',
        isLoading: false 
      })
    }
  },

  refetchNodeTypes: async () => {
    const { isRefetching } = get()
    
    // Prevent multiple simultaneous refetches
    if (isRefetching) return
    
    set({ isRefetching: true, error: null })
    
    try {
      console.log('Refetching node types from store...')
      const response = await nodeService.getNodeTypes()
      console.log(`Refetched ${response.length} node types`)
      
      set({ 
        nodeTypes: response,
        isRefetching: false,
        error: null 
      })
    } catch (error: any) {
      console.error('Failed to refetch node types:', error)
      set({ 
        error: error?.message || 'Failed to reload node types',
        isRefetching: false 
      })
    }
  },

  setNodeTypes: (nodeTypes: ExtendedNodeType[]) => {
    set({ nodeTypes })
  },

  updateNodeType: (updatedNodeType: ExtendedNodeType) => {
    set((state) => ({
      nodeTypes: state.nodeTypes.map((nodeType) =>
        nodeType.type === updatedNodeType.type ? updatedNodeType : nodeType
      )
    }))
  },

  removeNodeType: (nodeTypeId: string) => {
    set((state) => ({
      nodeTypes: state.nodeTypes.filter((nodeType) => 
        nodeType.type !== nodeTypeId && nodeType.id !== nodeTypeId
      )
    }))
  },

  clearError: () => {
    set({ error: null })
  },

  // Computed getters
  getActiveNodeTypes: () => {
    const { nodeTypes } = get()
    // Filter out nodes that are explicitly marked as inactive
    // Default to active (true) if the active property is not set
    return nodeTypes.filter((nodeType) => nodeType.active !== false)
  },

  getNodeTypeById: (id: string) => {
    const { nodeTypes } = get()
    return nodeTypes.find((nodeType) => nodeType.type === id || nodeType.id === id)
  },

  getNodeTypesByCategory: () => {
    const { nodeTypes } = get()
    const groups: Record<string, ExtendedNodeType[]> = {}
    
    nodeTypes.forEach((nodeType) => {
      nodeType.group.forEach((group) => {
        const categoryKey = group.charAt(0).toUpperCase() + group.slice(1)
        if (!groups[categoryKey]) {
          groups[categoryKey] = []
        }
        if (!groups[categoryKey].find(nt => nt.type === nodeType.type)) {
          groups[categoryKey].push(nodeType)
        }
      })
    })

    // Sort categories alphabetically, but put common ones first
    const categoryOrder = ['Core', 'Trigger', 'Transform', 'Other']
    const sortedGroups: Record<string, ExtendedNodeType[]> = {}
    
    Object.keys(groups)
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a)
        const bIndex = categoryOrder.indexOf(b)
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        return a.localeCompare(b)
      })
      .forEach((category) => {
        sortedGroups[category] = groups[category].sort((a, b) => 
          a.displayName.localeCompare(b.displayName)
        )
      })

    return sortedGroups
  },

  getActiveNodeTypesByCategory: () => {
    const { getActiveNodeTypes, getNodeTypesByCategory } = get()
    const activeNodeTypes = getActiveNodeTypes()
    const allCategories = getNodeTypesByCategory()
    
    const activeCategories: Record<string, ExtendedNodeType[]> = {}
    
    Object.entries(allCategories).forEach(([category, nodeTypes]) => {
      const activeInCategory = nodeTypes.filter((nodeType) =>
        activeNodeTypes.find((active) => active.type === nodeType.type)
      )
      if (activeInCategory.length > 0) {
        activeCategories[category] = activeInCategory
      }
    })
    
    return activeCategories
  },
}))

// Export hook for easier usage
export const useNodeTypes = () => {
  const store = useNodeTypesStore()
  
  return {
    // Data
    nodeTypes: store.nodeTypes,
    activeNodeTypes: store.getActiveNodeTypes(),
    
    // Loading states
    isLoading: store.isLoading,
    isRefetching: store.isRefetching,
    
    // Error
    error: store.error,
    
    // Actions
    fetchNodeTypes: store.fetchNodeTypes,
    refetchNodeTypes: store.refetchNodeTypes,
    updateNodeType: store.updateNodeType,
    removeNodeType: store.removeNodeType,
    clearError: store.clearError,
    
    // Computed
    getNodeTypeById: store.getNodeTypeById,
    getNodeTypesByCategory: store.getNodeTypesByCategory,
    getActiveNodeTypesByCategory: store.getActiveNodeTypesByCategory,
  }
}