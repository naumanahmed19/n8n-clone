# Dynamic Credential Field Detection

## Problem Solved

Previously, we were hardcoding `node.parameters.authentication` for all credential saves, but different nodes might use different field names.

### Issue
- ❌ Hardcoded `authentication` field name
- ❌ Assumed all nodes use same field
- ❌ Wouldn't work for custom nodes with different field names
- ❌ Not flexible or extensible

### Solution
- ✅ Detect actual field name from node definition
- ✅ Use `prop.name` from credential property
- ✅ Store field name in metadata
- ✅ Apply to correct field when saving

---

## How It Works

### 1. Backend Detection

When analyzing workflow, extract the credential field name:

```typescript
// Check node parameters for credential type properties
for (const prop of properties) {
  if (prop.type === "credential" && prop.allowedTypes) {
    credentialType = prop.allowedTypes[0];
    credentialFieldName = prop.name; // ← Get actual field name!
    displayName = prop.displayName;
    // ...
  }
}
```

### 2. Include in Metadata

```typescript
interface TemplateCredentialRequirement {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  credentialType: string;
  credentialFieldName: string; // ← New field!
  displayName: string;
  description?: string;
  required: boolean;
}
```

### 3. Frontend Usage

When saving, use the correct field name:

```typescript
// Find the credential requirement for this node
const credReq = metadata.credentials.find((c) => c.nodeId === node.id);
const selectedCredId = credentialSelections[node.id];

if (selectedCredId && credReq) {
  // Use the actual field name from the node definition
  updatedNode.parameters[credReq.credentialFieldName] = selectedCredId;
}
```

---

## Examples

### OpenAI Node

**Node Definition**:
```typescript
{
  displayName: "Authentication",
  name: "authentication", // ← Field name
  type: "credential",
  allowedTypes: ["apiKey"],
}
```

**Saved As**:
```typescript
node.parameters.authentication = "credential-id-123"
```

### Custom Form Generator Node

**Node Definition**:
```typescript
{
  displayName: "API Credentials",
  name: "apiCredentials", // ← Different field name!
  type: "credential",
  allowedTypes: ["oauth2"],
}
```

**Saved As**:
```typescript
node.parameters.apiCredentials = "credential-id-456"
```

### Google Sheets Node

**Node Definition**:
```typescript
{
  displayName: "Google Account",
  name: "googleAuth", // ← Another different name!
  type: "credential",
  allowedTypes: ["googleOAuth2"],
}
```

**Saved As**:
```typescript
node.parameters.googleAuth = "credential-id-789"
```

---

## Changes Made

### Backend: WorkflowTemplateService.ts

**Added Field Detection**:
```typescript
// Old
credentialType = prop.allowedTypes[0];
displayName = prop.displayName;

// New
credentialType = prop.allowedTypes[0];
credentialFieldName = prop.name; // ← Detect field name
displayName = prop.displayName;
```

**Updated Interface**:
```typescript
export interface TemplateCredentialRequirement {
  // ... existing fields
  credentialFieldName: string; // ← Added
}
```

### Frontend: WorkflowSetupPanel.tsx

**Updated Interface**:
```typescript
interface TemplateCredentialRequirement {
  // ... existing fields
  credentialFieldName: string; // ← Added
}
```

**Updated Save Logic**:
```typescript
// Old
updatedNode.parameters.authentication = selectedCredId;

// New
const credReq = metadata.credentials.find((c) => c.nodeId === node.id);
if (selectedCredId && credReq) {
  updatedNode.parameters[credReq.credentialFieldName] = selectedCredId;
}
```

### Frontend: WorkflowTemplateSetup.tsx

Same changes as WorkflowSetupPanel.tsx

---

## Benefits

### 1. Flexibility
- ✅ Works with any field name
- ✅ No hardcoded assumptions
- ✅ Supports custom nodes
- ✅ Future-proof

### 2. Correctness
- ✅ Saves to correct field
- ✅ Node can read credential
- ✅ No data loss
- ✅ Proper integration

### 3. Extensibility
- ✅ Custom nodes work automatically
- ✅ No code changes needed
- ✅ Self-documenting
- ✅ Maintainable

### 4. Consistency
- ✅ Same pattern for all nodes
- ✅ Predictable behavior
- ✅ Easy to debug
- ✅ Clear data flow

---

## Field Name Detection Logic

### Priority Order

1. **Credential Property** (Highest Priority)
   ```typescript
   properties: [{
     name: "customFieldName", // ← Use this
     type: "credential",
     allowedTypes: ["apiKey"]
   }]
   ```

2. **Credential Selector**
   ```typescript
   credentialSelector: {
     allowedTypes: ["apiKey"]
   }
   // → Defaults to "authentication"
   ```

3. **Legacy Credentials**
   ```typescript
   credentials: [{
     name: "apiKey",
     displayName: "API Key"
   }]
   // → Defaults to "authentication"
   ```

### Default Fallback

If no field name detected:
```typescript
credentialFieldName = "authentication" // Safe default
```

---

## Testing Scenarios

### Scenario 1: Standard Node (OpenAI)
```typescript
// Node definition
name: "authentication"

// Saved as
node.parameters.authentication = "cred-123"

// Result: ✅ Works
```

### Scenario 2: Custom Field Name
```typescript
// Node definition
name: "apiCredentials"

// Saved as
node.parameters.apiCredentials = "cred-456"

// Result: ✅ Works
```

### Scenario 3: Multiple Credentials
```typescript
// Node definition
properties: [
  { name: "primaryAuth", type: "credential" },
  { name: "secondaryAuth", type: "credential" }
]

// Saved as (first one)
node.parameters.primaryAuth = "cred-789"

// Result: ✅ Works (uses first credential property)
```

### Scenario 4: No Credential Property
```typescript
// Node definition (old style)
credentials: [{ name: "apiKey" }]

// Saved as (default)
node.parameters.authentication = "cred-abc"

// Result: ✅ Works (uses default)
```

---

## Migration

### Backward Compatibility

**Old workflows** (saved with hardcoded "authentication"):
- ✅ Still work
- ✅ No breaking changes
- ✅ Existing credentials remain valid

**New workflows** (saved with detected field name):
- ✅ Use correct field
- ✅ More accurate
- ✅ Better compatibility

### No Action Required

- Existing workflows continue to work
- New saves use correct field
- Gradual migration as workflows are updated
- No manual intervention needed

---

## Edge Cases

### Case 1: Node Has No Credential Property
```typescript
// Detection fails gracefully
credentialFieldName = "authentication" // Default
```

### Case 2: Multiple Credential Properties
```typescript
// Uses first one found
for (const prop of properties) {
  if (prop.type === "credential") {
    credentialFieldName = prop.name;
    break; // ← Takes first
  }
}
```

### Case 3: Property Name is Empty
```typescript
// Validation
credentialFieldName = prop.name || "authentication"
```

---

## Future Enhancements

### 1. Multiple Credentials Per Node
Support nodes with multiple credential fields:
```typescript
credentials: [
  { fieldName: "primaryAuth", type: "apiKey" },
  { fieldName: "secondaryAuth", type: "oauth2" }
]
```

### 2. Credential Field Validation
Validate field name exists in node parameters:
```typescript
if (!nodeDefinition.properties.find(p => p.name === fieldName)) {
  logger.warn("Credential field not found in node definition");
}
```

### 3. Field Name Suggestions
Suggest common field names:
```typescript
const commonNames = ["authentication", "credentials", "auth", "apiKey"];
```

### 4. Auto-Migration
Automatically migrate old field names:
```typescript
if (node.parameters.authentication && credReq.credentialFieldName !== "authentication") {
  node.parameters[credReq.credentialFieldName] = node.parameters.authentication;
  delete node.parameters.authentication;
}
```

---

## Files Modified

### Backend
- ✅ `backend/src/services/WorkflowTemplateService.ts`
  - Added `credentialFieldName` to interface
  - Detect field name from property
  - Include in metadata

### Frontend
- ✅ `frontend/src/components/workflow/WorkflowSetupPanel.tsx`
  - Added `credentialFieldName` to interface
  - Use dynamic field name when saving
  
- ✅ `frontend/src/components/workflow/WorkflowTemplateSetup.tsx`
  - Added `credentialFieldName` to interface
  - Use dynamic field name when saving

---

## Summary

### What Changed
✅ Detect credential field name from node definition
✅ Store field name in metadata
✅ Use correct field when saving
✅ No more hardcoded "authentication"

### What's Better
✅ Works with any field name
✅ Supports custom nodes
✅ More flexible and extensible
✅ Correct data storage

### What Still Works
✅ Existing workflows
✅ Standard nodes (OpenAI, Anthropic)
✅ Backward compatibility
✅ All existing functionality

**Now credentials are saved to the correct field for each node!** 🎯✨
