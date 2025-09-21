import { NodeExecutionResult } from '@/types'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ResultsTabContentProps {
  displayResults: NodeExecutionResult[]
}

export function ResultsTabContent({ displayResults }: ResultsTabContentProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />
    }
  }

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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  return (
    <div className="p-4">
      {displayResults.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No execution results available
        </div>
      ) : (
        <div className="space-y-4">
          {displayResults.map((result) => (
            <div key={result.nodeId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.nodeId}</span>
                  <span className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                {result.duration && (
                  <span className="text-sm text-gray-500">
                    {formatDuration(result.duration)}
                  </span>
                )}
              </div>

              {result.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-700">{result.error}</div>
                </div>
              )}

              {result.data && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Output Data:</div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
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