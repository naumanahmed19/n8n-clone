import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useNodeConfigDialogStore } from '@/stores'
import { NodeSetting, NodeType, WorkflowNode } from '@/types'
import { Info, RotateCcw, Settings2 } from 'lucide-react'
import { useState } from 'react'

interface SettingsTabProps {
  node: WorkflowNode
  nodeType: NodeType
  readOnly?: boolean
}

// Default settings available for all nodes
const DEFAULT_SETTINGS: Record<string, NodeSetting> = {
  continueOnFail: {
    displayName: 'Continue On Fail',
    name: 'continueOnFail',
    type: 'boolean',
    default: false,
    description:
      'If enabled, the node will continue execution even if an error occurs. The error information will be returned as output data instead of stopping the workflow.',
  },
  alwaysOutputData: {
    displayName: 'Always Output Data',
    name: 'alwaysOutputData',
    type: 'boolean',
    default: false,
    description:
      'If enabled, the node will always output data, including error responses. Useful when you want to process error responses in your workflow.',
    displayOptions: {
      show: {
        continueOnFail: [true],
      },
    },
  },
  retryOnFail: {
    displayName: 'Retry On Fail',
    name: 'retryOnFail',
    type: 'boolean',
    default: false,
    description:
      'If enabled, the node will automatically retry execution if it fails.',
  },
  maxRetries: {
    displayName: 'Max Retries',
    name: 'maxRetries',
    type: 'number',
    default: 3,
    description: 'Maximum number of retry attempts',
    displayOptions: {
      show: {
        retryOnFail: [true],
      },
    },
  },
  retryDelay: {
    displayName: 'Retry Delay (ms)',
    name: 'retryDelay',
    type: 'number',
    default: 1000,
    description: 'Delay between retry attempts in milliseconds',
    displayOptions: {
      show: {
        retryOnFail: [true],
      },
    },
  },
  timeout: {
    displayName: 'Timeout (ms)',
    name: 'timeout',
    type: 'number',
    default: 30000,
    description:
      'Maximum time in milliseconds the node is allowed to run before timing out. Set to 0 for no timeout.',
  },
  notes: {
    displayName: 'Notes',
    name: 'notes',
    type: 'string',
    default: '',
    description:
      'Add notes or comments about this node. Notes are for documentation purposes only and do not affect execution.',
    placeholder: 'Add notes about this node...',
  },
}

export function SettingsTab({ nodeType, readOnly = false }: SettingsTabProps) {
  const { nodeSettings, updateNodeSettings } = useNodeConfigDialogStore()

  // Initialize settings values (nodeSettings is already a flat object)
  const [settingValues, setSettingValues] = useState<Record<string, any>>(
    nodeSettings || {}
  )

  // Get all available settings (default + custom from node type)
  const allSettings: Record<string, NodeSetting> = {
    ...DEFAULT_SETTINGS,
    ...(nodeType.settings || {}),
  }

  // Check if a setting should be visible based on display options
  const isSettingVisible = (setting: NodeSetting): boolean => {
    if (!setting.displayOptions?.show) return true

    return Object.entries(setting.displayOptions.show).every(([key, values]) => {
      const currentValue = settingValues[key]
      return values.includes(currentValue)
    })
  }

  // Update setting value
  const updateSettingValue = (settingName: string, value: any) => {
    if (readOnly) return

    const newValues = {
      ...settingValues,
      [settingName]: value,
    }

    setSettingValues(newValues)
    updateNodeSettings(newValues)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    if (readOnly) return

    setSettingValues({})
    updateNodeSettings({})
  }

  // Render setting control based on type
  const renderSettingControl = (settingName: string, setting: NodeSetting) => {
    const value = settingValues[settingName] ?? setting.default

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            id={`value-${settingName}`}
            checked={value}
            onCheckedChange={(checked) => updateSettingValue(settingName, checked)}
            disabled={readOnly || setting.disabled}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            id={`value-${settingName}`}
            value={value}
            onChange={(e) => updateSettingValue(settingName, Number(e.target.value))}
            placeholder={setting.placeholder}
            disabled={readOnly || setting.disabled}
            className="max-w-xs"
          />
        )

      case 'string':
        if (settingName === 'notes') {
          return (
            <Textarea
              id={`value-${settingName}`}
              value={value}
              onChange={(e) => updateSettingValue(settingName, e.target.value)}
              placeholder={setting.placeholder}
              disabled={readOnly || setting.disabled}
              rows={4}
              className="resize-none"
            />
          )
        }
        return (
          <Input
            type="text"
            id={`value-${settingName}`}
            value={value}
            onChange={(e) => updateSettingValue(settingName, e.target.value)}
            placeholder={setting.placeholder}
            disabled={readOnly || setting.disabled}
          />
        )

      case 'options':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => updateSettingValue(settingName, newValue)}
            disabled={readOnly || setting.disabled}
          >
            <SelectTrigger id={`value-${settingName}`} className="max-w-xs">
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'json':
        return (
          <Textarea
            id={`value-${settingName}`}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                updateSettingValue(settingName, parsed)
              } catch {
                // Invalid JSON, keep as string
                updateSettingValue(settingName, e.target.value)
              }
            }}
            placeholder={setting.placeholder}
            disabled={readOnly || setting.disabled}
            rows={6}
            className="font-mono text-sm resize-none"
          />
        )

      default:
        return (
          <div className="text-sm text-gray-500">Unsupported setting type: {setting.type}</div>
        )
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Settings2 className="w-5 h-5" />
              <span>Node Settings</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure error handling, retries, and other options
            </p>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {Object.entries(allSettings).map(([settingName, setting]) => {
            if (setting.hidden) return null
            if (!isSettingVisible(setting)) return null

            const isCustomSetting = !DEFAULT_SETTINGS[settingName]

            return (
              <div
                key={settingName}
                className="p-4 rounded-lg border bg-white border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="space-y-3">
                  {/* Setting Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-semibold">
                          {setting.displayName}
                        </Label>
                        {isCustomSetting && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {setting.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {renderSettingControl(settingName, setting)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-sm text-gray-700">
            <p className="font-medium text-blue-900">About Settings</p>
            <p className="text-gray-600">
              Use the switches to enable or disable settings. Enabled settings will be applied during node execution.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
