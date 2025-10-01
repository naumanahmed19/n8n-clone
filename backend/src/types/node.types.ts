// Node system type definitions

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
  properties: NodeProperty[] | (() => NodeProperty[]); // Support both static and dynamic properties
  execute: NodeExecuteFunction;
  hooks?: NodeHooks;
  icon?: string;
  color?: string;
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
    | "custom"; // New: Support for custom components
  required?: boolean;
  default?: any;
  description?: string;
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
  WEBHOOK = "webhook",
  WEBHOOK_TRIGGER = "webhook-trigger",
  SCHEDULE_TRIGGER = "schedule-trigger",
  MANUAL_TRIGGER = "manual-trigger",
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
  icon?: string;
  color?: string;
}
