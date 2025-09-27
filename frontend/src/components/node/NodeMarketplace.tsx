import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Clock,
    Command,
    Database,
    Download,
    ExternalLink,
    Globe,
    Star,
    Users,
    Zap
} from 'lucide-react'
import { useMemo, useState } from 'react'

// Mock marketplace node data - in real app this would come from an API
const MARKETPLACE_NODES = [
  {
    id: 'npm-package-1',
    name: 'Slack Advanced',
    description: 'Advanced Slack integration with threads, reactions, and file uploads',
    version: '1.2.3',
    downloads: 15420,
    rating: 4.8,
    author: 'SlackDevs',
    category: 'Communication',
    tags: ['slack', 'messaging', 'notifications'],
    icon: 'fa:slack',
    verified: true,
    lastUpdated: '2024-09-20'
  },
  {
    id: 'npm-package-2',
    name: 'MongoDB Extended',
    description: 'Enhanced MongoDB operations with aggregation pipelines and advanced queries',
    version: '2.1.0',
    downloads: 8930,
    rating: 4.6,
    author: 'DatabaseExperts',
    category: 'Database',
    tags: ['mongodb', 'database', 'aggregation'],
    icon: 'fa:database',
    verified: true,
    lastUpdated: '2024-09-18'
  },
  {
    id: 'npm-package-3',
    name: 'Email Templates Pro',
    description: 'Professional email templates with dynamic content and styling',
    version: '1.5.2',
    downloads: 12350,
    rating: 4.9,
    author: 'EmailMasters',
    category: 'Communication',
    tags: ['email', 'templates', 'html'],
    icon: 'fa:envelope',
    verified: false,
    lastUpdated: '2024-09-15'
  },
  {
    id: 'npm-package-4',
    name: 'Data Transformer',
    description: 'Advanced data transformation with custom functions and filters',
    version: '3.0.1',
    downloads: 25670,
    rating: 4.7,
    author: 'DataWizards',
    category: 'Transform',
    tags: ['data', 'transform', 'filter'],
    icon: 'fa:exchange-alt',
    verified: true,
    lastUpdated: '2024-09-22'
  },
  {
    id: 'npm-package-5',
    name: 'API Gateway',
    description: 'Comprehensive API gateway with rate limiting and authentication',
    version: '1.8.4',
    downloads: 7890,
    rating: 4.4,
    author: 'APIDevs',
    category: 'API',
    tags: ['api', 'gateway', 'auth'],
    icon: 'fa:globe',
    verified: true,
    lastUpdated: '2024-09-10'
  }
]

interface NodeMarketplaceProps {
  searchTerm?: string
}

export function NodeMarketplace({ searchTerm = "" }: NodeMarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [installingNodes, setInstallingNodes] = useState<Set<string>>(new Set())

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(MARKETPLACE_NODES.map(node => node.category))]
    return ['all', ...cats.sort()]
  }, [])

  // Filter nodes based on search and category
  const filteredNodes = useMemo(() => {
    let nodes = MARKETPLACE_NODES

    // Filter by search term
    if (searchTerm) {
      nodes = nodes.filter(node =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      nodes = nodes.filter(node => node.category === selectedCategory)
    }

    return nodes
  }, [searchTerm, selectedCategory])

  // Handle node installation
  const handleInstall = async (nodeId: string) => {
    setInstallingNodes(prev => new Set(prev).add(nodeId))
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log(`Installing node: ${nodeId}`)
      // TODO: Implement actual installation logic
      
      // Show success message
      alert('Node installed successfully!')
    } catch (error) {
      console.error('Installation failed:', error)
      alert('Installation failed. Please try again.')
    } finally {
      setInstallingNodes(prev => {
        const newSet = new Set(prev)
        newSet.delete(nodeId)
        return newSet
      })
    }
  }

  // Get icon for node category
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Communication': Users,
      'Database': Database,
      'Transform': Zap,
      'API': Globe,
      'Trigger': Clock,
      'default': Command
    }
    return iconMap[category] || iconMap.default
  }

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`
    }
    return downloads.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full">
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

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.length === 0 ? (
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">
                {searchTerm ? 'No nodes match your search' : 'No nodes available in marketplace'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredNodes.map((node) => {
              const IconComponent = getCategoryIcon(node.category)
              const isInstalling = installingNodes.has(node.id)
              
              return (
                <div
                  key={node.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{node.name}</h3>
                          {node.verified && (
                            <Badge variant="secondary" className="text-xs h-4 px-1">
                              ✓ Verified
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            v{node.version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {node.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>by {node.author}</span>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {formatDownloads(node.downloads)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {node.rating}
                          </div>
                          <span>Updated {formatDate(node.lastUpdated)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          // Open node details in new tab (mock URL)
                          window.open(`https://npmjs.com/package/${node.id}`, '_blank')
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => handleInstall(node.id)}
                        disabled={isInstalling}
                      >
                        {isInstalling ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                            Installing...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Install
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {node.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs h-4 px-1 text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}