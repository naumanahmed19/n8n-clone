import { PrismaClient } from "@prisma/client";
import ivm from "isolated-vm";
import {
  NodeExecutionContext,
  NodeHelpers,
  NodeInputData,
  NodeLogger,
  NodeOutputData,
  RequestOptions,
} from "../types/node.types";
import { logger } from "../utils/logger";
import {
  extractJsonData,
  normalizeInputItems,
  resolvePath,
  resolveValue,
  wrapJsonData,
} from "../utils/nodeHelpers";
import { CredentialService } from "./CredentialService";

import { VariableService } from "./VariableService";

export interface SecureExecutionOptions {
  timeout?: number;
  memoryLimit?: number;
  allowedModules?: string[];
  maxOutputSize?: number;
  maxRequestTimeout?: number;
  maxConcurrentRequests?: number;
}

export interface CredentialData {
  [key: string]: any;
}

export interface ExecutionLimits {
  timeout: number;
  memoryLimit: number;
  maxOutputSize: number;
  maxRequestTimeout: number;
  maxConcurrentRequests: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class SecureExecutionService {
  private prisma: PrismaClient;
  private credentialService: CredentialService;
  private variableService: VariableService;
  private defaultLimits: ExecutionLimits;
  private activeRequests: Map<string, number>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.credentialService = new CredentialService();
    this.variableService = new VariableService();
    this.activeRequests = new Map();

    // Set default security limits
    this.defaultLimits = {
      timeout: 30000, // 30 seconds
      memoryLimit: 128 * 1024 * 1024, // 128MB
      maxOutputSize: 10 * 1024 * 1024, // 10MB
      maxRequestTimeout: 30000, // 30 seconds
      maxConcurrentRequests: 5,
    };
  }

  /**
   * Execute JavaScript code in a secure isolated-vm sandbox
   */
  async executeInSandbox(
    code: string,
    context: Record<string, any>,
    options: SecureExecutionOptions = {}
  ): Promise<any> {
    const limits = this.mergeLimits(options);
    let isolate: ivm.Isolate | null = null;

    try {
      // Create isolated VM with memory limit
      isolate = new ivm.Isolate({
        memoryLimit: Math.floor(limits.memoryLimit / (1024 * 1024)), // Convert to MB
        inspector: false, // Disable debugging
      });

      // Create context within the isolate
      const vmContext = await isolate.createContext();
      const jail = vmContext.global;

      // Note: Console is not available in the sandbox for security

      // Add context variables securely
      for (const [key, value] of Object.entries(context)) {
        if (this.isSafeContextValue(key, value)) {
          await jail.set(key, new ivm.ExternalCopy(value).copyInto());
        }
      }

      // Wrap code to return result and handle errors
      const wrappedCode = `
        (function() {
          try {
            const result = (function() {
              ${code}
            })();
            return { success: true, result: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })()
      `;

      // Compile and run the script with timeout
      const script = await isolate.compileScript(wrappedCode);
      const result = await script.run(vmContext, {
        timeout: limits.timeout,
        copy: true,
      });

      // Check if execution was successful
      if (!result.success) {
        throw new Error(result.error || "Script execution failed");
      }

      // Validate output size
      const outputSize = this.calculateObjectSize(result.result);
      if (outputSize > limits.maxOutputSize) {
        throw new Error(`Output size limit exceeded: ${outputSize} bytes`);
      }

      return result.result;
    } catch (error) {
      logger.error("Sandbox execution failed:", error);
      throw new Error(
        `Sandbox execution failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Clean up isolate
      if (isolate) {
        isolate.dispose();
      }
    }
  }

  /**
   * Create secure execution context with credential injection
   */
  async createSecureContext(
    parameters: Record<string, any>,
    inputData: NodeInputData,
    credentialIds: string[] | Record<string, string> = [],
    userId: string,
    executionId: string,
    options: SecureExecutionOptions = {},
    workflowId?: string,
    settings?: Record<string, any>
  ): Promise<NodeExecutionContext> {
    const limits = this.mergeLimits(options);

    // Convert credentialIds to a mapping object if it's an array
    const credentialsMapping: Record<string, string> = Array.isArray(
      credentialIds
    )
      ? {} // Empty mapping if array (legacy format)
      : credentialIds; // Use the mapping directly

    return {
      settings: settings || {}, // Node settings from Settings tab
      getNodeParameter: async (parameterName: string, itemIndex?: number) => {
        // Validate parameter access
        if (typeof parameterName !== "string") {
          throw new Error("Parameter name must be a string");
        }

        let value = parameters[parameterName];
        value = this.sanitizeValue(value);

        // Debug logging
        logger.info("getNodeParameter called", {
          parameterName,
          originalValue: value,
          valueType: typeof value,
          userId,
          workflowId,
        });

        // Resolve variables ($vars and $local) if value contains them
        // Support both: $local.key and {{$local.key}}
        if (
          typeof value === "string" &&
          (value.includes("$vars") || value.includes("$local"))
        ) {
          logger.info("Variable detected in parameter, resolving...", {
            parameterName,
            value,
          });

          try {
            // First, replace variables in the text (handles both wrapped and unwrapped)
            let resolvedValue =
              await this.variableService.replaceVariablesInText(
                value,
                userId,
                workflowId
              );

            logger.info("After variable text replacement", {
              parameterName,
              originalValue: value,
              afterReplacement: resolvedValue,
            });

            // If the entire value is just {{resolved_value}}, unwrap it
            // This handles cases like {{$local.apiUrl}} -> {{https://...}} -> https://...
            const wrappedMatch = resolvedValue.match(/^\{\{(.+)\}\}$/);
            if (wrappedMatch) {
              logger.info("Detected wrapped value, checking if should unwrap", {
                parameterName,
                wrappedValue: resolvedValue,
                innerContent: wrappedMatch[1],
              });

              // Check if the content is just a simple value (no operators or functions)
              const innerContent = wrappedMatch[1].trim();
              // Check for n8n expression syntax patterns (but not URL slashes)
              // Allow simple values and URLs to be unwrapped
              const hasExpressionSyntax =
                /[+\-*%()[\]<>=!&|]/.test(innerContent) ||
                innerContent.includes("{{") ||
                innerContent.includes("json.") ||
                innerContent.includes("$item") ||
                innerContent.includes("$node") ||
                innerContent.includes("$workflow");

              if (!hasExpressionSyntax) {
                logger.info("Unwrapping simple value", {
                  parameterName,
                  before: resolvedValue,
                  after: innerContent,
                });
                resolvedValue = innerContent;
              } else {
                logger.info(
                  "Keeping wrapped value (contains expression syntax)",
                  {
                    parameterName,
                    value: resolvedValue,
                  }
                );
              }
            }

            logger.info("Variable resolved successfully", {
              parameterName,
              originalValue: value,
              resolvedValue,
            });

            value = resolvedValue;
          } catch (error) {
            logger.warn("Failed to resolve variables in parameter", {
              parameterName,
              originalValue: value,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            // Continue with original value if variable resolution fails
          }
        }

        // Also unwrap simple {{value}} patterns even without variables
        // This handles cases where variables were already resolved: {{https://...}} -> https://...
        if (
          typeof value === "string" &&
          !value.includes("$vars") &&
          !value.includes("$local")
        ) {
          const wrappedMatch = value.match(/^\{\{(.+)\}\}$/);
          if (wrappedMatch) {
            const innerContent = wrappedMatch[1].trim();
            // Check for n8n expression syntax patterns (but not URL slashes)
            const hasExpressionSyntax =
              /[+\-*%()[\]<>=!&|]/.test(innerContent) ||
              innerContent.includes("{{") ||
              innerContent.includes("json.") ||
              innerContent.includes("$item") ||
              innerContent.includes("$node") ||
              innerContent.includes("$workflow");

            if (!hasExpressionSyntax) {
              logger.info("Unwrapping simple wrapped value (non-variable)", {
                parameterName,
                before: value,
                after: innerContent,
              });
              value = innerContent;
            }
          }
        }

        // Auto-resolve placeholders if value is a string with {{...}} patterns
        // This now runs AFTER variable resolution
        if (typeof value === "string" && value.includes("{{")) {
          // Normalize and extract input items
          const items = normalizeInputItems(inputData.main || []);
          const processedItems = extractJsonData(items);

          if (processedItems.length > 0) {
            // Use specified itemIndex or default to first item (0)
            const targetIndex = itemIndex ?? 0;
            const itemToUse = processedItems[targetIndex];

            if (itemToUse) {
              return resolveValue(value, itemToUse);
            }
          }
        }

        return value;
      },

      getCredentials: async (type: string) => {
        // Validate credential type
        if (typeof type !== "string") {
          throw new Error("Credential type must be a string");
        }

        // Use the credentials mapping to find the credential ID for this type
        const credentialId = credentialsMapping[type];
        if (!credentialId) {
          console.error(`No credential found for type '${type}'`, {
            requestedType: type,
            availableCredentials: credentialsMapping,
          });
          throw new Error(`No credential of type '${type}' available`);
        }

        // Inject credentials securely
        const credential = await this.injectCredentials(
          credentialId,
          userId,
          executionId
        );
        return this.sanitizeCredentials(credential);
      },

      getInputData: (inputName = "main") => {
        // Validate and sanitize input data
        const validation = this.validateInputData(inputData);
        if (!validation.valid) {
          throw new Error(
            `Invalid input data: ${validation.errors.join(", ")}`
          );
        }

        return validation.sanitizedData;
      },

      helpers: this.createSecureHelpers(
        limits,
        executionId,
        Array.isArray(credentialIds)
          ? credentialIds
          : Object.values(credentialsMapping),
        userId
      ),
      logger: this.createSecureLogger(executionId),
      // Utility functions for common node operations
      resolveValue,
      resolvePath,
      extractJsonData,
      wrapJsonData,
      normalizeInputItems,
    };
  }

  /**
   * Validate input data
   */
  public validateInputData(inputData: NodeInputData): ValidationResult {
    const errors: string[] = [];

    try {
      // Check if inputData is an object
      if (!inputData || typeof inputData !== "object") {
        errors.push("Input data must be an object");
        return { valid: false, errors };
      }

      // Validate main input
      if (inputData.main && !Array.isArray(inputData.main)) {
        errors.push("Main input must be an array");
      }

      // Check for dangerous properties
      const dangerousProps = ["__proto__", "constructor", "prototype"];
      for (const prop of dangerousProps) {
        if (Object.prototype.hasOwnProperty.call(inputData, prop)) {
          errors.push(`Dangerous property detected: ${prop}`);
        }
      }

      // Sanitize data
      const sanitizedData = this.deepSanitize(inputData);

      return {
        valid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { valid: false, errors };
    }
  }

  /**
   * Validate output data
   */
  public validateOutputData(outputData: NodeOutputData[]): ValidationResult {
    const errors: string[] = [];

    try {
      if (!Array.isArray(outputData)) {
        errors.push("Output data must be an array");
        return { valid: false, errors };
      }

      // Validate each output item
      for (let i = 0; i < outputData.length; i++) {
        const item = outputData[i];

        if (!item || typeof item !== "object") {
          errors.push(`Output item ${i} must be an object`);
          continue;
        }

        // Check for dangerous properties
        const dangerousProps = ["__proto__", "constructor", "prototype"];
        for (const prop of dangerousProps) {
          if (Object.prototype.hasOwnProperty.call(item, prop)) {
            errors.push(
              `Dangerous property detected in output item ${i}: ${prop}`
            );
          }
        }
      }

      // Sanitize output data
      const sanitizedData = this.deepSanitize(outputData);

      return {
        valid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizedData : undefined,
      };
    } catch (error) {
      errors.push(
        `Output validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { valid: false, errors };
    }
  }

  /**
   * Inject credentials securely
   */
  private async injectCredentials(
    credentialId: string,
    userId: string,
    executionId: string
  ): Promise<any> {
    try {
      // Log credential access for audit
      logger.info(`Credential access: ${credentialId}`, {
        executionId,
        credentialId,
        userId,
      });

      // Get credential from secure storage using CredentialService
      const credentialData =
        await this.credentialService.getCredentialForExecution(
          credentialId,
          userId
        );

      return credentialData;
    } catch (error) {
      logger.error("Credential injection failed:", {
        error,
        credentialId,
        executionId,
      });
      throw new Error(
        `Failed to inject credentials: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create secure helpers with resource limits
   */
  private createSecureHelpers(
    limits: ExecutionLimits,
    executionId: string,
    credentialIds: string[] = [],
    userId: string
  ): NodeHelpers {
    return {
      request: async (options: RequestOptions) => {
        return this.makeSecureRequest(options, limits, executionId);
      },

      requestWithAuthentication: async (
        credentialType: string,
        options: RequestOptions
      ) => {
        // Find credential for the requested type
        // This is a simplified implementation - in practice, you'd need to map credential types to IDs
        const credentialId = credentialIds[0]; // Simplified - use first available credential
        if (!credentialId) {
          throw new Error(
            `No credential available for type: ${credentialType}`
          );
        }

        try {
          const credentialData =
            await this.credentialService.getCredentialForExecution(
              credentialId,
              userId
            );

          // Apply authentication to request based on credential type
          const authenticatedOptions = this.applyAuthentication(
            options,
            credentialType,
            credentialData
          );
          return this.makeSecureRequest(
            authenticatedOptions,
            limits,
            executionId
          );
        } catch (error) {
          logger.error("Authenticated request failed:", {
            error,
            credentialType,
            executionId,
          });
          throw new Error(
            `Authentication failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },

      returnJsonArray: (jsonData: any[]) => {
        if (!Array.isArray(jsonData)) {
          throw new Error("Data must be an array");
        }

        const sanitized = this.deepSanitize(jsonData);
        return { main: sanitized };
      },

      normalizeItems: (items: any[]) => {
        if (!Array.isArray(items)) {
          throw new Error("Items must be an array");
        }

        return items.map((item) => ({ json: this.sanitizeValue(item) }));
      },
    };
  }

  /**
   * Make secure HTTP request with limits
   */
  private async makeSecureRequest(
    options: RequestOptions,
    limits: ExecutionLimits,
    executionId: string
  ): Promise<any> {
    // Check concurrent request limit
    const currentRequests = this.activeRequests.get(executionId) || 0;
    if (currentRequests >= limits.maxConcurrentRequests) {
      throw new Error(
        `Maximum concurrent requests exceeded: ${limits.maxConcurrentRequests}`
      );
    }

    // Validate URL
    if (!options.url || typeof options.url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    // Block dangerous URLs
    if (this.isDangerousUrl(options.url)) {
      throw new Error("URL is not allowed");
    }

    // Increment active request counter
    this.activeRequests.set(executionId, currentRequests + 1);

    try {
      const fetch = (await import("node-fetch")).default;
      const controller = new AbortController();

      // Set timeout
      const timeout = Math.min(
        options.timeout || limits.maxRequestTimeout,
        limits.maxRequestTimeout
      );
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(options.url, {
        method: options.method || "GET",
        headers: this.sanitizeHeaders(options.headers || {}),
        body: options.body
          ? JSON.stringify(this.sanitizeValue(options.body))
          : undefined,
        signal: controller.signal,
        follow: options.followRedirect !== false ? 10 : 0,
        size: limits.maxOutputSize, // Limit response size
      });

      clearTimeout(timeoutId);

      // Check response status
      if (!response.ok && !options.ignoreHttpStatusErrors) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      let result;
      if (options.json !== false) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      // Validate response size
      const responseSize = this.calculateObjectSize(result);
      if (responseSize > limits.maxOutputSize) {
        throw new Error(`Response size limit exceeded: ${responseSize} bytes`);
      }

      return this.sanitizeValue(result);
    } catch (error) {
      logger.error("Secure request failed:", {
        error,
        url: options.url,
        executionId,
      });
      throw error;
    } finally {
      // Decrement active request counter
      const currentRequests = this.activeRequests.get(executionId) || 0;
      this.activeRequests.set(executionId, Math.max(0, currentRequests - 1));
    }
  }

  /**
   * Create secure logger
   */
  private createSecureLogger(executionId: string): NodeLogger {
    return {
      debug: (message: string, extra?: any) => {
        logger.debug(`[${executionId}] ${message}`, this.sanitizeValue(extra));
      },
      info: (message: string, extra?: any) => {
        logger.info(`[${executionId}] ${message}`, this.sanitizeValue(extra));
      },
      warn: (message: string, extra?: any) => {
        logger.warn(`[${executionId}] ${message}`, this.sanitizeValue(extra));
      },
      error: (message: string, extra?: any) => {
        logger.error(`[${executionId}] ${message}`, this.sanitizeValue(extra));
      },
    };
  }

  /**
   * Create secure console for VM sandbox
   */
  private createSecureConsole() {
    return {
      log: (...args: any[]) => {
        logger.debug(
          "Sandbox console.log:",
          args.map((arg) => this.sanitizeValue(arg))
        );
      },
      error: (...args: any[]) => {
        logger.error(
          "Sandbox console.error:",
          args.map((arg) => this.sanitizeValue(arg))
        );
      },
      warn: (...args: any[]) => {
        logger.warn(
          "Sandbox console.warn:",
          args.map((arg) => this.sanitizeValue(arg))
        );
      },
      info: (...args: any[]) => {
        logger.info(
          "Sandbox console.info:",
          args.map((arg) => this.sanitizeValue(arg))
        );
      },
    };
  }

  /**
   * Deep sanitize object to remove dangerous properties
   */
  private deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (
      typeof obj === "string" ||
      typeof obj === "number" ||
      typeof obj === "boolean"
    ) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    }

    if (typeof obj === "object") {
      const sanitized: any = {};
      const dangerousProps = ["__proto__", "constructor", "prototype"];

      for (const [key, value] of Object.entries(obj)) {
        if (!dangerousProps.includes(key)) {
          sanitized[key] = this.deepSanitize(value);
        }
      }

      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize a single value
   */
  private sanitizeValue(value: any): any {
    return this.deepSanitize(value);
  }

  /**
   * Sanitize credentials
   */
  private sanitizeCredentials(credentials: any): any {
    if (!credentials || typeof credentials !== "object") {
      return credentials;
    }

    // Remove sensitive fields that shouldn't be exposed
    const sensitiveFields = ["password", "secret", "key", "token", "private"];
    const sanitized = { ...credentials };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        // Keep the credential but mark it as sanitized for logging
        sanitized[`${field}_sanitized`] = "[REDACTED]";
      }
    }

    return this.deepSanitize(sanitized);
  }

  /**
   * Sanitize HTTP headers
   */
  private sanitizeHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      "content-type",
      "accept",
      "user-agent",
      "authorization",
      "x-api-key",
      "x-custom-header",
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey) || lowerKey.startsWith("x-")) {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Check if URL is dangerous
   */
  private isDangerousUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // Block local/private networks
      const hostname = parsedUrl.hostname.toLowerCase();
      const dangerousHosts = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.20.",
        "172.21.",
        "172.22.",
        "172.23.",
        "172.24.",
        "172.25.",
        "172.26.",
        "172.27.",
        "172.28.",
        "172.29.",
        "172.30.",
        "172.31.",
        "192.168.",
      ];

      for (const dangerous of dangerousHosts) {
        if (hostname === dangerous || hostname.startsWith(dangerous)) {
          return true;
        }
      }

      // Block non-HTTP protocols
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return true;
      }

      return false;
    } catch {
      return true; // Invalid URL is dangerous
    }
  }

  /**
   * Calculate approximate object size in bytes
   */
  private calculateObjectSize(obj: any): number {
    try {
      const jsonString = JSON.stringify(obj);
      if (jsonString === undefined) {
        return 0;
      }
      return Buffer.byteLength(jsonString, "utf8");
    } catch (error) {
      // If JSON.stringify fails, estimate size
      return String(obj).length * 2; // Rough estimate for UTF-8
    }
  }

  /**
   * Merge execution limits with defaults
   */
  private mergeLimits(options: SecureExecutionOptions): ExecutionLimits {
    return {
      timeout: options.timeout || this.defaultLimits.timeout,
      memoryLimit: options.memoryLimit || this.defaultLimits.memoryLimit,
      maxOutputSize: options.maxOutputSize || this.defaultLimits.maxOutputSize,
      maxRequestTimeout:
        options.maxRequestTimeout || this.defaultLimits.maxRequestTimeout,
      maxConcurrentRequests:
        options.maxConcurrentRequests ||
        this.defaultLimits.maxConcurrentRequests,
    };
  }

  /**
   * Check if a context value is safe to pass to the sandbox
   */
  private isSafeContextValue(key: string, value: any): boolean {
    // Block dangerous keys
    const dangerousKeys = [
      "process",
      "global",
      "require",
      "Buffer",
      "__dirname",
      "__filename",
      "setTimeout",
      "setInterval",
      "setImmediate",
      "clearTimeout",
      "clearInterval",
    ];

    if (dangerousKeys.includes(key)) {
      return false;
    }

    // Only allow primitive types and plain objects
    const type = typeof value;
    if (type === "function") {
      return false;
    }

    if (type === "object" && value !== null) {
      // Check for dangerous object types
      if (value instanceof Buffer || value instanceof Function) {
        return false;
      }

      // Only allow plain objects and arrays
      const constructor = value.constructor;
      if (constructor !== Object && constructor !== Array) {
        return false;
      }
    }

    return true;
  }

  /**
   * Cleanup resources for execution
   */
  async cleanupExecution(executionId: string): Promise<void> {
    this.activeRequests.delete(executionId);
  }

  /**
   * Apply authentication to request options based on credential type
   */
  private applyAuthentication(
    options: RequestOptions,
    credentialType: string,
    credentialData: any
  ): RequestOptions {
    const authenticatedOptions = { ...options };
    authenticatedOptions.headers = { ...options.headers };

    switch (credentialType) {
      case "httpBasicAuth":
        if (credentialData.username && credentialData.password) {
          const auth = Buffer.from(
            `${credentialData.username}:${credentialData.password}`
          ).toString("base64");
          authenticatedOptions.headers["Authorization"] = `Basic ${auth}`;
        }
        break;

      case "apiKey":
        if (credentialData.apiKey) {
          const headerName = credentialData.headerName || "Authorization";
          authenticatedOptions.headers[headerName] = credentialData.apiKey;
        }
        break;

      case "oauth2":
        if (credentialData.accessToken) {
          authenticatedOptions.headers[
            "Authorization"
          ] = `Bearer ${credentialData.accessToken}`;
        }
        break;

      default:
        throw new Error(
          `Unsupported credential type for authentication: ${credentialType}`
        );
    }

    return authenticatedOptions;
  }
}
