import { CredentialSelector } from '@/components/credential/CredentialSelector'
import { NodeDocumentation } from '@/components/node/NodeDocumentation'
import { NodeTester } from '@/components/node/NodeTester'
import { useCredentialStore, useWorkflowStore } from '@/stores'
import { NodeProperty, NodeType, WorkflowNode } from '@/types'
import { NodeValidator, ValidationError } from '@/utils/nodeValidation'
import { AlertCircle, Book, CheckCircle, Database, Play, Settings, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NodeConfigPanelProps {
  node: WorkflowNode
  nodeType: NodeType
  onClose: () => void
}

export function NodeConfigPanel({ node, nodeType, onClose }: NodeConfigPanelProps) {
  const { updateNode, removeNode, getNodeExecutionResult } = useWorkflowStore()
  const { fetchCredentials, fetchCredentialTypes } = useCredentialStore()
  const [parameters, setParameters] = useState(node.parameters)
  const [nodeName, setNodeName] = useState(node.name)
  const [isDisabled, setIsDisabled] = useState(node.disabled)
  const [credentials, setCredentials] = useState<Record<string, string>>(
    (node.credentials || []).reduce((acc, cred) => ({ ...acc, [cred]: cred }), {})
  )
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'docs' | 'response'>('config')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Get the execution result for this node
  const nodeExecutionResult = getNodeExecutionResult(node.id)

  useEffect(() => {
    setParameters(node.parameters)
    setNodeName(node.name)
    setIsDisabled(node.disabled)
    setCredentials((node.credentials || []).reduce((acc, cred) => ({ ...acc, [cred]: cred }), {}))
    setHasUnsavedChanges(false)
    setValidationErrors([])
  }, [node])

  useEffect(() => {
    // Fetch credentials and types when component mounts
    fetchCredentials()
    fetchCredentialTypes()
  }, [fetchCredentials, fetchCredentialTypes])

  // useEffect(() => {
  //   // Initialize missing default parameters from node type properties
  //   const initializedParameters = { ...parameters }
  //   let hasChanges = false

  //   nodeType.properties.forEach(property => {
  //     if (property.default !== undefined && initializedParameters[property.name] === undefined) {
  //       initializedParameters[property.name] = property.default
  //       hasChanges = true
  //     }
  //   })

  //   if (hasChanges) {
  //     setParameters(initializedParameters)
  //     updateNode(node.id, { parameters: initializedParameters })
  //   }
  // }, [nodeType.properties, node.id, updateNode])

  useEffect(() => {
    // Validate node whenever parameters change
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
        // Get parameter value, fallback to property default, then to undefined
        let paramValue = parameters[key];
        if (paramValue === undefined) {
          const keyProperty = nodeType.properties.find(p => p.name === key);
          paramValue = keyProperty?.default;
        }
        return paramValue !== undefined && values.includes(paramValue);
      })
    }

    const shouldHide = () => {
      if (!property.displayOptions?.hide) return false
      
      return Object.entries(property.displayOptions.hide).some(([key, values]) => {
        // Get parameter value, fallback to property default, then to undefined
        let paramValue = parameters[key];
        if (paramValue === undefined) {
          const keyProperty = nodeType.properties.find(p => p.name === key);
          paramValue = keyProperty?.default;
        }
        return paramValue !== undefined && values.includes(paramValue);
      })
    }

    if (!shouldShow() || shouldHide()) return null

    const inputClassName = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
    }`

    switch (property.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
            placeholder={property.placeholder || property.description}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, parseFloat(e.target.value) || 0)}
            className={inputClassName}
            placeholder={property.placeholder || property.description}
          />
        )

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParameterChange(property.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{property.description}</span>
          </label>
        )

      case 'options':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
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
              <label key={option.value} className="flex items-center space-x-2">
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
              </label>
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
            className={`${inputClassName} font-mono text-sm`}
            placeholder="Enter JSON..."
          />
        )

      case 'dateTime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
          />
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className={inputClassName}
            placeholder={property.placeholder || property.description}
          />
        )
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return (
          <div className="space-y-6">
            {/* Node name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  NodeValidator.getFieldError(validationErrors, 'name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter node name..."
              />
              {NodeValidator.getFieldError(validationErrors, 'name') && (
                <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{NodeValidator.getFieldError(validationErrors, 'name')}</span>
                </div>
              )}
            </div>

            {/* Node enabled/disabled */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!isDisabled}
                  onChange={(e) => handleDisabledChange(!e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Node</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Disabled nodes will be skipped during execution
              </p>
            </div>

            {/* Credentials */}
            {nodeType.credentials && nodeType.credentials.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Credentials</h4>
                {nodeType.credentials?.map((credentialDef) => (
                  <div key={credentialDef.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Node properties */}
            {nodeType.properties && nodeType.properties.length > 0 && nodeType.properties.map((property) => (
              <div key={property.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Validation summary */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
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
              </div>
            )}

            {/* Success indicator */}
            {validationErrors.length === 0 && hasUnsavedChanges && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Configuration is valid
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 'test':
        return <NodeTester node={{ ...node, name: nodeName, parameters, credentials: Object.values(credentials) }} nodeType={nodeType} />

      case 'docs':
        return <NodeDocumentation nodeType={nodeType} />

      case 'response':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Execution Response</h3>
            </div>
            
            {nodeExecutionResult ? (
              <div className="space-y-4">
                {/* Status section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium ${
                        nodeExecutionResult.status === 'success' ? 'bg-green-100 text-green-800' :
                        nodeExecutionResult.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {nodeExecutionResult.status.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2 font-medium">{nodeExecutionResult.duration}ms</span>
                    </div>
                  </div>
                  
                  {nodeExecutionResult.startTime && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-2">{new Date(nodeExecutionResult.startTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Error section */}
                {nodeExecutionResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
                    <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-100 p-2 rounded">
                      {nodeExecutionResult.error}
                    </pre>
                  </div>
                )}

                {/* Response data section */}
                {nodeExecutionResult.data && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Response Data</h4>
                    <pre className="text-xs bg-blue-100 p-3 rounded overflow-auto max-h-96 font-mono whitespace-pre-wrap">
                      {JSON.stringify(nodeExecutionResult.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Copy response button */}
                {nodeExecutionResult.data && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(nodeExecutionResult.data, null, 2))
                      // You could add a toast notification here
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <span>📋</span>
                    <span>Copy Response</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium text-gray-700 mb-2">No execution data</div>
                <div className="text-sm">
                  Execute the workflow to see the response data for this node
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Node Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Node type info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md mb-4">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: nodeType.color || '#666' }}
          >
            {nodeType.icon || nodeType.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{nodeType.displayName}</div>
            <div className="text-xs text-gray-500">{nodeType.description}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'config'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Config
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'test'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Play className="w-4 h-4 inline mr-1" />
            Test
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'response'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4 inline mr-1" />
            Response
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'docs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Book className="w-4 h-4 inline mr-1" />
            Docs
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>

      {/* Actions */}
      {activeTab === 'config' && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Node</span>
          </button>
        </div>
      )}
    </div>
  )
}