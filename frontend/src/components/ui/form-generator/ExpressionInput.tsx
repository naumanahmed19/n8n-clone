import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/stores'
import { Code2, Type } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AutocompleteItem } from './ExpressionAutocomplete'
import { ExpressionAutocomplete, defaultAutocompleteItems } from './ExpressionAutocomplete'
import { ExpressionBackgroundHighlight } from './ExpressionBackgroundHighlight'
import { ExpressionPreview } from './ExpressionPreview'

interface ExpressionInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  nodeId?: string // Optional: node ID to fetch input data from connected nodes
}

export function ExpressionInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  error,
  nodeId,
}: ExpressionInputProps) {
  // Determine initial mode: if value contains {{...}}, start in expression mode
  const hasExpression = typeof value === 'string' && value.includes('{{')
  const [mode, setMode] = useState<'fixed' | 'expression'>(
    hasExpression ? 'expression' : 'fixed'
  )
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>([])
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [autoHeight, setAutoHeight] = useState<number | undefined>(undefined)
  
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Always use textarea for auto-expanding input
  const isMultiline = true

  // Extract available fields from input data with node information
  const extractFieldsFromData = (nodeId: string | undefined): AutocompleteItem[] => {
    const fields: AutocompleteItem[] = []
    const seenFields = new Set<string>() // Track unique fields to avoid duplicates
    
    if (!nodeId) return fields

    try {
      const { workflow } = workflowStore
      if (!workflow) return fields

      // Find all connections where the current node is the target
      const inputConnections = workflow.connections.filter(
        (conn) => conn.targetNodeId === nodeId
      )

      if (inputConnections.length === 0) return fields

      // Process each connected source node
      for (const connection of inputConnections) {
        const sourceNodeId = connection.sourceNodeId
        
        // Get the source node to get its name
        const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId)
        if (!sourceNode) continue

        const nodeName = sourceNode.name
        const categoryName = `${nodeName} (input)`

        // Get execution result for this source node
        const sourceNodeResult = workflowStore.getNodeExecutionResult(sourceNodeId)
        
        if (!sourceNodeResult?.data) continue

        // Extract data structure
        let sourceData: any[] = []
        if (sourceNodeResult.data.main && Array.isArray(sourceNodeResult.data.main)) {
          sourceData = sourceNodeResult.data.main
        } else if (sourceNodeResult.status === 'skipped') {
          sourceData = [{ json: sourceNodeResult.data }]
        }

        if (sourceData.length === 0) continue

        // Extract all items from this source node
        const allItems: any[] = sourceData
          .map((item: any) => {
            if (item && item.json) {
              return item.json
            } else if (item) {
              return item
            }
            return null
          })
          .filter((item: any) => item !== null)

        if (allItems.length === 0) continue

        // Extract field names recursively from all items of this node
        const extractFields = (obj: any, path: string, depth = 0) => {
          if (depth > 3 || !obj || typeof obj !== 'object') return
          
          Object.keys(obj).forEach(key => {
            const value = obj[key]
            const fieldPath = `${path}.${key}`
            const fieldValue = `{{${fieldPath}}}`
            
            // Add the field itself if not already added
            if (!seenFields.has(fieldValue)) {
              seenFields.add(fieldValue)
              fields.push({
                type: 'property',
                label: key,
                value: fieldValue,
                description: `Type: ${Array.isArray(value) ? 'array' : typeof value}`,
                category: categoryName,
              })
            }

            // If value is an object, add nested fields (limited depth)
            if (value && typeof value === 'object' && !Array.isArray(value) && depth < 2) {
              extractFields(value, fieldPath, depth + 1)
            }
            
            // If value is an array with objects, show array accessor patterns
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
              const arrayAccessor = `{{${fieldPath}[0]}}`
              if (!seenFields.has(arrayAccessor)) {
                seenFields.add(arrayAccessor)
                fields.push({
                  type: 'property',
                  label: `${key}[0] (first item)`,
                  value: arrayAccessor,
                  description: 'Access first array element',
                  category: categoryName,
                })
              }
              
              // Add nested fields of first array item
              if (depth < 2) {
                Object.keys(value[0]).forEach(nestedKey => {
                  const nestedAccessor = `{{${fieldPath}[0].${nestedKey}}}`
                  if (!seenFields.has(nestedAccessor)) {
                    seenFields.add(nestedAccessor)
                    fields.push({
                      type: 'property',
                      label: `${key}[0].${nestedKey}`,
                      value: nestedAccessor,
                      description: `Access ${nestedKey} in first array item`,
                      category: categoryName,
                    })
                  }
                })
              }
            }
          })
        }

        // Process all items from this source node and merge their fields
        allItems.forEach(item => {
          extractFields(item, 'json', 0)
        })
      }
    } catch (error) {
      console.error('Error extracting fields from input data:', error)
    }

    return fields
  }

  // Get input data from workflow store if nodeId is provided
  const workflowStore = useWorkflowStore()
  
  // Generate dynamic autocomplete items based on available input data
  const dynamicAutocompleteItems = useMemo(() => {
    // Extract fields from connected nodes (categorized by node name)
    const inputFields = extractFieldsFromData(nodeId)
    
    // Combine default items with dynamic input fields
    // Put input fields first for better visibility
    return [...inputFields, ...defaultAutocompleteItems]
  }, [nodeId, workflowStore])

  // Detect when to show autocomplete
  useEffect(() => {
    if (mode !== 'expression' || !value) {
      setShowAutocomplete(false)
      return
    }

    const textBeforeCursor = value.substring(0, cursorPosition)
    
    // Check if user typed {{ or is inside an expression
    const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')
    const lastCloseBraces = textBeforeCursor.lastIndexOf('}}')
    
    // Show autocomplete if inside {{ }}
    if (lastOpenBraces > lastCloseBraces) {
      const searchText = textBeforeCursor.substring(lastOpenBraces + 2).toLowerCase()
      
      // Filter items based on search text - use dynamic items
      const filtered = dynamicAutocompleteItems.filter(item =>
        item.label.toLowerCase().includes(searchText) ||
        item.value.toLowerCase().includes(searchText) ||
        (item.description && item.description.toLowerCase().includes(searchText))
      )
      
      setFilteredItems(filtered)
      setSelectedItemIndex(0)
      
      if (filtered.length > 0) {
        // Calculate position for autocomplete dropdown
        updateAutocompletePosition()
        setShowAutocomplete(true)
      } else {
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }, [value, cursorPosition, mode, dynamicAutocompleteItems])

  // Update autocomplete position
  const updateAutocompletePosition = () => {
    if (!inputRef.current) return

    const rect = inputRef.current.getBoundingClientRect()
    
    setAutocompletePosition({
      top: rect.height + 4,
      left: 0,
    })
  }

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle autocomplete keyboard events when autocomplete is visible
    if (showAutocomplete) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedItemIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : prev
          )
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedItemIndex(prev => prev > 0 ? prev - 1 : 0)
          return
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (filteredItems[selectedItemIndex]) {
            insertAutocompleteItem(filteredItems[selectedItemIndex])
          }
          return
        case 'Escape':
          e.preventDefault()
          setShowAutocomplete(false)
          return
      }
    }
    
    // Trigger autocomplete when user types {{
    if (e.key === '{' && mode === 'expression') {
      const textBeforeCursor = value.substring(0, cursorPosition)
      if (textBeforeCursor.endsWith('{')) {
        setTimeout(() => {
          const newCursor = cursorPosition + 1
          setCursorPosition(newCursor)
        }, 0)
      }
    }
  }

  // Insert selected autocomplete item
  const insertAutocompleteItem = (item: AutocompleteItem) => {
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    
    // Find the {{ before cursor
    const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')
    
    // Replace from {{ to cursor with the autocomplete value
    const newValue = 
      value.substring(0, lastOpenBraces) + 
      item.value + 
      textAfterCursor
    
    onChange(newValue)
    setShowAutocomplete(false)
    
    // Set cursor position after inserted value
    setTimeout(() => {
      const newCursorPos = lastOpenBraces + item.value.length
      setCursorPosition(newCursorPos)
      if (inputRef.current) {
        if ('setSelectionRange' in inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
        inputRef.current.focus()
      }
    }, 0)
  }

  // Handle input change
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    
    // Update cursor position
    if (inputRef.current) {
      const element = inputRef.current as HTMLTextAreaElement | HTMLInputElement
      setTimeout(() => {
        setCursorPosition(element.selectionStart || 0)
      }, 0)
    }
  }

  // Auto-resize textarea based on content (up to 120px)
  useEffect(() => {
    if (inputRef.current && isMultiline) {
      const element = inputRef.current as HTMLTextAreaElement
      // Reset height to auto to get the correct scrollHeight
      element.style.height = 'auto'
      // Calculate new height (minimum 40px for single line, maximum 120px)
      const newHeight = Math.min(Math.max(element.scrollHeight, 40), 120)
      setAutoHeight(newHeight)
      element.style.height = `${newHeight}px`
    }
  }, [value, isMultiline])

  // Handle click to update cursor position and check for autocomplete
  const handleClick = () => {
    if (inputRef.current) {
      const element = inputRef.current as HTMLTextAreaElement | HTMLInputElement
      const newCursorPos = element.selectionStart || 0
      setCursorPosition(newCursorPos)
      
      // Check if cursor is inside an expression and show autocomplete
      if (mode === 'expression' && value) {
        const textBeforeCursor = value.substring(0, newCursorPos)
        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{')
        const lastCloseBraces = textBeforeCursor.lastIndexOf('}}')
        
        // If cursor is inside {{ }}, show autocomplete
        if (lastOpenBraces > lastCloseBraces) {
          const searchText = textBeforeCursor.substring(lastOpenBraces + 2).toLowerCase()
          
          // Filter items based on search text
          const filtered = dynamicAutocompleteItems.filter(item =>
            item.label.toLowerCase().includes(searchText) ||
            item.value.toLowerCase().includes(searchText) ||
            (item.description && item.description.toLowerCase().includes(searchText))
          )
          
          setFilteredItems(filtered)
          setSelectedItemIndex(0)
          
          if (filtered.length > 0) {
            updateAutocompletePosition()
            setShowAutocomplete(true)
          }
        }
      }
    }
  }

  const toggleMode = (newMode: 'fixed' | 'expression') => {
    setMode(newMode)
    setShowAutocomplete(false)
  }

  const inputClassName = cn(
    error ? 'border-destructive' : '',
    mode === 'expression' ? 'font-mono text-sm' : ''
  )

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative bg-background">
        {/* Background highlighting overlay - behind the text */}
        {mode === 'expression' && value && value.includes('{{') && (
          <ExpressionBackgroundHighlight value={value} className="font-mono text-sm" />
        )}
        
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          placeholder={
            mode === 'expression'
              ? placeholder || 'Type {{ to see available variables and functions...'
              : placeholder
          }
          disabled={disabled}
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            overflow: autoHeight && autoHeight >= 120 ? 'auto' : 'hidden',
            resize: 'none',
            background: 'transparent',
            position: 'relative',
            zIndex: 1
          }}
          className={inputClassName}
        />
      </div>

      {/* Autocomplete Dropdown */}
      <ExpressionAutocomplete
        visible={showAutocomplete}
        items={filteredItems}
        position={autocompletePosition}
        selectedIndex={selectedItemIndex}
        onSelect={insertAutocompleteItem}
        onClose={() => setShowAutocomplete(false)}
      />

      {/* Button Container */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {/* Mode Toggle Badge */}
        <button
          type="button"
          onClick={() => toggleMode(mode === 'expression' ? 'fixed' : 'expression')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
            mode === 'expression'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          title={mode === 'expression' ? 'Switch to Fixed mode' : 'Switch to Expression mode'}
        >
          {mode === 'expression' ? (
            <>
              <Code2 className="h-3 w-3" />
              <span>Expr</span>
            </>
          ) : (
            <>
              <Type className="h-3 w-3" />
              <span>Fixed</span>
            </>
          )}
        </button>
      </div>

      {/* Helper Text */}
      {mode === 'expression' && (
        <div className="mt-1 text-xs text-muted-foreground">
          Use <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;&#125;&#125;</code> to access variables,
          press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Space</kbd> or type{' '}
          <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;</code> for suggestions
        </div>
      )}

      {/* Expression Preview */}
      {mode === 'expression' && <ExpressionPreview value={value} nodeId={nodeId} />}
    </div>
  )
}
