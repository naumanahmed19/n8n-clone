import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormFieldConfig, FormGenerator } from '@/components/ui/form-generator'
import { FieldValidator } from '@/components/ui/form-generator/FieldValidator'
import { Input } from '@/components/ui/input'
import { useCredentialStore } from '@/stores'
import { CreateCredentialRequest, Credential, CredentialType } from '@/types'
import { ArrowLeft, Key, Loader2, Search, TestTube } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CredentialCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (credential: Credential) => void
  editingCredential?: Credential
}

export function CredentialCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  editingCredential,
}: CredentialCreateDialogProps) {
  const {
    credentialTypes,
    fetchCredentialTypes,
    createCredential,
    updateCredential,
    testCredential,
    isLoading,
  } = useCredentialStore()

  const [step, setStep] = useState<'type' | 'form'>('type')
  const [selectedType, setSelectedType] = useState<CredentialType | null>(null)
  const [isTestingCredential, setIsTestingCredential] = useState(false)
  const [typeSearchTerm, setTypeSearchTerm] = useState('')
  const [formValues, setFormValues] = useState<Record<string, any>>({
    name: editingCredential?.name || '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (credentialTypes.length === 0) {
      fetchCredentialTypes()
    }
  }, [credentialTypes.length, fetchCredentialTypes])

  useEffect(() => {
    if (editingCredential && credentialTypes.length > 0) {
      const credType = credentialTypes.find(ct => ct.name === editingCredential.type)
      if (credType) {
        setSelectedType(credType)
        setStep('form')
        // Reset form with editing credential data
        setFormValues({ name: editingCredential.name })
      }
    }
  }, [editingCredential, credentialTypes])

  useEffect(() => {
    if (open && !editingCredential) {
      // Reset to type selection for new credentials
      setStep('type')
      setSelectedType(null)
      setFormValues({ name: '' })
      setFormErrors({})
      setTypeSearchTerm('')
    }
  }, [open, editingCredential])

  const handleTypeSelect = (credType: CredentialType) => {
    setSelectedType(credType)
    setStep('form')
    // Reset form with new schema
    setFormValues({ name: '' })
    setFormErrors({})
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Filter credential types based on search term
  const filteredCredentialTypes = React.useMemo(() => {
    if (!typeSearchTerm) return credentialTypes
    
    return credentialTypes.filter(credType =>
      credType.displayName.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
      credType.name.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
      credType.description?.toLowerCase().includes(typeSearchTerm.toLowerCase())
    )
  }, [credentialTypes, typeSearchTerm])

  const handleTestConnection = async () => {
    if (!selectedType) return

    // Validate all fields using FieldValidator
    const allFields: FormFieldConfig[] = [
      {
        name: 'name',
        displayName: 'Credential Name',
        type: 'text',
        required: true,
        placeholder: 'Enter a name for this credential',
        description: 'A unique name to identify this credential',
      },
      ...(selectedType.properties as FormFieldConfig[])
    ]

    const errors = FieldValidator.validateForm(allFields, formValues)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsTestingCredential(true)
      const { name, ...credentialData } = formValues
      const result = await testCredential({
        type: selectedType.name,
        data: credentialData,
      })

      if (result.success) {
        toast.success('Connection test successful!')
      } else {
        toast.error(`Connection test failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTestingCredential(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return

    // Validate all fields using FieldValidator
    const allFields: FormFieldConfig[] = [
      {
        name: 'name',
        displayName: 'Credential Name',
        type: 'text',
        required: true,
        placeholder: 'Enter a name for this credential',
        description: 'A unique name to identify this credential',
      },
      ...(selectedType.properties as FormFieldConfig[])
    ]

    const errors = FieldValidator.validateForm(allFields, formValues)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { name, ...credentialData } = formValues

      let credential: Credential
      if (editingCredential) {
        credential = await updateCredential(editingCredential.id, {
          name,
          data: credentialData,
        })
        toast.success('Credential updated successfully!')
      } else {
        const createData: CreateCredentialRequest = {
          name,
          type: selectedType.name,
          data: credentialData,
        }
        credential = await createCredential(createData)
        toast.success('Credential created successfully!')
      }

      onSuccess(credential)
      onOpenChange(false)
    } catch (error) {
      const action = editingCredential ? 'update' : 'create'
      toast.error(`Failed to ${action} credential`)
    }
  }

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium mb-1">Choose Credential Type</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Select the type of credential you want to create
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search credential types..."
          value={typeSearchTerm}
          onChange={(e) => setTypeSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
        {filteredCredentialTypes.length > 0 ? (
          filteredCredentialTypes.map((credType) => (
          <Card
            key={credType.name}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTypeSelect(credType)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: credType.color || '#6B7280' }}
                >
                  {credType.icon || <Key className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm">{credType.displayName}</CardTitle>
                  <CardDescription className="text-xs">
                    {credType.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No credential types found</p>
            <p className="text-xs">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderCredentialForm = () => {
    if (!selectedType) return null

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: selectedType.color || '#6B7280' }}
          >
            {selectedType.icon || <Key className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{selectedType.displayName}</h3>
            <p className="text-sm text-muted-foreground">{selectedType.description}</p>
          </div>
        </div>

        {/* Use FormGenerator for all fields */}
        <FormGenerator
          fields={[
            {
              name: 'name',
              displayName: 'Credential Name',
              type: 'text',
              required: true,
              placeholder: 'Enter a name for this credential',
              description: 'A unique name to identify this credential',
            },
            ...((selectedType?.properties || []) as FormFieldConfig[])
          ]}
          values={formValues}
          errors={formErrors}
          onChange={handleFieldChange}
          showRequiredIndicator={true}
          disableAutoValidation={true}
          className="space-y-4"
        />

        <DialogFooter>
          <div className="flex items-center gap-2 justify-end w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingCredential || isLoading}
            >
              {isTestingCredential ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Test Connection xxx
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCredential ? 'Update' : 'Create'} Credential
            </Button>
          </div>
        </DialogFooter>
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          {step === 'form' && !editingCredential && (
            <div className="flex items-center mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('type')}
                className="flex items-center gap-2 p-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          )}
          <DialogTitle>
            {editingCredential ? 'Edit Credential' : 'Create New Credential'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type'
              ? 'Choose the type of credential you want to create'
              : 'Fill in the credential details below'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-1">
          {step === 'type' ? renderTypeSelection() : renderCredentialForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
