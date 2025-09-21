import { ExecutionMetrics } from '@/types'

interface MetricsTabContentProps {
  executionMetrics?: ExecutionMetrics | null
}

export function MetricsTabContent({ executionMetrics }: MetricsTabContentProps) {
  return (
    <div className="p-4">
      {executionMetrics ? (
        <div className="space-y-4">
          <h4 className="font-medium">Execution Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Total Duration</div>
              <div className="text-lg font-semibold">
                {executionMetrics.totalDuration ? `${executionMetrics.totalDuration}ms` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-500">Nodes Executed</div>
              <div className="text-lg font-semibold">
                {executionMetrics.nodesExecuted || 0}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          No metrics data available
        </div>
      )}
    </div>
  )
}