export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, any>;
  position: { x: number; y: number };
  credentials?: string[];
  disabled: boolean;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourceOutput: string;
  targetNodeId: string;
  targetInput: string;
}

export interface WorkflowSettings {
  timezone?: string;
  saveDataErrorExecution?: "all" | "none";
  saveDataSuccessExecution?: "all" | "none";
  saveManualExecutions?: boolean;
  callerPolicy?: "workflowsFromSameOwner" | "workflowsFromAList" | "any";
}

export interface WorkflowMetadata {
  title: string;
  lastTitleUpdate: string;
  exportVersion: string;
  importSource?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  version?: number;
  schemaVersion?: string;
  tags?: string[];
  customProperties?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  userId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  active: boolean;
  tags?: string[];
  category?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  sharedWith?: WorkflowShare[];
  analytics?: WorkflowAnalytics;
  metadata?: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowShare {
  userId: string;
  userEmail: string;
  permission: "view" | "edit" | "admin";
  sharedAt: string;
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutedAt?: string;
  popularityScore: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  author: string;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowFilters {
  search?: string;
  tags?: string[];
  category?: string;
  active?: boolean;
  isTemplate?: boolean;
  isPublic?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "popularity" | "executions";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface WorkflowImportExport {
  workflow: Omit<Workflow, "id" | "userId" | "createdAt" | "updatedAt">;
  version: string;
  exportedAt: string;
  exportedBy: string;
}

export interface NodeType {
  type: string;
  displayName: string;
  name: string;
  group: string[];
  version: number;
  description: string;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  icon?: string;
  color?: string;
  properties: NodeProperty[];
  credentials?: CredentialDefinition[];
}

export interface CredentialDefinition {
  name: string;
  displayName: string;
  description?: string;
  required?: boolean;
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "options"
    | "multiOptions"
    | "json"
    | "dateTime";
  required?: boolean;
  default?: any;
  description?: string;
  placeholder?: string;
  options?: Array<{ name: string; value: any }>;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

export interface WorkflowEditorState {
  workflow: Workflow | null;
  selectedNodeId: string | null;
  isLoading: boolean;
  isDirty: boolean;
  history: WorkflowHistoryEntry[];
  historyIndex: number;
}

export interface WorkflowHistoryEntry {
  workflow: Workflow;
  timestamp: number;
  action: string;
}

export interface NodePaletteCategory {
  name: string;
  nodes: NodeType[];
}

// React Flow specific types
export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    parameters: Record<string, any>;
    disabled: boolean;
  };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Execution-related types
export interface ExecutionState {
  status: "idle" | "running" | "success" | "error" | "cancelled" | "paused";
  progress?: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  executionId?: string;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: "success" | "error" | "cancelled";
  startTime: number;
  endTime: number;
  duration: number;
  nodeResults: NodeExecutionResult[];
  error?: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  status: "success" | "error" | "skipped";
  startTime: number;
  endTime: number;
  duration: number;
  data?: any;
  error?: string;
}
