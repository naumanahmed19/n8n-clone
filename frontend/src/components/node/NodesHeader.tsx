import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { RefreshCw, Search, SlidersHorizontal, ArrowUpDown, Download } from 'lucide-react'

interface NodesHeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  nodeCount: number
  searchTerm: string
  setSearchTerm: (term: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  // Marketplace filter props
  sortBy?: 'downloads' | 'rating' | 'updated' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  selectedCategory?: string
  categories?: string[]
  onSortChange?: (sortBy: string, sortOrder: string) => void
  onCategoryChange?: (category: string) => void
}

export function NodesHeader({ 
  activeTab, 
  setActiveTab, 
  nodeCount,
  searchTerm,
  setSearchTerm,
  onRefresh,
  isRefreshing = false,
  sortBy = 'downloads',
  sortOrder = 'desc',
  selectedCategory = 'all',
  categories = [],
  onSortChange,
  onCategoryChange
}: NodesHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Title and tabs */}
      <div className="flex items-center justify-between gap-2">
        {/* <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Nodes ({nodeCount})
        </span> */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto flex-1">
          <TabsList className="grid grid-cols-3 h-6 p-0 bg-muted">
            <TabsTrigger 
              value="available" 
              className="text-xs px-2 h-6 data-[state=active]:bg-background"
            >
              Installed
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
      
      {/* Search input with refresh button */}
      {(activeTab === 'available' || activeTab === 'marketplace') && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'available' ? "Search installed nodes..." : "Search marketplace..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onRefresh && activeTab === 'available' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {activeTab === 'marketplace' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.('relevance', sortOrder)}
                    className={sortBy === 'relevance' ? 'bg-accent' : ''}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Relevance
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.('downloads', sortOrder)}
                    className={sortBy === 'downloads' ? 'bg-accent' : ''}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Downloads
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.('rating', sortOrder)}
                    className={sortBy === 'rating' ? 'bg-accent' : ''}
                  >
                    ⭐ Rating
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.('updated', sortOrder)}
                    className={sortBy === 'updated' ? 'bg-accent' : ''}
                  >
                    🕒 Updated
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Order</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.(sortBy, 'desc')}
                    className={sortOrder === 'desc' ? 'bg-accent' : ''}
                  >
                    ↓ Descending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSortChange?.(sortBy, 'asc')}
                    className={sortOrder === 'asc' ? 'bg-accent' : ''}
                  >
                    ↑ Ascending
                  </DropdownMenuItem>

                  {categories.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Category</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => onCategoryChange?.('all')}
                        className={selectedCategory === 'all' ? 'bg-accent' : ''}
                      >
                        All Categories
                      </DropdownMenuItem>
                      {categories.map((category) => (
                        <DropdownMenuItem 
                          key={category}
                          onClick={() => onCategoryChange?.(category)}
                          className={selectedCategory === category ? 'bg-accent' : ''}
                        >
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
