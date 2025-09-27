import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface CredentialsHeaderProps {
  credentialsCount: number
  searchTerm: string
  onSearchChange: (term: string) => void
  onCreateClick: () => void
}

export function CredentialsHeader({ 
  credentialsCount, 
  searchTerm, 
  onSearchChange, 
  onCreateClick 
}: CredentialsHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Credentials ({credentialsCount})
        </span>
        <Button
          onClick={() => {
            console.log('New button clicked in header')
            onCreateClick()
          }}
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search credentials..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}