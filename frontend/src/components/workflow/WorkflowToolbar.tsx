
import React from 'react'
import { 
  Save, 
  Undo, 
  Redo, 
  Play, 
  Square, 
  CheckCircle, 
  Settings,
  Download,
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { TitleManager } from './TitleManager'
import { ExecutionState } from '@/types/workflow'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { validateImportFile } from '@/utils/errorHandling'
import { getUserFriendlyErrorMessage } from '@/utils/errorHandling'

interface WorkflowToolbarProps {
  // Existing props
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onValidate: () => void
  onExecute?: () => void
  onStop?: () => void
  onExport?: () => void
  onImport?: (file: File) => void
  isExecuting?: boolean
  isSaving?: boolean
  isDirty?: boolean
  
  // New title management props
  workflowTitle?: string
  onTitleChange?: (title: string) => void
  onTitleSave?: (title: string) => void
  isTitleDirty?: boolean
  titleValidationError?: string | null
  
  // New import/export props
  isExporting?: boolean
  isImporting?: boolean
  exportProgress?: number
  importProgress?: number
  exportError?: string | null
  importError?: string | null
  onClearImportExportErrors?: () => void
  
  // New execution props
  executionState?: ExecutionState
  onStopExecution?: () => void
  
  // Error handling props
  onShowError?: (error: string) => void
  onShowSuccess?: (message: string) => void
}

export function WorkflowToolbar({
  // Existing props
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onValidate,
  onExecute,
  onStop,
  onExport,
  onImport,
  isExecuting = false,
  isSaving = false,
  isDirty = false,
  
  // New title management props
  workflowTitle = 'Untitled Workflow',
  onTitleChange = () => {},
  onTitleSave = () => {},
  isTitleDirty = false,
  titleValidationError = null,
  
  // New import/export props
  isExporting = false,
  isImporting = false,
  exportProgress = 0,
  importProgress = 0,
  exportError = null,
  importError = null,
  onClearImportExportErrors,
  
  // New execution props
  executionState,
  onStopExecution,
  
  // Error handling props
  onShowError,
  onShowSuccess
}: WorkflowToolbarProps) {
  const { showConfirm, ConfirmDialog } = useConfirmDialog()
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
          if (onShowError) {
            onShowError(`Invalid file: ${validationErrors[0].message}`)
          }
          return
        }

        // Show confirmation if there are unsaved changes
        if ((isDirty || isTitleDirty) && onImport) {
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

        if (onImport) {
          onImport(file)
        }
      } catch (error) {
        if (onShowError) {
          onShowError(`Import failed: ${getUserFriendlyErrorMessage(error)}`)
        }
      }
    }
    input.click()
  }

  const handleExportClick = () => {
    if (isExporting || !onExport) return
    
    // Clear any previous errors
    if (onClearImportExportErrors) {
      onClearImportExportErrors()
    }
    
    onExport()
  }

  const handleExecuteClick = () => {
    if (isExecuting || !onExecute) return
    
    onExecute()
  }

  const handleStopClick = async () => {
    if (currentExecutionStatus !== 'running' && !isExecuting) return
    
    // Show confirmation for stopping execution
    const confirmed = await showConfirm({
      title: 'Stop Execution',
      message: 'Are you sure you want to stop the workflow execution?',
      details: [
        'The execution will be cancelled immediately',
        'Any progress will be lost',
        'This action cannot be undone'
      ],
      confirmText: 'Stop Execution',
      cancelText: 'Continue Running',
      severity: 'warning'
    })

    if (!confirmed) return

    if (onStopExecution) {
      onStopExecution()
    } else if (onStop) {
      onStop()
    }
  }

  // Determine execution status
  const currentExecutionStatus = executionState?.status || (isExecuting ? 'running' : 'idle')
  const executionProgress = executionState?.progress || 0
  const executionError = executionState?.error

  // Show error notifications
  React.useEffect(() => {
    if (exportError && onShowError) {
      onShowError(`Export failed: ${exportError}`)
    }
  }, [exportError, onShowError])

  React.useEffect(() => {
    if (importError && onShowError) {
      onShowError(`Import failed: ${importError}`)
    }
  }, [importError, onShowError])

  React.useEffect(() => {
    if (executionError && onShowError) {
      onShowError(`Execution failed: ${executionError}`)
    }
  }, [executionError, onShowError])

  // Show success notifications
  React.useEffect(() => {
    if (exportProgress === 100 && !exportError && onShowSuccess) {
      onShowSuccess('Workflow exported successfully')
    }
  }, [exportProgress, exportError, onShowSuccess])

  React.useEffect(() => {
    if (importProgress === 100 && !importError && onShowSuccess) {
      onShowSuccess('Workflow imported successfully')
    }
  }, [importProgress, importError, onShowSuccess])

  React.useEffect(() => {
    if (currentExecutionStatus === 'success' && onShowSuccess) {
      onShowSuccess('Workflow executed successfully')
    }
  }, [currentExecutionStatus, onShowSuccess])

  return (
    <>
      <ConfirmDialog />
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left section - Title and Edit actions */}
      <div className="flex items-center space-x-4">
        {/* Title Manager */}
        <TitleManager
          title={workflowTitle}
          onChange={onTitleChange}
          onSave={onTitleSave}
          isDirty={isTitleDirty}
          validationError={titleValidationError}
          placeholder="Untitled Workflow"
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
            onClick={onSave}
            disabled={isSaving || (!isDirty && !isTitleDirty)}
            className={clsx(
              "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
              (isDirty || isTitleDirty) && !isSaving
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
            title={`Save (Ctrl+S)${(isDirty || isTitleDirty) ? ' - Unsaved changes' : ' - No changes'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
            {(isDirty || isTitleDirty) && !isSaving && (
              <span className="w-2 h-2 bg-orange-400 rounded-full ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Center section - Execution controls */}
      <div className="flex items-center space-x-2">
        {/* Execution button with status */}
        {(currentExecutionStatus === 'running' || isExecuting) ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStopClick}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              title="Stop execution"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
            
            {/* Progress indicator */}
            {executionProgress > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${executionProgress}%` }}
                  />
                </div>
                <span>{Math.round(executionProgress)}%</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleExecuteClick}
            disabled={isExecuting}
            className={clsx(
              "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
              currentExecutionStatus === 'success'
                ? "bg-green-600 text-white hover:bg-green-700"
                : currentExecutionStatus === 'error'
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            )}
            title={
              currentExecutionStatus === 'success' 
                ? "Execute workflow (last execution successful)"
                : currentExecutionStatus === 'error'
                ? "Execute workflow (last execution failed)"
                : "Execute workflow"
            }
          >
            {currentExecutionStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : currentExecutionStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>Execute</span>
          </button>
        )}

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

        <button
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