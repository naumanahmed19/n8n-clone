import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { isTriggerNode } from '@/utils/nodeTypeClassification'
import { clsx } from 'clsx'
import { useState } from 'react'
import { NodeProps } from 'reactflow'
import { NodeContent } from './components/NodeContent'
import { NodeContextMenu } from './components/NodeContextMenu'
import { NodeHandles } from './components/NodeHandles'
import { NodeMetadata } from './components/NodeMetadata'
import { NodeToolbarContent } from './components/NodeToolbarContent'
import { useNodeActions } from './hooks/useNodeActions'
import { useNodeExecution } from './hooks/useNodeExecution'
import './node-animations.css'
import { getAnimationClasses, getNodeColor, getStatusIcon } from './utils/nodeStyles'

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
  // Use custom hooks
  const { 
    nodeExecutionState, 
    executionState, 
    nodeVisualState, 
    handleExecuteNode, 
    handleRetryNode 
  } = useNodeExecution(id, data.nodeType)
  
  const {
    handleToggleDisabled,
    handleOpenProperties,
    handleExecuteFromContext,
    handleDuplicate,
    handleDelete,
    handleOutputClick
  } = useNodeActions(id)

  // Local state for tracking which output connector is hovered
  const [hoveredOutput, setHoveredOutput] = useState<string | null>(null)

  // Check if this is a trigger node
  const isTrigger = isTriggerNode(data.nodeType)

  // Get styling
  const statusIcon = getStatusIcon(nodeVisualState, nodeExecutionState, data.status)
  const nodeColor = getNodeColor(data.disabled, selected, nodeVisualState, nodeExecutionState, data.status)
  const animationClasses = getAnimationClasses(nodeVisualState)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex flex-col items-center">
          {/* Main Node Container */}
          <div
            className={clsx(
              'p-3 shadow-md border-2 transition-all duration-200 relative',
              isTrigger 
                ? 'rounded-l-full rounded-r-none w-16 h-16' 
                : 'rounded-md w-16 h-16',
              nodeColor,
              animationClasses,
              data.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Handles */}
            <NodeHandles
              inputs={data.inputs}
              outputs={data.outputs}
              disabled={data.disabled}
              isTrigger={isTrigger}
              hoveredOutput={hoveredOutput}
              onOutputMouseEnter={setHoveredOutput}
              onOutputMouseLeave={() => setHoveredOutput(null)}
              onOutputClick={handleOutputClick}
            />

            {/* Node Content */}
            <NodeContent
              icon={data.icon}
              color={data.color}
              nodeType={data.nodeType}
              disabled={data.disabled}
              isTrigger={isTrigger}
              statusIcon={statusIcon}
              imageUrl={data.parameters?.imageUrl as string}
            />

            {/* Node Toolbar */}
            <NodeToolbarContent
              nodeId={id}
              nodeType={data.nodeType}
              nodeLabel={data.label}
              disabled={data.disabled}
              isExecuting={nodeExecutionState.isExecuting}
              hasError={nodeExecutionState.hasError}
              hasSuccess={nodeExecutionState.hasSuccess}
              executionError={nodeExecutionState.executionError}
              workflowExecutionStatus={executionState.status}
              onExecute={handleExecuteNode}
              onRetry={handleRetryNode}
              onToggleDisabled={handleToggleDisabled}
            />
          </div>

          {/* Node Metadata */}
          <NodeMetadata
            label={data.label}
            nodeVisualState={nodeVisualState}
          />
        </div>
      </ContextMenuTrigger>
      
      <NodeContextMenu
        onOpenProperties={handleOpenProperties}
        onExecute={handleExecuteFromContext}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    </ContextMenu>
  )
}