import { cn } from '@/lib/utils'
import { useAddNodeDialogStore, useWorkflowStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { WorkflowExecuteButton } from './WorkflowExecuteButton'

interface WorkflowControlsProps {
  children?: ReactNode
  className?: string
  showAddNode?: boolean
  showExecute?: boolean
}

export function WorkflowControls({ children, className, showAddNode = true, showExecute = true }: WorkflowControlsProps) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow()
  const { openDialog } = useAddNodeDialogStore()
  const { workflow } = useWorkflowStore()
  const [isSaving] = useState(false)

  const handleAddNode = () => {
    // Calculate center of viewport
    const viewportCenter = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    
    // Open add node dialog at center
    openDialog(viewportCenter)
  }

  const handleExecuteWorkflow = async (triggerNodeId?: string) => {
    if (!workflow) return
    
    try {
      // If workflow is not saved (has unsaved changes), we'll execute anyway
      // The toolbar handles the save logic before execution
      
      // Execute the workflow using the workflow store's executeNode method
      const { executeNode } = useWorkflowStore.getState()
      await executeNode(triggerNodeId || workflow.nodes.find(n => 
        n.type.includes('trigger') || 
        ['manual-trigger', 'webhook-trigger', 'schedule-trigger', 'workflow-called'].includes(n.type)
      )?.id || '', undefined, 'workflow')
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  return (
    <div
      className={cn(
        'absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card px-1.5 py-1.5 shadow-lg',
        className
      )}
    >
      {/* Execute Button */}
      {showExecute && (
        <>
          <WorkflowExecuteButton 
            onExecute={handleExecuteWorkflow}
            disabled={isSaving}
          />
          <div className="mx-1 h-6 w-px bg-border" />
        </>
      )}

      {/* Add Node */}
      {showAddNode && (
        <button
          onClick={handleAddNode}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          title="Add Node"
          aria-label="Add Node"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {/* Divider */}
      {showAddNode && (
        <div className="mx-1 h-6 w-px bg-border" />
      )}

      {/* Zoom Out */}
      <button
        onClick={() => zoomOut()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Zoom In */}
      <button
        onClick={() => zoomIn()}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Fit View */}
      <button
        onClick={() => fitView({ padding: 0.1 })}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        title="Fit View"
        aria-label="Fit View"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* Divider if there are children */}
      {children && (
        <div className="mx-1 h-6 w-px bg-border" />
      )}

      {/* Custom Controls (like AddAnnotationControl) */}
      {children}
    </div>
  )
}

// Individual control button component for consistency
interface ControlButtonProps {
  onClick: () => void
  title: string
  icon: ReactNode
  className?: string
}

export function WorkflowControlButton({ onClick, title, icon, className }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  )
}
