import { clsx } from 'clsx'
import { Pause } from 'lucide-react'

interface NodeContentProps {
  icon?: string
  color?: string
  nodeType: string
  disabled: boolean
  isTrigger: boolean
  statusIcon: React.ReactNode
}

export function NodeContent({
  icon,
  color,
  nodeType,
  disabled,
  isTrigger,
  statusIcon
}: NodeContentProps) {
  return (
    <>
      {/* Node content - centered icon and status */}
      <div className="flex items-center justify-center h-full relative">
        {/* Node icon */}
        <div 
          className={clsx(
            "w-8 h-8 flex items-center justify-center text-white text-sm font-bold",
            isTrigger ? 'rounded-full' : 'rounded'
          )}
          style={{ backgroundColor: color || '#666' }}
        >
          {icon || nodeType.charAt(0).toUpperCase()}
        </div>

        {/* Status icon - positioned in top right corner */}
        {statusIcon && (
          <div className="absolute -top-1 -right-1">
            {statusIcon}
          </div>
        )}
      </div>

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute top-1 right-1" data-testid="disabled-overlay">
          <Pause className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </>
  )
}
