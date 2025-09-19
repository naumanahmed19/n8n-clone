import React, { useState } from 'react'
import { 
  X, 
  Trash2, 
  Download, 
  Share2, 
  Tag, 
  Play, 
  Pause,
  Copy,
  Archive
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'

export const BulkActionsBar: React.FC = () => {
  const {
    selectedWorkflows,
    workflows,
    clearSelection,
    deleteWorkflow,
    exportWorkflow
  } = useWorkspaceStore()

  const [isLoading, setIsLoading] = useState(false)

  const selectedWorkflowObjects = workflows.filter(w => 
    selectedWorkflows.includes(w.id)
  )

  const handleBulkDelete = async () => {
    const count = selectedWorkflows.length
    const confirmMessage = `Are you sure you want to delete ${count} workflow${count > 1 ? 's' : ''}? This action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) return

    setIsLoading(true)
    try {
      await Promise.all(
        selectedWorkflows.map(id => deleteWorkflow(id))
      )
      clearSelection()
    } catch (error) {
      console.error('Failed to delete workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkExport = async () => {
    setIsLoading(true)
    try {
      await Promise.all(
        selectedWorkflows.map(id => exportWorkflow(id))
      )
    } catch (error) {
      console.error('Failed to export workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDuplicate = async () => {
    setIsLoading(true)
    try {
      // Implementation would go here
      console.log('Bulk duplicate not implemented yet')
    } catch (error) {
      console.error('Failed to duplicate workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkActivate = async () => {
    setIsLoading(true)
    try {
      // Implementation would go here
      console.log('Bulk activate not implemented yet')
    } catch (error) {
      console.error('Failed to activate workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDeactivate = async () => {
    setIsLoading(true)
    try {
      // Implementation would go here
      console.log('Bulk deactivate not implemented yet')
    } catch (error) {
      console.error('Failed to deactivate workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeCount = selectedWorkflowObjects.filter(w => w.active).length
  const inactiveCount = selectedWorkflowObjects.length - activeCount

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-primary-900">
              {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-primary-600 hover:text-primary-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {selectedWorkflowObjects.length > 0 && (
            <div className="text-sm text-primary-700">
              {activeCount > 0 && <span>{activeCount} active</span>}
              {activeCount > 0 && inactiveCount > 0 && <span>, </span>}
              {inactiveCount > 0 && <span>{inactiveCount} inactive</span>}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {inactiveCount > 0 && (
            <button
              onClick={handleBulkActivate}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Activate</span>
            </button>
          )}
          
          {activeCount > 0 && (
            <button
              onClick={handleBulkDeactivate}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              <span>Deactivate</span>
            </button>
          )}
          
          <button
            onClick={handleBulkDuplicate}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
          </button>
          
          <button
            onClick={handleBulkExport}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}