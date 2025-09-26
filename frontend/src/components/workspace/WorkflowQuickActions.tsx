import React from 'react'
import { 
  Edit, 
  Play, 
  Pause, 
  Eye, 
  History, 
  BarChart3, 
  Copy,
  Share2,
  MoreVertical,
  Zap
} from 'lucide-react'
import { Workflow } from '@/types'
import { Link } from 'react-router-dom'
import { WorkflowActionsMenu } from './WorkflowActionsMenu'

interface WorkflowQuickActionsProps {
  workflow: Workflow
  onShare: () => void
  onDuplicate?: () => void
  onToggleActive?: () => void
  onExecute?: () => void
  showLabels?: boolean
  variant?: 'buttons' | 'icons'
}

export const WorkflowQuickActions: React.FC<WorkflowQuickActionsProps> = ({
  workflow,
  onShare,
  onDuplicate,
  onToggleActive,
  onExecute,
  showLabels = false,
  variant = 'icons'
}) => {
  const handleToggleActive = () => {
    if (onToggleActive) {
      onToggleActive()
    } else {
      // Default toggle behavior
      console.log('Toggle workflow:', workflow.id)
    }
  }

  const handleExecute = () => {
    if (onExecute) {
      onExecute()
    } else {
      // Default execute behavior
      console.log('Execute workflow:', workflow.id)
    }
  }

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate()
    } else {
      // Default duplicate behavior
      console.log('Duplicate workflow:', workflow.id)
    }
  }

  if (variant === 'buttons') {
    return (
      <div className="flex items-center space-x-2">
        {/* Primary Action - Edit */}
        <Link
          to={`/workflows/${workflow.id}`}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Edit className="w-4 h-4 mr-1" />
          {showLabels && "Edit"}
        </Link>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
          title="Execute workflow"
        >
          <Zap className="w-4 h-4 mr-1" />
          {showLabels && "Execute"}
        </button>

        {/* Toggle Active */}
        <button
          onClick={handleToggleActive}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            workflow.active
              ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          title={workflow.active ? 'Deactivate workflow' : 'Activate workflow'}
        >
          {workflow.active ? (
            <>
              <Pause className="w-4 h-4 mr-1" />
              {showLabels && "Deactivate"}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              {showLabels && "Activate"}
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="flex items-center space-x-1">
          <Link
            to={`/workflows/${workflow.id}/executions`}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="View executions"
          >
            <History className="w-4 h-4" />
          </Link>
          
          <Link
            to={`/workflows/${workflow.id}/analytics`}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="View analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDuplicate}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate workflow"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={onShare}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Share workflow"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* More Actions Menu */}
        <WorkflowActionsMenu 
          workflow={workflow}
          onShare={onShare}
        />
      </div>
    )
  }

  // Default icons variant
  return (
    <div className="flex items-center space-x-1">
      {/* Primary Action - Edit */}
      <Link
        to={`/workflows/${workflow.id}`}
        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
        title="Edit workflow"
      >
        <Edit className="w-4 h-4" />
      </Link>

      {/* Execute */}
      <button
        onClick={handleExecute}
        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
        title="Execute workflow"
      >
        <Zap className="w-4 h-4" />
      </button>

      {/* Toggle Active */}
      <button
        onClick={handleToggleActive}
        className={`p-1.5 rounded transition-colors ${
          workflow.active
            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title={workflow.active ? 'Deactivate workflow' : 'Activate workflow'}
      >
        {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      {/* View Executions */}
      <Link
        to={`/workflows/${workflow.id}/executions`}
        className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
        title="View executions"
      >
        <History className="w-4 h-4" />
      </Link>

      {/* Analytics */}
      <Link
        to={`/workflows/${workflow.id}/analytics`}
        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
        title="View analytics"
      >
        <BarChart3 className="w-4 h-4" />
      </Link>

      {/* More Actions */}
      <WorkflowActionsMenu 
        workflow={workflow}
        onShare={onShare}
      />
    </div>
  )
}

// Alternative compact version for tight spaces
export const CompactWorkflowActions: React.FC<{
  workflow: Workflow
  onShare: () => void
}> = ({ workflow, onShare }) => {
  return (
    <div className="flex items-center space-x-1">
      <Link
        to={`/workflows/${workflow.id}`}
        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
        title="Edit"
      >
        <Edit className="w-3.5 h-3.5" />
      </Link>
      
      <Link
        to={`/workflows/${workflow.id}/executions`}
        className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
        title="Executions"
      >
        <Eye className="w-3.5 h-3.5" />
      </Link>
      
      <WorkflowActionsMenu 
        workflow={workflow}
        onShare={onShare}
      />
    </div>
  )
}