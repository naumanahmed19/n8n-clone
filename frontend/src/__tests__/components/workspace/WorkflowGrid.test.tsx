import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { WorkflowGrid } from '@/components/workspace/WorkflowGrid'
import { useWorkspaceStore } from '@/stores/workspace'
import { Workflow } from '@/types'

// Mock the workspace store
vi.mock('@/stores/workspace', () => ({
  useWorkspaceStore: vi.fn()
}))

// Mock the ShareWorkflowModal component
vi.mock('@/components/workspace/ShareWorkflowModal', () => ({
  ShareWorkflowModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="share-modal">Share Modal</div> : null
}))

// Mock the WorkflowActionsMenu component
vi.mock('@/components/workspace/WorkflowActionsMenu', () => ({
  WorkflowActionsMenu: ({ workflow, onShare }: { workflow: Workflow; onShare: () => void }) => (
    <button onClick={onShare} data-testid={`actions-menu-${workflow.id}`}>
      Actions
    </button>
  )
}))

const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    name: 'Test Workflow 1',
    description: 'Test description 1',
    userId: 'user1',
    nodes: [{ id: 'node1', type: 'test', name: 'Test Node', parameters: {}, position: { x: 0, y: 0 }, credentials: [], disabled: false }],
    connections: [],
    settings: {},
    active: true,
    tags: ['tag1', 'tag2'],
    analytics: {
      totalExecutions: 10,
      successfulExecutions: 8,
      failedExecutions: 2,
      averageExecutionTime: 1500,
      lastExecutedAt: '2023-01-01T10:00:00Z',
      popularityScore: 0.8
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  {
    id: 'workflow-2',
    name: 'Test Workflow 2',
    description: 'Test description 2',
    userId: 'user1',
    nodes: [],
    connections: [],
    settings: {},
    active: false,
    sharedWith: [
      {
        userId: 'user2',
        userEmail: 'user2@example.com',
        permission: 'view',
        sharedAt: '2023-01-01T00:00:00Z'
      }
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  }
]

const mockStoreState = {
  selectedWorkflows: [],
  toggleWorkflowSelection: vi.fn()
}

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('WorkflowGrid', () => {
  beforeEach(() => {
    vi.mocked(useWorkspaceStore).mockReturnValue(mockStoreState)
    vi.clearAllMocks()
  })

  it('renders workflows in grid format', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow 2')).toBeInTheDocument()
    expect(screen.getByText('Test description 1')).toBeInTheDocument()
    expect(screen.getByText('Test description 2')).toBeInTheDocument()
  })

  it('displays workflow status correctly', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('displays workflow tags', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
  })

  it('displays analytics information', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('10')).toBeInTheDocument() // Total executions
    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument() // Last executed date
  })

  it('displays sharing information', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('Shared with 1 user')).toBeInTheDocument()
  })

  it('displays node count', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getByText('1 nodes')).toBeInTheDocument()
    expect(screen.getByText('0 nodes')).toBeInTheDocument()
  })

  it('handles workflow selection', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    expect(mockStoreState.toggleWorkflowSelection).toHaveBeenCalledWith('workflow-1')
  })

  it('shows selected state for selected workflows', () => {
    vi.mocked(useWorkspaceStore).mockReturnValue({
      ...mockStoreState,
      selectedWorkflows: ['workflow-1']
    })

    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    const workflowCards = screen.getAllByRole('checkbox')
    expect(workflowCards[0]).toBeChecked()
  })

  it('renders action buttons', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    expect(screen.getAllByText('Edit')).toHaveLength(2)
    expect(screen.getAllByText('View')).toHaveLength(2)
  })

  it('opens share modal when share action is clicked', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    const actionsButton = screen.getByTestId('actions-menu-workflow-1')
    fireEvent.click(actionsButton)

    expect(screen.getByTestId('share-modal')).toBeInTheDocument()
  })

  it('handles workflows with many tags', () => {
    const workflowWithManyTags: Workflow = {
      ...mockWorkflows[0],
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    }

    renderWithRouter(<WorkflowGrid workflows={[workflowWithManyTags]} />)

    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('tag3')).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('handles workflows without analytics', () => {
    const workflowWithoutAnalytics: Workflow = {
      ...mockWorkflows[0],
      analytics: undefined
    }

    renderWithRouter(<WorkflowGrid workflows={[workflowWithoutAnalytics]} />)

    // Should still render the workflow card
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
  })

  it('handles workflows without description', () => {
    const workflowWithoutDescription: Workflow = {
      ...mockWorkflows[0],
      description: undefined
    }

    renderWithRouter(<WorkflowGrid workflows={[workflowWithoutDescription]} />)

    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    expect(screen.queryByText('Test description 1')).not.toBeInTheDocument()
  })

  it('renders correct links for workflow actions', () => {
    renderWithRouter(<WorkflowGrid workflows={mockWorkflows} />)

    const editLinks = screen.getAllByRole('link', { name: /edit/i })
    const viewLinks = screen.getAllByRole('link', { name: /view/i })

    expect(editLinks[0]).toHaveAttribute('href', '/workflows/workflow-1/edit')
    expect(viewLinks[0]).toHaveAttribute('href', '/workflows/workflow-1/executions')
  })
})