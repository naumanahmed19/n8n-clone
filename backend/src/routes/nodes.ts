import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NodeQuerySchema, ApiResponse } from '../types/api';
import { NodeService } from '../services/NodeService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const nodeService = new NodeService(prisma);

const router = Router();

// GET /api/nodes - List available node types
router.get(
  '/',
  authenticateToken,
  validateQuery(NodeQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 50, category, search, sortBy = 'displayName', sortOrder = 'asc' } = req.query as any;
    
    let nodeTypes = await nodeService.getNodeTypes();

    // Filter by category
    if (category) {
      nodeTypes = nodeTypes.filter(node => 
        node.group.includes(category)
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      nodeTypes = nodeTypes.filter(node =>
        node.displayName.toLowerCase().includes(searchLower) ||
        node.description.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower)
      );
    }

    // Sort nodes
    nodeTypes.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      
      if (sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    // Paginate
    const total = nodeTypes.length;
    const skip = (page - 1) * limit;
    const paginatedNodes = nodeTypes.slice(skip, skip + limit);

    const response: ApiResponse = {
      success: true,
      data: paginatedNodes,
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

// GET /api/nodes/categories - Get node categories
router.get(
  '/categories',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const nodeTypes = await nodeService.getNodeTypes();
    const categories = Array.from(
      new Set(nodeTypes.flatMap(node => node.group))
    ).sort();

    const response: ApiResponse = {
      success: true,
      data: categories.map(category => ({
        name: category,
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        count: nodeTypes.filter(node => node.group.includes(category)).length
      }))
    };

    res.json(response);
  })
);

// GET /api/nodes/:type - Get node type details
router.get(
  '/:type',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const nodeSchema = await nodeService.getNodeSchema(req.params.type);

    if (!nodeSchema) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NODE_TYPE_NOT_FOUND',
          message: 'Node type not found'
        }
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: nodeSchema
    };

    res.json(response);
  })
);

// POST /api/nodes/:type/execute - Test node execution
router.post(
  '/:type/execute',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { parameters = {}, inputData = { main: [[]] }, credentials = {} } = req.body;

    const result = await nodeService.executeNode(
      req.params.type,
      parameters,
      inputData,
      credentials
    );

    const response: ApiResponse = {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.error ? {
        code: 'NODE_EXECUTION_ERROR',
        message: result.error.message
      } : undefined
    };

    if (!result.success) {
      return res.status(400).json(response);
    }

    res.json(response);
  })
);

export { router as nodeRoutes };