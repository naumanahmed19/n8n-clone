import { NodeExecutionStatus, PrismaClient } from "@prisma/client";
import {
  Execution,
  ExecutionFilters,
  ExecutionResult,
  ExecutionStatus,
  NodeExecution,
} from "../types/database";
import {
  ExecutionOptions,
  ExecutionProgress,
  ExecutionStats,
  QueueConfig,
} from "../types/execution.types";
import { logger } from "../utils/logger";
import { ExecutionEngine } from "./ExecutionEngine";
import ExecutionHistoryService from "./ExecutionHistoryService";
import {
  FlowExecutionEngine,
  FlowExecutionOptions,
  FlowExecutionResult,
} from "./FlowExecutionEngine";
import { NodeService } from "./NodeService";

export class ExecutionService {
  private prisma: PrismaClient;
  private executionEngine: ExecutionEngine;
  private flowExecutionEngine: FlowExecutionEngine;
  private nodeService: NodeService;
  private executionHistoryService: ExecutionHistoryService;

  constructor(
    prisma: PrismaClient,
    nodeService: NodeService,
    executionHistoryService: ExecutionHistoryService
  ) {
    this.prisma = prisma;
    this.nodeService = nodeService;
    this.executionHistoryService = executionHistoryService;

    // Initialize queue configuration
    const queueConfig: QueueConfig = {
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
      },
      concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || "5"),
      removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || "100"),
      removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || "50"),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    };

    this.executionEngine = new ExecutionEngine(
      prisma,
      nodeService,
      queueConfig
    );
    this.flowExecutionEngine = new FlowExecutionEngine(
      prisma,
      nodeService,
      executionHistoryService
    );
    this.setupEventHandlers();
  }

  /**
   * Execute a workflow using flow-based execution
   */
  async executeWorkflow(
    workflowId: string,
    userId: string,
    triggerData?: any,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    try {
      logger.info(
        `Starting flow execution of workflow ${workflowId} for user ${userId}`
      );

      // Load workflow to determine execution approach
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId,
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            message: "Workflow not found",
            timestamp: new Date(),
          },
        };
      }

      // Parse workflow data
      const workflowNodes = Array.isArray(workflow.nodes)
        ? workflow.nodes
        : JSON.parse(workflow.nodes as string);

      // Find trigger nodes or determine starting point
      const triggerNodes = workflowNodes.filter(
        (node: any) =>
          node.type.includes("trigger") || node.type === "manual-trigger"
      );

      let flowResult: FlowExecutionResult;

      if (triggerNodes.length > 0 && triggerData) {
        // Execute from trigger
        const triggerNode = triggerNodes[0]; // Use first trigger for now
        flowResult = await this.flowExecutionEngine.executeFromTrigger(
          triggerNode.id,
          workflowId,
          userId,
          triggerData,
          {
            timeout: options.timeout || 300000,
            saveProgress: true,
            saveData: true,
            manual: true,
            isolatedExecution: false,
          }
        );
      } else {
        // Execute from first node or specified starting node
        const startNode = workflowNodes[0];
        if (!startNode) {
          return {
            success: false,
            error: {
              message: "No nodes found in workflow",
              timestamp: new Date(),
            },
          };
        }

        flowResult = await this.flowExecutionEngine.executeFromNode(
          startNode.id,
          workflowId,
          userId,
          triggerData ? { main: [[triggerData]] } : undefined,
          {
            timeout: options.timeout || 300000,
            saveProgress: true,
            saveData: true,
            manual: true,
            isolatedExecution: false,
          }
        );
      }

      // Create execution record in database
      const executionRecord = await this.createFlowExecutionRecord(
        flowResult,
        workflowId,
        userId,
        triggerData
      );

      return {
        success: flowResult.status === "completed",
        data: {
          executionId: flowResult.executionId,
          status: flowResult.status,
          executedNodes: flowResult.executedNodes,
          failedNodes: flowResult.failedNodes,
          duration: flowResult.totalDuration,
        },
      };
    } catch (error) {
      logger.error(`Failed to execute workflow ${workflowId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Execute a workflow from a specific node using flow execution
   */
  async executeFromNode(
    workflowId: string,
    nodeId: string,
    userId: string,
    inputData?: any,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    try {
      logger.info(
        `Starting flow execution from node ${nodeId} in workflow ${workflowId} for user ${userId}`
      );

      // Verify workflow exists and belongs to user
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId,
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            message: "Workflow not found",
            timestamp: new Date(),
          },
        };
      }

      const flowOptions: FlowExecutionOptions = {
        timeout: options.timeout || 300000,
        saveProgress: true,
        saveData: true,
        manual: true,
        isolatedExecution: false,
      };

      const flowResult = await this.flowExecutionEngine.executeFromNode(
        nodeId,
        workflowId,
        userId,
        inputData ? { main: [[inputData]] } : undefined,
        flowOptions
      );

      // Create execution record in database
      const executionRecord = await this.createFlowExecutionRecord(
        flowResult,
        workflowId,
        userId,
        inputData
      );

      return {
        success: flowResult.status === "completed",
        data: {
          executionId: flowResult.executionId,
          status: flowResult.status,
          executedNodes: flowResult.executedNodes,
          failedNodes: flowResult.failedNodes,
          duration: flowResult.totalDuration,
        },
      };
    } catch (error) {
      logger.error(`Failed to execute from node ${nodeId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get execution by ID
   */
  async getExecution(
    executionId: string,
    userId: string
  ): Promise<Execution | null> {
    try {
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId },
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          nodeExecutions: {
            orderBy: { startedAt: "asc" },
          },
        },
      });

      return execution as any;
    } catch (error) {
      logger.error(`Failed to get execution ${executionId}:`, error);
      return null;
    }
  }

  /**
   * List executions with filtering and pagination
   */
  async listExecutions(
    userId: string,
    filters: ExecutionFilters = {}
  ): Promise<{
    executions: Execution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        status,
        workflowId,
        startDate,
        endDate,
        limit = 20,
        offset = 0,
      } = filters;

      const where: any = {
        workflow: { userId },
      };

      if (status) {
        where.status = status;
      }

      if (workflowId) {
        where.workflowId = workflowId;
      }

      if (startDate || endDate) {
        where.startedAt = {};
        if (startDate) where.startedAt.gte = startDate;
        if (endDate) where.startedAt.lte = endDate;
      }

      const [executions, total] = await Promise.all([
        this.prisma.execution.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { startedAt: "desc" },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            _count: {
              select: {
                nodeExecutions: true,
              },
            },
          },
        }),
        this.prisma.execution.count({ where }),
      ]);

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        executions: executions as any,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error(`Failed to list executions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(
    executionId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      // Verify execution belongs to user
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId },
        },
      });

      if (!execution) {
        return {
          success: false,
          error: {
            message: "Execution not found",
            timestamp: new Date(),
          },
        };
      }

      if (execution.status !== ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: "Can only cancel running executions",
            timestamp: new Date(),
          },
        };
      }

      await this.executionEngine.cancelExecution(executionId);

      return {
        success: true,
        data: { message: "Execution cancelled successfully" },
      };
    } catch (error) {
      logger.error(`Failed to cancel execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(
    executionId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      // Get the original execution
      const originalExecution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId },
        },
        include: {
          workflow: true,
        },
      });

      if (!originalExecution) {
        return {
          success: false,
          error: {
            message: "Execution not found",
            timestamp: new Date(),
          },
        };
      }

      if (originalExecution.status === ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: "Cannot retry running execution",
            timestamp: new Date(),
          },
        };
      }

      // Start a new execution with the same trigger data
      const newExecutionId = await this.executionEngine.executeWorkflow(
        originalExecution.workflowId,
        userId,
        originalExecution.triggerData
      );

      return {
        success: true,
        data: { executionId: newExecutionId },
      };
    } catch (error) {
      logger.error(`Failed to retry execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Delete an execution
   */
  async deleteExecution(
    executionId: string,
    userId: string
  ): Promise<ExecutionResult> {
    try {
      // Verify execution belongs to user and is not running
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId },
        },
      });

      if (!execution) {
        return {
          success: false,
          error: {
            message: "Execution not found",
            timestamp: new Date(),
          },
        };
      }

      if (execution.status === ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: "Cannot delete running execution",
            timestamp: new Date(),
          },
        };
      }

      // Delete execution and related node executions (cascade should handle this)
      await this.prisma.execution.delete({
        where: { id: executionId },
      });

      return {
        success: true,
        data: { message: "Execution deleted successfully" },
      };
    } catch (error) {
      logger.error(`Failed to delete execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get execution progress
   */
  async getExecutionProgress(
    executionId: string,
    userId: string
  ): Promise<ExecutionProgress | null> {
    try {
      // Verify execution belongs to user
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId },
        },
      });

      if (!execution) {
        return null;
      }

      return await this.executionEngine.getExecutionProgress(executionId);
    } catch (error) {
      logger.error(
        `Failed to get execution progress for ${executionId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(userId?: string): Promise<ExecutionStats> {
    try {
      if (userId) {
        // Get stats for specific user
        const [
          totalExecutions,
          runningExecutions,
          completedExecutions,
          failedExecutions,
          cancelledExecutions,
        ] = await Promise.all([
          this.prisma.execution.count({
            where: { workflow: { userId } },
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.RUNNING },
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.SUCCESS },
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.ERROR },
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.CANCELLED },
          }),
        ]);

        return {
          totalExecutions,
          runningExecutions,
          completedExecutions,
          failedExecutions,
          cancelledExecutions,
          averageExecutionTime: 0, // TODO: Calculate from actual execution times
          queueSize: 0, // User-specific queue size not available
        };
      } else {
        // Get global stats from execution engine
        return await this.executionEngine.getExecutionStats();
      }
    } catch (error) {
      logger.error("Failed to get execution stats:", error);
      throw error;
    }
  }

  /**
   * Get node execution details
   */
  async getNodeExecution(
    executionId: string,
    nodeId: string,
    userId: string
  ): Promise<NodeExecution | null> {
    try {
      const nodeExecution = await this.prisma.nodeExecution.findFirst({
        where: {
          executionId,
          nodeId,
          execution: {
            workflow: { userId },
          },
        },
      });

      return nodeExecution as any;
    } catch (error) {
      logger.error(
        `Failed to get node execution ${nodeId} for execution ${executionId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Setup event handlers for execution engine events
   */
  private setupEventHandlers(): void {
    // Legacy ExecutionEngine events
    this.executionEngine.on("execution-event", (eventData) => {
      logger.debug("Execution event received:", eventData);

      // Broadcast to Socket.IO for real-time frontend updates
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(
          eventData.executionId,
          eventData
        );
      }
    });

    this.executionEngine.on("execution-progress", (progressData) => {
      logger.debug("Execution progress received:", progressData);

      // Broadcast progress updates
      if (global.socketService) {
        global.socketService.broadcastExecutionProgress(
          progressData.executionId,
          progressData
        );
      }
    });

    this.executionEngine.on("node-execution-event", (nodeEventData) => {
      logger.debug("Node execution event received:", nodeEventData);

      // Broadcast node-specific events
      if (global.socketService) {
        global.socketService.broadcastNodeExecutionEvent(
          nodeEventData.executionId,
          nodeEventData.nodeId,
          nodeEventData.type,
          nodeEventData.data
        );
      }
    });

    // FlowExecutionEngine events
    this.flowExecutionEngine.on("flowExecutionCompleted", (flowResult) => {
      logger.debug("Flow execution completed:", flowResult);

      // Broadcast flow completion event
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(flowResult.executionId, {
          executionId: flowResult.executionId,
          type: "completed",
          timestamp: new Date(),
          data: {
            status: flowResult.status,
            executedNodes: flowResult.executedNodes,
            failedNodes: flowResult.failedNodes,
            duration: flowResult.totalDuration,
          },
        });
      }
    });

    this.flowExecutionEngine.on("nodeExecuted", (nodeEventData) => {
      logger.info("Flow node executed event received:", nodeEventData);
      console.log("=== NODE EXECUTED EVENT ===", {
        executionId: nodeEventData.executionId,
        nodeId: nodeEventData.nodeId,
        status: nodeEventData.status,
        error: nodeEventData.result?.error
      });

      // Broadcast node execution updates for flow
      if (global.socketService) {
        // Determine if node succeeded or failed - fix the logic here
        const eventType = nodeEventData.status === "FAILED" || nodeEventData.result?.status === "failed" ? "node-failed" : "node-completed";
        
        logger.info("Broadcasting node execution event via socket", {
          executionId: nodeEventData.executionId,
          nodeId: nodeEventData.nodeId,
          eventType,
          status: nodeEventData.status,
        });
        
        console.log("=== BROADCASTING WEBSOCKET EVENT ===", {
          executionId: nodeEventData.executionId,
          type: eventType,
          nodeId: nodeEventData.nodeId,
          status: nodeEventData.status,
          error: nodeEventData.result?.error
        });
        
        global.socketService.broadcastExecutionEvent(
          nodeEventData.executionId,
          {
            executionId: nodeEventData.executionId,
            type: eventType,
            nodeId: nodeEventData.nodeId,
            status: nodeEventData.status,
            data: nodeEventData.result,
            error: nodeEventData.result?.error,
            timestamp: new Date(),
          }
        );
      } else {
        logger.warn(
          "Global socketService is not available for node execution broadcast"
        );
      }
    });

    this.flowExecutionEngine.on("nodeStarted", (nodeEventData) => {
      logger.info("Flow node started event received:", nodeEventData);

      // Broadcast node start events for flow
      if (global.socketService) {
        logger.info("Broadcasting node start event via socket", {
          executionId: nodeEventData.executionId,
          nodeId: nodeEventData.nodeId,
          status: "started",
        });
        
        global.socketService.broadcastExecutionEvent(
          nodeEventData.executionId,
          {
            executionId: nodeEventData.executionId,
            type: "node-started",
            nodeId: nodeEventData.nodeId,
            status: "RUNNING",
            data: nodeEventData.node,
            timestamp: new Date(),
          }
        );
      } else {
        logger.warn(
          "Global socketService is not available for node start broadcast"
        );
      }
    });

    this.flowExecutionEngine.on("executionCancelled", (eventData) => {
      logger.debug("Flow execution cancelled:", eventData);

      // Broadcast cancellation event
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(eventData.executionId, {
          executionId: eventData.executionId,
          type: "cancelled",
          timestamp: new Date(),
        });
      }
    });

    this.flowExecutionEngine.on("executionPaused", (eventData) => {
      logger.debug("Flow execution paused:", eventData);

      // Broadcast pause event
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(eventData.executionId, {
          executionId: eventData.executionId,
          type: "node-status-update",
          timestamp: new Date(),
          data: { status: "paused" },
        });
      }
    });

    this.flowExecutionEngine.on("executionResumed", (eventData) => {
      logger.debug("Flow execution resumed:", eventData);

      // Broadcast resume event
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(eventData.executionId, {
          executionId: eventData.executionId,
          type: "node-status-update",
          timestamp: new Date(),
          data: { status: "resumed" },
        });
      }
    });
  }

  /**
   * Execute a single node
   */
  async executeSingleNode(
    workflowId: string,
    nodeId: string,
    userId: string,
    inputData?: any,
    parameters?: Record<string, any>
  ): Promise<ExecutionResult> {
    try {
      logger.info(
        `Starting single node execution: ${nodeId} in workflow ${workflowId} for user ${userId}`
      );

      // Verify workflow belongs to user
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId,
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            message: "Workflow not found",
            timestamp: new Date(),
          },
        };
      }

      // Parse nodes from JSON
      const workflowNodes = Array.isArray(workflow.nodes)
        ? workflow.nodes
        : JSON.parse(workflow.nodes as string);

      // Find the specific node
      const node = workflowNodes.find((n: any) => n.id === nodeId);
      if (!node) {
        return {
          success: false,
          error: {
            message: "Node not found in workflow",
            timestamp: new Date(),
          },
        };
      }

      // Check if node can be executed individually (trigger nodes)
      const nodeTypeInfo = await this.nodeService.getNodeSchema(node.type);
      if (!nodeTypeInfo) {
        return {
          success: false,
          error: {
            message: `Unknown node type: ${node.type}`,
            timestamp: new Date(),
          },
        };
      }

      // For trigger nodes, use FlowExecutionEngine to execute the entire flow
      const triggerNodeTypes = ["manual-trigger", "webhook-trigger"];
      if (!triggerNodeTypes.includes(node.type)) {
        return {
          success: false,
          error: {
            message: "Only trigger nodes can be executed individually",
            timestamp: new Date(),
          },
        };
      }

      // Prepare node parameters (merge defaults with provided parameters)
      const nodeParameters = {
        ...nodeTypeInfo.defaults,
        ...node.parameters,
        ...(parameters || {}),
      };

      // Prepare input data for the node
      const nodeInputData = inputData || { main: [[]] };

      logger.info(`Executing trigger node with flow execution`, {
        nodeId,
        nodeType: node.type,
        workflowId,
        userId,
        nodeParameters,
        inputDataSize: JSON.stringify(nodeInputData).length,
      });

      try {
        // Use FlowExecutionEngine to execute the entire workflow starting from this trigger node
        const flowResult = await this.flowExecutionEngine.executeFromNode(
          nodeId,
          workflowId,
          userId,
          nodeInputData,
          {
            timeout: 300000, // 5 minutes
            saveProgress: true,
            saveData: true,
            manual: true,
            isolatedExecution: false,
          }
        );

        // Create execution record in database
        const executionRecord = await this.createFlowExecutionRecord(
          flowResult,
          workflowId,
          userId,
          nodeInputData
        );

        logger.info(`Flow execution completed from trigger node`, {
          nodeId,
          flowStatus: flowResult.status,
          executedNodes: flowResult.executedNodes.length,
          failedNodes: flowResult.failedNodes.length,
          executionId: flowResult.executionId,
        });

        return {
          success: flowResult.status === "completed",
          data: {
            executionId: flowResult.executionId,
            nodeId,
            status: flowResult.status === "completed" ? "success" : "failed",
            data: flowResult.nodeResults
              ? Array.from(flowResult.nodeResults.values()).map((result) => ({
                  main: result.data || [],
                }))
              : [],
            startTime: Date.now() - flowResult.totalDuration,
            endTime: Date.now(),
            duration: flowResult.totalDuration,
            executedNodes: flowResult.executedNodes,
            failedNodes: flowResult.failedNodes,
          },
          error:
            flowResult.status !== "completed"
              ? {
                  message: `Flow execution ${flowResult.status}`,
                  timestamp: new Date(),
                }
              : undefined,
        };
      } catch (flowError) {
        logger.error(`FlowExecutionEngine failed for node ${nodeId}:`, {
          error: flowError,
          errorMessage:
            flowError instanceof Error ? flowError.message : String(flowError),
          errorStack: flowError instanceof Error ? flowError.stack : undefined,
          nodeId,
          workflowId,
          userId,
        });

        // Return more specific error information
        const errorMessage =
          flowError instanceof Error
            ? flowError.message
            : typeof flowError === "string"
            ? flowError
            : "Flow execution failed with unknown error";

        return {
          success: false,
          error: {
            message: errorMessage,
            stack: flowError instanceof Error ? flowError.stack : undefined,
            timestamp: new Date(),
            nodeId: nodeId,
          },
        };
      }
    } catch (error) {
      logger.error(`Failed to execute single node ${nodeId}:`, error);

      // Try to create a failed execution record
      try {
        await this.prisma.singleNodeExecution.create({
          data: {
            id: `single_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            workflowId,
            nodeId,
            nodeType: "unknown",
            status: "ERROR" as NodeExecutionStatus,
            startedAt: new Date(),
            finishedAt: new Date(),
            inputData: inputData || {},
            outputData: {},
            parameters: parameters || {},
            error: error instanceof Error ? error.message : "Unknown error",
            userId,
          },
        });
      } catch (recordError) {
        logger.error("Failed to create failed execution record:", recordError);
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Create execution record for flow execution in database
   */
  private async createFlowExecutionRecord(
    flowResult: FlowExecutionResult,
    workflowId: string,
    userId: string,
    triggerData?: any
  ): Promise<any> {
    try {
      // Map flow status to execution status
      let executionStatus: ExecutionStatus;
      switch (flowResult.status) {
        case "completed":
          executionStatus = ExecutionStatus.SUCCESS;
          break;
        case "failed":
          executionStatus = ExecutionStatus.ERROR;
          break;
        case "cancelled":
          executionStatus = ExecutionStatus.CANCELLED;
          break;
        case "partial":
          executionStatus = ExecutionStatus.ERROR; // Partial completion is treated as error
          break;
        default:
          executionStatus = ExecutionStatus.ERROR;
      }

      // Create main execution record
      const execution = await this.prisma.execution.create({
        data: {
          id: flowResult.executionId,
          workflowId,
          status: executionStatus,
          startedAt: new Date(Date.now() - flowResult.totalDuration),
          finishedAt: new Date(),
          triggerData: triggerData || undefined,
          error:
            flowResult.status === "failed" || flowResult.status === "partial"
              ? {
                  message: "Flow execution failed",
                  failedNodes: flowResult.failedNodes,
                  executionPath: flowResult.executionPath,
                }
              : undefined,
        },
      });

      // Create node execution records
      for (const [nodeId, nodeResult] of flowResult.nodeResults) {
        let nodeStatus: "SUCCESS" | "ERROR" | "CANCELLED";
        switch (nodeResult.status) {
          case "completed":
            nodeStatus = "SUCCESS";
            break;
          case "failed":
            nodeStatus = "ERROR";
            break;
          case "cancelled":
            nodeStatus = "CANCELLED";
            break;
          default:
            nodeStatus = "ERROR";
        }

        await this.prisma.nodeExecution.create({
          data: {
            id: `${flowResult.executionId}_${nodeId}`,
            executionId: flowResult.executionId,
            nodeId: nodeId,
            status: nodeStatus as any,
            startedAt: new Date(),
            finishedAt: new Date(Date.now() + nodeResult.duration),
            inputData: {}, // TODO: Add actual input data
            outputData: nodeResult.data || undefined,
            error: nodeResult.error || undefined,
          },
        });
      }

      return execution;
    } catch (error) {
      logger.error("Failed to create flow execution record:", error);
      throw error;
    }
  }

  /**
   * Get flow execution status from FlowExecutionEngine
   */
  async getFlowExecutionStatus(executionId: string): Promise<any> {
    return this.flowExecutionEngine.getExecutionStatus(executionId);
  }

  /**
   * Cancel flow execution
   */
  async cancelFlowExecution(executionId: string): Promise<ExecutionResult> {
    try {
      await this.flowExecutionEngine.cancelExecution(executionId);

      return {
        success: true,
        data: { message: "Flow execution cancelled successfully" },
      };
    } catch (error) {
      logger.error(`Failed to cancel flow execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Pause flow execution
   */
  async pauseFlowExecution(executionId: string): Promise<ExecutionResult> {
    try {
      await this.flowExecutionEngine.pauseExecution(executionId);

      return {
        success: true,
        data: { message: "Flow execution paused successfully" },
      };
    } catch (error) {
      logger.error(`Failed to pause flow execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Resume flow execution
   */
  async resumeFlowExecution(executionId: string): Promise<ExecutionResult> {
    try {
      await this.flowExecutionEngine.resumeExecution(executionId);

      return {
        success: true,
        data: { message: "Flow execution resumed successfully" },
      };
    } catch (error) {
      logger.error(`Failed to resume flow execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get execution engine instance (for advanced usage)
   */
  getExecutionEngine(): ExecutionEngine {
    return this.executionEngine;
  }

  /**
   * Get flow execution engine instance (for advanced usage)
   */
  getFlowExecutionEngine(): FlowExecutionEngine {
    return this.flowExecutionEngine;
  }

  /**
   * Shutdown the execution service
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down execution service...");
    await this.executionEngine.shutdown();
    logger.info("Execution service shutdown complete");
  }
}
