import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types/api';

const prisma = new PrismaClient();

/**
 * GET /api/users/preferences
 * Get current user's preferences
 */
export const getPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { preferences: true }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const response: ApiResponse = {
    success: true,
    data: {
      preferences: user.preferences || {}
    }
  };

  res.json(response);
});

/**
 * PUT /api/users/preferences
 * Update current user's preferences
 */
export const updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object') {
    throw new AppError('Invalid preferences format', 400, 'INVALID_PREFERENCES');
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { preferences },
    select: { preferences: true }
  });

  const response: ApiResponse = {
    success: true,
    data: {
      preferences: user.preferences
    }
  };

  res.json(response);
});

/**
 * PATCH /api/users/preferences
 * Partially update current user's preferences (merge with existing)
 */
export const patchPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
  }

  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object') {
    throw new AppError('Invalid preferences format', 400, 'INVALID_PREFERENCES');
  }

  // Get current preferences
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { preferences: true }
  });

  if (!currentUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Merge preferences
  const currentPrefs = (currentUser.preferences as any) || {};
  const mergedPreferences = {
    ...currentPrefs,
    ...preferences,
    // Deep merge for nested objects like canvas settings
    canvas: {
      ...(currentPrefs.canvas || {}),
      ...(preferences.canvas || {})
    }
  };

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { preferences: mergedPreferences },
    select: { preferences: true }
  });

  const response: ApiResponse = {
    success: true,
    data: {
      preferences: user.preferences
    }
  };

  res.json(response);
});
