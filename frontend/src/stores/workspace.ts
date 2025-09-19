import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowFilters, 
  WorkflowAnalytics,
  PaginatedResponse 
} from '@/types'
import { workflowService } from '@/services'

interface WorkspaceState {
  // Workflows
  workflows: Workflow[]
  totalWorkflows: number
  isLoadingWorkflows: boolean
  
  // Templates
  templates: WorkflowTemplate[]
  totalTemplates: number
  isLoadingTemplates: boolean
  
  // Shared workflows
  sharedWorkflows: Workflow[]
  totalSharedWorkflows: number
  isLoadingSharedWorkflows: boolean
  
  // Filters and search
  filters: WorkflowFilters
  searchQuery: string
  selectedTags: string[]
  selectedCategory: string | null
  
  // Available options
  availableTags: string[]
  availableCategories: string[]
  
  // Analytics
  workspaceAnalytics: {
    totalWorkflows: number
    activeWorkflows: number
    totalExecutions: number
    popularWorkflows: Workflow[]
    recentActivity: any[]
  } | null
  isLoadingAnalytics: boolean
  
  // UI state
  viewMode: 'grid' | 'list'
  selectedWorkflows: string[]
  showFilters: boolean
  showTemplateGallery: boolean
}

interface WorkspaceActions {
  // Workflow management
  loadWorkflows: (filters?: WorkflowFilters) => Promise<void>
  refreshWorkflows: () => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  duplicateWorkflow: (id: string, name: string) => Promise<void>
  
  // Template management
  loadTemplates: (filters?: WorkflowFilters) => Promise<void>
  createFromTemplate: (templateId: string, name: string) => Promise<Workflow>
  publishAsTemplate: (workflowId: string, templateData: Partial<WorkflowTemplate>) => Promise<void>
  
  // Shared workflows
  loadSharedWorkflows: () => Promise<void>
  shareWorkflow: (workflowId: string, shares: any[]) => Promise<void>
  
  // Filters and search
  setFilters: (filters: Partial<WorkflowFilters>) => void
  setSearchQuery: (query: string) => void
  setSelectedTags: (tags: string[]) => void
  setSelectedCategory: (category: string | null) => void
  clearFilters: () => void
  
  // Tags and categories
  loadAvailableTags: () => Promise<void>
  loadAvailableCategories: () => Promise<void>
  updateWorkflowTags: (workflowId: string, tags: string[]) => Promise<void>
  
  // Analytics
  loadWorkspaceAnalytics: () => Promise<void>
  
  // UI actions
  setViewMode: (mode: 'grid' | 'list') => void
  toggleWorkflowSelection: (workflowId: string) => void
  selectAllWorkflows: () => void
  clearSelection: () => void
  setShowFilters: (show: boolean) => void
  setShowTemplateGallery: (show: boolean) => void
  
  // Import/Export
  exportWorkflow: (workflowId: string) => Promise<void>
  importWorkflow: (file: File) => Promise<Workflow>
}

type WorkspaceStore = WorkspaceState & WorkspaceActions

const initialFilters: WorkflowFilters = {
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      workflows: [],
      totalWorkflows: 0,
      isLoadingWorkflows: false,
      
      templates: [],
      totalTemplates: 0,
      isLoadingTemplates: false,
      
      sharedWorkflows: [],
      totalSharedWorkflows: 0,
      isLoadingSharedWorkflows: false,
      
      filters: initialFilters,
      searchQuery: '',
      selectedTags: [],
      selectedCategory: null,
      
      availableTags: [],
      availableCategories: [],
      
      workspaceAnalytics: null,
      isLoadingAnalytics: false,
      
      viewMode: 'grid',
      selectedWorkflows: [],
      showFilters: false,
      showTemplateGallery: false,

      // Actions
      loadWorkflows: async (filters) => {
        set({ isLoadingWorkflows: true })
        try {
          const currentFilters = filters || get().filters
          const response = await workflowService.getWorkflows(currentFilters)
          set({ 
            workflows: response.data,
            totalWorkflows: response.pagination?.total || 0,
            filters: currentFilters
          })
        } catch (error) {
          console.error('Failed to load workflows:', error)
        } finally {
          set({ isLoadingWorkflows: false })
        }
      },

      refreshWorkflows: async () => {
        await get().loadWorkflows(get().filters)
      },

      deleteWorkflow: async (id) => {
        try {
          await workflowService.deleteWorkflow(id)
          await get().refreshWorkflows()
        } catch (error) {
          console.error('Failed to delete workflow:', error)
          throw error
        }
      },

      duplicateWorkflow: async (id, name) => {
        try {
          await workflowService.duplicateWorkflow(id, name)
          await get().refreshWorkflows()
        } catch (error) {
          console.error('Failed to duplicate workflow:', error)
          throw error
        }
      },

      loadTemplates: async (filters) => {
        set({ isLoadingTemplates: true })
        try {
          const templateFilters = { ...filters, isTemplate: true }
          const response = await workflowService.getTemplates(templateFilters)
          set({ 
            templates: response.data,
            totalTemplates: response.pagination?.total || 0
          })
        } catch (error) {
          console.error('Failed to load templates:', error)
        } finally {
          set({ isLoadingTemplates: false })
        }
      },

      createFromTemplate: async (templateId, name) => {
        try {
          const workflow = await workflowService.createFromTemplate(templateId, name)
          await get().refreshWorkflows()
          return workflow
        } catch (error) {
          console.error('Failed to create from template:', error)
          throw error
        }
      },

      publishAsTemplate: async (workflowId, templateData) => {
        try {
          await workflowService.publishAsTemplate(workflowId, templateData)
          await get().loadTemplates()
        } catch (error) {
          console.error('Failed to publish template:', error)
          throw error
        }
      },

      loadSharedWorkflows: async () => {
        set({ isLoadingSharedWorkflows: true })
        try {
          const response = await workflowService.getSharedWorkflows()
          set({ 
            sharedWorkflows: response.data,
            totalSharedWorkflows: response.pagination?.total || 0
          })
        } catch (error) {
          console.error('Failed to load shared workflows:', error)
        } finally {
          set({ isLoadingSharedWorkflows: false })
        }
      },

      shareWorkflow: async (workflowId, shares) => {
        try {
          await workflowService.shareWorkflow(workflowId, shares)
          await get().refreshWorkflows()
        } catch (error) {
          console.error('Failed to share workflow:', error)
          throw error
        }
      },

      setFilters: (newFilters) => {
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }
        set({ filters: updatedFilters })
        get().loadWorkflows(updatedFilters)
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
        get().setFilters({ search: query, page: 1 })
      },

      setSelectedTags: (tags) => {
        set({ selectedTags: tags })
        get().setFilters({ tags, page: 1 })
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category })
        get().setFilters({ category: category || undefined, page: 1 })
      },

      clearFilters: () => {
        set({ 
          filters: initialFilters,
          searchQuery: '',
          selectedTags: [],
          selectedCategory: null
        })
        get().loadWorkflows(initialFilters)
      },

      loadAvailableTags: async () => {
        try {
          const tags = await workflowService.getAvailableTags()
          set({ availableTags: tags })
        } catch (error) {
          console.error('Failed to load available tags:', error)
        }
      },

      loadAvailableCategories: async () => {
        try {
          const categories = await workflowService.getAvailableCategories()
          set({ availableCategories: categories })
        } catch (error) {
          console.error('Failed to load available categories:', error)
        }
      },

      updateWorkflowTags: async (workflowId, tags) => {
        try {
          await workflowService.updateWorkflowTags(workflowId, tags)
          await get().refreshWorkflows()
        } catch (error) {
          console.error('Failed to update workflow tags:', error)
          throw error
        }
      },

      loadWorkspaceAnalytics: async () => {
        set({ isLoadingAnalytics: true })
        try {
          const analytics = await workflowService.getWorkspaceAnalytics()
          set({ workspaceAnalytics: analytics })
        } catch (error) {
          console.error('Failed to load workspace analytics:', error)
          // Set default analytics if endpoint doesn't exist
          set({ 
            workspaceAnalytics: {
              totalWorkflows: 0,
              activeWorkflows: 0,
              totalExecutions: 0,
              popularWorkflows: [],
              recentActivity: []
            }
          })
        } finally {
          set({ isLoadingAnalytics: false })
        }
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
      },

      toggleWorkflowSelection: (workflowId) => {
        const selected = get().selectedWorkflows
        const isSelected = selected.includes(workflowId)
        
        if (isSelected) {
          set({ selectedWorkflows: selected.filter(id => id !== workflowId) })
        } else {
          set({ selectedWorkflows: [...selected, workflowId] })
        }
      },

      selectAllWorkflows: () => {
        const workflowIds = get().workflows.map(w => w.id)
        set({ selectedWorkflows: workflowIds })
      },

      clearSelection: () => {
        set({ selectedWorkflows: [] })
      },

      setShowFilters: (show) => {
        set({ showFilters: show })
      },

      setShowTemplateGallery: (show) => {
        set({ showTemplateGallery: show })
      },

      exportWorkflow: async (workflowId) => {
        try {
          const exportData = await workflowService.exportWorkflow(workflowId)
          
          // Create and download file
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `workflow-${workflowId}-${Date.now()}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Failed to export workflow:', error)
          throw error
        }
      },

      importWorkflow: async (file) => {
        try {
          const text = await file.text()
          const workflowData = JSON.parse(text)
          const workflow = await workflowService.importWorkflow(workflowData)
          await get().refreshWorkflows()
          return workflow
        } catch (error) {
          console.error('Failed to import workflow:', error)
          throw error
        }
      }
    }),
    { name: 'workspace-store' }
  )
)