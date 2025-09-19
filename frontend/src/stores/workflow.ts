import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowEditorState, 
  WorkflowHistoryEntry
} from '@/types'

interface WorkflowStore extends WorkflowEditorState {
  // Actions
  setWorkflow: (workflow: Workflow | null) => void
  updateWorkflow: (updates: Partial<Workflow>) => void
  addNode: (node: WorkflowNode) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  removeNode: (nodeId: string) => void
  addConnection: (connection: WorkflowConnection) => void
  removeConnection: (connectionId: string) => void
  setSelectedNode: (nodeId: string | null) => void
  setLoading: (loading: boolean) => void
  setDirty: (dirty: boolean) => void
  
  // History management
  saveToHistory: (action: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Validation
  validateWorkflow: () => { isValid: boolean; errors: string[] }
  validateConnection: (sourceId: string, targetId: string) => boolean
}

const MAX_HISTORY_SIZE = 50

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      workflow: null,
      selectedNodeId: null,
      isLoading: false,
      isDirty: false,
      history: [],
      historyIndex: -1,

      // Actions
      setWorkflow: (workflow) => {
        set({ workflow, isDirty: false })
        if (workflow) {
          get().saveToHistory('Load workflow')
        }
      },

      updateWorkflow: (updates) => {
        const current = get().workflow
        if (!current) return

        const updated = { ...current, ...updates }
        set({ workflow: updated, isDirty: true })
      },

      addNode: (node) => {
        const current = get().workflow
        if (!current) return

        const updated = {
          ...current,
          nodes: [...current.nodes, node]
        }
        set({ workflow: updated, isDirty: true })
        get().saveToHistory(`Add node: ${node.name}`)
      },

      updateNode: (nodeId, updates) => {
        const current = get().workflow
        if (!current) return

        const updated = {
          ...current,
          nodes: current.nodes.map(node =>
            node.id === nodeId ? { ...node, ...updates } : node
          )
        }
        set({ workflow: updated, isDirty: true })
        get().saveToHistory(`Update node: ${nodeId}`)
      },

      removeNode: (nodeId) => {
        const current = get().workflow
        if (!current) return

        const updated = {
          ...current,
          nodes: current.nodes.filter(node => node.id !== nodeId),
          connections: current.connections.filter(
            conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
          )
        }
        set({ workflow: updated, isDirty: true, selectedNodeId: null })
        get().saveToHistory(`Remove node: ${nodeId}`)
      },

      addConnection: (connection) => {
        const current = get().workflow
        if (!current) return

        // Validate connection before adding
        if (!get().validateConnection(connection.sourceNodeId, connection.targetNodeId)) {
          return
        }

        const updated = {
          ...current,
          connections: [...current.connections, connection]
        }
        set({ workflow: updated, isDirty: true })
        get().saveToHistory('Add connection')
      },

      removeConnection: (connectionId) => {
        const current = get().workflow
        if (!current) return

        const updated = {
          ...current,
          connections: current.connections.filter(conn => conn.id !== connectionId)
        }
        set({ workflow: updated, isDirty: true })
        get().saveToHistory('Remove connection')
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setDirty: (dirty) => {
        set({ isDirty: dirty })
      },

      // History management
      saveToHistory: (action) => {
        const { workflow, history, historyIndex } = get()
        if (!workflow) return

        const newEntry: WorkflowHistoryEntry = {
          workflow: JSON.parse(JSON.stringify(workflow)), // Deep clone
          timestamp: Date.now(),
          action
        }

        // Remove any history after current index (when undoing then making new changes)
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newEntry)

        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift()
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1
        })
      },

      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
          const previousEntry = history[historyIndex - 1]
          set({
            workflow: JSON.parse(JSON.stringify(previousEntry.workflow)),
            historyIndex: historyIndex - 1,
            isDirty: true
          })
        }
      },

      redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
          const nextEntry = history[historyIndex + 1]
          set({
            workflow: JSON.parse(JSON.stringify(nextEntry.workflow)),
            historyIndex: historyIndex + 1,
            isDirty: true
          })
        }
      },

      canUndo: () => {
        const { historyIndex } = get()
        return historyIndex > 0
      },

      canRedo: () => {
        const { history, historyIndex } = get()
        return historyIndex < history.length - 1
      },

      // Validation
      validateWorkflow: () => {
        const { workflow } = get()
        if (!workflow) return { isValid: false, errors: ['No workflow loaded'] }

        const errors: string[] = []

        // Check for nodes
        if (workflow.nodes.length === 0) {
          errors.push('Workflow must contain at least one node')
        }

        // Check for orphaned nodes (nodes with no connections)
        const connectedNodeIds = new Set([
          ...workflow.connections.map(c => c.sourceNodeId),
          ...workflow.connections.map(c => c.targetNodeId)
        ])

        const orphanedNodes = workflow.nodes.filter(node => 
          !connectedNodeIds.has(node.id) && workflow.nodes.length > 1
        )

        if (orphanedNodes.length > 0) {
          errors.push(`Orphaned nodes found: ${orphanedNodes.map(n => n.name).join(', ')}`)
        }

        // Check for circular dependencies
        const hasCircularDependency = (nodeId: string, visited = new Set<string>()): boolean => {
          if (visited.has(nodeId)) return true
          visited.add(nodeId)

          const outgoingConnections = workflow.connections.filter(c => c.sourceNodeId === nodeId)
          return outgoingConnections.some(conn => hasCircularDependency(conn.targetNodeId, visited))
        }

        const startNodes = workflow.nodes.filter(node => 
          !workflow.connections.some(c => c.targetNodeId === node.id)
        )

        for (const startNode of startNodes) {
          if (hasCircularDependency(startNode.id)) {
            errors.push('Circular dependency detected in workflow')
            break
          }
        }

        return {
          isValid: errors.length === 0,
          errors
        }
      },

      validateConnection: (sourceId, targetId) => {
        const { workflow } = get()
        if (!workflow) return false

        // Prevent self-connection
        if (sourceId === targetId) return false

        // Check if connection already exists
        const existingConnection = workflow.connections.find(
          c => c.sourceNodeId === sourceId && c.targetNodeId === targetId
        )
        if (existingConnection) return false

        // Check for circular dependency
        const wouldCreateCircle = (currentId: string, targetId: string, visited = new Set<string>()): boolean => {
          if (currentId === targetId) return true
          if (visited.has(currentId)) return false
          visited.add(currentId)

          const outgoing = workflow.connections.filter(c => c.sourceNodeId === currentId)
          return outgoing.some(conn => wouldCreateCircle(conn.targetNodeId, targetId, visited))
        }

        return !wouldCreateCircle(targetId, sourceId)
      }
    }),
    { name: 'workflow-store' }
  )
)