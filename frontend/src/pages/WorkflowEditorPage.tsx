import { ExecutionToolbar, WorkflowEditorWrapper } from '@/components'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from '@/components/ui/tooltip'
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar'
import {
  useWorkflowOperations
} from '@/hooks/workflow'
import { workflowService } from '@/services'
import type { ExecutionDetails } from '@/services/execution'
import { executionService } from '@/services/execution'
import { socketService } from '@/services/socket'
import { useAuthStore, useWorkflowStore } from '@/stores'
import { NodeType, Workflow } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function WorkflowEditorPage() {
  const { id, executionId } = useParams<{ id: string; executionId?: string }>()
  const navigate = useNavigate()
  const { 
    workflow, 
    setWorkflow, 
    setLoading, 
    isLoading, 
    canUndo,
    canRedo,
    undo,
    redo,
    setExecutionMode,
    setNodeExecutionResult,
    clearExecutionState
  } = useWorkflowStore()
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([])
  const [isLoadingNodeTypes, setIsLoadingNodeTypes] = useState(true)
  const [execution, setExecution] = useState<ExecutionDetails | null>(null)
  const [isLoadingExecution, setIsLoadingExecution] = useState(false)
  
  // Workflow operations for toolbar
  const { 
    saveWorkflow,
  } = useWorkflowOperations()

  // Toolbar handlers
  const handleSave = async () => {
    await saveWorkflow()
  }

  // Subscribe to workflow socket events for real-time webhook execution updates
  useEffect(() => {
    if (!id || id === 'new') return

    console.log('[WorkflowEditor] Subscribing to workflow:', id)
    
    // Subscribe to workflow updates
    socketService.subscribeToWorkflow(id)

    // Listen for execution events
    const handleExecutionEvent = (event: any) => {
      console.log('🟢 [WorkflowEditor] Execution event received:', {
        type: event.type,
        executionId: event.executionId,
        nodeId: event.nodeId,
        status: event.status,
        timestamp: event.timestamp,
        data: event.data
      })
    }

    const handleExecutionProgress = (progress: any) => {
      console.log('🔵 [WorkflowEditor] Execution progress:', {
        executionId: progress.executionId,
        completedNodes: progress.completedNodes,
        totalNodes: progress.totalNodes,
        status: progress.status
      })
    }

    const handleNodeExecutionEvent = (nodeEvent: any) => {
      console.log('🟡 [WorkflowEditor] Node execution event:', {
        executionId: nodeEvent.executionId,
        nodeId: nodeEvent.nodeId,
        type: nodeEvent.type,
        status: nodeEvent.status
      })
    }

    const handleExecutionLog = (log: any) => {
      console.log('📝 [WorkflowEditor] Execution log:', log)
    }

    // Register event listeners
    socketService.on('execution-event', handleExecutionEvent)
    socketService.on('execution-progress', handleExecutionProgress)
    socketService.on('node-execution-event', handleNodeExecutionEvent)
    socketService.on('execution-log', handleExecutionLog)

    // Cleanup: unsubscribe and remove listeners when component unmounts or workflow changes
    return () => {
      console.log('[WorkflowEditor] Unsubscribing from workflow:', id)
      socketService.unsubscribeFromWorkflow(id)
      
      // Remove event listeners
      socketService.off('execution-event', handleExecutionEvent)
      socketService.off('execution-progress', handleExecutionProgress)
      socketService.off('node-execution-event', handleNodeExecutionEvent)
      socketService.off('execution-log', handleExecutionLog)
    }
  }, [id])

  // Load node types from backend
  useEffect(() => {
    const loadNodeTypes = async () => {
      try {
        setIsLoadingNodeTypes(true)
        const types = await workflowService.getNodeTypes()
        setNodeTypes(types)
      } catch (error) {
        console.error('Failed to load node types:', error)
        setError('Failed to load node types. Please refresh the page.')
      } finally {
        setIsLoadingNodeTypes(false)
      }
    }

    loadNodeTypes()
  }, [])

  // Load execution data if executionId is present
  useEffect(() => {
    if (!executionId) {
      // Clear execution mode when no executionId
      setExecutionMode(false)
      clearExecutionState()
      return
    }

    const loadExecutionData = async () => {
      try {
        setIsLoadingExecution(true)
        setError(null)

        // Get execution details
        const executionData = await executionService.getExecutionDetails(executionId)
        setExecution(executionData)

        // CRITICAL FIX: Use workflow snapshot from execution if available
        // This ensures we display the workflow state at the time of execution
        if (executionData.workflowSnapshot) {
          console.log('Using workflow snapshot from execution', {
            executionId,
            snapshotNodes: executionData.workflowSnapshot.nodes.length,
            snapshotConnections: executionData.workflowSnapshot.connections.length,
          })

          // Load the current workflow to get basic metadata (name, description, etc.)
          let workflowMetadata: any = null
          if (id && id !== 'new') {
            try {
              workflowMetadata = await workflowService.getWorkflow(id)
            } catch (err) {
              console.warn('Failed to load workflow metadata:', err)
            }
          }

          // Create workflow object with snapshot data
          const snapshotWorkflow: Workflow = {
            id: executionData.workflowId,
            name: workflowMetadata?.name || 'Workflow Snapshot',
            description: workflowMetadata?.description || 'Viewing execution snapshot',
            userId: user?.id || 'guest',
            nodes: executionData.workflowSnapshot.nodes,
            connections: executionData.workflowSnapshot.connections,
            settings: executionData.workflowSnapshot.settings || {
              timezone: 'UTC',
              saveDataErrorExecution: 'all',
              saveDataSuccessExecution: 'all',
              saveManualExecutions: true,
              callerPolicy: 'workflowsFromSameOwner',
            },
            active: workflowMetadata?.active !== undefined ? workflowMetadata.active : false,
            category: workflowMetadata?.category,
            tags: workflowMetadata?.tags || [],
            createdAt: workflowMetadata?.createdAt || new Date().toISOString(),
            updatedAt: workflowMetadata?.updatedAt || new Date().toISOString(),
          }

          // Set the snapshot workflow as current workflow
          setWorkflow(snapshotWorkflow)
        }

        // Set execution mode
        setExecutionMode(true, executionId)

        // Apply execution states to nodes
        if (executionData.nodeExecutions) {
          executionData.nodeExecutions.forEach((nodeExec) => {
            // Map status to expected type
            let status: 'success' | 'error' | 'skipped' = 'success'
            if (nodeExec.status === 'error') {
              status = 'error'
            } else if (nodeExec.status === 'running') {
              status = 'success'
            }
            
            // Calculate duration
            const startTime = nodeExec.startedAt ? new Date(nodeExec.startedAt).getTime() : Date.now()
            const endTime = nodeExec.finishedAt ? new Date(nodeExec.finishedAt).getTime() : Date.now()
            
            setNodeExecutionResult(nodeExec.nodeId, {
              nodeId: nodeExec.nodeId,
              nodeName: nodeExec.nodeId,
              status,
              data: nodeExec.outputData,
              error: nodeExec.error ? JSON.stringify(nodeExec.error) : undefined,
              startTime,
              endTime,
              duration: endTime - startTime,
            })
          })
        }

        setIsLoadingExecution(false)
      } catch (err) {
        console.error('Failed to load execution details:', err)
        setError('Failed to load execution details')
        setIsLoadingExecution(false)
      }
    }

    loadExecutionData()

    // Cleanup on unmount or when executionId changes
    return () => {
      if (!executionId) {
        setExecutionMode(false)
        clearExecutionState()
      }
    }
  }, [executionId, setExecutionMode, setNodeExecutionResult, clearExecutionState, setWorkflow, id, user?.id])

  useEffect(() => {
    const loadWorkflow = async () => {
      // Skip loading if we're in execution mode (executionId is present)
      // The execution effect will handle loading the workflow snapshot
      if (executionId) {
        return
      }

      if (!id) {
        // Create new workflow
        const newWorkflow: Workflow = {
          id: 'new',
          name: 'New Workflow',
          description: '',
          userId: user?.id || 'guest',
          nodes: [],
          connections: [],
          settings: {
            timezone: 'UTC',
            saveDataErrorExecution: 'all',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            callerPolicy: 'workflowsFromSameOwner'
          },
          active: false, // New workflows should be inactive by default
          category: undefined, // Explicitly set to undefined instead of leaving it unset
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setWorkflow(newWorkflow)
        return
      }

      if (id === 'new') {
        // Create new workflow
        const newWorkflow: Workflow = {
          id: 'new',
          name: 'New Workflow',
          description: '',
          userId: user?.id || 'guest',
          nodes: [],
          connections: [],
          settings: {
            timezone: 'UTC',
            saveDataErrorExecution: 'all',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            callerPolicy: 'workflowsFromSameOwner'
          },
          active: false, // New workflows should be inactive by default
          category: undefined, // Explicitly set to undefined instead of leaving it unset
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setWorkflow(newWorkflow)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const workflowData = await workflowService.getWorkflow(id)
        setWorkflow(workflowData)
      } catch (err) {
        console.error('Failed to load workflow:', err)
        setError('Failed to load workflow. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [id, executionId, setWorkflow, setLoading])

  if (isLoading || isLoadingNodeTypes || isLoadingExecution) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">
            {isLoadingExecution ? 'Loading execution...' : isLoadingNodeTypes ? 'Loading node types...' : 'Loading workflow...'}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Workflow</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Workflow Not Found</h2>
          <p className="text-gray-600 mb-4">The requested workflow could not be found.</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    )
  }


  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "356px",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
        {/* Show execution toolbar when in execution mode */}
        {executionId && execution ? (
          <ExecutionToolbar
            execution={execution}
            onBack={() =>  navigate(`/workflows/${id}`, { replace: true })}
          />
        ) : (
          <WorkflowToolbar
            canUndo={canUndo()}
            canRedo={canRedo()}
            onUndo={undo}
            onRedo={redo}
            onSave={handleSave}
          />
        )}
        
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <WorkflowEditorWrapper 
            nodeTypes={nodeTypes}
            readOnly={!!executionId}
            executionMode={!!executionId}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  )
}