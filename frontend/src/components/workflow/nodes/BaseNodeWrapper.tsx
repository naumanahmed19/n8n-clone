import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyPasteStore, useReactFlowUIStore, useWorkflowStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import React, { ReactNode, useCallback } from 'react'
import { NodeContextMenu } from '../components/NodeContextMenu'
import { NodeHandles } from '../components/NodeHandles'
import { NodeHeader } from '../components/NodeHeader'
import { NodeIcon } from '../components/NodeIcon'
import { NodeToolbarContent } from '../components/NodeToolbarContent'
import { useNodeActions } from '../hooks/useNodeActions'
import { useNodeExecution } from '../hooks/useNodeExecution'
import '../node-animations.css'
import { getNodeStatusClasses } from '../utils/nodeStyleUtils'

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
  
  /** Icon component to display in header (optional if nodeConfig is provided) */
  Icon?: LucideIcon
  
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
    handleUngroup,
    handleOutputClick,
    handleToggleDisabled
  } = useNodeActions(id)

  // Get copy/paste functions from store
  const { copy, cut, paste, canCopy, canPaste } = useCopyPasteStore()
  
  // Import useReactFlow to check if node is in a group
  const { getNode } = useReactFlow()
  const currentNode = getNode(id)
  const isInGroup = !!currentNode?.parentId

  // Use execution hook for toolbar functionality
  const { 
    nodeExecutionState,
    handleExecuteNode, 
    handleRetryNode 
  } = useNodeExecution(id, data.nodeType)
  
  // Get execution state from store for toolbar
  const { executionState } = useWorkflowStore()
  
  // Get compact mode from UI store
  const { compactMode } = useReactFlowUIStore()

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
  const handleToggleExpandClick = useCallback(() => {
    onToggleExpand()
  }, [onToggleExpand])
  
  // Local state for tracking which output connector is hovered (for default rendering)
  const [hoveredOutput, setHoveredOutput] = React.useState<string | null>(null)

  // Get inputs/outputs from data or use defaults
  const nodeInputs = data.inputs || (showInputHandle ? ['main'] : [])
  const nodeOutputs = data.outputs || (showOutputHandle ? ['main'] : [])
  const isTrigger = data.executionCapability === 'trigger'

  // Calculate node width based on compact mode
  const effectiveCollapsedWidth = compactMode ? 'auto' : collapsedWidth
  const effectiveExpandedWidth = compactMode ? '280px' : expandedWidth

  // Compact view (collapsed)
  if (!isExpanded) {
    // Wrap with tooltip when in compact mode
    if (compactMode) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="relative">
                    <div
                      onDoubleClick={handleDoubleClick}
                      className={`relative bg-card rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
                        getNodeStatusClasses(data.status, selected, data.disabled)
                      } ${className}`}
                      style={{ width: effectiveCollapsedWidth }}
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

                      {/* Render custom content or NodeContent with icon, or default header */}
                      {customContent ? (
                        customContent
                      ) : nodeConfig ? (
                        <div className={`flex items-center ${compactMode ? 'justify-center gap-0 p-2' : 'gap-2 p-3'}`}>
                          <NodeIcon 
                            config={nodeConfig}
                            isExecuting={nodeExecutionState.isExecuting}
                          />
                          {!compactMode && (
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium truncate">{data.label}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Compact Header */}
                          <NodeHeader
                            label={data.label}
                            headerInfo={headerInfo}
                            icon={Icon ? { Icon, iconColor } : undefined}
                            isExpanded={false}
                            canExpand={canExpand && !!expandedContent}
                            onToggleExpand={handleToggleExpandClick}
                            isExecuting={nodeExecutionState.isExecuting}
                          />
                          
                          {/* Optional collapsed content */}
                          {collapsedContent && (
                            <div className="px-3 pb-3">
                              {collapsedContent}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Custom metadata below node (e.g., NodeMetadata component) */}
                    {customMetadata && (
                      <div className="mt-1">
                        {customMetadata}
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>
                
                <NodeContextMenu
                  onOpenProperties={handleOpenProperties}
                  onExecute={handleExecuteFromContext}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onToggleLock={handleToggleLock}
                  onCopy={copy || undefined}
                  onCut={cut || undefined}
                  onPaste={paste || undefined}
                  onUngroup={isInGroup ? handleUngroup : undefined}
                  isLocked={!!data.locked}
                  readOnly={isReadOnly}
                  canCopy={canCopy}
                  canPaste={canPaste}
                  isInGroup={isInGroup}
                />
              </ContextMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium">{data.label}</p>
            {headerInfo && (
              <p className="text-xs text-muted-foreground">{headerInfo}</p>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    // No compact mode - return without tooltip
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative">
            <div
              onDoubleClick={handleDoubleClick}
              className={`relative bg-card rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
                getNodeStatusClasses(data.status, selected, data.disabled)
              } ${className}`}
              style={{ width: effectiveCollapsedWidth }}
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

              {/* Render custom content or NodeContent with icon, or default header */}
              {customContent ? (
                customContent
              ) : nodeConfig ? (
                <div className={`flex items-center ${compactMode ? 'justify-center gap-0 p-2' : 'gap-2 p-3'}`}>
                  <NodeIcon 
                    config={nodeConfig}
                    isExecuting={nodeExecutionState.isExecuting}
                  />
                  {!compactMode && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">{data.label}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Compact Header */}
                  <NodeHeader
                    label={data.label}
                    headerInfo={headerInfo}
                    icon={Icon ? { Icon, iconColor } : undefined}
                    isExpanded={false}
                    canExpand={canExpand && !!expandedContent}
                    onToggleExpand={handleToggleExpandClick}
                    isExecuting={nodeExecutionState.isExecuting}
                  />
                  
                  {/* Optional collapsed content */}
                  {collapsedContent && (
                    <div className="px-3 pb-3">
                      {collapsedContent}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Custom metadata below node (e.g., NodeMetadata component) */}
            {customMetadata && (
              <div className="mt-1">
                {customMetadata}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        
        <NodeContextMenu
          onOpenProperties={handleOpenProperties}
          onExecute={handleExecuteFromContext}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
          onCopy={copy || undefined}
          onCut={cut || undefined}
          onPaste={paste || undefined}
          onUngroup={isInGroup ? handleUngroup : undefined}
          isLocked={!!data.locked}
          readOnly={isReadOnly}
          canCopy={canCopy}
          canPaste={canPaste}
          isInGroup={isInGroup}
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
            className={`relative bg-card rounded-lg border shadow-lg transition-all duration-200 hover:shadow-xl ${
              getNodeStatusClasses(data.status, selected, data.disabled)
            } ${className}`}
            style={{ width: effectiveExpandedWidth }}
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
            <NodeHeader
              label={data.label}
              headerInfo={headerInfo}
              icon={Icon ? { Icon, iconColor } : undefined}
              isExpanded={true}
              canExpand={canExpand}
              onToggleExpand={handleToggleExpandClick}
              showBorder={true}
              isExecuting={nodeExecutionState.isExecuting}
            />

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
        onCopy={copy || undefined}
        onCut={cut || undefined}
        onPaste={paste || undefined}
        onUngroup={isInGroup ? handleUngroup : undefined}
        isLocked={!!data.locked}
        readOnly={isReadOnly}
        canCopy={canCopy}
        canPaste={canPaste}
        isInGroup={isInGroup}
      />
    </ContextMenu>
  )
}

BaseNodeWrapper.displayName = 'BaseNodeWrapper'
