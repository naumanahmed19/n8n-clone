import { useEffect, useRef } from 'react'

interface ExecutionLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: any
}

interface LogsTabContentProps {
  executionLogs: ExecutionLogEntry[]
  isActive: boolean
}

export function LogsTabContent({ executionLogs, isActive }: LogsTabContentProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (isActive && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, isActive])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      case 'debug': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-4 max-h-96 overflow-y-auto">
      {executionLogs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No logs available
        </div>
      ) : (
        <div className="space-y-2">
          {executionLogs.map((log, index) => (
            <div key={index} className="flex text-sm">
              <span className="text-gray-400 w-20 flex-shrink-0">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className={`w-16 flex-shrink-0 font-medium ${getLogLevelColor(log.level)}`}>
                [{log.level.toUpperCase()}]
              </span>
              {log.nodeId && (
                <span className="text-purple-600 w-24 flex-shrink-0 truncate">
                  {log.nodeId}:
                </span>
              )}
              <span className="flex-1 break-words">
                {log.message}
                {log.data && (
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}

export type { ExecutionLogEntry }
