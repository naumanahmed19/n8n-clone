import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkspaceFilters } from '@/components/workspace/WorkspaceFilters'
import { useWorkspaceStore } from '@/stores/workspace'

// Mock the workspace store
vi.mock('@/stores/workspace', () => ({
  useWorkspaceStore: vi.fn()
}))

const mockStoreState = {
  filters: {
    sortBy: 'updatedAt',
    sortOrder: 'desc' as const,
    active: undefined,
    isPublic: undefined
  },
  selectedTags: [],
  selectedCategory: null,
  availableTags: ['automation', 'data-processing', 'notification', 'integration'],
  availableCategories: ['General', 'Marketing', 'Development', 'Analytics'],
  setFilters: vi.fn(),
  setSelectedTags: vi.fn(),
  setSelectedCategory: vi.fn(),
  clearFilters: vi.fn()
}

describe('WorkspaceFilters', () => {
  beforeEach(() => {
    vi.mocked(useWorkspaceStore).mockReturnValue(mockStoreState)
    vi.clearAllMocks()
  })

  it('renders all filter sections', () => {
    render(<WorkspaceFilters />)

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Visibility')).toBeInTheDocument()
    expect(screen.getByText('Sort by')).toBeInTheDocument()
  })

  it('displays available categories', () => {
    render(<WorkspaceFilters />)

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('displays available tags', () => {
    render(<WorkspaceFilters />)

    expect(screen.getByText('automation')).toBeInTheDocument()
    expect(screen.getByText('data-processing')).toBeInTheDocument()
    expect(screen.getByText('notification')).toBeInTheDocument()
    expect(screen.getByText('integration')).toBeInTheDocument()
  })

  it('handles category selection', () => {
    render(<WorkspaceFilters />)

    const generalCategory = screen.getByLabelText('General')
    fireEvent.click(generalCategory)

    expect(mockStoreState.setSelectedCategory).toHaveBeenCalledWith('General')
  })

  it('handles tag selection', () => {
    render(<WorkspaceFilters />)

    const automationTag = screen.getByLabelText('automation')
    fireEvent.click(automationTag)

    expect(mockStoreState.setSelectedTags).toHaveBeenCalledWith(['automation'])
  })

  it('handles tag deselection', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedTags: ['automation', 'notification']
    })

    render(<WorkspaceFilters />)

    const automationTag = screen.getByLabelText('automation')
    fireEvent.click(automationTag)

    expect(mockStoreState.setSelectedTags).toHaveBeenCalledWith(['notification'])
  })

  it('handles status filter changes', () => {
    render(<WorkspaceFilters />)

    const activeStatus = screen.getByLabelText('Active')
    fireEvent.click(activeStatus)

    expect(mockStoreState.setFilters).toHaveBeenCalledWith({ active: true })
  })

  it('handles visibility filter changes', () => {
    render(<WorkspaceFilters />)

    const publicVisibility = screen.getByLabelText('Public')
    fireEvent.click(publicVisibility)

    expect(mockStoreState.setFilters).toHaveBeenCalledWith({ isPublic: true })
  })

  it('handles sort option changes', () => {
    render(<WorkspaceFilters />)

    const nameAscButton = screen.getByText('Name ↑')
    fireEvent.click(nameAscButton)

    expect(mockStoreState.setFilters).toHaveBeenCalledWith({ 
      sortBy: 'name', 
      sortOrder: 'asc' 
    })
  })

  it('shows clear filters button when filters are active', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedTags: ['automation'],
      selectedCategory: 'General'
    })

    render(<WorkspaceFilters />)

    const clearButton = screen.getByText('Clear all')
    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)
    expect(mockStoreState.clearFilters).toHaveBeenCalled()
  })

  it('hides clear filters button when no filters are active', () => {
    render(<WorkspaceFilters />)

    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
  })

  it('shows active state for selected category', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedCategory: 'General'
    })

    render(<WorkspaceFilters />)

    const generalCategory = screen.getByLabelText('General')
    expect(generalCategory).toBeChecked()
  })

  it('shows active state for selected tags', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedTags: ['automation', 'notification']
    })

    render(<WorkspaceFilters />)

    const automationTag = screen.getByLabelText('automation')
    const notificationTag = screen.getByLabelText('notification')
    const dataProcessingTag = screen.getByLabelText('data-processing')

    expect(automationTag).toBeChecked()
    expect(notificationTag).toBeChecked()
    expect(dataProcessingTag).not.toBeChecked()
  })

  it('shows active state for status filters', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      filters: {
        ...mockStoreState.filters,
        active: true
      }
    })

    render(<WorkspaceFilters />)

    const statusSection = screen.getByText('Status').closest('div')
    const activeStatus = within(statusSection!).getByLabelText('Active')
    const inactiveStatus = within(statusSection!).getByLabelText('Inactive')
    const allStatus = within(statusSection!).getByLabelText('All')

    expect(activeStatus).toBeChecked()
    expect(inactiveStatus).not.toBeChecked()
    expect(allStatus).not.toBeChecked()
  })

  it('shows active state for visibility filters', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      filters: {
        ...mockStoreState.filters,
        isPublic: false
      }
    })

    render(<WorkspaceFilters />)

    const visibilitySection = screen.getByText('Visibility').closest('div')
    const publicVisibility = within(visibilitySection!).getByLabelText('Public')
    const privateVisibility = within(visibilitySection!).getByLabelText('Private')
    const allVisibility = within(visibilitySection!).getByLabelText('All')

    expect(publicVisibility).not.toBeChecked()
    expect(privateVisibility).toBeChecked()
    expect(allVisibility).not.toBeChecked()
  })

  it('highlights active sort options', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      filters: {
        ...mockStoreState.filters,
        sortBy: 'name',
        sortOrder: 'asc'
      }
    })

    render(<WorkspaceFilters />)

    const nameAscButton = screen.getByText('Name ↑')
    expect(nameAscButton).toHaveClass('bg-primary-100', 'border-primary-300', 'text-primary-700')
  })

  it('handles category deselection', () => {
    const mockSetSelectedCategory = vi.fn()
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedCategory: 'General',
      setSelectedCategory: mockSetSelectedCategory
    })

    render(<WorkspaceFilters />)

    const generalCategory = screen.getByLabelText('General')
    fireEvent.click(generalCategory)

    expect(mockSetSelectedCategory).toHaveBeenCalledWith(null)
  })
})