import { useState } from 'react'
import { Check } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ColorPreset {
  name: string
  background: string
  border: string
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Purple',
    background: 'rgba(207, 182, 255, 0.4)',
    border: '#9e86ed',
  },
  {
    name: 'Blue',
    background: 'rgba(147, 197, 253, 0.4)',
    border: '#3b82f6',
  },
  {
    name: 'Green',
    background: 'rgba(167, 243, 208, 0.4)',
    border: '#10b981',
  },
  {
    name: 'Yellow',
    background: 'rgba(253, 224, 71, 0.4)',
    border: '#eab308',
  },
  {
    name: 'Red',
    background: 'rgba(252, 165, 165, 0.4)',
    border: '#ef4444',
  },
  {
    name: 'Orange',
    background: 'rgba(253, 186, 116, 0.4)',
    border: '#f97316',
  },
  {
    name: 'Pink',
    background: 'rgba(249, 168, 212, 0.4)',
    border: '#ec4899',
  },
  {
    name: 'Teal',
    background: 'rgba(153, 246, 228, 0.4)',
    border: '#14b8a6',
  },
]

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName?: string
  currentBackground?: string
  currentBorder?: string
  onSave: (settings: {
    name?: string
    backgroundColor?: string
    borderColor?: string
  }) => void
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  groupName = '',
  currentBackground,
  currentBorder,
  onSave,
}: GroupSettingsDialogProps) {
  const [name, setName] = useState(groupName)
  const [backgroundColor, setBackgroundColor] = useState(
    currentBackground || COLOR_PRESETS[0].background
  )
  const [borderColor, setBorderColor] = useState(
    currentBorder || COLOR_PRESETS[0].border
  )
  const [useCustomColors, setUseCustomColors] = useState(false)

  const handlePresetSelect = (preset: ColorPreset) => {
    setBackgroundColor(preset.background)
    setBorderColor(preset.border)
    setUseCustomColors(false)
  }

  const handleSave = () => {
    onSave({
      name: name || undefined,
      backgroundColor,
      borderColor,
    })
    onOpenChange(false)
  }

  const isPresetSelected = (preset: ColorPreset) => {
    return (
      !useCustomColors &&
      backgroundColor === preset.background &&
      borderColor === preset.border
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance of your group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name (optional)</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    'relative rounded-lg p-3 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'flex flex-col items-center gap-2'
                  )}
                  style={{
                    backgroundColor: preset.background,
                    border: `2px solid ${preset.border}`,
                  }}
                >
                  {isPresetSelected(preset) && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className="w-full h-8 rounded border"
                    style={{
                      backgroundColor: preset.background,
                      borderColor: preset.border,
                    }}
                  />
                  <span className="text-xs font-medium text-foreground">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors Section */}
          <div className="space-y-3">
            <Label>Custom Colors</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg-color" className="text-sm">
                  Background
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value)
                      setUseCustomColors(true)
                    }}
                    className="h-10 w-16 p-1 cursor-pointer"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value)
                      setUseCustomColors(true)
                    }}
                    placeholder="e.g., rgba(207, 182, 255, 0.4)"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="border-color" className="text-sm">
                  Border
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="border-color"
                    type="color"
                    value={borderColor}
                    onChange={(e) => {
                      setBorderColor(e.target.value)
                      setUseCustomColors(true)
                    }}
                    className="h-10 w-16 p-1 cursor-pointer"
                  />
                  <Input
                    value={borderColor}
                    onChange={(e) => {
                      setBorderColor(e.target.value)
                      setUseCustomColors(true)
                    }}
                    placeholder="e.g., #9e86ed"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="w-full h-24 rounded-lg border-2 flex items-center justify-center"
              style={{
                backgroundColor: backgroundColor,
                borderColor: borderColor,
              }}
            >
              <span className="text-sm font-medium text-foreground">
                {name || 'Group Preview'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
