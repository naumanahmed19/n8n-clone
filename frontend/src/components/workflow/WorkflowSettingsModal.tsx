import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { workflowService } from '@/services'
import { Workflow } from '@/types/workflow'
import { FolderOpen, Plus, Save, Tag, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { CreateCategoryModal } from './CreateCategoryModal'

interface WorkflowSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  workflow: Workflow
  onSave: (updates: Partial<Workflow>) => void
}

export function WorkflowSettingsModal({ 
  isOpen, 
  onClose, 
  workflow, 
  onSave 
}: WorkflowSettingsModalProps) {
  const [name, setName] = useState(workflow.name)
  const [description, setDescription] = useState(workflow.description || '')
  const [category, setCategory] = useState(workflow.category || '')
  const [tags, setTags] = useState(workflow.tags || [])
  const [newTag, setNewTag] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)

  // Load available categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const categories = await workflowService.getAvailableCategories()
        setAvailableCategories(categories)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  // Reset form when workflow changes
  useEffect(() => {
    setName(workflow.name)
    setDescription(workflow.description || '')
    setCategory(workflow.category || '')
    setTags(workflow.tags || [])
  }, [workflow])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const updates = {
        name: name.trim(),
        description: description.trim(),
        category: category || undefined,
        tags
      }
      await onSave(updates)
      onClose()
    } catch (error) {
      console.error('Failed to save workflow settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCategoryCreated = async (categoryName: string) => {
    // Refresh the categories list
    try {
      const categories = await workflowService.getAvailableCategories()
      setAvailableCategories(categories)
      // Select the newly created category
      setCategory(categoryName)
    } catch (error) {
      console.error('Failed to refresh categories:', error)
    }
  }

  return (
    <>
      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workflow Settings</DialogTitle>
            <DialogDescription>
              Manage your workflow's basic information and categorization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="workflowName">
              Workflow Name *
            </Label>
            <Input
              id="workflowName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="workflowDescription">
              Description
            </Label>
            <Textarea
              id="workflowDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this workflow does"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Category
            </Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(true)}
                  className="w-full px-3 py-2 text-left text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add new category
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            
            {/* Tag Input */}
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                size="sm"
              >
                Add
              </Button>
            </div>

            {/* Existing Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}