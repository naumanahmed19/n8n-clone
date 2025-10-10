import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'
import { NodeIcon } from './NodeIcon'

interface NodeHeaderProps {
  /** Node label text */
  label: string
  /** Optional additional info (e.g., "5 messages") */
  headerInfo?: string
  /** Icon configuration */
  icon?: {
    /** Lucide icon component */
    Icon?: LucideIcon
    /** Icon background color */
    iconColor?: string
    /** Node config for icon rendering */
    config?: {
      icon?: string
      color?: string
      isTrigger?: boolean
      imageUrl?: string
    }
  }
  /** Whether the node is in expanded state */
  isExpanded?: boolean
  /** Whether the node can be expanded/collapsed */
  canExpand?: boolean
  /** Callback when expand/collapse is clicked */
  onToggleExpand?: () => void
  /** Whether to show a border at the bottom */
  showBorder?: boolean
  /** Whether the node is currently executing */
  isExecuting?: boolean
}

/**
 * NodeHeader - A reusable header component for nodes
 * 
 * Displays the node icon, label, optional info, and expand/collapse button.
 * Can be used in both collapsed and expanded states.
 * 
 * @example
 * ```tsx
 * <NodeHeader
 *   label="My Node"
 *   headerInfo="5 items"
 *   icon={{ Icon: MessageCircle, iconColor: 'bg-blue-500' }}
 *   isExpanded={true}
 *   canExpand={true}
 *   onToggleExpand={() => setExpanded(!expanded)}
 *   showBorder={true}
 * />
 * ```
 */
export function NodeHeader({
  label,
  headerInfo,
  icon,
  isExpanded = false,
  canExpand = true,
  onToggleExpand,
  showBorder = false,
  isExecuting = false
}: NodeHeaderProps) {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand?.()
  }
  
  return (
    <div className={`flex items-center justify-between p-3 ${showBorder ? 'border-b' : ''}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Icon Component */}
        {icon && (
          <NodeIcon 
            Icon={icon.Icon}
            iconColor={icon.iconColor}
            config={icon.config}
            isExecuting={isExecuting}
          />
        )}
        
        {/* Label Section */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{label}</span>
          {headerInfo && (
            <span className="text-xs text-muted-foreground truncate">
              {headerInfo}
            </span>
          )}
        </div>
      </div>
      
      {/* Expand/Collapse Button */}
      {canExpand && onToggleExpand && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleClick}
          className="h-8 w-8 p-0 flex-shrink-0"
          aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  )
}

NodeHeader.displayName = 'NodeHeader'
