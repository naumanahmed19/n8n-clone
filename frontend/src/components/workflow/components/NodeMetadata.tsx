import { NodeExecutionStatus } from '@/types/execution'

interface NodeMetadataProps {
  label: string
  nodeVisualState?: {
    status: NodeExecutionStatus
    progress?: number
    executionTime?: number
  }
}

export function NodeMetadata({ label, nodeVisualState }: NodeMetadataProps) {
  return (
    <>
      {/* Node label */}
      <div className="mt-2 text-center max-w-[120px]">
        <div className="text-xs font-medium text-gray-900 truncate">
          {label}
        </div>
      </div>

      {/* Progress bar for running nodes */}
      {nodeVisualState && 
       nodeVisualState.status === NodeExecutionStatus.RUNNING && 
       nodeVisualState.progress && nodeVisualState.progress > 0 && (
        <div className="mt-2 w-full max-w-[120px]">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${nodeVisualState.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
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
        <div className="mt-1 text-xs text-gray-500 text-center">
          {Math.round(nodeVisualState.executionTime / 1000)}s
        </div>
      )}
    </>
  )
}
