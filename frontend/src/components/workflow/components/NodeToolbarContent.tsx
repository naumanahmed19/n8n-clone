import { canNodeExecuteIndividually, shouldShowDisableButton, shouldShowExecuteButton } from '@/utils/nodeTypeClassification'
import { memo } from 'react'
import { NodeToolbar, Position } from 'reactflow'
import { DisableToggleToolbarButton } from '../DisableToggleToolbarButton'
import { ExecuteToolbarButton } from '../ExecuteToolbarButton'
import type { NodeExecutionError } from '../types'

interface NodeToolbarContentProps {
  nodeId: string
  nodeType: string
  nodeLabel: string
  disabled: boolean
  isExecuting: boolean
  hasError: boolean
  hasSuccess: boolean
  executionError?: NodeExecutionError
  workflowExecutionStatus: string
  onExecute: (nodeId: string, nodeType: string) => void
  onRetry: (nodeId: string, nodeType: string) => void
  onToggleDisabled: (nodeId: string, disabled: boolean) => void
}

export const NodeToolbarContent = memo(function NodeToolbarContent({
  nodeId,
  nodeType,
  nodeLabel,
  disabled,
  isExecuting,
  hasError,
  hasSuccess,
  executionError,
  workflowExecutionStatus,
  onExecute,
  onRetry,
  onToggleDisabled
}: NodeToolbarContentProps) {
  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Top}
      offset={10}
      align="center"
    >
      <div 
        className="flex gap-1" 
        role="toolbar" 
        aria-label={`Controls for ${nodeLabel}`}
        aria-orientation="horizontal"
      >
        {/* Execute button */}
        {shouldShowExecuteButton(nodeType) && (
          <ExecuteToolbarButton
            nodeId={nodeId}
            nodeType={nodeType}
            isExecuting={isExecuting}
            canExecute={
              canNodeExecuteIndividually(nodeType) && 
              !disabled && 
              workflowExecutionStatus !== 'running'
            }
            hasError={hasError}
            hasSuccess={hasSuccess}
            executionError={executionError}
            onExecute={() => onExecute(nodeId, nodeType)}
            onRetry={() => onRetry(nodeId, nodeType)}
          />
        )}
        
        {/* Disable/Enable toggle button */}
        {shouldShowDisableButton(nodeType) && (
          <DisableToggleToolbarButton
            nodeId={nodeId}
            nodeLabel={nodeLabel}
            disabled={disabled}
            onToggle={onToggleDisabled}
          />
        )}
      </div>
    </NodeToolbar>
  )
})

NodeToolbarContent.displayName = 'NodeToolbarContent'
