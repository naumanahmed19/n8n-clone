import { Request, Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validateBody } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { LoginSchema, RegisterSchema, ApiResponse } from '../types/api';

const router = Router();
const prisma = new PrismaClient();

// Helper function to sign JWT tokens
const signToken = (payload: object, secret: string, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, secret, { expiresIn } as any);
};

// GET /api/auth - Auth endpoints info (should use specific endpoints)
router.get('/', (req: Request, res: Response) => {
  res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_METHOD',
      message: 'Use specific auth endpoints',
      availableEndpoints: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me',
        refresh: 'POST /api/auth/refresh'
      }
    }
  });
});

// POST /api/auth/register - Register new user
router.post(
  '/register',
  validateBody(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400, 'USER_EXISTS');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500, 'CONFIG_ERROR');
    }

    const token = signToken(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          ...user,
          firstName,
          lastName
        },
        token
      }
    };

    res.status(201).json(response);
  })
);

// POST /api/auth/login - Login user
router.post(
  '/login',
  validateBody(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500, 'CONFIG_ERROR');
    }

    const token = signToken(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    // Note: lastLoginAt field not implemented in current schema

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    };

    res.json(response);
  })
);

// GET /api/auth/me - Get current user
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const response: ApiResponse = {
      success: true,
      data: user
    };

    res.json(response);
  })
);

// POST /api/auth/refresh - Refresh token
router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500, 'CONFIG_ERROR');
    }

    // Generate new token
    const token = signToken(
      {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role
      },
      jwtSecret,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    const response: ApiResponse = {
      success: true,
      data: { token }
    };

    res.json(response);
  })
);

export { router as authRoutes };