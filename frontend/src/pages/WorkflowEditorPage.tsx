import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WorkflowEditorWrapper } from '@/components'
import { useWorkflowStore } from '@/stores'
import { useAuthStore } from '@/stores'
import { workflowService } from '@/services'
import { NodeType, Workflow } from '@/types'
import { Loader2, AlertCircle } from 'lucide-react'

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workflow, setWorkflow, setLoading, isLoading } = useWorkflowStore()
  const { user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([])
  const [isLoadingNodeTypes, setIsLoadingNodeTypes] = useState(true)

  // Load node types from backend
  useEffect(() => {
    const loadNodeTypes = async () => {
      try {
        setIsLoadingNodeTypes(true)
        const types = await workflowService.getNodeTypes()
        setNodeTypes(types)
      } catch (error) {
        console.error('Failed to load node types:', error)
        setError('Failed to load node types. Please refresh the page.')
      } finally {
        setIsLoadingNodeTypes(false)
      }
    }

    loadNodeTypes()
  }, [])

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) {
        // Create new workflow
        const newWorkflow: Workflow = {
          id: 'new',
          name: 'New Workflow',
          description: '',
          userId: user?.id || 'guest',
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
          userId: user?.id || 'guest',
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

  if (isLoading || isLoadingNodeTypes) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">
            {isLoadingNodeTypes ? 'Loading node types...' : 'Loading workflow...'}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
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
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
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
    <div className="h-screen w-screen overflow-hidden">
      <WorkflowEditorWrapper nodeTypes={nodeTypes} />
    </div>
  )
}