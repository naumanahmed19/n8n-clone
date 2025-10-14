import { Input } from '@/components/ui/input'
import { useCredentialStore } from '@/stores'
import { CredentialType } from '@/types'
import { Key, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

interface CredentialTypeSelectionProps {
  onTypeSelect: (credentialType: CredentialType) => void
}

export function CredentialTypeSelection({ onTypeSelect }: CredentialTypeSelectionProps) {
  const { credentialTypes } = useCredentialStore()
  const [searchTerm, setSearchTerm] = useState('')

  // Filter credential types based on search term
  const filteredCredentialTypes = useMemo(() => {
    if (!searchTerm) return credentialTypes
    
    return credentialTypes.filter(credType =>
      credType.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [credentialTypes, searchTerm])

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex-shrink-0">
        <h3 className="text-sm font-medium mb-1">Choose Credential Type</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Select the type of credential you want to create
        </p>
      </div>

      {/* Search input */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search credential types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="space-y-2 pr-1">
          {filteredCredentialTypes.length > 0 ? (
            filteredCredentialTypes.map((credType) => (
              <div
                key={credType.name}
                className="group cursor-pointer border border-border rounded-md hover:bg-sidebar-accent hover:border-sidebar-accent transition-colors p-3 w-full overflow-hidden"
                onClick={() => onTypeSelect(credType)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: credType.color || '#6B7280' }}
                  >
                    {credType.icon || <Key className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="text-sm font-medium text-sidebar-foreground group-hover:text-sidebar-accent-foreground truncate">
                      {credType.displayName}
                    </h4>
                    <p className="text-xs text-muted-foreground group-hover:text-sidebar-accent-foreground/80 break-words">
                      {credType.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No credential types found</p>
              <p className="text-xs">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
