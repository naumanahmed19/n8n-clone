import React, { useState } from 'react'
import { 
  MoreVertical, 
  Copy, 
  Share2, 
  Download, 
  Trash2,
  Edit,
  Play,
  Pause,
  Star,
  Tag,
  Eye,
  History,
  Settings,
  Archive,
  GitBranch,
  FileText,
  Upload,
  AlertTriangle,
  Clock,
  BarChart3,
  Users,
  Lock,
  Unlock,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Calendar,
  Globe,
  Shield,
  Code,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Workflow } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'
import { Link, useNavigate } from 'react-router-dom'

interface EnhancedWorkflowActionsMenuProps {
  workflow: Workflow
  onShare: () => void
  onEdit?: () => void
  onViewExecutions?: () => void
  onViewAnalytics?: () => void
  showAdvancedOptions?: boolean
  compact?: boolean
}

export const EnhancedWorkflowActionsMenu: React.FC<EnhancedWorkflowActionsMenuProps> = ({ 
  workflow, 
  onShare,
  onEdit,
  onViewExecutions,
  onViewAnalytics,
  showAdvancedOptions = true,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const navigate = useNavigate()
  
  const { 
    duplicateWorkflow, 
    deleteWorkflow, 
    exportWorkflow,
    publishAsTemplate 
  } = useWorkspaceStore()

  // All the existing handlers...
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
      navigate(`/workflows/${workflow.id}`)
    }
    setIsOpen(false)
  }

  const handleViewExecutions = () => {
    if (onViewExecutions) {
      onViewExecutions()
    } else {
      navigate(`/workflows/${workflow.id}/executions`)
    }
    setIsOpen(false)
  }

  const handleViewAnalytics = () => {
    if (onViewAnalytics) {
      onViewAnalytics()
    } else {
      navigate(`/workflows/${workflow.id}/analytics`)
    }
    setIsOpen(false)
  }

  const handleToggleActive = async () => {
    try {
      // TODO: Implement in workspace store
      console.log('Toggle workflow active status:', workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to toggle workflow status:', error)
    }
  }

  const handleManualExecution = () => {
    navigate(`/workflows/${workflow.id}/execute`)
    setIsOpen(false)
  }

  const handleScheduleWorkflow = () => {
    navigate(`/workflows/${workflow.id}/schedule`)
    setIsOpen(false)
  }

  const handleViewWebhooks = () => {
    navigate(`/workflows/${workflow.id}/webhooks`)
    setIsOpen(false)
  }

  const handleEditPermissions = () => {
    navigate(`/workflows/${workflow.id}/permissions`)
    setIsOpen(false)
  }

  const handleViewCode = () => {
    navigate(`/workflows/${workflow.id}/code`)
    setIsOpen(false)
  }

  const handleCreateVersion = async () => {
    try {
      // TODO: Implement version creation
      console.log('Create workflow version:', workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create workflow version:', error)
    }
  }

  const handleArchive = async () => {
    if (window.confirm(`Are you sure you want to archive "${workflow.name}"?`)) {
      try {
        // TODO: Implement archive functionality
        console.log('Archive workflow:', workflow.id)
        setIsOpen(false)
      } catch (error) {
        console.error('Failed to archive workflow:', error)
      }
    }
  }

  const handleRefresh = async () => {
    try {
      // TODO: Implement refresh functionality
      console.log('Refresh workflow data:', workflow.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to refresh workflow:', error)
    }
  }

  if (compact) {
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
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button onClick={handleEdit} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Edit className="w-4 h-4 mr-3" />
                  Edit
                </button>
                <button onClick={handleDuplicate} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Copy className="w-4 h-4 mr-3" />
                  Duplicate
                </button>
                <button onClick={handleShare} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Share2 className="w-4 h-4 mr-3" />
                  Share
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={handleDelete} className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="py-1">
              {/* Primary Actions */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Primary Actions
              </div>
              
              <button
                onClick={handleEdit}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3 text-blue-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Open Editor</div>
                  <div className="text-xs text-gray-500">Edit workflow nodes & logic</div>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
              
              <button
                onClick={handleManualExecution}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Zap className="w-4 h-4 mr-3 text-green-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Execute Now</div>
                  <div className="text-xs text-gray-500">Run workflow manually</div>
                </div>
              </button>
              
              <button
                onClick={handleToggleActive}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {workflow.active ? (
                  <>
                    <Pause className="w-4 h-4 mr-3 text-orange-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Deactivate</div>
                      <div className="text-xs text-gray-500">Stop automatic execution</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-3 text-green-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Activate</div>
                      <div className="text-xs text-gray-500">Enable automatic execution</div>
                    </div>
                  </>
                )}
              </button>

              {/* View & Monitor */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-t border-gray-100 mt-1">
                View & Monitor
              </div>
              
              <button
                onClick={handleViewExecutions}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <History className="w-4 h-4 mr-3 text-purple-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Execution History</div>
                  <div className="text-xs text-gray-500">View past runs & results</div>
                </div>
              </button>
              
              <button
                onClick={handleViewAnalytics}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-3 text-indigo-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-gray-500">Performance & metrics</div>
                </div>
              </button>

              <button
                onClick={handleViewWebhooks}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Globe className="w-4 h-4 mr-3 text-teal-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Webhooks</div>
                  <div className="text-xs text-gray-500">Manage webhook URLs</div>
                </div>
              </button>

              {/* Workflow Management */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-t border-gray-100 mt-1">
                Workflow Management
              </div>
              
              <button
                onClick={handleDuplicate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4 mr-3 text-cyan-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Duplicate</div>
                  <div className="text-xs text-gray-500">Create a copy</div>
                </div>
              </button>
              
              <button
                onClick={handleCreateVersion}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <GitBranch className="w-4 h-4 mr-3 text-slate-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Create Version</div>
                  <div className="text-xs text-gray-500">Save current state</div>
                </div>
              </button>

              <button
                onClick={handleScheduleWorkflow}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-3 text-amber-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Schedule</div>
                  <div className="text-xs text-gray-500">Set up triggers & timing</div>
                </div>
              </button>

              {/* Sharing & Export */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-t border-gray-100 mt-1">
                Sharing & Export
              </div>
              
              <button
                onClick={handleShare}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-3 text-blue-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Share Workflow</div>
                  <div className="text-xs text-gray-500">
                    {workflow.isPublic ? 'Currently public' : 'Currently private'}
                  </div>
                </div>
                {workflow.isPublic && <Globe className="w-3 h-3 text-green-500" />}
              </button>

              <button
                onClick={handleEditPermissions}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-4 h-4 mr-3 text-emerald-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Permissions</div>
                  <div className="text-xs text-gray-500">Manage access & roles</div>
                </div>
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4 mr-3 text-gray-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Export</div>
                  <div className="text-xs text-gray-500">Download as JSON file</div>
                </div>
              </button>
              
              <button
                onClick={handlePublishAsTemplate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Star className="w-4 h-4 mr-3 text-yellow-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Publish as Template</div>
                  <div className="text-xs text-gray-500">Share with community</div>
                </div>
              </button>

              {showAdvancedOptions && (
                <>
                  {/* Advanced & System */}
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-t border-gray-100 mt-1">
                    Advanced
                  </div>
                  
                  <Link
                    to={`/workflows/${workflow.id}/settings`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Settings</div>
                      <div className="text-xs text-gray-500">Configure workflow options</div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </Link>

                  <button
                    onClick={handleViewCode}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Code className="w-4 h-4 mr-3 text-slate-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">View Code</div>
                      <div className="text-xs text-gray-500">See JSON definition</div>
                    </div>
                  </button>
                  
                  <Link
                    to={`/workflows/${workflow.id}/logs`}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileText className="w-4 h-4 mr-3 text-orange-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">View Logs</div>
                      <div className="text-xs text-gray-500">System & execution logs</div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </Link>

                  <button
                    onClick={handleRefresh}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-3 text-blue-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Refresh Data</div>
                      <div className="text-xs text-gray-500">Reload workflow state</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleArchive}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Archive className="w-4 h-4 mr-3 text-amber-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Archive</div>
                      <div className="text-xs text-gray-500">Move to archive</div>
                    </div>
                  </button>
                </>
              )}

              {/* Danger Zone */}
              <div className="px-3 py-2 text-xs font-medium text-red-600 uppercase tracking-wider border-b border-t border-red-100 mt-1">
                Danger Zone
              </div>
              
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3 text-red-500" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Delete Workflow</div>
                  <div className="text-xs text-red-500">Permanently remove</div>
                </div>
                <AlertTriangle className="w-3 h-3 text-red-500" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}