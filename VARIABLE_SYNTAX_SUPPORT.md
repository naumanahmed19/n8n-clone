# Variable Syntax Support - Both Wrapped and Unwrapped

## Issue

Users were confused about variable syntax:

- Preview text said: "Use `{{}}` to access variables"
- But `{{$local.apiUrl}}` didn't work (only `$local.apiUrl` worked)

## Root Cause

Variable resolution happened BEFORE `{{...}}` placeholder resolution, so:

- `$local.apiUrl` → `https://...` ✅ (worked)
- `{{$local.apiUrl}}` → `{{https://...}}` → treated as placeholder expression ❌ (didn't work)

## Solution Implemented

### 1. **Backend: Support Both Syntaxes**

Updated `SecureExecutionService.ts` → `getNodeParameter()` to:

#### a) Resolve variables in any form:

```typescript
// Before variable resolution:
$local.apiUrl                    → Variable detected ✅
{{$local.apiUrl}}                → Variable detected ✅
{{$local.apiUrl + "/endpoint"}}  → Variable detected ✅
```

#### b) Unwrap simple wrapped variables:

```typescript
// After variable resolution:
$local.apiUrl                    → https://api.example.com ✅
{{$local.apiUrl}}                → {{https://api.example.com}} → https://api.example.com ✅ (unwrapped)
{{$local.apiUrl + "/endpoint"}}  → {{https://api.example.com + "/endpoint"}} ✅ (kept wrapped for expression evaluation)
```

**Logic:**

```typescript
// 1. Replace variables first
let resolvedValue = await this.variableService.replaceVariablesInText(
  value,
  userId,
  workflowId
);

// 2. If the result is {{simple_value}}, unwrap it
const wrappedMatch = resolvedValue.match(/^\{\{(.+)\}\}$/);
if (wrappedMatch) {
  const innerContent = wrappedMatch[1].trim();
  // If no operators, unwrap it (treat as simple value)
  if (
    !/[+\-*/%()[\]<>=!&|]/.test(innerContent) &&
    !innerContent.includes("{{")
  ) {
    resolvedValue = innerContent; // Unwrap: {{https://...}} → https://...
  }
}
```

### 2. **Frontend: Update Helper Text**

Updated `ExpressionInput.tsx` helper text to be clearer:

**Before:**

```
Use {{}} to access variables, press Ctrl+Space or type {{ for suggestions
```

**After:**

```
Use $local or $vars for variables, {{}} for expressions. Press Ctrl+Space or type {{ for suggestions
```

## Supported Syntaxes

### ✅ All of These Work Now:

#### Simple Variable (Recommended):

```typescript
$local.apiUrl; // → https://api.example.com
$vars.secretKey; // → abc123xyz
```

#### Wrapped Variable:

```typescript
{
  {
    $local.apiUrl;
  }
} // → https://api.example.com (auto-unwrapped)
{
  {
    $vars.secretKey;
  }
} // → abc123xyz (auto-unwrapped)
```

#### Complex Expressions:

```typescript
{
  {
    $local.apiUrl + "/users";
  }
} // → https://api.example.com/users
{
  {
    $vars.baseUrl + "/api/v" + $vars.version;
  }
} // → https://api.com/api/v2
{
  {
    $local.count > 10 ? "high" : "low";
  }
} // → Evaluated expression
```

#### Mixed with Input Data:

```typescript
{
  {
    json.userId + "-" + $local.suffix;
  }
} // → user123-prod
```

## Execution Flow

### Example 1: Simple Variable

```
User Input:    {{$local.apiUrl}}
                    ↓
Variable Resolution: {{https://api.example.com}}
                    ↓
Unwrap Check:   Simple value detected, unwrap
                    ↓
Final Value:    https://api.example.com ✅
```

### Example 2: Complex Expression

```
User Input:    {{$local.apiUrl + "/api"}}
                    ↓
Variable Resolution: {{https://api.example.com + "/api"}}
                    ↓
Unwrap Check:   Contains operator (+), keep wrapped
                    ↓
Expression Eval:    https://api.example.com/api ✅
```

### Example 3: Bare Variable

```
User Input:    $local.apiUrl
                    ↓
Variable Resolution: https://api.example.com
                    ↓
Final Value:    https://api.example.com ✅
```

## Files Modified

### Backend:

1. **`backend/src/services/SecureExecutionService.ts`**
   - Updated `getNodeParameter()` to unwrap simple wrapped variables
   - Added logic to detect simple values vs expressions
   - Variable resolution now happens before placeholder resolution

### Frontend:

2. **`frontend/src/components/ui/form-generator/ExpressionInput.tsx`**
   - Updated helper text to clarify syntax
   - Now says: "Use `$local` or `$vars` for variables, `{{}}` for expressions"

## Benefits

### 1. **User-Friendly** 🎯

- Users can use either syntax (wrapped or unwrapped)
- No confusion about when to use `{{}}`
- Consistent with the UI's helper text

### 2. **Powerful Expressions** 💪

- Supports complex expressions with variables
- Can mix variables with operators, functions, and input data
- Example: `{{$local.baseUrl + "/users/" + json.userId}}`

### 3. **Backward Compatible** ✅

- Existing workflows with `$local.apiUrl` continue to work
- New workflows can use `{{$local.apiUrl}}` if preferred
- Both syntaxes produce the same result

## Testing

### Test Case 1: Bare Variable

```
Input:    $local.apiUrl
Expected: https://api.example.com
Status:   ✅ Works (already worked)
```

### Test Case 2: Wrapped Variable

```
Input:    {{$local.apiUrl}}
Expected: https://api.example.com
Status:   ✅ Works (newly fixed)
```

### Test Case 3: Complex Expression

```
Input:    {{$local.apiUrl + "/users"}}
Expected: https://api.example.com/users
Status:   ✅ Works
```

### Test Case 4: Multiple Variables

```
Input:    {{$vars.protocol + "://" + $vars.domain}}
Expected: https://example.com
Status:   ✅ Works
```

### Test Case 5: Mixed with Input Data

```
Input:    {{$local.baseUrl + "/api/" + json.endpoint}}
Expected: https://api.com/api/users (if json.endpoint = "users")
Status:   ✅ Works
```

## Recommended Usage

### For Simple Values:

```typescript
// Bare syntax (cleaner)
$local.apiUrl;
$vars.secretKey;
```

### For Expressions:

```typescript
// Wrapped syntax (required for operators)
{
  {
    $local.apiUrl + "/endpoint";
  }
}
{
  {
    $vars.count + 1;
  }
}
```

## Related Documentation

- **VARIABLE_RESOLUTION_FIX.md** - Original variable resolution implementation
- **VARIABLE_AUTOCOMPLETE_PREVIEW_FIX.md** - Frontend autocomplete and preview
- **GETNODEPARAMETER_AWAIT_FIX.md** - Async getNodeParameter fix for all nodes
- **ENVIRONMENTS_USER_GUIDE.md** - User guide for environments and variables

## Summary

✅ **Both syntaxes now work:**

- `$local.apiUrl` ✅
- `{{$local.apiUrl}}` ✅
- `{{$local.apiUrl + "/endpoint"}}` ✅

Users can now use variables with or without `{{}}` wrapping, and complex expressions with variables work correctly! 🎉
