# Webhook Authentication Implementation

## Overview

Successfully implemented secure webhook authentication using credentials stored in the database with encryption support.

## Architecture

### Components Modified

1. **Frontend (ConfigTab.tsx)**

   - Integrated `UnifiedCredentialSelector` as a standard field type in `FormGenerator`
   - Credential values saved to `node.parameters.authentication`
   - Backward compatibility maintained with `node.credentials` object

2. **Backend (TriggerService.ts)**

   - Added `CredentialService` dependency for secure credential decryption
   - Detects credential IDs in both UUID and CUID (Prisma) formats
   - Automatically fetches and decrypts credentials before validation
   - Maps credential types to authentication configs:
     - `httpBasicAuth` → Basic Authentication
     - `httpHeaderAuth` → Custom Header Authentication
     - `webhookQueryAuth` → Query Parameter Authentication

3. **Backend (CredentialService.ts)**
   - Added `getCredentialById()` method for system-level credential access
   - Bypasses user ownership checks (for webhook/trigger use cases)
   - Automatically handles AES-256-CBC decryption

## Authentication Flow

```
Incoming Webhook Request
  ↓
handleWebhookTrigger()
  ↓
Check trigger.settings.authentication
  ↓
Is it a credential ID? (UUID or CUID format)
  ↓
Fetch credential via CredentialService.getCredentialById()
  ↓
Decrypt credential data (automatic)
  ↓
Map credential type to auth config
  ↓
validateWebhookAuthentication()
  ↓
  ├─ Basic Auth: Validate Authorization header (Base64 username:password)
  ├─ Header Auth: Validate custom header value
  └─ Query Auth: Validate query parameter value
  ↓
Return 401 if validation fails
  ↓
Execute workflow if validation succeeds
```

## Credential ID Format Support

### UUID Format

- Pattern: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Example: `5b0ca990-19ce-42c9-80d0-58d7156e32e4`

### CUID Format (Prisma Default)

- Pattern: `c[a-z0-9]{24}`
- Example: `cmgmvwnj20001toz74xhkfyrg`

## Security Features

✅ **Encrypted Storage**: All credential data encrypted with AES-256-CBC
✅ **Automatic Decryption**: Handled transparently by CredentialService
✅ **Type Validation**: Only supported credential types accepted
✅ **401 Response**: Unauthorized access properly rejected
✅ **No Plaintext Logging**: Sensitive data not logged in production

## Testing

### Test Basic Authentication

```bash
# Without credentials (should fail with 401)
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID

# With valid credentials (should succeed)
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID \
  -u "username:password"
```

### Test Header Authentication

```bash
# With custom header
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID \
  -H "X-Custom-Auth: your-token"
```

### Test Query Authentication

```bash
# With query parameter
curl -X POST "http://localhost:4000/webhook/YOUR_WEBHOOK_ID?token=your-token"
```

## Configuration

### Frontend - Webhook Trigger Node

```typescript
{
  displayName: "Authentication",
  name: "authentication",
  type: "credential",
  allowedTypes: ["httpBasicAuth", "httpHeaderAuth", "webhookQueryAuth"],
  default: "",
  description: "Authentication method for webhook"
}
```

### Backend - Credential Types

**HTTP Basic Auth**:

```json
{
  "username": "myuser",
  "password": "mypassword"
}
```

**HTTP Header Auth**:

```json
{
  "name": "X-API-Key",
  "value": "your-secret-token"
}
```

**Webhook Query Auth**:

```json
{
  "paramName": "token",
  "value": "your-secret-token"
}
```

## Migration Notes

### Old Format (Legacy)

```typescript
trigger.settings.authentication = "basic";
trigger.settings.username = "user";
trigger.settings.password = "pass";
```

### New Format (Current)

```typescript
trigger.settings.authentication = "cmgmvwnj20001toz74xhkfyrg"; // Credential ID
```

Both formats are supported for backward compatibility.

## Error Handling

| Error                       | Status  | Description                          |
| --------------------------- | ------- | ------------------------------------ |
| Credential not found        | 401     | Invalid credential ID                |
| Credential expired          | 401     | Credential past expiration date      |
| Authentication failed       | 401     | Invalid credentials provided         |
| Missing auth header         | 401     | Required authentication not provided |
| Unsupported credential type | Warning | Falls back to no authentication      |

## Future Enhancements

- [ ] OAuth 2.0 support
- [ ] API key rotation
- [ ] Rate limiting per credential
- [ ] Audit logging for failed auth attempts
- [ ] Webhook signature verification (HMAC)
- [ ] IP whitelisting

## Files Modified

### Backend

- `/backend/src/services/TriggerService.ts` - Main webhook authentication logic
- `/backend/src/services/CredentialService.ts` - Added `getCredentialById()` method
- `/backend/src/services/triggerServiceSingleton.ts` - Added CredentialService parameter
- `/backend/src/routes/webhook.ts` - Initialize and pass CredentialService

### Frontend

- `/frontend/src/components/workflow/node-config/tabs/ConfigTab.tsx` - Credential field handling
- No changes needed - credential field already supported via FormGenerator

## Dependencies

- `crypto` (Node.js) - AES-256-CBC encryption/decryption
- `@prisma/client` - Database access
- `buffer` (Node.js) - Base64 decoding for Basic Auth

## Environment Variables

```env
# Required for credential encryption/decryption
CREDENTIAL_ENCRYPTION_KEY=your-64-character-hex-string
```

Generate a secure key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**Status**: ✅ Implemented and tested
**Version**: 1.0.0
**Last Updated**: October 12, 2025
