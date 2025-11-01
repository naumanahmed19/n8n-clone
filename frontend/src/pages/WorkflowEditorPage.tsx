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
import { useAuthStore, useNodeTypes, useWorkflowStore } from '@/stores'
import { Workflow } from '@/types'
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
    setExecutionMode,
    setNodeExecutionResult,
    clearExecutionState
  } = useWorkflowStore()
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  // Use global node types store instead of local state
  const { activeNodeTypes: nodeTypes, isLoading: isLoadingNodeTypes, fetchNodeTypes } = useNodeTypes()
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

    let isSubscribed = false;
    let subscriptionAttempts = 0;
    const maxAttempts = 3;

    // Subscribe to workflow updates with retry logic
    const subscribeToWorkflow = async () => {
      try {
        subscriptionAttempts++;
        console.log(`[WorkflowEditor] Subscription attempt ${subscriptionAttempts} for workflow:`, id)

        await socketService.subscribeToWorkflow(id)
        isSubscribed = true;
        console.log('[WorkflowEditor] ✅ Successfully subscribed to workflow:', id)
      } catch (error) {
        console.error('[WorkflowEditor] Failed to subscribe to workflow:', error)

        // Retry if not at max attempts
        if (subscriptionAttempts < maxAttempts) {
          console.log(`[WorkflowEditor] Retrying subscription in 1 second...`)
          setTimeout(subscribeToWorkflow, 1000)
        }
      }
    }

    // Initial subscription
    subscribeToWorkflow()

    // Also re-subscribe when socket reconnects
    const handleSocketConnected = () => {
      console.log('[WorkflowEditor] Socket reconnected, re-subscribing to workflow:', id)
      subscribeToWorkflow()
    }

    socketService.on('socket-connected', handleSocketConnected)

    // NOTE: Execution events are now handled by the workflow store via ExecutionWebSocket
    // We don't need duplicate listeners here - the store will update and trigger re-renders

    // Listen for webhook test triggers and auto-subscribe to execution
    const handleWebhookTestTriggered = async (data: any) => {
      try {
        await socketService.subscribeToExecution(data.executionId)
      } catch (error) {
        console.error('Failed to subscribe to webhook execution:', error)
      }
    }

    socketService.on('webhook-test-triggered', handleWebhookTestTriggered)

    // Cleanup: unsubscribe and remove listeners when component unmounts or workflow changes
    return () => {
      // Only unsubscribe if we actually subscribed
      if (isSubscribed) {
        console.log('[WorkflowEditor] Unsubscribing from workflow:', id)

        // Unsubscribe from workflow (async but don't wait)
        socketService.unsubscribeFromWorkflow(id).catch(error => {
          console.error('[WorkflowEditor] Failed to unsubscribe from workflow:', error)
        })
      }

      // Remove event listeners
      socketService.off('webhook-test-triggered', handleWebhookTestTriggered)
      socketService.off('socket-connected', handleSocketConnected)
    }
  }, [id])

  // Initialize node types store
  useEffect(() => {
    if (nodeTypes.length === 0 && !isLoadingNodeTypes) {
      fetchNodeTypes()
    }
  }, [nodeTypes.length, isLoadingNodeTypes, fetchNodeTypes])

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
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">
            {isLoadingExecution ? 'Loading execution...' : isLoadingNodeTypes ? 'Loading node types...' : 'Loading workflow...'}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Workflow</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Workflow Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested workflow could not be found.</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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
              onBack={() => navigate(`/workflows/${id}`, { replace: true })}
            />
          ) : (
            <WorkflowToolbar
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
