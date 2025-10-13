# Variable Resolution Fix for getNodeParameter

## Problem

The `getNodeParameter` function in `SecureExecutionService` was **NOT resolving** `$vars` (global variables) and `$local` (local/workflow-specific variables) references in node parameters.

### Example of the Issue

```javascript
// HTTP Request Node
{
  "url": "$vars.api_endpoint/users",  // ❌ Not resolved
  "headers": {
    "Authorization": "Bearer $vars.api_key"  // ❌ Not resolved
  }
}

// Would send literally: "http://localhost:4000/users" instead of actual variable value
```

## Root Cause

In `backend/src/services/SecureExecutionService.ts`, the `getNodeParameter` function only resolved:

- `{{...}}` expressions for input data references
- But **NOT** `$vars.*` or `$local.*` variable references

## Solution

### Changes Made

#### 1. Added VariableService Import

```typescript
// SecureExecutionService.ts
import { VariableService } from "./VariableService";
```

#### 2. Added VariableService to Class

```typescript
export class SecureExecutionService {
  private variableService: VariableService;

  constructor(prisma: PrismaClient) {
    this.variableService = new VariableService();
    // ...
  }
}
```

#### 3. Updated createSecureContext Method

- Added `workflowId?: string` parameter
- Made `getNodeParameter` async (returns Promise)
- Added variable resolution before input data resolution

```typescript
async createSecureContext(
  parameters: Record<string, any>,
  inputData: NodeInputData,
  credentialIds: string[] | Record<string, string> = [],
  userId: string,
  executionId: string,
  options: SecureExecutionOptions = {},
  workflowId?: string  // ✅ NEW
): Promise<NodeExecutionContext> {
  return {
    getNodeParameter: async (parameterName: string, itemIndex?: number) => {
      let value = parameters[parameterName];
      value = this.sanitizeValue(value);

      // ✅ NEW: Resolve variables ($vars and $local)
      if (typeof value === "string" && (value.includes("$vars") || value.includes("$local"))) {
        try {
          value = await this.variableService.replaceVariablesInText(
            value,
            userId,
            workflowId
          );
        } catch (error) {
          logger.warn("Failed to resolve variables in parameter", {
            parameterName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Existing: Resolve {{...}} input data references
      if (typeof value === "string" && value.includes("{{")) {
        // ... existing code
      }

      return value;
    },
    // ... rest of context
  };
}
```

#### 4. Updated NodeService.executeNode

- Added `workflowId?: string` parameter
- Passed `workflowId` to `createSecureContext`

```typescript
async executeNode(
  nodeType: string,
  parameters: Record<string, any>,
  inputData: NodeInputData,
  credentials?: Record<string, any>,
  executionId?: string,
  userId?: string,
  options?: SecureExecutionOptions,
  workflowId?: string  // ✅ NEW
): Promise<NodeExecutionResult> {
  const context = await this.secureExecutionService.createSecureContext(
    parameters,
    inputValidation.sanitizedData!,
    credentials || {},
    executingUserId,
    execId,
    options,
    workflowId  // ✅ PASS workflowId
  );
  // ...
}
```

#### 5. Updated ExecutionService Call

```typescript
// backend/src/services/ExecutionService.ts
nodeResult = await this.nodeService.executeNode(
  node.type,
  nodeParameters,
  nodeInputData,
  credentialsMapping,
  executionId,
  userId,
  undefined, // options
  workflowId // ✅ Pass workflowId
);
```

#### 6. Updated FlowExecutionEngine Call

```typescript
// backend/src/services/FlowExecutionEngine.ts
const nodeResult = await this.nodeService.executeNode(
  node.type,
  node.parameters,
  inputData,
  credentialsMapping,
  context.executionId,
  context.userId,
  undefined, // options
  context.workflowId // ✅ Pass workflowId
);
```

## How Variable Resolution Works

### Variable Service Logic

```typescript
async replaceVariablesInText(
  text: string,
  userId: string,
  workflowId?: string
): Promise<string> {
  // 1. Get global variables for user
  const globalVariables = await this.getVariablesForExecution(userId);

  // 2. Get local variables for workflow (if workflowId provided)
  const localVariables: Record<string, string> = {};
  if (workflowId) {
    const locals = await this.getVariables(userId, undefined, "LOCAL", workflowId);
    for (const variable of locals) {
      localVariables[variable.key] = variable.value;
    }
  }

  // 3. Replace patterns
  // $vars.variableName
  // $local.variableName
  // $vars['variable.name']
  // $local['variable.name']

  return result;
}
```

## Resolution Order

When `getNodeParameter` is called with a value like `"$vars.api_endpoint/users"`:

```
1. Sanitize value
   ↓
2. Check for $vars or $local
   ↓
3. Call variableService.replaceVariablesInText()
   ↓
4. Variables replaced: "$vars.api_endpoint" → "https://api.example.com"
   ↓
5. Result: "https://api.example.com/users"
   ↓
6. Check for {{...}} input data references
   ↓
7. Return final value
```

## Testing

### 1. Create Variables

```bash
# Global variable
POST /api/variables
{
  "key": "api_endpoint",
  "value": "https://api.example.com",
  "scope": "GLOBAL"
}

# Local variable (workflow-specific)
POST /api/variables
{
  "key": "user_id",
  "value": "12345",
  "scope": "LOCAL",
  "workflowId": "workflow-uuid-here"
}
```

### 2. Create HTTP Request Node

```json
{
  "id": "http-node-1",
  "type": "httpRequest",
  "parameters": {
    "method": "GET",
    "url": "$vars.api_endpoint/users/$local.user_id",
    "headers": {
      "Authorization": "Bearer $vars.api_key"
    }
  }
}
```

### 3. Execute Node

Before the fix:

```
URL sent: "$vars.api_endpoint/users/$local.user_id"  ❌ Literal string
```

After the fix:

```
URL sent: "https://api.example.com/users/12345"  ✅ Variables resolved!
```

## Supported Variable Formats

```javascript
// Global variables
$vars.api_endpoint;
$vars.api_key;
$vars.db_connection;

// Local variables (workflow-specific)
$local.user_id;
$local.session_token;
$local.temp_value;

// Variables with special characters (dots, spaces, etc.)
$vars["config.timeout"];
$vars["api.key.secret"];
$local["user.data"];
$local["temp.value"];

// Combined with other text
("$vars.api_endpoint/users");
("Bearer $vars.api_key");
("User: $local.user_id, Endpoint: $vars.api_endpoint");
```

## Priority

When the same key exists in both scopes:

```
Local variables > Global variables
```

Example:

```javascript
// If both exist:
$vars.api_key = "global-key-123"
$local.api_key = "local-key-456"

// In a workflow context:
$vars.api_key   → "global-key-123"
$local.api_key  → "local-key-456"  (takes precedence in workflow)
```

## Files Modified

1. ✅ `backend/src/services/SecureExecutionService.ts`

   - Import VariableService
   - Add variableService instance
   - Update createSecureContext signature (add workflowId)
   - Make getNodeParameter async
   - Add variable resolution logic

2. ✅ `backend/src/services/NodeService.ts`

   - Update executeNode signature (add workflowId)
   - Pass workflowId to createSecureContext

3. ✅ `backend/src/services/ExecutionService.ts`

   - Pass workflowId when calling executeNode

4. ✅ `backend/src/services/FlowExecutionEngine.ts`
   - Pass workflowId when calling executeNode

## Impact

### Positive

- ✅ Variables now work in all nodes
- ✅ Environment-specific configurations possible
- ✅ Secure (variables resolved server-side)
- ✅ Works with both global and local variables
- ✅ No frontend changes needed

### Breaking Changes

- ⚠️ `getNodeParameter` is now async (returns Promise)
- ⚠️ Node implementations calling `this.getNodeParameter()` may need `await`
- ⚠️ Most built-in nodes already handle this correctly

## Future Enhancements

1. **Caching**: Cache variable lookups per execution to reduce DB queries
2. **Validation**: Add validation for circular variable references
3. **Type Conversion**: Auto-convert variable values to appropriate types
4. **Error Handling**: Better error messages when variables don't exist
5. **Autocomplete**: Add variable suggestions in UI

## Related Documentation

- `ENVIRONMENTS_USER_GUIDE.md` - Environment variables usage
- `backend/src/services/VariableService.ts` - Variable service implementation
- `backend/src/types/variable.ts` - Variable type definitions

---

**Status**: ✅ **FIXED** - Variables are now properly resolved in node parameters!
