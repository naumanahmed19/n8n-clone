import { ExecutionFlowStatus, NodeExecutionResult } from '@/types'

interface TimelineTabContentProps {
  flowExecutionStatus?: ExecutionFlowStatus | null
  realTimeResults: Map<string, NodeExecutionResult>
}

export function TimelineTabContent({ flowExecutionStatus, realTimeResults }: TimelineTabContentProps) {
  const nodeResults = Array.from(realTimeResults.entries())

  return (
    <div className="p-4">
      {flowExecutionStatus ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Execution Timeline</h4>
            <div className="text-sm text-gray-500">
              Status: {flowExecutionStatus.status}
            </div>
          </div>

          <div className="space-y-2">
            {nodeResults.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No timeline data available
              </div>
            ) : (
              nodeResults.map(([nodeId, result], index) => {
                const isLast = index === nodeResults.length - 1
                return (
                  <div key={nodeId} className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        result.status === 'success' ? 'bg-green-500' :
                        result.status === 'error' ? 'bg-red-500' :
                        result.status === 'running' ? 'bg-blue-500' :
                        result.status === 'skipped' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      {!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{nodeId}</div>
                      <div className="text-xs text-gray-500">
                        Status: {result.status}
                        {result.startTime && (
                          <span className="ml-2">
                            Started: {new Date(result.startTime).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          No timeline data available
        </div>
      )}
    </div>
  )
}