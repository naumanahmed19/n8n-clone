import { AlertCircle, CheckCircle, Clock, Filter, Monitor, Play, Search } from 'lucide-react'
import React, { useState } from 'react'
import { ExecutionMonitor } from '../components/execution/ExecutionMonitor'
import { ExecutionStatusIndicator } from '../components/execution/ExecutionStatusIndicator'
import { useExecutionMonitoring } from '../hooks/useExecutionMonitoring'

export const ExecutionsPage: React.FC = () => {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);
  const { isConnected } = useExecutionMonitoring();

  const executions = [
    {
      id: '1',
      workflowName: 'Sample Workflow 1',
      status: 'success',
      startedAt: '2024-01-15T10:30:00Z',
      duration: '2.3s',
    },
    {
      id: '2',
      workflowName: 'Sample Workflow 2',
      status: 'error',
      startedAt: '2024-01-15T10:25:00Z',
      duration: '1.8s',
    },
    {
      id: '3',
      workflowName: 'Sample Workflow 1',
      status: 'running',
      startedAt: '2024-01-15T10:20:00Z',
      duration: '5.2s',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'running':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executions</h1>
          <p className="text-gray-600">Monitor your workflow execution history</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              Real-time monitoring {isConnected ? 'connected' : 'disconnected'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowMonitor(!showMonitor)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            showMonitor 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>{showMonitor ? 'Hide Monitor' : 'Show Monitor'}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search executions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Real-time Monitor */}
      {showMonitor && (
        <div className="mb-6">
          <ExecutionMonitor 
            executionId={selectedExecutionId} 
            className="w-full"
          />
        </div>
      )}

      {/* Executions Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {executions.map((execution) => (
                <tr 
                  key={execution.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedExecutionId === execution.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedExecutionId(execution.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isConnected ? (
                      <ExecutionStatusIndicator 
                        executionId={execution.id}
                        showProgress={true}
                        showNodeCount={true}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(execution.status)}
                        <span className={getStatusBadge(execution.status)}>
                          {execution.status}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {execution.workflowName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(execution.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {execution.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExecutionId(execution.id);
                        setShowMonitor(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Monitor
                    </button>
                    {execution.status === 'error' && (
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing 1 to 3 of 3 results
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
