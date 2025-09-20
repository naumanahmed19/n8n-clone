import { AlertTriangle, CheckCircle, Clock, Loader2, Play, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ExecutionHistoryEntry {
  id: string
  workflowId: string
  status: 'running' | 'success' | 'error' | 'cancelled' | 'paused'
  startedAt: string
  finishedAt?: string
  triggerData?: any
  error?: any
  duration?: number
}

interface ExecutionsHistoryProps {
  workflowId: string
  isVisible: boolean
  onClose: () => void
  onSelectExecution?: (executionId: string) => void
}

export function ExecutionsHistory({
  workflowId,
  isVisible,
  onClose,
  onSelectExecution
}: ExecutionsHistoryProps) {
  const [executions, setExecutions] = useState<ExecutionHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isVisible && workflowId) {
      fetchExecutions()
    }
  }, [isVisible, workflowId])

  const fetchExecutions = async () => {
    setLoading(true)
    setError(null)
    try {
      // Import execution service dynamically
      const { apiClient } = await import('@/services/api')
      
      const response = await apiClient.get<ExecutionHistoryEntry[]>(`/executions?workflowId=${workflowId}&limit=50`)

      if (response.success && response.data) {
        setExecutions(response.data)
      } else {
        setError('Failed to fetch executions')
      }
    } catch (err) {
      console.error('Error fetching executions:', err)
      setError('Failed to fetch executions')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt)
    const end = finishedAt ? new Date(finishedAt) : new Date()
    const duration = end.getTime() - start.getTime()
    
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'paused':
        return <Play className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'running':
        return 'bg-blue-50 border-blue-200'
      case 'cancelled':
        return 'bg-yellow-50 border-yellow-200'
      case 'paused':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Workflow Executions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-600">Loading executions...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchExecutions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No executions found for this workflow</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${getStatusColor(execution.status)}`}
                    onClick={() => onSelectExecution?.(execution.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium text-gray-900">
                            Execution {execution.id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            Started {new Date(execution.startedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-medium capitalize ${
                          execution.status === 'success' ? 'text-green-600' :
                          execution.status === 'error' ? 'text-red-600' :
                          execution.status === 'running' ? 'text-blue-600' :
                          execution.status === 'cancelled' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {execution.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDuration(execution.startedAt, execution.finishedAt)}
                        </div>
                      </div>
                    </div>

                    {execution.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {execution.error.message || 'Execution failed'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {executions.length} execution{executions.length !== 1 ? 's' : ''} found
            </div>
            <button
              onClick={fetchExecutions}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}