# Credentials as Properties - Final Architecture

## The Clean Solution ✨

Credentials are now treated as **just another property type**, making the architecture much simpler and more consistent.

## Node Definition Structure

```typescript
export const WebhookTriggerNode: NodeDefinition = {
  // ... basic config

  // 1. Credential TYPE definitions (schema/metadata)
  credentials: [
    {
      name: "httpBasicAuth",
      displayName: "Basic Auth",
      properties: [
        {
          displayName: "Username",
          name: "username",
          type: "string",
          required: true,
        },
        {
          displayName: "Password",
          name: "password",
          type: "string",
          required: true,
        },
      ],
    },
    // ... more credential types
  ],

  // 2. Node properties (including credential SELECTION)
  properties: [
    {
      displayName: "Authentication",
      name: "authentication",
      type: "credential", // ← Just another field type!
      required: false,
      allowedTypes: ["httpBasicAuth", "httpHeaderAuth", "webhookQueryAuth"],
      placeholder: "None (allow all requests)",
    },
    {
      displayName: "HTTP Method",
      name: "httpMethod",
      type: "options",
      // ... other properties
    },
  ],
};
```

## Why Keep Both?

### `credentials` Array (Type Definitions)

**Purpose:** Defines what credential TYPES exist and their structure

- Schema definition only
- Not rendered in UI directly
- Used when creating/editing credentials
- Shared across multiple nodes

**Example:**

```typescript
credentials: [
  {
    name: "httpBasicAuth", // The TYPE identifier
    properties: [
      // What fields this type has
      { name: "username", type: "string" },
      { name: "password", type: "string" },
    ],
  },
];
```

### `credential` Property Type (Selection)

**Purpose:** Where/how to SELECT a credential in the node config

- Rendered as UnifiedCredentialSelector in UI
- Part of the form flow
- Stores credential ID in node
- Just like any other property

**Example:**

```typescript
properties: [
  {
    name: "authentication",
    type: "credential", // Field type
    allowedTypes: ["httpBasicAuth"], // Which types can be selected
  },
];
```

## The Two-Layer System

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Credential Type Definitions (credentials[])   │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│  Define WHAT credentials exist globally:                │
│  • httpBasicAuth: { username, password }               │
│  • httpHeaderAuth: { name, value }                     │
│  • apiKey: { apiKey, addTo, keyName }                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Property Definition (properties[])            │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│  Define WHERE to use credentials in this node:          │
│  • authentication: type "credential"                    │
│    allowedTypes: ["httpBasicAuth", "apiKey"]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### When User Configures Node:

```
1. User sees "Authentication" field (type: credential)
   ↓
2. Clicks → Shows UnifiedCredentialSelector
   ↓
3. Options filtered by allowedTypes: ["httpBasicAuth", ...]
   ↓
4. User selects/creates credential
   ↓
5. Credential ID stored in node.credentials array
   ↓
6. At execution time, credential data fetched by ID
```

### Storage:

```typescript
// Node in workflow
{
  id: "node-123",
  type: "webhook-trigger",
  parameters: {
    httpMethod: "POST",
    path: "/webhook",
    // authentication field does NOT store here
  },
  credentials: ["cred-abc-123"]  // ← Credential ID stored separately
}

// Credential in database
{
  id: "cred-abc-123",
  type: "httpBasicAuth",  // References credential definition
  name: "My Basic Auth",
  data: {
    username: "admin",     // Encrypted
    password: "secret"     // Encrypted
  }
}
```

## Benefits of This Architecture

### 1. **Separation of Concerns**

- ✅ Credential **definitions** are global and reusable
- ✅ Credential **selection** is per-node and contextual
- ✅ Clean separation between schema and usage

### 2. **Consistency**

- ✅ Credentials treated like any other field type
- ✅ Same FormGenerator handles everything
- ✅ No special cases in rendering logic

### 3. **Flexibility**

- ✅ Multiple nodes can use same credential types
- ✅ Node can have multiple credential fields if needed
- ✅ Credential fields can use displayOptions like other fields

### 4. **DRY (Don't Repeat Yourself)**

- ✅ Credential type defined once, used everywhere
- ✅ No duplicate credential schemas across nodes
- ✅ Changes to credential type affect all nodes

## Comparison with Old Architecture

### Old (credentialSelector at node level):

```typescript
{
  credentials: [...],           // Type definitions
  credentialSelector: {         // ← Special node-level config
    allowedTypes: [...]
  },
  properties: [...]             // Regular properties
}

// Frontend had to:
// 1. Convert credentialSelector to field
// 2. Add to FormGenerator
// 3. Special handling in onChange
```

### New (credential as property type):

```typescript
{
  credentials: [...],           // Type definitions (same)
  properties: [
    {
      type: "credential",       // ← Just another property!
      allowedTypes: [...]
    },
    // ... other properties
  ]
}

// Frontend just renders:
// FormGenerator handles it automatically!
```

## Code Reduction

### ConfigTab.tsx

**Before:**

- ~40 lines to convert credentialSelector
- Special handling for \_\_credential field
- Complex credential ID mapping logic

**After:**

- ~10 lines to detect credential type fields
- Same handling as any other field type
- Clean, uniform logic

### Node Definition

**Before:**

```typescript
credentials: [...],
credentialSelector: {...},  // ← Separate config (duplicate info)
properties: [...]
```

**After:**

```typescript
credentials: [...],
properties: [
  { type: "credential", ... },  // ← Just another property
  ...
]
```

## Migration Summary

### What Changed:

1. ✅ Removed `credentialSelector` from node definitions
2. ✅ Added `type: "credential"` to properties array
3. ✅ Updated `NodeProperty` type to include `"credential"`
4. ✅ Simplified ConfigTab to handle credential fields uniformly
5. ✅ FieldRenderer already handles credential type

### What Stayed Same:

1. ✅ `credentials` array (type definitions) - still needed
2. ✅ Credential storage format - credentials array on nodes
3. ✅ Credential encryption and security
4. ✅ UnifiedCredentialSelector component - reused as-is

### Backward Compatibility:

- ✅ Legacy nodes with old `credentials` array still work
- ✅ Old `credentialSelector` nodes would need migration
- ✅ Can coexist with legacy rendering during transition

## Result

**Credentials are now just another field type** - no special cases, no duplicate code, consistent architecture throughout! 🎉

The `credentials` array serves its true purpose: **defining credential type schemas**.
The `credential` property type serves its true purpose: **selecting credentials in forms**.

Clean, simple, and elegant! ✨
