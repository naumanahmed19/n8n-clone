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
import { Workflow } from '@/types/workflow'
import { Save, Tag, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { CategorySelect } from './CategorySelect'

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
  const [showSetupPanel, setShowSetupPanel] = useState(workflow.settings?.showSetupPanel ?? false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when workflow changes
  useEffect(() => {
    setName(workflow.name)
    setDescription(workflow.description || '')
    setCategory(workflow.category || '')
    setTags(workflow.tags || [])
    setShowSetupPanel(workflow.settings?.showSetupPanel ?? false)
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
        tags,
        settings: {
          ...workflow.settings,
          showSetupPanel
        }
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

  return (
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
            <Label>Category</Label>
            <CategorySelect
              value={category}
              onValueChange={setCategory}
              placeholder="Select a category"
              allowCreate={true}
              showDeleteOption={true}
            />
          </div>

          {/* Show Setup Panel */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showSetupPanel"
              checked={showSetupPanel}
              onChange={(e) => setShowSetupPanel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="showSetupPanel" className="cursor-pointer">
              Show Setup Panel
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Display the floating setup panel on the canvas for quick credential and variable configuration
          </p>

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
  )
}
