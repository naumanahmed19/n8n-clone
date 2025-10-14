# Environment Permission Error Fix

## Issue

**Error:** "You don't have permission to access this workflow"  
**HTTP Status:** 403 Forbidden  
**Endpoint:** `POST /api/workflows/:workflowId/environments`

## Root Cause

The environment routes were attempting to access `req.user!.userId`, but the authentication middleware (`authenticateToken`) sets the user ID as `req.user.id`.

### Authentication Middleware Structure

```typescript
// backend/src/middleware/auth.ts
req.user = {
  id: decoded.id, // ✅ Correct property name
  email: decoded.email,
  role: decoded.role || "user",
};
```

### Previous Code (Incorrect)

```typescript
// backend/src/routes/environment.ts
const userId = req.user!.userId; // ❌ Wrong property name
```

### Fixed Code

```typescript
// backend/src/routes/environment.ts
const userId = req.user!.id; // ✅ Correct property name
```

## Changes Made

### File Modified

- **`backend/src/routes/environment.ts`**
  - Replaced all 12 occurrences of `req.user!.userId` with `req.user!.id`

### Affected Endpoints

All environment-related endpoints now correctly access the user ID:

1. `GET /api/workflows/:workflowId/environments` - List all environments
2. `GET /api/workflows/:workflowId/environments/summary` - Get environment summaries
3. `GET /api/workflows/:workflowId/environments/:environment` - Get specific environment
4. `POST /api/workflows/:workflowId/environments` - Create new environment
5. `POST /api/workflows/:workflowId/environments/deploy` - Deploy between environments
6. `POST /api/workflows/:workflowId/environments/:environment/promote` - Promote environment
7. `POST /api/workflows/:workflowId/environments/:environment/rollback` - Rollback environment
8. `GET /api/workflows/:workflowId/environments/:environment/deployments` - Get deployment history
9. `GET /api/workflows/:workflowId/environments/compare` - Compare environments
10. `PUT /api/workflows/:workflowId/environments/:environment/activate` - Activate environment
11. `PUT /api/workflows/:workflowId/environments/:environment/deactivate` - Deactivate environment
12. `DELETE /api/workflows/:workflowId/environments/:environment` - Delete environment

## Testing

### Before Fix

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "You don't have permission to access this workflow",
    "stack": "Error: You don't have permission to access this workflow..."
  }
}
```

### After Fix

Should successfully create environment:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "workflowId": "...",
    "environment": "DEVELOPMENT",
    "version": "1.0.0",
    ...
  }
}
```

## Verification Steps

1. **Start the backend server** (if not already running)

   ```bash
   cd backend
   npm run dev
   ```

2. **Test environment creation** from the frontend:

   - Open a workflow in the editor
   - Click the environment selector
   - Select "Create Development"
   - Fill in version (e.g., "1.0.0") and optional notes
   - Click "Create Environment"

3. **Expected Result:**
   - Environment should be created successfully
   - Success message should appear
   - Environment should appear in the selector dropdown

## Related Code

### User Authentication Flow

```
1. User logs in → JWT token generated with user.id
2. Token stored in cookies or Authorization header
3. authenticateToken middleware verifies token
4. Decoded token sets req.user.id
5. Route handlers access req.user.id for authorization
```

### Workflow Ownership Verification

```typescript
// WorkflowEnvironmentService.ts
private async verifyWorkflowOwnership(
  workflowId: string,
  userId: string
): Promise<void> {
  const workflow = await this.prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { userId: true },
  });

  if (!workflow) {
    throw new AppError("Workflow not found", 404);
  }

  if (workflow.userId !== userId) {
    throw new AppError(
      "You don't have permission to access this workflow",
      403
    );
  }
}
```

## Impact

- **Scope:** All environment API endpoints
- **Breaking Changes:** None
- **Database:** No changes required
- **Migration:** No migration needed
- **Type Safety:** Improved by using correct property names

## Prevention

To prevent similar issues in the future:

1. **Use TypeScript interfaces consistently:**

   ```typescript
   import { AuthenticatedRequest } from "../middleware/auth";

   router.post(
     "/...",
     authenticateToken,
     async (req: AuthenticatedRequest, res, next) => {
       const userId = req.user!.id; // TypeScript will catch incorrect property names
     }
   );
   ```

2. **Document authentication middleware structure**
3. **Add integration tests for authenticated endpoints**
4. **Use ESLint rules to enforce consistent naming**

## Status

✅ **Fixed** - All environment routes now correctly access `req.user!.id`
