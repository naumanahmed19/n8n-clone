import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useWorkflowStore } from '@/stores'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'
import React, { ReactNode, useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import { NodeContent } from '../components/NodeContent'
import { NodeContextMenu } from '../components/NodeContextMenu'
import { NodeHandles } from '../components/NodeHandles'
import { NodeToolbarContent } from '../components/NodeToolbarContent'
import { useNodeActions } from '../hooks/useNodeActions'
import { useNodeExecution } from '../hooks/useNodeExecution'
import '../node-animations.css'
import { getStatusIcon } from '../utils/nodeStyles'

export interface BaseNodeWrapperProps {
  /** Node ID */
  id: string
  
  /** Whether the node is selected */
  selected: boolean
  
  /** Node data */
  data: {
    label: string
    nodeType: string
    parameters: Record<string, any>
    disabled: boolean
    locked?: boolean
    status?: 'idle' | 'running' | 'success' | 'error' | 'skipped'
    executionResult?: any
    lastExecutionData?: any
    inputs?: string[]
    outputs?: string[]
    executionCapability?: 'trigger' | 'action' | 'transform' | 'condition'
  }
  
  /** Whether the node is read-only */
  isReadOnly?: boolean
  
  /** Whether the node is expanded */
  isExpanded: boolean
  
  /** Handler for expand/collapse toggle */
  onToggleExpand: () => void
  
  /** Icon component to display in header */
  Icon: LucideIcon
  
  /** Background color for the icon */
  iconColor?: string
  
  /** Width of the node when collapsed */
  collapsedWidth?: string
  
  /** Width of the node when expanded */
  expandedWidth?: string
  
  /** Content to display when collapsed */
  collapsedContent?: ReactNode
  
  /** Content to display when expanded */
  expandedContent?: ReactNode
  
  /** Additional info to show in header (e.g., "3 messages") */
  headerInfo?: string
  
  /** Custom content to render in the collapsed view (e.g., for CustomNode with icon and toolbar) */
  customContent?: ReactNode
  
  /** If no customContent, use default node rendering with these props */
  nodeConfig?: {
    icon?: string
    color?: string
    isTrigger?: boolean
    inputs?: string[]
    outputs?: string[]
    imageUrl?: string
  }
  
  /** Custom metadata to render below node (like NodeMetadata component) */
  customMetadata?: ReactNode
  
  /** Whether to show label below the node (like CustomNode) */
  showLabelBelow?: boolean
  
  /** Whether to enable expand/collapse functionality */
  canExpand?: boolean
  
  /** Custom class name for the wrapper */
  className?: string
  
  /** Whether to show input handle */
  showInputHandle?: boolean
  
  /** Whether to show output handle */
  showOutputHandle?: boolean
  
  /** Custom input handle color */
  inputHandleColor?: string
  
  /** Custom output handle color */
  outputHandleColor?: string
  
  /** Custom on double click handler - if not provided, will open properties dialog */
  onDoubleClick?: (e: React.MouseEvent) => void
  
  /** Toolbar options */
  toolbar?: {
    showToolbar?: boolean
    isExecuting?: boolean
    hasError?: boolean
    hasSuccess?: boolean
    executionError?: any
    workflowExecutionStatus?: string
    onExecute?: (nodeId: string, nodeType: string) => void
    onRetry?: (nodeId: string, nodeType: string) => void
    onToggleDisabled?: (nodeId: string, disabled: boolean) => void
  }
}

/**
 * Get border color and animation classes based on node status
 */
function getNodeStatusClasses(status?: string, selected?: boolean, disabled?: boolean): string {
  if (disabled) return 'border-gray-300'
  if (selected) return 'border-blue-500 ring-2 ring-blue-200'
  
  switch (status) {
    case 'running':
      return 'border-blue-300 node-running node-glow-running'
    case 'success':
      return 'border-green-300 node-success node-glow-success'
    case 'error':
      return 'border-red-300 node-error node-glow-error'
    case 'skipped':
      return 'border-gray-200'
    default:
      return 'border-gray-300'
  }
}

/**
 * BaseNodeWrapper - A generic wrapper component for creating expandable/collapsible 
 * interactive nodes in the workflow canvas.
 * 
 * Features:
 * - Expand/collapse functionality
 * - Context menu integration
 * - Input/output handles
 * - Customizable icon, colors, and content
 * - Consistent styling and behavior
 * 
 * @example
 * ```tsx
 * <BaseNodeWrapper
 *   id={id}
 *   selected={selected}
 *   data={data}
 *   isExpanded={isExpanded}
 *   onToggleExpand={handleToggleExpand}
 *   Icon={MessageCircle}
 *   iconColor="bg-blue-500"
 *   collapsedWidth="180px"
 *   expandedWidth="320px"
 *   headerInfo="5 messages"
 *   expandedContent={<YourCustomContent />}
 * />
 * ```
 */
export function BaseNodeWrapper({
  id,
  selected,
  data,
  isReadOnly = false,
  isExpanded,
  onToggleExpand,
  Icon,
  iconColor = 'bg-blue-500',
  collapsedWidth = '180px',
  expandedWidth = '320px',
  collapsedContent,
  expandedContent,
  headerInfo,
  className = '',
  showInputHandle = true,
  showOutputHandle = true,
  inputHandleColor = '!bg-blue-500',
  outputHandleColor = '!bg-green-500',
  onDoubleClick: customOnDoubleClick,
  customContent,
  customMetadata,
  showLabelBelow = false,
  canExpand = true,
  toolbar,
  nodeConfig,
}: BaseNodeWrapperProps) {
  // Use node actions hook for context menu functionality
  const {
    handleOpenProperties,
    handleExecuteFromContext,
    handleDuplicate,
    handleDelete,
    handleToggleLock,
    handleOutputClick,
    handleToggleDisabled
  } = useNodeActions(id)

  // Use execution hook for toolbar functionality
  const { 
    nodeExecutionState, 
    nodeVisualState,
    handleExecuteNode, 
    handleRetryNode 
  } = useNodeExecution(id, data.nodeType)
  
  // Get execution state from store for toolbar
  const { executionState } = useWorkflowStore()
  
  // Get status icon for default node rendering
  const statusIcon = getStatusIcon(nodeVisualState, nodeExecutionState, data.status)

  // Handle double-click to open properties dialog
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (customOnDoubleClick) {
      customOnDoubleClick(e)
    } else {
      handleOpenProperties()
    }
  }, [customOnDoubleClick, handleOpenProperties])

  // Handle expand/collapse toggle
  const handleToggleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand()
  }, [onToggleExpand])
  
  // Local state for tracking which output connector is hovered (for default rendering)
  const [hoveredOutput, setHoveredOutput] = React.useState<string | null>(null)

  // If customContent or nodeConfig is provided, render a compact node wrapper
  if (customContent || nodeConfig) {
    const isTrigger = nodeConfig?.isTrigger || false
    
    // Render default node content if customContent not provided
    const nodeContentToRender = customContent || (
      <div className={`p-3 relative ${isTrigger ? 'rounded-l-full rounded-r-none' : 'rounded-md'} w-16 h-16`}>
        {/* Handles */}
        {nodeConfig && (
          <NodeHandles
            inputs={nodeConfig.inputs}
            outputs={nodeConfig.outputs}
            disabled={data.disabled}
            isTrigger={isTrigger}
            hoveredOutput={hoveredOutput}
            onOutputMouseEnter={setHoveredOutput}
            onOutputMouseLeave={() => setHoveredOutput(null)}
            onOutputClick={handleOutputClick}
            readOnly={isReadOnly}
          />
        )}

        {/* Handles */}
        {nodeConfig && (
          <NodeHandles
            inputs={nodeConfig.inputs}
            outputs={nodeConfig.outputs}
            disabled={data.disabled}
            isTrigger={isTrigger}
            hoveredOutput={hoveredOutput}
            onOutputMouseEnter={setHoveredOutput}
            onOutputMouseLeave={() => setHoveredOutput(null)}
            onOutputClick={handleOutputClick}
            readOnly={isReadOnly}
          />
        )}

        {/* Node Content */}
        {nodeConfig && (
          <NodeContent
            icon={nodeConfig.icon}
            color={nodeConfig.color}
            nodeType={data.nodeType}
            disabled={data.disabled}
            isTrigger={isTrigger}
            statusIcon={statusIcon}
            imageUrl={nodeConfig.imageUrl}
          />
        )}
      </div>
    )
    
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative flex flex-col items-center">
            {showInputHandle && (
              <Handle
                type="target"
                position={Position.Left}
                id="input"
                className={`w-3 h-3 ${inputHandleColor} border-2 border-white`}
                isConnectable={!isReadOnly}
              />
            )}

            <div
              onDoubleClick={handleDoubleClick}
              className={`relative bg-white rounded-lg border-2 shadow-md transition-all duration-200 ${
                getNodeStatusClasses(data.status, selected, data.disabled)
              } ${className}`}
              style={{ width: collapsedWidth }}
            >
              {nodeContentToRender}
              
              {/* Node Toolbar - Optional */}
              {toolbar?.showToolbar && (
                <NodeToolbarContent
                  nodeId={id}
                  nodeType={data.nodeType}
                  nodeLabel={data.label}
                  disabled={data.disabled}
                  isExecuting={toolbar.isExecuting || false}
                  hasError={toolbar.hasError || false}
                  hasSuccess={toolbar.hasSuccess || false}
                  executionError={toolbar.executionError}
                  workflowExecutionStatus={toolbar.workflowExecutionStatus || 'idle'}
                  onExecute={toolbar.onExecute || (() => {})}
                  onRetry={toolbar.onRetry || (() => {})}
                  onToggleDisabled={toolbar.onToggleDisabled || (() => {})}
                />
              )}
            </div>

            {showLabelBelow && (
              <div className="mt-2 text-center max-w-[120px]">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {data.label}
                </div>
              </div>
            )}
            
            {customMetadata && (
              <div className="mt-2">
                {customMetadata}
              </div>
            )}

            {showOutputHandle && (
              <Handle
                type="source"
                position={Position.Right}
                id="main"
                className={`w-3 h-3 ${outputHandleColor} border-2 border-white`}
                isConnectable={!isReadOnly}
                onClick={(e) => handleOutputClick(e, 'main')}
              />
            )}
          </div>
        </ContextMenuTrigger>
        
        <NodeContextMenu
          onOpenProperties={handleOpenProperties}
          onExecute={handleExecuteFromContext}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
          isLocked={!!data.locked}
          readOnly={isReadOnly}
        />
      </ContextMenu>
    )
  }

  // Get inputs/outputs from data or use defaults
  const nodeInputs = data.inputs || (showInputHandle ? ['main'] : [])
  const nodeOutputs = data.outputs || (showOutputHandle ? ['main'] : [])
  const isTrigger = data.executionCapability === 'trigger'

  // Compact view (collapsed)
  if (!isExpanded) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative">
            <div
              onDoubleClick={handleDoubleClick}
              className={`relative bg-white rounded-lg border-2 shadow-md transition-all duration-200 ${
                getNodeStatusClasses(data.status, selected, data.disabled)
              } ${className}`}
              style={{ width: collapsedWidth }}
            >
              {/* Dynamic Handles */}
              <NodeHandles
                inputs={nodeInputs}
                outputs={nodeOutputs}
                disabled={data.disabled}
                isTrigger={isTrigger}
                hoveredOutput={hoveredOutput}
                onOutputMouseEnter={setHoveredOutput}
                onOutputMouseLeave={() => setHoveredOutput(null)}
                onOutputClick={handleOutputClick}
                readOnly={isReadOnly}
              />

              {/* Node Toolbar - Always show like CustomNode */}
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

              {/* Compact Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{data.label}</span>
                    {headerInfo && (
                      <span className="text-xs text-muted-foreground truncate">{headerInfo}</span>
                    )}
                  </div>
                </div>
                {canExpand && expandedContent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleToggleExpandClick}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Optional collapsed content */}
              {collapsedContent && (
                <div className="px-3 pb-3">
                  {collapsedContent}
                </div>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        
        <NodeContextMenu
          onOpenProperties={handleOpenProperties}
          onExecute={handleExecuteFromContext}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
          isLocked={!!data.locked}
          readOnly={isReadOnly}
        />
      </ContextMenu>
    )
  }

  // Expanded view
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">
          <div
            onDoubleClick={handleDoubleClick}
            className={`relative bg-white rounded-lg border-2 shadow-lg transition-all duration-200 ${
              getNodeStatusClasses(data.status, selected, data.disabled)
            } ${className}`}
            style={{ width: expandedWidth }}
          >
            {/* Dynamic Handles */}
            <NodeHandles
              inputs={nodeInputs}
              outputs={nodeOutputs}
              disabled={data.disabled}
              isTrigger={isTrigger}
              hoveredOutput={hoveredOutput}
              onOutputMouseEnter={setHoveredOutput}
              onOutputMouseLeave={() => setHoveredOutput(null)}
              onOutputClick={handleOutputClick}
              readOnly={isReadOnly}
            />

            {/* Node Toolbar - Always show like CustomNode */}
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

            {/* Expanded Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{data.label}</span>
                  {headerInfo && (
                    <span className="text-xs text-muted-foreground truncate">{headerInfo}</span>
                  )}
                </div>
              </div>
              {canExpand && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpandClick}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Expanded Content */}
            {expandedContent}
          </div>
        </div>
      </ContextMenuTrigger>
      
      <NodeContextMenu
        onOpenProperties={handleOpenProperties}
        onExecute={handleExecuteFromContext}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleLock={handleToggleLock}
        isLocked={!!data.locked}
        readOnly={isReadOnly}
      />
    </ContextMenu>
  )
}

BaseNodeWrapper.displayName = 'BaseNodeWrapper'
