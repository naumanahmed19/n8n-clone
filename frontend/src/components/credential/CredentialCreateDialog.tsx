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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCredentialStore } from '@/stores'
import { CreateCredentialRequest, Credential, CredentialType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, Key, Loader2, Search, TestTube } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isTestingCredential, setIsTestingCredential] = useState(false)
  const [typeSearchTerm, setTypeSearchTerm] = useState('')

  // Initialize form schema based on selected credential type
  const createFormSchema = (credType: CredentialType) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {
      name: z.string().min(1, 'Credential name is required'),
    }

    credType.properties.forEach((prop) => {
      switch (prop.type) {
        case 'string':
        case 'password':
          if (prop.required) {
            schemaFields[prop.name] = z.string().min(1, `${prop.displayName} is required`)
          } else {
            schemaFields[prop.name] = z.string().optional()
          }
          break
        case 'number':
          if (prop.required) {
            schemaFields[prop.name] = z.coerce.number().min(0, `${prop.displayName} is required`)
          } else {
            schemaFields[prop.name] = z.coerce.number().optional()
          }
          break
        case 'boolean':
          schemaFields[prop.name] = z.boolean().default(false)
          break
        case 'options':
          if (prop.required) {
            schemaFields[prop.name] = z.string().min(1, `${prop.displayName} is required`)
          } else {
            schemaFields[prop.name] = z.string().optional()
          }
          break
        default:
          schemaFields[prop.name] = z.string().optional()
      }
    })

    return z.object(schemaFields)
  }

  const form = useForm({
    resolver: selectedType ? zodResolver(createFormSchema(selectedType)) : undefined,
    defaultValues: {
      name: editingCredential?.name || '',
    },
  })

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
        const defaultValues: Record<string, any> = {
          name: editingCredential.name,
        }
        // Note: We don't pre-fill credential data for security reasons
        form.reset(defaultValues)
      }
    }
  }, [editingCredential, credentialTypes, form])

  useEffect(() => {
    if (open && !editingCredential) {
      // Reset to type selection for new credentials
      setStep('type')
      setSelectedType(null)
      form.reset({ name: '' })
      setShowPasswords({})
      setTypeSearchTerm('')
    }
  }, [open, editingCredential, form])

  const handleTypeSelect = (credType: CredentialType) => {
    setSelectedType(credType)
    setStep('form')
    // Reset form with new schema
    form.reset({ name: '' })
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

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const handleTestConnection = async () => {
    const values = form.getValues()
    if (!selectedType) return

    try {
      setIsTestingCredential(true)
      const { name, ...credentialData } = values
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

  const onSubmit = async (values: any) => {
    if (!selectedType) return

    try {
      const { name, ...credentialData } = values

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          {/* Credential Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credential Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a name for this credential" {...field} />
                </FormControl>
                <FormDescription>
                  A unique name to identify this credential
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dynamic credential properties */}
          <div className="space-y-4">
            {selectedType.properties.map((property) => (
              <FormField
                key={property.name}
                control={form.control}
                name={property.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {property.displayName}
                      {property.required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      {property.type === 'password' ? (
                        <div className="relative">
                          <Input
                            type={showPasswords[property.name] ? 'text' : 'password'}
                            placeholder={property.placeholder || property.description}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility(property.name)}
                          >
                            {showPasswords[property.name] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : property.type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm">{property.description}</span>
                        </div>
                      ) : property.type === 'number' ? (
                        <Input
                          type="number"
                          placeholder={property.placeholder || property.description}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      ) : property.type === 'options' && property.options ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${property.displayName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {property.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={property.placeholder || property.description}
                          {...field}
                        />
                      )}
                    </FormControl>
                    {property.description && property.type !== 'boolean' && (
                      <FormDescription>{property.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

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
                Test Connection
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
      </Form>
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
