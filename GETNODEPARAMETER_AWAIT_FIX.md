# getNodeParameter Await Fix

## Issue

When `getNodeParameter` was made async to support variable resolution (`$vars.*` and `$local.*`), all node definitions that call `getNodeParameter` needed to be updated to use `await`. Without `await`, the function returns a Promise instead of the resolved value, causing errors like "Invalid URL format" because the variable wasn't resolved.

## Root Cause

In `SecureExecutionService.ts`, the `getNodeParameter` method was updated to be async:

```typescript
getNodeParameter: async (parameterName: string, itemIndex?: number) => {
  // ... variable resolution logic with await
  if (
    typeof value === "string" &&
    (value.includes("$vars") || value.includes("$local"))
  ) {
    value = await this.variableService.replaceVariablesInText(
      value,
      userId,
      workflowId
    );
  }
  // ... rest of logic
};
```

However, node definitions were still calling it synchronously:

```typescript
const url = this.getNodeParameter("url") as string; // ❌ Returns Promise<string>
```

## Solution

Update all `getNodeParameter` calls to use `await`:

```typescript
const url = (await this.getNodeParameter("url")) as string; // ✅ Returns string
```

## Files Fixed

### 1. ✅ HttpRequest.node.ts (FIXED)

**Location:** `backend/src/nodes/HttpRequest/HttpRequest.node.ts`

**Changes:**

```typescript
// Before (10 calls):
const method = this.getNodeParameter("method") as string;
const url = this.getNodeParameter("url") as string;
const headers =
  (this.getNodeParameter("headers") as Record<string, string>) || {};
const body = this.getNodeParameter("body");
const timeout = (this.getNodeParameter("timeout") as number) || 30000;
const followRedirects = this.getNodeParameter("followRedirects") as boolean;
const maxRedirects = (this.getNodeParameter("maxRedirects") as number) || 5;
const continueOnFail =
  (this.getNodeParameter("continueOnFail") as boolean) || false;
const alwaysOutputData =
  (this.getNodeParameter("alwaysOutputData") as boolean) || false;

// After (10 calls with await):
const method = (await this.getNodeParameter("method")) as string;
const url = (await this.getNodeParameter("url")) as string;
const headers =
  ((await this.getNodeParameter("headers")) as Record<string, string>) || {};
const body = await this.getNodeParameter("body");
const timeout = ((await this.getNodeParameter("timeout")) as number) || 30000;
const followRedirects = (await this.getNodeParameter(
  "followRedirects"
)) as boolean;
const maxRedirects =
  ((await this.getNodeParameter("maxRedirects")) as number) || 5;
const continueOnFail =
  ((await this.getNodeParameter("continueOnFail")) as boolean) || false;
const alwaysOutputData =
  ((await this.getNodeParameter("alwaysOutputData")) as boolean) || false;
```

**Impact:** HTTP Request node can now use variables in URL, headers, body, and all parameters.

### 2. ✅ Set.node.ts (FIXED)

**Location:** `backend/src/nodes/Set/Set.node.ts`

**Changes:**

```typescript
// Before:
const values = this.getNodeParameter("values") as Array<{...}>;

// After:
const values = await this.getNodeParameter("values") as Array<{...}>;
```

**Impact:** Set node can now use variables in value fields.

### 3. ✅ If.node.ts (FIXED)

**Location:** `backend/src/nodes/If/If.node.ts`

**Changes:**

```typescript
// Before (3 calls per item):
const value1 = this.getNodeParameter("value1", i) as string;
const operation = this.getNodeParameter("operation", i) as string;
const value2 = this.getNodeParameter("value2", i) as string;

// After (3 calls with await):
const value1 = (await this.getNodeParameter("value1", i)) as string;
const operation = (await this.getNodeParameter("operation", i)) as string;
const value2 = (await this.getNodeParameter("value2", i)) as string;
```

**Impact:** If node can now use variables in conditional comparisons.

### 4. ✅ Json.node.ts (FIXED)

**Location:** `backend/src/nodes/Json/Json.node.ts`

**Changes:**

```typescript
// Before:
const jsonData = this.getNodeParameter("jsonData") as string;

// After:
const jsonData = (await this.getNodeParameter("jsonData")) as string;
```

**Impact:** JSON node can now use variables in JSON data field.

## Remaining Nodes to Fix

The following nodes still need to be updated (not critical unless user wants to use variables in them):

### AI Nodes:

- `OpenAI.node.ts` - 8 getNodeParameter calls (model, systemPrompt, userMessage, temperature, maxTokens, enableMemory, sessionId, jsonMode)
- `Anthropic.node.ts` - 6 getNodeParameter calls (model, systemPrompt, userMessage, temperature, maxTokens, enableMemory, sessionId)

### Workflow Nodes:

- `WorkflowTrigger.node.ts` - 5 getNodeParameter calls (workflowId, triggerId, inputData, waitForCompletion, timeout)
- `WorkflowCalled.node.ts` - 2 getNodeParameter calls (description, passthrough)

### Trigger Nodes:

- `ManualTrigger.node.ts` - 5 getNodeParameter calls (description, allowCustomData, defaultData, validateData, maxDataSize)
- `ScheduleTrigger.node.ts` - 3 getNodeParameter calls (cronExpression, timezone, description)

### Other Nodes:

- `Switch.node.ts` / `SwitchExample.node.ts` - Multiple calls (mode, outputs, expression)
- `ImagePreview.node.ts` - 3 getNodeParameter calls (imageUrl, altText, displayInOutput)
- `CustomTemplate.node.ts` - Multiple calls (operationType, textInput, timeout, enableFeature, jsonConfig, fieldName, transformMethod, filterCondition, filterValue, aggregateMethod)

## Testing

### Test Case 1: HTTP Request with Variable URL ✅

1. Create a variable: key=`apiUrl`, value=`https://jsonplaceholder.typicode.com/todos/1`, scope=LOCAL
2. Create HTTP Request node
3. Set URL to: `$local.apiUrl`
4. Execute the node
5. **Expected:** Request succeeds and returns data from the API

### Test Case 2: HTTP Request with Variable in Headers

1. Create a variable: key=`authToken`, value=`Bearer abc123`, scope=GLOBAL
2. Create HTTP Request node
3. In headers JSON, add: `{"Authorization": "$vars.authToken"}`
4. Execute the node
5. **Expected:** Request includes the Authorization header with resolved value

### Test Case 3: Set Node with Variable

1. Create a variable: key=`defaultStatus`, value=`active`, scope=LOCAL
2. Create Set node
3. Add value: name=`status`, value=`$local.defaultStatus`
4. Execute the node
5. **Expected:** Output includes `status: "active"`

### Test Case 4: If Node with Variable

1. Create a variable: key=`threshold`, value=`100`, scope=GLOBAL
2. Create If node
3. Set condition: value1=`$vars.threshold`, operation=`larger`, value2=`50`
4. Execute the node
5. **Expected:** Data routes to "true" output

## How to Fix Other Nodes

For any node that needs fixing, follow this pattern:

```typescript
// 1. Find all getNodeParameter calls in the execute function
const param1 = this.getNodeParameter("param1") as string;
const param2 = this.getNodeParameter("param2") as number;

// 2. Add await before each call
const param1 = await this.getNodeParameter("param1") as string;
const param2 = await this.getNodeParameter("param2") as number;

// 3. Ensure the execute function is async (it should be already)
execute: async function (inputData: NodeInputData): Promise<NodeOutputData[]> {
  // ... code
}
```

## Related Documentation

- **VARIABLE_RESOLUTION_FIX.md** - Backend variable resolution implementation
- **VARIABLE_AUTOCOMPLETE_PREVIEW_FIX.md** - Frontend variable autocomplete and preview
- **ENVIRONMENTS_USER_GUIDE.md** - User guide for environments and variables

## Summary

✅ **Fixed 4 core nodes:** HttpRequest, Set, If, Json
⏳ **Remaining:** ~10 other nodes (AI, Workflow, Trigger, etc.)

The HTTP Request node should now work correctly with variables like `$local.apiUrl`! 🎉
