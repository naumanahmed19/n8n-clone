import { PrismaClient } from '@prisma/client';
import {
  NodeDefinition,
  NodeSchema,
  NodeValidationResult,
  NodeValidationError,
  NodeRegistrationResult,
  NodeExecutionResult,
  NodeInputData,
  NodeOutputData,
  NodeExecutionContext,
  NodeProperty,
  BuiltInNodeTypes,
  NodeTypeInfo
} from '../types/node.types';
import { logger } from '../utils/logger';
import { SecureExecutionService, CredentialData, SecureExecutionOptions } from './SecureExecutionService';

export class NodeService {
  private prisma: PrismaClient;
  private nodeRegistry = new Map<string, NodeDefinition>();
  private secureExecutionService: SecureExecutionService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.secureExecutionService = new SecureExecutionService(prisma);
    this.initializeBuiltInNodes();
  }

  /**
   * Register a new node type
   */
  async registerNode(nodeDefinition: NodeDefinition): Promise<NodeRegistrationResult> {
    try {
      // Validate node definition
      const validation = this.validateNodeDefinition(nodeDefinition);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      // Check if node type already exists
      const existingNode = await this.prisma.nodeType.findUnique({
        where: { type: nodeDefinition.type }
      });

      if (existingNode) {
        // Update existing node
        await this.prisma.nodeType.update({
          where: { type: nodeDefinition.type },
          data: {
            displayName: nodeDefinition.displayName,
            name: nodeDefinition.name,
            group: nodeDefinition.group,
            version: nodeDefinition.version,
            description: nodeDefinition.description,
            defaults: nodeDefinition.defaults as any,
            inputs: nodeDefinition.inputs,
            outputs: nodeDefinition.outputs,
            properties: nodeDefinition.properties as any,
            icon: nodeDefinition.icon,
            color: nodeDefinition.color,
            active: true
          }
        });
      } else {
        // Create new node
        await this.prisma.nodeType.create({
          data: {
            type: nodeDefinition.type,
            displayName: nodeDefinition.displayName,
            name: nodeDefinition.name,
            group: nodeDefinition.group,
            version: nodeDefinition.version,
            description: nodeDefinition.description,
            defaults: nodeDefinition.defaults as any,
            inputs: nodeDefinition.inputs,
            outputs: nodeDefinition.outputs,
            properties: nodeDefinition.properties as any,
            icon: nodeDefinition.icon,
            color: nodeDefinition.color,
            active: true
          }
        });
      }

      // Store in memory registry
      this.nodeRegistry.set(nodeDefinition.type, nodeDefinition);

      logger.info(`Node type registered: ${nodeDefinition.type}`);
      return {
        success: true,
        nodeType: nodeDefinition.type
      };
    } catch (error) {
      logger.error('Failed to register node', { error, nodeType: nodeDefinition.type });
      return {
        success: false,
        errors: [`Failed to register node: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Unregister a node type
   */
  async unregisterNode(nodeType: string): Promise<void> {
    try {
      await this.prisma.nodeType.update({
        where: { type: nodeType },
        data: { active: false }
      });

      this.nodeRegistry.delete(nodeType);
      logger.info(`Node type unregistered: ${nodeType}`);
    } catch (error) {
      logger.error('Failed to unregister node', { error, nodeType });
      throw new Error(`Failed to unregister node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available node types
   */
  async getNodeTypes(): Promise<NodeTypeInfo[]> {
    try {
      const nodeTypes = await this.prisma.nodeType.findMany({
        where: { active: true },
        select: {
          type: true,
          displayName: true,
          name: true,
          description: true,
          group: true,
          version: true,
          defaults: true,
          inputs: true,
          outputs: true,
          properties: true,
          icon: true,
          color: true
        },
        orderBy: { displayName: 'asc' }
      });

      return nodeTypes.map(node => ({
        ...node,
        icon: node.icon || undefined,
        color: node.color || undefined,
        properties: Array.isArray(node.properties) ? node.properties : [],
        defaults: typeof node.defaults === 'object' ? node.defaults : {},
        inputs: Array.isArray(node.inputs) ? node.inputs : ['main'],
        outputs: Array.isArray(node.outputs) ? node.outputs : ['main']
      }));
    } catch (error) {
      logger.error('Failed to get node types', { error });
      throw new Error(`Failed to get node types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get node schema by type
   */
  async getNodeSchema(nodeType: string): Promise<NodeSchema | null> {
    try {
      const node = await this.prisma.nodeType.findUnique({
        where: { type: nodeType, active: true }
      });

      if (!node) {
        return null;
      }

      return {
        type: node.type,
        displayName: node.displayName,
        name: node.name,
        group: node.group,
        version: node.version,
        description: node.description,
        defaults: node.defaults as Record<string, any>,
        inputs: node.inputs,
        outputs: node.outputs,
        properties: (node.properties as unknown) as NodeProperty[],
        icon: node.icon || undefined,
        color: node.color || undefined
      };
    } catch (error) {
      logger.error('Failed to get node schema', { error, nodeType });
      throw new Error(`Failed to get node schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a node securely
   */
  async executeNode(
    nodeType: string,
    parameters: Record<string, any>,
    inputData: NodeInputData,
    credentials?: Record<string, any>,
    executionId?: string,
    options?: SecureExecutionOptions
  ): Promise<NodeExecutionResult> {
    const execId = executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const nodeDefinition = this.nodeRegistry.get(nodeType);
      if (!nodeDefinition) {
        throw new Error(`Node type not found: ${nodeType}`);
      }

      // Validate input data
      const inputValidation = this.secureExecutionService.validateInputData(inputData);
      if (!inputValidation.valid) {
        throw new Error(`Invalid input data: ${inputValidation.errors.join(', ')}`);
      }

      // Create secure execution context
      const credentialIds = credentials ? Object.keys(credentials) : [];
      const context = await this.secureExecutionService.createSecureContext(
        parameters,
        inputValidation.sanitizedData!,
        credentialIds,
        'system',
        execId,
        options
      );

      // Execute the node in secure context
      const result = await nodeDefinition.execute.call(context, inputValidation.sanitizedData!);

      // Validate output data
      const outputValidation = this.secureExecutionService.validateOutputData(result);
      if (!outputValidation.valid) {
        throw new Error(`Invalid output data: ${outputValidation.errors.join(', ')}`);
      }

      // Cleanup execution resources
      await this.secureExecutionService.cleanupExecution(execId);

      return {
        success: true,
        data: outputValidation.sanitizedData as NodeOutputData[]
      };
    } catch (error) {
      logger.error('Secure node execution failed', { error, nodeType, executionId: execId });
      
      // Cleanup execution resources on error
      await this.secureExecutionService.cleanupExecution(execId);
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown execution error',
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Validate node definition
   */
  validateNodeDefinition(definition: NodeDefinition): NodeValidationResult {
    const errors: NodeValidationError[] = [];

    // Required fields validation
    if (!definition.type || typeof definition.type !== 'string') {
      errors.push({ property: 'type', message: 'Node type is required and must be a string' });
    }

    if (!definition.displayName || typeof definition.displayName !== 'string') {
      errors.push({ property: 'displayName', message: 'Display name is required and must be a string' });
    }

    if (!definition.name || typeof definition.name !== 'string') {
      errors.push({ property: 'name', message: 'Name is required and must be a string' });
    }

    if (!Array.isArray(definition.group) || definition.group.length === 0) {
      errors.push({ property: 'group', message: 'Group is required and must be a non-empty array' });
    }

    if (typeof definition.version !== 'number' || definition.version < 1) {
      errors.push({ property: 'version', message: 'Version is required and must be a positive number' });
    }

    if (!definition.description || typeof definition.description !== 'string') {
      errors.push({ property: 'description', message: 'Description is required and must be a string' });
    }

    if (!Array.isArray(definition.inputs)) {
      errors.push({ property: 'inputs', message: 'Inputs must be an array' });
    }

    if (!Array.isArray(definition.outputs)) {
      errors.push({ property: 'outputs', message: 'Outputs must be an array' });
    }

    if (!Array.isArray(definition.properties)) {
      errors.push({ property: 'properties', message: 'Properties must be an array' });
    }

    if (typeof definition.execute !== 'function') {
      errors.push({ property: 'execute', message: 'Execute function is required' });
    }

    // Validate properties
    if (Array.isArray(definition.properties)) {
      definition.properties.forEach((prop, index) => {
        const validation = this.validateNodeProperty(prop);
        if (!validation.valid) {
          validation.errors.forEach(error => {
            errors.push({
              property: `properties[${index}].${error.property}`,
              message: error.message,
              value: error.value
            });
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate node property
   */
  private validateNodeProperty(property: NodeProperty): NodeValidationResult {
    const errors: NodeValidationError[] = [];

    if (!property.displayName || typeof property.displayName !== 'string') {
      errors.push({ property: 'displayName', message: 'Property display name is required' });
    }

    if (!property.name || typeof property.name !== 'string') {
      errors.push({ property: 'name', message: 'Property name is required' });
    }

    const validTypes = ['string', 'number', 'boolean', 'options', 'multiOptions', 'json', 'dateTime', 'collection'];
    if (!validTypes.includes(property.type)) {
      errors.push({ 
        property: 'type', 
        message: `Property type must be one of: ${validTypes.join(', ')}`,
        value: property.type
      });
    }

    // Validate options for option-based types
    if ((property.type === 'options' || property.type === 'multiOptions') && !Array.isArray(property.options)) {
      errors.push({ property: 'options', message: 'Options are required for options/multiOptions type' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create execution context for node execution
   */
  private createExecutionContext(
    parameters: Record<string, any>,
    inputData: NodeInputData,
    credentials?: Record<string, any>
  ): NodeExecutionContext {
    return {
      getNodeParameter: (parameterName: string, itemIndex?: number) => {
        return parameters[parameterName];
      },
      getCredentials: async (type: string) => {
        return credentials?.[type] || {};
      },
      getInputData: (inputName = 'main') => {
        return inputData;
      },
      helpers: {
        request: async (options) => {
          // Basic HTTP request implementation
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(options.url, {
            method: options.method || 'GET',
            headers: options.headers,
            body: options.body ? JSON.stringify(options.body) : undefined
          });
          
          if (options.json !== false) {
            return response.json();
          }
          return response.text();
        },
        requestWithAuthentication: async (credentialType: string, options) => {
          // TODO: Implement authentication logic
          return this.createExecutionContext(parameters, inputData, credentials).helpers.request(options);
        },
        returnJsonArray: (jsonData: any[]) => {
          return { main: jsonData };
        },
        normalizeItems: (items: any[]) => {
          return items.map(item => ({ json: item }));
        }
      },
      logger: {
        debug: (message: string, extra?: any) => logger.debug(message, extra),
        info: (message: string, extra?: any) => logger.info(message, extra),
        warn: (message: string, extra?: any) => logger.warn(message, extra),
        error: (message: string, extra?: any) => logger.error(message, extra)
      }
    };
  }

  /**
   * Initialize built-in nodes
   */
  private async initializeBuiltInNodes(): Promise<void> {
    try {
      // Register built-in nodes
      await this.registerBuiltInNodes();
      logger.info('Built-in nodes initialized');
    } catch (error) {
      logger.error('Failed to initialize built-in nodes', { error });
    }
  }

  /**
   * Register all built-in nodes
   */
  private async registerBuiltInNodes(): Promise<void> {
    // Import trigger nodes
    const { WebhookTriggerNode, ScheduleTriggerNode, ManualTriggerNode } = await import('../nodes/triggers');
    
    const builtInNodes = [
      this.createHttpRequestNode(),
      this.createJsonNode(),
      this.createSetNode(),
      WebhookTriggerNode,
      ScheduleTriggerNode,
      ManualTriggerNode
    ];

    for (const nodeDefinition of builtInNodes) {
      await this.registerNode(nodeDefinition);
    }
  }

  /**
   * Create HTTP Request node definition
   */
  private createHttpRequestNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.HTTP_REQUEST,
      displayName: 'HTTP Request',
      name: 'httpRequest',
      group: ['transform'],
      version: 1,
      description: 'Make HTTP requests to any URL',
      icon: 'fa:globe',
      color: '#2196F3',
      defaults: {
        method: 'GET',
        url: '',
        headers: {},
        body: ''
      },
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          displayName: 'Method',
          name: 'method',
          type: 'options',
          required: true,
          default: 'GET',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'DELETE', value: 'DELETE' },
            { name: 'PATCH', value: 'PATCH' }
          ]
        },
        {
          displayName: 'URL',
          name: 'url',
          type: 'string',
          required: true,
          default: '',
          description: 'The URL to make the request to'
        },
        {
          displayName: 'Headers',
          name: 'headers',
          type: 'json',
          required: false,
          default: '{}',
          description: 'Headers to send with the request'
        },
        {
          displayName: 'Body',
          name: 'body',
          type: 'json',
          required: false,
          default: '',
          description: 'Body data to send with the request',
          displayOptions: {
            show: {
              method: ['POST', 'PUT', 'PATCH']
            }
          }
        }
      ],
      execute: async function(inputData: NodeInputData): Promise<NodeOutputData[]> {
        const method = this.getNodeParameter('method') as string;
        const url = this.getNodeParameter('url') as string;
        const headers = this.getNodeParameter('headers') as Record<string, string> || {};
        const body = this.getNodeParameter('body');

        if (!url) {
          throw new Error('URL is required');
        }

        try {
          const response = await this.helpers.request({
            method: method as any,
            url,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: body && ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
            json: true
          });

          return [{ main: [{ json: response }] }];
        } catch (error) {
          throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
  }

  /**
   * Create JSON node definition
   */
  private createJsonNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.JSON,
      displayName: 'JSON',
      name: 'json',
      group: ['transform'],
      version: 1,
      description: 'Compose a JSON object',
      icon: 'fa:code',
      color: '#FF9800',
      defaults: {
        jsonData: '{}'
      },
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          displayName: 'JSON Data',
          name: 'jsonData',
          type: 'json',
          required: true,
          default: '{}',
          description: 'The JSON data to output'
        }
      ],
      execute: async function(inputData: NodeInputData): Promise<NodeOutputData[]> {
        const jsonData = this.getNodeParameter('jsonData') as string;

        try {
          const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
          return [{ main: [{ json: parsedData }] }];
        } catch (error) {
          throw new Error(`Invalid JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
  }

  /**
   * Create Set node definition
   */
  private createSetNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.SET,
      displayName: 'Set',
      name: 'set',
      group: ['transform'],
      version: 1,
      description: 'Set values on the data',
      icon: 'fa:pen',
      color: '#4CAF50',
      defaults: {
        values: []
      },
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          displayName: 'Values',
          name: 'values',
          type: 'collection',
          required: false,
          default: [],
          description: 'The values to set',
          typeOptions: {
            multipleValues: true,
            multipleValueButtonText: 'Add Value'
          }
        }
      ],
      execute: async function(inputData: NodeInputData): Promise<NodeOutputData[]> {
        const values = this.getNodeParameter('values') as Array<{ name: string; value: any }>;
        const items = inputData.main?.[0] || [{}];

        const outputItems = items.map(item => {
          const newItem = { ...item };
          
          values.forEach(({ name, value }) => {
            if (name) {
              newItem[name] = value;
            }
          });

          return { json: newItem };
        });

        return [{ main: outputItems }];
      }
    };
  }
}