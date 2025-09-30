import { PrismaClient } from "@prisma/client";
import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeInputData,
  NodeOutputData,
  NodeProperty,
  NodeRegistrationResult,
  NodeSchema,
  NodeTypeInfo,
  NodeValidationError,
  NodeValidationResult,
  StandardizedNodeOutput,
} from "../types/node.types";
import { HttpExecutionErrorFactory } from "../utils/errors/HttpExecutionError";
import { logger } from "../utils/logger";
import { RetryHandler } from "../utils/retry/RetryStrategy";
import { ResourceLimitsEnforcer } from "../utils/security/ResourceLimitsEnforcer";
import { UrlSecurityValidator } from "../utils/security/UrlSecurityValidator";
import {
  SecureExecutionOptions,
  SecureExecutionService,
} from "./SecureExecutionService";

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
   * Standardize node output data format for consistent frontend handling
   * All nodes should return data in this format for uniform processing
   */
  private standardizeNodeOutput(
    nodeType: string,
    outputs: NodeOutputData[]
  ): StandardizedNodeOutput {
    // Handle special branching nodes (like IF nodes)
    if (nodeType === "if" && outputs.length > 1) {
      const branches: Record<string, any[]> = {};
      let mainOutput: any[] = [];

      // Extract branch data from IF node format: [{true: [...]}, {false: [...]}]
      outputs.forEach((output) => {
        Object.keys(output).forEach((branchName) => {
          if (branchName !== "main") {
            branches[branchName] = output[branchName] || [];
            // Also add to main output for backward compatibility
            mainOutput = mainOutput.concat(output[branchName] || []);
          }
        });
      });

      return {
        main: mainOutput,
        branches,
        metadata: {
          nodeType,
          outputCount: outputs.length,
          hasMultipleBranches: true,
        },
      };
    }

    // Handle standard nodes with main output: [{main: [{json: data}]}]
    const mainOutput: any[] = [];
    outputs.forEach((output) => {
      if (output.main) {
        mainOutput.push(...output.main);
      }
    });

    return {
      main: mainOutput,
      metadata: {
        nodeType,
        outputCount: outputs.length,
        hasMultipleBranches: false,
      },
    };
  }

  /**
   * Register a new node type
   */
  async registerNode(
    nodeDefinition: NodeDefinition
  ): Promise<NodeRegistrationResult> {
    try {
      // Validate node definition
      const validation = this.validateNodeDefinition(nodeDefinition);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map((e) => e.message),
        };
      }

      // Check if node type already exists
      const existingNode = await this.prisma.nodeType.findUnique({
        where: { type: nodeDefinition.type },
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
            active: true,
          },
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
            active: true,
          },
        });
      }

      // Store in memory registry
      this.nodeRegistry.set(nodeDefinition.type, nodeDefinition);

      logger.info(`Node type registered: ${nodeDefinition.type}`);
      return {
        success: true,
        nodeType: nodeDefinition.type,
      };
    } catch (error) {
      logger.error("Failed to register node", {
        error,
        nodeType: nodeDefinition.type,
      });
      return {
        success: false,
        errors: [
          `Failed to register node: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
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
        data: { active: false },
      });

      this.nodeRegistry.delete(nodeType);
      logger.info(`Node type unregistered: ${nodeType}`);
    } catch (error) {
      logger.error("Failed to unregister node", { error, nodeType });
      throw new Error(
        `Failed to unregister node: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all available node types from in-memory registry (live definitions)
   */
  async getNodeTypes(): Promise<NodeTypeInfo[]> {
    try {
      const nodeTypesFromRegistry: NodeTypeInfo[] = [];

      // First, get live node definitions from in-memory registry
      for (const [nodeType, nodeDefinition] of this.nodeRegistry.entries()) {
        nodeTypesFromRegistry.push({
          type: nodeDefinition.type,
          displayName: nodeDefinition.displayName,
          name: nodeDefinition.name,
          description: nodeDefinition.description,
          group: nodeDefinition.group,
          version: nodeDefinition.version,
          defaults: nodeDefinition.defaults || {},
          inputs: nodeDefinition.inputs,
          outputs: nodeDefinition.outputs,
          properties: nodeDefinition.properties || [],
          icon: nodeDefinition.icon,
          color: nodeDefinition.color,
        });
      }

      // If registry is empty, fallback to database (for built-in nodes that might be stored there)
      if (nodeTypesFromRegistry.length === 0) {
        logger.warn("Node registry is empty, falling back to database");
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
            color: true,
          },
          orderBy: { displayName: "asc" },
        });

        return nodeTypes.map((node) => ({
          ...node,
          icon: node.icon || undefined,
          color: node.color || undefined,
          properties: Array.isArray(node.properties)
            ? (node.properties as unknown as NodeProperty[])
            : [],
          defaults:
            typeof node.defaults === "object" && node.defaults !== null
              ? (node.defaults as Record<string, any>)
              : {},
          inputs: Array.isArray(node.inputs) ? node.inputs : ["main"],
          outputs: Array.isArray(node.outputs) ? node.outputs : ["main"],
        }));
      }

      // Sort by display name
      nodeTypesFromRegistry.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );

      logger.info(
        `Returning ${nodeTypesFromRegistry.length} node types from in-memory registry`
      );
      return nodeTypesFromRegistry;
    } catch (error) {
      logger.error("Failed to get node types", { error });
      throw new Error(
        `Failed to get node types: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get node schema by type from in-memory registry (live definition)
   */
  async getNodeSchema(nodeType: string): Promise<NodeSchema | null> {
    try {
      // First, try to get from in-memory registry
      const nodeDefinition = this.nodeRegistry.get(nodeType);

      if (nodeDefinition) {
        return {
          type: nodeDefinition.type,
          displayName: nodeDefinition.displayName,
          name: nodeDefinition.name,
          group: nodeDefinition.group,
          version: nodeDefinition.version,
          description: nodeDefinition.description,
          defaults: nodeDefinition.defaults || {},
          inputs: nodeDefinition.inputs,
          outputs: nodeDefinition.outputs,
          properties: nodeDefinition.properties || [],
          icon: nodeDefinition.icon,
          color: nodeDefinition.color,
        };
      }

      // Fallback to database if not found in registry
      logger.warn(
        `Node type ${nodeType} not found in registry, checking database`
      );
      const node = await this.prisma.nodeType.findUnique({
        where: { type: nodeType, active: true },
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
        properties: node.properties as unknown as NodeProperty[],
        icon: node.icon || undefined,
        color: node.color || undefined,
      };
    } catch (error) {
      logger.error("Failed to get node schema", { error, nodeType });
      throw new Error(
        `Failed to get node schema: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
    const execId =
      executionId ||
      `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const nodeDefinition = this.nodeRegistry.get(nodeType);
      if (!nodeDefinition) {
        throw new Error(`Node type not found: ${nodeType}`);
      }

      // Validate input data
      const inputValidation =
        this.secureExecutionService.validateInputData(inputData);
      if (!inputValidation.valid) {
        throw new Error(
          `Invalid input data: ${inputValidation.errors.join(", ")}`
        );
      }

      // Create secure execution context
      const credentialIds = credentials ? Object.keys(credentials) : [];
      const context = await this.secureExecutionService.createSecureContext(
        parameters,
        inputValidation.sanitizedData!,
        credentialIds,
        "system",
        execId,
        options
      );

      // Execute the node in secure context
      const result = await nodeDefinition.execute.call(
        context,
        inputValidation.sanitizedData!
      );

      // Validate output data
      const outputValidation =
        this.secureExecutionService.validateOutputData(result);
      if (!outputValidation.valid) {
        throw new Error(
          `Invalid output data: ${outputValidation.errors.join(", ")}`
        );
      }

      // Standardize the output format for consistent frontend handling
      const standardizedOutput = this.standardizeNodeOutput(
        nodeType,
        outputValidation.sanitizedData as NodeOutputData[]
      );

      // Cleanup execution resources
      await this.secureExecutionService.cleanupExecution(execId);

      return {
        success: true,
        data: standardizedOutput,
      };
    } catch (error) {
      logger.error("Secure node execution failed", {
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        nodeType,
        parameters,
        executionId: execId,
      });

      // Cleanup execution resources on error
      await this.secureExecutionService.cleanupExecution(execId);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown execution error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    }
  }

  /**
   * Validate node definition
   */
  validateNodeDefinition(definition: NodeDefinition): NodeValidationResult {
    const errors: NodeValidationError[] = [];

    // Required fields validation
    if (!definition.type || typeof definition.type !== "string") {
      errors.push({
        property: "type",
        message: "Node type is required and must be a string",
      });
    }

    if (!definition.displayName || typeof definition.displayName !== "string") {
      errors.push({
        property: "displayName",
        message: "Display name is required and must be a string",
      });
    }

    if (!definition.name || typeof definition.name !== "string") {
      errors.push({
        property: "name",
        message: "Name is required and must be a string",
      });
    }

    if (!Array.isArray(definition.group) || definition.group.length === 0) {
      errors.push({
        property: "group",
        message: "Group is required and must be a non-empty array",
      });
    }

    if (typeof definition.version !== "number" || definition.version < 1) {
      errors.push({
        property: "version",
        message: "Version is required and must be a positive number",
      });
    }

    if (!definition.description || typeof definition.description !== "string") {
      errors.push({
        property: "description",
        message: "Description is required and must be a string",
      });
    }

    if (!Array.isArray(definition.inputs)) {
      errors.push({ property: "inputs", message: "Inputs must be an array" });
    }

    if (!Array.isArray(definition.outputs)) {
      errors.push({ property: "outputs", message: "Outputs must be an array" });
    }

    if (!Array.isArray(definition.properties)) {
      errors.push({
        property: "properties",
        message: "Properties must be an array",
      });
    }

    if (typeof definition.execute !== "function") {
      errors.push({
        property: "execute",
        message: "Execute function is required",
      });
    }

    // Validate properties
    if (Array.isArray(definition.properties)) {
      definition.properties.forEach((prop, index) => {
        const validation = this.validateNodeProperty(prop);
        if (!validation.valid) {
          validation.errors.forEach((error) => {
            errors.push({
              property: `properties[${index}].${error.property}`,
              message: error.message,
              value: error.value,
            });
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate node property
   */
  private validateNodeProperty(property: NodeProperty): NodeValidationResult {
    const errors: NodeValidationError[] = [];

    if (!property.displayName || typeof property.displayName !== "string") {
      errors.push({
        property: "displayName",
        message: "Property display name is required",
      });
    }

    if (!property.name || typeof property.name !== "string") {
      errors.push({ property: "name", message: "Property name is required" });
    }

    const validTypes = [
      "string",
      "number",
      "boolean",
      "options",
      "multiOptions",
      "json",
      "dateTime",
      "collection",
    ];
    if (!validTypes.includes(property.type)) {
      errors.push({
        property: "type",
        message: `Property type must be one of: ${validTypes.join(", ")}`,
        value: property.type,
      });
    }

    // Validate options for option-based types
    if (
      (property.type === "options" || property.type === "multiOptions") &&
      !Array.isArray(property.options)
    ) {
      errors.push({
        property: "options",
        message: "Options are required for options/multiOptions type",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
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
      getInputData: (inputName = "main") => {
        return inputData;
      },
      helpers: {
        request: async (options) => {
          // Basic HTTP request implementation
          const fetch = (await import("node-fetch")).default;
          const response = await fetch(options.url, {
            method: options.method || "GET",
            headers: options.headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
          });

          if (options.json !== false) {
            return response.json();
          }
          return response.text();
        },
        requestWithAuthentication: async (credentialType: string, options) => {
          // TODO: Implement authentication logic
          return this.createExecutionContext(
            parameters,
            inputData,
            credentials
          ).helpers.request(options);
        },
        returnJsonArray: (jsonData: any[]) => {
          return { main: jsonData };
        },
        normalizeItems: (items: any[]) => {
          return items.map((item) => ({ json: item }));
        },
      },
      logger: {
        debug: (message: string, extra?: any) => logger.debug(message, extra),
        info: (message: string, extra?: any) => logger.info(message, extra),
        warn: (message: string, extra?: any) => logger.warn(message, extra),
        error: (message: string, extra?: any) => logger.error(message, extra),
      },
    };
  }

  /**
   * Initialize built-in nodes
   */
  private async initializeBuiltInNodes(): Promise<void> {
    try {
      // Register built-in nodes
      await this.registerBuiltInNodes();
      logger.info("Built-in nodes initialized");
    } catch (error) {
      logger.error("Failed to initialize built-in nodes", { error });
    }
  }

  /**
   * Register all built-in nodes
   */
  private async registerBuiltInNodes(): Promise<void> {
    // Import trigger nodes
    const { WebhookTriggerNode, ScheduleTriggerNode, ManualTriggerNode } =
      await import("../nodes/triggers");

    // Import core nodes
    const { HttpRequestNode, JsonNode, SetNode, IfNode } =
      await import("../nodes/core");

    const builtInNodes = [
      HttpRequestNode,
      JsonNode,
      SetNode,
      IfNode,
      WebhookTriggerNode,
      ScheduleTriggerNode,
      ManualTriggerNode,
    ];

    for (const nodeDefinition of builtInNodes) {
      await this.registerNode(nodeDefinition);
    }
  }

}
