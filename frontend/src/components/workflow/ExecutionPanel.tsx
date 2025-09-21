import { ExecutionFlowStatus, ExecutionMetrics, ExecutionState, NodeExecutionResult, NodeExecutionStatus, WorkflowExecutionResult } from '@/types'
import { Activity, AlertTriangle, BarChart3, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  flowExecutionStatus?: ExecutionFlowStatus | null
  executionMetrics?: ExecutionMetrics | null
  onClose: () => void
}

export function ExecutionPanel({
  executionState,
  lastExecutionResult,
  executionLogs,
  realTimeResults,
  flowExecutionStatus,
  executionMetrics,
  onClose
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'timeline' | 'metrics' | 'logs' | 'results'>('progress')
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
    <div className="h-full bg-white border-t border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
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
          className={`px-4 py-2 text-sm font-medium flex items-center space-x-1 ${
            activeTab === 'progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Progress</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-sm font-medium flex items-center space-x-1 ${
            activeTab === 'timeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 text-sm font-medium flex items-center space-x-1 ${
            activeTab === 'metrics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Metrics</span>
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

      <div className="flex-1 overflow-auto">
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

        {activeTab === 'timeline' && (
          <div className="p-4">
            {flowExecutionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Execution Timeline</h4>
                  <div className="text-sm text-gray-500">
                    {flowExecutionStatus.executionPath.length} nodes executed
                  </div>
                </div>

                {/* Execution path visualization */}
                <div className="space-y-2">
                  {flowExecutionStatus.executionPath.map((nodeId, index) => {
                    const nodeState = flowExecutionStatus.nodeStates.get(nodeId)
                    if (!nodeState) return null

                    const isLast = index === flowExecutionStatus.executionPath.length - 1
                    const executionOrder = index + 1
                    
                    return (
                      <div key={nodeId} className="flex items-center space-x-3">
                        {/* Timeline line with execution order */}
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            nodeState.status === NodeExecutionStatus.COMPLETED ? 'bg-green-500' :
                            nodeState.status === NodeExecutionStatus.FAILED ? 'bg-red-500' :
                            nodeState.status === NodeExecutionStatus.RUNNING ? 'bg-blue-500 animate-pulse' :
                            'bg-gray-400'
                          }`}>
                            {nodeState.status === NodeExecutionStatus.COMPLETED ? '✓' :
                             nodeState.status === NodeExecutionStatus.FAILED ? '✗' :
                             nodeState.status === NodeExecutionStatus.RUNNING ? '▶' :
                             executionOrder}
                          </div>
                          {!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                        </div>

                        {/* Node info with enhanced details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm truncate">{nodeId}</span>
                              <span className="text-xs text-gray-400">#{executionOrder}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                nodeState.status === NodeExecutionStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                                nodeState.status === NodeExecutionStatus.FAILED ? 'bg-red-100 text-red-800' :
                                nodeState.status === NodeExecutionStatus.RUNNING ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {nodeState.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              {nodeState.startTime && (
                                <span title={new Date(nodeState.startTime).toLocaleString()}>
                                  {formatTimestamp(new Date(nodeState.startTime).toISOString())}
                                </span>
                              )}
                              <span className="font-medium">
                                {nodeState.duration ? formatDuration(nodeState.duration) : 
                                 nodeState.startTime ? `${formatDuration(Date.now() - nodeState.startTime)}...` : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar for running nodes */}
                          {nodeState.status === NodeExecutionStatus.RUNNING && nodeState.progress !== undefined && (
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${nodeState.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {nodeState.error && (
                            <div className="text-xs text-red-600 mt-1 truncate bg-red-50 px-2 py-1 rounded">
                              {nodeState.error.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Currently executing nodes */}
                {flowExecutionStatus.currentlyExecuting.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-900 mb-2">Currently Executing</h5>
                    <div className="space-y-1">
                      {flowExecutionStatus.currentlyExecuting.map(nodeId => {
                        const nodeState = flowExecutionStatus.nodeStates.get(nodeId)
                        return (
                          <div key={nodeId} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{nodeId}</span>
                            <div className="flex items-center space-x-2">
                              {nodeState?.progress && (
                                <div className="w-16 bg-gray-200 rounded-full h-1">
                                  <div 
                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${nodeState.progress}%` }}
                                  />
                                </div>
                              )}
                              <span className="text-blue-600 text-xs">
                                {nodeState?.startTime ? formatDuration(Date.now() - nodeState.startTime) : ''}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Queued nodes */}
                {flowExecutionStatus.queuedNodes.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Queued</h5>
                    <div className="flex flex-wrap gap-1">
                      {flowExecutionStatus.queuedNodes.map(nodeId => (
                        <span key={nodeId} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {nodeId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No timeline data available</div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="p-4">
            {executionMetrics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Execution overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Execution Overview
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Nodes:</span>
                        <span className="font-medium">{executionMetrics.totalNodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {executionMetrics.completedNodes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-medium text-red-600 flex items-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          {executionMetrics.failedNodes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance metrics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Performance
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Duration:</span>
                        <span className="font-medium">{formatDuration(executionMetrics.averageNodeDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parallelism:</span>
                        <span className="font-medium">{Math.round(executionMetrics.parallelismUtilization)}%</span>
                      </div>
                      {executionMetrics.longestRunningNode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longest:</span>
                          <span className="font-medium text-xs truncate max-w-20" title={executionMetrics.longestRunningNode}>
                            {executionMetrics.longestRunningNode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottleneck analysis */}
                {executionMetrics.bottleneckNodes.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Performance Bottlenecks
                    </h5>
                    <div className="text-sm text-yellow-700">
                      The following nodes took significantly longer than average:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {executionMetrics.bottleneckNodes.map(nodeId => (
                        <span key={nodeId} className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                          {nodeId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance analysis section */}
                {flowExecutionStatus && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Execution Analysis</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Execution path efficiency */}
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium text-gray-700">Path Efficiency</h6>
                        <div className="text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Steps:</span>
                            <span>{flowExecutionStatus.executionPath.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Parallel Nodes:</span>
                            <span>{flowExecutionStatus.currentlyExecuting.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Queue Depth:</span>
                            <span>{flowExecutionStatus.queuedNodes.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Performance indicators */}
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium text-gray-700">Performance</h6>
                        <div className="text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Execution Speed:</span>
                            <span className={
                              executionMetrics.parallelismUtilization > 70 ? 'text-green-600' :
                              executionMetrics.parallelismUtilization > 40 ? 'text-yellow-600' :
                              'text-red-600'
                            }>
                              {executionMetrics.parallelismUtilization > 70 ? 'Fast' :
                               executionMetrics.parallelismUtilization > 40 ? 'Moderate' : 'Slow'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bottlenecks:</span>
                            <span className={executionMetrics.bottleneckNodes.length > 0 ? 'text-yellow-600' : 'text-green-600'}>
                              {executionMetrics.bottleneckNodes.length > 0 ? `${executionMetrics.bottleneckNodes.length} found` : 'None'}
                            </span>
                          </div>
                          {flowExecutionStatus.estimatedTimeRemaining && (
                            <div className="flex justify-between">
                              <span>Est. Remaining:</span>
                              <span>{formatDuration(flowExecutionStatus.estimatedTimeRemaining)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress visualization */}
                {flowExecutionStatus && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Progress Breakdown</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{flowExecutionStatus.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${flowExecutionStatus.progress}%` }}
                        >
                          {flowExecutionStatus.progress > 15 && (
                            <span className="text-white text-xs font-medium">
                              {flowExecutionStatus.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Node status breakdown */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-green-600 font-medium">{executionMetrics.completedNodes}</div>
                          <div className="text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{flowExecutionStatus.currentlyExecuting.length}</div>
                          <div className="text-gray-500">Running</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-600 font-medium">{flowExecutionStatus.queuedNodes.length}</div>
                          <div className="text-gray-500">Queued</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-600 font-medium">{executionMetrics.failedNodes}</div>
                          <div className="text-gray-500">Failed</div>
                        </div>
                      </div>
                      
                      {flowExecutionStatus.estimatedTimeRemaining && flowExecutionStatus.estimatedTimeRemaining > 0 && (
                        <div className="text-xs text-gray-600 text-center">
                          Estimated time remaining: {formatDuration(flowExecutionStatus.estimatedTimeRemaining)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No metrics data available</div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4 space-y-2">
            {/* Real-time subscription indicator */}
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">📡 Real-time events active</span>
                <span className="text-blue-600 text-xs">Events will display for 30 seconds after execution</span>
              </div>
            </div>
            
            {executionLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div>No logs available</div>
                <div className="text-xs mt-2">Execution events will appear here in real-time</div>
              </div>
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