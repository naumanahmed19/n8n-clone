import React, { useState } from 'react'
import { 
  Play, 
  Pause, 
  MoreVertical, 
  Copy, 
  Share2, 
  Download, 
  Trash2,
  Tag,
  Calendar,
  Activity,
  Users,
  Eye,
  Edit
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Workflow } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'
// import { WorkflowActionsMenu } from './WorkflowActionsMenu'
// import { ShareWorkflowModal } from './ShareWorkflowModal'

interface WorkflowGridProps {
  workflows: Workflow[]
}

export const WorkflowGrid: React.FC<WorkflowGridProps> = ({ workflows }) => {
  const { selectedWorkflows, toggleWorkflowSelection } = useWorkspaceStore()
  // const [shareModalWorkflow, setShareModalWorkflow] = useState<Workflow | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (active: boolean) => {
    return active ? 'Active' : 'Inactive'
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
              selectedWorkflows.includes(workflow.id)
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="p-4 pb-0">
              <div className="flex items-start justify-between">
                <input
                  type="checkbox"
                  checked={selectedWorkflows.includes(workflow.id)}
                  onChange={() => toggleWorkflowSelection(workflow.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {/* <WorkflowActionsMenu 
                  workflow={workflow}
                  onShare={() => setShareModalWorkflow(workflow)}
                /> */}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pt-2">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="block group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {workflow.name}
                    </h3>
                  </Link>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {workflow.description}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.active)}`}>
                  {getStatusText(workflow.active)}
                </span>
              </div>

              {/* Tags */}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {workflow.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {workflow.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{workflow.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Analytics */}
              {workflow.analytics && (
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      {workflow.analytics.totalExecutions}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {workflow.analytics.lastExecutedAt 
                        ? formatDate(workflow.analytics.lastExecutedAt)
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Sharing indicator */}
              {workflow.sharedWith && workflow.sharedWith.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Shared with {workflow.sharedWith.length} user{workflow.sharedWith.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span>{workflow.nodes?.length || 0} nodes</span>
                <span>Updated {formatDate(workflow.updatedAt)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <div className="flex items-center space-x-2">
                <Link
                  to={`/workflows/${workflow.id}/edit`}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
                <Link
                  to={`/workflows/${workflow.id}/executions`}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {/* {shareModalWorkflow && (
        <ShareWorkflowModal
          workflow={shareModalWorkflow}
          isOpen={!!shareModalWorkflow}
          onClose={() => setShareModalWorkflow(null)}
        />
      )} */}
    </>
  )
}