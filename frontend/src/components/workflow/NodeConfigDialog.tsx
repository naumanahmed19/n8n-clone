import { CredentialSelector } from '@/components/credential/CredentialSelector'
import { NodeDocumentation } from '@/components/node/NodeDocumentation'
import { NodeTester } from '@/components/node/NodeTester'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { createField, FormGenerator } from '@/components/ui/form-generator'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useCredentialStore, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowNode } from '@/types'
import { NodeValidator, ValidationError } from '@/utils/nodeValidation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Database,
  Edit,
  FileText,
  Info,
  Loader2,
  Play,
  Settings,
  Trash2,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface NodeConfigDialogProps {
  node: WorkflowNode
  nodeType: NodeType
  isOpen: boolean
  onClose: () => void
}

export function NodeConfigDialog({ node, nodeType, isOpen, onClose }: NodeConfigDialogProps) {
  const { 
    updateNode, 
    removeNode, 
    getNodeExecutionResult, 
    executeNode,
    executionState,
    workflow 
  } = useWorkflowStore()
  const { fetchCredentials, fetchCredentialTypes } = useCredentialStore()
  
  const [parameters, setParameters] = useState(node.parameters)
  const [nodeName, setNodeName] = useState(node.name)
  const [isDisabled, setIsDisabled] = useState(node.disabled)
  const [credentials, setCredentials] = useState<Record<string, string>>(
    (node.credentials || []).reduce((acc, cred) => ({ ...acc, [cred]: cred }), {})
  )
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [mockData, setMockData] = useState(node.mockData || null)
  const [isMockDataEditorOpen, setIsMockDataEditorOpen] = useState(false)
  const [mockDataString, setMockDataString] = useState(
    node.mockData ? JSON.stringify(node.mockData, null, 2) : ''
  )

  // Debug: Log node data to see if mockData exists
  console.log('NodeConfigDialog - node data:', { 
    nodeId: node.id, 
    hasMockData: !!node.mockData,
    mockData: node.mockData 
  })

  // Get the execution result for this node
  const nodeExecutionResult = getNodeExecutionResult(node.id)

  // Get connected nodes
  const inputConnections = workflow?.connections.filter(conn => conn.targetNodeId === node.id) || []
  const outputConnections = workflow?.connections.filter(conn => conn.sourceNodeId === node.id) || []
  
  const inputNodes = inputConnections.map(conn => 
    workflow?.nodes.find(n => n.id === conn.sourceNodeId)
  ).filter(Boolean) as WorkflowNode[]
  
  const outputNodes = outputConnections.map(conn => 
    workflow?.nodes.find(n => n.id === conn.targetNodeId)
  ).filter(Boolean) as WorkflowNode[]

  // Convert all node properties to FormFieldConfig for use with FormGenerator
  const formFields = nodeType.properties?.map(property => 
    createField({
      name: property.name,
      displayName: property.displayName,
      type: property.type as any,
      required: property.required,
      default: property.default,
      description: property.description,
      placeholder: property.placeholder,
      options: property.options,
      displayOptions: property.displayOptions,
    })
  ) || []

  // Get validation errors in the format expected by FormGenerator
  const formErrors = validationErrors.reduce((acc, error) => {
    acc[error.field] = error.message
    return acc
  }, {} as Record<string, string>)

  // Only initialize state when dialog opens, never reset during editing
  useEffect(() => {
    if (isOpen) {
      setParameters(node.parameters)
      setNodeName(node.name)
      setIsDisabled(node.disabled)
      setCredentials((node.credentials || []).reduce((acc, cred) => ({ ...acc, [cred]: cred }), {}))
      setHasUnsavedChanges(false)
      setValidationErrors([])
    }
  }, [isOpen, node.id]) // Reset when dialog opens or when we switch to a different node

  useEffect(() => {
    fetchCredentials()
    fetchCredentialTypes()
  }, [fetchCredentials, fetchCredentialTypes])

  useEffect(() => {
    const validation = NodeValidator.validateNode(
      { ...node, name: nodeName, parameters, credentials: Object.values(credentials) },
      nodeType.properties
    )
    setValidationErrors(validation.errors)
  }, [node.id, nodeName, parameters, credentials, nodeType.properties]) // Use node.id instead of node

  // Handle parameter changes - only update local state immediately, store updates on blur/close
  const handleParameterChange = (propertyName: string, value: any) => {
    const newParameters = { ...parameters, [propertyName]: value }
    setParameters(newParameters)
    setHasUnsavedChanges(true)
    // Don't update store immediately - let user finish typing
  }

  // Save changes to store (called on blur, dialog close, or explicit save)
  const saveChangesToStore = () => {
  
    if (hasUnsavedChanges) {
      updateNode(node.id, { 
        parameters, 
        name: nodeName, 
        disabled: isDisabled,
        credentials: Object.values(credentials).filter(Boolean) as string[],
        mockData
      })
      setHasUnsavedChanges(false)
    }
  }

  // Handle dialog close - save changes before closing
  const handleClose = () => {
    saveChangesToStore()
    onClose()
  }

  const handleNameChange = (name: string) => {
    setNodeName(name)
    setHasUnsavedChanges(true)
    // Don't update store immediately
  }

  const handleDisabledChange = (disabled: boolean) => {
    setIsDisabled(disabled)
    setHasUnsavedChanges(true)
    // Don't update store immediately - save on dialog close
  }

  const handleMockDataSave = () => {
    try {
      const parsed = JSON.parse(mockDataString)
      setMockData(parsed)
      setIsMockDataEditorOpen(false)
      setHasUnsavedChanges(true)
      toast.success('Mock data saved successfully')
    } catch (error) {
      toast.error('Invalid JSON format. Please check your syntax.')
    }
  }

  const handleMockDataClear = () => {
    setMockData(null)
    setMockDataString('')
    setIsMockDataEditorOpen(false)
    setHasUnsavedChanges(true)
    toast.success('Mock data cleared')
  }

  const handleMockDataEdit = () => {
    setIsMockDataEditorOpen(true)
  }

  const handleCredentialChange = (credentialType: string, credentialId: string | undefined) => {
    const newCredentials = { ...credentials }
    if (credentialId) {
      newCredentials[credentialType] = credentialId
    } else {
      delete newCredentials[credentialType]
    }
    
    setCredentials(newCredentials)
    setHasUnsavedChanges(true)
    // Don't update store immediately - save on dialog close or blur
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      removeNode(node.id)
      onClose()
    }
  }

  const handleExecuteFromHere = async () => {
    // Prevent execution during workflow execution
    if (executionState.status === 'running') {
      console.warn('Cannot execute individual node while workflow is running')
      return
    }

    // Save current changes before executing
    saveChangesToStore()

    setIsExecuting(true)
    try {
      // Use the same execution method as the context menu
      await executeNode(node.id, undefined, 'single')
    } catch (error) {
      console.error('Failed to execute node:', error)
      toast.error('Failed to execute node')
    } finally {
      setIsExecuting(false)
    }
  }

  const getNodeStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Skipped</Badge>
      default:
        return <Badge variant="outline">Idle</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] p-0 gap-0">
        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Column - Inputs */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
              <div className="flex w-full h-full border-r border-gray-200 flex-col">
                <div className="p-4 border-b h-[72px] flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <ArrowLeft className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Inputs</h3>
                      <Badge variant="outline">{inputNodes.length}</Badge>
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" side="bottom" align="end">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Input Connections</h4>
                          <p className="text-sm text-gray-600">
                            This panel shows data coming into this node from previous nodes in the workflow. 
                            Each connection displays the source node, output port, and the actual data being passed.
                          </p>
                          <div className="text-xs text-gray-500">
                            • Connect nodes to see input data<br/>
                            • Execute workflow to view live data<br/>
                            • Click "View Data" to inspect details
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                
          <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
                  {inputNodes.length > 0 ? (
                    <div className="space-y-3">
                      {inputNodes.map((inputNode, index) => {
                        const connection = inputConnections[index]
                        const inputNodeExecutionResult = getNodeExecutionResult(inputNode.id)
                        
                        return (
                          <Card key={inputNode.id} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: '#6b7280' }}
                                >
                                  {inputNode.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium truncate">{inputNode.name}</span>
                              </div>
                              {inputNodeExecutionResult && getNodeStatusBadge(inputNodeExecutionResult.status)}
                            </div>
                            
                            <div className="text-xs text-gray-500 mb-2">
                              Output: <code className="bg-gray-100 px-1 rounded">{connection.sourceOutput}</code>
                              {' → '}
                              Input: <code className="bg-gray-100 px-1 rounded">{connection.targetInput}</code>
                            </div>

                            {inputNodeExecutionResult?.data && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 cursor-pointer">View Data</summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                                  {JSON.stringify(inputNodeExecutionResult.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <ArrowLeft className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No input connections</p>
                      <p className="text-xs text-gray-400">Connect nodes to see input data</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Middle Column - Node Configuration */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="flex w-full h-full flex-col">
                {/* Node Title Section */}
                <div className="p-4 border-b bg-gray-50/50 h-[72px] flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: nodeType.color || '#666' }}
                      >
                        {nodeType.icon || nodeType.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditingName ? (
                          <Input
                            value={nodeName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => {
                              setIsEditingName(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingName(false)
                              }
                            }}
                            className={`text-sm font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                              NodeValidator.getFieldError(validationErrors, 'name') ? 'text-red-600' : ''
                            }`}
                            placeholder="Node name..."
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => setIsEditingName(true)}
                            className="text-sm font-semibold cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                          >
                            {nodeName || nodeType.displayName}
                          </div>
                        )}
                        {NodeValidator.getFieldError(validationErrors, 'name') && (
                          <div className="flex items-center space-x-1 mt-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">{NodeValidator.getFieldError(validationErrors, 'name')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Execute Node Button */}
                      <Button
                        onClick={handleExecuteFromHere}
                        disabled={isExecuting || executionState.status === 'running' || validationErrors.length > 0}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        {isExecuting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                         Run Node
                        </span>
                      </Button>
                      
                      {/* Enable Node Toggle */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div>
                            <Switch
                              checked={!isDisabled}
                              onCheckedChange={(checked) => handleDisabledChange(!checked)}
                              className="scale-75"
                            />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-48 p-2">
                          <div className="text-xs">
                            <p className="font-medium">{isDisabled ? 'Node Disabled' : 'Node Enabled'}</p>
                            <p className="text-gray-500 mt-1">
                              {isDisabled 
                                ? 'This node will be skipped during execution'
                                : 'This node will execute normally'
                              }
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      {nodeExecutionResult && getNodeStatusBadge(nodeExecutionResult.status)}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Info className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="bottom" align="end">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center space-x-2">
                              <Info className="w-4 h-4" />
                              <span>{nodeType.displayName}</span>
                            </h4>
                            <p className="text-sm text-gray-600">
                              {nodeType.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              • Configure node parameters<br/>
                              • Set up credentials if required<br/>
                              • Test node execution<br/>
                              • View response data and documentation
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="config" className="flex-1 flex flex-col">

                  
                  <div className="px-4 border-b border-gray-200">
                    <div className="flex space-x-0 -mb-px">
                      <TabsList className="h-auto p-0 bg-transparent grid w-full grid-cols-4 shadow-none">
                        <TabsTrigger 
                          value="config" 
                          className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span className="font-medium">Config</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="test" 
                          className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span className="font-medium">Test</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="response" 
                          className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span className="font-medium">Response</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="docs" 
                          className="flex items-center space-x-1.5 px-3 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-black data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none bg-transparent shadow-none transition-all duration-200 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Docs</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="config" className="h-full mt-0">
                      <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
                        <div className="space-y-6 max-w-lg">
                          {/* Credentials */}
                          {nodeType.credentials && nodeType.credentials.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Credentials</h4>
                              {nodeType.credentials?.map((credentialDef) => (
                                <div key={credentialDef.name}>
                                  <label className="block text-sm font-medium mb-2">
                                    {credentialDef.displayName}
                                    {credentialDef.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  <CredentialSelector
                                    credentialType={credentialDef.name}
                                    value={credentials[credentialDef.name]}
                                    onChange={(credentialId) => handleCredentialChange(credentialDef.name, credentialId)}
                                    required={credentialDef.required}
                                  />
                                  {credentialDef.description && (
                                    <p className="text-xs text-gray-500 mt-1">{credentialDef.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Node Properties */}
                          {nodeType.properties && nodeType.properties.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Properties</h4>
                              <FormGenerator
                                fields={formFields}
                                values={parameters}
                                errors={formErrors}
                                onChange={handleParameterChange}
                                showRequiredIndicator={true}
                                fieldClassName="space-y-2"
                              />
                            </div>
                          )}

                          {/* Validation Summary */}
                          {validationErrors.length > 0 && (
                            <Card className="border-red-200 bg-red-50">
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-medium text-red-700">
                                    {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <ul className="text-sm text-red-600 space-y-1">
                                  {validationErrors.map((error, index) => (
                                    <li key={index}>• {error.message}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {/* Success Indicator */}
                          {validationErrors.length === 0 && hasUnsavedChanges && (
                            <Card className="border-green-200 bg-green-50">
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium text-green-700">
                                    Configuration is valid
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Delete Node */}
                          <Separator />
                          <div>
                            <Button
                              onClick={handleDelete}
                              variant="destructive"
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Node
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="test" className="h-full mt-0">
                      <div className="h-full p-4">
                        <NodeTester 
                          node={{ ...node, name: nodeName, parameters, credentials: Object.values(credentials) }} 
                          nodeType={nodeType} 
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="response" className="h-full mt-0">
                       <div className="h-[calc(100dvh-222px)] overflow-y-auto p-4">
                        <div className="space-y-4">
                          {nodeExecutionResult ? (
                            <div className="space-y-4">
                              {/* Status Section */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <Database className="w-5 h-5" />
                                    <span>Execution Status</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Status:</span>
                                      <div className="mt-1">
                                        {getNodeStatusBadge(nodeExecutionResult.status)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Duration:</span>
                                      <div className="mt-1 font-medium">{nodeExecutionResult.duration}ms</div>
                                    </div>
                                  </div>
                                  
                                  {nodeExecutionResult.startTime && (
                                    <div className="mt-4 text-sm">
                                      <span className="text-gray-500">Started:</span>
                                      <div className="mt-1">{new Date(nodeExecutionResult.startTime).toLocaleString()}</div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Error Section */}
                              {nodeExecutionResult.error && (
                                <Card className="border-red-200">
                                  <CardHeader>
                                    <CardTitle className="text-red-800">Error Details</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-50 p-3 rounded">
                                      {nodeExecutionResult.error}
                                    </pre>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Response Data Section */}
                              {nodeExecutionResult.data && (
                                <Card className="border-blue-200">
                                  <CardHeader>
                                    <CardTitle className="text-blue-800 flex items-center justify-between">
                                      <span>Response Data</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          navigator.clipboard.writeText(JSON.stringify(nodeExecutionResult.data, null, 2))
                                        }}
                                      >
                                        📋 Copy
                                      </Button>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ScrollArea className="h-96">
                                      <pre className="text-xs bg-blue-50 p-3 rounded overflow-auto font-mono whitespace-pre-wrap">
                                        {JSON.stringify(nodeExecutionResult.data, null, 2)}
                                      </pre>
                                    </ScrollArea>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                              <Database className="w-12 h-12 text-gray-300 mb-4" />
                              <div className="text-lg font-medium text-gray-700 mb-2">No execution data</div>
                              <div className="text-sm text-gray-500">
                                Execute the workflow to see the response data for this node
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="docs" className="h-full mt-0">
                      <div className="h-full p-4">
                        <NodeDocumentation nodeType={nodeType} />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Column - Outputs */}
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
              <div className="flex w-full h-full border-l border-gray-200 flex-col">
                <div className="p-4 border-b h-[72px] flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Output Data</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <Button
                        onClick={handleMockDataEdit}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Mock Data</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  {/* Mock Data Editor */}
                  {isMockDataEditorOpen && (
                    <div className="mb-6">
                      <Card className="border-orange-200 bg-orange-50/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-orange-800">Set Mock Output Data</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsMockDataEditorOpen(false)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-xs text-orange-700">
                              Enter JSON data that will be used as output for the next nodes. This will override execution results.
                            </p>
                            <Textarea
                              value={mockDataString}
                              onChange={(e) => setMockDataString(e.target.value)}
                              placeholder='{\n  "status": "success",\n  "data": {\n    "message": "Hello World"\n  }\n}'
                              className="font-mono text-sm"
                              rows={8}
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleMockDataSave}
                                size="sm"
                                className="flex-1"
                              >
                                Save Mock Data
                              </Button>
                              <Button
                                onClick={handleMockDataClear}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Current Output Data - Mock or Execution */}
                  {(mockData || nodeExecutionResult?.data) && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                        <Database className="w-4 h-4 text-green-600" />
                        <span>Current Output Data</span>
                        <Badge className={mockData ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                          {mockData ? 'Mock Data' : nodeExecutionResult?.status}
                        </Badge>
                      </h4>
                      <Card className={mockData ? "border-orange-200 bg-orange-50/30" : "border-green-200 bg-green-50/30"}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              {mockData ? 'Mock Output Data' : 'Execution Output Data'}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const dataToShow = mockData || nodeExecutionResult?.data
                                navigator.clipboard.writeText(JSON.stringify(dataToShow, null, 2))
                                toast.success('Copied to clipboard')
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              📋 Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-40">
                            <pre className="text-xs bg-white p-3 rounded border overflow-auto font-mono whitespace-pre-wrap">
                              {JSON.stringify(mockData || nodeExecutionResult?.data, null, 2)}
                            </pre>
                          </ScrollArea>
                          {mockData && (
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-orange-600">This mock data will be used as output for connected nodes.</p>
                              <Button
                                onClick={handleMockDataEdit}
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Connected Output Nodes */}
                  {outputNodes.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center space-x-2">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span>Connected Outputs</span>
                      </h4>
                      
                      <div className="space-y-3">
                        {outputNodes.map((outputNode, index) => {
                          const connection = outputConnections[index]
                          const outputNodeExecutionResult = getNodeExecutionResult(outputNode.id)
                          
                          return (
                            <Card key={outputNode.id} className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: '#6b7280' }}
                                  >
                                    {outputNode.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium truncate">{outputNode.name}</span>
                                </div>
                                {outputNodeExecutionResult && getNodeStatusBadge(outputNodeExecutionResult.status)}
                              </div>
                              
                              <div className="text-xs text-gray-500 mb-2">
                                Output: <code className="bg-gray-100 px-1 rounded">{connection.sourceOutput}</code>
                                {' → '}
                                Input: <code className="bg-gray-100 px-1 rounded">{connection.targetInput}</code>
                              </div>

                              {/* Show current node's output data that would be sent to this output node */}
                              {nodeExecutionResult?.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-blue-600 cursor-pointer">View Sent Data</summary>
                                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                                    {JSON.stringify(nodeExecutionResult.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center space-y-3">
                      <ArrowRight className="w-8 h-8 text-gray-300" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">No output data</p>
                        <p className="text-xs text-gray-400 mb-3">Execute the node or set mock data</p>
                        <Button
                          onClick={handleMockDataEdit}
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Add Mock Data</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  )
}