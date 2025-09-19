import { NodeProperty, WorkflowNode } from '@/types'

export interface ValidationError {
  field: string
  message: string
  type: 'required' | 'invalid' | 'format'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class NodeValidator {
  static validateNode(node: WorkflowNode, properties: NodeProperty[]): ValidationResult {
    const errors: ValidationError[] = []

    // Validate node name
    if (!node.name || node.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Node name is required',
        type: 'required'
      })
    }

    // Validate each property
    properties.forEach(property => {
      const value = node.parameters[property.name]
      const fieldErrors = this.validateProperty(property, value)
      errors.push(...fieldErrors)
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateProperty(property: NodeProperty, value: any): ValidationError[] {
    const errors: ValidationError[] = []

    // Check required fields
    if (property.required && this.isEmpty(value)) {
      errors.push({
        field: property.name,
        message: `${property.displayName} is required`,
        type: 'required'
      })
      return errors // Don't validate further if required field is empty
    }

    // Skip validation if value is empty and not required
    if (this.isEmpty(value)) {
      return errors
    }

    // Type-specific validation
    switch (property.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: property.name,
            message: `${property.displayName} must be a string`,
            type: 'invalid'
          })
        }
        break

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: property.name,
            message: `${property.displayName} must be a valid number`,
            type: 'invalid'
          })
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: property.name,
            message: `${property.displayName} must be true or false`,
            type: 'invalid'
          })
        }
        break

      case 'options':
        if (property.options) {
          const validValues = property.options.map(opt => opt.value)
          if (!validValues.includes(value)) {
            errors.push({
              field: property.name,
              message: `${property.displayName} must be one of: ${validValues.join(', ')}`,
              type: 'invalid'
            })
          }
        }
        break

      case 'multiOptions':
        if (!Array.isArray(value)) {
          errors.push({
            field: property.name,
            message: `${property.displayName} must be an array`,
            type: 'invalid'
          })
        } else if (property.options) {
          const validValues = property.options.map(opt => opt.value)
          const invalidValues = value.filter(v => !validValues.includes(v))
          if (invalidValues.length > 0) {
            errors.push({
              field: property.name,
              message: `${property.displayName} contains invalid values: ${invalidValues.join(', ')}`,
              type: 'invalid'
            })
          }
        }
        break

      case 'json':
        if (typeof value === 'string') {
          try {
            JSON.parse(value)
          } catch {
            errors.push({
              field: property.name,
              message: `${property.displayName} must be valid JSON`,
              type: 'format'
            })
          }
        }
        break

      case 'dateTime':
        if (typeof value === 'string') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors.push({
              field: property.name,
              message: `${property.displayName} must be a valid date/time`,
              type: 'format'
            })
          }
        }
        break
    }

    return errors
  }

  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }

  static getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
    const error = errors.find(e => e.field === fieldName)
    return error?.message
  }

  static hasFieldError(errors: ValidationError[], fieldName: string): boolean {
    return errors.some(e => e.field === fieldName)
  }

  static groupErrorsByType(errors: ValidationError[]): Record<string, ValidationError[]> {
    return errors.reduce((acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = []
      }
      acc[error.type].push(error)
      return acc
    }, {} as Record<string, ValidationError[]>)
  }

  static validateCredentials(node: WorkflowNode, credentialDefinitions: any[]): ValidationError[] {
    const errors: ValidationError[] = []

    if (!credentialDefinitions || credentialDefinitions.length === 0) {
      return errors
    }

    credentialDefinitions.forEach(credDef => {
      if (credDef.required) {
        const hasCredential = node.credentials?.some(credId => credId && credId.trim().length > 0)
        if (!hasCredential) {
          errors.push({
            field: `credential_${credDef.name}`,
            message: `${credDef.displayName} credential is required`,
            type: 'required'
          })
        }
      }
    })

    return errors
  }

  static validateNodeConnections(node: WorkflowNode, connections: any[]): ValidationError[] {
    const errors: ValidationError[] = []

    // Check if node has required inputs
    const incomingConnections = connections.filter(conn => conn.targetNodeId === node.id)
    if (incomingConnections.length === 0 && !node.type.includes('trigger')) {
      errors.push({
        field: 'connections',
        message: 'Node must have at least one input connection',
        type: 'invalid'
      })
    }

    return errors
  }

  static getValidationSummary(errors: ValidationError[]): {
    total: number
    byType: Record<string, number>
    critical: ValidationError[]
  } {
    const byType = this.groupErrorsByType(errors)
    const critical = errors.filter(e => e.type === 'required')

    return {
      total: errors.length,
      byType: Object.keys(byType).reduce((acc, type) => {
        acc[type] = byType[type].length
        return acc
      }, {} as Record<string, number>),
      critical
    }
  }

  static formatValidationMessage(errors: ValidationError[]): string {
    if (errors.length === 0) return 'Configuration is valid'

    const summary = this.getValidationSummary(errors)
    if (summary.critical.length > 0) {
      return `${summary.critical.length} required field${summary.critical.length > 1 ? 's' : ''} missing`
    }

    return `${summary.total} validation error${summary.total > 1 ? 's' : ''} found`
  }
}