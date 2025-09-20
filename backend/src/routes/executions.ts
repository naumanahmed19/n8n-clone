import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ExecutionService, NodeService } from '../services';
import {
  ExecutionQuerySchema,
  IdParamSchema,
  ApiResponse
} from '../types/api';

const router = Router();
const prisma = new PrismaClient();
const nodeService = new NodeService(prisma);
const executionService = new ExecutionService(prisma, nodeService);

// POST /api/executions - Execute a workflow
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { workflowId, triggerData, options } = req.body;

    if (!workflowId) {
      throw new AppError('Workflow ID is required', 400, 'MISSING_WORKFLOW_ID');
    }

    const result = await executionService.executeWorkflow(
      workflowId,
      req.user!.id,
      triggerData,
      options
    );

    if (!result.success) {
      throw new AppError(result.error!.message, 400, 'EXECUTION_FAILED');
    }

    const response: ApiResponse = {
      success: true,
      data: result.data
    };

    res.status(201).json(response);
  })
);

// GET /api/executions - List executions
router.get(
  '/',
  authenticateToken,
  validateQuery(ExecutionQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, workflowId, status, startedAfter, startedBefore } = req.query as any;
    const offset = (page - 1) * limit;

    const filters = {
      workflowId,
      status,
      startDate: startedAfter ? new Date(startedAfter) : undefined,
      endDate: startedBefore ? new Date(startedBefore) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset.toString())
    };

    const result = await executionService.listExecutions(req.user!.id, filters);

    const response: ApiResponse = {
      success: true,
      data: result.executions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };

    res.json(response);
  })
);

// GET /api/executions/:id - Get execution by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const execution = await executionService.getExecution(req.params.id, req.user!.id);

    if (!execution) {
      throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
    }

    const response: ApiResponse = {
      success: true,
      data: execution
    };

    res.json(response);
  })
);

// GET /api/executions/:id/progress - Get execution progress
router.get(
  '/:id/progress',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const progress = await executionService.getExecutionProgress(req.params.id, req.user!.id);

    if (!progress) {
      throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
    }

    const response: ApiResponse = {
      success: true,
      data: progress
    };

    res.json(response);
  })
);

// DELETE /api/executions/:id - Delete execution
router.delete(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await executionService.deleteExecution(req.params.id, req.user!.id);

    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode, 'EXECUTION_DELETE_FAILED');
    }

    const response: ApiResponse = {
      success: true,
      data: result.data
    };

    res.json(response);
  })
);

// POST /api/executions/:id/cancel - Cancel execution
router.post(
  '/:id/cancel',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await executionService.cancelExecution(req.params.id, req.user!.id);

    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode, 'EXECUTION_CANCEL_FAILED');
    }

    const response: ApiResponse = {
      success: true,
      data: result.data
    };

    res.json(response);
  })
);

// POST /api/executions/:id/retry - Retry execution
router.post(
  '/:id/retry',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await executionService.retryExecution(req.params.id, req.user!.id);

    if (!result.success) {
      const statusCode = result.error!.message.includes('not found') ? 404 : 400;
      throw new AppError(result.error!.message, statusCode, 'EXECUTION_RETRY_FAILED');
    }

    const response: ApiResponse = {
      success: true,
      data: result.data
    };

    res.status(201).json(response);
  })
);

// GET /api/executions/stats - Get execution statistics
router.get(
  '/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await executionService.getExecutionStats(req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  })
);

// GET /api/executions/realtime/info - Get real-time monitoring info
router.get(
  '/realtime/info',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const socketService = global.socketService;
    
    const response: ApiResponse = {
      success: true,
      data: {
        websocketUrl: `ws://localhost:${process.env.PORT || 4000}`,
        connectedUsers: socketService ? socketService.getConnectedUsersCount() : 0,
        supportedEvents: [
          'execution-event',
          'execution-progress', 
          'execution-log',
          'node-execution-event',
          'execution-status'
        ],
        subscriptionEvents: [
          'subscribe-execution',
          'unsubscribe-execution',
          'subscribe-workflow',
          'unsubscribe-workflow'
        ]
      }
    };

    res.json(response);
  })
);

// GET /api/executions/:id/subscribers - Get execution subscribers count
router.get(
  '/:id/subscribers',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const socketService = global.socketService;
    const subscribersCount = socketService ? 
      socketService.getExecutionSubscribersCount(req.params.id) : 0;

    const response: ApiResponse = {
      success: true,
      data: {
        executionId: req.params.id,
        subscribersCount
      }
    };

    res.json(response);
  })
);

// POST /api/executions/nodes/:nodeId - Execute a single node
router.post(
  '/nodes/:nodeId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { nodeId } = req.params;
    const { workflowId, inputData, parameters } = req.body;

    if (!workflowId) {
      throw new AppError('Workflow ID is required', 400, 'MISSING_WORKFLOW_ID');
    }

    if (!nodeId) {
      throw new AppError('Node ID is required', 400, 'MISSING_NODE_ID');
    }

    const result = await executionService.executeSingleNode(
      workflowId,
      nodeId,
      req.user!.id,
      inputData,
      parameters
    );

    if (!result.success) {
      throw new AppError(result.error!.message, 400, 'NODE_EXECUTION_FAILED');
    }

    const response: ApiResponse = {
      success: true,
      data: result.data
    };

    res.status(201).json(response);
  })
);

export { router as executionRoutes };