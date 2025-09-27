import React, { useEffect, useState } from 'react'
import { credentialService } from '@/services'
import { Credential } from '@/types'
import { 
  Activity, 
  Calendar, 
  MoreHorizontal, 
  Shield,
  Key as KeyIcon,
  Clock,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface CredentialsListProps {
  searchTerm?: string
}

export function CredentialsList({ searchTerm = "" }: CredentialsListProps) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedCredentials = await credentialService.getCredentials()
        setCredentials(fetchedCredentials)
      } catch (err) {
        console.error('Failed to fetch credentials:', err)
        setError('Failed to load credentials')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredentials()
  }, [])

  // Filter credentials based on search term
  const filteredCredentials = React.useMemo(() => {
    if (!searchTerm) return credentials
    
    return credentials.filter(credential =>
      credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [credentials, searchTerm])

  const handleCredentialClick = (credentialId: string) => {
    window.location.href = `/credentials/${credentialId}`
  }

  const handleCredentialAction = (action: string, credentialId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log(`${action} credential:`, credentialId)
    // TODO: Implement credential actions (edit, test, delete, etc.)
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
            {searchTerm ? 'No credentials match your search' : 'No credentials found'}
          </p>
          {!searchTerm && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/credentials/new'}
            >
              Create Your First Credential
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-0">
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
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('test', credential.id, e)}
                    >
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('duplicate', credential.id, e)}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleCredentialAction('delete', credential.id, e)}
                      className="text-red-600"
                    >
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
    </div>
  )
}