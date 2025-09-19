import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import {
  ExecutionQuerySchema,
  IdParamSchema,
  ApiResponse
} from '../types/api';

const router = Router();
const prisma = new PrismaClient();

// GET /api/executions - List executions
router.get(
  '/',
  authenticateToken,
  validateQuery(ExecutionQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, workflowId, status, startedAfter, startedBefore, sortBy = 'startedAt', sortOrder = 'desc' } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {
      workflow: {
        userId: req.user!.id
      }
    };

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (status) {
      where.status = status;
    }

    if (startedAfter || startedBefore) {
      where.startedAt = {};
      if (startedAfter) where.startedAt.gte = new Date(startedAfter);
      if (startedBefore) where.startedAt.lte = new Date(startedBefore);
    }

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          workflow: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.execution.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      data: executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
    const execution = await prisma.execution.findFirst({
      where: {
        id: req.params.id,
        workflow: {
          userId: req.user!.id
        }
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true
          }
        },
        nodeExecutions: {
          orderBy: {
            startedAt: 'asc'
          }
        }
      }
    });

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

// DELETE /api/executions/:id - Delete execution
router.delete(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const execution = await prisma.execution.findFirst({
      where: {
        id: req.params.id,
        workflow: {
          userId: req.user!.id
        }
      }
    });

    if (!execution) {
      throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
    }

    // Don't allow deletion of running executions
    if (execution.status === 'RUNNING') {
      throw new AppError('Cannot delete running execution', 400, 'EXECUTION_RUNNING');
    }

    await prisma.execution.delete({
      where: { id: req.params.id }
    });

    const response: ApiResponse = {
      success: true,
      data: { message: 'Execution deleted successfully' }
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
    const execution = await prisma.execution.findFirst({
      where: {
        id: req.params.id,
        workflow: {
          userId: req.user!.id
        }
      }
    });

    if (!execution) {
      throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
    }

    if (execution.status !== 'RUNNING') {
      throw new AppError('Can only cancel running executions', 400, 'EXECUTION_NOT_RUNNING');
    }

    // Update execution status to cancelled
    const updatedExecution = await prisma.execution.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date()
      }
    });

    // TODO: Implement actual execution cancellation logic in execution engine

    const response: ApiResponse = {
      success: true,
      data: updatedExecution
    };

    res.json(response);
  })
);

export { router as executionRoutes };