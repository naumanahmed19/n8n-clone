import { workflowService } from '@/services'
import { useWorkspaceStore } from '@/stores/workspace'
import { Workflow } from '@/types'
import {
    Archive,
    BarChart3,
    Copy,
    Download,
    Edit,
    FileText,
    FolderOpen,
    GitBranch,
    History,
    MoreVertical,
    Pause,
    Play,
    Settings,
    Share2,
    Star,
    Trash2,
    Upload
} from 'lucide-react'
import React, { useState } from 'react'
import { WorkflowSettingsModal } from '../workflow/WorkflowSettingsModal'

interface WorkflowActionsMenuProps {
  workflow: Workflow
  onShare: () => void
  onEdit?: () => void
  onViewExecutions?: () => void
  onViewAnalytics?: () => void
  showAdvancedOptions?: boolean
}

export const WorkflowActionsMenu: React.FC<WorkflowActionsMenuProps> = ({ 
  workflow, 
  onShare,
  onEdit,
  onViewExecutions,
  onViewAnalytics,
  showAdvancedOptions = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const { 
    duplicateWorkflow, 
    deleteWorkflow, 
    exportWorkflow,
    publishAsTemplate,
    refreshWorkflows
  } = useWorkspaceStore()

  const handleDuplicate = async () => {
    try {
      await duplicateWorkflow(workflow.id, `${workflow.name} (Copy)`)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to duplicate workflow:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      try {
        await deleteWorkflow(workflow.id)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to delete workflow:', error)
      }
    }
  }

  const handleExport = async () => {
    try {
      await exportWorkflow(workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to export workflow:', error)
    }
  }

  const handlePublishAsTemplate = async () => {
    try {
      await publishAsTemplate(workflow.id, {
        name: workflow.name,
        description: workflow.description || '',
        category: workflow.category || 'General',
        tags: workflow.tags || []
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to publish as template:', error)
    }
  }

  const handleShare = () => {
    onShare()
    setIsOpen(false)
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      window.open(`/workflows/${workflow.id}`, '_blank')
    }
    setIsOpen(false)
  }

  const handleViewExecutions = () => {
    if (onViewExecutions) {
      onViewExecutions()
    } else {
      window.open(`/workflows/${workflow.id}/executions`, '_blank')
    }
    setIsOpen(false)
  }

  const handleViewAnalytics = () => {
    if (onViewAnalytics) {
      onViewAnalytics()
    } else {
      window.open(`/workflows/${workflow.id}/analytics`, '_blank')
    }
    setIsOpen(false)
  }

  const handleToggleActive = async () => {
    try {
      // This would need to be implemented in the workspace store
      // await toggleWorkflowActive(workflow.id)
      console.log('Toggle workflow active status:', workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to toggle workflow status:', error)
    }
  }

  const handleArchive = async () => {
    if (window.confirm(`Are you sure you want to archive "${workflow.name}"?`)) {
      try {
        // This would need to be implemented in the workspace store
        // await archiveWorkflow(workflow.id)
        console.log('Archive workflow:', workflow.id)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to archive workflow:', error)
      }
    }
  }

  const handleCreateVersion = async () => {
    try {
      // This would need to be implemented in the workspace store
      // await createWorkflowVersion(workflow.id)
      console.log('Create workflow version:', workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create workflow version:', error)
    }
  }

  const handleImportToWorkflow = () => {
    // This would open an import dialog for adding to this workflow
    console.log('Import to workflow:', workflow.id)
    setIsOpen(false)
  }

  const handleAssignCategory = () => {
    setShowSettingsModal(true)
    setIsOpen(false)
  }

  const handleSettingsSave = async (updates: Partial<Workflow>) => {
    try {
      // Extract only the fields that can be updated via the API
      const updateData = {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.tags !== undefined && { tags: updates.tags })
      }
      
      await workflowService.updateWorkflow(workflow.id, updateData)
      await refreshWorkflows() // Refresh the workflow list to show updated category
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to update workflow:', error)
      // You could show an error toast here
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {/* Quick Actions */}
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quick Actions
              </div>
              
              <button
                onClick={handleEdit}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3" />
                Open Editor
              </button>
              
              <button
                onClick={handleToggleActive}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {workflow.active ? (
                  <>
                    <Pause className="w-4 h-4 mr-3" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-3" />
                    Activate
                  </>
                )}
              </button>
              
              <button
                onClick={handleViewExecutions}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <History className="w-4 h-4 mr-3" />
                View Executions
              </button>
              
              <button
                onClick={handleViewAnalytics}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Workflow Management */}
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Management
              </div>
              
              <button
                onClick={handleAssignCategory}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FolderOpen className="w-4 h-4 mr-3" />
                Assign Category
                {workflow.category && (
                  <span className="ml-auto text-xs text-gray-400">
                    {workflow.category}
                  </span>
                )}
              </button>

              <button
                onClick={handleDuplicate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4 mr-3" />
                Duplicate
              </button>
              
              <button
                onClick={handleCreateVersion}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <GitBranch className="w-4 h-4 mr-3" />
                Create Version
              </button>
              
              <button
                onClick={handleImportToWorkflow}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Upload className="w-4 h-4 mr-3" />
                Import Data
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Sharing & Publishing */}
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sharing
              </div>
              
              <button
                onClick={handleShare}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-3" />
                Share Workflow
                <span className="ml-auto text-xs text-gray-400">
                  {workflow.isPublic ? 'Public' : 'Private'}
                </span>
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4 mr-3" />
                Export Workflow
              </button>
              
              <button
                onClick={handlePublishAsTemplate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Star className="w-4 h-4 mr-3" />
                Publish as Template
              </button>

              {showAdvancedOptions && (
                <>
                  <div className="border-t border-gray-100 my-1" />

                  {/* Advanced Actions */}
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advanced
                  </div>
                  
                  <a
                    href={`/workflows/${workflow.id}/settings`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Workflow Settings
                  </a>
                  
                  <a
                    href={`/workflows/${workflow.id}/logs`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    View Logs
                  </a>
                  
                  <button
                    onClick={handleArchive}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Archive className="w-4 h-4 mr-3" />
                    Archive Workflow
                  </button>
                </>
              )}

              <div className="border-t border-gray-100 my-1" />
              
              {/* Danger Zone */}
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete Workflow
              </button>
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <WorkflowSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        workflow={workflow}
        onSave={handleSettingsSave}
      />
    </div>
  )
}