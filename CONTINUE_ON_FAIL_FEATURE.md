# Continue On Fail & Always Output Data Feature

## Overview

Added two new settings to the HTTP Request node to improve error handling and workflow resilience:

1. **Continue On Fail**: Prevents the workflow from stopping when the HTTP request fails
2. **Always Output Data**: Returns error responses (4xx, 5xx) as data instead of throwing errors

## Features

### 1. Continue On Fail

When enabled, the node will continue execution even if the request fails. Instead of stopping the workflow with an error, it returns error information as output data.

**Use Cases:**

- Want to handle errors in subsequent nodes
- Need to log errors without stopping the workflow
- Performing health checks where failures are expected
- Bulk operations where some failures are acceptable

**Output Format When Error Occurs:**

```json
{
  "error": true,
  "errorMessage": "HTTP 401 Unauthorized",
  "errorType": "HTTP_ERROR",
  "statusCode": 401,
  "url": "http://localhost:4000/webhook/...",
  "method": "GET",
  "timestamp": "2025-10-11T15:06:55.790Z",
  "details": {
    // Additional error details
  }
}
```

### 2. Always Output Data

When enabled (only available when Continue On Fail is enabled), the node treats error responses (4xx, 5xx) as successful responses and returns them as data.

**Use Cases:**

- Need to process error responses (e.g., validation errors from APIs)
- Want to access error details from the API response body
- Building error handling logic based on status codes
- Testing error scenarios

**Output Format for Error Response:**

```json
{
  "status": 401,
  "statusText": "Unauthorized",
  "headers": {
    "content-type": "application/json"
  },
  "data": {
    "success": false,
    "error": "Webhook authentication failed",
    "timestamp": "2025-10-11T15:03:43.294Z"
  },
  "responseTime": 13,
  "url": "http://localhost:4000/webhook/...",
  "ok": false
}
```

## Implementation Details

### Changes to HttpRequest.node.ts

1. **Added Properties:**

   ```typescript
   {
     displayName: "Continue On Fail",
     name: "continueOnFail",
     type: "boolean",
     default: false,
     description: "If enabled, the node will continue execution even if the request fails..."
   },
   {
     displayName: "Always Output Data",
     name: "alwaysOutputData",
     type: "boolean",
     default: false,
     description: "If enabled, the node will always output data, including error responses..."
     displayOptions: {
       show: {
         continueOnFail: [true]
       }
     }
   }
   ```

2. **Modified Error Handling:**

   - Check `alwaysOutputData` before throwing error on non-OK responses
   - If `continueOnFail` is enabled, catch errors and return structured error data
   - Log appropriate messages for debugging

3. **Response Handling:**
   - When `alwaysOutputData` is true, don't throw on 4xx/5xx responses
   - Return full response object including status code and body
   - Preserve `ok: false` flag to indicate error status

## Usage Examples

### Example 1: Handle Authentication Errors

**Scenario:** Making a request to a webhook that might require authentication.

**Configuration:**

- Continue On Fail: ✅ Enabled
- Always Output Data: ✅ Enabled

**Workflow:**

```
[HTTP Request] → [IF Node]
                    ├─ status === 401 → [Send Alert]
                    └─ status === 200 → [Process Data]
```

### Example 2: Retry Logic with Error Handling

**Scenario:** Try multiple API endpoints, continue even if some fail.

**Configuration:**

- Continue On Fail: ✅ Enabled
- Always Output Data: ❌ Disabled

**Workflow:**

```
[HTTP Request 1] → [Check Error]
                      ├─ error === true → [HTTP Request 2]
                      └─ error === false → [Process Success]
```

### Example 3: Health Check Monitor

**Scenario:** Check service health without stopping workflow on failures.

**Configuration:**

- Continue On Fail: ✅ Enabled
- Always Output Data: ✅ Enabled

**Workflow:**

```
[Schedule Trigger] → [HTTP Request] → [Log Status]
                                         ├─ ok === true → [Update: Healthy]
                                         └─ ok === false → [Update: Down]
```

## Testing

### Test Case 1: Webhook with Authentication

```bash
# Scenario: Request to webhook without auth credentials
# Expected: With continueOnFail enabled, should return error data instead of failing

curl -X POST http://localhost:4000/api/executions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "...",
    "nodeId": "...",
    "parameters": {
      "url": "http://localhost:4000/webhook/...",
      "method": "GET",
      "continueOnFail": true,
      "alwaysOutputData": true
    }
  }'

# Result:
# {
#   "status": "completed",
#   "data": {
#     "status": 401,
#     "data": { "error": "Webhook authentication failed" }
#   }
# }
```

### Test Case 2: Network Error

```bash
# Scenario: Request to unreachable server
# Expected: With continueOnFail enabled, should return error data

Parameters: {
  "url": "http://unreachable-server.local",
  "continueOnFail": true
}

# Result:
# {
#   "error": true,
#   "errorMessage": "Request failed: ENOTFOUND",
#   "errorType": "NETWORK_ERROR"
# }
```

## Benefits

1. **Better Error Handling**: Workflows can handle errors gracefully instead of stopping
2. **Flexibility**: Different strategies for different types of errors
3. **Debugging**: Error information is preserved in the output for analysis
4. **Resilience**: Workflows continue running even when some requests fail
5. **API Error Processing**: Access error response bodies for validation errors

## Migration

Existing workflows are not affected as both settings default to `false`, maintaining backward compatibility.

To enable for existing HTTP Request nodes:

1. Open node configuration
2. Enable "Continue On Fail"
3. Optionally enable "Always Output Data" for error response details

## Future Enhancements

Possible improvements:

1. Add retry count configuration when continueOnFail is enabled
2. Add conditional retry based on status codes
3. Add option to output to separate error output port
4. Make this a standard setting available on all nodes (similar to n8n)

## Related Files

- `/backend/src/nodes/HttpRequest/HttpRequest.node.ts` - Main implementation
- `/backend/src/utils/errors/HttpExecutionError.ts` - Error factory
- `/backend/src/utils/retry/RetryStrategy.ts` - Retry logic

## References

- Similar to n8n's "Continue On Fail" feature
- Inspired by error handling in workflow automation platforms
