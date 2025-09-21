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
import { Input } from '@/components/ui/input'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCredentialStore, useWorkflowStore } from '@/stores'
import { NodeProperty, NodeType, WorkflowNode } from '@/types'
import { NodeValidator, ValidationError } from '@/utils/nodeValidation'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Database,
    FileText,
    Play,
    Settings,
    Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    setParameters(node.parameters)
    setNodeName(node.name)
    setIsDisabled(node.disabled)
    setCredentials((node.credentials || []).reduce((acc, cred) => ({ ...acc, [cred]: cred }), {}))
    setHasUnsavedChanges(false)
    setValidationErrors([])
  }, [node])

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
  }, [node, nodeName, parameters, credentials, nodeType.properties])

  const handleParameterChange = (propertyName: string, value: any) => {
    const newParameters = { ...parameters, [propertyName]: value }
    setParameters(newParameters)
    setHasUnsavedChanges(true)
    updateNode(node.id, { parameters: newParameters })
  }

  const handleNameChange = (name: string) => {
    setNodeName(name)
    setHasUnsavedChanges(true)
    updateNode(node.id, { name })
  }

  const handleDisabledChange = (disabled: boolean) => {
    setIsDisabled(disabled)
    setHasUnsavedChanges(true)
    updateNode(node.id, { disabled })
  }

  const handleCredentialChange = (credentialType: string, credentialId: string | undefined) => {
    const newCredentials = { ...credentials }
    if (credentialId) {
      newCredentials[credentialType] = credentialId
    } else {
      delete newCredentials[credentialType]
    }
    
    const credentialArray = Object.values(newCredentials).filter(Boolean) as string[]
    setCredentials(newCredentials)
    setHasUnsavedChanges(true)
    updateNode(node.id, { credentials: credentialArray })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      removeNode(node.id)
      onClose()
    }
  }

  const renderPropertyInput = (property: NodeProperty) => {
    const value = parameters[property.name] ?? property.default
    const error = NodeValidator.getFieldError(validationErrors, property.name)

    const shouldShow = () => {
      if (!property.displayOptions?.show) return true
      
      return Object.entries(property.displayOptions.show).every(([key, values]) => {
        const paramValue = parameters[key]
        return values.includes(paramValue)
      })
    }

    const shouldHide = () => {
      if (!property.displayOptions?.hide) return false
      
      return Object.entries(property.displayOptions.hide).some(([key, values]) => {
        const paramValue = parameters[key]
        return values.includes(paramValue)
      })
    }

    if (!shouldShow() || shouldHide()) return null

    const inputClassName = `w-full ${error ? 'border-red-300 bg-red-50' : ''}`

    switch (property.type) {
      case 'string':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
            placeholder={property.description}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, parseFloat(e.target.value) || 0)}
            className={inputClassName}
            placeholder={property.description}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParameterChange(property.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{property.description}</span>
          </div>
        )

      case 'options':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClassName}`}
          >
            <option value="">Select an option...</option>
            {property.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        )

      case 'multiOptions':
        return (
          <div className="space-y-2">
            {property.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || []
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value)
                    handleParameterChange(property.name, newValues)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </div>
            ))}
          </div>
        )

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleParameterChange(property.name, parsed)
              } catch {
                handleParameterChange(property.name, e.target.value)
              }
            }}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${inputClassName}`}
            placeholder="Enter JSON..."
          />
        )

      case 'dateTime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
            placeholder={property.description}
          />
        )
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[90vw] h-[85vh] p-0 gap-0">
        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Column - Inputs */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium">Inputs</h3>
                    <Badge variant="outline">{inputNodes.length}</Badge>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
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
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Middle Column - Node Configuration */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Node Title Section */}
                <div className="p-4 border-b bg-gray-50/50">
                  <div className="flex items-start space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: nodeType.color || '#666' }}
                    >
                      {nodeType.icon || nodeType.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 mb-1">{nodeType.displayName}</div>
                      <Input
                        value={nodeName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={`text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                          NodeValidator.getFieldError(validationErrors, 'name') ? 'text-red-600' : ''
                        }`}
                        placeholder="Node name..."
                      />
                      {NodeValidator.getFieldError(validationErrors, 'name') && (
                        <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">{NodeValidator.getFieldError(validationErrors, 'name')}</span>
                        </div>
                      )}
                    </div>
                    {nodeExecutionResult && getNodeStatusBadge(nodeExecutionResult.status)}
                  </div>
                  <p className="text-sm text-gray-600">{nodeType.description}</p>
                </div>

                <Tabs defaultValue="config" className="flex-1 flex flex-col">
                  <div className="px-4 pt-4 border-b">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="config" className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Config</span>
                      </TabsTrigger>
                      <TabsTrigger value="test" className="flex items-center space-x-2">
                        <Play className="w-4 h-4" />
                        <span>Test</span>
                      </TabsTrigger>
                      <TabsTrigger value="response" className="flex items-center space-x-2">
                        <Database className="w-4 h-4" />
                        <span>Response</span>
                      </TabsTrigger>
                      <TabsTrigger value="docs" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Docs</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="config" className="h-full mt-0">
                      <ScrollArea className="h-full p-4">
                        <div className="space-y-6 max-w-lg">
                          {/* Node Enabled/Disabled */}
                          <div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={!isDisabled}
                                onChange={(e) => handleDisabledChange(!e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label className="text-sm font-medium">Enable Node</label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Disabled nodes will be skipped during execution
                            </p>
                          </div>

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
                              {nodeType.properties.map((property) => (
                                <div key={property.name}>
                                  <label className="block text-sm font-medium mb-2">
                                    {property.displayName}
                                    {property.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  {renderPropertyInput(property)}
                                  {NodeValidator.getFieldError(validationErrors, property.name) ? (
                                    <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>{NodeValidator.getFieldError(validationErrors, property.name)}</span>
                                    </div>
                                  ) : property.description ? (
                                    <p className="text-xs text-gray-500 mt-1">{property.description}</p>
                                  ) : null}
                                </div>
                              ))}
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
                      </ScrollArea>
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
                      <ScrollArea className="h-full p-4">
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
                      </ScrollArea>
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
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium">Outputs</h3>
                    <Badge variant="outline">{outputNodes.length}</Badge>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  {outputNodes.length > 0 ? (
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
                                <summary className="text-xs text-blue-600 cursor-pointer">View Output Data</summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-24 whitespace-pre-wrap">
                                  {JSON.stringify(nodeExecutionResult.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <ArrowRight className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No output connections</p>
                      <p className="text-xs text-gray-400">Connect this node to see output destinations</p>
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