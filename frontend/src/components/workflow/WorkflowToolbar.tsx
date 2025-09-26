
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useWorkflowStore, useWorkflowToolbarStore } from '@/stores'
import { validateImportFile } from '@/utils/errorHandling'
import { clsx } from 'clsx'
import {
    AlertCircle,
    CheckCircle,
    Download,
    History,
    Loader2,
    PanelRight,
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
    <>
      <ConfirmDialog />
      {workflow && (
        <WorkflowSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          workflow={workflow}
          onSave={handleWorkflowSettingsSave}
        />
      )}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left section - Breadcrumb and Edit actions */}
      <div className="flex items-center space-x-4">
        {/* Workflow Breadcrumb */}
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
          className="min-w-0" // Allow shrinking
        />

        <div className="w-px h-6 bg-gray-300" />

        {/* Edit actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={clsx(
              'p-2 rounded-md transition-colors',
              canUndo
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={clsx(
              'p-2 rounded-md transition-colors',
              canRedo
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || (!isDirty && !mainTitleDirty)}
            className={clsx(
              "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
              (isDirty || mainTitleDirty) && !isSaving
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
            title={`Save (Ctrl+S)${(isDirty || mainTitleDirty) ? ' - Unsaved changes' : ' - No changes'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
            {(isDirty || mainTitleDirty) && !isSaving && (
              <span className="w-2 h-2 bg-orange-400 rounded-full ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Center section - Execution controls */}
      <div className="flex items-center space-x-2">
        {/* Workflow Status Indicator */}
        {!isWorkflowActive && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-xs font-medium">Test Mode Only</span>
          </div>
        )}
        {/* Execution has been moved to individual node toolbar buttons */}
        {/* Workflow Activation Toggle */}
        <button
          onClick={toggleWorkflowActive}
          className={clsx(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            isWorkflowActive
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          )}
          title={isWorkflowActive ? "Deactivate workflow (disable execution)" : "Activate workflow (enable execution)"}
        >
          <div className={clsx(
            "w-2 h-2 rounded-full",
            isWorkflowActive ? "bg-green-300" : "bg-gray-300"
          )} />
          <span>{isWorkflowActive ? 'Active' : 'Inactive'}</span>
        </button>

        {/* Executions History Toggle */}
        <button
          onClick={toggleExecutionsPanel}
          className={clsx(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            showExecutionsPanel
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
          title={showExecutionsPanel ? "Hide executions history" : "Show executions history"}
        >
          <History className="w-4 h-4" />
          <span>Executions</span>
          {workflowExecutions && workflowExecutions.length > 0 && (
            <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
              {workflowExecutions.length > 99 ? '99+' : workflowExecutions.length}
            </span>
          )}
        </button>

        <button
          onClick={onValidate}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          title="Validate workflow"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Validate</span>
        </button>
      </div>

      {/* Right section - Import/Export and Settings */}
      <div className="flex items-center space-x-2">
        {/* Import button with progress */}
        <div className="relative">
          <button
            onClick={handleImportClick}
            disabled={isImporting || isExporting}
            className={clsx(
              "flex items-center space-x-2 p-2 rounded-md transition-colors",
              isImporting
                ? "text-blue-600 bg-blue-50"
                : importError
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-100"
            )}
            title={
              isImporting 
                ? "Importing workflow..." 
                : importError 
                ? `Import failed: ${importError}`
                : "Import workflow"
            }
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : importError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isImporting && importProgress > 0 && (
              <span className="text-xs">{Math.round(importProgress)}%</span>
            )}
          </button>
          
          {/* Import progress bar */}
          {isImporting && importProgress > 0 && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Export button with progress */}
        <div className="relative">
          <button
            onClick={handleExportClick}
            disabled={isExporting || isImporting}
            className={clsx(
              "flex items-center space-x-2 p-2 rounded-md transition-colors",
              isExporting
                ? "text-blue-600 bg-blue-50"
                : exportError
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-100"
            )}
            title={
              isExporting 
                ? "Exporting workflow..." 
                : exportError 
                ? `Export failed: ${exportError}`
                : "Export workflow"
            }
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting && exportProgress > 0 && (
              <span className="text-xs">{Math.round(exportProgress)}%</span>
            )}
          </button>
          
          {/* Export progress bar */}
          {isExporting && exportProgress > 0 && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Node Palette Toggle */}
        <button
          onClick={toggleNodePalette}
          className={clsx(
            "flex items-center space-x-2 p-2 rounded-md transition-colors",
            showNodePalette
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          )}
          title={showNodePalette ? "Hide node palette" : "Show node palette"}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Workflow settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
    </>
  )
}