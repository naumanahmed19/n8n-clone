import { useState, useEffect } from 'react'
import { X, Settings, Play, Trash2 } from 'lucide-react'
import { WorkflowNode, NodeType, NodeProperty } from '@/types'
import { useWorkflowStore } from '@/stores'

interface NodeConfigPanelProps {
  node: WorkflowNode
  nodeType: NodeType
  onClose: () => void
}

export function NodeConfigPanel({ node, nodeType, onClose }: NodeConfigPanelProps) {
  const { updateNode, removeNode } = useWorkflowStore()
  const [parameters, setParameters] = useState(node.parameters)
  const [nodeName, setNodeName] = useState(node.name)
  const [isDisabled, setIsDisabled] = useState(node.disabled)

  useEffect(() => {
    setParameters(node.parameters)
    setNodeName(node.name)
    setIsDisabled(node.disabled)
  }, [node])

  const handleParameterChange = (propertyName: string, value: any) => {
    const newParameters = { ...parameters, [propertyName]: value }
    setParameters(newParameters)
    updateNode(node.id, { parameters: newParameters })
  }

  const handleNameChange = (name: string) => {
    setNodeName(name)
    updateNode(node.id, { name })
  }

  const handleDisabledChange = (disabled: boolean) => {
    setIsDisabled(disabled)
    updateNode(node.id, { disabled })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      removeNode(node.id)
      onClose()
    }
  }

  const renderPropertyInput = (property: NodeProperty) => {
    const value = parameters[property.name] ?? property.default

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

    switch (property.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={property.description}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={property.description}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter JSON..."
          />
        )

      case 'dateTime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParameterChange(property.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={property.description}
          />
        )
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
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
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
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
      </div>

      {/* Configuration form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Node name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter node name..."
          />
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

        {/* Node properties */}
        {nodeType.properties.map((property) => (
          <div key={property.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {property.displayName}
              {property.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderPropertyInput(property)}
            {property.description && (
              <p className="text-xs text-gray-500 mt-1">{property.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => {/* TODO: Implement test node */}}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Test Node</span>
        </button>
        
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  )
}