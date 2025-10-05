import { cn } from '@/lib/utils'
import { Code2, Database, Variable } from 'lucide-react'
import { useEffect, useRef } from 'react'

export interface AutocompleteItem {
  type: 'variable' | 'function' | 'property'
  label: string
  value: string
  description?: string
  icon?: React.ReactNode
}

interface ExpressionAutocompleteProps {
  visible: boolean
  items: AutocompleteItem[]
  position: { top: number; left: number }
  onSelect: (item: AutocompleteItem) => void
  onClose: () => void
  selectedIndex: number
}

export function ExpressionAutocomplete({
  visible,
  items,
  position,
  onSelect,
  onClose,
  selectedIndex,
}: ExpressionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (visible && containerRef.current) {
      const selectedElement = containerRef.current.querySelector('[data-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [visible, selectedIndex])

  if (!visible || items.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'variable':
        return <Variable className="h-4 w-4 text-blue-500" />
      case 'function':
        return <Code2 className="h-4 w-4 text-purple-500" />
      case 'property':
        return <Database className="h-4 w-4 text-green-500" />
      default:
        return <Code2 className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-80 max-h-64 overflow-y-auto bg-background border rounded-md shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.value}-${index}`}
            type="button"
            data-selected={index === selectedIndex}
            onClick={() => onSelect(item)}
            className={cn(
              'w-full px-3 py-2 text-left flex items-start gap-2 hover:bg-muted transition-colors',
              index === selectedIndex && 'bg-muted'
            )}
          >
            <div className="mt-0.5">{item.icon || getIcon(item.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground truncate">{item.description}</div>
              )}
              <code className="text-xs text-blue-600 dark:text-blue-400">{item.value}</code>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Common expression variables and functions
export const defaultAutocompleteItems: AutocompleteItem[] = [
  // JSON data access
  {
    type: 'variable',
    label: 'JSON Data',
    value: '{{json}}',
    description: 'Access all input data',
  },
  {
    type: 'property',
    label: 'Field from JSON',
    value: '{{json.fieldName}}',
    description: 'Access a specific field',
  },
  {
    type: 'property',
    label: 'Nested Field',
    value: '{{json.parent.child}}',
    description: 'Access nested properties',
  },
  {
    type: 'property',
    label: 'Array Item',
    value: '{{json.items[0]}}',
    description: 'Access array elements',
  },
  
  // Item data
  {
    type: 'variable',
    label: 'Item Index',
    value: '{{$item.index}}',
    description: 'Current item index',
  },
  {
    type: 'variable',
    label: 'Item Binary',
    value: '{{$item.binary}}',
    description: 'Binary data of current item',
  },
  
  // Node data
  {
    type: 'variable',
    label: 'Node Name',
    value: '{{$node.name}}',
    description: 'Current node name',
  },
  {
    type: 'variable',
    label: 'Node Type',
    value: '{{$node.type}}',
    description: 'Current node type',
  },
  
  // Parameters
  {
    type: 'variable',
    label: 'Parameters',
    value: '{{$parameter}}',
    description: 'Access node parameters',
  },
  
  // Workflow data
  {
    type: 'variable',
    label: 'Workflow ID',
    value: '{{$workflow.id}}',
    description: 'Current workflow ID',
  },
  {
    type: 'variable',
    label: 'Workflow Name',
    value: '{{$workflow.name}}',
    description: 'Current workflow name',
  },
  
  // Utility functions
  {
    type: 'function',
    label: 'Current Date',
    value: '{{$now}}',
    description: 'Current date and time',
  },
  {
    type: 'function',
    label: 'Today',
    value: '{{$today}}',
    description: "Today's date",
  },
  {
    type: 'function',
    label: 'Random Number',
    value: '{{$randomInt(min, max)}}',
    description: 'Random integer',
  },
  {
    type: 'function',
    label: 'UUID',
    value: '{{$uuid()}}',
    description: 'Generate a UUID',
  },
  
  // String functions
  {
    type: 'function',
    label: 'Uppercase',
    value: '{{json.field.toUpperCase()}}',
    description: 'Convert to uppercase',
  },
  {
    type: 'function',
    label: 'Lowercase',
    value: '{{json.field.toLowerCase()}}',
    description: 'Convert to lowercase',
  },
  {
    type: 'function',
    label: 'Trim',
    value: '{{json.field.trim()}}',
    description: 'Remove whitespace',
  },
  {
    type: 'function',
    label: 'Split',
    value: '{{json.field.split(",")}}',
    description: 'Split string',
  },
  
  // Array functions
  {
    type: 'function',
    label: 'Array Length',
    value: '{{json.array.length}}',
    description: 'Get array length',
  },
  {
    type: 'function',
    label: 'Join Array',
    value: '{{json.array.join(",")}}',
    description: 'Join array elements',
  },
  {
    type: 'function',
    label: 'First Item',
    value: '{{json.array[0]}}',
    description: 'Get first item',
  },
  {
    type: 'function',
    label: 'Last Item',
    value: '{{json.array[json.array.length - 1]}}',
    description: 'Get last item',
  },
  
  // Math functions
  {
    type: 'function',
    label: 'Math Round',
    value: '{{Math.round(json.value)}}',
    description: 'Round number',
  },
  {
    type: 'function',
    label: 'Math Floor',
    value: '{{Math.floor(json.value)}}',
    description: 'Round down',
  },
  {
    type: 'function',
    label: 'Math Ceil',
    value: '{{Math.ceil(json.value)}}',
    description: 'Round up',
  },
]
