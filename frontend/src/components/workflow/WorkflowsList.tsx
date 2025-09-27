import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { workflowService } from '@/services'
import { useSidebarContext } from '@/contexts'
import {
    Activity,
    Calendar,
    MoreHorizontal,
    Workflow as WorkflowIcon
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface WorkflowsListProps {
  searchTerm?: string
}

export function WorkflowsList({ searchTerm = "" }: WorkflowsListProps) {
  const navigate = useNavigate()
  const {
    workflowsData: workflows,
    setWorkflowsData: setWorkflows,
    isWorkflowsLoaded,
    setIsWorkflowsLoaded,
    workflowsError: error,
    setWorkflowsError: setError
  } = useSidebarContext()
  
  const [isLoading, setIsLoading] = useState(!isWorkflowsLoaded)

  useEffect(() => {
    const fetchWorkflows = async () => {
      // Don't fetch if we already have data loaded
      if (isWorkflowsLoaded && workflows.length > 0) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch fresh data
        const response = await workflowService.getWorkflows()
        setWorkflows(response.data)
        setIsWorkflowsLoaded(true)
      } catch (err) {
        console.error('Failed to fetch workflows:', err)
        setError('Failed to load workflows')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflows()
  }, [isWorkflowsLoaded, workflows.length])

  // Filter workflows based on search term
  const filteredWorkflows = React.useMemo(() => {
    if (!searchTerm) return workflows
    
    return workflows.filter(workflow =>
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [workflows, searchTerm])

  const handleWorkflowClick = (workflowId: string) => {
    // Use replace to avoid adding to history stack and help with component reuse
    navigate(`/workflows/${workflowId}/edit`, { replace: true })
  }

  const handleWorkflowAction = (action: string, workflowId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log(`${action} workflow:`, workflowId)
    // TODO: Implement workflow actions (duplicate, delete, etc.)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
          <WorkflowIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
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

  if (filteredWorkflows.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <WorkflowIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">
            {searchTerm ? 'No workflows match your search' : 'No workflows found'}
          </p>
          {!searchTerm && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => navigate('/workflows/new')}
            >
              Create Your First Workflow
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-0">
      <div className="space-y-0">
        {filteredWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-b last:border-b-0 cursor-pointer group"
            onClick={() => handleWorkflowClick(workflow.id)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <WorkflowIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <h4 className="text-sm font-medium truncate">{workflow.name}</h4>
                  <Badge 
                    variant={workflow.active ? "default" : "secondary"}
                    className="text-xs h-5"
                  >
                    {workflow.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
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
                      onClick={(e) => handleWorkflowAction('edit', workflow.id, e)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleWorkflowAction('duplicate', workflow.id, e)}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleWorkflowAction('delete', workflow.id, e)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {workflow.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {workflow.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(workflow.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>{workflow.nodes?.length || 0} nodes</span>
                  </div>
                </div>
                
                {workflow.category && (
                  <Badge variant="outline" className="text-xs h-4">
                    {workflow.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}