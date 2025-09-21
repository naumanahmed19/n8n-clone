import { ExecutionFlowStatus, ExecutionMetrics, ExecutionState, NodeExecutionResult, WorkflowExecutionResult } from '@/types'
import { useState } from 'react'
import { ExecutionPanelContent } from './ExecutionPanelContent'
import { ExecutionPanelHeader } from './ExecutionPanelHeader'
import { ExecutionPanelTabs, TabType } from './ExecutionPanelTabs'

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
  isExpanded?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function ExecutionPanel({
  executionState,
  lastExecutionResult,
  executionLogs,
  realTimeResults,
  flowExecutionStatus,
  executionMetrics,
  isExpanded = true,
  onToggle,
  onClose
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('progress')

  // Get display data for tabs
  const currentResults = Array.from(realTimeResults.values())
  const finalResults = lastExecutionResult?.nodeResults || []
  const displayResults = executionState.status === 'running' ? currentResults : finalResults

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else if (onClose) {
      onClose()
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <ExecutionPanelHeader
        executionState={executionState}
        isExpanded={isExpanded}
        onToggle={handleToggle}
      />

      {isExpanded && (
        <div className="flex-1 flex flex-col">
          <ExecutionPanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            logsCount={executionLogs.length}
            resultsCount={displayResults.length}
          />

          <ExecutionPanelContent
            activeTab={activeTab}
            executionState={executionState}
            lastExecutionResult={lastExecutionResult}
            executionLogs={executionLogs}
            realTimeResults={realTimeResults}
            flowExecutionStatus={flowExecutionStatus}
            executionMetrics={executionMetrics}
          />
        </div>
      )}
    </div>
  )
}