import { NodeExecutionResult } from '@/types'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ResultsTabContentProps {
  displayResults: NodeExecutionResult[]
}

export function ResultsTabContent({ displayResults }: ResultsTabContentProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'cancelled': return 'text-yellow-600 dark:text-yellow-400'
      case 'running': return 'text-blue-600 dark:text-blue-400'
      case 'skipped': return 'text-muted-foreground'
      default: return 'text-muted-foreground'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  return (
    <div className="p-4 bg-background">
      {displayResults.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No execution results available
        </div>
      ) : (
        <div className="space-y-4">
          {displayResults.map((result) => (
            <div key={result.nodeId} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium text-card-foreground">{result.nodeId}</span>
                  <span className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                {result.duration && (
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(result.duration)}
                  </span>
                )}
              </div>

              {result.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
                  <div className="text-red-700 dark:text-red-300">{result.error}</div>
                </div>
              )}

              {result.data && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Output Data:</div>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32 border border-border">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
