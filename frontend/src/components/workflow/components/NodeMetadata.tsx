import { NodeExecutionStatus } from '@/types/execution'

interface NodeMetadataProps {
  label?: string // Made optional since label is now shown inside the node
  nodeVisualState?: {
    status: NodeExecutionStatus
    progress?: number
    executionTime?: number
  }
}

export function NodeMetadata({ nodeVisualState }: NodeMetadataProps) {
  return (
    <>
      {/* Progress bar for running nodes */}
      {nodeVisualState && 
       nodeVisualState.status === NodeExecutionStatus.RUNNING && 
       nodeVisualState.progress && nodeVisualState.progress > 0 && (
        <div className="mt-2 w-full max-w-[120px] mx-auto">
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className="bg-blue-500 dark:bg-blue-400 h-1 rounded-full transition-all duration-300"
              style={{ width: `${nodeVisualState.progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {nodeVisualState.progress}%
            {nodeVisualState.executionTime && (
              <span className="ml-2">
                {Math.round(nodeVisualState.executionTime / 1000)}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* Execution time display for completed nodes */}
      {nodeVisualState && 
       nodeVisualState.status === NodeExecutionStatus.COMPLETED && 
       nodeVisualState.executionTime && (
        <div className="mt-1 text-xs text-muted-foreground text-center">
          {Math.round(nodeVisualState.executionTime / 1000)}s
        </div>
      )}
    </>
  )
}
