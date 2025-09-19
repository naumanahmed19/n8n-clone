import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WorkflowEditorWrapper } from '@/components'
import { useWorkflowStore } from '@/stores'
import { workflowService } from '@/services'
import { NodeType, Workflow } from '@/types'
import { Loader2, AlertCircle } from 'lucide-react'

// Mock node types for now - these would come from the backend
const mockNodeTypes: NodeType[] = [
  {
    type: 'http-request',
    displayName: 'HTTP Request',
    name: 'httpRequest',
    group: ['Core'],
    version: 1,
    description: 'Make HTTP requests to external APIs',
    defaults: {
      method: 'GET',
      url: '',
      headers: {}
    },
    inputs: ['main'],
    outputs: ['main'],
    color: '#4F46E5',
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        required: true,
        default: 'GET',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to make the request to'
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'json',
        default: {},
        description: 'HTTP headers to send with the request'
      }
    ]
  },
  {
    type: 'json-transform',
    displayName: 'JSON Transform',
    name: 'jsonTransform',
    group: ['Core'],
    version: 1,
    description: 'Transform JSON data using JavaScript expressions',
    defaults: {
      expression: 'return items;'
    },
    inputs: ['main'],
    outputs: ['main'],
    color: '#059669',
    properties: [
      {
        displayName: 'Expression',
        name: 'expression',
        type: 'string',
        required: true,
        default: 'return items;',
        description: 'JavaScript expression to transform the data'
      }
    ]
  },
  {
    type: 'set-values',
    displayName: 'Set Values',
    name: 'setValues',
    group: ['Core'],
    version: 1,
    description: 'Set static values or expressions',
    defaults: {
      values: []
    },
    inputs: ['main'],
    outputs: ['main'],
    color: '#DC2626',
    properties: [
      {
        displayName: 'Values',
        name: 'values',
        type: 'json',
        default: [],
        description: 'Array of key-value pairs to set'
      }
    ]
  },
  {
    type: 'webhook-trigger',
    displayName: 'Webhook Trigger',
    name: 'webhookTrigger',
    group: ['Triggers'],
    version: 1,
    description: 'Trigger workflow via webhook',
    defaults: {
      path: '/webhook'
    },
    inputs: [],
    outputs: ['main'],
    color: '#7C3AED',
    properties: [
      {
        displayName: 'Webhook Path',
        name: 'path',
        type: 'string',
        required: true,
        default: '/webhook',
        description: 'The path for the webhook endpoint'
      }
    ]
  },
  {
    type: 'schedule-trigger',
    displayName: 'Schedule Trigger',
    name: 'scheduleTrigger',
    group: ['Triggers'],
    version: 1,
    description: 'Trigger workflow on a schedule',
    defaults: {
      cron: '0 0 * * *'
    },
    inputs: [],
    outputs: ['main'],
    color: '#EA580C',
    properties: [
      {
        displayName: 'Cron Expression',
        name: 'cron',
        type: 'string',
        required: true,
        default: '0 0 * * *',
        description: 'Cron expression for scheduling'
      }
    ]
  }
]

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workflow, setWorkflow, setLoading, isLoading } = useWorkflowStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) {
        // Create new workflow
        const newWorkflow: Workflow = {
          id: 'new',
          name: 'New Workflow',
          description: '',
          userId: 'current-user', // TODO: Get from auth store
          nodes: [],
          connections: [],
          settings: {
            timezone: 'UTC',
            saveDataErrorExecution: 'all',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            callerPolicy: 'workflowsFromSameOwner'
          },
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setWorkflow(newWorkflow)
        return
      }

      if (id === 'new') {
        // Create new workflow
        const newWorkflow: Workflow = {
          id: 'new',
          name: 'New Workflow',
          description: '',
          userId: 'current-user', // TODO: Get from auth store
          nodes: [],
          connections: [],
          settings: {
            timezone: 'UTC',
            saveDataErrorExecution: 'all',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            callerPolicy: 'workflowsFromSameOwner'
          },
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setWorkflow(newWorkflow)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const workflowData = await workflowService.getWorkflow(id)
        setWorkflow(workflowData)
      } catch (err) {
        console.error('Failed to load workflow:', err)
        setError('Failed to load workflow. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [id, setWorkflow, setLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading workflow...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Workflow</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Workflow Not Found</h2>
          <p className="text-gray-600 mb-4">The requested workflow could not be found.</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <WorkflowEditorWrapper nodeTypes={mockNodeTypes} />
    </div>
  )
}