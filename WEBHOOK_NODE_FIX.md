# Fix: WebhookTrigger Node Not Found

## Problem

After implementing the new `credential` field type, the WebhookTrigger node failed to load with error:

```
Node type not found: webhook-trigger
```

## Root Cause

The `NodeService.validateNodeProperty()` method only recognized these property types:

```typescript
validTypes = [
  "string",
  "number",
  "boolean",
  "options",
  "multiOptions",
  "json",
  "dateTime",
  "collection",
  "custom",
];
```

When we added `type: "credential"` to the properties, the validation failed and the node wasn't registered.

## Solution

Updated `NodeService.ts` validation to include the new field types:

```typescript
const validTypes = [
  "string",
  "number",
  "boolean",
  "options",
  "multiOptions",
  "json",
  "dateTime",
  "collection",
  "autocomplete", // ← Added
  "credential", // ← Added
  "custom",
];
```

## Files Changed

- `backend/src/services/NodeService.ts` - Added `"credential"` and `"autocomplete"` to valid types

## Testing

1. Restart backend server
2. Check node registration logs
3. Open WebhookTrigger node in UI
4. Verify credential field appears and works

## Note

Both frontend and backend type systems now support:

- ✅ `type: "credential"` - For credential selector fields
- ✅ `type: "autocomplete"` - For autocomplete fields
- ✅ All other standard field types

The node should now register successfully! 🎉
