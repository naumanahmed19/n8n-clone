import { cn } from '@/lib/utils'
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { FieldRenderer } from './FieldRenderer'
import { FieldValidator } from './FieldValidator'
import { FieldVisibilityManager } from './FieldVisibilityManager'
import { FormFieldConfig, FormGeneratorProps, FormGeneratorRef } from './types'

export const FormGenerator = forwardRef<FormGeneratorRef, FormGeneratorProps>(({
  fields,
  values,
  errors: externalErrors = {},
  onChange,
  onFieldBlur,
  disabled = false,
  className,
  fieldClassName,
  showRequiredIndicator = true,
  requiredIndicator = <span className="text-destructive ml-1">*</span>,
  nodeId,
  nodeType,
  disableAutoValidation = false,
  validateOnMount = false,
  validateOnChange = false,
  validateOnBlur = true,
}, ref) => {
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({})
  const [hasValidated, setHasValidated] = useState(false) // Track if validation has run at least once
  
  // Combine external and internal errors, with external taking precedence
  const allErrors = { ...internalErrors, ...externalErrors }

  // Get visible fields based on current values - memoized to prevent infinite re-renders
  const visibleFields = useMemo(() => {
    return FieldVisibilityManager.getVisibleFields(fields, values)
  }, [fields, values])

  // Expose validation methods via ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      // Only validate visible fields, not hidden ones
      const errors = FieldValidator.validateForm(visibleFields, values)
      setInternalErrors(errors)
      return errors
    },
    isValid: () => {
      // Only validate visible fields, not hidden ones
      const errors = FieldValidator.validateForm(visibleFields, values)
      return Object.keys(errors).length === 0
    }
  }), [visibleFields, values])

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: any) => {
    onChange(fieldName, value)

    // Clear error for this field when value changes
    if (allErrors[fieldName]) {
      setInternalErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }

    // Re-validate dependent fields when this field changes
    const dependentFields = FieldVisibilityManager.getDependentFields(fieldName, fields)
    if (dependentFields.length > 0) {
      // Small delay to ensure state has updated
      setTimeout(() => {
        setInternalErrors(prev => {
          const newErrors = { ...prev }
          let hasChanges = false

          dependentFields.forEach(depField => {
            const currentValue = values[depField.name]
            const error = FieldValidator.validateField(depField, currentValue)
            
            if (error && !newErrors[depField.name]) {
              newErrors[depField.name] = error
              hasChanges = true
            } else if (!error && newErrors[depField.name]) {
              delete newErrors[depField.name]
              hasChanges = true
            }
          })

          return hasChanges ? newErrors : prev
        })
      }, 0)
    }
  }

  // Handle field blur events
  const handleFieldBlur = (fieldName: string, value: any) => {
    // Only validate on blur if not disabled and validateOnBlur is true
    if (!disableAutoValidation && validateOnBlur) {
      const field = fields.find(f => f.name === fieldName)
      if (field && !externalErrors[fieldName]) {
        const error = FieldValidator.validateField(field, value)
        if (error) {
          setInternalErrors(prev => ({ ...prev, [fieldName]: error }))
        }
      }
    }

    // Call external blur handler if provided
    if (onFieldBlur) {
      onFieldBlur(fieldName, value)
    }
  }

  // Validate all visible fields when they change
  useEffect(() => {
    // Skip all validation if disableAutoValidation is true
    if (disableAutoValidation) {
      if (!hasValidated) setHasValidated(true)
      return
    }

    // Skip validation on mount if validateOnMount is false
    if (!hasValidated && !validateOnMount) {
      setHasValidated(true)
      return
    }

    // Skip validation if validateOnChange is false and this isn't the first validation
    if (!validateOnChange && hasValidated) {
      return
    }

    // Only validate if there are no external errors to avoid conflicts
    // Check if external errors exist and have actual error messages
    const hasExternalErrors = externalErrors && Object.keys(externalErrors).length > 0
    
    if (!hasExternalErrors) {
      const errors = FieldValidator.validateForm(visibleFields, values)
      setInternalErrors(prev => {
        // Only update if errors have actually changed
        const prevKeys = Object.keys(prev).sort()
        const newKeys = Object.keys(errors).sort()
        
        if (prevKeys.length !== newKeys.length || 
            !prevKeys.every((key, index) => key === newKeys[index]) ||
            !Object.keys(errors).every(key => prev[key] === errors[key])) {
          return errors
        }
        
        return prev
      })
    }

    if (!hasValidated) {
      setHasValidated(true)
    }
  }, [visibleFields, values, externalErrors, validateOnMount, validateOnChange, hasValidated])

  return (
    <div className={cn('space-y-6', className)}>
      {visibleFields.map((field) => (
        <FieldWrapper key={field.name} field={field} values={values} allFields={fields}>
          <div className={cn('space-y-2', fieldClassName)}>
            <FormFieldLabel 
              field={field}
              showRequiredIndicator={showRequiredIndicator}
              requiredIndicator={requiredIndicator}
            />
            <div>
              <FieldRenderer
                field={field}
                value={values[field.name] ?? field.default}
                error={allErrors[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                onBlur={(value) => handleFieldBlur(field.name, value)}
                disabled={disabled}
                allValues={values}
                allFields={fields}
                onFieldChange={handleFieldChange}
                nodeId={nodeId}
                nodeType={nodeType}
              />
            </div>
            <FormFieldDescription field={field} />
            <FormFieldError error={allErrors[field.name]} />
          </div>
        </FieldWrapper>
      ))}
    </div>
  )
})

FormGenerator.displayName = 'FormGenerator'

// Individual form field component
interface FieldWrapperProps {
  field: FormFieldConfig
  values: Record<string, any>
  allFields: FormFieldConfig[]
  children: React.ReactNode
}

function FieldWrapper({ field, values, allFields, children }: FieldWrapperProps) {
  // Check if field should be visible
  const isVisible = FieldVisibilityManager.shouldShowField(field, values, allFields)
  
  if (!isVisible) {
    return null
  }

  return <>{children}</>
}

// Form field label component
interface FormFieldLabelProps {
  field: FormFieldConfig
  showRequiredIndicator: boolean
  requiredIndicator: React.ReactNode
}

function FormFieldLabel({ field, showRequiredIndicator, requiredIndicator }: FormFieldLabelProps) {
  // Don't show label for boolean, switch, and custom component types
  if (field.type === 'boolean' || field.type === 'switch' || field.type === 'custom') {
    return null
  }

  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {field.displayName}
      {field.required && showRequiredIndicator && requiredIndicator}
    </label>
  )
}

// Form field description component
interface FormFieldDescriptionProps {
  field: FormFieldConfig
}

function FormFieldDescription({ field }: FormFieldDescriptionProps) {
  // Don't show description for boolean and switch types as they use it as label text
  if (field.type === 'boolean' || field.type === 'switch') {
    return null
  }

  if (!field.description) {
    return null
  }

  return <p className="text-sm text-muted-foreground">{field.description}</p>
}

// Form field error component
interface FormFieldErrorProps {
  error?: string
}

function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) {
    return null
  }

  return <p className="text-sm font-medium text-destructive">{error}</p>
}
