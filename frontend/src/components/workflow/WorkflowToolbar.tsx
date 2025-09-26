
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { validateImportFile } from '@/utils/errorHandling'
import {
  AlertCircle,
  CheckCircle,
  Download,
  History,
  Home,
  Loader2,
  MoreHorizontal,
  PanelRight,
  Plus,
  Redo,
  Save,
  Settings,
  Undo,
  Upload
} from 'lucide-react'
import { useState } from 'react'
import { WorkflowBreadcrumb } from './WorkflowBreadcrumb'
import { WorkflowSettingsModal } from './WorkflowSettingsModal'

interface WorkflowToolbarProps {
  // Minimal props - mainly for workflow operations that need main workflow store
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onValidate: () => void
}

export function WorkflowToolbar({
  // Minimal props - mainly for workflow operations that need main workflow store
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onValidate,
}: WorkflowToolbarProps) {
  const { showConfirm, ConfirmDialog } = useConfirmDialog()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
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
    showExecutionsPanel,
    showNodePalette,
    isSaving,
    toggleExecutionsPanel,
    toggleNodePalette,
    setSaving,
    
    // Workflow activation state
    isWorkflowActive,
    toggleWorkflowActive,
    
    // Execution state (display only)
    workflowExecutions,
    
    // Error handling
    handleError
  } = useWorkflowToolbarStore()

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
      <header className="flex items-center justify-between px-4 py-3 bg-background border-b border-border shadow-sm min-h-[60px]">
        {/* Left section - Home, Breadcrumb and Edit actions */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Home Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to Home</p>
            </TooltipContent>
          </Tooltip>

          {/* New Workflow Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = '/workflows/new'}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create New Workflow</p>
            </TooltipContent>
          </Tooltip>

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

          <Separator orientation="vertical" className="h-6" />

          {/* Edit actions */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <Undo className="h-4 w-4" />
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
                  size="icon"
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>
      </div>

      {/* Center section - Execution controls */}
      <div className="flex items-center space-x-3 mr-6">
        {/* Workflow Activation Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleWorkflowActive}
              variant={isWorkflowActive ? "default" : "secondary"}
              size="sm"
              className={cn(
                "relative",
                isWorkflowActive 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-muted"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                isWorkflowActive ? "bg-green-200" : "bg-muted-foreground"
              )} />
              {isWorkflowActive ? 'Active' : 'Inactive'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isWorkflowActive ? "Deactivate workflow (disable execution)" : "Activate workflow (enable execution)"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Executions History Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleExecutionsPanel}
              variant={showExecutionsPanel ? "default" : "outline"}
              size="sm"
              className={cn(
                "relative",
                showExecutionsPanel 
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              )}
            >
              <History className="h-4 w-4 mr-2" />
              Executions
              {workflowExecutions && workflowExecutions.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[1.25rem] text-xs">
                  {workflowExecutions.length > 99 ? '99+' : workflowExecutions.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showExecutionsPanel ? "Hide executions history" : "Show executions history"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onValidate}
              variant="outline"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Validate workflow</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right section - Save, Node Palette and Settings Menu */}
      <div className="flex items-center space-x-3">
        {/* Save Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!isDirty && !mainTitleDirty)}
              variant={(isDirty || mainTitleDirty) && !isSaving ? "default" : "secondary"}
              size="sm"
              className="relative"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">{isSaving ? 'Saving...' : 'Save'}</span>
              {(isDirty || mainTitleDirty) && !isSaving && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save (Ctrl+S){(isDirty || mainTitleDirty) ? ' - Unsaved changes' : ' - No changes'}</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Node Palette Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleNodePalette}
              variant={showNodePalette ? "default" : "ghost"}
              size="icon"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showNodePalette ? "Hide node palette" : "Show node palette"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Settings Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Workflow Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleImportClick}
              disabled={isImporting || isExporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : importError ? (
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
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
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : exportError ? (
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
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