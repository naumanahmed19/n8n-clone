import { useState, useEffect, useRef } from 'react'
import { ExecutionState, WorkflowExecutionResult, NodeExecutionResult } from '@/types'

interface ExecutionLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: any
}

interface ExecutionPanelProps {
  executionState: ExecutionState
  lastExecutionResult: WorkflowExecutionResult | null
  executionLogs: ExecutionLogEntry[]
  realTimeResults: Map<string, NodeExecutionResult>
  onClose: () => void
}

export function ExecutionPanel({
  executionState,
  lastExecutionResult,
  executionLogs,
  realTimeResults,
  onClose
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'logs' | 'results'>('progress')
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, activeTab])
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, activeTab])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      case 'debug': return 'text-gray-500'
      default: return 'text-gray-600'
    }
  }

  const currentResults = Array.from(realTimeResults.values())
  const finalResults = lastExecutionResult?.nodeResults || []
  const displayResults = executionState.status === 'running' ? currentResults : finalResults

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900">Execution Panel</h3>
          {executionState.executionId && (
            <span className="text-sm text-gray-500">ID: {executionState.executionId}</span>
          )}
          {/* Show test mode indicator if workflow is inactive */}
          {/* This would need to be passed as a prop, but for now we'll show it in logs */}
          <div className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(executionState.status)}`}>
            {executionState.status.toUpperCase()}
          </div>
          {executionState.progress !== undefined && (
            <div className="text-sm text-gray-600">
              {executionState.progress}%
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Progress
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Logs ({executionLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'results'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Results ({displayResults.length})
        </button>
      </div>

      <div className="h-64 overflow-auto">
        {activeTab === 'progress' && (
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
                      {formatDuration(executionState.endTime - executionState.startTime)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {executionState.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-red-800 font-medium">Error</div>
                <div className="text-red-700 text-sm mt-1">{executionState.error}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4 space-y-2">
            {executionLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No logs available</div>
            ) : (
              <>
                {executionLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <span className="text-gray-400 text-xs w-16 flex-shrink-0">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`w-12 flex-shrink-0 font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.nodeId && (
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0 truncate">
                        {log.nodeId}
                      </span>
                    )}
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-4">
            {displayResults.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No results available</div>
            ) : (
              <div className="space-y-3">
                {displayResults.map((result) => (
                  <div key={result.nodeId} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.nodeName}</span>
                        <span className="text-xs text-gray-500">{result.nodeId}</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span>Duration:</span> {formatDuration(result.duration)}
                      </div>
                      <div>
                        <span>Started:</span> {new Date(result.startTime).toLocaleTimeString()}
                      </div>
                    </div>

                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="text-red-800 font-medium">Error:</div>
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
        )}
      </div>
    </div>
  )
}