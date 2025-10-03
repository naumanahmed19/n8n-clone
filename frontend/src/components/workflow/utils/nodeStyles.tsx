import { NodeExecutionStatus } from '@/types/execution'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { ReactNode } from 'react'

interface NodeExecutionState {
  isExecuting: boolean
  hasError: boolean
  hasSuccess: boolean
}

interface NodeVisualState {
  status: NodeExecutionStatus
}

export function getStatusIcon(
  nodeVisualState: NodeVisualState | undefined,
  nodeExecutionState: NodeExecutionState,
  dataStatus?: string
): ReactNode {
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

  // Fallback to real-time execution state
  if (nodeExecutionState.isExecuting) {
    return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
  }
  if (nodeExecutionState.hasSuccess) {
    return <CheckCircle className="w-3 h-3 text-green-500" />
  }
  if (nodeExecutionState.hasError) {
    return <AlertCircle className="w-3 h-3 text-red-500" />
  }
  
  // Fallback to data.status
  switch (dataStatus) {
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

export function getNodeColor(
  disabled: boolean,
  selected: boolean,
  nodeVisualState: NodeVisualState | undefined,
  nodeExecutionState: NodeExecutionState,
  dataStatus?: string
): string {
  if (disabled) return 'bg-gray-100 border-gray-300 text-gray-500'
  if (selected) return 'bg-blue-50 border-blue-500'
  
  // Prioritize flow execution visual state
  if (nodeVisualState && nodeVisualState.status !== NodeExecutionStatus.IDLE) {
    switch (nodeVisualState.status) {
      case NodeExecutionStatus.QUEUED:
        return 'bg-yellow-50 border-yellow-300'
      case NodeExecutionStatus.RUNNING:
        return 'bg-blue-50 border-blue-300'
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
  
  // Fallback to real-time execution state
  if (nodeExecutionState.isExecuting) {
    return 'bg-blue-50 border-blue-300'
  }
  if (nodeExecutionState.hasSuccess) {
    return 'bg-green-50 border-green-300'
  }
  if (nodeExecutionState.hasError) {
    return 'bg-red-50 border-red-300'
  }
  
  // Fallback to data.status
  switch (dataStatus) {
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

export function getAnimationClasses(nodeVisualState: NodeVisualState | undefined): string {
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
