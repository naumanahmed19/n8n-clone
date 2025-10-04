import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { useWorkflowStore } from '@/stores'
import { WorkflowNode } from '@/types/workflow'
import {
    ChevronDown,
    Clock,
    Globe,
    Hand,
    Loader2,
    Play,
    Zap
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface WorkflowExecuteButtonProps {
  onExecute?: (triggerNodeId?: string) => void
  disabled?: boolean
  className?: string
}

// Map trigger types to icons
const triggerIcons = {
  'manual-trigger': Hand,
  'webhook-trigger': Globe,
  'schedule-trigger': Clock,
  'cron-trigger': Clock,
  'timer-trigger': Clock,
  'workflow-called': Zap,
  default: Zap
}

// Map trigger types to display names
const triggerDisplayNames = {
  'manual-trigger': 'Manual Trigger',
  'webhook-trigger': 'Webhook Trigger', 
  'schedule-trigger': 'Schedule Trigger',
  'cron-trigger': 'Cron Trigger',
  'timer-trigger': 'Timer Trigger',
  'workflow-called': 'Called by Workflow',
  default: 'Trigger'
}

export function WorkflowExecuteButton({ 
  onExecute, 
  disabled = false,
  className = '' 
}: WorkflowExecuteButtonProps) {
  const { workflow, executionState } = useWorkflowStore()
  const [isExecuting, setIsExecuting] = useState(false)

  // Find all trigger nodes in the workflow
  const triggerNodes = useMemo(() => {
    if (!workflow?.nodes) return []
    
    return workflow.nodes.filter((node: WorkflowNode) => 
      node.type.includes('trigger') || 
      ['manual-trigger', 'webhook-trigger', 'schedule-trigger', 'cron-trigger', 'timer-trigger', 'workflow-called'].includes(node.type)
    )
  }, [workflow?.nodes])

  // Check if workflow is currently executing
  const isCurrentlyExecuting = executionState?.status === 'running' || isExecuting

  // Handle execution
  const handleExecute = async (triggerNodeId?: string) => {
    if (disabled || isCurrentlyExecuting || !onExecute) return
    
    try {
      setIsExecuting(true)
      await onExecute(triggerNodeId)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  // Get icon for trigger type
  const getTriggerIcon = (triggerType: string) => {
    const IconComponent = triggerIcons[triggerType as keyof typeof triggerIcons] || triggerIcons.default
    return IconComponent
  }

  // Get display name for trigger type
  const getTriggerDisplayName = (triggerType: string, nodeName: string) => {
    const displayName = triggerDisplayNames[triggerType as keyof typeof triggerDisplayNames] || triggerDisplayNames.default
    return `${nodeName} (${displayName})`
  }

  // Don't render if no triggers found
  if (triggerNodes.length === 0) {
    return null
  }

  // Single trigger - render simple button
  if (triggerNodes.length === 1) {
    const trigger = triggerNodes[0]
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => handleExecute(trigger.id)}
            disabled={disabled || isCurrentlyExecuting}
            variant="outline"
            size="sm"
            className={`h-7 w-7 p-0 ${className}`}
          >
            {isCurrentlyExecuting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 text-green-600" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Execute workflow from {getTriggerDisplayName(trigger.type, trigger.name)}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Multiple triggers - render dropdown
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={disabled || isCurrentlyExecuting}
              variant="outline"
              size="sm"
              className={`h-7 px-1.5 ${className}`}
            >
              {isCurrentlyExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 text-green-600" />
              )}
              <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Execute workflow (multiple triggers available)</p>
        </TooltipContent>
      </Tooltip>
      
      <DropdownMenuContent align="end" className="w-56">
        {triggerNodes.map((trigger) => {
          const TriggerIcon = getTriggerIcon(trigger.type)
          
          return (
            <DropdownMenuItem
              key={trigger.id}
              onClick={() => handleExecute(trigger.id)}
              disabled={isCurrentlyExecuting}
              className="text-xs"
            >
              <TriggerIcon className="mr-2 h-3.5 w-3.5" />
              {getTriggerDisplayName(trigger.type, trigger.name)}
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExecute()}
          disabled={isCurrentlyExecuting}
          className="text-xs font-medium"
        >
          <Play className="mr-2 h-3.5 w-3.5" />
          Execute from first trigger
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}