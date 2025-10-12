import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEnvironmentStore } from '@/stores/environment'
import {
  EnvironmentType,
  getEnvironmentColor,
  getEnvironmentIcon,
  getEnvironmentLabel,
  getStatusColor,
  type EnvironmentSummary,
} from '@/types/environment'
import { Check, ChevronDown, FlaskConical, Loader2, Package, Plus, Rocket, Wrench, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CreateEnvironmentDialog } from './CreateEnvironmentDialog'

const EnvironmentIcon = ({ iconName }: { iconName: string }) => {
  switch (iconName) {
    case 'wrench':
      return <Wrench className="w-4 h-4" />
    case 'flask-conical':
      return <FlaskConical className="w-4 h-4" />
    case 'rocket':
      return <Rocket className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

interface EnvironmentSelectorProps {
  workflowId: string
  selectedEnvironment?: EnvironmentType
  onEnvironmentChange?: (environment: EnvironmentType) => void
  onCreateEnvironment?: (environment: EnvironmentType) => void
  showCreateOption?: boolean
}

export function EnvironmentSelector({
  workflowId,
  selectedEnvironment,
  onEnvironmentChange,
  onCreateEnvironment,
  showCreateOption = true,
}: EnvironmentSelectorProps) {
  const { summaries = [], loadSummaries, isLoading, selectedEnvironment: storeSelected, selectEnvironment, error } =
    useEnvironmentStore()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [environmentToCreate, setEnvironmentToCreate] = useState<EnvironmentType | null>(null)

  const currentEnvironment = selectedEnvironment || storeSelected

  useEffect(() => {
    if (workflowId) {
      loadSummaries(workflowId)
    }
  }, [workflowId, loadSummaries])

  const handleEnvironmentSelect = async (environment: EnvironmentType) => {
    selectEnvironment(environment)
    onEnvironmentChange?.(environment)
    
    // Load the environment workflow when selected
    if (workflowId) {
      try {
        const { loadEnvironmentWorkflow } = useEnvironmentStore.getState()
        const { workflow: currentWorkflow, setWorkflow } = await import('@/stores/workflow').then(m => ({ 
          workflow: m.useWorkflowStore.getState().workflow,
          setWorkflow: m.useWorkflowStore.getState().setWorkflow 
        }))
        
        const envData = await loadEnvironmentWorkflow(workflowId, environment)
        if (envData && currentWorkflow) {
          // Merge environment data with original workflow metadata
          // Only override environment-specific data: nodes, connections, settings, active
          setWorkflow({
            ...currentWorkflow,  // Keep original: name, description, category, tags, userId, createdAt, updatedAt, etc.
            nodes: envData.nodes || [],  // Override with environment nodes
            connections: envData.connections || [],  // Override with environment connections
            settings: envData.settings || {},  // Override with environment settings
            active: envData.active,  // Override with environment active state
          })
        }
      } catch (error) {
        console.error('Failed to load environment workflow:', error)
      }
    }
  }

  const handleCreateEnvironment = (environment: EnvironmentType) => {
    setEnvironmentToCreate(environment)
    setShowCreateDialog(true)
    onCreateEnvironment?.(environment)
  }

  const handleExitEnvironmentView = async () => {
    // Clear the selected environment
    selectEnvironment(null as any)
    
    // Reload the main workflow from the server to get the latest data
    if (workflowId) {
      try {
        const { setWorkflow } = await import('@/stores/workflow').then(m => ({ 
          setWorkflow: m.useWorkflowStore.getState().setWorkflow 
        }))
        const { workflowService } = await import('@/services')
        
        const mainWorkflow = await workflowService.getWorkflow(workflowId)
        setWorkflow(mainWorkflow)
      } catch (error) {
        console.error('Failed to reload main workflow:', error)
        // Fallback to page reload if API call fails
        window.location.reload()
      }
    }
  }

  const getEnvironmentBgColor = (environment: EnvironmentType) => {
    const color = getEnvironmentColor(environment)
    switch (color) {
      case 'blue':
        return 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
      case 'yellow':
        return 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
      case 'green':
        return 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
      default:
        return 'bg-muted hover:bg-muted/80 text-foreground border-border'
    }
  }

  const getStatusBadgeColor = (summary: EnvironmentSummary) => {
    if (!summary.active) return 'bg-muted text-muted-foreground'
    const color = getStatusColor(summary.status)
    switch (color) {
      case 'green':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      case 'blue':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
      case 'red':
        return 'bg-red-500/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const currentSummary = summaries.find(s => s.environment === currentEnvironment)
  const allEnvironments = [
    EnvironmentType.DEVELOPMENT,
    EnvironmentType.STAGING,
    EnvironmentType.PRODUCTION,
  ]
  const existingEnvironments = new Set(summaries.map(s => s.environment))
  const availableToCreate = allEnvironments.filter(env => !existingEnvironments.has(env))

  if (isLoading && summaries.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading environments...</span>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2  ${
            currentSummary ? getEnvironmentBgColor(currentEnvironment!) : 'bg-background'
          }`}
        >
          <EnvironmentIcon iconName={currentSummary ? getEnvironmentIcon(currentEnvironment!) : 'package'} />
          <span className="flex-1 text-left font-medium">
            {currentSummary
              ? getEnvironmentLabel(currentEnvironment!)
              : ''}
          </span>
          {currentSummary && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(currentSummary)}`}>
              v{currentSummary.version}
            </span>
          )}
          <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px] bg-popover">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Workflow Environments
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Exit Environment View Option - Only show if an environment is selected */}
        {currentEnvironment && (
          <>
            <DropdownMenuItem
              onClick={handleExitEnvironmentView}
              className="flex items-center gap-3 py-2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              <span className="font-medium">Exit Environment View</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {summaries.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-1">No environments yet</p>
            <p className="text-xs text-muted-foreground/70 mb-3">
              Create your first environment to get started
            </p>
            {error && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        ) : (
          summaries.map(summary => (
            <DropdownMenuItem
              key={summary.environment}
              onClick={() => handleEnvironmentSelect(summary.environment)}
              className="flex items-center gap-3 py-3 cursor-pointer"
            >
              <EnvironmentIcon iconName={getEnvironmentIcon(summary.environment)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{getEnvironmentLabel(summary.environment)}</span>
                  {currentEnvironment === summary.environment && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">v{summary.version}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{summary.nodeCount} nodes</span>
                  {summary.active && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {showCreateOption && availableToCreate.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Create New Environment
            </DropdownMenuLabel>
            {availableToCreate.map(environment => (
              <DropdownMenuItem
                key={environment}
                onClick={() => handleCreateEnvironment(environment)}
                className="flex items-center gap-3 py-2 text-primary cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <EnvironmentIcon iconName={getEnvironmentIcon(environment)} />
                <span className="font-medium">{getEnvironmentLabel(environment)}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Create Environment Dialog */}
    {environmentToCreate && (
      <CreateEnvironmentDialog
        workflowId={workflowId}
        environment={environmentToCreate}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadSummaries(workflowId)
          setEnvironmentToCreate(null)
        }}
      />
    )}
    </>
  )
}
