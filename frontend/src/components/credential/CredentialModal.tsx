import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Credential, CredentialType, CredentialData, CreateCredentialRequest } from '@/types'
import { useCredentialStore } from '@/stores'

interface CredentialModalProps {
  credentialType: CredentialType
  credential?: Credential
  onClose: () => void
  onSave: (credential: Credential) => void
}

export function CredentialModal({ 
  credentialType, 
  credential, 
  onClose, 
  onSave 
}: CredentialModalProps) {
  const { createCredential, updateCredential, testCredential, isLoading } = useCredentialStore()
  
  const [name, setName] = useState(credential?.name || '')
  const [data, setData] = useState<CredentialData>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    // Initialize form data with default values
    const initialData: CredentialData = {}
    credentialType.properties.forEach(prop => {
      if (prop.type === 'boolean') {
        initialData[prop.name] = false
      } else {
        initialData[prop.name] = ''
      }
    })
    setData(initialData)
  }, [credentialType])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Credential name is required'
    }

    credentialType.properties.forEach(prop => {
      if (prop.required && !data[prop.name]) {
        newErrors[prop.name] = `${prop.displayName} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      let savedCredential: Credential

      if (credential) {
        savedCredential = await updateCredential(credential.id, { name, data })
      } else {
        const createData: CreateCredentialRequest = {
          name,
          type: credentialType.name,
          data
        }
        savedCredential = await createCredential(createData)
      }

      onSave(savedCredential)
    } catch (error) {
      console.error('Failed to save credential:', error)
    }
  }

  const handleTest = async () => {
    if (!validateForm()) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testCredential({
        type: credentialType.name,
        data
      })
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleDataChange = (propertyName: string, value: any) => {
    setData(prev => ({ ...prev, [propertyName]: value }))
    // Clear error when user starts typing
    if (errors[propertyName]) {
      setErrors(prev => ({ ...prev, [propertyName]: '' }))
    }
  }

  const togglePasswordVisibility = (propertyName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [propertyName]: !prev[propertyName]
    }))
  }

  const renderPropertyInput = (property: any) => {
    const value = data[property.name] || ''
    const error = errors[property.name]
    const isPassword = property.type === 'password'
    const showPassword = showPasswords[property.name]

    switch (property.type) {
      case 'string':
      case 'password':
        return (
          <div className="relative">
            <input
              type={isPassword && !showPassword ? 'password' : 'text'}
              value={value}
              onChange={(e) => handleDataChange(property.name, e.target.value)}
              placeholder={property.placeholder || property.description}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              } ${isPassword ? 'pr-10' : ''}`}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => togglePasswordVisibility(property.name)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleDataChange(property.name, parseFloat(e.target.value) || 0)}
            placeholder={property.placeholder || property.description}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        )

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleDataChange(property.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{property.description}</span>
          </label>
        )

      case 'options':
        return (
          <select
            value={value}
            onChange={(e) => handleDataChange(property.name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select an option...</option>
            {property.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleDataChange(property.name, e.target.value)}
            placeholder={property.placeholder || property.description}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: credentialType.color || '#666' }}
              >
                {credentialType.icon || <Key className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {credential ? 'Edit' : 'Create'} {credentialType.displayName}
                </h2>
                <p className="text-sm text-gray-500">{credentialType.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {/* Credential name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credential Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }))
                  }
                }}
                placeholder="Enter a name for this credential"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Credential properties */}
            {credentialType.properties.map((property) => (
              <div key={property.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {property.displayName}
                  {property.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderPropertyInput(property)}
                {errors[property.name] && (
                  <p className="text-sm text-red-600 mt-1">{errors[property.name]}</p>
                )}
                {property.description && !errors[property.name] && (
                  <p className="text-xs text-gray-500 mt-1">{property.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-md flex items-center space-x-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="text-sm">
                {testResult.message || (testResult.success ? 'Connection successful' : 'Connection failed')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleTest}
            disabled={isLoading || isTesting}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Test Connection</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{credential ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}