import { CredentialFormSidebar } from '@/components/credential/CredentialFormSidebar'
import { CredentialsHeader } from '@/components/credential/CredentialsHeader'
import { CredentialTypeSelection } from '@/components/credential/CredentialTypeSelection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarContext } from '@/contexts'
import { credentialService } from '@/services'
import { useCredentialStore } from '@/stores'
import { Credential, CredentialType } from '@/types'
import {
  Activity,
  Calendar,
  Clock,
  Copy,
  Edit,
  Key as KeyIcon,
  MoreHorizontal,
  Shield,
  TestTube,
  Trash2,
  Users
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface CredentialsListProps {}

export function CredentialsList({}: CredentialsListProps) {
  const navigate = useNavigate()
  const {
    credentialsData: credentials,
    setCredentialsData: setCredentials,
    isCredentialsLoaded,
    setIsCredentialsLoaded,
    credentialsError: error,
    setCredentialsError: setError,
    setHeaderSlot,
    setDetailSidebar
  } = useSidebarContext()
  
  const { 
    credentialTypes,
    fetchCredentialTypes,
    deleteCredential: deleteCredentialFromStore 
  } = useCredentialStore()
  
  const [isLoading, setIsLoading] = useState(!isCredentialsLoaded)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  
  // Dialog states
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)

  // CRUD handlers (defined early to avoid hoisting issues)
  const handleCreateCredential = () => {
    console.log('Create credential clicked')
    setEditingCredential(null)
    setDetailSidebar({
      isOpen: true,
      title: 'Create New Credential',
      content: <CredentialTypeSelection onTypeSelect={handleTypeSelect} />
    })
  }
  
  const handleTypeSelect = (credentialType: CredentialType) => {
    setDetailSidebar({
      isOpen: true,
      title: `Create ${credentialType.displayName}`,
      content: (
        <CredentialFormSidebar
          credentialType={credentialType}
          editingCredential={editingCredential || undefined}
          onSuccess={handleCredentialSuccess}
          onCancel={handleCloseDetailSidebar}
        />
      )
    })
  }
  
  const handleCloseDetailSidebar = () => {
    setDetailSidebar(null)
    setEditingCredential(null)
  }

  const handleEditCredential = (credential: Credential) => {
    console.log('Edit credential clicked:', credential)
    setEditingCredential(credential)
    
    // Find the credential type for the editing credential
    const credentialType = credentialTypes.find(ct => ct.name === credential.type)
    
    if (credentialType) {
      setDetailSidebar({
        isOpen: true,
        title: `Edit ${credential.name}`,
        content: (
          <CredentialFormSidebar
            credentialType={credentialType}
            editingCredential={credential}
            onSuccess={handleCredentialSuccess}
            onCancel={handleCloseDetailSidebar}
          />
        )
      })
    } else {
      toast.error('Credential type not found')
    }
  }

  const handleDeleteCredential = async (credential: Credential) => {
    try {
      await deleteCredentialFromStore(credential.id)
      // Refresh the credentials list
      const updatedCredentials = credentials.filter(c => c.id !== credential.id)
      setCredentials(updatedCredentials)
      toast.success('Credential deleted successfully')
    } catch (error) {
      console.error('Failed to delete credential:', error)
      toast.error('Failed to delete credential')
    }
  }

  const handleTestCredential = async (credential: Credential) => {
    try {
      // This would need to be implemented in the store/service
      toast.info(`Testing credential: ${credential.name}`)
      // const result = await testCredential({ type: credential.type, data: credential.data })
      // if (result.success) {
      //   toast.success('Credential test successful')
      // } else {
      //   toast.error('Credential test failed: ' + result.error)
      // }
    } catch (error) {
      toast.error('Failed to test credential')
    }
  }

  const handleDuplicateCredential = (credential: Credential) => {
    // Find the credential type and open the form with that type
    const credentialType = credentialTypes.find(ct => ct.name === credential.type)
    
    if (credentialType) {
      setEditingCredential(null) // Don't pre-fill data for security
      setDetailSidebar({
        isOpen: true,
        title: `Create ${credentialType.displayName}`,
        content: (
          <CredentialFormSidebar
            credentialType={credentialType}
            onSuccess={handleCredentialSuccess}
            onCancel={handleCloseDetailSidebar}
          />
        )
      })
      toast.info(`Creating duplicate of credential: ${credential.name}`)
    } else {
      toast.error('Credential type not found')
    }
  }

  const handleCredentialSuccess = async () => {
    try {
      // Refresh credentials list
      const updatedCredentials = await credentialService.getCredentials()
      setCredentials(updatedCredentials)
      handleCloseDetailSidebar()
      toast.success(`Credential ${editingCredential ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Failed to refresh credentials:', error)
      // Still close sidebar on success
      handleCloseDetailSidebar()
    }
  }

  const handleCredentialClick = (credentialId: string) => {
    navigate(`/credentials/${credentialId}`)
  }

  useEffect(() => {
    const fetchCredentials = async () => {
      // Don't fetch if we already have data loaded
      if (isCredentialsLoaded && credentials.length > 0) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch fresh data
        const fetchedCredentials = await credentialService.getCredentials()
        setCredentials(fetchedCredentials)
        setIsCredentialsLoaded(true)
      } catch (err) {
        console.error('Failed to fetch credentials:', err)
        setError('Failed to load credentials')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredentials()
  }, [isCredentialsLoaded, setCredentials, setIsCredentialsLoaded, setError])

  // Filter credentials based on search term
  const filteredCredentials = React.useMemo(() => {
    if (!localSearchTerm) return credentials
    
    return credentials.filter(credential =>
      credential.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
      credential.type.toLowerCase().includes(localSearchTerm.toLowerCase())
    )
  }, [credentials, localSearchTerm])

  // Initialize credential types
  useEffect(() => {
    fetchCredentialTypes()
  }, [fetchCredentialTypes])

  // Set header slot for credentials
  useEffect(() => {
    setHeaderSlot(
      <CredentialsHeader 
        credentialsCount={filteredCredentials.length}
        searchTerm={localSearchTerm}
        onSearchChange={setLocalSearchTerm}
        onCreateClick={handleCreateCredential}
      />
    )
    
    // Clean up header slot when component unmounts
    return () => {
      setHeaderSlot(null)
    }
  }, [setHeaderSlot, filteredCredentials.length, localSearchTerm, handleCreateCredential])

  const handleCredentialAction = (action: string, credentialId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const credential = credentials.find(c => c.id === credentialId)
    if (!credential) return

    switch (action) {
      case 'edit':
        handleEditCredential(credential)
        break
      case 'test':
        handleTestCredential(credential)
        break
      case 'duplicate':
        handleDuplicateCredential(credential)
        break
      case 'delete':
        handleDeleteCredential(credential)
        break
      default:
        console.log(`Unknown action: ${action}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCredentialIcon = (type: string) => {
    // You can customize icons based on credential type
    const iconMap: Record<string, React.ReactNode> = {
      'http': <Activity className="h-4 w-4" />,
      'database': <Shield className="h-4 w-4" />,
      'api': <KeyIcon className="h-4 w-4" />,
      'oauth2': <Users className="h-4 w-4" />,
      default: <KeyIcon className="h-4 w-4" />
    }
    
    return iconMap[type.toLowerCase()] || iconMap.default
  }

  const isExpiringSoon = (expiresAt?: string | null) => {
    if (!expiresAt) return false
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <KeyIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (filteredCredentials.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <KeyIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">
            {localSearchTerm ? 'No credentials match your search' : 'No credentials found'}
          </p>
          {!localSearchTerm && (
            <div className="space-y-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateCredential}
              >
                Create Your First Credential
              </Button>

            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-0">
        {filteredCredentials.map((credential) => (
          <div
            key={credential.id}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-b last:border-b-0 cursor-pointer group"
            onClick={() => handleCredentialClick(credential.id)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getCredentialIcon(credential.type)}
                  <h4 className="text-sm font-medium truncate">{credential.name}</h4>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline"
                      className="text-xs h-5"
                    >
                      {credential.type}
                    </Badge>
                    {credential.isShared && (
                      <Badge 
                        variant="secondary"
                        className="text-xs h-5"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {isExpired(credential.expiresAt) && (
                      <Badge 
                        variant="destructive"
                        className="text-xs h-5"
                      >
                        Expired
                      </Badge>
                    )}
                    {isExpiringSoon(credential.expiresAt) && !isExpired(credential.expiresAt) && (
                      <Badge 
                        variant="outline"
                        className="text-xs h-5 border-orange-500 text-orange-600"
                      >
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('edit', credential.id, e)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('test', credential.id, e)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('duplicate', credential.id, e)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('delete', credential.id, e)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(credential.updatedAt)}</span>
                  </div>
                  {credential.lastUsedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Used {formatDate(credential.lastUsedAt)}</span>
                    </div>
                  )}
                  {credential.usageCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{credential.usageCount} uses</span>
                    </div>
                  )}
                </div>
                
                {credential.expiresAt && !isExpired(credential.expiresAt) && (
                  <Badge variant="outline" className="text-xs h-4">
                    Expires {formatDate(credential.expiresAt)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail sidebar is managed by the main app sidebar */}
    </>
  )
}