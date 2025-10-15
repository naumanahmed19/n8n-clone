import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPreferences, updatePreferences, patchPreferences } from '../controllers/user.controller';

const router = Router();

/**
 * User preferences routes
 * All routes require authentication
 */

// GET /api/users/preferences - Get current user's preferences
router.get('/preferences', authenticateToken, getPreferences);

// PUT /api/users/preferences - Replace all preferences
router.put('/preferences', authenticateToken, updatePreferences);

// PATCH /api/users/preferences - Merge preferences (partial update)
router.patch('/preferences', authenticateToken, patchPreferences);

export default router;
