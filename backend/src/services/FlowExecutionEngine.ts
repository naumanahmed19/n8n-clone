import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { NodeService } from './NodeService';
import { DependencyResolver } from './DependencyResolver';
import ExecutionHistoryService from './ExecutionHistoryService';
import {
  Connection,
  NodeExecutionStatus,
  Workflow
} from '../types/database';
import { NodeInputData, NodeOutputData } from '../types/node.types';
import { v4 as uuidv4 } from 'uuid';

export interface FlowExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerNodeId?: string;
  triggerData?: any;
  executionOptions: FlowExecutionOptions;
  nodeStates: Map<string, NodeExecutionState>;
  executionPath: string[];
  startTime: number;
  cancelled: boolean;
  paused: boolean;
}

export interface FlowExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  saveProgress?: boolean;
  saveData?: boolean;
  manual?: boolean;
  isolatedExecution?: boolean;
}

// Status mapping between design document and Prisma enum
export enum FlowNodeStatus {
  IDLE = 'idle',
  QUEUED = 'queued', 
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

export interface NodeExecutionState {
  nodeId: string;
  status: FlowNodeStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress?: number;
  error?: any;
  inputData?: NodeInputData;
  outputData?: NodeOutputData[];
  dependencies: string[];
  dependents: string[];
}

export interface FlowExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'partial';
  executedNodes: string[];
  failedNodes: string[];
  executionPath: string[];
  totalDuration: number;
  nodeResults: Map<string, NodeExecutionResult>;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: FlowNodeStatus;
  data?: NodeOutputData[];
  error?: any;
  duration: number;
}

export interface ExecutionFlowStatus {
  executionId: string;
  overallStatus: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: number;
  nodeStates: Map<string, NodeExecutionState>;
  currentlyExecuting: string[];
  completedNodes: string[];
  failedNodes: string[];
  queuedNodes: string[];
  executionPath: string[];
  estimatedTimeRemaining?: number;
}

/**
 * FlowExecutionEngine handles the execution of workflow flows with proper dependency resolution
 * and cascade execution from any node to all connected downstream nodes.
 */
export class FlowExecutionEngine extends EventEmitter {
  private prisma: PrismaClient;
  private nodeService: NodeService;
  private executionHistoryService: ExecutionHistoryService;
  private dependencyResolver: DependencyResolver;
  private activeExecutions: Map<string, FlowExecutionContext> = new Map();
  private nodeQueue: Map<string, string[]> = new Map();

  constructor(prisma: PrismaClient, nodeService: NodeService, executionHistoryService: ExecutionHistoryService) {
    super();
    this.prisma = prisma;
    this.nodeService = nodeService;
    this.executionHistoryService = executionHistoryService;
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Execute workflow flow starting from a specific node
   */
  async executeFromNode(
    nodeId: string,
    workflowId: string,
    userId: string,
    inputData?: NodeInputData,
    options: FlowExecutionOptions = {}
  ): Promise<FlowExecutionResult> {
    const executionId = uuidv4();
    
    try {
      const context = await this.createExecutionContext(
        executionId,
        workflowId,
        userId,
        nodeId,
        inputData,
        options
      );

      const workflow = await this.loadWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      await this.initializeNodeStates(context, workflow, nodeId);
      const result = await this.executeFlow(context, workflow);

      return result;
    } catch (error) {
      logger.error('Flow execution failed', { executionId, nodeId, error });
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
      this.nodeQueue.delete(executionId);
    }
  }

  /**
   * Execute workflow flow starting from a trigger
   */
  async executeFromTrigger(
    triggerId: string,
    workflowId: string,
    userId: string,
    triggerData?: any,
    options: FlowExecutionOptions = {}
  ): Promise<FlowExecutionResult> {
    const executionId = uuidv4();
    
    try {
      const context = await this.createExecutionContext(
        executionId,
        workflowId,
        userId,
        triggerId,
        triggerData,
        { ...options, manual: false }
      );

      const workflow = await this.loadWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const triggerNode = workflow.nodes.find(node => node.id === triggerId);
      if (!triggerNode) {
        throw new Error(`Trigger node ${triggerId} not found in workflow`);
      }

      await this.initializeNodeStates(context, workflow, triggerId);
      const result = await this.executeFlow(context, workflow);

      return result;
    } catch (error) {
      logger.error('Trigger execution failed', { executionId, triggerId, error });
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
      this.nodeQueue.delete(executionId);
    }
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(executionId: string): ExecutionFlowStatus | null {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      return null;
    }

    const nodeStates = context.nodeStates;
    const completedNodes = Array.from(nodeStates.entries())
      .filter(([_, state]) => state.status === FlowNodeStatus.COMPLETED)
      .map(([nodeId, _]) => nodeId);
    
    const failedNodes = Array.from(nodeStates.entries())
      .filter(([_, state]) => state.status === FlowNodeStatus.FAILED)
      .map(([nodeId, _]) => nodeId);
    
    const currentlyExecuting = Array.from(nodeStates.entries())
      .filter(([_, state]) => state.status === FlowNodeStatus.RUNNING)
      .map(([nodeId, _]) => nodeId);
    
    const queuedNodes = this.nodeQueue.get(executionId) || [];
    const totalNodes = nodeStates.size;
    const progress = totalNodes > 0 ? (completedNodes.length / totalNodes) * 100 : 0;

    let overallStatus: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused' = 'running';
    if (context.cancelled) {
      overallStatus = 'cancelled';
    } else if (context.paused) {
      overallStatus = 'paused';
    } else if (failedNodes.length > 0 && currentlyExecuting.length === 0 && queuedNodes.length === 0) {
      overallStatus = 'failed';
    } else if (completedNodes.length === totalNodes) {
      overallStatus = 'completed';
    }

    return {
      executionId,
      overallStatus,
      progress,
      nodeStates,
      currentlyExecuting,
      completedNodes,
      failedNodes,
      queuedNodes,
      executionPath: context.executionPath
    };
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    context.cancelled = true;
    this.nodeQueue.set(executionId, []);
    
    logger.info('Execution cancelled', { executionId });
    this.emit('executionCancelled', { executionId });
  }

  /**
   * Pause an active execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    context.paused = true;
    
    logger.info('Execution paused', { executionId });
    this.emit('executionPaused', { executionId });
  }

  /**
   * Resume a paused execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    context.paused = false;
    
    logger.info('Execution resumed', { executionId });
    this.emit('executionResumed', { executionId });
  }

  /**
   * Get the dependency resolver instance for external use
   */
  getDependencyResolver(): DependencyResolver {
    return this.dependencyResolver;
  }

  private async createExecutionContext(
    executionId: string,
    workflowId: string,
    userId: string,
    triggerNodeId?: string,
    triggerData?: any,
    options: FlowExecutionOptions = {}
  ): Promise<FlowExecutionContext> {
    const context: FlowExecutionContext = {
      executionId,
      workflowId,
      userId,
      triggerNodeId,
      triggerData,
      executionOptions: {
        timeout: 300000,
        maxRetries: 3,
        retryDelay: 1000,
        saveProgress: true,
        saveData: true,
        manual: true,
        isolatedExecution: false,
        ...options
      },
      nodeStates: new Map(),
      executionPath: [],
      startTime: Date.now(),
      cancelled: false,
      paused: false
    };

    this.activeExecutions.set(executionId, context);
    this.nodeQueue.set(executionId, []);

    return context;
  }

  private async loadWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        return null;
      }

      // Parse JSON fields to match the Workflow interface
      const parsedWorkflow: Workflow = {
        ...workflow,
        description: workflow.description || undefined,
        nodes: Array.isArray(workflow.nodes) ? workflow.nodes : JSON.parse(workflow.nodes as string),
        connections: Array.isArray(workflow.connections) ? workflow.connections : JSON.parse(workflow.connections as string),
        triggers: Array.isArray(workflow.triggers) ? workflow.triggers : JSON.parse(workflow.triggers as string),
        settings: typeof workflow.settings === 'object' ? workflow.settings : JSON.parse(workflow.settings as string)
      };

      return parsedWorkflow;
    } catch (error) {
      logger.error('Failed to load workflow', { workflowId, error });
      return null;
    }
  }

  private async initializeNodeStates(
    context: FlowExecutionContext,
    workflow: Workflow,
    startNodeId: string
  ): Promise<void> {
    // Validate workflow structure before execution with enhanced safety checks
    const nodeIds = workflow.nodes.map(node => node.id);
    
    logger.debug('Workflow structure analysis', {
      executionId: context.executionId,
      nodeCount: workflow.nodes.length,
      connectionCount: workflow.connections.length,
      nodeIds: nodeIds,
      connections: workflow.connections.map(conn => ({
        source: conn.sourceNodeId,
        target: conn.targetNodeId,
        sourceOutput: conn.sourceOutput,
        targetInput: conn.targetInput
      }))
    });
    
    try {
      // Use enhanced validation that throws specific error types
      this.dependencyResolver.validateExecutionSafety(nodeIds, workflow.connections, context.executionPath);
    } catch (error: any) {
      logger.error('Workflow execution safety validation failed', {
        executionId: context.executionId,
        error: error.message,
        errorType: error.flowErrorType || 'UNKNOWN'
      });
      throw error;
    }

    // Also run the general validation for warnings
    const validationResult = this.dependencyResolver.validateExecutionPath(nodeIds, workflow.connections);
    if (validationResult.warnings.length > 0) {
      logger.warn('Workflow validation warnings', { warnings: validationResult.warnings });
    }

    for (const node of workflow.nodes) {
      const dependencies = this.dependencyResolver.getDependencies(node.id, workflow.connections);
      const dependents = this.dependencyResolver.getDownstreamNodes(node.id, workflow.connections);

      logger.debug('Initializing node state', {
        nodeId: node.id,
        nodeType: node.type,
        dependencies,
        dependents,
        executionId: context.executionId
      });

      const nodeState: NodeExecutionState = {
        nodeId: node.id,
        status: FlowNodeStatus.IDLE,
        dependencies,
        dependents,
        progress: 0
      };

      context.nodeStates.set(node.id, nodeState);
    }

    const queue = this.nodeQueue.get(context.executionId) || [];
    queue.push(startNodeId);
    this.nodeQueue.set(context.executionId, queue);

    const startNodeState = context.nodeStates.get(startNodeId);
    if (startNodeState) {
      startNodeState.status = FlowNodeStatus.QUEUED;
    }
  }

  private async executeFlow(
    context: FlowExecutionContext,
    workflow: Workflow
  ): Promise<FlowExecutionResult> {
    const nodeResults = new Map<string, NodeExecutionResult>();
    const executedNodes: string[] = [];
    const failedNodes: string[] = [];

    while (!context.cancelled && !context.paused) {
      const queue = this.nodeQueue.get(context.executionId) || [];
      
      if (queue.length === 0) {
        logger.debug('No more nodes in queue, execution complete', {
          executionId: context.executionId,
          executedNodes: executedNodes.length,
          failedNodes: failedNodes.length
        });
        break;
      }

      const nodeId = queue.shift()!;
      this.nodeQueue.set(context.executionId, queue);

      const nodeState = context.nodeStates.get(nodeId);
      if (!nodeState) {
        logger.warn('Node state not found, skipping', { nodeId, executionId: context.executionId });
        continue;
      }

      const dependenciesSatisfied = this.areNodeDependenciesSatisfied(nodeId, context);
      if (!dependenciesSatisfied) {
        logger.debug('Node dependencies not satisfied, re-queuing', { 
          nodeId, 
          dependencies: nodeState.dependencies,
          executionId: context.executionId 
        });
        queue.push(nodeId);
        this.nodeQueue.set(context.executionId, queue);
        continue;
      }

      logger.info('Executing node', { 
        nodeId, 
        nodeType: workflow.nodes.find(n => n.id === nodeId)?.type,
        executionId: context.executionId 
      });

      // Log execution start
      const nodeName = workflow.nodes.find(n => n.id === nodeId)?.name || 'Unknown Node';
      this.executionHistoryService.addExecutionLog(
        context.executionId,
        'info',
        `Starting execution of node: ${nodeName}`,
        nodeId
      );

      try {
        const result = await this.executeNode(nodeId, context, workflow);
        nodeResults.set(nodeId, result);
        executedNodes.push(nodeId);
        context.executionPath.push(nodeId);

        nodeState.status = result.status;
        nodeState.endTime = Date.now();
        nodeState.duration = nodeState.endTime - (nodeState.startTime || nodeState.endTime);
        nodeState.outputData = result.data;
        nodeState.error = result.error;

        if (result.status === FlowNodeStatus.COMPLETED) {
          logger.info('Node execution completed successfully', { 
            nodeId,
            nodeType: workflow.nodes.find(n => n.id === nodeId)?.type,
            dependents: nodeState.dependents,
            executionId: context.executionId 
          });

          // Log execution completion
          const nodeName = workflow.nodes.find(n => n.id === nodeId)?.name || 'Unknown Node';
          this.executionHistoryService.addExecutionLog(
            context.executionId,
            'info',
            `Node execution completed successfully: ${nodeName}`,
            nodeId
          );

          await this.queueDependentNodes(nodeId, context, workflow);
          
          // Log the updated queue state
          const updatedQueue = this.nodeQueue.get(context.executionId) || [];
          logger.info('Updated execution queue after queuing dependents', {
            nodeId,
            queueLength: updatedQueue.length,
            queuedNodes: updatedQueue,
            executionId: context.executionId
          });
        } else if (result.status === FlowNodeStatus.FAILED) {
          failedNodes.push(nodeId);
          logger.error('Node execution failed', { 
            nodeId,
            error: result.error,
            executionId: context.executionId 
          });

          // Log execution failure
          const nodeName = workflow.nodes.find(n => n.id === nodeId)?.name || 'Unknown Node';
          const errorMessage = result.error instanceof Error ? result.error.message : String(result.error || 'Unknown error');
          this.executionHistoryService.addExecutionLog(
            context.executionId,
            'error',
            `Node execution failed: ${nodeName} - ${errorMessage}`,
            nodeId
          );
        }

        this.emit('nodeExecuted', {
          executionId: context.executionId,
          nodeId,
          status: result.status,
          result
        });

      } catch (error) {
        logger.error('Node execution failed with exception', { nodeId, error, executionId: context.executionId });
        nodeState.status = FlowNodeStatus.FAILED;
        nodeState.error = error;
        failedNodes.push(nodeId);

        const result: NodeExecutionResult = {
          nodeId,
          status: FlowNodeStatus.FAILED,
          error,
          duration: 0
        };
        nodeResults.set(nodeId, result);
      }
    }

    let finalStatus: 'completed' | 'failed' | 'cancelled' | 'partial' = 'completed';
    if (context.cancelled) {
      finalStatus = 'cancelled';
    } else if (failedNodes.length > 0) {
      finalStatus = executedNodes.length > failedNodes.length ? 'partial' : 'failed';
    }

    const totalDuration = Date.now() - context.startTime;

    const result: FlowExecutionResult = {
      executionId: context.executionId,
      status: finalStatus,
      executedNodes,
      failedNodes,
      executionPath: context.executionPath,
      totalDuration,
      nodeResults
    };

    this.emit('flowExecutionCompleted', result);
    return result;
  }

  private async executeNode(
    nodeId: string,
    context: FlowExecutionContext,
    workflow: Workflow
  ): Promise<NodeExecutionResult> {
    const nodeState = context.nodeStates.get(nodeId);
    if (!nodeState) {
      throw new Error(`Node state not found for ${nodeId}`);
    }

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in workflow`);
    }

    nodeState.status = FlowNodeStatus.RUNNING;
    nodeState.startTime = Date.now();
    nodeState.progress = 0;

    this.emit('nodeStarted', {
      executionId: context.executionId,
      nodeId,
      node
    });

    try {
      const inputData = await this.collectNodeInputData(nodeId, context, workflow);
      nodeState.inputData = inputData;

      const nodeResult = await this.nodeService.executeNode(
        node.type,
        node.parameters,
        inputData,
        node.credentials ? {} : undefined, // TODO: Load actual credentials
        context.executionId
      );

      if (!nodeResult.success) {
        throw new Error(nodeResult.error?.message || 'Node execution failed');
      }

      const outputData = nodeResult.data || [];

      const result: NodeExecutionResult = {
        nodeId,
        status: FlowNodeStatus.COMPLETED,
        data: outputData,
        duration: Date.now() - nodeState.startTime!
      };

      return result;

    } catch (error) {
      const result: NodeExecutionResult = {
        nodeId,
        status: FlowNodeStatus.FAILED,
        error,
        duration: Date.now() - nodeState.startTime!
      };

      return result;
    }
  }

  private areNodeDependenciesSatisfied(nodeId: string, context: FlowExecutionContext): boolean {
    const nodeState = context.nodeStates.get(nodeId);
    if (!nodeState) {
      logger.warn('Node state not found when checking dependencies', { nodeId, executionId: context.executionId });
      return false;
    }

    logger.debug('Checking node dependencies', {
      nodeId,
      dependencies: nodeState.dependencies,
      executionId: context.executionId
    });

    for (const depNodeId of nodeState.dependencies) {
      const depState = context.nodeStates.get(depNodeId);
      if (!depState || depState.status !== FlowNodeStatus.COMPLETED) {
        logger.debug('Dependency not satisfied', {
          nodeId,
          dependencyNodeId: depNodeId,
          dependencyStatus: depState?.status || 'NO_STATE',
          executionId: context.executionId
        });
        return false;
      }
    }

    logger.debug('All dependencies satisfied', { nodeId, executionId: context.executionId });
    return true;
  }

  private async queueDependentNodes(
    nodeId: string,
    context: FlowExecutionContext,
    workflow: Workflow
  ): Promise<void> {
    const nodeState = context.nodeStates.get(nodeId);
    if (!nodeState) {
      logger.warn('Node state not found when queuing dependents', { nodeId, executionId: context.executionId });
      return;
    }

    const queue = this.nodeQueue.get(context.executionId) || [];
    let queuedCount = 0;

    logger.debug('Queuing dependent nodes', {
      nodeId,
      dependents: nodeState.dependents,
      currentQueueLength: queue.length,
      executionId: context.executionId
    });

    for (const dependentNodeId of nodeState.dependents) {
      const dependentState = context.nodeStates.get(dependentNodeId);
      if (dependentState && 
          dependentState.status === FlowNodeStatus.IDLE && 
          !queue.includes(dependentNodeId)) {
        
        queue.push(dependentNodeId);
        dependentState.status = FlowNodeStatus.QUEUED;
        queuedCount++;

        logger.info('Queued dependent node', {
          sourceNodeId: nodeId,
          dependentNodeId,
          dependentNodeType: workflow.nodes.find(n => n.id === dependentNodeId)?.type,
          executionId: context.executionId
        });
      } else {
        logger.debug('Skipping dependent node', {
          dependentNodeId,
          reason: !dependentState ? 'no state' : 
                  dependentState.status !== FlowNodeStatus.IDLE ? `status: ${dependentState.status}` :
                  queue.includes(dependentNodeId) ? 'already queued' : 'unknown',
          currentStatus: dependentState?.status,
          executionId: context.executionId
        });
      }
    }

    this.nodeQueue.set(context.executionId, queue);

    logger.info('Completed queuing dependent nodes', {
      nodeId,
      queuedCount,
      newQueueLength: queue.length,
      totalDependents: nodeState.dependents.length,
      executionId: context.executionId
    });
  }

  private async collectNodeInputData(
    nodeId: string,
    context: FlowExecutionContext,
    workflow: Workflow
  ): Promise<NodeInputData> {
    const inputData: NodeInputData = { main: [[]] };

    const incomingConnections = workflow.connections.filter(
      conn => conn.targetNodeId === nodeId
    );

    if (incomingConnections.length === 0) {
      if (context.triggerData) {
        inputData.main = [[context.triggerData]];
      }
      return inputData;
    }

    const collectedData: any[] = [];
    for (const connection of incomingConnections) {
      const sourceNodeState = context.nodeStates.get(connection.sourceNodeId);
      if (sourceNodeState && sourceNodeState.outputData) {
        const outputData = sourceNodeState.outputData.find(
          output => output[connection.sourceOutput]
        );
        if (outputData && outputData[connection.sourceOutput]) {
          const sourceOutput = outputData[connection.sourceOutput];
          if (Array.isArray(sourceOutput)) {
            collectedData.push(...sourceOutput);
          } else {
            collectedData.push(sourceOutput);
          }
        }
      }
    }

    if (collectedData.length > 0) {
      inputData.main = [collectedData];
    }

    return inputData;
  }


}