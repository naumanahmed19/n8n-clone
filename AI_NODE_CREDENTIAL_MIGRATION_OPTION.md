# Option: Migrate OpenAI and Anthropic to New Credential Format

## Current State (Old Format)

Both OpenAI and Anthropic use the legacy credential format:

```typescript
credentials: [
  {
    name: "apiKey",
    displayName: "API Key",
    properties: [], // Empty - credential is just a simple API key
  },
];
// No credentialSelector - renders with legacy CredentialSelector
```

## Proposed Migration (New Format)

### Option A: Convert to credentialSelector (Recommended)

```typescript
credentials: [
  {
    name: "openaiApiKey",  // or "anthropicApiKey"
    displayName: "OpenAI API Key",
    properties: [
      {
        displayName: "API Key",
        name: "apiKey",
        type: "string",
        required: true,
        default: "",
        description: "Your OpenAI API key from https://platform.openai.com/api-keys",
      },
    ],
  },
],
credentialSelector: {
  displayName: "API Key",
  description: "Your OpenAI API key for authentication",
  placeholder: "Select or create API key...",
  allowedTypes: ["openaiApiKey"],
  required: true,
},
```

### Option B: Add as credential field in properties

Even simpler - add it as a regular field:

```typescript
properties: [
  {
    displayName: "API Key",
    name: "credential",
    type: "credential",
    allowedTypes: ["openaiApiKey"],
    required: true,
    description: "Your OpenAI API key for authentication",
  },
  // ... rest of properties
];
```

## Benefits of Migration

1. ✅ **Consistent UI** - All nodes use the same credential system
2. ✅ **Remove Legacy Code** - Can delete the old credential rendering block
3. ✅ **Better UX** - Unified credential selector with search/filter
4. ✅ **Reusable Credentials** - Share API keys across multiple AI nodes
5. ✅ **Cleaner Code** - Single rendering path in ConfigTab

## Trade-offs

- ⚠️ Need to update 2 node files
- ⚠️ Need to test both nodes after migration
- ⚠️ May need credential migration for existing users (or keep backward compatibility)

## Recommendation

**For now: Keep the legacy block** ✅

The legacy code is:

- Only ~25 lines
- Doesn't add complexity
- Ensures backward compatibility
- Allows gradual migration

**Later: Migrate when time permits**

Can be done as a separate task to:

- Update OpenAI node
- Update Anthropic node
- Remove legacy credential rendering
- Test thoroughly
- Update documentation
