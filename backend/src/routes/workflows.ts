import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '../services/WorkflowService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  WorkflowQuerySchema,
  IdParamSchema,
  ApiResponse
} from '../types/api';

const router = Router();
const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

// GET /api/workflows - List workflows
router.get(
  '/',
  authenticateToken,
  validateQuery(WorkflowQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await workflowService.listWorkflows(req.user!.id, req.query as any);
    
    const response: ApiResponse = {
      success: true,
      data: result.workflows,
      pagination: result.pagination
    };
    
    res.json(response);
  })
);

// POST /api/workflows - Create workflow
router.post(
  '/',
  authenticateToken,
  validateBody(CreateWorkflowSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workflow = await workflowService.createWorkflow(req.user!.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: workflow
    };
    
    res.status(201).json(response);
  })
);

// GET /api/workflows/:id - Get workflow by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      data: workflow
    };
    
    res.json(response);
  })
);

// PUT /api/workflows/:id - Update workflow
router.put(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  validateBody(UpdateWorkflowSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.user!.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      data: workflow
    };
    
    res.json(response);
  })
);

// DELETE /api/workflows/:id - Delete workflow
router.delete(
  '/:id',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await workflowService.deleteWorkflow(req.params.id, req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Workflow deleted successfully' }
    };
    
    res.json(response);
  })
);

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post(
  '/:id/duplicate',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.body;
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user!.id, name);
    
    const response: ApiResponse = {
      success: true,
      data: workflow
    };
    
    res.status(201).json(response);
  })
);

// POST /api/workflows/:id/validate - Validate workflow
router.post(
  '/:id/validate',
  authenticateToken,
  validateParams(IdParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const workflow = await workflowService.getWorkflow(req.params.id, req.user!.id);
    const validation = await workflowService.validateWorkflow(workflow);
    
    const response: ApiResponse = {
      success: true,
      data: validation
    };
    
    res.json(response);
  })
);

export { router as workflowRoutes };