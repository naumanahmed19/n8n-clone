import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { TriggerService } from '../services/TriggerService';
import { WorkflowService } from '../services/WorkflowService';
import { ExecutionService } from '../services/ExecutionService';
import ExecutionHistoryService from '../services/ExecutionHistoryService';
import { SocketService } from '../services/SocketService';
import { NodeService } from '../services/NodeService';
import { AppError } from '../middleware/errorHandler';
import { body, param, query, validationResult } from 'express-validator';
import { createServer } from 'http';

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const workflowService = new WorkflowService(prisma);
const nodeService = new NodeService(prisma);
const executionHistoryService = new ExecutionHistoryService(prisma);
const executionService = new ExecutionService(prisma, nodeService, executionHistoryService);
const httpServer = createServer();
const socketService = new SocketService(httpServer);
const triggerService = new TriggerService(prisma, workflowService, executionService, socketService, nodeService, executionHistoryService);

// Initialize trigger service
triggerService.initialize().catch(console.error);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }
  next();
};

// Create trigger
router.post('/workflows/:workflowId/triggers',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    body('type').isIn(['webhook', 'schedule', 'manual']).withMessage('Invalid trigger type'),
    body('nodeId').isString().notEmpty().withMessage('Node ID is required'),
    body('settings').isObject().withMessage('Settings must be an object'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId } = req.params;
    const userId = req.user!.id;
    const triggerData = req.body;

    const trigger = await triggerService.createTrigger(workflowId, userId, {
      ...triggerData,
      workflowId,
      active: triggerData.active ?? true
    });

    res.status(201).json({
      success: true,
      data: trigger
    });
  })
);

// Update trigger
router.put('/workflows/:workflowId/triggers/:triggerId',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    param('triggerId').isUUID().withMessage('Invalid trigger ID'),
    body('type').optional().isIn(['webhook', 'schedule', 'manual']).withMessage('Invalid trigger type'),
    body('nodeId').optional().isString().notEmpty().withMessage('Node ID must be a string'),
    body('settings').optional().isObject().withMessage('Settings must be an object'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId, triggerId } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const trigger = await triggerService.updateTrigger(workflowId, triggerId, userId, updates);

    res.json({
      success: true,
      data: trigger
    });
  })
);

// Delete trigger
router.delete('/workflows/:workflowId/triggers/:triggerId',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    param('triggerId').isUUID().withMessage('Invalid trigger ID')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId, triggerId } = req.params;
    const userId = req.user!.id;

    await triggerService.deleteTrigger(workflowId, triggerId, userId);

    res.json({
      success: true,
      message: 'Trigger deleted successfully'
    });
  })
);

// Execute manual trigger
router.post('/workflows/:workflowId/triggers/:triggerId/execute',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    param('triggerId').isUUID().withMessage('Invalid trigger ID'),
    body('data').optional().isObject().withMessage('Data must be an object')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId, triggerId } = req.params;
    const userId = req.user!.id;
    const { data } = req.body;

    const result = await triggerService.handleManualTrigger(workflowId, triggerId, userId, data);

    if (result.success) {
      res.json({
        success: true,
        data: {
          executionId: result.executionId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  })
);

// Get trigger events
router.get('/workflows/:workflowId/triggers/events',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID'),
    query('type').optional().isIn(['webhook', 'schedule', 'manual']).withMessage('Invalid trigger type'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId } = req.params;
    const userId = req.user!.id;
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0
    };

    const events = await triggerService.getTriggerEvents(workflowId, userId, filters);

    res.json({
      success: true,
      data: events
    });
  })
);

// Get trigger statistics
router.get('/workflows/:workflowId/triggers/stats',
  authenticateToken,
  [
    param('workflowId').isUUID().withMessage('Invalid workflow ID')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId } = req.params;
    const userId = req.user!.id;

    const stats = await triggerService.getTriggerStats(workflowId, userId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Webhook endpoint - handles incoming webhook requests
router.all('/webhooks/:webhookId',
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;
    
    const webhookRequest = {
      method: req.method,
      path: req.path,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, any>,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent')
    };

    const result = await triggerService.handleWebhookTrigger(webhookId, webhookRequest);

    if (result.success) {
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        executionId: result.executionId
      });
    } else {
      const statusCode = result.error?.includes('not found') ? 404 : 
                        result.error?.includes('authentication') ? 401 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
  })
);

// Test webhook endpoint - for testing webhook configuration
router.post('/webhooks/:webhookId/test',
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;
    
    const testRequest = {
      method: 'POST',
      path: req.path,
      headers: { 'content-type': 'application/json', ...(req.headers as any) },
      query: req.query as Record<string, any>,
      body: req.body || { test: true, timestamp: new Date().toISOString() },
      ip: req.ip || 'test',
      userAgent: 'Webhook Test'
    };

    const result = await triggerService.handleWebhookTrigger(webhookId, testRequest);

    res.json({
      success: result.success,
      message: result.success ? 'Webhook test successful' : 'Webhook test failed',
      error: result.error,
      executionId: result.executionId
    });
  })
);

export default router;