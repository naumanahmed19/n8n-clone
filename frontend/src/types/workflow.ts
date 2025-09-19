export interface WorkflowNode {
  id: string
  type: string
  name: string
  parameters: Record<string, any>
  position: { x: number; y: number }
  credentials?: string[]
  disabled: boolean
}

export interface WorkflowConnection {
  id: string
  sourceNodeId: string
  sourceOutput: string
  targetNodeId: string
  targetInput: string
}

export interface WorkflowSettings {
  timezone?: string
  saveDataErrorExecution?: 'all' | 'none'
  saveDataSuccessExecution?: 'all' | 'none'
  saveManualExecutions?: boolean
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any'
}

export interface Workflow {
  id: string
  name: string
  description?: string
  userId: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  settings: WorkflowSettings
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface NodeType {
  type: string
  displayName: string
  name: string
  group: string[]
  version: number
  description: string
  defaults: Record<string, any>
  inputs: string[]
  outputs: string[]
  icon?: string
  color?: string
  properties: NodeProperty[]
}

export interface NodeProperty {
  displayName: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'options' | 'multiOptions' | 'json' | 'dateTime'
  required?: boolean
  default?: any
  description?: string
  options?: Array<{ name: string; value: any }>
  displayOptions?: {
    show?: Record<string, any[]>
    hide?: Record<string, any[]>
  }
}

export interface WorkflowEditorState {
  workflow: Workflow | null
  selectedNodeId: string | null
  isLoading: boolean
  isDirty: boolean
  history: WorkflowHistoryEntry[]
  historyIndex: number
}

export interface WorkflowHistoryEntry {
  workflow: Workflow
  timestamp: number
  action: string
}

export interface NodePaletteCategory {
  name: string
  nodes: NodeType[]
}

// React Flow specific types
export interface ReactFlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    nodeType: string
    parameters: Record<string, any>
    disabled: boolean
  }
}

export interface ReactFlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}