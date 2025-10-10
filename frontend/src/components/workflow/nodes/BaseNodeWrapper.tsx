import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'
import { ReactNode, useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import { NodeContextMenu } from '../components/NodeContextMenu'
import { useNodeActions } from '../hooks/useNodeActions'
import '../node-animations.css'

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
  expandedContent: ReactNode
  
  /** Additional info to show in header (e.g., "3 messages") */
  headerInfo?: string
  
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
}: BaseNodeWrapperProps) {
  // Use node actions hook for context menu functionality
  const {
    handleOpenProperties,
    handleExecuteFromContext,
    handleDuplicate,
    handleDelete,
    handleToggleLock,
    handleOutputClick
  } = useNodeActions(id)

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

  // Compact view (collapsed)
  if (!isExpanded) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative">
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpandClick}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Optional collapsed content */}
              {collapsedContent && (
                <div className="px-3 pb-3">
                  {collapsedContent}
                </div>
              )}
            </div>

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

  // Expanded view
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">
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
            className={`relative bg-white rounded-lg border-2 shadow-lg transition-all duration-200 ${
              getNodeStatusClasses(data.status, selected, data.disabled)
            } ${className}`}
            style={{ width: expandedWidth }}
          >
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
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleExpandClick}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>

            {/* Expanded Content */}
            {expandedContent}
          </div>

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

BaseNodeWrapper.displayName = 'BaseNodeWrapper'
