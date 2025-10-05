import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useSidebarContext } from '@/contexts'
import { apiClient } from '@/services/api'
import { executionService, type ExecutionDetails } from '@/services/execution'
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Pause,
  Play,
  StopCircle,
  XCircle
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ExecutionsHeader } from './ExecutionsHeader'

// Use ExecutionDetails from the service as our Execution type
type Execution = ExecutionDetails

interface ExecutionsListProps {}

export function ExecutionsList({}: ExecutionsListProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    setHeaderSlot
  } = useSidebarContext()
  
  const [allExecutions, setAllExecutions] = useState<Execution[]>([])
  const [workflowExecutions, setWorkflowExecutions] = useState<Execution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"workflow" | "all">("workflow")

  // Extract the currently active workflow ID from URL if in workflow editor
  const currentWorkflowId = useMemo(() => {
    const pathMatch = location.pathname.match(/^\/workflows\/([^\/]+)(?:\/edit)?$/)
    return pathMatch ? pathMatch[1] : null
  }, [location.pathname])

  // Auto-switch to "all" tab when no current workflow
  useEffect(() => {
    if (!currentWorkflowId || currentWorkflowId === 'new') {
      setActiveTab("all")
    } else {
      setActiveTab("workflow")
    }
  }, [currentWorkflowId])

  // Extract the currently active execution ID from URL if viewing execution details
  const activeExecutionId = useMemo(() => {
    const pathMatch = location.pathname.match(/^\/workflows\/[^\/]+\/executions\/([^\/]+)$/)
    return pathMatch ? pathMatch[1] : null
  }, [location.pathname])

  const fetchExecutions = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      // Fetch all executions
      const allExecutionsList = await executionService.listExecutions({
        status: statusFilter || undefined,
        limit: 50,
        page: 1
      })
      
      setAllExecutions(allExecutionsList)
      
      // Filter executions for current workflow if we have a workflow ID
      if (currentWorkflowId && currentWorkflowId !== 'new') {
        const workflowExecutionsList = await executionService.listExecutions({
          workflowId: currentWorkflowId,
          status: statusFilter || undefined,
          limit: 50,
          page: 1
        })
        setWorkflowExecutions(workflowExecutionsList)
      } else {
        setWorkflowExecutions([])
      }
      
    } catch (err) {
      console.error('Failed to fetch executions:', err)
      setError('Failed to load executions')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchExecutions(true)
  }

  useEffect(() => {
    fetchExecutions()
  }, [statusFilter, currentWorkflowId])

  // Get the current executions based on active tab
  const currentExecutions = useMemo(() => {
    return activeTab === "workflow" ? workflowExecutions : allExecutions
  }, [activeTab, workflowExecutions, allExecutions])

  // Filter executions based on search term
  const filteredExecutions = useMemo(() => {
    if (!searchTerm) return currentExecutions
    
    return currentExecutions.filter((execution: Execution) =>
      execution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.workflowId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [currentExecutions, searchTerm])

  // Set header slot for executions
  useEffect(() => {
    setHeaderSlot(
      <ExecutionsHeader 
        executionCount={filteredExecutions.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentWorkflowId={currentWorkflowId}
        workflowExecutionCount={workflowExecutions.length}
        allExecutionCount={allExecutions.length}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    )
    
    // Clean up header slot when component unmounts
    return () => {
      setHeaderSlot(null)
    }
  }, [setHeaderSlot, filteredExecutions.length, searchTerm, setSearchTerm, statusFilter, setStatusFilter, activeTab, setActiveTab, currentWorkflowId, workflowExecutions.length, allExecutions.length, isRefreshing])

  const handleExecutionClick = (executionId: string) => {
    // Find the execution to get its workflowId
    const execution = filteredExecutions.find(e => e.id === executionId)
    if (execution) {
      navigate(`/workflows/${execution.workflowId}/executions/${executionId}`)
    }
  }

  const handleExecutionAction = async (action: string, executionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      switch (action) {
        case 'cancel':
          await apiClient.post(`/executions/${executionId}/cancel`)
          // Refresh the list
          window.location.reload()
          break
        case 'retry':
          await apiClient.post(`/executions/${executionId}/retry`)
          // Refresh the list
          window.location.reload()
          break
        case 'delete':
          if (window.confirm('Are you sure you want to delete this execution?')) {
            await apiClient.delete(`/executions/${executionId}`)
            // Remove from both local states
            setAllExecutions(prev => prev.filter(exec => exec.id !== executionId))
            setWorkflowExecutions(prev => prev.filter(exec => exec.id !== executionId))
          }
          break
        default:
          console.log(`${action} execution:`, executionId)
      }
    } catch (err) {
      console.error(`Failed to ${action} execution:`, err)
      // You might want to show a toast notification here
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt)
    const end = finishedAt ? new Date(finishedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()
    
    if (durationMs < 1000) return '<1s'
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`
    if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m`
    return `${Math.round(durationMs / 3600000)}h`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="h-3 w-3 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'cancelled':
        return <StopCircle className="h-3 w-3 text-gray-500" />
      case 'paused':
        return <Pause className="h-3 w-3 text-yellow-500" />
      case 'partial':
        return <AlertCircle className="h-3 w-3 text-orange-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'partial':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (filteredExecutions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">
            {searchTerm || statusFilter ? 'No executions match your filters' : 'No executions found'}
          </p>
          <p className="text-xs mt-1">Run a workflow to see execution history</p>
        </div>
      </div>
    )
  }

  const renderExecutionItem = (execution: Execution) => {
    const isActive = activeExecutionId === execution.id
    
    return (
      <div
        key={execution.id}
        className={`
          border-b last:border-b-0 cursor-pointer group transition-colors
          ${isActive 
            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-l-primary' 
            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }
        `}
        onClick={() => handleExecutionClick(execution.id)}
      >
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium truncate">
                  Workflow {execution.workflowId.slice(0, 8)}...
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {execution.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs h-5 capitalize ${getStatusColor(execution.status)}`}
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon(execution.status)}
                  {execution.status}
                </div>
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => handleExecutionAction('view', execution.id, e)}
                  >
                    View Details
                  </DropdownMenuItem>
                  {execution.status === 'running' && (
                    <DropdownMenuItem
                      onClick={(e) => handleExecutionAction('cancel', execution.id, e)}
                    >
                      Cancel
                    </DropdownMenuItem>
                  )}
                  {(execution.status === 'error' || execution.status === 'cancelled') && (
                    <DropdownMenuItem
                      onClick={(e) => handleExecutionAction('retry', execution.id, e)}
                    >
                      Retry
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => handleExecutionAction('delete', execution.id, e)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(execution.startedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(execution.startedAt, execution.finishedAt)}</span>
              </div>
            </div>
            
            {execution.nodeExecutions && (
              <span className="text-xs">
                {execution.nodeExecutions.length} nodes
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Shared component for loading, error, and empty states
  const renderContent = (isForWorkflow: boolean = false) => {
    if (isLoading) {
      return (
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    if (filteredExecutions.length === 0) {
      return (
        <div className="p-4">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">
              {searchTerm || statusFilter 
                ? 'No executions match your filters' 
                : isForWorkflow 
                  ? 'No executions for this workflow'
                  : 'No executions found'
              }
            </p>
            <p className="text-xs mt-1">
              {isForWorkflow 
                ? 'Run this workflow to see execution history'
                : 'Run a workflow to see execution history'
              }
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {filteredExecutions.map((execution) => renderExecutionItem(execution))}
      </div>
    )
  }

  return (
    <div className="p-0">
      {/* Show tabs UI when we have a current workflow */}
      {currentWorkflowId && currentWorkflowId !== 'new' ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "workflow" | "all")} className="w-full">
          <TabsContent value="workflow" className="space-y-0 mt-0">
            {renderContent(true)}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-0 mt-0">
            {renderContent(false)}
          </TabsContent>
        </Tabs>
      ) : (
        // Show all executions when no current workflow
        renderContent(false)
      )}
    </div>
  )
}