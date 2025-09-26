import { useWorkspaceStore } from '@/stores/workspace'
import { Workflow } from '@/types'
import {
    Activity,
    Calendar,
    Edit,
    Eye,
    FolderOpen,
    Tag,
    Users
} from 'lucide-react'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShareWorkflowModal } from './ShareWorkflowModal'
import { WorkflowActionsMenu } from './WorkflowActionsMenu'

interface WorkflowListProps {
  workflows: Workflow[]
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ workflows }) => {
  const { selectedWorkflows, toggleWorkflowSelection } = useWorkspaceStore()
  const [shareModalWorkflow, setShareModalWorkflow] = useState<Workflow | null>(null)

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
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Select all visible workflows
                        workflows.forEach(workflow => {
                          if (!selectedWorkflows.includes(workflow.id)) {
                            toggleWorkflowSelection(workflow.id)
                          }
                        })
                      } else {
                        // Deselect all visible workflows
                        workflows.forEach(workflow => {
                          if (selectedWorkflows.includes(workflow.id)) {
                            toggleWorkflowSelection(workflow.id)
                          }
                        })
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sharing
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  className={`hover:bg-gray-50 ${
                    selectedWorkflows.includes(workflow.id) ? 'bg-primary-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.includes(workflow.id)}
                      onChange={() => toggleWorkflowSelection(workflow.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/workflows/${workflow.id}`}
                          className="block group"
                        >
                          <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                            {workflow.name}
                          </div>
                          {workflow.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {workflow.description}
                            </div>
                          )}
                        </Link>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workflow.active)}`}>
                      {getStatusText(workflow.active)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workflow.category ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        <FolderOpen className="w-3 h-3 mr-1" />
                        {workflow.category}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No category</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags && workflow.tags.length > 0 ? (
                        <>
                          {workflow.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {workflow.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{workflow.tags.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No tags</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workflow.analytics ? (
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{workflow.analytics.totalExecutions}</span>
                        <span className="text-gray-400 ml-1">
                          ({workflow.analytics.successfulExecutions} success)
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.analytics?.lastExecutedAt ? (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(workflow.analytics.lastExecutedAt)}
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(workflow.updatedAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.sharedWith && workflow.sharedWith.length > 0 ? (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{workflow.sharedWith.length} user{workflow.sharedWith.length !== 1 ? 's' : ''}</span>
                      </div>
                    ) : workflow.isPublic ? (
                      <span className="text-green-600">Public</span>
                    ) : (
                      <span className="text-gray-400">Private</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Quick Action Buttons */}
                      <Link
                        to={`/workflows/${workflow.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Edit workflow"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/workflows/${workflow.id}/executions`}
                        className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded hover:bg-purple-50"
                        title="View executions"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      {/* Enhanced Actions Menu */}
                      <WorkflowActionsMenu 
                        workflow={workflow}
                        onShare={() => setShareModalWorkflow(workflow)}
                        showAdvancedOptions={true}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalWorkflow && (
        <ShareWorkflowModal
          workflow={shareModalWorkflow}
          isOpen={!!shareModalWorkflow}
          onClose={() => setShareModalWorkflow(null)}
        />
      )}
    </>
  )
}