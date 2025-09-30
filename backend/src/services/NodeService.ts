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
  private standardizeNodeOutput(nodeType: string, outputs: NodeOutputData[]): StandardizedNodeOutput {
    // Handle special branching nodes (like IF nodes)
    if (nodeType === 'if' && outputs.length > 1) {
      const branches: Record<string, any[]> = {};
      let mainOutput: any[] = [];
      
      // Extract branch data from IF node format: [{true: [...]}, {false: [...]}]
      outputs.forEach(output => {
        Object.keys(output).forEach(branchName => {
          if (branchName !== 'main') {
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
          hasMultipleBranches: true
        }
      };
    }

    // Handle standard nodes with main output: [{main: [{json: data}]}]
    const mainOutput: any[] = [];
    outputs.forEach(output => {
      if (output.main) {
        mainOutput.push(...output.main);
      }
    });

    return {
      main: mainOutput,
      metadata: {
        nodeType,
        outputCount: outputs.length,
        hasMultipleBranches: false
      }
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

    const builtInNodes = [
      this.createHttpRequestNode(),
      this.createJsonNode(),
      this.createSetNode(),
      this.createIfNode(),
      WebhookTriggerNode,
      ScheduleTriggerNode,
      ManualTriggerNode,
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
      displayName: "HTTP Request",
      name: "httpRequest",
      group: ["transform"],
      version: 1,
      description: "Make HTTP requests to any URL",
      icon: "fa:globe",
      color: "#2196F3",
      defaults: {
        method: "GET",
        url: "",
        headers: {},
        body: "",
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 5,
      },
      inputs: ["main"],
      outputs: ["main"],
      properties: [
        {
          displayName: "Method",
          name: "method",
          type: "options",
          required: true,
          default: "GET",
          options: [
            { name: "GET", value: "GET" },
            { name: "POST", value: "POST" },
            { name: "PUT", value: "PUT" },
            { name: "DELETE", value: "DELETE" },
            { name: "PATCH", value: "PATCH" },
          ],
        },
        {
          displayName: "URL",
          name: "url",
          type: "string",
          required: true,
          default: "",
          description: "The URL to make the request to",
        },
        {
          displayName: "Headers",
          name: "headers",
          type: "json",
          required: false,
          default: "{}",
          description: "Headers to send with the request",
        },
        {
          displayName: "Body",
          name: "body",
          type: "json",
          required: false,
          default: "",
          description: "Body data to send with the request",
          displayOptions: {
            show: {
              method: ["POST", "PUT", "PATCH"],
            },
          },
        },
        {
          displayName: "Timeout (ms)",
          name: "timeout",
          type: "number",
          required: false,
          default: 30000,
          description: "Request timeout in milliseconds",
        },
        {
          displayName: "Follow Redirects",
          name: "followRedirects",
          type: "boolean",
          required: false,
          default: true,
          description: "Whether to follow HTTP redirects",
        },
        {
          displayName: "Max Redirects",
          name: "maxRedirects",
          type: "number",
          required: false,
          default: 5,
          description: "Maximum number of redirects to follow",
          displayOptions: {
            show: {
              followRedirects: [true],
            },
          },
        },
      ],
      execute: async function (
        inputData: NodeInputData
      ): Promise<NodeOutputData[]> {
        const method = this.getNodeParameter("method") as string;
        const url = this.getNodeParameter("url") as string;
        const headers =
          (this.getNodeParameter("headers") as Record<string, string>) || {};
        const body = this.getNodeParameter("body");
        const timeout = (this.getNodeParameter("timeout") as number) || 30000;
        const followRedirects = this.getNodeParameter(
          "followRedirects"
        ) as boolean;
        const maxRedirects =
          (this.getNodeParameter("maxRedirects") as number) || 5;

        if (!url) {
          throw new Error("URL is required");
        }

        // Parse headers if they're a string
        let parsedHeaders: Record<string, string> = {};
        if (typeof headers === "string") {
          try {
            parsedHeaders = JSON.parse(headers);
          } catch (error) {
            throw new Error("Invalid headers JSON format");
          }
        } else {
          parsedHeaders = headers;
        }

        // Security validation
        const urlValidation = UrlSecurityValidator.validateUrl(url);
        if (!urlValidation.isValid) {
          const errorMessages = urlValidation.errors
            .map((e) => e.message)
            .join("; ");
          this.logger.warn("HTTP Request blocked by security validation", {
            url,
            errors: urlValidation.errors,
            riskLevel: urlValidation.riskLevel,
          });
          throw new Error(`Security validation failed: ${errorMessages}`);
        }

        // Validate request parameters
        const paramValidation = UrlSecurityValidator.validateRequestParameters({
          headers: parsedHeaders,
          body: body,
        });
        if (!paramValidation.isValid) {
          const errorMessages = paramValidation.errors
            .map((e) => e.message)
            .join("; ");
          this.logger.warn(
            "HTTP Request parameters blocked by security validation",
            {
              errors: paramValidation.errors,
              riskLevel: paramValidation.riskLevel,
            }
          );
          throw new Error(`Parameter validation failed: ${errorMessages}`);
        }

        // Check memory limits before execution
        const memoryCheck = ResourceLimitsEnforcer.checkMemoryLimits();
        if (!memoryCheck.isValid) {
          this.logger.warn("HTTP Request blocked due to memory limits", {
            error: memoryCheck.error,
          });
          throw new Error(`Resource limit exceeded: ${memoryCheck.error}`);
        }

        // Use sanitized URL
        const sanitizedUrl = urlValidation.sanitizedUrl || url;

        // Prepare request body
        let requestBody: string | undefined;
        if (body && ["POST", "PUT", "PATCH"].includes(method)) {
          if (typeof body === "string") {
            requestBody = body;
          } else {
            requestBody = JSON.stringify(body);
            // Set content-type if not already set
            if (
              !parsedHeaders["Content-Type"] &&
              !parsedHeaders["content-type"]
            ) {
              parsedHeaders["Content-Type"] = "application/json";
            }
          }

          // Validate request body size
          const bodySize = Buffer.byteLength(requestBody, "utf8");
          const bodySizeCheck =
            ResourceLimitsEnforcer.validateRequestSize(bodySize);
          if (!bodySizeCheck.isValid) {
            this.logger.warn("HTTP Request body size exceeds limits", {
              bodySize,
              error: bodySizeCheck.error,
            });
            throw new Error(`Request body too large: ${bodySizeCheck.error}`);
          }
        }

        // Execute HTTP request with retry logic
        try {
          const result = await RetryHandler.executeWithRetry(
            async () => {
              // Import node-fetch dynamically
              const fetch = (await import("node-fetch")).default;
              const { AbortController } = await import("abort-controller");

              // Create abort controller for timeout handling
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);

              try {
                // Make the actual HTTP request
                const startTime = Date.now();
                const response = await fetch(sanitizedUrl, {
                  method: method as any,
                  headers: parsedHeaders,
                  body: requestBody,
                  signal: controller.signal as any,
                  redirect: followRedirects ? "follow" : "manual",
                  follow: followRedirects ? maxRedirects : 0,
                });

                // Clear timeout
                clearTimeout(timeoutId);

                const responseTime = Date.now() - startTime;

                // Check if response indicates an error that should be retried
                if (!response.ok) {
                  const httpError = HttpExecutionErrorFactory.createFromError(
                    new Error(`HTTP ${response.status} ${response.statusText}`),
                    sanitizedUrl,
                    method,
                    response
                  );
                  throw httpError;
                }

                // Validate response size
                const contentLength = response.headers.get("content-length");
                if (contentLength) {
                  const responseSize = parseInt(contentLength, 10);
                  const responseSizeCheck =
                    ResourceLimitsEnforcer.validateResponseSize(responseSize);
                  if (!responseSizeCheck.isValid) {
                    this.logger.warn("HTTP Response size exceeds limits", {
                      responseSize,
                      error: responseSizeCheck.error,
                    });
                    throw new Error(
                      `Response too large: ${responseSizeCheck.error}`
                    );
                  }
                }

                // Parse response based on content type
                const contentType = response.headers.get("content-type") || "";
                let responseData: any;

                try {
                  if (contentType.includes("application/json")) {
                    responseData = await response.json();
                  } else {
                    responseData = await response.text();
                  }
                } catch (parseError) {
                  const httpError = HttpExecutionErrorFactory.createFromError(
                    parseError,
                    sanitizedUrl,
                    method,
                    response
                  );
                  throw httpError;
                }

                // Create response headers object
                const responseHeaders: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                  responseHeaders[key] = value;
                });

                // Return structured response data
                return {
                  status: response.status,
                  statusText: response.statusText,
                  headers: responseHeaders,
                  data: responseData,
                  responseTime,
                  url: response.url, // Final URL after redirects
                  ok: response.ok,
                };
              } catch (fetchError) {
                clearTimeout(timeoutId);

                // Create structured error
                const httpError = HttpExecutionErrorFactory.createFromError(
                  fetchError,
                  sanitizedUrl,
                  method
                );
                throw httpError;
              }
            },
            {
              maxRetries: 3,
              retryDelay: 1000,
              backoffMultiplier: 2,
              maxRetryDelay: 10000,
            },
            { url: sanitizedUrl, method }
          );

          this.logger.info("HTTP Request completed", {
            method,
            url: sanitizedUrl,
            status: result.status,
            responseTime: result.responseTime,
          });

          return [{ main: [{ json: result }] }];
        } catch (error) {
          // Handle final error after all retries
          const httpError = error as any;

          this.logger.error("HTTP Request failed after retries", {
            method,
            url: sanitizedUrl,
            errorType: httpError.httpErrorType,
            statusCode: httpError.statusCode,
            error: httpError.message,
          });

          // Throw user-friendly error message
          const userMessage =
            HttpExecutionErrorFactory.getUserFriendlyMessage(httpError);
          throw new Error(userMessage);
        }
      },
    };
  }

  /**
   * Create JSON node definition
   */
  private createJsonNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.JSON,
      displayName: "JSON",
      name: "json",
      group: ["transform"],
      version: 1,
      description: "Compose a JSON object",
      icon: "fa:code",
      color: "#FF9800",
      defaults: {
        jsonData: "{}",
      },
      inputs: ["main"],
      outputs: ["main"],
      properties: [
        {
          displayName: "JSON Data",
          name: "jsonData",
          type: "json",
          required: true,
          default: "{}",
          description: "The JSON data to output",
        },
      ],
      execute: async function (
        inputData: NodeInputData
      ): Promise<NodeOutputData[]> {
        const jsonData = this.getNodeParameter("jsonData") as string;

        console.log(
          "----------------------------------------------------------------"
        );
        console.log("JSON Data:", jsonData);
        try {
          const parsedData =
            typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
          return [{ main: [{ json: parsedData }] }];
        } catch (error) {
          throw new Error(
            `Invalid JSON data: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    };
  }

  /**
   * Create Set node definition
   */
  private createSetNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.SET,
      displayName: "Set",
      name: "set",
      group: ["transform"],
      version: 1,
      description: "Set values on the data",
      icon: "S",
      color: "#4CAF50",
      defaults: {
        values: [],
      },
      inputs: ["main"],
      outputs: ["main"],
      properties: [
        {
          displayName: "Values",
          name: "values",
          type: "collection",
          required: false,
          default: [],
          description: "The values to set",
          typeOptions: {
            multipleValues: true,
            multipleValueButtonText: "Add Value",
          },
        },
      ],
      execute: async function (
        inputData: NodeInputData
      ): Promise<NodeOutputData[]> {
        const values = this.getNodeParameter("values") as Array<{
          name: string;
          value: any;
        }>;
        const items = inputData.main?.[0] || [{}];

        const outputItems = items.map((item) => {
          const newItem = { ...item };

          values.forEach(({ name, value }) => {
            if (name) {
              newItem[name] = value;
            }
          });

          return { json: newItem };
        });

        return [{ main: outputItems }];
      },
    };
  }

  /**
   * Create IF node definition for conditional execution
   */
  private createIfNode(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.IF,
      displayName: "IF",
      name: "if",
      group: ["transform"],
      version: 1,
      description: "Route data based on conditional logic",
      icon: "fa:code-branch",
      color: "#9C27B0",
      defaults: {
        value1: "",
        operation: "equal",
        value2: "",
      },
      inputs: ["main"],
      outputs: ["true", "false"],
      properties: [
        {
          displayName: "Value 1",
          name: "value1",
          type: "string",
          required: true,
          default: "",
          description:
            "First value to compare. Use {{json.fieldName}} to reference input data. Available fields will be shown in execution logs.",
        },
        {
          displayName: "Operation",
          name: "operation",
          type: "options",
          required: true,
          default: "equal",
          options: [
            { name: "Equal", value: "equal" },
            { name: "Not Equal", value: "notEqual" },
            { name: "Larger", value: "larger" },
            { name: "Larger Equal", value: "largerEqual" },
            { name: "Smaller", value: "smaller" },
            { name: "Smaller Equal", value: "smallerEqual" },
            { name: "Contains", value: "contains" },
            { name: "Not Contains", value: "notContains" },
            { name: "Starts With", value: "startsWith" },
            { name: "Ends With", value: "endsWith" },
            { name: "Is Empty", value: "isEmpty" },
            { name: "Is Not Empty", value: "isNotEmpty" },
            { name: "Regex", value: "regex" },
          ],
        },
        {
          displayName: "Value 2",
          name: "value2",
          type: "string",
          required: false,
          default: "",
          description:
            "Second value to compare (not needed for isEmpty/isNotEmpty). Use {{json.fieldName}} to reference input data. Available fields will be shown in execution logs.",
          displayOptions: {
            hide: {
              operation: ["isEmpty", "isNotEmpty"],
            },
          },
        },
      ],
      execute: async function (
        inputData: NodeInputData
      ): Promise<NodeOutputData[]> {
        console.log(
          "----------------------------------------------------------------"
        );
        console.log("inputData:", JSON.stringify(inputData, null, 2));
        console.log("inputData.main:", inputData.main);
        console.log("typeof inputData.main:", typeof inputData.main);
        console.log("Array.isArray(inputData.main):", Array.isArray(inputData.main));
        if (inputData.main && inputData.main.length > 0) {
          console.log("inputData.main[0]:", inputData.main[0]);
          console.log("typeof inputData.main[0]:", typeof inputData.main[0]);
          console.log("Array.isArray(inputData.main[0]):", Array.isArray(inputData.main[0]));
        }

        const value1 = this.getNodeParameter("value1") as string;
        const operation = this.getNodeParameter("operation") as string;
        const value2 = this.getNodeParameter("value2") as string;

        // inputData.main is the array of items to process
        let items = inputData.main || [];
        console.log("Raw items from inputData.main:", JSON.stringify(items, null, 2));
        
        // Handle different input structures
        if (items.length === 1 && items[0] && Array.isArray(items[0])) {
          // If items is wrapped in an extra array layer: [[{json: {...}}, {json: {...}}]]
          items = items[0];
          console.log("Unwrapped items from nested array:", JSON.stringify(items, null, 2));
        }
        
        // Extract actual data objects from the json wrappers if needed
        const processedItems = items.map((item: any) => {
          if (item && typeof item === 'object' && 'json' in item) {
            return item.json; // Extract the actual data from {json: {...}}
          }
          return item; // Use item directly if it's already the data object
        });
        
        console.log("Final processed items for IF evaluation:", JSON.stringify(processedItems, null, 2));
        console.log("Number of items to process:", processedItems.length);
        const trueItems: any[] = [];
        const falseItems: any[] = [];

        // Helper function to resolve values with placeholders
        const resolveValue = (value: string, item: any): any => {
          if (typeof value !== "string") {
            return value;
          }

          // Replace placeholders like {{json.fieldName}}
          return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            console.log(
              `[IF Node Debug] Trying to resolve placeholder: ${match}`
            );
            console.log(`[IF Node Debug] Path: ${path}`);

            const parts = path.split(".");
            let result = item;
            let currentPath = "";

            // Skip 'json' prefix if it exists, since we already extracted the json data
            let startIndex = 0;
            if (parts[0] === 'json') {
              startIndex = 1;
              console.log(`[IF Node Debug] Skipping 'json' prefix, starting from: ${parts[1]}`);
            }

            for (let i = startIndex; i < parts.length; i++) {
              const part = parts[i];
              currentPath += (currentPath ? "." : "") + part;
              console.log(
                `[IF Node Debug] Accessing: ${currentPath}, Current result:`,
                result
              );

              if (result && typeof result === "object" && part in result) {
                result = result[part];
                console.log(`[IF Node Debug] Found ${part}:`, result);
              } else {
                console.log(
                  `[IF Node Debug] Could not find ${part} in:`,
                  result
                );
                console.log(
                  `[IF Node Debug] Available keys:`,
                  result && typeof result === "object"
                    ? Object.keys(result)
                    : "N/A"
                );
                return match; // Return original if path not found
              }
            }

            const finalResult = result !== undefined ? String(result) : match;
            console.log(
              `[IF Node Debug] Final resolved value for ${match}: "${finalResult}"`
            );
            return finalResult;
          });
        };

        // Helper function to evaluate individual conditions
        const evaluateCondition = (
          value1: any,
          operation: string,
          value2: any
        ): boolean => {
          // Convert values to appropriate types for comparison
          const val1 = String(value1);
          const val2 = String(value2);

          switch (operation) {
            case "equal":
              return val1 === val2;

            case "notEqual":
              return val1 !== val2;

            case "larger":
              return Number(val1) > Number(val2);

            case "largerEqual":
              return Number(val1) >= Number(val2);

            case "smaller":
              return Number(val1) < Number(val2);

            case "smallerEqual":
              return Number(val1) <= Number(val2);

            case "contains":
              return val1.includes(val2);

            case "notContains":
              return !val1.includes(val2);

            case "startsWith":
              return val1.startsWith(val2);

            case "endsWith":
              return val1.endsWith(val2);

            case "isEmpty":
              return !val1 || val1.trim() === "";

            case "isNotEmpty":
              return !!(val1 && val1.trim() !== "");

            case "regex":
              try {
                const regex = new RegExp(val2);
                return regex.test(val1);
              } catch (error) {
                throw new Error(`Invalid regex pattern: ${val2}`);
              }

            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
        };

        for (const item of processedItems) {
          // Ensure item exists and has the expected structure
          if (!item || typeof item !== 'object') {
            console.log(`[IF Node Debug] Skipping invalid item:`, item);
            continue;
          }

          // Debug: Log available fields in the item
          const availableFields = item ? Object.keys(item) : [];
          console.log(
            `[IF Node Debug] Item fields available:`,
            availableFields
          );
          console.log(
            `[IF Node Debug] Full item structure:`,
            JSON.stringify(item, null, 2)
          );

          // Replace placeholders in values with actual data from item
          const resolvedValue1 = resolveValue(value1, item);
          const resolvedValue2 = resolveValue(value2, item);

          // Debug: Log resolution process
          console.log(
            `[IF Node Debug] Original value1: "${value1}" → Resolved: "${resolvedValue1}"`
          );
          console.log(
            `[IF Node Debug] Original value2: "${value2}" → Resolved: "${resolvedValue2}"`
          );
          console.log(`[IF Node Debug] Operation: ${operation}`);

          const conditionResult = evaluateCondition(
            resolvedValue1,
            operation,
            resolvedValue2
          );

          console.log(`[IF Node Debug] Condition result: ${conditionResult}`);

          // Wrap the item back in the expected format for output
          const wrappedItem = { json: item };

          if (conditionResult) {
            trueItems.push(wrappedItem);
          } else {
            falseItems.push(wrappedItem);
          }
        }

        console.log(`[IF Node Debug] Final results:`);
        console.log(`[IF Node Debug] - True items: ${trueItems.length}`);
        console.log(`[IF Node Debug] - False items: ${falseItems.length}`);
        console.log(
          `[IF Node Debug] - True items data:`,
          JSON.stringify(trueItems, null, 2)
        );
        console.log(
          `[IF Node Debug] - False items data:`,
          JSON.stringify(falseItems, null, 2)
        );

        // Always return both outputs - the workflow execution engine will handle empty branches
        const result: NodeOutputData[] = [
          { true: trueItems },
          { false: falseItems }
        ];
        
        console.log(`[IF Node Debug] Returning both outputs - true: ${trueItems.length} items, false: ${falseItems.length} items`);
        console.log(`[IF Node Debug] Complete result structure:`, JSON.stringify(result, null, 2));
        console.log(`[IF Node Debug] Result array length:`, result.length);
        console.log(`[IF Node Debug] Result[0] keys:`, Object.keys(result[0]));
        console.log(`[IF Node Debug] Result[1] keys:`, Object.keys(result[1]));
        return result;
      },
    };
  }
}
