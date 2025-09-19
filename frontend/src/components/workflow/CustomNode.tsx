
import { Handle, Position, NodeProps } from 'reactflow'
import { clsx } from 'clsx'
import { Play, Pause, AlertCircle, CheckCircle } from 'lucide-react'

interface CustomNodeData {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  status?: 'idle' | 'running' | 'success' | 'error'
  icon?: string
  color?: string
}

export function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Play className="w-3 h-3 text-blue-500" />
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getNodeColor = () => {
    if (data.disabled) return 'bg-gray-100 border-gray-300'
    if (selected) return 'bg-blue-50 border-blue-500'
    
    switch (data.status) {
      case 'running':
        return 'bg-blue-50 border-blue-300'
      case 'success':
        return 'bg-green-50 border-green-300'
      case 'error':
        return 'bg-red-50 border-red-300'
      default:
        return 'bg-white border-gray-300 hover:border-gray-400'
    }
  }

  return (
    <div
      className={clsx(
        'px-4 py-2 shadow-md rounded-md border-2 min-w-[150px] transition-colors',
        getNodeColor(),
        data.disabled && 'opacity-60'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      {/* Node content */}
      <div className="flex items-center space-x-2">
        {/* Node icon */}
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: data.color || '#666' }}
        >
          {data.icon || data.nodeType.charAt(0).toUpperCase()}
        </div>

        {/* Node label */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {data.nodeType}
          </div>
        </div>

        {/* Status icon */}
        {getStatusIcon()}
      </div>

      {/* Disabled overlay */}
      {data.disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-md">
          <Pause className="w-4 h-4 text-gray-500" />
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  )
}