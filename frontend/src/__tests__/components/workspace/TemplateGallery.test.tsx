import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateGallery } from '@/components/workspace/TemplateGallery'
import { useWorkspaceStore } from '@/stores/workspace'
import { WorkflowTemplate } from '@/types'

// Mock the workspace store
vi.mock('@/stores/workspace', () => ({
  useWorkspaceStore: vi.fn()
}))

const mockTemplates: WorkflowTemplate[] = [
  {
    id: 'template-1',
    name: 'Email Automation Template',
    description: 'Automate email campaigns with this comprehensive template',
    category: 'Marketing',
    tags: ['email', 'automation', 'marketing'],
    nodes: [],
    connections: [],
    settings: {},
    author: 'John Doe',
    downloads: 1250,
    rating: 4.8,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  {
    id: 'template-2',
    name: 'Data Processing Pipeline',
    description: 'Process and transform data from multiple sources',
    category: 'Analytics',
    tags: ['data', 'processing', 'analytics', 'etl'],
    nodes: [],
    connections: [],
    settings: {},
    author: 'Jane Smith',
    downloads: 890,
    rating: 4.5,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z'
  }
]

const mockStoreState = {
  templates: mockTemplates,
  isLoadingTemplates: false,
  availableCategories: ['Marketing', 'Analytics', 'Development'],
  loadTemplates: vi.fn(),
  createFromTemplate: vi.fn()
}

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

describe('TemplateGallery', () => {
  beforeEach(() => {
    vi.mocked(useWorkspaceStore).mockReturnValue(mockStoreState)
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Template Gallery')).toBeInTheDocument()
    expect(screen.getByText('Choose from pre-built workflows to get started quickly')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<TemplateGallery isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByText('Template Gallery')).not.toBeInTheDocument()
  })

  it('loads templates when opened', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(mockStoreState.loadTemplates).toHaveBeenCalledWith({
      search: '',
      category: undefined,
      sortBy: 'popularity',
      sortOrder: 'desc'
    })
  })

  it('displays templates in grid view', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Email Automation Template')).toBeInTheDocument()
    expect(screen.getByText('Data Processing Pipeline')).toBeInTheDocument()
    expect(screen.getByText('Automate email campaigns with this comprehensive template')).toBeInTheDocument()
  })

  it('displays template ratings', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('(4.8)')).toBeInTheDocument()
    expect(screen.getByText('(4.5)')).toBeInTheDocument()
  })

  it('displays template tags', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('email')).toBeInTheDocument()
    expect(screen.getByText('automation')).toBeInTheDocument()
    expect(screen.getByText('marketing')).toBeInTheDocument()
    expect(screen.getByText('data')).toBeInTheDocument()
  })

  it('displays template metadata', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('1250')).toBeInTheDocument()
    expect(screen.getByText('890')).toBeInTheDocument()
  })

  it('handles search input', async () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const searchInput = screen.getByPlaceholderText('Search templates...')
    fireEvent.change(searchInput, { target: { value: 'email' } })

    await waitFor(() => {
      expect(mockStoreState.loadTemplates).toHaveBeenCalledWith({
        search: 'email',
        category: undefined,
        sortBy: 'popularity',
        sortOrder: 'desc'
      })
    })
  })

  it('handles category filter', async () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const categorySelect = screen.getByDisplayValue('All Categories')
    fireEvent.change(categorySelect, { target: { value: 'Marketing' } })

    await waitFor(() => {
      expect(mockStoreState.loadTemplates).toHaveBeenCalledWith({
        search: '',
        category: 'Marketing',
        sortBy: 'popularity',
        sortOrder: 'desc'
      })
    })
  })

  it('handles sort option changes', async () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const sortSelect = screen.getByDisplayValue('Most Popular')
    fireEvent.change(sortSelect, { target: { value: 'rating' } })

    await waitFor(() => {
      expect(mockStoreState.loadTemplates).toHaveBeenCalledWith({
        search: '',
        category: undefined,
        sortBy: 'rating',
        sortOrder: 'desc'
      })
    })
  })

  it('switches between grid and list view', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const listViewButton = screen.getByRole('button', { name: '' })
    fireEvent.click(listViewButton)

    // In list view, templates should still be visible but in different layout
    expect(screen.getByText('Email Automation Template')).toBeInTheDocument()
  })

  it('creates workflow from template', async () => {
    const mockWorkflow = {
      id: 'new-workflow',
      name: 'Email Automation Template Copy',
      description: 'Created from template',
      userId: 'user1',
      nodes: [],
      connections: [],
      settings: {},
      active: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    mockStoreState.createFromTemplate.mockResolvedValue(mockWorkflow)

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const useTemplateButtons = screen.getAllByText('Use Template')
    fireEvent.click(useTemplateButtons[0])

    await waitFor(() => {
      expect(mockStoreState.createFromTemplate).toHaveBeenCalledWith(
        'template-1',
        'Email Automation Template Copy'
      )
    })

    expect(window.location.href).toBe('/workflows/new-workflow/edit')
  })

  it('shows loading state', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      isLoadingTemplates: true
    })

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument() // Loading spinner
  })

  it('shows empty state when no templates', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      templates: [],
      isLoadingTemplates: false
    })

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('No templates found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    const onClose = vi.fn()
    render(<TemplateGallery isOpen={true} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('handles templates with many tags', () => {
    const templateWithManyTags: WorkflowTemplate = {
      ...mockTemplates[0],
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
    }

    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      templates: [templateWithManyTags]
    })

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
    expect(screen.getByText('+3 more')).toBeInTheDocument()
  })

  it('displays star ratings correctly', () => {
    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    // Should render rating text for each template
    expect(screen.getByText('(4.8)')).toBeInTheDocument()
    expect(screen.getByText('(4.5)')).toBeInTheDocument()
  })

  it('handles template creation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStoreState.createFromTemplate.mockRejectedValue(new Error('Creation failed'))

    render(<TemplateGallery isOpen={true} onClose={vi.fn()} />)

    const useTemplateButtons = screen.getAllByText('Use Template')
    fireEvent.click(useTemplateButtons[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create workflow from template:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})