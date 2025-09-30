import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RotateCcw, Search } from 'lucide-react'

interface ExecutionsHeaderProps {
  executionCount: number
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string | null
  setStatusFilter: (status: string | null) => void
  activeTab: "workflow" | "all"
  setActiveTab: (tab: "workflow" | "all") => void
  currentWorkflowId: string | null
  workflowExecutionCount: number
  allExecutionCount: number
}

export function ExecutionsHeader({
  executionCount,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  activeTab,
  setActiveTab,
  currentWorkflowId,
  workflowExecutionCount,
  allExecutionCount
}: ExecutionsHeaderProps) {
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter(null)
  }

  const hasActiveFilters = searchTerm || statusFilter

  return (
    <div className="space-y-3">
      {/* Tabs for Current Workflow vs All */}
      {currentWorkflowId && currentWorkflowId !== 'new' && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "workflow" | "all")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="workflow" className="text-xs">
              Current Workflow
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {workflowExecutionCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Executions
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {allExecutionCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Search and Filters */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentWorkflowId && currentWorkflowId !== 'new' 
              ? (activeTab === "workflow" ? "Current Workflow" : "All Executions")
              : "All Executions"
            }
          </span>
          <Badge variant="secondary" className="text-xs h-5">
            {executionCount}
          </Badge>
        </div>
        
        {hasActiveFilters && (
          <span className="text-xs text-muted-foreground">
            {searchTerm && `"${searchTerm}"`}
            {searchTerm && statusFilter && ' • '}
            {statusFilter && `${statusFilter} status`}
          </span>
        )}
      </div>
    </div>
  )
}