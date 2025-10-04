
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAddNodeDialogStore, useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { validateImportFile } from '@/utils/errorHandling'
import {
  AlertCircle,
  Download,
  Loader2,
  MoreHorizontal,
  Redo,
  Save,
  Settings,
  Terminal,
  Undo,
  Upload
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { WorkflowBreadcrumb } from './WorkflowBreadcrumb'
import { WorkflowExecuteButton } from './WorkflowExecuteButton'
import { WorkflowSettingsModal } from './WorkflowSettingsModal'

interface WorkflowToolbarProps {
  // Minimal props - mainly for workflow operations that need main workflow store
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
}

export function WorkflowToolbar({
  // Minimal props - mainly for workflow operations that need main workflow store
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
}: WorkflowToolbarProps) {
  const { showConfirm, ConfirmDialog } = useConfirmDialog()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // Add Node Dialog store
  const { openDialog } = useAddNodeDialogStore()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        openDialog()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openDialog])
  
  // Get main workflow store for title synchronization, import/export, AND isDirty state
  const { 
    workflow,
    workflowTitle: mainWorkflowTitle,
    updateTitle: updateWorkflowTitle,
    isTitleDirty: mainTitleDirty,
    exportWorkflow: mainExportWorkflow,
    importWorkflow: mainImportWorkflow,
    isDirty, // Use isDirty from main workflow store
    setDirty,
    updateWorkflow
  } = useWorkflowStore()
  
  // Get toolbar state from the dedicated store (excluding isDirty which comes from main store)
  const {    
    // Import/Export state
    isExporting,
    isImporting,
    exportProgress,
    importProgress,
    exportError,
    importError,
    exportWorkflow,
    importWorkflow,
    clearImportExportErrors,
    
    // UI state
    isSaving,
    setSaving,
    
    // Error handling
    handleError
  } = useWorkflowToolbarStore()
  
  // Get workflow activation state directly from workflow
  const isWorkflowActive = workflow?.active ?? false

  // Helper functions
  const handleImportClick = async () => {
    if (isImporting) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.workflow'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        // Validate file before proceeding
        const validationErrors = validateImportFile(file)
        if (validationErrors.length > 0) {
          handleError(new Error(`Invalid file: ${validationErrors[0].message}`), 'import')
          return
        }

        // Show confirmation if there are unsaved changes
        if ((isDirty || mainTitleDirty)) {
          const confirmed = await showConfirm({
            title: 'Import Workflow',
            message: 'You have unsaved changes. Importing a workflow will overwrite your current work.',
            details: [
              'All unsaved changes will be lost',
              'This action cannot be undone'
            ],
            confirmText: 'Import Anyway',
            cancelText: 'Cancel',
            severity: 'warning'
          })

          if (!confirmed) return
        }

        await importWorkflow(file, mainImportWorkflow)
      } catch (error) {
        handleError(error, 'import')
      }
    }
    input.click()
  }

  const handleExportClick = async () => {
    if (isExporting) return
    
    // Clear any previous errors
    clearImportExportErrors()
    
    try {
      await exportWorkflow(mainExportWorkflow)
    } catch (error) {
      handleError(error, 'export')
    }
  }

  const handleTitleChange = (title: string) => {
    updateWorkflowTitle(title)
    setDirty(true) // Mark workflow as dirty when title changes
  }



  const handleSave = () => {
    setSaving(true)
    try {
      onSave()
    } finally {
      setSaving(false)
    }
  }

  const handleWorkflowSettingsSave = async (updates: { name?: string; description?: string; category?: string; tags?: string[] }) => {
    if (workflow) {
      updateWorkflow(updates)
      setDirty(true)
      // The actual save will happen when the user clicks the main Save button
    }
  }

  const handleExecuteWorkflow = async (triggerNodeId?: string) => {
    if (!workflow) return
    
    try {
      // If workflow is not saved (has unsaved changes), save it first
      if (isDirty || mainTitleDirty) {
        await handleSave()
        // Wait a moment for save to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Execute the workflow using the workflow store's executeNode method
      const { executeNode } = useWorkflowStore.getState()
      await executeNode(triggerNodeId || workflow.nodes.find(n => 
        n.type.includes('trigger') || 
        ['manual-trigger', 'webhook-trigger', 'schedule-trigger'].includes(n.type)
      )?.id || '', undefined, 'workflow')
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  return (
    <TooltipProvider>
      <ConfirmDialog />
      {workflow && (
        <WorkflowSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          workflow={workflow}
          onSave={handleWorkflowSettingsSave}
        />
      )}
      <header className="flex items-center px-3 py-1.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 shadow-sm min-h-[48px]">
        {/* Left section - Sidebar trigger, Home, Breadcrumb and Edit actions */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Sidebar Trigger - only show when sidebar is available */}
          <SidebarTrigger className="-ml-1 h-7 w-7" />

          {/* Workflow Breadcrumb */}
          <div className="flex-shrink-0">
            <WorkflowBreadcrumb
              category={workflow?.category}
              title={mainWorkflowTitle}
              onCategoryChange={(category) => {
                if (workflow) {
                  updateWorkflow({ category })
                  setDirty(true)
                }
              }}
              onTitleChange={handleTitleChange}
            />
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* Edit actions */}
          <div className="flex items-center space-x-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-7 w-7 p-0"
                >
                  <Undo className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-7 w-7 p-0"
                >
                  <Redo className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>

      </div>

      {/* Center section - Command Palette and Execute Button */}
      <div className="flex items-center justify-center space-x-2">
          {/* Execute Button */}
          <WorkflowExecuteButton 
            onExecute={handleExecuteWorkflow}
            disabled={isSaving}
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => openDialog()}
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                Add Node
                <kbd className="ml-2 pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a node (⌘K)</p>
            </TooltipContent>
          </Tooltip>
      </div>

      {/* Right section - All controls */}
      <div className="flex items-center space-x-2 flex-1 justify-end">
        {/* Workflow Activation Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                if (workflow) {
                  updateWorkflow({ active: !isWorkflowActive })
                  setDirty(true)
                }
              }}
              variant={isWorkflowActive ? "default" : "secondary"}
              size="sm"
              className={cn(
                "relative h-7 px-2.5 text-xs",
                isWorkflowActive 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-muted"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                isWorkflowActive ? "bg-green-200" : "bg-muted-foreground"
              )} />
              {isWorkflowActive ? 'Active' : 'Inactive'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isWorkflowActive ? "Deactivate workflow (disable execution)" : "Activate workflow (enable execution)"}</p>
          </TooltipContent>
        </Tooltip>

   
        {/* Save Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!isDirty && !mainTitleDirty)}
              variant={(isDirty || mainTitleDirty) && !isSaving ? "default" : "secondary"}
              size="sm"
              className="relative h-7 px-2.5 text-xs"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="ml-1.5">{isSaving ? 'Saving...' : 'Save'}</span>
              {(isDirty || mainTitleDirty) && !isSaving && (
                <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 p-0" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save (Ctrl+S){(isDirty || mainTitleDirty) ? ' - Unsaved changes' : ' - No changes'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Settings Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowSettingsModal(true)} className="text-xs">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Workflow Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleImportClick}
              disabled={isImporting || isExporting}
              className="text-xs"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : importError ? (
                <AlertCircle className="mr-2 h-3.5 w-3.5 text-red-500" />
              ) : (
                <Upload className="mr-2 h-3.5 w-3.5" />
              )}
              {isImporting 
                ? `Importing... ${importProgress > 0 ? `(${Math.round(importProgress)}%)` : ''}`
                : importError 
                ? 'Import Failed'
                : 'Import Workflow'
              }
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleExportClick}
              disabled={isExporting || isImporting}
              className="text-xs"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : exportError ? (
                <AlertCircle className="mr-2 h-3.5 w-3.5 text-red-500" />
              ) : (
                <Download className="mr-2 h-3.5 w-3.5" />
              )}
              {isExporting 
                ? `Exporting... ${exportProgress > 0 ? `(${Math.round(exportProgress)}%)` : ''}`
                : exportError 
                ? 'Export Failed'
                : 'Export Workflow'
              }
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </header>
    </TooltipProvider>
  )
}