import { useWorkflowStore } from '@/stores/workflow'
import { ChevronDown, Filter, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  onClearLogs?: () => void
}

type SortOption = 'time-desc' | 'time-asc' | 'node-asc' | 'level-desc'
type FilterOption = 'all' | 'info' | 'warn' | 'error' | 'debug'

export function LogsTabContent({ executionLogs, isActive, onClearLogs }: LogsTabContentProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [sortBy, setSortBy] = useState<SortOption>('time-desc')
  const [filterLevel, setFilterLevel] = useState<FilterOption>('all')
  const [filterNode, setFilterNode] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Get workflow to access node names
  const workflow = useWorkflowStore(state => state.workflow)

  // Get unique node IDs for filtering
  const uniqueNodeIds = useMemo(() => {
    const nodeIds = new Set(executionLogs.map(log => log.nodeId).filter(Boolean) as string[])
    return Array.from(nodeIds).sort()
  }, [executionLogs])

  // Get node display name from workflow
  const getNodeDisplayName = (nodeId: string) => {
    if (!workflow) return nodeId
    const node = workflow.nodes.find(n => n.id === nodeId)
    return node ? node.name : nodeId
  }

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = executionLogs

    // Filter by log level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel)
    }

    // Filter by node
    if (filterNode !== 'all') {
      filtered = filtered.filter(log => log.nodeId === filterNode)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        (log.nodeId && log.nodeId.toLowerCase().includes(term)) ||
        (log.nodeId && getNodeDisplayName(log.nodeId).toLowerCase().includes(term)) ||
        log.level.toLowerCase().includes(term)
      )
    }

    // Sort logs
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'time-desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'time-asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case 'node-asc':
          if (!a.nodeId && !b.nodeId) return 0
          if (!a.nodeId) return 1
          if (!b.nodeId) return -1
          const nameA = getNodeDisplayName(a.nodeId)
          const nameB = getNodeDisplayName(b.nodeId)
          return nameA.localeCompare(nameB)
        case 'level-desc':
          const levelPriority = { error: 3, warn: 2, info: 1, debug: 0 }
          return levelPriority[b.level] - levelPriority[a.level]
        default:
          return 0
      }
    })

    return sorted
  }, [executionLogs, filterLevel, filterNode, searchTerm, sortBy, workflow])

  // Auto-scroll logs to bottom when new logs arrive (only if sorted by time-desc)
  useEffect(() => {
    if (isActive && logsEndRef.current && sortBy === 'time-desc') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [executionLogs, isActive, sortBy])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getLogLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'debug': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getNodeBadgeColor = (nodeId: string) => {
    // Generate a consistent color based on node name hash for better visual consistency
    const nodeName = getNodeDisplayName(nodeId)
    const hash = nodeName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colors = [
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  return (
   <div >
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Filters</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear logs button */}
          {onClearLogs && executionLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
              title="Clear all logs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="time-desc">Latest first</option>
            <option value="time-asc">Oldest first</option>
            <option value="node-asc">Node A-Z</option>
            <option value="level-desc">Level (Error first)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-3 border-b bg-gray-50 space-y-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Log Level:</span>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as FilterOption)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Node:</span>
              <select
                value={filterNode}
                onChange={(e) => setFilterNode(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All nodes</option>
                {uniqueNodeIds.map(nodeId => (
                  <option key={nodeId} value={nodeId}>{getNodeDisplayName(nodeId)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Logs Content */}
   
    <div className="h-[calc(100dvh-540px)] overflow-y-auto p-4">
          {filteredAndSortedLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {executionLogs.length === 0 ? 'No logs available' : 'No logs match your filters'}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredAndSortedLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 border-l-2 border-l-transparent hover:border-l-blue-200">
                    {/* Timestamp */}
                    <span className="text-gray-400 text-xs w-16 flex-shrink-0 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {/* Level Badge */}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getLogLevelBadgeColor(log.level)} flex-shrink-0`}>
                      {log.level.toUpperCase()}
                    </span>

                    {/* Node Badge */}
                    {log.nodeId && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getNodeBadgeColor(log.nodeId)} flex-shrink-0 max-w-32 truncate`}
                            title={`${getNodeDisplayName(log.nodeId)} (${log.nodeId})`}>
                        {getNodeDisplayName(log.nodeId)}
                      </span>
                    )}

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm break-words">
                        {log.message}
                      </div>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View data
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 border">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                {sortBy === 'time-desc' && <div ref={logsEndRef} />}
              </div>
            )}
        </div>
   

      {/* Summary Footer */}
      <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Showing {filteredAndSortedLogs.length} of {executionLogs.length} logs
        {uniqueNodeIds.length > 0 && (
          <span className="ml-2">• {uniqueNodeIds.length} nodes</span>
        )}
      </div>
    </div>
  )
}

export type { ExecutionLogEntry }

