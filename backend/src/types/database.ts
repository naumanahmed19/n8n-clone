// Core database types matching Prisma schema

export interface User {
  id: string
  email: string
  password: string
  name?: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Workflow {
  id: string
  name: string
  description?: string
  userId: string
  nodes: Node[]
  connections: Connection[]
  triggers: Trigger[]
  settings: WorkflowSettings
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Node {
  id: string
  type: string
  name: string
  parameters: Record<string, any>
  position: { x: number; y: number }
  credentials?: string[]
  disabled: boolean
}

export interface Connection {
  id: string
  sourceNodeId: string
  sourceOutput: string
  targetNodeId: string
  targetInput: string
}

export interface Trigger {
  id: string
  type: 'webhook' | 'schedule' | 'manual'
  settings: Record<string, any>
  active: boolean
}

export interface WorkflowSettings {
  timezone?: string
  saveExecutionProgress?: boolean
  saveDataErrorExecution?: 'all' | 'none'
  saveDataSuccessExecution?: 'all' | 'none'
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any'
  executionTimeout?: number
}

export interface Execution {
  id: string
  workflowId: string
  status: ExecutionStatus
  startedAt: Date
  finishedAt?: Date
  triggerData?: any
  error?: ExecutionError
  createdAt: Date
  updatedAt: Date
}

export interface NodeExecution {
  id: string
  nodeId: string
  executionId: string
  status: NodeExecutionStatus
  inputData?: any
  outputData?: any
  error?: NodeError
  startedAt?: Date
  finishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Credential {
  id: string
  name: string
  type: string
  userId: string
  data: string // Encrypted
  createdAt: Date
  updatedAt: Date
}

export interface NodeType {
  id: string
  type: string
  displayName: string
  name: string
  group: string[]
  version: number
  description: string
  defaults: Record<string, any>
  inputs: string[]
  outputs: string[]
  properties: NodeProperty[]
  icon?: string
  color?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Enums
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum ExecutionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}

export enum NodeExecutionStatus {
  WAITING = 'WAITING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Error types
export interface ExecutionError {
  message: string
  stack?: string
  timestamp: Date
  nodeId?: string
}

export interface NodeError {
  message: string
  stack?: string
  timestamp: Date
  httpCode?: number
}

// Node property types
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

// Filter types
export interface WorkflowFilters {
  search?: string
  active?: boolean
  userId?: string
  limit?: number
  offset?: number
}

export interface ExecutionFilters {
  status?: ExecutionStatus
  workflowId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Result types
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface ExecutionResult {
  success: boolean
  data?: any
  error?: ExecutionError
}

export interface NodeResult {
  success: boolean
  data?: any
  error?: NodeError
}