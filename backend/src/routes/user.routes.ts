import { Router } from "express";
import {
  getPreferences,
  patchPreferences,
  updatePreferences,
  getProfile,
  updateProfile,
} from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * User routes
 * All routes require authentication
 */

// GET /api/users/profile - Get current user's profile
router.get("/profile", authenticateToken, getProfile);

// PUT /api/users/profile - Update current user's profile
router.put("/profile", authenticateToken, updateProfile);

// GET /api/users/preferences - Get current user's preferences
router.get("/preferences", authenticateToken, getPreferences);

// PUT /api/users/preferences - Replace all preferences
router.put("/preferences", authenticateToken, updatePreferences);

// PATCH /api/users/preferences - Merge preferences (partial update)
router.patch("/preferences", authenticateToken, patchPreferences);

export default router;
