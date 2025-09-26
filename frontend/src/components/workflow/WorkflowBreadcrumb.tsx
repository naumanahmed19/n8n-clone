import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { workflowService } from '@/services/workflow'
import { ChevronDown, FolderOpen } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface WorkflowBreadcrumbProps {
  category?: string
  title: string
  onCategoryChange: (category: string) => void
  onTitleChange: (title: string) => void
  className?: string
}

export function WorkflowBreadcrumb({
  category,
  title,
  onCategoryChange,
  onTitleChange,
  className,
}: WorkflowBreadcrumbProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(title)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Load available categories
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const categories = await workflowService.getAvailableCategories()
        setAvailableCategories(categories)
      } catch (error) {
        console.error('Failed to load categories:', error)
        // Fallback to some default categories
        setAvailableCategories(['General', 'Data Processing', 'Automation', 'Integration', 'Utility'])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // Update tempTitle when title prop changes
  useEffect(() => {
    setTempTitle(title)
  }, [title])

  const handleTitleClick = () => {
    setIsEditingTitle(true)
    setTempTitle(title)
  }

  const handleTitleSubmit = () => {
    onTitleChange(tempTitle.trim() || 'Untitled Workflow')
    setIsEditingTitle(false)
    // Don't auto-save title, let the main save handle it
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setTempTitle(title)
      setIsEditingTitle(false)
    }
  }

  const handleCategorySelect = (selectedCategory: string) => {
    onCategoryChange(selectedCategory)
    // Don't auto-save category, let the main save handle it
  }

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <FolderOpen className="w-4 h-4" />
                <span>{category || 'Uncategorized'}</span>
                <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {isLoadingCategories ? (
                  <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleCategorySelect('')}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Uncategorized
                    </DropdownMenuItem>
                    {availableCategories.map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={category === cat ? 'bg-accent' : ''}
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {cat}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            {isEditingTitle ? (
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="h-6 px-1 text-sm border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring bg-transparent min-w-[200px]"
                placeholder="Workflow title"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <BreadcrumbPage
                onClick={handleTitleClick}
                className="cursor-pointer hover:text-foreground transition-colors"
                title="Click to edit title"
              >
                {title || 'Untitled Workflow'}
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}