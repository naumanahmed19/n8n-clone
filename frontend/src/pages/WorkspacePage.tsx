import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Upload,
  BarChart3,
  Star,
  Share2,
  Tag,
  Folder,
  Info
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useWorkspaceStore } from '@/stores/workspace'
import { WorkflowGrid } from '@/components/workspace/WorkflowGrid'
import { WorkflowList } from '@/components/workspace/WorkflowList'
import { WorkspaceFilters } from '@/components/workspace/WorkspaceFilters'
import { TemplateGallery } from '@/components/workspace/TemplateGallery'
import { WorkspaceAnalytics } from '@/components/workspace/WorkspaceAnalytics'
import { ImportWorkflowModal } from '@/components/workspace/ImportWorkflowModal'
import { BulkActionsBar } from '@/components/workspace/BulkActionsBar'

export const WorkspacePage: React.FC = () => {
  const { user } = useAuthStore()
  const {
    workflows,
    isLoadingWorkflows,
    viewMode,
    selectedWorkflows,
    showFilters,
    showTemplateGallery,
    searchQuery,
    filters,
    loadWorkflows,
    loadAvailableTags,
    loadAvailableCategories,
    loadWorkspaceAnalytics,
    setViewMode,
    setShowFilters,
    setShowTemplateGallery,
    setSearchQuery,
    clearSelection
  } = useWorkspaceStore()

  const [showImportModal, setShowImportModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    loadWorkflows()
    loadAvailableTags()
    loadAvailableCategories()
    loadWorkspaceAnalytics()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    clearSelection()
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 min-h-full">
      {/* Guest Welcome Banner */}
      {user?.id === 'guest' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Welcome, Guest!</h3>
              <p className="text-sm text-blue-700 mt-1">
                You're currently using guest mode. Your workflows won't be saved permanently.{' '}
                <Link to="/login" className="font-medium underline hover:no-underline">
                  Sign in or create an account
                </Link>{' '}
                to save your work and access advanced features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
          <p className="text-gray-600">Manage your workflows, templates, and automation projects</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className="w-4 h-4" />
            <span>Templates</span>
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          <Link to="/workflows/new" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Link>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search workflows, templates, and tags..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 ${
                viewMode === 'grid' 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 ${
                viewMode === 'list' 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <WorkspaceFilters />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedWorkflows.length > 0 && (
        <div className="mb-6">
          <BulkActionsBar />
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {isLoadingWorkflows ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.search ? 'No workflows found' : 'No workflows yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first workflow or exploring templates'
              }
            </p>
            <div className="flex items-center justify-center space-x-3">
              <Link to="/workflows/new" className="btn-primary">
                Create Workflow
              </Link>
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="btn-secondary"
              >
                Browse Templates
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <WorkflowGrid workflows={workflows} />
            ) : (
              <WorkflowList workflows={workflows} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportWorkflowModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showTemplateGallery && (
        <TemplateGallery
          isOpen={showTemplateGallery}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {showAnalytics && (
        <WorkspaceAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  )
}