import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowEditorState, 
  WorkflowHistoryEntry,
  ExecutionState,
  WorkflowExecutionResult
} from '@/types'
import { workflowFileService, ValidationResult } from '@/services/workflowFile'
import { 
  validateWorkflow, 
  validateWorkflowForExecution,
  handleWorkflowError,
  createWorkflowError,
  WorkflowErrorCodes
} from '@/utils/workflowErrorHandling'
import { 
  validateTitle as validateTitleUtil,
  validateImportFile as validateImportFileUtil,
  createAsyncErrorHandler,
  retryOperation
} from '@/utils/errorHandling'
import {
  ensureWorkflowMetadata,
  updateWorkflowTitle,
  updateMetadata,
  validateMetadata,
  migrateMetadata
} from '@/utils/workflowMetadata'

interface WorkflowStore extends WorkflowEditorState {
  // Title management state
  workflowTitle: string
  isTitleDirty: boolean
  titleValidationError: string | null
  
  // Import/Export state
  isExporting: boolean
  isImporting: boolean
  importProgress: number
  exportProgress: number
  importError: string | null
  exportError: string | null
  
  // Execution state
  executionState: ExecutionState
  lastExecutionResult: WorkflowExecutionResult | null
  
  // Node interaction state
  showPropertyPanel: boolean
  propertyPanelNodeId: string | null
  contextMenuVisible: boolean
  contextMenuPosition: { x: number; y: number } | null
  contextMenuNodeId: string | null
  
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
  
  // Title management actions
  updateTitle: (title: string) => void
  saveTitle: () => void
  setTitleDirty: (dirty: boolean) => void
  validateTitle: (title: string) => { isValid: boolean; error: string | null }
  sanitizeTitle: (title: string) => string
  
  // History management
  saveToHistory: (action: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Import/Export actions
  exportWorkflow: () => Promise<void>
  importWorkflow: (file: File) => Promise<void>
  validateImportFile: (file: File) => Promise<ValidationResult>
  setImportProgress: (progress: number) => void
  setExportProgress: (progress: number) => void
  clearImportExportErrors: () => void
  
  // Execution actions
  executeWorkflow: () => Promise<void>
  stopExecution: () => Promise<void>
  setExecutionState: (state: Partial<ExecutionState>) => void
  clearExecutionState: () => void
  setExecutionProgress: (progress: number) => void
  setExecutionError: (error: string) => void
  
  // Validation
  validateWorkflow: () => { isValid: boolean; errors: string[] }
  validateConnection: (sourceId: string, targetId: string) => boolean
  
  // Node interaction actions
  setShowPropertyPanel: (show: boolean) => void
  setPropertyPanelNode: (nodeId: string | null) => void
  showContextMenu: (nodeId: string, position: { x: number; y: number }) => void
  hideContextMenu: () => void
  openNodeProperties: (nodeId: string) => void
  closeNodeProperties: () => void
  
  // Error handling
  handleError: (error: unknown, operation: string, showToast?: (type: 'error' | 'warning', title: string, options?: any) => void) => void
  getWorkflowHealth: () => { score: number; issues: string[]; suggestions: string[] }
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
      
      // Title management state
      workflowTitle: '',
      isTitleDirty: false,
      titleValidationError: null,
      
      // Import/Export state
      isExporting: false,
      isImporting: false,
      importProgress: 0,
      exportProgress: 0,
      importError: null,
      exportError: null,
      
      // Execution state
      executionState: {
        status: 'idle',
        progress: 0,
        startTime: undefined,
        endTime: undefined,
        error: undefined,
        executionId: undefined
      },
      lastExecutionResult: null,
      
      // Node interaction state
      showPropertyPanel: false,
      propertyPanelNodeId: null,
      contextMenuVisible: false,
      contextMenuPosition: null,
      contextMenuNodeId: null,

      // Actions
      setWorkflow: (workflow) => {
        let processedWorkflow = workflow
        
        // Ensure workflow has proper metadata
        if (workflow) {
          processedWorkflow = ensureWorkflowMetadata(workflow)
        }
        
        const title = processedWorkflow?.metadata?.title || processedWorkflow?.name || ''
        set({ 
          workflow: processedWorkflow, 
          isDirty: false, 
          workflowTitle: title,
          isTitleDirty: false,
          titleValidationError: null,
          // Reset node interaction state when loading new workflow
          selectedNodeId: null,
          showPropertyPanel: false,
          propertyPanelNodeId: null,
          contextMenuVisible: false,
          contextMenuPosition: null,
          contextMenuNodeId: null
        })
        if (processedWorkflow) {
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
        
        // Clean up node interaction state if the removed node was selected
        const stateUpdates: any = { workflow: updated, isDirty: true, selectedNodeId: null }
        
        if (get().propertyPanelNodeId === nodeId) {
          stateUpdates.showPropertyPanel = false
          stateUpdates.propertyPanelNodeId = null
        }
        
        if (get().contextMenuNodeId === nodeId) {
          stateUpdates.contextMenuVisible = false
          stateUpdates.contextMenuNodeId = null
          stateUpdates.contextMenuPosition = null
        }
        
        set(stateUpdates)
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

      // Title management actions
      updateTitle: (title) => {
        const sanitized = get().sanitizeTitle(title)
        const validation = get().validateTitle(sanitized)
        
        set({ 
          workflowTitle: sanitized,
          isTitleDirty: true,
          titleValidationError: validation.error
        })
      },

      saveTitle: () => {
        const { workflowTitle, workflow, titleValidationError } = get()
        
        if (!workflow || titleValidationError) {
          return
        }

        // Update workflow title through metadata management
        const updated = updateWorkflowTitle(workflow, workflowTitle)
        set({ 
          workflow: updated, 
          isDirty: true,
          isTitleDirty: false 
        })
        get().saveToHistory(`Update title: ${workflowTitle}`)
      },

      setTitleDirty: (dirty) => {
        set({ isTitleDirty: dirty })
      },

      validateTitle: (title) => {
        const validationErrors = validateTitleUtil(title)
        
        if (validationErrors.length > 0) {
          return { isValid: false, error: validationErrors[0].message }
        }
        
        return { isValid: true, error: null }
      },

      sanitizeTitle: (title) => {
        // Remove leading/trailing whitespace
        let sanitized = title.trim()
        
        // Replace multiple consecutive spaces with single space
        sanitized = sanitized.replace(/\s+/g, ' ')
        
        // Remove or replace invalid characters
        sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        
        // Truncate if too long
        if (sanitized.length > 100) {
          sanitized = sanitized.substring(0, 100).trim()
        }
        
        return sanitized
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

      // Import/Export actions
      exportWorkflow: async () => {
        const { workflow } = get()
        if (!workflow) {
          set({ exportError: 'No workflow to export' })
          return
        }

        set({ 
          isExporting: true, 
          exportProgress: 0, 
          exportError: null 
        })

        try {
          // Simulate progress for user feedback
          set({ exportProgress: 25 })
          
          // Validate workflow before export
          const validation = get().validateWorkflow()
          if (!validation.isValid) {
            throw new Error(`Cannot export invalid workflow: ${validation.errors.join(', ')}`)
          }

          set({ exportProgress: 50 })

          // Export using the file service
          await workflowFileService.exportWorkflow(workflow)
          
          set({ exportProgress: 100 })
          
          // Clear progress after a short delay
          setTimeout(() => {
            set({ exportProgress: 0, isExporting: false })
          }, 1000)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown export error'
          set({ 
            exportError: errorMessage,
            isExporting: false,
            exportProgress: 0
          })
        }
      },

      importWorkflow: async (file: File) => {
        set({ 
          isImporting: true, 
          importProgress: 0, 
          importError: null 
        })

        try {
          // Validate file first
          set({ importProgress: 20 })
          const validation = await workflowFileService.validateWorkflowFile(file)
          
          if (!validation.isValid) {
            throw new Error(`Invalid workflow file: ${validation.errors.join(', ')}`)
          }

          // Show warnings if any
          if (validation.warnings.length > 0) {
            console.warn('Import warnings:', validation.warnings)
          }

          set({ importProgress: 50 })

          // Import the workflow
          const importedWorkflow = await workflowFileService.importWorkflow(file)
          
          set({ importProgress: 80 })

          // Check if current workflow has unsaved changes
          const { isDirty, isTitleDirty } = get()
          if (isDirty || isTitleDirty) {
            // In a real implementation, you might want to show a confirmation dialog
            // For now, we'll proceed with the import
            console.warn('Importing workflow will overwrite unsaved changes')
          }

          // Set the imported workflow
          get().setWorkflow(importedWorkflow)
          
          set({ importProgress: 100 })
          
          // Clear progress after a short delay
          setTimeout(() => {
            set({ importProgress: 0, isImporting: false })
          }, 1000)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown import error'
          set({ 
            importError: errorMessage,
            isImporting: false,
            importProgress: 0
          })
        }
      },

      validateImportFile: async (file: File) => {
        try {
          // First do basic file validation
          const basicValidation = validateImportFileUtil(file)
          if (basicValidation.length > 0) {
            return {
              isValid: false,
              errors: basicValidation.map(error => error.message),
              warnings: []
            }
          }

          // Then do content validation
          return await workflowFileService.validateWorkflowFile(file)
        } catch (error) {
          return {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Unknown validation error'],
            warnings: []
          }
        }
      },

      setImportProgress: (progress: number) => {
        set({ importProgress: Math.max(0, Math.min(100, progress)) })
      },

      setExportProgress: (progress: number) => {
        set({ exportProgress: Math.max(0, Math.min(100, progress)) })
      },

      clearImportExportErrors: () => {
        set({ 
          importError: null, 
          exportError: null 
        })
      },

      // Execution actions
      executeWorkflow: async () => {
        const { workflow, executionState } = get()
        
        if (!workflow) {
          get().setExecutionError('No workflow to execute')
          return
        }

        // Prevent multiple simultaneous executions
        if (executionState.status === 'running') {
          console.warn('Workflow is already executing')
          return
        }

        // Validate workflow before execution using enhanced validation
        const validation = validateWorkflowForExecution(workflow)
        if (!validation.isValid) {
          const errorMessage = `Cannot execute invalid workflow: ${validation.errors.map(e => e.message).join(', ')}`
          get().setExecutionError(errorMessage)
          return
        }

        // Log warnings if any
        if (validation.warnings.length > 0) {
          console.warn('Execution warnings:', validation.warnings.map(w => w.message))
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const startTime = Date.now()

        // Set initial execution state
        get().setExecutionState({
          status: 'running',
          progress: 0,
          startTime,
          endTime: undefined,
          error: undefined,
          executionId
        })

        try {
          // Simulate workflow execution with progress updates
          // In a real implementation, this would call the backend API
          
          // Phase 1: Initialize execution
          get().setExecutionProgress(10)
          await new Promise(resolve => setTimeout(resolve, 500))

          // Phase 2: Execute nodes sequentially
          const totalNodes = workflow.nodes.length
          for (let i = 0; i < totalNodes; i++) {
            const node = workflow.nodes[i]
            
            // Check if execution was cancelled
            const currentState = get().executionState
            if (currentState.status === 'cancelled') {
              throw new Error('Execution was cancelled by user')
            }

            // Simulate node execution
            const nodeProgress = 20 + (i / totalNodes) * 60 // 20% to 80%
            get().setExecutionProgress(nodeProgress)
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

            // Simulate occasional node failures for testing
            if (Math.random() < 0.05) { // 5% chance of failure
              throw new Error(`Node "${node.name}" failed during execution`)
            }
          }

          // Phase 3: Finalize execution
          get().setExecutionProgress(90)
          await new Promise(resolve => setTimeout(resolve, 300))

          const endTime = Date.now()
          const duration = endTime - startTime

          // Create execution result
          const executionResult: WorkflowExecutionResult = {
            executionId,
            workflowId: workflow.id,
            status: 'success',
            startTime,
            endTime,
            duration,
            nodeResults: workflow.nodes.map(node => ({
              nodeId: node.id,
              nodeName: node.name,
              status: 'success' as const,
              startTime: startTime + Math.random() * 1000,
              endTime: endTime - Math.random() * 500,
              duration: Math.random() * 1000 + 200,
              data: { result: `Output from ${node.name}` }
            }))
          }

          // Set final success state
          set({
            executionState: {
              status: 'success',
              progress: 100,
              startTime,
              endTime,
              error: undefined,
              executionId
            },
            lastExecutionResult: executionResult
          })

          // Save execution to history
          get().saveToHistory(`Execute workflow: ${workflow.name}`)

          // Clear execution state after a delay
          setTimeout(() => {
            get().clearExecutionState()
          }, 3000)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'
          const endTime = Date.now()
          
          // Create failed execution result
          const executionResult: WorkflowExecutionResult = {
            executionId,
            workflowId: workflow.id,
            status: 'error',
            startTime,
            endTime,
            duration: endTime - startTime,
            nodeResults: [],
            error: errorMessage
          }

          set({
            executionState: {
              status: 'error',
              progress: 0,
              startTime,
              endTime,
              error: errorMessage,
              executionId
            },
            lastExecutionResult: executionResult
          })
        }
      },

      stopExecution: async () => {
        const { executionState } = get()
        
        if (executionState.status !== 'running') {
          console.warn('No execution to stop')
          return
        }

        try {
          // In a real implementation, this would call the backend to cancel execution
          // For now, we'll just update the state
          
          const endTime = Date.now()
          const startTime = executionState.startTime || endTime
          
          // Create cancelled execution result
          const executionResult: WorkflowExecutionResult = {
            executionId: executionState.executionId || `cancelled_${Date.now()}`,
            workflowId: get().workflow?.id || '',
            status: 'cancelled',
            startTime,
            endTime,
            duration: endTime - startTime,
            nodeResults: [],
            error: 'Execution cancelled by user'
          }

          set({
            executionState: {
              status: 'cancelled',
              progress: 0,
              startTime,
              endTime,
              error: 'Execution cancelled by user',
              executionId: executionState.executionId
            },
            lastExecutionResult: executionResult
          })

          // Save cancellation to history
          get().saveToHistory('Cancel workflow execution')

          // Clear execution state after a delay
          setTimeout(() => {
            get().clearExecutionState()
          }, 2000)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to stop execution'
          get().setExecutionError(errorMessage)
        }
      },

      setExecutionState: (state: Partial<ExecutionState>) => {
        const currentState = get().executionState
        set({
          executionState: { ...currentState, ...state }
        })
      },

      clearExecutionState: () => {
        set({
          executionState: {
            status: 'idle',
            progress: 0,
            startTime: undefined,
            endTime: undefined,
            error: undefined,
            executionId: undefined
          }
        })
      },

      setExecutionProgress: (progress: number) => {
        const clampedProgress = Math.max(0, Math.min(100, progress))
        get().setExecutionState({ progress: clampedProgress })
      },

      setExecutionError: (error: string) => {
        const endTime = Date.now()
        const startTime = get().executionState.startTime || endTime
        
        set({
          executionState: {
            status: 'error',
            progress: 0,
            startTime,
            endTime,
            error,
            executionId: get().executionState.executionId
          }
        })
      },

      // Validation
      validateWorkflow: () => {
        const { workflow } = get()
        const workflowErrors = validateWorkflow(workflow)
        const metadataErrors = workflow ? validateMetadata(workflow.metadata) : []
        
        const allErrors = [...workflowErrors, ...metadataErrors]
        
        return {
          isValid: allErrors.length === 0,
          errors: allErrors.map(error => error.message)
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
      },

      // Node interaction actions
      setShowPropertyPanel: (show: boolean) => {
        set({ showPropertyPanel: show })
        if (!show) {
          set({ propertyPanelNodeId: null })
        }
      },

      setPropertyPanelNode: (nodeId: string | null) => {
        set({ 
          propertyPanelNodeId: nodeId,
          showPropertyPanel: nodeId !== null
        })
      },

      showContextMenu: (nodeId: string, position: { x: number; y: number }) => {
        set({
          contextMenuVisible: true,
          contextMenuNodeId: nodeId,
          contextMenuPosition: position,
          selectedNodeId: nodeId
        })
      },

      hideContextMenu: () => {
        set({
          contextMenuVisible: false,
          contextMenuNodeId: null,
          contextMenuPosition: null
        })
      },

      openNodeProperties: (nodeId: string) => {
        set({
          propertyPanelNodeId: nodeId,
          showPropertyPanel: true,
          selectedNodeId: nodeId
        })
        // Hide context menu if it's open
        get().hideContextMenu()
      },

      closeNodeProperties: () => {
        set({
          showPropertyPanel: false,
          propertyPanelNodeId: null
        })
      },

      // Error handling
      handleError: (error, operation, showToast) => {
        handleWorkflowError(error, operation, showToast)
      },

      getWorkflowHealth: () => {
        const { workflow } = get()
        const { getWorkflowHealthScore } = require('@/utils/workflowErrorHandling')
        return getWorkflowHealthScore(workflow)
      }
    }),
    { name: 'workflow-store' }
  )
)