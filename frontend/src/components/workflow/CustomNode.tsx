import { useWorkflowStore } from '@/stores'
import type { NodeType } from '@/types'
import { getNodeIcon } from '@/utils/nodeIconMap'
import { NodeProps } from 'reactflow'
import { NodeMetadata } from './components/NodeMetadata'
import { useNodeExecution } from './hooks/useNodeExecution'
import { BaseNodeWrapper } from './nodes/BaseNodeWrapper'

interface CustomNodeData {
  label: string
  nodeType: string
  parameters: Record<string, any>
  disabled: boolean
  locked?: boolean
  status?: 'idle' | 'running' | 'success' | 'error'
  icon?: string
  color?: string
  // Node definition properties
  inputs?: string[]
  outputs?: string[]
  nodeTypeDefinition?: NodeType  // Add full node type definition
  executionCapability?: 'trigger' | 'action' | 'transform' | 'condition'  // Add capability
  // Position and style properties
  position?: { x: number; y: number }
  dimensions?: { width: number; height: number }
  customStyle?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    shape?: 'rectangle' | 'trigger'
    opacity?: number
  }
  // Additional properties for node toolbar
  nodeGroup?: string[]
  canExecuteIndividually?: boolean
  executionResult?: any
  isExecuting?: boolean
  hasError?: boolean
}

export function CustomNode({ data, selected, id }: NodeProps<CustomNodeData>) {
  // Check if in execution mode (read-only)
  const { executionState } = useWorkflowStore()
  const isReadOnly = !!executionState.executionId
  
  // Use custom hooks for node visual state
  const { nodeVisualState } = useNodeExecution(id, data.nodeType)

  // Check if this is a trigger node
  const isTrigger = data.executionCapability === 'trigger'

  // Get icon from map if not provided in data
  const iconConfig = getNodeIcon(data.nodeType)
  const nodeIcon = data.icon || iconConfig.icon
  const nodeColor = data.color || iconConfig.color

  return (
    <BaseNodeWrapper
      id={id}
      selected={selected}
      data={data}
      isReadOnly={isReadOnly}
      isExpanded={false}
      onToggleExpand={() => {}}
      canExpand={false}
      nodeConfig={{
        icon: nodeIcon,
        color: nodeColor,
        isTrigger,
        inputs: data.inputs,
        outputs: data.outputs,
        imageUrl: data.parameters?.imageUrl as string,
      }}
      customMetadata={
        <NodeMetadata
          nodeVisualState={nodeVisualState}
        />
      }
      toolbar={{
        showToolbar: true,
      }}
    />
  )
}