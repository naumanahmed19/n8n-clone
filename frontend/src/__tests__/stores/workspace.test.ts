import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkspaceStore } from '@/stores/workspace'
import { workflowService } from '@/services'

// Mock the workflow service
vi.mock('@/services', () => ({
  workflowService: {
    getWorkflows: vi.fn(),
    getTemplates: vi.fn(),
    getSharedWorkflows: vi.fn(),
    deleteWorkflow: vi.fn(),
    duplicateWorkflow: vi.fn(),
    createFromTemplate: vi.fn(),
    publishAsTemplate: vi.fn(),
    shareWorkflow: vi.fn(),
    exportWorkflow: vi.fn(),
    importWorkflow: vi.fn(),
    getAvailableTags: vi.fn(),
    getAvailableCategories: vi.fn(),
    updateWorkflowTags: vi.fn(),
    getWorkspaceAnalytics: vi.fn()
  }
}))

describe('WorkspaceStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useWorkspaceStore.setState({
      workflows: [],
      totalWorkflows: 0,
      isLoadingWorkflows: false,
      templates: [],
      totalTemplates: 0,
      isLoadingTemplates: false,
      sharedWorkflows: [],
      totalSharedWorkflows: 0,
      isLoadingSharedWorkflows: false,
      filters: {
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      },
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
      showTemplateGallery: false
    })
    vi.clearAllMocks()
  })

  describe('loadWorkflows', () => {
    it('should load workflows successfully', async () => {
      const mockWorkflows = [
        {
          id: '1',
          name: 'Test Workflow',
          description: 'Test description',
          userId: 'user1',
          nodes: [],
          connections: [],
          settings: {},
          active: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ]

      const mockResponse = {
        data: mockWorkflows,
        pagination: { total: 1, page: 1, limit: 20 }
      }

      vi.mocked(workflowService.getWorkflows).mockResolvedValue(mockResponse)

      const { loadWorkflows } = useWorkspaceStore.getState()
      await loadWorkflows()

      const state = useWorkspaceStore.getState()
      expect(state.workflows).toEqual(mockWorkflows)
      expect(state.totalWorkflows).toBe(1)
      expect(state.isLoadingWorkflows).toBe(false)
    })

    it('should handle loading error', async () => {
      vi.mocked(workflowService.getWorkflows).mockRejectedValue(new Error('Failed to load'))

      const { loadWorkflows } = useWorkspaceStore.getState()
      await loadWorkflows()

      const state = useWorkspaceStore.getState()
      expect(state.isLoadingWorkflows).toBe(false)
      expect(state.workflows).toEqual([])
    })
  })

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      vi.mocked(workflowService.deleteWorkflow).mockResolvedValue()
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })

      const { deleteWorkflow } = useWorkspaceStore.getState()
      await deleteWorkflow('workflow-1')

      expect(workflowService.deleteWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(workflowService.getWorkflows).toHaveBeenCalled()
    })
  })

  describe('duplicateWorkflow', () => {
    it('should duplicate workflow successfully', async () => {
      vi.mocked(workflowService.duplicateWorkflow).mockResolvedValue({
        id: '2',
        name: 'Test Workflow (Copy)',
        description: 'Test description',
        userId: 'user1',
        nodes: [],
        connections: [],
        settings: {},
        active: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      })
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })

      const { duplicateWorkflow } = useWorkspaceStore.getState()
      await duplicateWorkflow('workflow-1', 'Test Workflow (Copy)')

      expect(workflowService.duplicateWorkflow).toHaveBeenCalledWith('workflow-1', 'Test Workflow (Copy)')
      expect(workflowService.getWorkflows).toHaveBeenCalled()
    })
  })

  describe('filters and search', () => {
    it('should update search query and trigger reload', async () => {
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })

      const { setSearchQuery } = useWorkspaceStore.getState()
      setSearchQuery('test query')

      const state = useWorkspaceStore.getState()
      expect(state.searchQuery).toBe('test query')
      expect(state.filters.search).toBe('test query')
      expect(state.filters.page).toBe(1)
    })

    it('should update selected tags and trigger reload', async () => {
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })

      const { setSelectedTags } = useWorkspaceStore.getState()
      setSelectedTags(['tag1', 'tag2'])

      const state = useWorkspaceStore.getState()
      expect(state.selectedTags).toEqual(['tag1', 'tag2'])
      expect(state.filters.tags).toEqual(['tag1', 'tag2'])
      expect(state.filters.page).toBe(1)
    })

    it('should clear all filters', async () => {
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20 }
      })

      // Set some filters first
      const { setSearchQuery, setSelectedTags, setSelectedCategory, clearFilters } = useWorkspaceStore.getState()
      setSearchQuery('test')
      setSelectedTags(['tag1'])
      setSelectedCategory('category1')

      // Clear filters
      clearFilters()

      const state = useWorkspaceStore.getState()
      expect(state.searchQuery).toBe('')
      expect(state.selectedTags).toEqual([])
      expect(state.selectedCategory).toBe(null)
      expect(state.filters).toEqual({
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('templates', () => {
    it('should load templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Test Template',
          description: 'Test template description',
          category: 'General',
          tags: ['test'],
          nodes: [],
          connections: [],
          settings: {},
          author: 'Test Author',
          downloads: 100,
          rating: 4.5,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ]

      vi.mocked(workflowService.getTemplates).mockResolvedValue({
        data: mockTemplates,
        pagination: { total: 1, page: 1, limit: 20 }
      })

      const { loadTemplates } = useWorkspaceStore.getState()
      await loadTemplates()

      const state = useWorkspaceStore.getState()
      expect(state.templates).toEqual(mockTemplates)
      expect(state.totalTemplates).toBe(1)
    })

    it('should create workflow from template', async () => {
      const mockWorkflow = {
        id: 'new-workflow',
        name: 'Template Copy',
        description: 'Created from template',
        userId: 'user1',
        nodes: [],
        connections: [],
        settings: {},
        active: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }

      vi.mocked(workflowService.createFromTemplate).mockResolvedValue(mockWorkflow)
      vi.mocked(workflowService.getWorkflows).mockResolvedValue({
        data: [mockWorkflow],
        pagination: { total: 1, page: 1, limit: 20 }
      })

      const { createFromTemplate } = useWorkspaceStore.getState()
      const result = await createFromTemplate('template-1', 'Template Copy')

      expect(result).toEqual(mockWorkflow)
      expect(workflowService.createFromTemplate).toHaveBeenCalledWith('template-1', 'Template Copy')
    })
  })

  describe('workflow selection', () => {
    it('should toggle workflow selection', () => {
      const { toggleWorkflowSelection } = useWorkspaceStore.getState()
      
      // Select workflow
      toggleWorkflowSelection('workflow-1')
      let state = useWorkspaceStore.getState()
      expect(state.selectedWorkflows).toEqual(['workflow-1'])

      // Deselect workflow
      toggleWorkflowSelection('workflow-1')
      state = useWorkspaceStore.getState()
      expect(state.selectedWorkflows).toEqual([])
    })

    it('should select multiple workflows', () => {
      const { toggleWorkflowSelection } = useWorkspaceStore.getState()
      
      toggleWorkflowSelection('workflow-1')
      toggleWorkflowSelection('workflow-2')
      
      const state = useWorkspaceStore.getState()
      expect(state.selectedWorkflows).toEqual(['workflow-1', 'workflow-2'])
    })

    it('should clear selection', () => {
      const { toggleWorkflowSelection, clearSelection } = useWorkspaceStore.getState()
      
      // Select some workflows
      toggleWorkflowSelection('workflow-1')
      toggleWorkflowSelection('workflow-2')
      
      // Clear selection
      clearSelection()
      
      const state = useWorkspaceStore.getState()
      expect(state.selectedWorkflows).toEqual([])
    })
  })

  describe('UI state', () => {
    it('should toggle view mode', () => {
      const { setViewMode } = useWorkspaceStore.getState()
      
      setViewMode('list')
      let state = useWorkspaceStore.getState()
      expect(state.viewMode).toBe('list')

      setViewMode('grid')
      state = useWorkspaceStore.getState()
      expect(state.viewMode).toBe('grid')
    })

    it('should toggle filters visibility', () => {
      const { setShowFilters } = useWorkspaceStore.getState()
      
      setShowFilters(true)
      let state = useWorkspaceStore.getState()
      expect(state.showFilters).toBe(true)

      setShowFilters(false)
      state = useWorkspaceStore.getState()
      expect(state.showFilters).toBe(false)
    })
  })

  describe('import/export', () => {
    it('should export workflow', async () => {
      const mockExportData = {
        workflow: {
          name: 'Test Workflow',
          description: 'Test description',
          nodes: [],
          connections: [],
          settings: {}
        },
        version: '1.0.0',
        exportedAt: '2023-01-01',
        exportedBy: 'user1'
      }

      vi.mocked(workflowService.exportWorkflow).mockResolvedValue(mockExportData)

      // Mock DOM methods
      const mockCreateElement = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockClick = vi.fn()
      const mockCreateObjectURL = vi.fn()
      const mockRevokeObjectURL = vi.fn()

      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      }

      mockCreateElement.mockReturnValue(mockAnchor)
      mockCreateObjectURL.mockReturnValue('blob:url')

      Object.defineProperty(document, 'createElement', { value: mockCreateElement })
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild })
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild })
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })

      const { exportWorkflow } = useWorkspaceStore.getState()
      await exportWorkflow('workflow-1')

      expect(workflowService.exportWorkflow).toHaveBeenCalledWith('workflow-1')
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
    })
  })
})