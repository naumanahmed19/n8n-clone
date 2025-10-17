import { Button } from '@/components/ui/button'
import { FormGenerator } from '@/components/ui/form-generator/FormGenerator'
import { FormFieldConfig } from '@/components/ui/form-generator/types'
import { useExecutionControls } from '@/hooks/workflow'
import { useWorkflowStore } from '@/stores'
import { Node, NodeProps } from '@xyflow/react'
import { ClipboardList, Send } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BaseNodeWrapper } from './BaseNodeWrapper'

interface FormField {
  fieldType: string
  fieldLabel: string
  fieldName: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  options?: string
  min?: number
  max?: number
  rows?: number
  accept?: string
  helpText?: string
}

interface FormGeneratorNodeData extends Record<string, unknown> {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  locked?: boolean
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped'
  executionResult?: any
  lastExecutionData?: any
  inputs?: string[]
  outputs?: string[]
  executionCapability?: 'trigger' | 'action' | 'transform' | 'condition'
}

type FormGeneratorNodeType = Node<FormGeneratorNodeData>

export const FormGeneratorNode = memo(function FormGeneratorNode({ 
  data, 
  selected, 
  id 
}: NodeProps<FormGeneratorNodeType>) {
  const { executionState, updateNode } = useWorkflowStore()
  const { executeWorkflow } = useExecutionControls()
  
  const isReadOnly = false // Form should always be interactive
  const isExecuting = executionState.status === 'running'
  
  // Memoize parameters
  const parameters = useMemo(() => data.parameters || {}, [data.parameters])
  
  // Track expanded state
  const [isExpanded, setIsExpanded] = useState(parameters.isExpanded ?? false)
  
  // Get form configuration from parameters
  const formTitle = useMemo(() => parameters.formTitle || 'Custom Form', [parameters.formTitle])
  const formDescription = useMemo(() => parameters.formDescription || '', [parameters.formDescription])
  const submitButtonText = useMemo(() => parameters.submitButtonText || 'Submit', [parameters.submitButtonText])
  
  // Parse form fields from RepeatingField format and convert to FormFieldConfig
  const formFieldConfigs = useMemo<FormFieldConfig[]>(() => {
    // Handle RepeatingField structure: array of {id, values: {...}}
    const rawFields = parameters.formFields || []
    if (!Array.isArray(rawFields)) return []
    
    return rawFields.map((field: any, index: number) => {
      // Extract values from RepeatingField structure
      const fieldData = field.values || field
      
      // Generate fieldName from fieldLabel if missing
      const fieldName = fieldData.fieldName || 
        fieldData.fieldLabel?.toLowerCase().replace(/\s+/g, '_') || 
        `field_${index}`
      
      // Map field type to FormFieldConfig type
      const getFieldType = (type: string): FormFieldConfig['type'] => {
        switch (type) {
          case 'text': return 'string'
          case 'email': return 'email'
          case 'number': return 'number'
          case 'textarea': return 'textarea'
          case 'select': return 'options'
          case 'radio': return 'options'
          case 'checkbox': return 'boolean'
          case 'date': return 'dateTime'
          case 'file': return 'string'
          default: return 'string'
        }
      }
      
      // Parse options for select/radio
      const parseOptions = (optionsStr: string) => {
        if (!optionsStr) return []
        return optionsStr.split(/[\n,]/)
          .map(opt => opt.trim())
          .filter(opt => opt.length > 0)
          .map(opt => ({ name: opt, value: opt }))
      }
      
      return {
        name: fieldName,
        displayName: fieldData.fieldLabel || fieldName,
        type: getFieldType(fieldData.fieldType),
        required: fieldData.required || false,
        default: fieldData.defaultValue || '',
        description: fieldData.helpText || '',
        placeholder: fieldData.placeholder || '',
        options: (fieldData.fieldType === 'select' || fieldData.fieldType === 'radio') 
          ? parseOptions(fieldData.options || '')
          : undefined,
        rows: fieldData.rows,
        validation: fieldData.fieldType === 'number' ? {
          min: fieldData.min,
          max: fieldData.max,
        } : undefined,
      } as FormFieldConfig
    })
  }, [parameters.formFields])
  
  // Form state - track values for all fields
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    updateNode(id, {
      parameters: {
        ...parameters,
        isExpanded: newExpanded
      }
    })
  }, [isExpanded, id, parameters, updateNode])
  
  // Handle field value change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }, [errors])
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    formFields.forEach(field => {
      if (field.required) {
        const value = formValues[field.fieldName]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.fieldName] = `${field.fieldLabel} is required`
        }
      }
      
      // Email validation
      if (field.fieldType === 'email' && formValues[field.fieldName]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formValues[field.fieldName])) {
          newErrors[field.fieldName] = 'Please enter a valid email address'
        }
      }
      
      // Number validation
      if (field.fieldType === 'number' && formValues[field.fieldName]) {
        const value = Number(formValues[field.fieldName])
        if (field.min !== undefined && value < field.min) {
          newErrors[field.fieldName] = `Value must be at least ${field.min}`
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.fieldName] = `Value must be at most ${field.max}`
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formFields, formValues])
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (isSubmitting || isExecuting) return
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Update node with form data before execution
      updateNode(id, {
        parameters: {
          ...parameters,
          lastSubmission: formValues,
          submittedFormData: formValues, // Store form data for execution
          submittedAt: new Date().toISOString()
        },
        disabled: false
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Execute workflow - the form data is already in node parameters
      await executeWorkflow(id)
      
      // Keep form values after submission - don't clear them
      
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({
        _form: `Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isExecuting, validateForm, id, parameters, formValues, updateNode, executeWorkflow, formTitle, formFields])
  
  // Parse options string into array
  const parseOptions = useCallback((optionsStr: string) => {
    if (!optionsStr) return []
    // Split by newline or comma
    return optionsStr.split(/[\n,]/).map(opt => opt.trim()).filter(opt => opt.length > 0)
  }, [])
  
  // Render a single form field
  const renderField = useCallback((field: FormField) => {
    const value = formValues[field.fieldName] || ''
    const error = errors[field.fieldName]
    
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName} className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type={field.fieldType}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              disabled={isSubmitting || isExecuting}
              className={`h-9 text-sm ${error ? 'border-red-500' : ''}`}
              min={field.fieldType === 'number' ? field.min : undefined}
              max={field.fieldType === 'number' ? field.max : undefined}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      case 'textarea':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName} className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.fieldName}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              disabled={isSubmitting || isExecuting}
              rows={field.rows || 3}
              className={`text-sm resize-none ${error ? 'border-red-500' : ''}`}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      case 'select':
        const selectOptions = parseOptions(field.options || '')
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName} className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.fieldName, val)}
              disabled={isSubmitting || isExecuting}
            >
              <SelectTrigger className={`h-9 text-sm ${error ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={field.placeholder || 'Select an option...'} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map(option => (
                  <SelectItem key={option} value={option} className="text-sm">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      case 'checkbox':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.fieldName}
                checked={value === true}
                onCheckedChange={(checked) => handleFieldChange(field.fieldName, checked)}
                disabled={isSubmitting || isExecuting}
              />
              <Label 
                htmlFor={field.fieldName} 
                className="text-xs font-medium cursor-pointer"
              >
                {field.fieldLabel}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {field.helpText && (
              <p className="text-xs text-muted-foreground ml-6">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500 ml-6">{error}</p>
            )}
          </div>
        )
      
      case 'radio':
        const radioOptions = parseOptions(field.options || '')
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleFieldChange(field.fieldName, val)}
              disabled={isSubmitting || isExecuting}
              className="space-y-2"
            >
              {radioOptions.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.fieldName}-${option}`} />
                  <Label 
                    htmlFor={`${field.fieldName}-${option}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      case 'date':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName} className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              disabled={isSubmitting || isExecuting}
              className={`h-9 text-sm ${error ? 'border-red-500' : ''}`}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      case 'file':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName} className="text-xs font-medium">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="file"
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFieldChange(field.fieldName, {
                    name: file.name,
                    size: file.size,
                    type: file.type
                  })
                }
              }}
              disabled={isSubmitting || isExecuting}
              className={`h-9 text-sm ${error ? 'border-red-500' : ''}`}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )
      
      default:
        return null
    }
  }, [formValues, errors, isSubmitting, isExecuting, handleFieldChange, parseOptions])
  
  // Header info
  const headerInfo = useMemo(() => 
    formFields.length > 0 
      ? `${formFields.length} field${formFields.length !== 1 ? 's' : ''}`
      : 'No fields configured',
    [formFields.length]
  )
  
  // Collapsed content - just show field count
  const collapsedContent = useMemo(() => (
    <div className="text-xs text-muted-foreground text-center py-1">
      {formFields.length === 0 ? (
        <p>Configure form fields in properties</p>
      ) : (
        <p>Click to expand and view form</p>
      )}
    </div>
  ), [formFields.length])
  
  // Expanded content - render the full form
  const expandedContent = useMemo(() => (
    <>
      {/* Form Area */}
      <div className="max-h-[400px] overflow-y-auto p-4">
        {formFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm text-center">No form fields configured</p>
            <p className="text-xs text-center mt-1">
              Open properties to add form fields
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Title and Description */}
            {formTitle && (
              <div className="mb-4">
                <h3 className="text-base font-semibold">{formTitle}</h3>
                {formDescription && (
                  <p className="text-xs text-muted-foreground mt-1">{formDescription}</p>
                )}
              </div>
            )}
            
            {/* Form Fields */}
            <div className="space-y-4">
              {formFields.map(field => renderField(field))}
            </div>
            
            {/* Form-level error */}
            {errors._form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600">{errors._form}</p>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || isExecuting}
                className="w-full h-9 text-sm"
                onClick={handleSubmit}
              >
                {isSubmitting || isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-2" />
                    {submitButtonText}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  ), [formFields, formTitle, formDescription, submitButtonText, isSubmitting, isExecuting, errors, handleSubmit, renderField])
  
  return (
    <BaseNodeWrapper
      id={id}
      selected={selected}
      data={data}
      isReadOnly={isReadOnly}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      Icon={ClipboardList}
      iconColor="bg-green-500"
      collapsedWidth="200px"
      expandedWidth="380px"
      headerInfo={headerInfo}
      collapsedContent={collapsedContent}
      expandedContent={expandedContent}
      showInputHandle={false}
      showOutputHandle={true}
      outputHandleColor="!bg-green-500"
    />
  )
})
