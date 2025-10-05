import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Code2, Maximize2, Minimize2, Type } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ExpressionAutocomplete, defaultAutocompleteItems } from './ExpressionAutocomplete'
import type { AutocompleteItem } from './ExpressionAutocomplete'
import { ExpressionHighlighter } from './ExpressionHighlighter'

interface ExpressionInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  multiline?: boolean
  rows?: number
}

export function ExpressionInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  error,
  multiline = true,
  rows = 4,
}: ExpressionInputProps) {
  // Determine initial mode: if value contains {{...}}, start in expression mode
  const hasExpression = typeof value === 'string' && value.includes('{{')
  const [mode, setMode] = useState<'fixed' | 'expression'>(
    hasExpression ? 'expression' : 'fixed'
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [filteredItems, setFilteredItems] = useState<AutocompleteItem[]>([])
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showHighlight, setShowHighlight] = useState(false)
  
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

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
      
      // Filter items based on search text
      const filtered = defaultAutocompleteItems.filter(item =>
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
  }, [value, cursorPosition, mode])

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
    if (!showAutocomplete) {
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
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedItemIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedItemIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (filteredItems[selectedItemIndex]) {
          insertAutocompleteItem(filteredItems[selectedItemIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowAutocomplete(false)
        break
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

  // Handle click to update cursor position
  const handleClick = () => {
    if (inputRef.current) {
      const element = inputRef.current as HTMLTextAreaElement | HTMLInputElement
      setCursorPosition(element.selectionStart || 0)
    }
  }

  // Toggle between highlight and edit view in expression mode
  useEffect(() => {
    setShowHighlight(mode === 'expression' && !showAutocomplete && !!value && value.includes('{{'))
  }, [mode, showAutocomplete, value])

  const toggleMode = (newMode: 'fixed' | 'expression') => {
    setMode(newMode)
    setShowAutocomplete(false)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const inputClassName = cn(
    error ? 'border-destructive' : '',
    mode === 'expression' ? 'font-mono text-sm' : '',
    showHighlight ? 'text-transparent caret-gray-900 dark:caret-gray-100' : ''
  )

  const effectiveRows = isExpanded ? rows * 2 : rows

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        {multiline ? (
          <>
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
              rows={effectiveRows}
              className={inputClassName}
            />
            {/* Syntax highlighting overlay */}
            {showHighlight && (
              <div className="absolute inset-0 pointer-events-none px-3 py-2 overflow-hidden">
                <ExpressionHighlighter value={value} className="whitespace-pre-wrap" />
              </div>
            )}
          </>
        ) : (
          <>
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
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
              className={inputClassName}
            />
            {/* Syntax highlighting overlay */}
            {showHighlight && (
              <div className="absolute inset-0 pointer-events-none px-3 py-2 overflow-hidden flex items-center">
                <ExpressionHighlighter value={value} />
              </div>
            )}
          </>
        )}
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
        {/* Expand Button (only for multiline) */}
        {multiline && (
          <button
            type="button"
            onClick={toggleExpand}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors',
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
        )}

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
        <div className="absolute left-0 -bottom-5 text-xs text-muted-foreground">
          Use <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;&#125;&#125;</code> to access variables,
          press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Space</kbd> or type{' '}
          <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;</code> for suggestions
        </div>
      )}
    </div>
  )
}
