import { Button } from '@/components/ui/button'
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
import { Eye, EyeOff, Key, Loader2, TestTube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface CredentialFormSidebarProps {
  credentialType: CredentialType
  editingCredential?: Credential
  onSuccess: (credential: Credential) => void
  onCancel: () => void
}

export function CredentialFormSidebar({ 
  credentialType, 
  editingCredential, 
  onSuccess,
  onCancel 
}: CredentialFormSidebarProps) {
  const {
    createCredential,
    updateCredential,
    testCredential,
    isLoading,
  } = useCredentialStore()

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isTestingCredential, setIsTestingCredential] = useState(false)

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

  const formSchema = createFormSchema(credentialType)
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingCredential?.name || '',
      ...credentialType.properties.reduce((acc, prop) => {
        acc[prop.name] = prop.type === 'boolean' ? false : ''
        return acc
      }, {} as Record<string, any>),
    },
  })

  // Reset form when credentialType changes
  useEffect(() => {
    form.reset({
      name: editingCredential?.name || '',
      ...credentialType.properties.reduce((acc, prop) => {
        acc[prop.name] = prop.type === 'boolean' ? false : ''
        return acc
      }, {} as Record<string, any>),
    })
  }, [credentialType, editingCredential, form])

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const handleTestConnection = async () => {
    try {
      setIsTestingCredential(true)
      const formData = form.getValues()
      
      const credentialData = { ...formData }
      delete credentialData.name

      const result = await testCredential({ 
        type: credentialType.name, 
        data: credentialData 
      })
      
      if (result.success) {
        toast.success('Connection test successful!')
      } else {
        toast.error(`Connection test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTestingCredential(false)
    }
  }

  const onSubmit = async (values: any) => {
    try {
      const { name, ...credentialData } = values
      let credential: Credential

      if (editingCredential) {
        const updateData = {
          name,
          data: credentialData,
        }
        credential = await updateCredential(editingCredential.id, updateData)
        toast.success('Credential updated successfully!')
      } else {
        const createData: CreateCredentialRequest = {
          name,
          type: credentialType.name,
          data: credentialData,
        }
        credential = await createCredential(createData)
        toast.success('Credential created successfully!')
      }

      onSuccess(credential)
    } catch (error) {
      const action = editingCredential ? 'update' : 'create'
      toast.error(`Failed to ${action} credential`)
    }
  }

  return (
    <div className="p-4 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: credentialType.color || '#6B7280' }}
        >
          {credentialType.icon || <Key className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium">{credentialType.displayName}</h3>
          <p className="text-sm text-muted-foreground">{credentialType.description}</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto">
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
            {credentialType.properties.map((property) => (
              <FormField
                key={property.name}
                control={form.control}
                name={property.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {property.displayName}
                      {property.required && ' *'}
                    </FormLabel>
                    <FormControl>
                      {property.type === 'password' ? (
                        <div className="relative">
                          <Input
                            type={showPasswords[property.name] ? 'text' : 'password'}
                            placeholder={property.placeholder}
                            {...field}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility(property.name)}
                          >
                            {showPasswords[property.name] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : property.type === 'number' ? (
                        <Input
                          type="number"
                          placeholder={property.placeholder}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      ) : property.type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm text-muted-foreground">
                            {property.description}
                          </span>
                        </div>
                      ) : property.type === 'options' ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder={property.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {property.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={property.placeholder}
                          {...field}
                        />
                      )}
                    </FormControl>
                    {property.description && (
                      <FormDescription>
                        {property.description}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingCredential || isLoading}
              className="w-full"
            >
              {isTestingCredential ? (
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
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingCredential ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}