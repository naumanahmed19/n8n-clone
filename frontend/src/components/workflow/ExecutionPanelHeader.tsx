import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkflowOperations } from '@/hooks/workflow/useWorkflowOperations'
import { ExecutionState } from '@/types'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface ExecutionPanelHeaderProps {
  executionState: ExecutionState
  isExpanded: boolean
  onToggle: () => void
}

export function ExecutionPanelHeader({ 
  executionState, 
  isExpanded, 
  onToggle
}: ExecutionPanelHeaderProps) {
  const { validateAndShowResult } = useWorkflowOperations()
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'cancelled': return 'text-yellow-600'
      case 'running': return 'text-blue-600'
      case 'skipped': return 'text-gray-500'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center space-x-3">
        <h3 className="font-medium text-sm text-gray-900">Execution Panel</h3>
        {executionState.executionId && (
          <span className="text-xs text-gray-500">ID: {executionState.executionId}</span>
        )}
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(executionState.status)}`}>
          {executionState.status.toUpperCase()}
        </div>
        {executionState.progress !== undefined && (
          <div className="text-xs text-gray-600">
            {executionState.progress}%
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={validateAndShowResult}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Validate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Validate workflow</p>
          </TooltipContent>
        </Tooltip>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 p-1"
          title={isExpanded ? "Minimize execution panel" : "Expand execution panel"}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    </div>
  )
}