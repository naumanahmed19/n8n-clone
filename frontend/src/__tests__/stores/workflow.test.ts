import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkflowStore } from '@/stores/workflow'
import { Workflow, WorkflowNode, WorkflowConnection } from '@/types'

// Mock workflow data
const mockWorkflow: Workflow = {
  id: 'test-workflow',
  name: 'Test Workflow',
  description: 'A test workflow',
  userId: 'test-user',
  nodes: [
    {
      id: 'node-1',
      type: 'http-request',
      name: 'HTTP Request',
      parameters: { method: 'GET', url: 'https://api.example.com' },
      position: { x: 100, y: 100 },
      credentials: [],
      disabled: false
    },
    {
      id: 'node-2',
      type: 'json-transform',
      name: 'Transform Data',
      parameters: { expression: 'return items;' },
      position: { x: 300, y: 100 },
      credentials: [],
      disabled: false
    }
  ],
  connections: [
    {
      id: 'conn-1',
      sourceNodeId: 'node-1',
      sourceOutput: 'main',
      targetNodeId: 'node-2',
      targetInput: 'main'
    }
  ],
  settings: {
    timezone: 'UTC',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
    callerPolicy: 'workflowsFromSameOwner'
  },
  active: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
}

describe('WorkflowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkflowStore.setState({
      workflow: null,
      selectedNodeId: null,
      isLoading: false,
      isDirty: false,
      history: [],
      historyIndex: -1
    })
  })

  describe('setWorkflow', () => {
    it('should set workflow and mark as not dirty', () => {
      const store = useWorkflowStore.getState()
      
      store.setWorkflow(mockWorkflow)
      
      expect(store.workflow).toEqual(mockWorkflow)
      expect(store.isDirty).toBe(false)
    })

    it('should save to history when setting workflow', () => {
      const store = useWorkflowStore.getState()
      
      store.setWorkflow(mockWorkflow)
      
      expect(store.history).toHaveLength(1)
      expect(store.history[0].action).toBe('Load workflow')
      expect(store.historyIndex).toBe(0)
    })
  })

  describe('addNode', () => {
    it('should add node to workflow and mark as dirty', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const newNode: WorkflowNode = {
        id: 'node-3',
        type: 'set-values',
        name: 'Set Values',
        parameters: { values: [] },
        position: { x: 500, y: 100 },
        credentials: [],
        disabled: false
      }
      
      store.addNode(newNode)
      
      expect(store.workflow?.nodes).toHaveLength(3)
      expect(store.workflow?.nodes[2]).toEqual(newNode)
      expect(store.isDirty).toBe(true)
    })

    it('should save to history when adding node', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      const initialHistoryLength = store.history.length
      
      const newNode: WorkflowNode = {
        id: 'node-3',
        type: 'set-values',
        name: 'Set Values',
        parameters: { values: [] },
        position: { x: 500, y: 100 },
        credentials: [],
        disabled: false
      }
      
      store.addNode(newNode)
      
      expect(store.history).toHaveLength(initialHistoryLength + 1)
      expect(store.history[store.history.length - 1].action).toBe('Add node: Set Values')
    })
  })

  describe('updateNode', () => {
    it('should update node and mark as dirty', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      store.updateNode('node-1', { name: 'Updated HTTP Request' })
      
      const updatedNode = store.workflow?.nodes.find(n => n.id === 'node-1')
      expect(updatedNode?.name).toBe('Updated HTTP Request')
      expect(store.isDirty).toBe(true)
    })
  })

  describe('removeNode', () => {
    it('should remove node and associated connections', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      store.removeNode('node-1')
      
      expect(store.workflow?.nodes).toHaveLength(1)
      expect(store.workflow?.nodes[0].id).toBe('node-2')
      expect(store.workflow?.connections).toHaveLength(0)
      expect(store.isDirty).toBe(true)
    })

    it('should clear selected node if removed node was selected', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      store.setSelectedNode('node-1')
      
      store.removeNode('node-1')
      
      expect(store.selectedNodeId).toBeNull()
    })
  })

  describe('addConnection', () => {
    it('should add valid connection', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const newConnection: WorkflowConnection = {
        id: 'conn-2',
        sourceNodeId: 'node-2',
        sourceOutput: 'main',
        targetNodeId: 'node-1',
        targetInput: 'main'
      }
      
      store.addConnection(newConnection)
      
      expect(store.workflow?.connections).toHaveLength(2)
      expect(store.isDirty).toBe(true)
    })

    it('should not add invalid connection (self-connection)', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      const initialConnectionsLength = store.workflow?.connections.length || 0
      
      const invalidConnection: WorkflowConnection = {
        id: 'conn-invalid',
        sourceNodeId: 'node-1',
        sourceOutput: 'main',
        targetNodeId: 'node-1',
        targetInput: 'main'
      }
      
      store.addConnection(invalidConnection)
      
      expect(store.workflow?.connections).toHaveLength(initialConnectionsLength)
    })
  })

  describe('validateWorkflow', () => {
    it('should validate workflow with nodes and connections', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const result = store.validateWorkflow()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect empty workflow', () => {
      const store = useWorkflowStore.getState()
      const emptyWorkflow = { ...mockWorkflow, nodes: [], connections: [] }
      store.setWorkflow(emptyWorkflow)
      
      const result = store.validateWorkflow()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow must contain at least one node')
    })

    it('should detect orphaned nodes', () => {
      const store = useWorkflowStore.getState()
      const workflowWithOrphan = {
        ...mockWorkflow,
        nodes: [
          ...mockWorkflow.nodes,
          {
            id: 'orphan-node',
            type: 'set-values',
            name: 'Orphan Node',
            parameters: {},
            position: { x: 500, y: 100 },
            credentials: [],
            disabled: false
          }
        ]
      }
      store.setWorkflow(workflowWithOrphan)
      
      const result = store.validateWorkflow()
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Orphaned nodes found'))).toBe(true)
    })
  })

  describe('validateConnection', () => {
    it('should allow valid connection', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const isValid = store.validateConnection('node-2', 'node-1')
      
      expect(isValid).toBe(true)
    })

    it('should prevent self-connection', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const isValid = store.validateConnection('node-1', 'node-1')
      
      expect(isValid).toBe(false)
    })

    it('should prevent duplicate connection', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      const isValid = store.validateConnection('node-1', 'node-2')
      
      expect(isValid).toBe(false)
    })
  })

  describe('history management', () => {
    it('should support undo operation', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)

      
      // Make a change
      store.updateNode('node-1', { name: 'Changed Name' })
      expect(store.workflow?.nodes[0].name).toBe('Changed Name')
      
      // Undo the change
      store.undo()
      expect(store.workflow?.nodes[0].name).toBe('HTTP Request')
      expect(store.isDirty).toBe(true)
    })

    it('should support redo operation', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      // Make a change
      store.updateNode('node-1', { name: 'Changed Name' })
      
      // Undo the change
      store.undo()
      expect(store.workflow?.nodes[0].name).toBe('HTTP Request')
      
      // Redo the change
      store.redo()
      expect(store.workflow?.nodes[0].name).toBe('Changed Name')
    })

    it('should report correct undo/redo availability', () => {
      const store = useWorkflowStore.getState()
      store.setWorkflow(mockWorkflow)
      
      expect(store.canUndo()).toBe(false)
      expect(store.canRedo()).toBe(false)
      
      // Make a change
      store.updateNode('node-1', { name: 'Changed Name' })
      
      expect(store.canUndo()).toBe(true)
      expect(store.canRedo()).toBe(false)
      
      // Undo
      store.undo()
      
      expect(store.canUndo()).toBe(false)
      expect(store.canRedo()).toBe(true)
    })
  })
})