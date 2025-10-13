import { variableService } from '@/services'
import { useWorkflowStore } from '@/stores'
import type { Variable } from '@/types/variable'
import { Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ExpressionPreviewProps {
  value: string
  nodeId?: string
}

export function ExpressionPreview({ value, nodeId }: ExpressionPreviewProps) {
  const workflowStore = useWorkflowStore()
  const [variables, setVariables] = useState<Variable[]>([])

  // Fetch variables on mount
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const fetchedVariables = await variableService.getVariables()
        setVariables(fetchedVariables)
      } catch (error) {
        console.error('Error fetching variables for preview:', error)
      }
    }
    fetchVariables()
  }, [])

  // Function to resolve expression values
  const resolveExpression = (expression: string): string => {
    try {
      // First, check if it's a variable expression ($vars.* or $local.*)
      const varsMatch = expression.match(/^\$vars\.(.+)$/)
      const localMatch = expression.match(/^\$local\.(.+)$/)
      
      if (varsMatch) {
        const varKey = varsMatch[1]
        const variable = variables.find(v => v.key === varKey && v.scope === 'GLOBAL')
        if (variable) {
          return variable.value
        }
        return `[Variable not found: $vars.${varKey}]`
      }
      
      if (localMatch) {
        const varKey = localMatch[1]
        const variable = variables.find(v => v.key === varKey && v.scope === 'LOCAL')
        if (variable) {
          return variable.value
        }
        return `[Variable not found: $local.${varKey}]`
      }

      // If not a variable, check if it's a json.* expression (from connected nodes)
      if (!nodeId) return expression

      const { workflow } = workflowStore
      if (!workflow) return expression

      // Find all connections where the current node is the target
      const inputConnections = workflow.connections.filter(
        (conn) => conn.targetNodeId === nodeId
      )

      if (inputConnections.length === 0) return expression

      // Get data from the first connected node (or iterate through all)
      for (const connection of inputConnections) {
        const sourceNodeId = connection.sourceNodeId
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

        // Get the first item's data
        const firstItem = sourceData[0]
        let itemData: any = null
        
        if (firstItem && firstItem.json) {
          itemData = firstItem.json
        } else if (firstItem) {
          itemData = firstItem
        }

        if (!itemData) continue

        // Parse the expression (e.g., "json.field" or "json.nested.field")
        const exprMatch = expression.match(/^json\.(.+)$/)
        if (exprMatch) {
          const fieldPath = exprMatch[1]
          const value = getNestedValue(itemData, fieldPath)
          if (value !== undefined) {
            return formatValue(value)
          }
        }
      }

      return expression
    } catch (error) {
      console.error('Error resolving expression:', error)
      return expression
    }
  }

  // Helper function to get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    const parts = path.split(/[.\[\]]/).filter(Boolean)
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }

      // Check if it's an array index
      const arrayIndex = parseInt(part, 10)
      if (!isNaN(arrayIndex) && Array.isArray(current)) {
        current = current[arrayIndex]
      } else {
        current = current[part]
      }
    }

    return current
  }

  // Helper function to format values for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `[Array: ${value.length} items]`
    if (typeof value === 'object') return '[Object]'
    return String(value)
  }

  // Function to parse and resolve all expressions in the text
  const getPreviewText = (): string => {
    if (!value) return ''

    // Find all {{...}} expressions and replace them with actual values
    const resolvedText = value.replace(/\{\{([^}]+)\}\}/g, (_match, expression) => {
      const trimmedExpr = expression.trim()
      
      // Check if it's a complex expression (contains operators or function calls)
      const isComplexExpression = /[+\-*/%()[\]<>=!&|]/.test(trimmedExpr)
      
      if (isComplexExpression) {
        // For complex expressions, replace variables within them first
        let resolvedExpression = trimmedExpr
        
        // Replace $vars.* variables
        resolvedExpression = resolvedExpression.replace(/\$vars\.(\w+)/g, (_m: string, varKey: string) => {
          const variable = variables.find(v => v.key === varKey && v.scope === 'GLOBAL')
          return variable ? JSON.stringify(variable.value) : `"[Variable not found: $vars.${varKey}]"`
        })
        
        // Replace $local.* variables
        resolvedExpression = resolvedExpression.replace(/\$local\.(\w+)/g, (_m: string, varKey: string) => {
          const variable = variables.find(v => v.key === varKey && v.scope === 'LOCAL')
          return variable ? JSON.stringify(variable.value) : `"[Variable not found: $local.${varKey}]"`
        })
        
        // Try to evaluate the expression
        try {
          // eslint-disable-next-line no-eval
          const result = eval(resolvedExpression)
          return String(result)
        } catch (error) {
          // If evaluation fails, return the resolved expression as-is
          return `[Expression: ${resolvedExpression}]`
        }
      }
      
      // For simple expressions, use the existing resolveExpression function
      const resolvedValue = resolveExpression(trimmedExpr)
      return resolvedValue
    })

    return resolvedText
  }

  const previewText = getPreviewText()

  // Don't show preview if there are no expressions or if it's the same as input
  if (!value || !value.includes('{{') || previewText === value) {
    return null
  }

  return (
    <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border">
      <div className="flex items-start gap-2">
        <Eye className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">Preview</div>
          <div className="text-sm text-foreground break-words whitespace-pre-wrap">
            {previewText}
          </div>
        </div>
      </div>
    </div>
  )
}
