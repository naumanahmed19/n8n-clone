import { ExecutionMetrics } from '@/types'

interface MetricsTabContentProps {
  executionMetrics?: ExecutionMetrics | null
}

export function MetricsTabContent({ executionMetrics }: MetricsTabContentProps) {
  return (
    <div className="p-4 bg-background">
      {executionMetrics ? (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Execution Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-3 rounded border border-border">
              <div className="text-sm text-muted-foreground">Total Duration</div>
              <div className="text-lg font-semibold text-foreground">
                {executionMetrics.totalDuration ? `${executionMetrics.totalDuration}ms` : 'N/A'}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded border border-border">
              <div className="text-sm text-muted-foreground">Nodes Executed</div>
              <div className="text-lg font-semibold text-foreground">
                {executionMetrics.nodesExecuted || 0}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-8">
          No metrics data available
        </div>
      )}
    </div>
  )
}