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
  Eye
} from 'lucide-react'
import { Workflow } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'

interface WorkflowActionsMenuProps {
  workflow: Workflow
  onShare: () => void
}

export const WorkflowActionsMenu: React.FC<WorkflowActionsMenuProps> = ({ 
  workflow, 
  onShare 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    duplicateWorkflow, 
    deleteWorkflow, 
    exportWorkflow,
    publishAsTemplate 
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
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={handleDuplicate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4 mr-3" />
                Duplicate
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-3" />
                Share
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4 mr-3" />
                Export
              </button>
              
              <button
                onClick={handlePublishAsTemplate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Star className="w-4 h-4 mr-3" />
                Publish as Template
              </button>
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
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