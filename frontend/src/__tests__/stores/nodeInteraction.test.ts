import { useWorkflowStore } from '@/stores/workflow'
import { act, renderHook } from '@testing-library/react'

describe('Node Interaction Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useWorkflowStore())
    act(() => {
      result.current.setWorkflow(null)
    })
  })

  it('should manage property panel state', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Initially property panel should be closed
    expect(result.current.showPropertyPanel).toBe(false)
    expect(result.current.propertyPanelNodeId).toBe(null)

    // Open property panel for a node
    act(() => {
      result.current.openNodeProperties('node-1')
    })

    expect(result.current.showPropertyPanel).toBe(true)
    expect(result.current.propertyPanelNodeId).toBe('node-1')
    expect(result.current.selectedNodeId).toBe('node-1')

    // Close property panel
    act(() => {
      result.current.closeNodeProperties()
    })

    expect(result.current.showPropertyPanel).toBe(false)
    expect(result.current.propertyPanelNodeId).toBe(null)
  })

  it('should manage context menu state', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Initially context menu should be hidden
    expect(result.current.contextMenuVisible).toBe(false)
    expect(result.current.contextMenuNodeId).toBe(null)
    expect(result.current.contextMenuPosition).toBe(null)

    // Show context menu
    const position = { x: 100, y: 200 }
    act(() => {
      result.current.showContextMenu('node-1', position)
    })

    expect(result.current.contextMenuVisible).toBe(true)
    expect(result.current.contextMenuNodeId).toBe('node-1')
    expect(result.current.contextMenuPosition).toEqual(position)
    expect(result.current.selectedNodeId).toBe('node-1')

    // Hide context menu
    act(() => {
      result.current.hideContextMenu()
    })

    expect(result.current.contextMenuVisible).toBe(false)
    expect(result.current.contextMenuNodeId).toBe(null)
    expect(result.current.contextMenuPosition).toBe(null)
  })

  it('should clean up node interaction state when node is removed', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Set up a workflow with a node
    const mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: '',
      nodes: [
        {
          id: 'node-1',
          type: 'test',
          name: 'Test Node',
          parameters: {},
          position: { x: 0, y: 0 },
          credentials: [],
          disabled: false
        }
      ],
      connections: [],
      settings: {},
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }

    act(() => {
      result.current.setWorkflow(mockWorkflow)
    })

    // Open property panel for the node
    act(() => {
      result.current.openNodeProperties('node-1')
    })

    // Show context menu for the node
    act(() => {
      result.current.showContextMenu('node-1', { x: 100, y: 200 })
    })

    expect(result.current.showPropertyPanel).toBe(true)
    expect(result.current.contextMenuVisible).toBe(true)

    // Remove the node
    act(() => {
      result.current.removeNode('node-1')
    })

    // Property panel and context menu should be closed
    expect(result.current.showPropertyPanel).toBe(false)
    expect(result.current.propertyPanelNodeId).toBe(null)
    expect(result.current.contextMenuVisible).toBe(false)
    expect(result.current.contextMenuNodeId).toBe(null)
    expect(result.current.contextMenuPosition).toBe(null)
  })

  it('should reset node interaction state when workflow is changed', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Open property panel and context menu
    act(() => {
      result.current.openNodeProperties('node-1')
      result.current.showContextMenu('node-1', { x: 100, y: 200 })
    })

    expect(result.current.showPropertyPanel).toBe(true)
    expect(result.current.contextMenuVisible).toBe(true)

    // Load a new workflow
    const newWorkflow = {
      id: 'new-workflow',
      name: 'New Workflow',
      description: '',
      nodes: [],
      connections: [],
      settings: {},
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1'
    }

    act(() => {
      result.current.setWorkflow(newWorkflow)
    })

    // All node interaction state should be reset
    expect(result.current.selectedNodeId).toBe(null)
    expect(result.current.showPropertyPanel).toBe(false)
    expect(result.current.propertyPanelNodeId).toBe(null)
    expect(result.current.contextMenuVisible).toBe(false)
    expect(result.current.contextMenuNodeId).toBe(null)
    expect(result.current.contextMenuPosition).toBe(null)
  })

  it('should hide context menu when opening node properties', () => {
    const { result } = renderHook(() => useWorkflowStore())

    // Show context menu first
    act(() => {
      result.current.showContextMenu('node-1', { x: 100, y: 200 })
    })

    expect(result.current.contextMenuVisible).toBe(true)

    // Open node properties
    act(() => {
      result.current.openNodeProperties('node-1')
    })

    // Context menu should be hidden, property panel should be open
    expect(result.current.contextMenuVisible).toBe(false)
    expect(result.current.showPropertyPanel).toBe(true)
    expect(result.current.propertyPanelNodeId).toBe('node-1')
  })
})