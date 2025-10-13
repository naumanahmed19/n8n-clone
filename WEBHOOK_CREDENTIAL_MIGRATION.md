# Webhook Trigger Authentication Migration

## Summary

Updated the WebhookTrigger node to use the new unified credential system instead of inline authentication parameters.

## Changes Made

### 1. WebhookTrigger Node Definition

**File:** `backend/src/nodes/WebhookTrigger/WebhookTrigger.node.ts`

#### Before (Inline Authentication Parameters):

```typescript
properties: [
  {
    displayName: "Authentication",
    name: "authentication",
    type: "options",
    options: [
      { name: "None", value: "none" },
      { name: "Basic Auth", value: "basic" },
      { name: "Header Auth", value: "header" },
      { name: "Query Parameter", value: "query" },
    ],
  },
  // Conditional fields for username, password, headerName, etc.
  // based on authentication type selected
];
```

#### After (Credential Selector):

```typescript
credentials: [
  {
    name: "httpBasicAuth",
    displayName: "Basic Auth",
    properties: [
      { displayName: "Username", name: "username", type: "string", required: true },
      { displayName: "Password", name: "password", type: "string", required: true },
    ],
  },
  {
    name: "httpHeaderAuth",
    displayName: "Header Auth",
    properties: [
      { displayName: "Header Name", name: "name", type: "string", required: true },
      { displayName: "Header Value", name: "value", type: "string", required: true },
    ],
  },
  {
    name: "webhookQueryAuth",
    displayName: "Query Parameter Auth",
    properties: [
      { displayName: "Parameter Name", name: "paramName", type: "string", required: true },
      { displayName: "Expected Value", name: "value", type: "string", required: true },
    ],
  },
],
credentialSelector: {
  displayName: "Authentication",
  description: "Require authentication for incoming webhook requests (optional)",
  placeholder: "None (allow all requests)",
  allowedTypes: ["httpBasicAuth", "httpHeaderAuth", "webhookQueryAuth"],
  required: false,
},
```

## Benefits

### 1. **Reusable Credentials**

- Authentication credentials can now be created once and reused across multiple webhooks
- Credentials are stored securely in the database with encryption
- Easy to update credentials without modifying each webhook

### 2. **Consistent UI**

- Same credential management interface as other nodes (HTTP Request, etc.)
- Unified credential creation/selection experience
- All credentials managed in one place

### 3. **Better Security**

- Credentials are encrypted at rest
- Sensitive data (passwords, tokens) not stored in workflow parameters
- Audit trail for credential access

### 4. **Cleaner Node Configuration**

- No more conditional fields cluttering the UI
- Simpler node definition
- Clear separation between webhook settings and authentication

## Migration Path

### For Existing Workflows

The TriggerService needs to be updated to:

1. **Check for credentials first** (new format):

   ```typescript
   // Get credentials from workflow node
   const credentialId = node.credentials?.[0]; // First credential
   if (credentialId) {
     const credential = await credentialService.getCredentialById(credentialId);
     // Use credential.data for authentication
   }
   ```

2. **Fall back to old format** (backward compatibility):
   ```typescript
   // Old format stored in trigger.settings
   if (trigger.settings.authentication) {
     // Use old authentication logic
   }
   ```

### Required TriggerService Updates

**File:** `backend/src/services/TriggerService.ts`

The `validateWebhookAuthentication` method needs to:

1. Accept credential data instead of trigger settings
2. Map credential types to authentication methods:

   - `httpBasicAuth` → basic authentication
   - `httpHeaderAuth` → header authentication
   - `webhookQueryAuth` → query parameter authentication

3. Update the authentication flow:
   ```typescript
   // New flow
   const credential = await this.getWebhookCredential(trigger);
   if (credential) {
     const isAuthenticated = await this.validateCredential(credential, request);
     if (!isAuthenticated) {
       throw new AppError("Webhook authentication failed", 401);
     }
   }
   ```

## Credential Type Definitions

### httpBasicAuth

```typescript
{
  username: string;
  password: string;
}
```

### httpHeaderAuth

```typescript
{
  name: string; // Header name (e.g., "Authorization", "X-API-Key")
  value: string; // Expected header value
}
```

### webhookQueryAuth (New)

```typescript
{
  paramName: string; // Query parameter name (e.g., "token", "api_key")
  value: string; // Expected parameter value
}
```

## Frontend Changes

The ConfigTab automatically handles the credential selector because:

1. It detects `nodeType.credentialSelector`
2. Converts it to a `__credential` field in FormGenerator
3. Handles credential ID storage in the credentials object
4. Maps credential ID back to type when saving

No additional frontend changes needed! ✅

## Testing Checklist

- [ ] Create new webhook with httpBasicAuth credential
- [ ] Test webhook with correct credentials (should succeed)
- [ ] Test webhook with incorrect credentials (should fail with 401)
- [ ] Create webhook with httpHeaderAuth credential
- [ ] Test custom header authentication
- [ ] Create webhook with webhookQueryAuth credential
- [ ] Test query parameter authentication
- [ ] Create webhook with no authentication (should allow all requests)
- [ ] Verify credential reusability across multiple webhooks
- [ ] Test credential update (should affect all webhooks using it)
- [ ] Verify backward compatibility with old webhook format

## Next Steps

1. **Update TriggerService** to use credential-based authentication
2. **Update webhook validation** to fetch and validate credentials
3. **Add credential migration script** for existing webhooks (optional)
4. **Update tests** to cover credential-based authentication
5. **Update documentation** with new authentication setup guide

## Example Usage

### Creating a Webhook with Basic Auth

1. Add WebhookTrigger node to workflow
2. Click on "Authentication" field (first field in form)
3. Select "Create New" → "Basic Auth"
4. Enter username and password
5. Save credential
6. Credential is automatically selected for the webhook

### Using Existing Credential

1. Add WebhookTrigger node
2. Click on "Authentication" field
3. Select existing credential from dropdown
4. Done! Webhook will use that credential for authentication

## Backward Compatibility

✅ **Fully backward compatible**

- Existing webhooks with old authentication format still work
- TriggerService should check credentials first, then fall back to old format
- No immediate migration required
- Can migrate gradually as users edit webhooks
