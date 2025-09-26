import React from 'react'
import { 
  WorkflowActionsMenu, 
  EnhancedWorkflowActionsMenu, 
  WorkflowQuickActions,
  CompactWorkflowActions 
} from '@/components/workspace'
import { Workflow } from '@/types'

// Example workflow data
const exampleWorkflow: Workflow = {
  id: 'example-workflow-1',
  name: 'Customer Data Processing',
  description: 'Processes customer data from multiple sources and sends notifications',
  userId: 'user-1',
  nodes: [],
  connections: [],
  settings: {},
  active: true,
  tags: ['customer', 'data', 'automation'],
  category: 'data-processing',
  isTemplate: false,
  isPublic: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z'
}

export const WorkflowActionsDemo: React.FC = () => {
  const handleShare = () => {
    console.log('Opening share modal...')
  }

  const handleDuplicate = () => {
    console.log('Duplicating workflow...')
  }

  const handleToggleActive = () => {
    console.log('Toggling workflow active state...')
  }

  const handleExecute = () => {
    console.log('Executing workflow...')
  }

  const handleEdit = () => {
    console.log('Opening workflow editor...')
  }

  const handleViewExecutions = () => {
    console.log('Viewing executions...')
  }

  const handleViewAnalytics = () => {
    console.log('Viewing analytics...')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Workflow Actions Components Demo
        </h1>
        <p className="text-gray-600">
          Comprehensive dropdown menus and quick actions for workflow management
        </p>
      </div>

      {/* Original Actions Menu */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Original Actions Menu
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Basic dropdown with essential workflow actions (duplicate, share, export, delete)
        </p>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
            <p className="text-sm text-gray-500">Basic workflow actions</p>
          </div>
          <WorkflowActionsMenu
            workflow={exampleWorkflow}
            onShare={handleShare}
          />
        </div>
      </div>

      {/* Enhanced Actions Menu */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Enhanced Actions Menu
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Comprehensive dropdown with organized sections, descriptions, and advanced options
        </p>
        <div className="space-y-4">
          {/* Full Version */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
              <p className="text-sm text-gray-500">Full enhanced menu with all options</p>
            </div>
            <EnhancedWorkflowActionsMenu
              workflow={exampleWorkflow}
              onShare={handleShare}
              onEdit={handleEdit}
              onViewExecutions={handleViewExecutions}
              onViewAnalytics={handleViewAnalytics}
              showAdvancedOptions={true}
            />
          </div>

          {/* Compact Version */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
              <p className="text-sm text-gray-500">Compact version for smaller spaces</p>
            </div>
            <EnhancedWorkflowActionsMenu
              workflow={exampleWorkflow}
              onShare={handleShare}
              showAdvancedOptions={false}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions Toolbar
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Frequently used actions as buttons with optional labels
        </p>
        <div className="space-y-4">
          {/* Buttons Version */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
              <p className="text-sm text-gray-500">Button-style quick actions</p>
            </div>
            <WorkflowQuickActions
              workflow={exampleWorkflow}
              onShare={handleShare}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
              onExecute={handleExecute}
              variant="buttons"
              showLabels={false}
            />
          </div>

          {/* Icons Version */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
              <p className="text-sm text-gray-500">Icon-only quick actions</p>
            </div>
            <WorkflowQuickActions
              workflow={exampleWorkflow}
              onShare={handleShare}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
              onExecute={handleExecute}
              variant="icons"
            />
          </div>

          {/* Ultra Compact */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{exampleWorkflow.name}</h3>
              <p className="text-sm text-gray-500">Ultra compact for tight spaces</p>
            </div>
            <CompactWorkflowActions
              workflow={exampleWorkflow}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Primary Actions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Open Editor</li>
              <li>• Execute Now</li>
              <li>• Activate/Deactivate</li>
              <li>• Manual Execution</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">View & Monitor</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Execution History</li>
              <li>• Analytics Dashboard</li>
              <li>• Webhook Management</li>
              <li>• Performance Metrics</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Management</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Duplicate Workflow</li>
              <li>• Create Version</li>
              <li>• Schedule Execution</li>
              <li>• Import Data</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Sharing</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Share Workflow</li>
              <li>• Manage Permissions</li>
              <li>• Export to File</li>
              <li>• Publish as Template</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Advanced</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Workflow Settings</li>
              <li>• View Code/JSON</li>
              <li>• System Logs</li>
              <li>• Refresh Data</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">System</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Archive Workflow</li>
              <li>• Delete Workflow</li>
              <li>• Backup & Restore</li>
              <li>• Access Control</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          How to Use These Components
        </h2>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>WorkflowActionsMenu:</strong> Use for basic workflow actions in table rows or card footers.
          </p>
          <p>
            <strong>EnhancedWorkflowActionsMenu:</strong> Use when you need comprehensive workflow management 
            with organized sections and detailed descriptions.
          </p>
          <p>
            <strong>WorkflowQuickActions:</strong> Use for frequently accessed actions in prominent locations
            like workflow headers or dashboard cards.
          </p>
          <p>
            <strong>CompactWorkflowActions:</strong> Use in very tight spaces like sidebar items or 
            mobile interfaces where space is limited.
          </p>
        </div>
      </div>
    </div>
  )
}