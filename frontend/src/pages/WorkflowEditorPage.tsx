import { WorkflowEditorWrapper, ExecutionToolbar } from '@/components'
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
import { executionService } from '@/services/execution'
import { useAuthStore, useWorkflowStore } from '@/stores'
import { NodeType, Workflow } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ExecutionDetails } from '@/services/execution'

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
  }, [executionId, setExecutionMode, setNodeExecutionResult, clearExecutionState])

  useEffect(() => {
    const loadWorkflow = async () => {
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
          active: true, // New workflows should be active by default
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
          active: true, // New workflows should be active by default
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
  }, [id, setWorkflow, setLoading])

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

  // Debug log
  console.log('WorkflowEditorPage render:', {
    executionId,
    hasExecution: !!execution,
    readOnly: !!executionId,
    executionMode: !!executionId
  })

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
            onBack={() => navigate(`/workflows/${id}`)}
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