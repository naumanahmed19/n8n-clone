// Node system type definitions

export interface CredentialSelectorConfig {
  displayName: string;
  description?: string;
  placeholder?: string;
  allowedTypes: string[]; // Array of credential type names that can be selected
  required?: boolean;
}

export interface NodeDefinition {
  type: string;
  displayName: string;
  name: string;
  group: string[];
  version: number;
  description: string;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  credentials?: CredentialDefinition[];
  credentialSelector?: CredentialSelectorConfig;
  properties: NodeProperty[] | (() => NodeProperty[]); // Support both static and dynamic properties
  execute: NodeExecuteFunction;
  hooks?: NodeHooks;
  icon?: string;
  color?: string;
  outputComponent?: string; // Optional custom output component identifier
  // Execution metadata (optional - will be computed from group if not provided)
  executionCapability?: "trigger" | "action" | "transform" | "condition";
  canExecuteIndividually?: boolean;
  canBeDisabled?: boolean;
  // Dynamic options loading
  loadOptions?: Record<
    string,
    (
      this: NodeExecutionContext
    ) => Promise<Array<{ name: string; value: any; description?: string }>>
  >;
}

export interface NodePropertyOption {
  name: string;
  value: any;
  description?: string;
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
    | "dateTime"
    | "collection"
    | "autocomplete"
    | "credential" // New: Support for credential selector
    | "custom"; // New: Support for custom components
  required?: boolean;
  default?: any;
  description?: string;
  placeholder?: string; // Placeholder text for input fields
  options?: NodePropertyOption[];
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  typeOptions?: {
    multipleValues?: boolean;
    multipleValueButtonText?: string;
  };
  // New: Custom component configuration
  component?: string; // Component identifier/name
  componentProps?: Record<string, any>; // Additional props for custom component
  // New: For credential type
  allowedTypes?: string[]; // Array of credential type names that can be selected
}

export interface CredentialDefinition {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: NodeProperty[];
  authenticate?: {
    type: "generic" | "oauth2" | "oauth1";
    properties: Record<string, any>;
  };
}

export interface NodeHooks {
  activate?: () => Promise<void>;
  deactivate?: () => Promise<void>;
}

export interface NodeInputData {
  main?: any[][];
  [key: string]: any[][] | undefined;
}

export interface NodeOutputData {
  main?: any[];
  [key: string]: any[] | undefined;
}

// Standardized node output format for consistent frontend handling
export interface StandardizedNodeOutput {
  main: any[];
  branches?: Record<string, any[]>;
  metadata: {
    nodeType: string;
    outputCount: number;
    hasMultipleBranches: boolean;
  };
}

export interface NodeExecutionContext {
  getNodeParameter(parameterName: string, itemIndex?: number): any;
  getCredentials(type: string): Promise<any>;
  getInputData(inputName?: string): NodeInputData;
  helpers: NodeHelpers;
  logger: NodeLogger;
  // Utility functions for common node operations
  resolveValue: (value: string | any, item: any) => any;
  resolvePath: (obj: any, path: string) => any;
  extractJsonData: (items: any[]) => any[];
  wrapJsonData: (items: any[]) => any[];
  normalizeInputItems: (items: any[] | any[][]) => any[];
}

export interface NodeHelpers {
  request: (options: RequestOptions) => Promise<any>;
  requestWithAuthentication: (
    credentialType: string,
    options: RequestOptions
  ) => Promise<any>;
  returnJsonArray: (jsonData: any[]) => NodeOutputData;
  normalizeItems: (items: any[]) => any[];
}

export interface NodeLogger {
  debug: (message: string, extra?: any) => void;
  info: (message: string, extra?: any) => void;
  warn: (message: string, extra?: any) => void;
  error: (message: string, extra?: any) => void;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: any;
  json?: boolean;
  timeout?: number;
  followRedirect?: boolean;
  ignoreHttpStatusErrors?: boolean;
}

export type NodeExecuteFunction = (
  this: NodeExecutionContext,
  inputData: NodeInputData
) => Promise<NodeOutputData[]>;

export interface NodeValidationResult {
  valid: boolean;
  errors: NodeValidationError[];
}

export interface NodeValidationError {
  property: string;
  message: string;
  value?: any;
}

export interface NodeSchema {
  type: string;
  displayName: string;
  name: string;
  group: string[];
  version: number;
  description: string;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  properties: NodeProperty[];
  credentials?: CredentialDefinition[];
  credentialSelector?: CredentialSelectorConfig;
  icon?: string;
  color?: string;
}

export interface NodeRegistrationResult {
  success: boolean;
  nodeType?: string;
  errors?: string[];
}

export interface NodeExecutionResult {
  success: boolean;
  data?: StandardizedNodeOutput;
  error?: {
    message: string;
    stack?: string;
    httpCode?: number;
  };
}

// Built-in node types
export enum BuiltInNodeTypes {
  HTTP_REQUEST = "http-request",
  JSON = "json",
  SET = "set",
  IF = "if",
  CODE = "code",
  WEBHOOK = "webhook",
  WEBHOOK_TRIGGER = "webhook-trigger",
  SCHEDULE_TRIGGER = "schedule-trigger",
  MANUAL_TRIGGER = "manual-trigger",
  WORKFLOW_CALLED = "workflow-called",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

export interface NodeTypeInfo {
  type: string;
  displayName: string;
  name: string;
  description: string;
  group: string[];
  version: number;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  properties: NodeProperty[];
  credentials?: CredentialDefinition[]; // Include credentials
  credentialSelector?: CredentialSelectorConfig; // Include unified credential selector
  icon?: string;
  color?: string;
  // Execution metadata
  executionCapability?: "trigger" | "action" | "transform" | "condition";
  canExecuteIndividually?: boolean;
  canBeDisabled?: boolean;
}
