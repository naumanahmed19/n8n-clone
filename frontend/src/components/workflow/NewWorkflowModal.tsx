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
import { CreateWorkflowRequest } from '@/services/workflow'
import { FolderOpen, Plus, Tag, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { CreateCategoryModal } from './CreateCategoryModal'

interface NewWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateWorkflow: (data: CreateWorkflowRequest) => void
}

export function NewWorkflowModal({ 
  isOpen, 
  onClose, 
  onCreateWorkflow 
}: NewWorkflowModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
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
      // Reset form when modal opens
      setName('')
      setDescription('')
      setCategory('')
      setTags([])
      setNewTag('')
    }
  }, [isOpen])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    try {
      setIsCreating(true)
      const workflowData: CreateWorkflowRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        tags
      }
      await onCreateWorkflow(workflowData)
      onClose()
    } catch (error) {
      console.error('Failed to create workflow:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.currentTarget === document.activeElement && (e.target as HTMLElement).tagName === 'INPUT') {
        const input = e.target as HTMLInputElement
        if (input.placeholder === 'Add a tag') {
          handleAddTag()
        }
      }
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

  if (!isOpen) return null

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
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up your new workflow with a name, description, and organize it with categories and tags.
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
              autoFocus
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
              placeholder="Describe what this workflow will do"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              Category
            </label>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category (optional)</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            
            {/* Tag Input */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Existing Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
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
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </>
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}