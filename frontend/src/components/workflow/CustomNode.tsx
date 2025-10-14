import { useWorkflowStore } from '@/stores'
import type { NodeType } from '@/types'
import { getNodeIcon } from '@/utils/nodeIconMap'
import { memo, useMemo } from 'react'
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

export const CustomNode = memo(function CustomNode({ data, selected, id }: NodeProps<CustomNodeData>) {
  // OPTIMIZATION: Use Zustand selector to prevent unnecessary re-renders
  // Get read-only state from store (only true when viewing past execution)
  const readOnly = useWorkflowStore(state => state.readOnly)
  
  // Use custom hooks for node visual state
  const { nodeVisualState } = useNodeExecution(id, data.nodeType)

  // Check if this is a trigger node (memoize to prevent recalculation)
  const isTrigger = useMemo(() => 
    data.executionCapability === 'trigger',
    [data.executionCapability]
  )

  // Memoize icon configuration to prevent calling getNodeIcon on every render
  const iconConfig = useMemo(() => getNodeIcon(data.nodeType), [data.nodeType])
  
  // Memoize derived icon and color values
  const nodeIcon = useMemo(() => data.icon || iconConfig.icon, [data.icon, iconConfig.icon])
  const nodeColor = useMemo(() => data.color || iconConfig.color, [data.color, iconConfig.color])

  // Memoize nodeConfig object to prevent recreation
  const nodeConfig = useMemo(() => ({
    icon: nodeIcon,
    color: nodeColor,
    isTrigger,
    inputs: data.inputs,
    outputs: data.outputs,
    imageUrl: data.parameters?.imageUrl as string,
  }), [nodeIcon, nodeColor, isTrigger, data.inputs, data.outputs, data.parameters?.imageUrl])

  // Memoize toolbar config
  const toolbarConfig = useMemo(() => ({
    showToolbar: true,
  }), [])

  // Memoize custom metadata component
  const customMetadata = useMemo(() => (
    <NodeMetadata nodeVisualState={nodeVisualState} />
  ), [nodeVisualState])

  return (
    <BaseNodeWrapper
      id={id}
      selected={selected}
      data={data}
      isReadOnly={readOnly}
      isExpanded={false}
      onToggleExpand={() => {}}
      canExpand={false}
      nodeConfig={nodeConfig}
      customMetadata={customMetadata}
      toolbar={toolbarConfig}
    />
  )
})