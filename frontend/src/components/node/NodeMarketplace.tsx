import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCustomNodeStore } from '@/stores/customNode'
import { NodePackageMetadata } from '@/types/customNode'
import { getIconComponent } from '@/utils/iconMapper'
import {
  Command,
  Download,
  ExternalLink
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface NodeMarketplaceProps {
  searchTerm?: string
}

export function NodeMarketplace({ searchTerm = "" }: NodeMarketplaceProps) {
  const {
    searchMarketplace,
    installPackage,
    searchResults,
    searchLoading,
    error
  } = useCustomNodeStore()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [installingNodes, setInstallingNodes] = useState<Set<string>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)

  // Load marketplace data on mount and when search term changes
  useEffect(() => {
    const loadMarketplace = async () => {
      try {
        await searchMarketplace({
          query: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sortBy: 'downloads',
          sortOrder: 'desc',
          limit: 50
        })
        setHasSearched(true)
      } catch (error) {
        console.error('Failed to load marketplace:', error)
        setHasSearched(true)
      }
    }

    loadMarketplace()
  }, [searchTerm, selectedCategory, searchMarketplace])

  // Get unique categories from search results
  const categories = useMemo(() => {
    if (!searchResults?.packages) return ['all']
    const cats = [...new Set(searchResults.packages.map(pkg => {
      // Extract category from keywords or use first keyword
      return pkg.keywords?.[0] || 'Other'
    }))]
    return ['all', ...cats.sort()]
  }, [searchResults])



  // Handle node installation
  const handleInstall = async (pkg: NodePackageMetadata) => {
    setInstallingNodes(prev => new Set(prev).add(pkg.id))

    try {
      await installPackage(pkg.id)
      // Success message will be handled by the store/service
    } catch (error) {
      console.error('Installation failed:', error)
      // Error message will be handled by the store/service
    } finally {
      setInstallingNodes(prev => {
        const newSet = new Set(prev)
        newSet.delete(pkg.id)
        return newSet
      })
    }
  }



  // Render loading state
  if (searchLoading && !hasSearched) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg"></div>
              </div>
              <div className="animate-pulse flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render error state
  if (error && hasSearched) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <Command className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => searchMarketplace({})}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Render empty state
  if ((!searchResults?.packages || searchResults.packages.length === 0) && hasSearched) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">
            {searchTerm ? 'No nodes match your search' : 'No nodes available in marketplace'}
          </p>
        </div>
      </div>
    )
  }

  // Render marketplace nodes in sidebar-style layout
  return (
    <div className="p-0">
      {/* Category Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs capitalize"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Results in flat list */}
      <div className="space-y-0">
        {searchResults?.packages?.map((pkg) => {
          // Get icon component using the utility function (fallback to Command)
          const IconComponent = getIconComponent(pkg.keywords?.[0], pkg.name, pkg.keywords || []) || Command
          const isInstalling = installingNodes.has(pkg.id)

          return (
            <div
              key={pkg.id}
              className="border-b last:border-b-0 cursor-pointer group transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className="p-3">
                {/* Header with icon and title */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md bg-primary">
                    {IconComponent && typeof IconComponent !== 'string' ? (
                      <IconComponent className="h-4 w-4 text-white" />
                    ) : typeof IconComponent === 'string' ? (
                      <img
                        src={IconComponent}
                        alt={pkg.name}
                        className="h-4 w-4"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {pkg.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{pkg.name}</h4>
                      {pkg.verified && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          ✓
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        v{pkg.version}
                      </Badge>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Buttons at bottom */}
                <div className="flex gap-2 items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const url = pkg.homepage || pkg.repository || `https://npmjs.com/package/${pkg.name}`
                      window.open(url, '_blank')
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    aria-label="View Package"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleInstall(pkg)
                    }}
                    disabled={isInstalling}
                    className="flex h-6 items-center justify-center gap-1 rounded-md bg-primary px-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    aria-label={isInstalling ? 'Installing...' : 'Install Package'}
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Installing</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3" />
                        <span className="text-xs">Install</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
