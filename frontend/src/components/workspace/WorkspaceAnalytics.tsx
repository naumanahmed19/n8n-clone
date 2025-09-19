import React, { useEffect } from 'react'
import { 
  X, 
  TrendingUp, 
  Activity, 
  Users, 
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Star
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'

interface WorkspaceAnalyticsProps {
  isOpen: boolean
  onClose: () => void
}

export const WorkspaceAnalytics: React.FC<WorkspaceAnalyticsProps> = ({
  isOpen,
  onClose
}) => {
  const {
    workspaceAnalytics,
    isLoadingAnalytics,
    loadWorkspaceAnalytics
  } = useWorkspaceStore()

  useEffect(() => {
    if (isOpen) {
      loadWorkspaceAnalytics()
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Workspace Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Overview of your workflow performance and usage
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : workspaceAnalytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-blue-900">
                        {workspaceAnalytics.totalWorkflows}
                      </div>
                      <div className="text-sm text-blue-700">Total Workflows</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-green-900">
                        {workspaceAnalytics.activeWorkflows}
                      </div>
                      <div className="text-sm text-green-700">Active Workflows</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-purple-900">
                        {formatNumber(workspaceAnalytics.totalExecutions)}
                      </div>
                      <div className="text-sm text-purple-700">Total Executions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-orange-900">
                        {Math.round((workspaceAnalytics.activeWorkflows / workspaceAnalytics.totalWorkflows) * 100)}%
                      </div>
                      <div className="text-sm text-orange-700">Active Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Workflows */}
              {workspaceAnalytics.popularWorkflows.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Most Popular Workflows
                  </h3>
                  <div className="space-y-4">
                    {workspaceAnalytics.popularWorkflows.slice(0, 5).map((workflow, index) => (
                      <div key={workflow.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {workflow.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {workflow.analytics?.totalExecutions || 0} executions
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            workflow.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {workflow.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {workspaceAnalytics.recentActivity.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {workspaceAnalytics.recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900">
                            {activity.description || 'Workflow activity'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {activity.timestamp ? formatDate(activity.timestamp) : 'Recently'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-green-500" />
                    Workflow Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Active</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {workspaceAnalytics.activeWorkflows}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">Inactive</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {workspaceAnalytics.totalWorkflows - workspaceAnalytics.activeWorkflows}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Avg. Executions per Workflow</span>
                      <span className="text-sm font-medium text-gray-900">
                        {workspaceAnalytics.totalWorkflows > 0 
                          ? Math.round(workspaceAnalytics.totalExecutions / workspaceAnalytics.totalWorkflows)
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Most Active Workflow</span>
                      <span className="text-sm font-medium text-gray-900">
                        {workspaceAnalytics.popularWorkflows[0]?.analytics?.totalExecutions || 0} runs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600">
                Analytics data will appear here once you have workflows and executions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}