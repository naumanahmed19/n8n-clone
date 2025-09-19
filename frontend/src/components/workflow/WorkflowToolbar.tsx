
import { 
  Save, 
  Undo, 
  Redo, 
  Play, 
  Square, 
  CheckCircle, 
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { clsx } from 'clsx'

interface WorkflowToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onValidate: () => void
  onExecute?: () => void
  onStop?: () => void
  onExport?: () => void
  onImport?: () => void
  isExecuting?: boolean
  isSaving?: boolean
}

export function WorkflowToolbar({
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
  isSaving = false
}: WorkflowToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left section - Edit actions */}
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

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Save (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Center section - Execution controls */}
      <div className="flex items-center space-x-2">
        {!isExecuting ? (
          <button
            onClick={onExecute}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="Execute workflow"
          >
            <Play className="w-4 h-4" />
            <span>Execute</span>
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            title="Stop execution"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
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

      {/* Right section - Additional actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onImport}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Import workflow"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={onExport}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Export workflow"
        >
          <Download className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Workflow settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}