// Simplified node type definitions for hello-world node

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
    | "collection";
  required?: boolean;
  default?: any;
  description?: string;
  options?: Array<{
    name: string;
    value: any;
    description?: string;
  }>;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

export interface NodeInputData {
  main?: any[][];
  [key: string]: any[][] | undefined;
}

export interface NodeOutputData {
  main?: any[];
  [key: string]: any[] | undefined;
}

export interface NodeLogger {
  debug?: (message: string, extra?: any) => void;
  info?: (message: string, extra?: any) => void;
  warn?: (message: string, extra?: any) => void;
  error?: (message: string, extra?: any) => void;
}

export interface NodeExecutionContext {
  getNodeParameter(parameterName: string, itemIndex?: number): any;
  getCredentials?(type: string): Promise<any>;
  getInputData?(inputName?: string): NodeInputData;
  helpers?: any;
  logger?: NodeLogger;
}

export type NodeExecuteFunction = (
  this: NodeExecutionContext,
  inputData: NodeInputData
) => Promise<NodeOutputData[]>;

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
  properties: NodeProperty[];
  execute: NodeExecuteFunction;
  icon?: string;
  color?: string;
}
