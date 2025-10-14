/**
 * Types for toolbar button components
 */

export interface NodeExecutionState {
  nodeId: string
  status: 'idle' | 'running' | 'success' | 'error'
  startTime?: number
  endTime?: number
  error?: string
  result?: any
}

export interface ToolbarButtonBaseProps {
  nodeId: string
  className?: string
}

export interface NodeExecutionError {
  type: 'timeout' | 'network' | 'validation' | 'security' | 'server' | 'unknown'
  message: string
  userFriendlyMessage: string
  isRetryable: boolean
  retryAfter?: number
  timestamp: number
  details?: any
}

export interface ExecuteToolbarButtonProps extends ToolbarButtonBaseProps {
  nodeType: string
  isExecuting: boolean
  canExecute: boolean
  hasError?: boolean
  hasSuccess?: boolean
  executionError?: NodeExecutionError
  onExecute: (nodeId: string) => void
  onRetry?: (nodeId: string) => void
}

export interface DisableToggleToolbarButtonProps extends ToolbarButtonBaseProps {
  nodeLabel: string
  disabled: boolean
  onToggle: (nodeId: string, disabled: boolean) => void
}

export type NodeExecutionCapability = 'trigger' | 'action' | 'transform' | 'condition'

export interface NodeTypeMetadata {
  type: string
  group: string[]
  executionCapability: NodeExecutionCapability
  canExecuteIndividually: boolean
  canBeDisabled: boolean
}
