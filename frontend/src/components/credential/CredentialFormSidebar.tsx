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
import { apiClient } from '@/services/api'
import { useCredentialStore } from '@/stores'
import { CreateCredentialRequest, Credential, CredentialType } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Eye, EyeOff, Key, Loader2, LogIn, TestTube } from 'lucide-react'
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
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Initialize form schema based on selected credential type
  const createFormSchema = (credType: CredentialType) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {
      name: z.string()
        .min(1, 'Credential name is required')
        .min(3, 'Credential name must be at least 3 characters')
        .max(100, 'Credential name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Credential name can only contain letters, numbers, spaces, hyphens, and underscores'),
    }

    credType.properties.forEach((prop) => {
      switch (prop.type) {
        case 'string':
          if (prop.required) {
            let validator = z.string().min(1, `${prop.displayName} is required`)
            
            // Add specific validation for OAuth fields
            if (prop.name === 'clientId') {
              validator = validator
                .min(10, 'Client ID seems too short')
                .max(500, 'Client ID seems too long')
                .regex(/^[a-zA-Z0-9\-._~]+$/, 'Client ID contains invalid characters')
            }
            
            schemaFields[prop.name] = validator
          } else {
            schemaFields[prop.name] = z.string().optional()
          }
          break
          
        case 'password':
          if (prop.required) {
            let validator = z.string().min(1, `${prop.displayName} is required`)
            
            // Add specific validation for OAuth secret
            if (prop.name === 'clientSecret') {
              validator = validator
                .min(10, 'Client Secret seems too short')
                .max(500, 'Client Secret seems too long')
            }
            
            schemaFields[prop.name] = validator
          } else {
            schemaFields[prop.name] = z.string().optional()
          }
          break
          
        case 'number':
          if (prop.required) {
            schemaFields[prop.name] = z.coerce
              .number({
                invalid_type_error: `${prop.displayName} must be a number`,
              })
              .min(0, `${prop.displayName} must be a positive number`)
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
    mode: 'onBlur', // Validate when user leaves a field
    reValidateMode: 'onChange', // Re-validate on every change after first error
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

      // For OAuth credentials, we need the saved credential with tokens
      if (credentialType.name === 'googleSheetsOAuth2' || credentialType.name === 'googleDriveOAuth2') {
        if (!editingCredential) {
          // New OAuth credential - can't test until OAuth is complete
          toast.error('Please complete "Sign in with Google" first before testing')
          setIsTestingCredential(false)
          return
        }
        
        // Use the saved credential to test (has tokens)
        const result = await apiClient.post('/credentials/test-saved', {
          credentialId: editingCredential.id,
        })
        
        if (result.success && result.data.success) {
          toast.success(result.data.message || 'Connection test successful!')
        } else {
          toast.error(result.data.message || 'Connection test failed')
        }
      } else {
        // Regular credentials - test with form data
        const result = await testCredential({ 
          type: credentialType.name, 
          data: credentialData 
        })
        
        if (result.success) {
          toast.success('Connection test successful!')
        } else {
          toast.error(`Connection test failed: ${result.error}`)
        }
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTestingCredential(false)
    }
  }

  const handleOAuthAuthorization = async () => {
    try {
      setIsAuthenticating(true)

      const formData = form.getValues()
      const { name, ...credentialData } = formData

      // Validate the entire form first (especially credential name)
      const isValid = await form.trigger()
      if (!isValid) {
        toast.error('Please fix the validation errors before signing in')
        setIsAuthenticating(false)
        return
      }

      // Validate that client ID and secret are provided
      if (!credentialData.clientId || !credentialData.clientSecret) {
        toast.error('Please enter Client ID and Client Secret before authorizing')
        setIsAuthenticating(false)
        return
      }

      // Build authorization URL params
      const params = new URLSearchParams()
      
      if (editingCredential) {
        // Editing existing credential - use credential ID
        params.append('credentialId', editingCredential.id)
      } else {
        // New credential - pass client credentials and name
        params.append('clientId', credentialData.clientId)
        params.append('clientSecret', credentialData.clientSecret)
        params.append('credentialName', name || `${credentialType.displayName} - ${new Date().toLocaleDateString()}`)
        params.append('credentialType', credentialType.name)
      }

      // Get the authorization URL from the backend
      const response = await apiClient.get(
        `/oauth/google/authorize?${params.toString()}`
      )

      if (response.success && response.data?.authorizationUrl) {
        // Open in a popup window instead of redirecting the current tab
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        
        const popup = window.open(
          response.data.authorizationUrl,
          'GoogleOAuthPopup',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        )

        if (!popup) {
          toast.error('Popup blocked. Please allow popups and try again.')
          setIsAuthenticating(false)
          return
        }

        // Listen for messages from the popup (OAuth callback)
        const messageHandler = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin) {
            return
          }

          if (event.data.type === 'oauth-success') {
            window.removeEventListener('message', messageHandler)
            toast.success('Successfully authenticated with Google!')
            
            // Credential is now created/updated on the backend with tokens
            // Close the sidebar and refresh the credential list
            if (event.data.credential) {
              onSuccess(event.data.credential)
            }
            
            // Close the popup
            if (popup && !popup.closed) {
              popup.close()
            }
            
            setIsAuthenticating(false)
          } else if (event.data.type === 'oauth-error') {
            window.removeEventListener('message', messageHandler)
            
            // Get the error message from the event
            const rawError = event.data.error || 'Authentication failed'
            
            // Provide more descriptive error messages based on error content
            let errorMessage = rawError
            
            if (rawError.includes('redirect_uri_mismatch')) {
              errorMessage = 'Redirect URI mismatch. Please ensure your Google Cloud Console has this callback URL configured: ' + response.data.callbackUrl
            } else if (rawError.includes('access_denied')) {
              errorMessage = 'Access denied. You need to approve the permissions to continue.'
            } else if (rawError.includes('already exists')) {
              errorMessage = rawError // Show as-is for duplicate credential names
            } else if (rawError.includes('invalid_grant')) {
              errorMessage = 'Invalid authorization code. Please try again.'
            }
            
            toast.error(errorMessage)
            
            if (popup && !popup.closed) {
              popup.close()
            }
            
            setIsAuthenticating(false)
          }
        }

        window.addEventListener('message', messageHandler)

        // Check if popup was closed without completing
        const popupCheckInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheckInterval)
            window.removeEventListener('message', messageHandler)
            setIsAuthenticating(false)
          }
        }, 500)
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error: any) {
      console.error('OAuth authorization error:', error)
      toast.error(error.message || 'Failed to start OAuth authorization')
      setIsAuthenticating(false)
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
                      {property.name === 'oauthCallbackUrl' ? (
                        // Special read-only field for OAuth callback URL with copy button
                        <div className="relative">
                          <Input
                            value={property.default || field.value}
                            readOnly
                            className="pr-20 bg-gray-50 cursor-default"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => {
                              navigator.clipboard.writeText(property.default || field.value || '')
                              toast.success('Callback URL copied to clipboard!')
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : property.type === 'password' ? (
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
              )
            )}
          </div>

          {/* Footer buttons */}
          <div className="space-y-2 pt-4 border-t">
            {/* OAuth Authorization Button for Google Sheets and Google Drive */}
            {(credentialType.name === 'googleSheetsOAuth2' || credentialType.name === 'googleDriveOAuth2') && (
              <Button
                type="button"
                onClick={handleOAuthAuthorization}
                disabled={isAuthenticating || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Opening Google...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {form.getValues('accessToken') 
                      ? 'Re-authorize with Google' 
                      : 'Sign in with Google'}
                  </>
                )}
              </Button>
            )}

            {/* Test Connection Button */}
            {/* For OAuth credentials, only show test button if editing (credential already exists with tokens) */}
            {((credentialType.name !== 'googleSheetsOAuth2' && credentialType.name !== 'googleDriveOAuth2') || editingCredential) && (
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
            )}
            
            {/* Create/Cancel buttons - hide for OAuth credentials */}
            {(credentialType.name !== 'googleSheetsOAuth2' && credentialType.name !== 'googleDriveOAuth2') && (
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
            )}

            {/* For OAuth credentials, only show Cancel button */}
            {(credentialType.name === 'googleSheetsOAuth2' || credentialType.name === 'googleDriveOAuth2') && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
