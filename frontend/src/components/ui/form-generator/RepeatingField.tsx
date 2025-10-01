import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Copy } from 'lucide-react'
import { useState } from 'react'
import { FormFieldConfig } from './types'
import { FieldRenderer } from './FieldRenderer'

export interface RepeatingFieldItem {
  id: string
  values: Record<string, any>
}

export interface RepeatingFieldProps {
  /**
   * Display name for the repeating field group
   */
  displayName: string

  /**
   * Field configuration for each item in the repeating group
   */
  fields: FormFieldConfig[]

  /**
   * Current values - array of objects
   */
  value: RepeatingFieldItem[]

  /**
   * Change handler
   */
  onChange: (value: RepeatingFieldItem[]) => void

  /**
   * Minimum number of items (default: 0)
   */
  minItems?: number

  /**
   * Maximum number of items (default: unlimited)
   */
  maxItems?: number

  /**
   * Text for the "Add" button (default: "Add Item")
   */
  addButtonText?: string

  /**
   * Whether to show drag handle for reordering (default: true)
   */
  allowReorder?: boolean

  /**
   * Whether to show duplicate button (default: true)
   */
  allowDuplicate?: boolean

  /**
   * Whether to show delete button (default: true)
   */
  allowDelete?: boolean

  /**
   * Default values for new items
   */
  defaultItemValues?: Record<string, any>

  /**
   * Custom item header renderer
   */
  itemHeaderRenderer?: (item: RepeatingFieldItem, index: number) => React.ReactNode

  /**
   * Validation errors for specific items and fields
   */
  errors?: Record<string, Record<string, string>> // { [itemId]: { [fieldName]: errorMessage } }

  /**
   * Whether the field is disabled
   */
  disabled?: boolean

  /**
   * Custom CSS class for the container
   */
  className?: string

  /**
   * Show item numbers (default: true)
   */
  showItemNumbers?: boolean

  /**
   * Collapsed by default (default: false)
   */
  collapsedByDefault?: boolean
}

export function RepeatingField({
  displayName,
  fields,
  value = [],
  onChange,
  minItems = 0,
  maxItems,
  addButtonText = 'Add Item',
  allowReorder = true,
  allowDuplicate = true,
  allowDelete = true,
  defaultItemValues = {},
  itemHeaderRenderer,
  errors = {},
  disabled = false,
  className = '',
  showItemNumbers = true,
  collapsedByDefault = false,
}: RepeatingFieldProps) {
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(
    collapsedByDefault ? new Set(value.map((item) => item.id)) : new Set()
  )
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Generate unique ID
  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add new item
  const handleAdd = () => {
    if (maxItems && value.length >= maxItems) return

    const newItem: RepeatingFieldItem = {
      id: generateId(),
      values: { ...defaultItemValues },
    }

    onChange([...value, newItem])
  }

  // Delete item
  const handleDelete = (itemId: string) => {
    if (value.length <= minItems) return
    onChange(value.filter((item) => item.id !== itemId))
  }

  // Duplicate item
  const handleDuplicate = (item: RepeatingFieldItem) => {
    if (maxItems && value.length >= maxItems) return

    const duplicatedItem: RepeatingFieldItem = {
      id: generateId(),
      values: { ...item.values },
    }

    const index = value.findIndex((i) => i.id === item.id)
    const newValue = [...value]
    newValue.splice(index + 1, 0, duplicatedItem)
    onChange(newValue)
  }

  // Update item field value
  const handleFieldChange = (itemId: string, fieldName: string, fieldValue: any) => {
    const newValue = value.map((item) =>
      item.id === itemId
        ? { ...item, values: { ...item.values, [fieldName]: fieldValue } }
        : item
    )
    onChange(newValue)
  }

  // Toggle collapse
  const toggleCollapse = (itemId: string) => {
    const newCollapsed = new Set(collapsedItems)
    if (newCollapsed.has(itemId)) {
      newCollapsed.delete(itemId)
    } else {
      newCollapsed.add(itemId)
    }
    setCollapsedItems(newCollapsed)
  }

  // Drag and drop handlers
  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetItemId) return

    const draggedIndex = value.findIndex((item) => item.id === draggedItem)
    const targetIndex = value.findIndex((item) => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newValue = [...value]
    const [removed] = newValue.splice(draggedIndex, 1)
    newValue.splice(targetIndex, 0, removed)

    onChange(newValue)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const canAdd = !maxItems || value.length < maxItems
  const canDelete = allowDelete && value.length > minItems

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{displayName}</h4>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            {addButtonText}
          </Button>
        )}
      </div>

      {value.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No items added yet. Click "{addButtonText}" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => {
            const isCollapsed = collapsedItems.has(item.id)
            const itemErrors = errors[item.id] || {}
            const hasErrors = Object.keys(itemErrors).length > 0

            return (
              <Card
                key={item.id}
                className={`relative ${draggedItem === item.id ? 'opacity-50' : ''} ${
                  hasErrors ? 'border-destructive' : ''
                }`}
                draggable={allowReorder && !disabled}
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-3">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Drag Handle */}
                    {allowReorder && !disabled && (
                      <div className="cursor-move text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Item Number or Custom Header */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleCollapse(item.id)}
                    >
                      {itemHeaderRenderer ? (
                        itemHeaderRenderer(item, index)
                      ) : (
                        <div className="flex items-center gap-2">
                          {showItemNumbers && (
                            <span className="text-sm font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                          <span className="text-sm font-medium">
                            {displayName} {index + 1}
                          </span>
                          {hasErrors && (
                            <span className="text-xs text-destructive">
                              ({Object.keys(itemErrors).length} error
                              {Object.keys(itemErrors).length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Collapse/Expand */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCollapse(item.id)}
                        className="h-7 w-7 p-0"
                      >
                        {isCollapsed ? '▼' : '▲'}
                      </Button>

                      {/* Duplicate */}
                      {allowDuplicate && !disabled && canAdd && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(item)}
                          className="h-7 w-7 p-0"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* Delete */}
                      {canDelete && !disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Fields */}
                  {!isCollapsed && (
                    <div className="space-y-3 pl-6">
                      {fields.map((field) => {
                        const fieldValue = item.values[field.name]
                        const fieldError = itemErrors[field.name]

                        return (
                          <div key={field.name} className="space-y-1">
                            <label className="text-sm font-medium">
                              {field.displayName}
                              {field.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </label>
                            <FieldRenderer
                              field={field}
                              value={fieldValue}
                              error={fieldError}
                              onChange={(newValue) =>
                                handleFieldChange(item.id, field.name, newValue)
                              }
                              disabled={disabled}
                              allValues={item.values}
                              allFields={fields}
                            />
                            {field.description && (
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            )}
                            {fieldError && (
                              <p className="text-xs text-destructive">{fieldError}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info text */}
      {(minItems > 0 || maxItems) && (
        <p className="text-xs text-muted-foreground">
          {minItems > 0 && `Minimum: ${minItems} item${minItems > 1 ? 's' : ''}`}
          {minItems > 0 && maxItems && ' • '}
          {maxItems && `Maximum: ${maxItems} item${maxItems > 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}
