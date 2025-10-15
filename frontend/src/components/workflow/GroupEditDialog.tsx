import { useCallback, useEffect, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Palette, Type } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkflowStore } from '@/stores'

interface GroupEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
}

// Predefined color palette for groups
const GROUP_COLORS = [
  { name: 'Blue', value: '#3b82f6', light: '#dbeafe' },
  { name: 'Green', value: '#10b981', light: '#d1fae5' },
  { name: 'Purple', value: '#8b5cf6', light: '#ede9fe' },
  { name: 'Pink', value: '#ec4899', light: '#fce7f3' },
  { name: 'Orange', value: '#f97316', light: '#ffedd5' },
  { name: 'Red', value: '#ef4444', light: '#fee2e2' },
  { name: 'Yellow', value: '#eab308', light: '#fef9c3' },
  { name: 'Teal', value: '#14b8a6', light: '#ccfbf1' },
  { name: 'Indigo', value: '#6366f1', light: '#e0e7ff' },
  { name: 'Gray', value: '#6b7280', light: '#f3f4f6' },
]

export function GroupEditDialog({ open, onOpenChange, groupId }: GroupEditDialogProps) {
  const { getNode } = useReactFlow()
  const { updateNode, workflow, saveToHistory, setDirty } = useWorkflowStore()
  
  const [groupName, setGroupName] = useState('')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [customColor, setCustomColor] = useState('')
  const [selectedBorderColor, setSelectedBorderColor] = useState<string | null>(null)
  const [customBorderColor, setCustomBorderColor] = useState('')

  // Load current group data when dialog opens
  useEffect(() => {
    if (open && groupId) {
      const node = getNode(groupId)
      const workflowNode = workflow?.nodes.find(n => n.id === groupId)
      
      if (workflowNode) {
        setGroupName(workflowNode.name || `Group ${groupId}`)
        
        // Check if there's a background color set
        const bgColor = node?.style?.backgroundColor || workflowNode.style?.backgroundColor
        if (bgColor) {
          // Check if it matches a predefined color
          const matchedColor = GROUP_COLORS.find(
            c => c.value === bgColor || c.light === bgColor
          )
          if (matchedColor) {
            setSelectedColor(matchedColor.value)
          } else {
            setCustomColor(bgColor)
            setSelectedColor(null)
          }
        } else {
          setSelectedColor(null)
          setCustomColor('')
        }
        
        // Check if there's a border color set
        const borderColor = node?.style?.borderColor || workflowNode.style?.borderColor
        if (borderColor) {
          // Check if it matches a predefined color
          const matchedBorderColor = GROUP_COLORS.find(
            c => c.value === borderColor
          )
          if (matchedBorderColor) {
            setSelectedBorderColor(matchedBorderColor.value)
          } else {
            setCustomBorderColor(borderColor)
            setSelectedBorderColor(null)
          }
        } else {
          setSelectedBorderColor(null)
          setCustomBorderColor('')
        }
      }
    }
  }, [open, groupId, getNode, workflow])

  const handleSave = useCallback(() => {
    if (!groupId) return

    // Take snapshot for undo/redo
    saveToHistory('Edit group properties')

    const workflowNode = workflow?.nodes.find(n => n.id === groupId)
    if (!workflowNode) return

    // Determine the background color to use
    let backgroundColor: string | undefined
    if (selectedColor) {
      // Use light version of predefined color
      const colorObj = GROUP_COLORS.find(c => c.value === selectedColor)
      backgroundColor = colorObj?.light
    } else if (customColor) {
      backgroundColor = customColor
    } else {
      // Remove background color
      backgroundColor = undefined
    }

    // Determine the border color to use
    let borderColor: string | undefined
    if (selectedBorderColor) {
      // Use the border color value directly
      borderColor = selectedBorderColor
    } else if (customBorderColor) {
      borderColor = customBorderColor
    } else {
      // Remove border color
      borderColor = undefined
    }

    // Update the node with new properties
    updateNode(groupId, {
      name: groupName,
      style: {
        ...workflowNode.style,
        backgroundColor,
        borderColor,
      },
    })

    setDirty(true)
    onOpenChange(false)
  }, [groupId, groupName, selectedColor, customColor, selectedBorderColor, customBorderColor, workflow, updateNode, saveToHistory, setDirty, onOpenChange])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Customize the group's name and appearance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Group Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          {/* Background Color Picker */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Background Color
            </Label>
            
            {/* Predefined Colors */}
            <div className="grid grid-cols-5 gap-2">
              {GROUP_COLORS.map((color) => (
                <button
                  key={`bg-${color.value}`}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color.value)
                    setCustomColor('')
                  }}
                  className={`
                    h-10 rounded-md border-2 transition-all
                    ${selectedColor === color.value 
                      ? 'border-primary ring-2 ring-primary ring-offset-2' 
                      : 'border-transparent hover:border-gray-300'
                    }
                  `}
                  style={{ backgroundColor: color.light }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="space-y-2">
              <Label htmlFor="custom-color" className="text-xs text-muted-foreground">
                Or enter a custom color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-color"
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    setSelectedColor(null)
                  }}
                  placeholder="#hexcode or rgb()"
                  className="font-mono text-sm"
                />
                <input
                  type="color"
                  value={customColor || '#3b82f6'}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    setSelectedColor(null)
                  }}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Clear Color Button */}
            {(selectedColor || customColor) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedColor(null)
                  setCustomColor('')
                }}
                className="w-full"
              >
                Clear Background Color
              </Button>
            )}
          </div>

          {/* Border Color Picker */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Border Color
            </Label>
            
            {/* Predefined Border Colors */}
            <div className="grid grid-cols-5 gap-2">
              {GROUP_COLORS.map((color) => (
                <button
                  key={`border-${color.value}`}
                  type="button"
                  onClick={() => {
                    setSelectedBorderColor(color.value)
                    setCustomBorderColor('')
                  }}
                  className={`
                    h-10 rounded-md border-4 transition-all bg-background
                    ${selectedBorderColor === color.value 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-1 hover:ring-gray-300'
                    }
                  `}
                  style={{ borderColor: color.value }}
                  title={`${color.name} Border`}
                >
                  <span className="sr-only">{color.name} Border</span>
                </button>
              ))}
            </div>

            {/* Custom Border Color Input */}
            <div className="space-y-2">
              <Label htmlFor="custom-border-color" className="text-xs text-muted-foreground">
                Or enter a custom border color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-border-color"
                  type="text"
                  value={customBorderColor}
                  onChange={(e) => {
                    setCustomBorderColor(e.target.value)
                    setSelectedBorderColor(null)
                  }}
                  placeholder="#hexcode or rgb()"
                  className="font-mono text-sm"
                />
                <input
                  type="color"
                  value={customBorderColor || '#3b82f6'}
                  onChange={(e) => {
                    setCustomBorderColor(e.target.value)
                    setSelectedBorderColor(null)
                  }}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Clear Border Color Button */}
            {(selectedBorderColor || customBorderColor) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBorderColor(null)
                  setCustomBorderColor('')
                }}
                className="w-full"
              >
                Clear Border Color
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
