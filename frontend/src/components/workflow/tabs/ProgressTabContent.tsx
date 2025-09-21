import { ExecutionState } from '@/types'

interface ProgressTabContentProps {
  executionState: ExecutionState
}

export function ProgressTabContent({ executionState }: ProgressTabContentProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  return (
    <div className="p-4">
      {executionState.status === 'running' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{executionState.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${executionState.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {executionState.startTime && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Started:</span>
            <div className="font-medium">
              {new Date(executionState.startTime).toLocaleString()}
            </div>
          </div>
          {executionState.endTime && (
            <div>
              <span className="text-gray-500">Duration:</span>
              <div className="font-medium">
                {formatDuration(new Date(executionState.endTime).getTime() - new Date(executionState.startTime).getTime())}
              </div>
            </div>
          )}
        </div>
      )}

      {executionState.status === 'error' && executionState.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-700 text-sm mt-1">{executionState.error}</div>
        </div>
      )}
    </div>
  )
}