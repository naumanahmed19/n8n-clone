import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NodeQuerySchema, ApiResponse } from '../types/api';

const router = Router();

// Mock node types data - will be replaced with actual node service in later tasks
const mockNodeTypes = [
  {
    type: 'http-request',
    displayName: 'HTTP Request',
    name: 'httpRequest',
    group: ['transform'],
    version: 1,
    description: 'Make HTTP requests to any URL',
    icon: 'fa:globe',
    color: '#2196F3',
    defaults: {
      method: 'GET',
      url: '',
      headers: {},
      body: ''
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        required: true,
        default: 'GET',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        required: true,
        default: '',
        description: 'The URL to make the request to'
      }
    ]
  },
  {
    type: 'json',
    displayName: 'JSON',
    name: 'json',
    group: ['transform'],
    version: 1,
    description: 'Compose a JSON object',
    icon: 'fa:code',
    color: '#FF9800',
    defaults: {
      jsonData: '{}'
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'JSON Data',
        name: 'jsonData',
        type: 'json',
        required: true,
        default: '{}',
        description: 'The JSON data to output'
      }
    ]
  },
  {
    type: 'set',
    displayName: 'Set',
    name: 'set',
    group: ['transform'],
    version: 1,
    description: 'Set values on the data',
    icon: 'fa:pen',
    color: '#4CAF50',
    defaults: {
      values: []
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Values',
        name: 'values',
        type: 'collection',
        required: false,
        default: [],
        description: 'The values to set'
      }
    ]
  },
  {
    type: 'webhook',
    displayName: 'Webhook',
    name: 'webhook',
    group: ['trigger'],
    version: 1,
    description: 'Receive data when a webhook is called',
    icon: 'fa:satellite-dish',
    color: '#9C27B0',
    defaults: {
      path: '',
      method: 'POST'
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        required: true,
        default: '',
        description: 'The webhook path'
      },
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        required: true,
        default: 'POST',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' }
        ]
      }
    ]
  }
];

// GET /api/nodes - List available node types
router.get(
  '/',
  authenticateToken,
  validateQuery(NodeQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 50, category, search, sortBy = 'displayName', sortOrder = 'asc' } = req.query as any;
    
    let filteredNodes = [...mockNodeTypes];

    // Filter by category
    if (category) {
      filteredNodes = filteredNodes.filter(node => 
        node.group.includes(category)
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredNodes = filteredNodes.filter(node =>
        node.displayName.toLowerCase().includes(searchLower) ||
        node.description.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower)
      );
    }

    // Sort nodes
    filteredNodes.sort((a, b) => {
      const aValue = (a as any)[sortBy] || '';
      const bValue = (b as any)[sortBy] || '';
      
      if (sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    // Paginate
    const total = filteredNodes.length;
    const skip = (page - 1) * limit;
    const paginatedNodes = filteredNodes.slice(skip, skip + limit);

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
    const categories = Array.from(
      new Set(mockNodeTypes.flatMap(node => node.group))
    ).sort();

    const response: ApiResponse = {
      success: true,
      data: categories.map(category => ({
        name: category,
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        count: mockNodeTypes.filter(node => node.group.includes(category)).length
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
    const nodeType = mockNodeTypes.find(node => node.type === req.params.type);

    if (!nodeType) {
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
      data: nodeType
    };

    res.json(response);
  })
);

export { router as nodeRoutes };