import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import ExecutionHistoryService from "./ExecutionHistoryService";
import {
  FlowExecutionEngine,
  FlowExecutionResult,
} from "./FlowExecutionEngine";
import { NodeService } from "./NodeService";
import { SocketService } from "./SocketService";
import {
  TriggerExecutionContext,
  TriggerExecutionContextFactory,
  TriggerExecutionOptions,
  TriggerImpactAnalyzer,
  TriggerResourceManager,
} from "./TriggerExecutionContext";

export interface TriggerExecutionRequest {
  triggerId: string;
  triggerType: "webhook" | "schedule" | "manual" | "workflow-called";
  workflowId: string;
  userId: string;
  triggerNodeId: string;
  triggerData?: any;
  options?: TriggerExecutionOptions;
}

export interface TriggerExecutionInfo {
  executionId: string;
  triggerId: string;
  triggerType: string;
  workflowId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  startTime: number;
  endTime?: number;
  priority: number;
  affectedNodes: string[];
  isolationScore: number;
}

export interface ConcurrencyConfig {
  maxConcurrentTriggers: number;
  maxConcurrentPerWorkflow: number;
  maxConcurrentPerUser: number;
  enableResourceSharing: boolean;
  priorityQueuing: boolean;
  isolatedExecutionDefault: boolean;
}

export interface ConflictResolutionStrategy {
  type: "queue" | "reject" | "merge" | "priority";
  options?: {
    maxQueueSize?: number;
    queueTimeout?: number;
    mergeStrategy?: "latest" | "combined";
  };
}

/**
 * TriggerManager coordinates multiple concurrent trigger executions
 * and handles resource sharing and conflict resolution
 */
export class TriggerManager extends EventEmitter {
  private prisma: PrismaClient;
  private flowExecutionEngine: FlowExecutionEngine;
  private socketService: SocketService;
  private resourceManager: TriggerResourceManager;

  private activeTriggers: Map<string, TriggerExecutionContext> = new Map();
  private queuedTriggers: TriggerExecutionContext[] = [];
  private completedTriggers: Map<string, TriggerExecutionInfo> = new Map();

  private config: ConcurrencyConfig;
  private conflictStrategy: ConflictResolutionStrategy;

  constructor(
    prisma: PrismaClient,
    nodeService: NodeService,
    executionHistoryService: ExecutionHistoryService,
    socketService: SocketService,
    config: Partial<ConcurrencyConfig> = {},
    conflictStrategy: ConflictResolutionStrategy = { type: "queue" }
  ) {
    super();
    this.prisma = prisma;
    this.flowExecutionEngine = new FlowExecutionEngine(
      prisma,
      nodeService,
      executionHistoryService
    );
    this.socketService = socketService;
    this.resourceManager = new TriggerResourceManager();

    this.config = {
      maxConcurrentTriggers: 10,
      maxConcurrentPerWorkflow: 3,
      maxConcurrentPerUser: 5,
      enableResourceSharing: true,
      priorityQueuing: true,
      isolatedExecutionDefault: true,
      ...config,
    };

    this.conflictStrategy = conflictStrategy;

    this.setupEventHandlers();
  }

  /**
   * Execute a trigger with proper isolation and concurrency management
   */
  async executeTrigger(request: TriggerExecutionRequest): Promise<{
    success: boolean;
    executionId?: string;
    status?: "started" | "queued" | "rejected";
    reason?: string;
  }> {
    try {
      logger.info("Trigger execution request received", {
        triggerId: request.triggerId,
        triggerType: request.triggerType,
        workflowId: request.workflowId,
      });

      // Load workflow to analyze affected nodes
      const workflow = await this.loadWorkflow(request.workflowId);
      if (!workflow) {
        return {
          success: false,
          reason: `Workflow ${request.workflowId} not found`,
        };
      }

      // Create trigger execution context
      const context = TriggerExecutionContextFactory.createTriggerContext(
        request.triggerId,
        request.triggerType,
        request.workflowId,
        request.userId,
        request.triggerNodeId,
        request.triggerData,
        {
          isolatedExecution: this.config.isolatedExecutionDefault,
          maxConcurrentTriggers: this.config.maxConcurrentTriggers,
          ...request.options,
        }
      );

      // Analyze affected nodes
      context.affectedNodes = TriggerImpactAnalyzer.analyzeAffectedNodes(
        request.triggerNodeId,
        workflow.nodes,
        workflow.connections
      );

      // Check concurrency limits and conflicts
      const canExecute = await this.checkExecutionFeasibility(context);

      if (!canExecute.allowed) {
        if (this.conflictStrategy.type === "reject") {
          return {
            success: false,
            status: "rejected",
            reason: canExecute.reason,
          };
        } else if (this.conflictStrategy.type === "queue") {
          return await this.queueTrigger(context);
        }
      }

      // Attempt to acquire resources
      const resourcesAcquired = this.resourceManager.acquireNodeLocks(context);

      if (!resourcesAcquired && context.isolatedExecution) {
        if (this.conflictStrategy.type === "queue") {
          return await this.queueTrigger(context);
        } else {
          return {
            success: false,
            status: "rejected",
            reason:
              "Required resources are locked and isolated execution is enabled",
          };
        }
      }

      // Start execution
      return await this.startTriggerExecution(context, workflow);
    } catch (error) {
      logger.error("Failed to execute trigger", {
        triggerId: request.triggerId,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all active trigger executions
   */
  getActiveTriggers(): TriggerExecutionInfo[] {
    return Array.from(this.activeTriggers.values()).map((context) => ({
      executionId: context.executionId,
      triggerId: context.triggerId,
      triggerType: context.triggerType,
      workflowId: context.workflowId,
      status: context.cancelled
        ? "cancelled"
        : context.paused
        ? "queued"
        : "running",
      startTime: context.startTime,
      priority: context.priority,
      affectedNodes: Array.from(context.affectedNodes),
      isolationScore: TriggerImpactAnalyzer.calculateIsolationScore(
        context,
        Array.from(this.activeTriggers.values()).filter(
          (c) => c.executionId !== context.executionId
        )
      ),
    }));
  }

  /**
   * Get queued trigger executions
   */
  getQueuedTriggers(): TriggerExecutionInfo[] {
    return this.queuedTriggers.map((context) => ({
      executionId: context.executionId,
      triggerId: context.triggerId,
      triggerType: context.triggerType,
      workflowId: context.workflowId,
      status: "queued",
      startTime: context.startTime,
      priority: context.priority,
      affectedNodes: Array.from(context.affectedNodes),
      isolationScore: 0, // Queued triggers don't have isolation score yet
    }));
  }

  /**
   * Cancel a trigger execution
   */
  async cancelTrigger(executionId: string): Promise<boolean> {
    const activeContext = this.activeTriggers.get(executionId);

    if (activeContext) {
      try {
        await this.flowExecutionEngine.cancelExecution(executionId);
        return true;
      } catch (error) {
        logger.error("Failed to cancel active trigger execution", {
          executionId,
          error,
        });
        return false;
      }
    }

    // Check if it's in the queue
    const queueIndex = this.queuedTriggers.findIndex(
      (c) => c.executionId === executionId
    );
    if (queueIndex >= 0) {
      const context = this.queuedTriggers.splice(queueIndex, 1)[0];
      this.resourceManager.releaseLocks(executionId);

      this.emit("triggerCancelled", {
        executionId,
        triggerId: context.triggerId,
        reason: "cancelled_from_queue",
      });

      return true;
    }

    return false;
  }

  /**
   * Get trigger execution statistics
   */
  getTriggerStats(): {
    activeTriggers: number;
    queuedTriggers: number;
    completedTriggers: number;
    triggersByType: Record<string, number>;
    triggersByWorkflow: Record<string, number>;
    resourceUtilization: any;
  } {
    const activeTriggersList = Array.from(this.activeTriggers.values());
    const triggersByType: Record<string, number> = {};
    const triggersByWorkflow: Record<string, number> = {};

    // Count active triggers by type and workflow
    for (const context of activeTriggersList) {
      triggersByType[context.triggerType] =
        (triggersByType[context.triggerType] || 0) + 1;
      triggersByWorkflow[context.workflowId] =
        (triggersByWorkflow[context.workflowId] || 0) + 1;
    }

    // Count queued triggers
    for (const context of this.queuedTriggers) {
      triggersByType[context.triggerType] =
        (triggersByType[context.triggerType] || 0) + 1;
      triggersByWorkflow[context.workflowId] =
        (triggersByWorkflow[context.workflowId] || 0) + 1;
    }

    return {
      activeTriggers: this.activeTriggers.size,
      queuedTriggers: this.queuedTriggers.length,
      completedTriggers: this.completedTriggers.size,
      triggersByType,
      triggersByWorkflow,
      resourceUtilization: this.resourceManager.getResourceStats(),
    };
  }

  /**
   * Update trigger manager configuration
   */
  updateConfig(config: Partial<ConcurrencyConfig>): void {
    this.config = { ...this.config, ...config };

    // Process queue if limits were increased
    if (
      config.maxConcurrentTriggers ||
      config.maxConcurrentPerWorkflow ||
      config.maxConcurrentPerUser
    ) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Cleanup completed executions and expired queue items
   */
  cleanup(maxAge: number = 3600000): void {
    // Default 1 hour
    const now = Date.now();

    // Clean completed triggers
    for (const [executionId, info] of this.completedTriggers) {
      if (info.endTime && now - info.endTime > maxAge) {
        this.completedTriggers.delete(executionId);
      }
    }

    // Clean expired queue items
    const queueTimeout = this.conflictStrategy.options?.queueTimeout || 300000; // 5 minutes default
    this.queuedTriggers = this.queuedTriggers.filter((context) => {
      const isExpired = now - context.startTime > queueTimeout;
      if (isExpired) {
        this.resourceManager.releaseLocks(context.executionId);
        this.emit("triggerExpired", {
          executionId: context.executionId,
          triggerId: context.triggerId,
        });
      }
      return !isExpired;
    });
  }

  private async checkExecutionFeasibility(
    context: TriggerExecutionContext
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check global concurrent limit
    if (this.activeTriggers.size >= this.config.maxConcurrentTriggers) {
      return {
        allowed: false,
        reason: "Global concurrent trigger limit exceeded",
      };
    }

    // Check per-workflow limit
    const workflowTriggers = Array.from(this.activeTriggers.values()).filter(
      (c) => c.workflowId === context.workflowId
    );

    if (workflowTriggers.length >= this.config.maxConcurrentPerWorkflow) {
      return {
        allowed: false,
        reason: "Per-workflow concurrent trigger limit exceeded",
      };
    }

    // Check per-user limit
    const userTriggers = Array.from(this.activeTriggers.values()).filter(
      (c) => c.userId === context.userId
    );

    if (userTriggers.length >= this.config.maxConcurrentPerUser) {
      return {
        allowed: false,
        reason: "Per-user concurrent trigger limit exceeded",
      };
    }

    // Check resource conflicts if isolated execution is required
    if (context.isolatedExecution) {
      const conflictingTriggers = Array.from(
        this.activeTriggers.values()
      ).filter((c) => TriggerImpactAnalyzer.hasNodeOverlap(context, c));

      if (conflictingTriggers.length > 0) {
        return {
          allowed: false,
          reason: "Resource conflict with existing isolated execution",
        };
      }
    }

    return { allowed: true };
  }

  private async queueTrigger(context: TriggerExecutionContext): Promise<{
    success: boolean;
    executionId: string;
    status: "queued";
  }> {
    const maxQueueSize = this.conflictStrategy.options?.maxQueueSize || 100;

    if (this.queuedTriggers.length >= maxQueueSize) {
      throw new Error("Trigger queue is full");
    }

    // Insert based on priority if priority queuing is enabled
    if (this.config.priorityQueuing) {
      let insertIndex = this.queuedTriggers.length;
      for (let i = 0; i < this.queuedTriggers.length; i++) {
        if (this.queuedTriggers[i].priority > context.priority) {
          insertIndex = i;
          break;
        }
      }
      this.queuedTriggers.splice(insertIndex, 0, context);
    } else {
      this.queuedTriggers.push(context);
    }

    this.emit("triggerQueued", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      queuePosition:
        this.queuedTriggers.findIndex(
          (c) => c.executionId === context.executionId
        ) + 1,
    });

    logger.info("Trigger queued", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      queueSize: this.queuedTriggers.length,
    });

    return {
      success: true,
      executionId: context.executionId,
      status: "queued",
    };
  }

  private async startTriggerExecution(
    context: TriggerExecutionContext,
    workflow: any
  ): Promise<{
    success: boolean;
    executionId: string;
    status: "started";
  }> {
    this.activeTriggers.set(context.executionId, context);

    this.emit("triggerStarted", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      triggerType: context.triggerType,
      workflowId: context.workflowId,
    });

    // Start execution asynchronously
    this.executeFlowAsync(context, workflow);

    logger.info("Trigger execution started", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      affectedNodes: Array.from(context.affectedNodes),
    });

    return {
      success: true,
      executionId: context.executionId,
      status: "started",
    };
  }

  private async executeFlowAsync(
    context: TriggerExecutionContext,
    workflow: any
  ): Promise<void> {
    try {
      const result = await this.flowExecutionEngine.executeFromTrigger(
        context.triggerId,
        context.workflowId,
        context.userId,
        context.triggerData,
        context.executionOptions
      );

      await this.handleTriggerCompletion(context, result);
    } catch (error) {
      await this.handleTriggerError(context, error);
    }
  }

  private async handleTriggerCompletion(
    context: TriggerExecutionContext,
    result: FlowExecutionResult
  ): Promise<void> {
    // Remove from active triggers
    this.activeTriggers.delete(context.executionId);

    // Release resources
    this.resourceManager.releaseLocks(context.executionId);

    // Add to completed triggers
    const info: TriggerExecutionInfo = {
      executionId: context.executionId,
      triggerId: context.triggerId,
      triggerType: context.triggerType,
      workflowId: context.workflowId,
      status: result.status === "completed" ? "completed" : "failed",
      startTime: context.startTime,
      endTime: Date.now(),
      priority: context.priority,
      affectedNodes: Array.from(context.affectedNodes),
      isolationScore: 1.0, // Completed executions are fully isolated
    };

    this.completedTriggers.set(context.executionId, info);

    this.emit("triggerCompleted", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      result,
    });

    // Process queue for next executions
    setImmediate(() => this.processQueue());

    logger.info("Trigger execution completed", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      status: result.status,
      duration: Date.now() - context.startTime,
    });
  }

  private async handleTriggerError(
    context: TriggerExecutionContext,
    error: any
  ): Promise<void> {
    // Remove from active triggers
    this.activeTriggers.delete(context.executionId);

    // Release resources
    this.resourceManager.releaseLocks(context.executionId);

    const info: TriggerExecutionInfo = {
      executionId: context.executionId,
      triggerId: context.triggerId,
      triggerType: context.triggerType,
      workflowId: context.workflowId,
      status: "failed",
      startTime: context.startTime,
      endTime: Date.now(),
      priority: context.priority,
      affectedNodes: Array.from(context.affectedNodes),
      isolationScore: 1.0,
    };

    this.completedTriggers.set(context.executionId, info);

    this.emit("triggerError", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      error,
    });

    // Process queue for next executions
    setImmediate(() => this.processQueue());

    logger.error("Trigger execution failed", {
      executionId: context.executionId,
      triggerId: context.triggerId,
      error: error instanceof Error ? error.message : error,
    });
  }

  private async processQueue(): Promise<void> {
    while (this.queuedTriggers.length > 0) {
      const context = this.queuedTriggers[0];

      // Check if we can now execute this trigger
      const canExecute = await this.checkExecutionFeasibility(context);
      if (!canExecute.allowed) {
        break; // Can't execute the highest priority item, so stop processing
      }

      // Try to acquire resources
      const resourcesAcquired = this.resourceManager.acquireNodeLocks(context);
      if (!resourcesAcquired && context.isolatedExecution) {
        break; // Can't acquire required resources
      }

      // Remove from queue and start execution
      this.queuedTriggers.shift();

      try {
        const workflow = await this.loadWorkflow(context.workflowId);
        if (workflow) {
          await this.startTriggerExecution(context, workflow);
        } else {
          this.emit("triggerError", {
            executionId: context.executionId,
            triggerId: context.triggerId,
            error: new Error(`Workflow ${context.workflowId} not found`),
          });
        }
      } catch (error) {
        await this.handleTriggerError(context, error);
      }
    }
  }

  private async loadWorkflow(workflowId: string): Promise<any | null> {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return null;
      }

      return {
        ...workflow,
        nodes: Array.isArray(workflow.nodes)
          ? workflow.nodes
          : JSON.parse(workflow.nodes as string),
        connections: Array.isArray(workflow.connections)
          ? workflow.connections
          : JSON.parse(workflow.connections as string),
      };
    } catch (error) {
      logger.error("Failed to load workflow", { workflowId, error });
      return null;
    }
  }

  private setupEventHandlers(): void {
    // Handle flow execution engine events
    this.flowExecutionEngine.on("executionCancelled", (data) => {
      const context = this.activeTriggers.get(data.executionId);
      if (context) {
        this.handleTriggerCompletion(context, {
          executionId: data.executionId,
          status: "cancelled",
          executedNodes: [],
          failedNodes: [],
          executionPath: [],
          totalDuration: Date.now() - context.startTime,
          nodeResults: new Map(),
        });
      }
    });
  }

  /**
   * Shutdown the trigger manager
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down trigger manager...");

    // Cancel all active triggers
    const activeExecutions = Array.from(this.activeTriggers.keys());
    for (const executionId of activeExecutions) {
      await this.cancelTrigger(executionId);
    }

    // Clear queue
    this.queuedTriggers = [];

    // Release all resources
    for (const executionId of this.activeTriggers.keys()) {
      this.resourceManager.releaseLocks(executionId);
    }

    this.activeTriggers.clear();
    this.completedTriggers.clear();

    logger.info("Trigger manager shutdown complete");
  }
}
