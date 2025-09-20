import { PrismaClient } from '@prisma/client';
import { ExecutionEngine } from './ExecutionEngine';
import { NodeService } from './NodeService';
import { logger } from '../utils/logger';
import {
  Execution,
  NodeExecution,
  ExecutionStatus,
  ExecutionFilters,
  ExecutionResult
} from '../types/database';
import {
  ExecutionOptions,
  ExecutionProgress,
  ExecutionStats,
  QueueConfig
} from '../types/execution.types';

export class ExecutionService {
  private prisma: PrismaClient;
  private executionEngine: ExecutionEngine;
  private nodeService: NodeService;

  constructor(prisma: PrismaClient, nodeService: NodeService) {
    this.prisma = prisma;
    this.nodeService = nodeService;

    // Initialize queue configuration
    const queueConfig: QueueConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      },
      concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '5'),
      removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE || '100'),
      removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL || '50'),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    };

    this.executionEngine = new ExecutionEngine(prisma, nodeService, queueConfig);
    this.setupEventHandlers();
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    userId: string,
    triggerData?: any,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    try {
      logger.info(`Starting manual execution of workflow ${workflowId} for user ${userId}`);

      const executionId = await this.executionEngine.executeWorkflow(
        workflowId,
        userId,
        triggerData,
        options
      );

      return {
        success: true,
        data: { executionId }
      };
    } catch (error) {
      logger.error(`Failed to execute workflow ${workflowId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string, userId: string): Promise<Execution | null> {
    try {
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId }
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          nodeExecutions: {
            orderBy: { startedAt: 'asc' }
          }
        }
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
        offset = 0
      } = filters;

      const where: any = {
        workflow: { userId }
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
          orderBy: { startedAt: 'desc' },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            _count: {
              select: {
                nodeExecutions: true
              }
            }
          }
        }),
        this.prisma.execution.count({ where })
      ]);

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        executions: executions as any,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error(`Failed to list executions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string, userId: string): Promise<ExecutionResult> {
    try {
      // Verify execution belongs to user
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId }
        }
      });

      if (!execution) {
        return {
          success: false,
          error: {
            message: 'Execution not found',
            timestamp: new Date()
          }
        };
      }

      if (execution.status !== ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: 'Can only cancel running executions',
            timestamp: new Date()
          }
        };
      }

      await this.executionEngine.cancelExecution(executionId);

      return {
        success: true,
        data: { message: 'Execution cancelled successfully' }
      };
    } catch (error) {
      logger.error(`Failed to cancel execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string, userId: string): Promise<ExecutionResult> {
    try {
      // Get the original execution
      const originalExecution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId }
        },
        include: {
          workflow: true
        }
      });

      if (!originalExecution) {
        return {
          success: false,
          error: {
            message: 'Execution not found',
            timestamp: new Date()
          }
        };
      }

      if (originalExecution.status === ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: 'Cannot retry running execution',
            timestamp: new Date()
          }
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
        data: { executionId: newExecutionId }
      };
    } catch (error) {
      logger.error(`Failed to retry execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Delete an execution
   */
  async deleteExecution(executionId: string, userId: string): Promise<ExecutionResult> {
    try {
      // Verify execution belongs to user and is not running
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId }
        }
      });

      if (!execution) {
        return {
          success: false,
          error: {
            message: 'Execution not found',
            timestamp: new Date()
          }
        };
      }

      if (execution.status === ExecutionStatus.RUNNING) {
        return {
          success: false,
          error: {
            message: 'Cannot delete running execution',
            timestamp: new Date()
          }
        };
      }

      // Delete execution and related node executions (cascade should handle this)
      await this.prisma.execution.delete({
        where: { id: executionId }
      });

      return {
        success: true,
        data: { message: 'Execution deleted successfully' }
      };
    } catch (error) {
      logger.error(`Failed to delete execution ${executionId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get execution progress
   */
  async getExecutionProgress(executionId: string, userId: string): Promise<ExecutionProgress | null> {
    try {
      // Verify execution belongs to user
      const execution = await this.prisma.execution.findFirst({
        where: {
          id: executionId,
          workflow: { userId }
        }
      });

      if (!execution) {
        return null;
      }

      return await this.executionEngine.getExecutionProgress(executionId);
    } catch (error) {
      logger.error(`Failed to get execution progress for ${executionId}:`, error);
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
          cancelledExecutions
        ] = await Promise.all([
          this.prisma.execution.count({
            where: { workflow: { userId } }
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.RUNNING }
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.SUCCESS }
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.ERROR }
          }),
          this.prisma.execution.count({
            where: { workflow: { userId }, status: ExecutionStatus.CANCELLED }
          })
        ]);

        return {
          totalExecutions,
          runningExecutions,
          completedExecutions,
          failedExecutions,
          cancelledExecutions,
          averageExecutionTime: 0, // TODO: Calculate from actual execution times
          queueSize: 0 // User-specific queue size not available
        };
      } else {
        // Get global stats from execution engine
        return await this.executionEngine.getExecutionStats();
      }
    } catch (error) {
      logger.error('Failed to get execution stats:', error);
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
            workflow: { userId }
          }
        }
      });

      return nodeExecution as any;
    } catch (error) {
      logger.error(`Failed to get node execution ${nodeId} for execution ${executionId}:`, error);
      return null;
    }
  }

  /**
   * Setup event handlers for execution engine events
   */
  private setupEventHandlers(): void {
    this.executionEngine.on('execution-event', (eventData) => {
      logger.debug('Execution event received:', eventData);
      
      // Broadcast to Socket.IO for real-time frontend updates
      if (global.socketService) {
        global.socketService.broadcastExecutionEvent(eventData.executionId, eventData);
      }
    });

    this.executionEngine.on('execution-progress', (progressData) => {
      logger.debug('Execution progress received:', progressData);
      
      // Broadcast progress updates
      if (global.socketService) {
        global.socketService.broadcastExecutionProgress(progressData.executionId, progressData);
      }
    });

    this.executionEngine.on('node-execution-event', (nodeEventData) => {
      logger.debug('Node execution event received:', nodeEventData);
      
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
      logger.info(`Starting single node execution: ${nodeId} in workflow ${workflowId} for user ${userId}`);

      // Verify workflow belongs to user
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId
        }
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            message: 'Workflow not found',
            timestamp: new Date()
          }
        };
      }

      // Parse nodes from JSON
      const workflowNodes = Array.isArray(workflow.nodes) ? workflow.nodes : JSON.parse(workflow.nodes as string);
      
      // Find the specific node
      const node = workflowNodes.find((n: any) => n.id === nodeId);
      if (!node) {
        return {
          success: false,
          error: {
            message: 'Node not found in workflow',
            timestamp: new Date()
          }
        };
      }

      // Check if node can be executed individually (trigger nodes)
      const nodeTypeInfo = await this.nodeService.getNodeSchema(node.type);
      if (!nodeTypeInfo) {
        return {
          success: false,
          error: {
            message: `Unknown node type: ${node.type}`,
            timestamp: new Date()
          }
        };
      }

      // For now, only allow trigger nodes to be executed individually
      const triggerNodeTypes = ['manual-trigger', 'webhook-trigger'];
      if (!triggerNodeTypes.includes(node.type)) {
        return {
          success: false,
          error: {
            message: 'Only trigger nodes can be executed individually',
            timestamp: new Date()
          }
        };
      }

      // Prepare node parameters (merge defaults with provided parameters)
      const nodeParameters = {
        ...nodeTypeInfo.defaults,
        ...node.parameters,
        ...(parameters || {})
      };

      // Prepare input data for the node
      const nodeInputData = inputData || { main: [[]] };

      // Execute the node using NodeService
      const executionResult = await this.nodeService.executeNode(
        node.type,
        nodeParameters,
        nodeInputData,
        undefined, // credentials - TODO: implement credential handling
        `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );

      if (!executionResult.success) {
        return {
          success: false,
          error: {
            message: executionResult.error?.message || 'Node execution failed',
            timestamp: new Date()
          }
        };
      }

      // Create a single node execution record for tracking
      const singleNodeExecution = await this.prisma.singleNodeExecution.create({
        data: {
          id: `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workflowId,
          nodeId,
          nodeType: node.type,
          status: 'SUCCESS',
          startedAt: new Date(),
          finishedAt: new Date(),
          inputData: nodeInputData,
          outputData: executionResult.data,
          parameters: nodeParameters,
          userId
        }
      });

      logger.info(`Single node execution completed: ${nodeId}`);

      return {
        success: true,
        data: {
          executionId: singleNodeExecution.id,
          nodeId,
          status: 'success',
          data: executionResult.data,
          startTime: singleNodeExecution.startedAt.getTime(),
          endTime: singleNodeExecution.finishedAt?.getTime() || Date.now(),
          duration: (singleNodeExecution.finishedAt?.getTime() || Date.now()) - singleNodeExecution.startedAt.getTime()
        }
      };
    } catch (error) {
      logger.error(`Failed to execute single node ${nodeId}:`, error);
      
      // Try to create a failed execution record
      try {
        await this.prisma.singleNodeExecution.create({
          data: {
            id: `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflowId,
            nodeId,
            nodeType: 'unknown',
            status: 'ERROR',
            startedAt: new Date(),
            finishedAt: new Date(),
            inputData: inputData || {},
            outputData: {},
            parameters: parameters || {},
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
          }
        });
      } catch (recordError) {
        logger.error('Failed to create failed execution record:', recordError);
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
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
   * Shutdown the execution service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down execution service...');
    await this.executionEngine.shutdown();
    logger.info('Execution service shutdown complete');
  }
}