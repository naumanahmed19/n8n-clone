import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useWorkflowStore } from '@/stores/workflow'
import { NodeExecutionStatus } from '@/types/execution'
import { createNodeExecutionError, logExecutionError } from '@/utils/errorHandling'
import {
  canNodeExecuteIndividually,
  isTriggerNode,
  shouldShowDisableButton,
  shouldShowExecuteButton
} from '@/utils/nodeTypeClassification'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle, Copy, Loader2, Pause, Play, Settings, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Handle, NodeProps, NodeToolbar, Position } from 'reactflow'
import { DisableToggleToolbarButton } from './DisableToggleToolbarButton'
import { ExecuteToolbarButton } from './ExecuteToolbarButton'
import './node-animations.css'
import type { NodeExecutionError } from './types'

interface CustomNodeData {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  status?: 'idle' | 'running' | 'success' | 'error'
  icon?: string
  color?: string
  // Node definition properties
  inputs?: string[]
  outputs?: string[]
  // Position and style properties
  position?: { x: number; y: number }
  dimensions?: { width: number; height: number }
  customStyle?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    shape?: 'rectangle' | 'circle' | 'diamond' | 'trigger'
    opacity?: number
  }
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
  const addNode = useWorkflowStore(state => state.addNode)
  const removeNode = useWorkflowStore(state => state.removeNode)
  const openNodeProperties = useWorkflowStore(state => state.openNodeProperties)
  const workflow = useWorkflowStore(state => state.workflow)
  const executionState = useWorkflowStore(state => state.executionState)
  const getNodeExecutionResult = useWorkflowStore(state => state.getNodeExecutionResult)
  const getNodeVisualState = useWorkflowStore(state => state.getNodeVisualState)
  
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

  // Get real-time execution result for this node - extract specific values to prevent infinite re-renders
  const nodeExecutionResult = getNodeExecutionResult(id)
  const nodeVisualState = getNodeVisualState(id)
  
  // Extract specific values that we actually care about for the useEffect
  const nodeStatus = nodeVisualState?.status
  const nodeErrorMessage = nodeVisualState?.errorMessage  
  const nodeExecutionTime = nodeVisualState?.executionTime
  const executionResultStatus = nodeExecutionResult?.status
  const executionResultError = nodeExecutionResult?.error
  const executionResultEndTime = nodeExecutionResult?.endTime

  // Update local state based on flow execution results
  useEffect(() => {
    // Prioritize flow execution state over legacy execution results
    if (nodeVisualState && nodeStatus !== NodeExecutionStatus.IDLE) {
      const isExecuting = nodeStatus === NodeExecutionStatus.RUNNING || 
                         nodeStatus === NodeExecutionStatus.QUEUED
      const hasError = nodeStatus === NodeExecutionStatus.FAILED
      const hasSuccess = nodeStatus === NodeExecutionStatus.COMPLETED

      // Create user-friendly error object if there's an error
      let executionError: NodeExecutionError | undefined
      if (hasError && nodeErrorMessage) {
        executionError = createNodeExecutionError(
          nodeErrorMessage,
          id,
          data.nodeType
        )
        
        // Log the error for debugging
        logExecutionError(id, data.nodeType, executionError, nodeErrorMessage)
      }

      setNodeExecutionState({
        isExecuting,
        hasError,
        hasSuccess: !!hasSuccess,
        lastExecutionTime: nodeExecutionTime,
        executionError
      })
    } else if (nodeExecutionResult) {
      // Fallback to legacy execution results
      const isExecuting = executionResultStatus === 'success' && 
                         (nodeExecutionResult.endTime === nodeExecutionResult.startTime || 
                          !nodeExecutionResult.endTime)
      const hasError = executionResultStatus === 'error'
      const hasSuccess = executionResultStatus === 'success' && 
                        nodeExecutionResult.endTime && 
                        nodeExecutionResult.endTime > nodeExecutionResult.startTime

      // Create user-friendly error object if there's an error
      let executionError: NodeExecutionError | undefined
      if (hasError && executionResultError) {
        executionError = createNodeExecutionError(
          executionResultError,
          id,
          data.nodeType
        )
        
        // Log the error for debugging
        logExecutionError(id, data.nodeType, executionError, executionResultError)
      }

      setNodeExecutionState({
        isExecuting,
        hasError,
        hasSuccess: !!hasSuccess,
        lastExecutionTime: executionResultEndTime,
        executionError
      })
    } else {
      // Reset state if no execution result
      setNodeExecutionState({
        isExecuting: false,
        hasError: false,
        hasSuccess: false
      })
    }
  }, [nodeStatus, nodeErrorMessage, nodeExecutionTime, executionResultStatus, executionResultError, executionResultEndTime, id, data.nodeType])

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
      // Determine execution mode based on node type
      // Trigger nodes execute the entire workflow from the toolbar
      // Other nodes execute individually
      const triggerNodeTypes = ['manual-trigger', 'webhook-trigger']
      const mode = triggerNodeTypes.includes(data.nodeType) ? 'workflow' : 'single'
      
      await executeNode(nodeId, undefined, mode)
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

  // Context menu handlers
  const handleContextMenuOpenProperties = () => {
    openNodeProperties(id)
  }

  const handleContextMenuExecuteNode = () => {
    executeNode(id, undefined, 'single')
  }

  const handleContextMenuDuplicate = () => {
    const nodeToClone = workflow?.nodes.find(n => n.id === id)
    if (nodeToClone) {
      const clonedNode = {
        ...nodeToClone,
        id: `node-${Date.now()}`,
        name: `${nodeToClone.name} (Copy)`,
        position: {
          x: nodeToClone.position.x + 50,
          y: nodeToClone.position.y + 50
        }
      }
      addNode(clonedNode)
    }
  }

  const handleContextMenuDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      removeNode(id)
    }
  }

  const getStatusIcon = () => {
    // Prioritize flow execution visual state
    if (nodeVisualState && nodeVisualState.status !== NodeExecutionStatus.IDLE) {
      switch (nodeVisualState.status) {
        case NodeExecutionStatus.QUEUED:
          return <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
        case NodeExecutionStatus.RUNNING:
          return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        case NodeExecutionStatus.COMPLETED:
          return <CheckCircle className="w-3 h-3 text-green-500" />
        case NodeExecutionStatus.FAILED:
          return <AlertCircle className="w-3 h-3 text-red-500" />
        case NodeExecutionStatus.CANCELLED:
          return <div className="w-3 h-3 rounded-full bg-gray-400" />
        case NodeExecutionStatus.SKIPPED:
          return <div className="w-3 h-3 rounded-full bg-gray-300" />
        default:
          return null
      }
    }

    // Fallback to real-time execution state over data.status
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
    
    // Prioritize flow execution visual state
    if (nodeVisualState && nodeVisualState.status !== NodeExecutionStatus.IDLE) {
      switch (nodeVisualState.status) {
        case NodeExecutionStatus.QUEUED:
          return 'bg-yellow-50 border-yellow-300 animate-pulse'
        case NodeExecutionStatus.RUNNING:
          return 'bg-blue-50 border-blue-300 animate-pulse'
        case NodeExecutionStatus.COMPLETED:
          return 'bg-green-50 border-green-300'
        case NodeExecutionStatus.FAILED:
          return 'bg-red-50 border-red-300'
        case NodeExecutionStatus.CANCELLED:
          return 'bg-gray-50 border-gray-300'
        case NodeExecutionStatus.SKIPPED:
          return 'bg-gray-50 border-gray-200'
        default:
          return 'bg-white border-gray-300 hover:border-gray-400'
      }
    }
    
    // Fallback to real-time execution state over data.status
    if (nodeExecutionState.isExecuting) {
      return 'bg-blue-50 border-blue-300 animate-pulse'
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

  const getAnimationClasses = () => {
    if (nodeVisualState) {
      switch (nodeVisualState.status) {
        case NodeExecutionStatus.QUEUED:
          return 'node-queued node-glow-queued'
        case NodeExecutionStatus.RUNNING:
          return 'node-running node-glow-running'
        case NodeExecutionStatus.COMPLETED:
          return 'node-success node-glow-success'
        case NodeExecutionStatus.FAILED:
          return 'node-error node-glow-error'
        default:
          return ''
      }
    }
    return ''
  }

  // Check if this is a trigger node to apply different styling
  const isTriggr = isTriggerNode(data.nodeType)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex flex-col items-center">
          {/* Main Node Container */}
          <div
            className={clsx(
              'p-3 shadow-md border-2 transition-all duration-200 relative',
              // Different shapes for trigger nodes - reverse D shape (semicircle on left)
              isTriggr 
                ? 'rounded-l-full rounded-r-none w-16 h-16' 
                : 'rounded-md w-16 h-16',
              getNodeColor(),
              getAnimationClasses(),
              data.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Input handles - render multiple if node has multiple inputs */}
            {data.inputs && data.inputs.length > 0 && (
              <>
                {data.inputs.map((input, index) => {
                  const totalInputs = data.inputs!.length
                  const isSingleInput = totalInputs === 1
                  
                  // For single input, center it. For multiple inputs, distribute them vertically
                  const top = isSingleInput 
                    ? '50%' 
                    : `${((index + 1) / (totalInputs + 1)) * 100}%`
                  
                  return (
                    <Handle
                      key={`input-${input}-${index}`}
                      id={input}
                      type="target"
                      position={Position.Left}
                      style={{
                        top,
                        transform: 'translateY(-50%)',
                        left: '-6px'
                      }}
                      className={clsx(
                        "w-3 h-3 border-2 border-white",
                        data.disabled ? "!bg-gray-300" : "!bg-gray-400"
                      )}
                    />
                  )
                })}
              </>
            )}

            {/* Node content - centered icon and status */}
            <div className="flex items-center justify-center h-full relative">
              {/* Node icon */}
              <div 
                className={clsx(
                  "w-8 h-8 flex items-center justify-center text-white text-sm font-bold",
                  // Keep trigger node icons rounded for better appearance in reverse D shape
                  isTriggr ? 'rounded-full' : 'rounded'
                )}
                style={{ backgroundColor: data.color || '#666' }}
              >
                {data.icon || data.nodeType.charAt(0).toUpperCase()}
              </div>

              {/* Status icon - positioned in top right corner */}
              {getStatusIcon() && (
                <div className="absolute -top-1 -right-1">
                  {getStatusIcon()}
                </div>
              )}
            </div>

            {/* Output handles - render multiple if node has multiple outputs */}
            {data.outputs && data.outputs.length > 0 && (
              <>
                {data.outputs.map((output, index) => {
                  const totalOutputs = data.outputs!.length
                  const isSingleOutput = totalOutputs === 1
                  
                  // For single output, center it. For multiple outputs, distribute them vertically
                  const top = isSingleOutput 
                    ? '50%' 
                    : `${((index + 1) / (totalOutputs + 1)) * 100}%`
                  
                  return (
                    <Handle
                      key={`output-${output}-${index}`}
                      id={output}
                      type="source"
                      position={Position.Right}
                      style={{
                        top,
                        transform: 'translateY(-50%)',
                        right: '-6px'
                      }}
                      className={clsx(
                        "w-3 h-3 border-2 border-white",
                        // Make trigger node handles more rounded
                        isTriggr ? "rounded-full" : "",
                        data.disabled ? "!bg-gray-300" : "!bg-gray-400"
                      )}
                    />
                  )
                })}
              </>
            )}

            {/* Disabled overlay */}
            {data.disabled && (
              <div className="absolute top-1 right-1" data-testid="disabled-overlay">
                <Pause className="w-3 h-3 text-gray-400" />
              </div>
            )}

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

          {/* Node label - below the node */}
          <div className="mt-2 text-center max-w-[120px]">
            <div className="text-xs font-medium text-gray-900 truncate">
              {data.label}
            </div>
          </div>

          {/* Progress bar for running nodes */}
          {nodeVisualState && 
           nodeVisualState.status === NodeExecutionStatus.RUNNING && 
           nodeVisualState.progress > 0 && (
            <div className="mt-2 w-full max-w-[120px]">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${nodeVisualState.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {nodeVisualState.progress}%
                {nodeVisualState.executionTime && (
                  <span className="ml-2">
                    {Math.round(nodeVisualState.executionTime / 1000)}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Execution time display for completed nodes */}
          {nodeVisualState && 
           nodeVisualState.status === NodeExecutionStatus.COMPLETED && 
           nodeVisualState.executionTime && (
            <div className="mt-1 text-xs text-gray-500 text-center">
              {Math.round(nodeVisualState.executionTime / 1000)}s
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={handleContextMenuOpenProperties}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Properties
        </ContextMenuItem>

        <ContextMenuItem
          onClick={handleContextMenuExecuteNode}
          className="cursor-pointer"
        >
          <Play className="mr-2 h-4 w-4" />
          Execute Node
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleContextMenuDuplicate}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>

        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={handleContextMenuDelete}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}