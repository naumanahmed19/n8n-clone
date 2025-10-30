import { useWorkflowStore } from '@/stores'
import type { NodeType } from '@/types'
import { Node, NodeProps } from '@xyflow/react'
import { memo, useMemo } from 'react'
import { NodeMetadata } from './components/NodeMetadata'
import { nodeEnhancementRegistry } from './enhancements'
import { useNodeExecution } from './hooks/useNodeExecution'
import { BaseNodeWrapper } from './nodes/BaseNodeWrapper'

interface CustomNodeData extends Record<string, unknown> {
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

type CustomNodeType = Node<CustomNodeData>

export const CustomNode = memo(function CustomNode({ data, selected, id }: NodeProps<CustomNodeType>) {
  // OPTIMIZATION: Use Zustand selector to prevent unnecessary re-renders
  // Get read-only state from store (only true when viewing past execution)
  const readOnly = useWorkflowStore(state => state.readOnly)

  // Use custom hooks for node visual state
  const { nodeVisualState, nodeExecutionState } = useNodeExecution(id, data.nodeType)

  // Check if this is a trigger node (memoize to prevent recalculation)
  const isTrigger = useMemo(() =>
    data.executionCapability === 'trigger',
    [data.executionCapability]
  )

  // Get icon and color from node type definition using the same utility as NodeTypesList
  // This will handle file: icons, fa: icons, lucide: icons, and emoji automatically
  const nodeIcon = useMemo(() => {
    // If data has icon override, use it; otherwise get from node type definition
    return data.icon || data.nodeTypeDefinition?.icon
  }, [data.icon, data.nodeTypeDefinition?.icon])

  const nodeColor = useMemo(() => {
    // If data has color override, use it; otherwise get from node type definition
    return data.color || data.nodeTypeDefinition?.color || '#666'
  }, [data.color, data.nodeTypeDefinition?.color])

  // Memoize nodeConfig object to prevent recreation
  const nodeConfig = useMemo(() => ({
    icon: nodeIcon,
    color: nodeColor,
    isTrigger,
    inputs: data.inputs,
    outputs: data.outputs,
    imageUrl: data.parameters?.imageUrl as string,
    nodeType: data.nodeType,  // Pass nodeType for file: icon resolution
  }), [nodeIcon, nodeColor, isTrigger, data.inputs, data.outputs, data.parameters?.imageUrl, data.nodeType])

  // Render node enhancements (badges, overlays, etc.) using the registry
  const nodeEnhancements = useMemo(() => {
    const enhancements = nodeEnhancementRegistry.renderOverlays({
      nodeId: id,
      nodeType: data.nodeType,
      parameters: data.parameters,
      isExecuting: nodeExecutionState.isExecuting,
      executionResult: data.executionResult,
    })
    
    return enhancements
  }, [id, data.nodeType, data.parameters, nodeExecutionState.isExecuting, data.executionResult])

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
      onToggleExpand={() => { }}
      canExpand={false}
      nodeConfig={nodeConfig}
      customMetadata={customMetadata}
      toolbar={toolbarConfig}
      nodeEnhancements={nodeEnhancements}
    />
  )
})
