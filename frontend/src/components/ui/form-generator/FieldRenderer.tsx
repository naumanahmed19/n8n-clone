import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays } from 'lucide-react'
import { RepeatingField } from './RepeatingField'
import { FormFieldRendererProps } from './types'

export function FieldRenderer({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled,
}: FormFieldRendererProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue)
  }

  const handleBlur = () => {
    if (onBlur) {
      onBlur(value)
    }
  }

  // Custom field component
  if (field.type === 'custom' && field.customComponent) {
    return field.customComponent({
      value,
      onChange: handleChange,
      field,
      error,
      disabled,
    })
  }

  // Collection type with multipleValues - use RepeatingField
  if (field.type === 'collection' && field.typeOptions?.multipleValues) {
    // Get nested fields from componentProps
    const nestedFields = field.componentProps?.fields || []
    const buttonText = field.typeOptions?.multipleValueButtonText || 'Add Item'
    
    return (
      <RepeatingField
        displayName={field.displayName}
        fields={nestedFields}
        value={Array.isArray(value) ? value : []}
        onChange={handleChange}
        addButtonText={buttonText}
        disabled={disabled}
        minItems={field.validation?.min}
        maxItems={field.validation?.max}
        itemHeaderRenderer={(item, index) => {
          // Try to show meaningful header from outputName or first field
          const displayValue = item.values?.outputName || item.values?.name || `Item ${index + 1}`
          return <span>{displayValue}</span>
        }}
      />
    )
  }

  switch (field.type) {
    case 'string':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'password':
      return (
        <Input
          type="password"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'email':
      return (
        <Input
          type="email"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'url':
      return (
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const numValue = e.target.value === '' ? '' : parseFloat(e.target.value)
            handleChange(numValue)
          }}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          step={field.step}
          min={field.validation?.min}
          max={field.validation?.max}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          rows={field.rows || 4}
          className={error ? 'border-destructive' : ''}
        />
      )

    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={value || false}
            onCheckedChange={handleChange}
            disabled={disabled || field.disabled}
            id={field.name}
          />
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {field.description || field.displayName}
          </label>
        </div>
      )

    case 'switch':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value || false}
            onCheckedChange={handleChange}
            disabled={disabled || field.disabled}
            id={field.name}
          />
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {field.description || field.displayName}
          </label>
        </div>
      )

    case 'options':
      return (
        <Select
          value={value || ''}
          onValueChange={handleChange}
          disabled={disabled || field.disabled}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={field.placeholder || `Select ${field.displayName}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div>{option.name}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'multiOptions':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => {
            const isChecked = Array.isArray(value) ? value.includes(option.value) : false
            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value)
                    handleChange(newValues)
                  }}
                  disabled={disabled || field.disabled}
                  id={`${field.name}-${option.value}`}
                />
                <label
                  htmlFor={`${field.name}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div>{option.name}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </label>
              </div>
            )
          })}
        </div>
      )

    case 'json':
      return (
        <Textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              handleChange(parsed)
            } catch {
              // Keep as string if not valid JSON
              handleChange(e.target.value)
            }
          }}
          onBlur={handleBlur}
          placeholder={field.placeholder || 'Enter JSON...'}
          disabled={disabled || field.disabled || field.readonly}
          rows={field.rows || 6}
          className={`font-mono text-sm ${error ? 'border-destructive' : ''}`}
        />
      )

    case 'dateTime':
      return (
        <div className="relative">
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled || field.disabled || field.readonly}
            className={error ? 'border-destructive' : ''}
          />
          <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      )

    default:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          disabled={disabled || field.disabled || field.readonly}
          className={error ? 'border-destructive' : ''}
        />
      )
  }
}