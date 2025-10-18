import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormFieldConfig, FormGenerator, FormGeneratorRef } from '@/components/ui/form-generator'
import { useCredentialStore } from '@/stores'
import { CreateCredentialRequest, Credential, CredentialType } from '@/types'
import { CheckCircle, Key, Loader2, TestTube, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface CredentialModalProps {
  open: boolean
  credentialType: CredentialType
  credential?: Credential
  onClose: () => void
  onSave: (credential: Credential) => void
}

export function CredentialModal({ 
  open,
  credentialType, 
  credential, 
  onClose, 
  onSave 
}: CredentialModalProps) {
  const { createCredential, updateCredential, testCredential, isLoading } = useCredentialStore()
  const formRef = useRef<FormGeneratorRef>(null)
  
  const [formValues, setFormValues] = useState<Record<string, any>>({
    name: credential?.name || '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Memoize fields array to prevent recreating on every render
  const fields = useMemo((): FormFieldConfig[] => [
    {
      name: 'name',
      displayName: 'Credential Name',
      type: 'text',
      required: true,
      placeholder: 'Enter a name for this credential',
      description: 'A unique name to identify this credential',
    },
    ...(credentialType.properties as FormFieldConfig[])
  ], [credentialType.properties])

  useEffect(() => {
    // Initialize form data with default values
    const initialData: Record<string, any> = {
      name: credential?.name || '',
    }
    credentialType.properties.forEach(prop => {
      if (prop.type === 'boolean') {
        initialData[prop.name] = false
      } else {
        initialData[prop.name] = ''
      }
    })
    setFormValues(initialData)
    setFormErrors({}) // Clear errors
    setTestResult(null) // Clear test result
  }, [credentialType, credential, open])

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    setFormErrors(prev => {
      if (!prev[name]) return prev // No change needed
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const validateForm = useCallback((): boolean => {
    if (!formRef.current) return false
    
    const errors = formRef.current.validate()
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [])

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    try {
      const { name, ...data } = formValues
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
  }, [validateForm, formValues, credential, updateCredential, createCredential, credentialType.name, onSave])

  const handleTest = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const { name, ...data } = formValues
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
  }, [validateForm, formValues, credentialType.name, testCredential])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: credentialType.color || '#6B7280' }}
            >
              {credentialType.icon || <Key className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle>
                {credential ? 'Edit' : 'Create'} {credentialType.displayName}
              </DialogTitle>
              <DialogDescription>
                {credentialType.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <div className="overflow-y-auto max-h-[60vh] px-1">
          <FormGenerator
            ref={formRef}
            fields={fields}
            values={formValues}
            errors={formErrors}
            onChange={handleFieldChange}
            showRequiredIndicator={true}
            disableAutoValidation={true}
            className="space-y-4"
          />

          {/* Test result */}
          {testResult && (
            <Alert 
              variant={testResult.success ? "default" : "destructive"}
              className="mt-4"
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult.message || (testResult.success ? 'Connection successful' : 'Connection failed')}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isLoading || isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {credential ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
