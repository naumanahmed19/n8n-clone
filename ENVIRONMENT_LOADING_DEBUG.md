# Environment Loading Debug Guide

## Issue

The UI shows "No environments yet" but when trying to create an environment, the backend returns "Environment DEVELOPMENT already exists".

## Root Cause Analysis

### Database State

✅ **Confirmed:** Environment exists in database

- Workflow ID: `cmgmvln5j0001masaxfem815o`
- Environment: `DEVELOPMENT`
- Version: `1.0.0`
- User ID: `cmgcnb3ra0000scgg28pfgow8`
- Status: `DRAFT`
- Active: `false`
- Node Count: 5

### Possible Causes

1. **API Call Failing Silently**

   - Frontend might not be handling API errors properly
   - Response might not match expected format

2. **Authentication Issue**

   - Token might not be sent correctly
   - User ID mismatch between frontend and backend

3. **Response Format Mismatch**
   - Backend returns data in unexpected format
   - Frontend can't parse the response

## Debug Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and check for:

- **Console logs** starting with `[Environment Store]`
- Any **network errors** in the Network tab
- Look for `/api/workflows/{id}/environments/summary` request

### Step 2: Check Network Tab

1. Open DevTools > Network tab
2. Filter by "Fetch/XHR"
3. Look for the request to `/api/workflows/.../environments/summary`
4. Check:
   - **Request Headers**: Is `Authorization: Bearer {token}` present?
   - **Response Status**: Is it 200, 401, 403, or 500?
   - **Response Body**: What data is returned?

### Step 3: Manual API Test

Run this in browser console (F12):

```javascript
// Get the current workflow ID from the URL or store
const workflowId = "cmgmvln5j0001masaxfem815o"; // Your workflow ID

// Test the API endpoint
fetch(
  `http://localhost:4000/api/workflows/${workflowId}/environments/summary`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      "Content-Type": "application/json",
    },
  }
)
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ API Response:", data);
  })
  .catch((err) => {
    console.error("❌ API Error:", err);
  });
```

## Expected vs Actual

### Expected API Response

```json
{
  "success": true,
  "data": [
    {
      "environment": "DEVELOPMENT",
      "version": "1.0.0",
      "status": "DRAFT",
      "active": false,
      "nodeCount": 5,
      "lastDeployment": {
        "deployedAt": "2025-10-12T18:52:20.000Z",
        "deployedBy": "cmgcnb3ra0000scgg28pfgow8",
        "note": null
      }
    }
  ]
}
```

### Possible Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token required"
  }
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "You don't have permission to access this workflow"
  }
}
```

## Quick Fixes

### Fix 1: Clear and Refresh

1. Clear browser storage: `localStorage.clear()`
2. Logout and login again
3. Refresh the page
4. Check if environments load

### Fix 2: Verify Token

```javascript
// Check if token exists
console.log("Token:", localStorage.getItem("auth_token"));

// Decode token to check user ID
const token = localStorage.getItem("auth_token");
if (token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  console.log("Token payload:", payload);
}
```

### Fix 3: Force Reload Environments

```javascript
// In browser console
useEnvironmentStore.getState().loadSummaries("cmgmvln5j0001masaxfem815o");
```

## Code Improvements Made

### 1. Added Default Value for Summaries

```typescript
const { summaries = [], ... } = useEnvironmentStore()
```

This prevents crashes when summaries is undefined.

### 2. Enhanced Logging

```typescript
console.log("[Environment Store] Loading summaries for workflow:", workflowId);
console.log("[Environment Store] Loaded summaries:", summaries);
```

### 3. Better Error Display

```typescript
{
  error && <div className="mt-2 p-2 bg-red-500/10...">{error}</div>;
}
```

## Next Steps

1. **Check the browser console logs** - Look for `[Environment Store]` messages
2. **Check the Network tab** - Verify the API call is being made
3. **Test the API manually** - Use the fetch code above
4. **Report findings** - Share the console logs and network response

## Files Modified

- `frontend/src/stores/environment.ts` - Enhanced logging
- `frontend/src/components/environment/EnvironmentSelector.tsx` - Added error display
- `backend/check-environments.js` - Database inspection script

## Temporary Workaround

If you need to delete the existing environment and start fresh:

```javascript
// In backend directory
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.workflowEnvironment.deleteMany({
  where: { workflowId: 'cmgmvln5j0001masaxfem815o' }
}).then(() => {
  console.log('✅ Environments deleted');
  prisma.\$disconnect();
});
"
```

Then refresh the frontend and try creating a new environment.
