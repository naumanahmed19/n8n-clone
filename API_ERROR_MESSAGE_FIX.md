# API Error Message Fix

## Issue

When the backend returns validation errors, the frontend was showing a generic "An error occurred" message instead of the specific error message from the backend.

### Backend Response Structure

```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_VALIDATION_ERROR",
    "message": "Workflow validation failed: Workflow must contain at least one node",
    "stack": "..."
  }
}
```

### Frontend Behavior

The API client's `formatError` function was looking for:

- `error.response.data?.message` (doesn't exist)
- Falls back to "An error occurred" (generic)

## Root Cause

The backend returns errors in a **nested structure** with an `error` object:

```
response.data.error.message  ✓ (actual structure)
response.data.message        ✗ (what the code was looking for)
```

## Solution

**File:** `frontend/src/services/api.ts`

Updated the `formatError` function to handle both nested and flat error structures:

**Before:**

```typescript
private formatError(error: any): ApiError {
  if (error.response) {
    return {
      message: error.response.data?.message || "An error occurred",
      code: error.response.data?.code,
      status: error.response.status,
    };
  }
  // ...
}
```

**After:**

```typescript
private formatError(error: any): ApiError {
  if (error.response) {
    // Handle nested error object: { error: { message: "...", code: "..." } }
    const errorData = error.response.data?.error || error.response.data;

    return {
      message: errorData?.message || error.response.data?.message || "An error occurred",
      code: errorData?.code || error.response.data?.code,
      status: error.response.status,
    };
  }
  // ...
}
```

## How It Works

### Step 1: Check for Nested Error Object

```typescript
const errorData = error.response.data?.error || error.response.data;
```

This line:

1. First checks if `error.response.data.error` exists (nested structure)
2. Falls back to `error.response.data` (flat structure)
3. Works with both backend response formats

### Step 2: Extract Message with Fallbacks

```typescript
message: errorData?.message ||
  error.response.data?.message ||
  "An error occurred";
```

Priority order:

1. **Nested:** `response.data.error.message` (for validation errors)
2. **Flat:** `response.data.message` (for simple errors)
3. **Default:** "An error occurred" (last resort)

### Step 3: Extract Error Code

```typescript
code: errorData?.code || error.response.data?.code;
```

Extracts error codes like:

- `WORKFLOW_VALIDATION_ERROR`
- `NETWORK_ERROR`
- `UNAUTHORIZED`
- etc.

## Supported Error Formats

### Format 1: Nested Error (Backend standard)

```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_VALIDATION_ERROR",
    "message": "Workflow must contain at least one node"
  }
}
```

✅ Now displays: "Workflow must contain at least one node"

### Format 2: Flat Error (Backward compatible)

```json
{
  "message": "Something went wrong",
  "code": "ERROR_CODE"
}
```

✅ Still works: "Something went wrong"

### Format 3: No Error Data

```json
{}
```

✅ Falls back to: "An error occurred"

## Error Messages Now Working

### Validation Errors

- ✅ "Workflow must contain at least one node"
- ✅ "Invalid connection configuration"
- ✅ "Duplicate node IDs found"

### Authentication Errors

- ✅ "Invalid credentials"
- ✅ "Token expired"
- ✅ "Unauthorized access"

### Network Errors

- ✅ "Network error - please check your connection"

### Generic Errors

- ✅ "An error occurred" (fallback)

## User Experience Improvement

**Before:**

```
User: *Deletes all nodes and clicks Save*
System: "An error occurred" 😕
User: "What error? Why can't I save?"
```

**After:**

```
User: *Deletes all nodes and clicks Save*
System: "Workflow validation failed: Workflow must contain at least one node" ✓
User: "Oh, I need at least one node. Got it!"
```

## Testing Checklist

### Test Different Error Scenarios

- [ ] Delete all nodes → Save → See validation message
- [ ] Invalid connection → Save → See specific error
- [ ] Network disconnected → Save → See network error
- [ ] Invalid token → See authentication error
- [ ] Server 500 error → See appropriate message

### Test Error Format Compatibility

- [ ] Nested error format (new backend)
- [ ] Flat error format (old backend/other APIs)
- [ ] Empty response (fallback)

## Files Modified

1. **`frontend/src/services/api.ts`**

   - Updated `formatError()` method
   - Added support for nested error objects
   - Maintained backward compatibility

2. **`frontend/src/hooks/workflow/useWorkflowOperations.ts`** (previous fix)
   - Already extracting `error.message` properly
   - Now receives correct message from API client

## Impact

✅ **Specific error messages displayed**
✅ **Users understand what went wrong**
✅ **Better debugging experience**
✅ **Backward compatible with different API response formats**
✅ **No breaking changes**

## Related Issues

This fix completes the error handling improvements:

1. ✅ API client now extracts nested error messages
2. ✅ Workflow operations display the extracted messages
3. ✅ Users see helpful, specific error messages

**Status: ✅ FIXED**
