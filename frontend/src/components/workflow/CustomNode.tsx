
import { Handle, Position, NodeProps, NodeToolbar } from 'reactflow'
import { clsx } from 'clsx'
import { Pause, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { ExecuteToolbarButton } from './ExecuteToolbarButton'
import { DisableToggleToolbarButton } from './DisableToggleToolbarButton'
import { 
  shouldShowExecuteButton, 
  shouldShowDisableButton,
  canNodeExecuteIndividually 
} from '@/utils/nodeTypeClassification'
import { useWorkflowStore } from '@/stores/workflow'
import { createNodeExecutionError, logExecutionError } from '@/utils/errorHandling'
import type { NodeExecutionError } from './types'
import { useEffect, useState } from 'react'

interface CustomNodeData {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  status?: 'idle' | 'running' | 'success' | 'error'
  icon?: string
  color?: string
  // Additional properties for node toolbar
  nodeGroup?: string[]
  canExecuteIndividually?: boolean
  executionResult?: any
  isExecuting?: boolean
  hasError?: boolean
}

export function CustomNode({ data, selected, id }: NodeProps<CustomNodeData>) {
  // Get workflow store state and methods
  const executeNode = useWorkflowStore(state => state.executeNode)
  const updateNode = useWorkflowStore(state => state.updateNode)
  const executionState = useWorkflowStore(state => state.executionState)
  const getNodeExecutionResult = useWorkflowStore(state => state.getNodeExecutionResult)
  
  // Local state for node execution feedback
  const [nodeExecutionState, setNodeExecutionState] = useState<{
    isExecuting: boolean
    hasError: boolean
    hasSuccess: boolean
    lastExecutionTime?: number
    executionError?: NodeExecutionError
  }>({
    isExecuting: false,
    hasError: false,
    hasSuccess: false
  })

  // Get real-time execution result for this node
  const nodeExecutionResult = getNodeExecutionResult(id)

  // Update local state based on execution results
  useEffect(() => {
    if (nodeExecutionResult) {
      // Check if node is currently executing (same start and end time, or no end time yet)
      const isExecuting = nodeExecutionResult.status === 'success' && 
                         (nodeExecutionResult.endTime === nodeExecutionResult.startTime || 
                          !nodeExecutionResult.endTime)
      const hasError = nodeExecutionResult.status === 'error'
      const hasSuccess = nodeExecutionResult.status === 'success' && 
                        nodeExecutionResult.endTime && 
                        nodeExecutionResult.endTime > nodeExecutionResult.startTime

      // Create user-friendly error object if there's an error
      let executionError: NodeExecutionError | undefined
      if (hasError && nodeExecutionResult.error) {
        executionError = createNodeExecutionError(
          nodeExecutionResult.error,
          id,
          data.nodeType
        )
        
        // Log the error for debugging
        logExecutionError(id, data.nodeType, executionError, nodeExecutionResult.error)
      }

      setNodeExecutionState({
        isExecuting,
        hasError,
        hasSuccess,
        lastExecutionTime: nodeExecutionResult.endTime,
        executionError
      })

      // Clear success state after 3 seconds
      if (hasSuccess) {
        const timer = setTimeout(() => {
          setNodeExecutionState(prev => ({ ...prev, hasSuccess: false }))
        }, 3000)
        return () => clearTimeout(timer)
      }
    } else {
      // Reset state if no execution result
      setNodeExecutionState({
        isExecuting: false,
        hasError: false,
        hasSuccess: false
      })
    }
  }, [nodeExecutionResult, id, data.nodeType])

  // Handler for execute button - now connects to real execution
  const handleExecuteNode = async (nodeId: string) => {
    // Prevent execution during workflow execution
    if (executionState.status === 'running') {
      console.warn('Cannot execute individual node while workflow is running')
      return
    }

    // Set executing state immediately for UI feedback
    setNodeExecutionState(prev => ({ 
      ...prev, 
      isExecuting: true, 
      hasError: false, 
      hasSuccess: false,
      executionError: undefined
    }))

    try {
      await executeNode(nodeId)
    } catch (error) {
      console.error('Failed to execute node:', error)
      
      // Create user-friendly error object
      const executionError = createNodeExecutionError(error, nodeId, data.nodeType)
      
      // Log the error for debugging
      logExecutionError(nodeId, data.nodeType, executionError, error)
      
      setNodeExecutionState(prev => ({ 
        ...prev, 
        isExecuting: false, 
        hasError: true,
        executionError
      }))
    }
  }

  // Handler for retry button
  const handleRetryNode = async (nodeId: string) => {
    // Same as execute, but clear previous error state
    await handleExecuteNode(nodeId)
  }

  // Handler for disable/enable toggle - connects to workflow store
  const handleToggleDisabled = (nodeId: string, disabled: boolean) => {
    updateNode(nodeId, { disabled })
  }

  const getStatusIcon = () => {
    // Prioritize real-time execution state over data.status
    if (nodeExecutionState.isExecuting) {
      return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
    }
    if (nodeExecutionState.hasSuccess) {
      return <CheckCircle className="w-3 h-3 text-green-500" />
    }
    if (nodeExecutionState.hasError) {
      return <AlertCircle className="w-3 h-3 text-red-500" />
    }
    
    // Fallback to data.status for workflow-level execution
    switch (data.status) {
      case 'running':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getNodeColor = () => {
    if (data.disabled) return 'bg-gray-100 border-gray-300 text-gray-500'
    if (selected) return 'bg-blue-50 border-blue-500'
    
    // Prioritize real-time execution state over data.status
    if (nodeExecutionState.isExecuting) {
      return 'bg-blue-50 border-blue-300'
    }
    if (nodeExecutionState.hasSuccess) {
      return 'bg-green-50 border-green-300'
    }
    if (nodeExecutionState.hasError) {
      return 'bg-red-50 border-red-300'
    }
    
    // Fallback to data.status for workflow-level execution
    switch (data.status) {
      case 'running':
        return 'bg-blue-50 border-blue-300'
      case 'success':
        return 'bg-green-50 border-green-300'
      case 'error':
        return 'bg-red-50 border-red-300'
      default:
        return 'bg-white border-gray-300 hover:border-gray-400'
    }
  }

  return (
    <div
      className={clsx(
        'px-4 py-2 shadow-md rounded-md border-2 min-w-[150px] transition-all duration-200',
        getNodeColor(),
        data.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={clsx(
          "w-3 h-3 border-2 border-white",
          data.disabled ? "!bg-gray-300" : "!bg-gray-400"
        )}
      />

      {/* Node content */}
      <div className="flex items-center space-x-2">
        {/* Node icon */}
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: data.color || '#666' }}
        >
          {data.icon || data.nodeType.charAt(0).toUpperCase()}
        </div>

        {/* Node label */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {data.nodeType}
          </div>
        </div>

        {/* Status icon */}
        {getStatusIcon()}
      </div>

      {/* Disabled overlay */}
      {data.disabled && (
        <div className="absolute top-1 right-1" data-testid="disabled-overlay">
          <Pause className="w-3 h-3 text-gray-400" />
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={clsx(
          "w-3 h-3 border-2 border-white",
          data.disabled ? "!bg-gray-300" : "!bg-gray-400"
        )}
      />

      {/* Node Toolbar - appears on hover */}
      <NodeToolbar
        isVisible={true} // Always allow toolbar to be shown on hover
        position={Position.Top}
        offset={10}
        align="center"
      >
        <div 
          className="flex gap-1" 
          role="toolbar" 
          aria-label={`Controls for ${data.label}`}
          aria-orientation="horizontal"
        >
          {/* Execute button - only for nodes that can be executed individually */}
          {shouldShowExecuteButton(data.nodeType) && (
            <ExecuteToolbarButton
              nodeId={id}
              nodeType={data.nodeType}
              isExecuting={nodeExecutionState.isExecuting}
              canExecute={
                canNodeExecuteIndividually(data.nodeType) && 
                !data.disabled && 
                executionState.status !== 'running' // Disable during workflow execution
              }
              hasError={nodeExecutionState.hasError}
              hasSuccess={nodeExecutionState.hasSuccess}
              executionError={nodeExecutionState.executionError}
              onExecute={handleExecuteNode}
              onRetry={handleRetryNode}
            />
          )}
          
          {/* Disable/Enable toggle button - for all nodes that can be disabled */}
          {shouldShowDisableButton(data.nodeType) && (
            <DisableToggleToolbarButton
              nodeId={id}
              nodeLabel={data.label}
              disabled={data.disabled}
              onToggle={handleToggleDisabled}
            />
          )}
        </div>
      </NodeToolbar>
    </div>
  )
}