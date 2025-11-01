# Per-Node Credential Configuration

## Problem Solved

### Issue
Previously, credentials were grouped by type (e.g., "apiKey"), which caused problems:
- ❌ OpenAI and Anthropic both use "apiKey" but need different keys
- ❌ Same credential shown for both nodes
- ❌ Google Drive node appeared twice if it had multiple credential types
- ❌ Confusing "Used by" list

### Solution
Now each node gets its own credential configuration:
- ✅ OpenAI has its own credential selector
- ✅ Anthropic has its own credential selector
- ✅ Each node shown separately with its name
- ✅ No more "Used by" list needed

---

## Changes Made

### Backend: WorkflowTemplateService.ts

**Old Structure**:
```typescript
interface TemplateCredentialRequirement {
  type: string;              // "apiKey"
  displayName: string;       // "API Key"
  nodeIds: string[];         // ["node-1", "node-2"]
  nodeNames: string[];       // ["OpenAI", "Anthropic"]
}
```

**New Structure**:
```typescript
interface TemplateCredentialRequirement {
  nodeId: string;            // "node-1"
  nodeName: string;          // "OpenAI"
  nodeType: string;          // "openai"
  credentialType: string;    // "apiKey"
  displayName: string;       // "API Key"
}
```

**Extraction Logic**:
- No longer groups by credential type
- Creates one requirement per node
- Each node gets its own entry

---

### Frontend: WorkflowTemplateSetup.tsx

**State Management**:
```typescript
// Old: Keyed by credential type
credentialSelections: {
  "apiKey": "cred-123"  // Both OpenAI and Anthropic share this
}

// New: Keyed by node ID
credentialSelections: {
  "node-1": "cred-123",  // OpenAI's credential
  "node-2": "cred-456"   // Anthropic's credential
}
```

**Rendering**:
```typescript
// Old: Grouped by type
{metadata.credentials.map((cred) => (
  <div>
    <h4>{cred.displayName}</h4>  // "API Key"
    <p>Used by: {cred.nodeNames.join(", ")}</p>  // "OpenAI, Anthropic"
  </div>
))}

// New: One per node
{metadata.credentials.map((cred) => (
  <div>
    <h4>{cred.nodeName}</h4>  // "OpenAI"
    <p>{cred.displayName}</p>  // "API Key"
  </div>
))}
```

---

## UI Changes

### Before
```
┌─────────────────────────────────────┐
│ Configure Credentials               │
├─────────────────────────────────────┤
│ API Key                             │
│ Used by: OpenAI, Anthropic          │
│ [Select Credential ▼]               │
│                                     │
│ (Both nodes share same credential) │
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│ Configure Credentials               │
├─────────────────────────────────────┤
│ OpenAI                              │
│ API Key                             │
│ [Select Credential ▼]               │
├─────────────────────────────────────┤
│ Anthropic                           │
│ API Key                             │
│ [Select Credential ▼]               │
│                                     │
│ (Each node has its own credential)  │
└─────────────────────────────────────┘
```

---

## Example Scenarios

### Scenario 1: OpenAI + Anthropic

**Workflow**:
- Node 1: OpenAI (needs API key)
- Node 2: Anthropic (needs API key)

**Old Behavior**:
```
Credentials:
  - API Key
    Used by: OpenAI, Anthropic
    [Select one credential for both]
```

**New Behavior**:
```
Credentials:
  - OpenAI
    API Key
    [Select OpenAI credential]
    
  - Anthropic
    API Key
    [Select Anthropic credential]
```

### Scenario 2: Multiple OpenAI Nodes

**Workflow**:
- Node 1: OpenAI (GPT-4)
- Node 2: OpenAI (GPT-3.5)

**Old Behavior**:
```
Credentials:
  - API Key
    Used by: OpenAI, OpenAI
    [Select one credential for both]
```

**New Behavior**:
```
Credentials:
  - OpenAI (GPT-4)
    API Key
    [Select credential]
    
  - OpenAI (GPT-3.5)
    API Key
    [Select credential]
```

### Scenario 3: Google Drive

**Workflow**:
- Node 1: Google Drive

**Old Behavior**:
```
Credentials:
  - OAuth2
    Used by: Google Drive
    [Select credential]
    
  - OAuth2
    Used by: Google Drive
    [Select credential]
    
(Appeared twice if node had multiple credential options)
```

**New Behavior**:
```
Credentials:
  - Google Drive
    OAuth2
    [Select credential]
    
(Appears once per node)
```

---

## Benefits

### 1. Clarity
- ✅ Each node clearly labeled
- ✅ No confusion about which credential goes where
- ✅ Node name prominently displayed

### 2. Flexibility
- ✅ Different credentials for different nodes
- ✅ Same node type can have different credentials
- ✅ No forced sharing of credentials

### 3. Correctness
- ✅ OpenAI gets OpenAI key
- ✅ Anthropic gets Anthropic key
- ✅ No accidental credential mixing

### 4. Simplicity
- ✅ No "Used by" list needed
- ✅ One credential per card
- ✅ Cleaner UI

---

## Technical Details

### Credential Selection

**Old**:
```typescript
// Select by credential type
handleCredentialSelect("apiKey", "cred-123")

// Applies to ALL nodes using "apiKey"
```

**New**:
```typescript
// Select by node ID
handleCredentialSelect("node-1", "cred-123")

// Applies only to node-1
```

### Save Logic

**Old**:
```typescript
// Loop through credential types
metadata.credentials.forEach((credReq) => {
  // Apply to all nodes in nodeIds array
  credReq.nodeIds.forEach((nodeId) => {
    node.parameters.authentication = selectedCred
  })
})
```

**New**:
```typescript
// Direct node lookup
const selectedCredId = credentialSelections[node.id]
if (selectedCredId) {
  node.parameters.authentication = selectedCredId
}
```

### Validation

**Old**:
```typescript
// Check if credential type is selected
allCredentialsSelected = requiredCredentials.every(
  (cred) => credentialSelections[cred.type]
)
```

**New**:
```typescript
// Check if node has credential selected
allCredentialsSelected = requiredCredentials.every(
  (cred) => credentialSelections[cred.nodeId]
)
```

---

## Migration

### No Breaking Changes
- Existing workflows continue to work
- Only affects template setup UI
- Backend API response structure changed but frontend handles it

### Automatic
- No user action required
- Next time template is opened, new structure is used
- Credentials already configured remain configured

---

## Future Enhancements

### 1. Node Icons
Show node type icon next to name:
```
🤖 OpenAI
   API Key
   [Select credential]
```

### 2. Credential Suggestions
Suggest credentials based on node type:
```
OpenAI
API Key
[Select credential ▼]
  Suggested:
    - My OpenAI Key ⭐
  Other:
    - Test Key
    - Production Key
```

### 3. Bulk Selection
Select same credential for multiple nodes:
```
☑ OpenAI (GPT-4)
☑ OpenAI (GPT-3.5)
[Apply credential to selected: My OpenAI Key]
```

### 4. Credential Templates
Save common configurations:
```
[Load Template ▼]
  - Production Setup
  - Development Setup
  - Testing Setup
```

---

## Summary

### What Changed
✅ Credentials now per-node instead of per-type
✅ Each node gets its own credential selector
✅ Node name displayed prominently
✅ No more "Used by" list

### What's Better
✅ Clearer which credential goes where
✅ Different credentials for different nodes
✅ No confusion with same credential types
✅ Simpler, cleaner UI

### What Works Now
✅ OpenAI and Anthropic can have different API keys
✅ Multiple nodes of same type can have different credentials
✅ Google Drive doesn't appear twice
✅ Each node independently configured

**The template system now properly handles per-node credentials!** 🎉
