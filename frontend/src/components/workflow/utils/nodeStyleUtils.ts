/**
 * Node styling utilities for consistent status-based styling across all node types
 */

export interface NodeStyleConfig {
  status?: string
  selected?: boolean
  disabled?: boolean
}

/**
 * Get border classes based on node status
 */
export function getNodeBorderClasses(config: NodeStyleConfig): string {
  const { status, selected, disabled } = config
  
  if (disabled) return 'border-gray-300'
  if (selected) return 'border-blue-500 ring-2 ring-blue-200'
  
  switch (status) {
    case 'running':
      return 'border-blue-300'
    case 'success':
      return 'border-green-300'
    case 'error':
      return 'border-red-300'
    case 'skipped':
      return 'border-gray-200'
    default:
      return 'border-gray-300'
  }
}

/**
 * Get animation classes based on node status
 */
export function getNodeAnimationClasses(status?: string): string {
  switch (status) {
    case 'running':
      return 'node-running node-glow-running'
    case 'success':
      return 'node-success node-glow-success'
    case 'error':
      return 'node-error node-glow-error'
    default:
      return ''
  }
}

/**
 * Get complete node status classes (border + animation)
 * This is a convenience function that combines border and animation classes
 */
export function getNodeStatusClasses(
  status?: string, 
  selected?: boolean, 
  disabled?: boolean
): string {
  const config: NodeStyleConfig = { status, selected, disabled }
  const borderClasses = getNodeBorderClasses(config)
  const animationClasses = getNodeAnimationClasses(status)
  
  return `${borderClasses} ${animationClasses}`.trim()
}
