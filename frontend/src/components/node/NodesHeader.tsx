import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'

interface NodesHeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  nodeCount: number
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function NodesHeader({ 
  activeTab, 
  setActiveTab, 
  nodeCount,
  searchTerm,
  setSearchTerm
}: NodesHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Title and tabs */}
      <div className="flex items-center justify-between">
        {/* <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Nodes ({nodeCount})
        </span> */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="grid grid-cols-3 h-6 p-0 bg-muted">
            <TabsTrigger 
              value="available" 
              className="text-xs px-2 h-6 data-[state=active]:bg-background"
            >
              Available
            </TabsTrigger>
            <TabsTrigger 
              value="marketplace" 
              className="text-xs px-2 h-6 data-[state=active]:bg-background"
            >
              Marketplace
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="text-xs px-2 h-6 data-[state=active]:bg-background"
            >
              Upload
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search input - only show for available and marketplace tabs */}
      {(activeTab === 'available' || activeTab === 'marketplace') && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'available' ? "Search available nodes..." : "Search marketplace..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      )}
    </div>
  )
}