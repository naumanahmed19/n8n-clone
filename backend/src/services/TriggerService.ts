import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { WorkflowService } from './WorkflowService';
import { ExecutionService } from './ExecutionService';
import { SocketService } from './SocketService';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface TriggerDefinition {
  id: string;
  type: 'webhook' | 'schedule' | 'manual';
  workflowId: string;
  nodeId: string;
  settings: TriggerSettings;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerSettings {
  // Webhook settings
  webhookId?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path?: string;
  authentication?: {
    type: 'none' | 'basic' | 'header' | 'query';
    settings?: Record<string, any>;
  };
  
  // Schedule settings
  cronExpression?: string;
  timezone?: string;
  
  // Manual settings (no specific settings needed)
  
  // Common settings
  description?: string;
  tags?: string[];
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  workflowId: string;
  type: 'webhook' | 'schedule' | 'manual';
  data: any;
  timestamp: Date;
  executionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface WebhookRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  ip: string;
  userAgent?: string;
}

export class TriggerService {
  private prisma: PrismaClient;
  private workflowService: WorkflowService;
  private executionService: ExecutionService;
  private socketService: SocketService;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private webhookTriggers: Map<string, TriggerDefinition> = new Map();

  constructor(
    prisma: PrismaClient,
    workflowService: WorkflowService,
    executionService: ExecutionService,
    socketService: SocketService
  ) {
    this.prisma = prisma;
    this.workflowService = workflowService;
    this.executionService = executionService;
    this.socketService = socketService;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing TriggerService...');
    
    // Load all active triggers from database and activate them
    await this.loadActiveTriggers();
    
    logger.info('TriggerService initialized successfully');
  }

  private async loadActiveTriggers(): Promise<void> {
    try {
      // Get all active workflows with triggers
      const workflows = await this.prisma.workflow.findMany({
        where: { active: true },
        select: {
          id: true,
          userId: true,
          triggers: true
        }
      });

      for (const workflow of workflows) {
        const triggers = workflow.triggers as any[];
        if (triggers && triggers.length > 0) {
          for (const trigger of triggers) {
            if (trigger.active) {
              await this.activateTrigger(workflow.id, trigger);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error loading active triggers:', error);
      throw new AppError('Failed to load active triggers', 500, 'TRIGGER_LOAD_ERROR');
    }
  }

  async createTrigger(workflowId: string, userId: string, triggerData: Omit<TriggerDefinition, 'id' | 'workflowId' | 'createdAt' | 'updatedAt'>): Promise<TriggerDefinition> {
    try {
      // Verify workflow exists and belongs to user
      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      
      // Validate trigger settings
      this.validateTriggerSettings(triggerData.type, triggerData.settings);

      // Generate unique ID for trigger
      const triggerId = uuidv4();
      
      // Create trigger definition
      const trigger: TriggerDefinition = {
        id: triggerId,
        workflowId,
        nodeId: triggerData.nodeId,
        type: triggerData.type,
        settings: triggerData.settings,
        active: triggerData.active,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update workflow with new trigger
      const currentTriggers = (workflow.triggers as any[]) || [];
      const updatedTriggers = [...currentTriggers, trigger];

      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          triggers: updatedTriggers,
          updatedAt: new Date()
        }
      });

      // Activate trigger if it's active and workflow is active
      if (trigger.active && workflow.active) {
        await this.activateTrigger(workflowId, trigger);
      }

      logger.info(`Created trigger ${triggerId} for workflow ${workflowId}`);
      return trigger;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating trigger:', error);
      throw new AppError('Failed to create trigger', 500, 'TRIGGER_CREATE_ERROR');
    }
  }

  async updateTrigger(workflowId: string, triggerId: string, userId: string, updates: Partial<TriggerDefinition>): Promise<TriggerDefinition> {
    try {
      // Get workflow and verify ownership
      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      const triggers = (workflow.triggers as any[]) || [];
      
      const triggerIndex = triggers.findIndex(t => t.id === triggerId);
      if (triggerIndex === -1) {
        throw new AppError('Trigger not found', 404, 'TRIGGER_NOT_FOUND');
      }

      const currentTrigger = triggers[triggerIndex];
      
      // Validate updated settings if provided
      if (updates.settings) {
        this.validateTriggerSettings(updates.type || currentTrigger.type, updates.settings);
      }

      // Update trigger
      const updatedTrigger = {
        ...currentTrigger,
        ...updates,
        updatedAt: new Date()
      };

      triggers[triggerIndex] = updatedTrigger;

      // Update workflow
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          triggers: triggers,
          updatedAt: new Date()
        }
      });

      // Handle activation/deactivation
      if (updates.active !== undefined) {
        if (updates.active && workflow.active) {
          await this.activateTrigger(workflowId, updatedTrigger);
        } else {
          await this.deactivateTrigger(triggerId);
        }
      }

      logger.info(`Updated trigger ${triggerId} for workflow ${workflowId}`);
      return updatedTrigger;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating trigger:', error);
      throw new AppError('Failed to update trigger', 500, 'TRIGGER_UPDATE_ERROR');
    }
  }

  async deleteTrigger(workflowId: string, triggerId: string, userId: string): Promise<void> {
    try {
      // Get workflow and verify ownership
      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      const triggers = (workflow.triggers as any[]) || [];
      
      const triggerIndex = triggers.findIndex(t => t.id === triggerId);
      if (triggerIndex === -1) {
        throw new AppError('Trigger not found', 404, 'TRIGGER_NOT_FOUND');
      }

      // Deactivate trigger first
      await this.deactivateTrigger(triggerId);

      // Remove trigger from workflow
      triggers.splice(triggerIndex, 1);

      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          triggers: triggers,
          updatedAt: new Date()
        }
      });

      logger.info(`Deleted trigger ${triggerId} from workflow ${workflowId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting trigger:', error);
      throw new AppError('Failed to delete trigger', 500, 'TRIGGER_DELETE_ERROR');
    }
  }

  async activateTrigger(workflowId: string, trigger: TriggerDefinition): Promise<void> {
    try {
      switch (trigger.type) {
        case 'webhook':
          await this.activateWebhookTrigger(trigger);
          break;
        case 'schedule':
          await this.activateScheduleTrigger(trigger);
          break;
        case 'manual':
          // Manual triggers don't need activation
          break;
        default:
          throw new AppError(`Unknown trigger type: ${trigger.type}`, 400, 'INVALID_TRIGGER_TYPE');
      }

      logger.info(`Activated ${trigger.type} trigger ${trigger.id} for workflow ${workflowId}`);
    } catch (error) {
      logger.error(`Error activating trigger ${trigger.id}:`, error);
      throw error;
    }
  }

  async deactivateTrigger(triggerId: string): Promise<void> {
    try {
      // Remove from webhook triggers
      if (this.webhookTriggers.has(triggerId)) {
        this.webhookTriggers.delete(triggerId);
      }

      // Remove from scheduled tasks
      if (this.scheduledTasks.has(triggerId)) {
        const task = this.scheduledTasks.get(triggerId);
        if (task) {
          task.stop();
        }
        this.scheduledTasks.delete(triggerId);
      }

      logger.info(`Deactivated trigger ${triggerId}`);
    } catch (error) {
      logger.error(`Error deactivating trigger ${triggerId}:`, error);
      throw error;
    }
  }

  private async activateWebhookTrigger(trigger: TriggerDefinition): Promise<void> {
    // Generate webhook ID if not exists
    if (!trigger.settings.webhookId) {
      trigger.settings.webhookId = uuidv4();
    }

    // Store webhook trigger for lookup
    if (trigger.settings.webhookId) {
      this.webhookTriggers.set(trigger.settings.webhookId, trigger);
    }
    
    logger.info(`Webhook trigger activated: ${trigger.settings.webhookId}`);
  }

  private async activateScheduleTrigger(trigger: TriggerDefinition): Promise<void> {
    const { cronExpression, timezone } = trigger.settings;
    
    if (!cronExpression) {
      throw new AppError('Cron expression is required for schedule triggers', 400, 'MISSING_CRON_EXPRESSION');
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new AppError('Invalid cron expression', 400, 'INVALID_CRON_EXPRESSION');
    }

    // Create scheduled task
    const task = cron.schedule(cronExpression, async () => {
      try {
        await this.handleScheduleTrigger(trigger);
      } catch (error) {
        logger.error(`Error executing scheduled trigger ${trigger.id}:`, error);
      }
    }, {
      scheduled: false,
      timezone: timezone || 'UTC'
    });

    // Store and start task
    this.scheduledTasks.set(trigger.id, task);
    task.start();

    logger.info(`Schedule trigger activated: ${trigger.id} with cron ${cronExpression}`);
  }

  async handleWebhookTrigger(webhookId: string, request: WebhookRequest): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const trigger = this.webhookTriggers.get(webhookId);
      if (!trigger) {
        throw new AppError('Webhook trigger not found', 404, 'WEBHOOK_NOT_FOUND');
      }

      // Validate authentication if configured
      if (trigger.settings.authentication && trigger.settings.authentication.type !== 'none') {
        const isAuthenticated = await this.validateWebhookAuthentication(trigger.settings.authentication, request);
        if (!isAuthenticated) {
          throw new AppError('Webhook authentication failed', 401, 'WEBHOOK_AUTH_FAILED');
        }
      }

      // Create trigger event
      const triggerEvent: TriggerEvent = {
        id: uuidv4(),
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        type: 'webhook',
        data: {
          method: request.method,
          headers: request.headers,
          query: request.query,
          body: request.body,
          ip: request.ip,
          userAgent: request.userAgent
        },
        timestamp: new Date(),
        status: 'pending'
      };

      // Log trigger event
      await this.logTriggerEvent(triggerEvent);

      // Execute workflow
      const execution = await this.executionService.executeWorkflow(trigger.workflowId, 'system', triggerEvent.data);
      
      if (!execution.success) {
        throw new Error(execution.error?.message || 'Execution failed');
      }

      const executionId = execution.data?.executionId;
      
      // Update trigger event with execution ID
      triggerEvent.executionId = executionId;
      triggerEvent.status = 'processing';
      await this.updateTriggerEvent(triggerEvent);

      // Emit real-time update
      this.socketService.emitToUser(trigger.workflowId, 'trigger-executed', {
        triggerId: trigger.id,
        executionId: executionId,
        type: 'webhook'
      });

      return { success: true, executionId: executionId };
    } catch (error) {
      logger.error(`Error handling webhook trigger ${webhookId}:`, error);
      return { 
        success: false, 
        error: error instanceof AppError ? error.message : 'Internal server error' 
      };
    }
  }

  private async handleScheduleTrigger(trigger: TriggerDefinition): Promise<void> {
    try {
      // Create trigger event
      const triggerEvent: TriggerEvent = {
        id: uuidv4(),
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        type: 'schedule',
        data: {
          scheduledAt: new Date(),
          cronExpression: trigger.settings.cronExpression,
          timezone: trigger.settings.timezone
        },
        timestamp: new Date(),
        status: 'pending'
      };

      // Log trigger event
      await this.logTriggerEvent(triggerEvent);

      // Execute workflow
      const execution = await this.executionService.executeWorkflow(trigger.workflowId, 'system', triggerEvent.data);
      
      if (!execution.success) {
        throw new Error(execution.error?.message || 'Execution failed');
      }

      const executionId = execution.data?.executionId;
      
      // Update trigger event
      triggerEvent.executionId = executionId;
      triggerEvent.status = 'processing';
      await this.updateTriggerEvent(triggerEvent);

      // Emit real-time update
      this.socketService.emitToUser(trigger.workflowId, 'trigger-executed', {
        triggerId: trigger.id,
        executionId: executionId,
        type: 'schedule'
      });

      logger.info(`Schedule trigger ${trigger.id} executed successfully`);
    } catch (error) {
      logger.error(`Error handling schedule trigger ${trigger.id}:`, error);
    }
  }

  async handleManualTrigger(workflowId: string, triggerId: string, userId: string, data?: any): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      // Verify workflow and trigger
      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      const triggers = (workflow.triggers as any[]) || [];
      const trigger = triggers.find(t => t.id === triggerId && t.type === 'manual');
      
      if (!trigger) {
        throw new AppError('Manual trigger not found', 404, 'MANUAL_TRIGGER_NOT_FOUND');
      }

      if (!trigger.active) {
        throw new AppError('Trigger is not active', 400, 'TRIGGER_NOT_ACTIVE');
      }

      // Create trigger event
      const triggerEvent: TriggerEvent = {
        id: uuidv4(),
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        type: 'manual',
        data: data || {},
        timestamp: new Date(),
        status: 'pending'
      };

      // Log trigger event
      await this.logTriggerEvent(triggerEvent);

      // Execute workflow
      const execution = await this.executionService.executeWorkflow(trigger.workflowId, userId, triggerEvent.data);
      
      if (!execution.success) {
        throw new Error(execution.error?.message || 'Execution failed');
      }

      const executionId = execution.data?.executionId;
      
      // Update trigger event
      triggerEvent.executionId = executionId;
      triggerEvent.status = 'processing';
      await this.updateTriggerEvent(triggerEvent);

      // Emit real-time update
      this.socketService.emitToUser(userId, 'trigger-executed', {
        triggerId: trigger.id,
        executionId: executionId,
        type: 'manual'
      });

      return { success: true, executionId: executionId };
    } catch (error) {
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      logger.error(`Error handling manual trigger:`, error);
      return { success: false, error: 'Internal server error' };
    }
  }

  private validateTriggerSettings(type: string, settings: TriggerSettings): void {
    switch (type) {
      case 'webhook':
        if (!settings.httpMethod) {
          throw new AppError('HTTP method is required for webhook triggers', 400, 'MISSING_HTTP_METHOD');
        }
        break;
      case 'schedule':
        if (!settings.cronExpression) {
          throw new AppError('Cron expression is required for schedule triggers', 400, 'MISSING_CRON_EXPRESSION');
        }
        if (!cron.validate(settings.cronExpression)) {
          throw new AppError('Invalid cron expression', 400, 'INVALID_CRON_EXPRESSION');
        }
        break;
      case 'manual':
        // No specific validation needed for manual triggers
        break;
      default:
        throw new AppError(`Unknown trigger type: ${type}`, 400, 'INVALID_TRIGGER_TYPE');
    }
  }

  private async validateWebhookAuthentication(auth: any, request: WebhookRequest): Promise<boolean> {
    switch (auth.type) {
      case 'basic':
        // Implement basic auth validation
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          return false;
        }
        // Add actual validation logic here
        return true;
      
      case 'header':
        // Implement header-based auth validation
        const headerName = auth.settings?.headerName;
        const expectedValue = auth.settings?.expectedValue;
        if (!headerName || !expectedValue) {
          return false;
        }
        return request.headers[headerName.toLowerCase()] === expectedValue;
      
      case 'query':
        // Implement query parameter auth validation
        const queryParam = auth.settings?.queryParam;
        const expectedQueryValue = auth.settings?.expectedValue;
        if (!queryParam || !expectedQueryValue) {
          return false;
        }
        return request.query[queryParam] === expectedQueryValue;
      
      default:
        return true;
    }
  }

  private async logTriggerEvent(event: TriggerEvent): Promise<void> {
    // For now, just log to console. In a real implementation,
    // you might want to store this in a separate table or logging system
    logger.info(`Trigger event: ${event.type} trigger ${event.triggerId} for workflow ${event.workflowId}`);
  }

  private async updateTriggerEvent(event: TriggerEvent): Promise<void> {
    // Update trigger event status
    logger.info(`Updated trigger event ${event.id} status to ${event.status}`);
  }

  async getTriggerEvents(workflowId: string, userId: string, filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TriggerEvent[]> {
    // This would typically query a trigger_events table
    // For now, return empty array as we're not storing events in DB yet
    return [];
  }

  async getTriggerStats(workflowId: string, userId: string): Promise<{
    totalTriggers: number;
    activeTriggers: number;
    triggersByType: Record<string, number>;
    recentEvents: number;
  }> {
    try {
      const workflow = await this.workflowService.getWorkflow(workflowId, userId);
      const triggers = (workflow.triggers as any[]) || [];
      
      const stats = {
        totalTriggers: triggers.length,
        activeTriggers: triggers.filter(t => t.active).length,
        triggersByType: triggers.reduce((acc, trigger) => {
          acc[trigger.type] = (acc[trigger.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentEvents: 0 // Would be calculated from trigger events table
      };

      return stats;
    } catch (error) {
      logger.error('Error getting trigger stats:', error);
      throw new AppError('Failed to get trigger statistics', 500, 'TRIGGER_STATS_ERROR');
    }
  }

  // Cleanup method to be called on service shutdown
  async cleanup(): Promise<void> {
    logger.info('Cleaning up TriggerService...');
    
    // Stop all scheduled tasks
    for (const [triggerId, task] of this.scheduledTasks) {
      try {
        task.stop();
      } catch (error) {
        logger.error(`Error stopping scheduled task ${triggerId}:`, error);
      }
    }
    
    this.scheduledTasks.clear();
    this.webhookTriggers.clear();
    
    logger.info('TriggerService cleanup completed');
  }
}