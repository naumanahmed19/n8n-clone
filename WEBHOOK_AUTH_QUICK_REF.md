# Webhook Authentication - Quick Reference

## ✅ What Was Fixed

**Problem**: Webhook URLs were accessible without authentication even when credentials were selected.

**Root Causes**:

1. Credential data was encrypted in database but code tried to parse it directly
2. Authentication validation code path wasn't being executed

**Solution**:

1. Integrated `CredentialService` into `TriggerService` for automatic decryption
2. Added `getCredentialById()` method for system-level credential access
3. Cleaned up authentication flow and logging

---

## 🚀 Quick Start

### 1. Create a Credential

In the n8n-clone UI:

1. Go to **Credentials** page
2. Click **New Credential**
3. Select credential type:
   - **HTTP Basic Auth** - Username/password in Authorization header
   - **HTTP Header Auth** - Custom header name and value
   - **Webhook Query Auth** - Token in query parameter

### 2. Configure Webhook Node

1. Add **Webhook Trigger** node to workflow
2. In node config, select **Authentication** field
3. Choose the credential you created
4. Save workflow

### 3. Test Authentication

**Test WITHOUT credentials** (should fail with 401):

```bash
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID
```

**Test WITH Basic Auth** (should succeed):

```bash
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID \
  -u "username:password"
```

**Test WITH Header Auth**:

```bash
curl -X POST http://localhost:4000/webhook/YOUR_WEBHOOK_ID \
  -H "X-API-Key: your-token"
```

**Test WITH Query Auth**:

```bash
curl -X POST "http://localhost:4000/webhook/YOUR_WEBHOOK_ID?token=your-token"
```

---

## 🔧 Developer Guide

### Adding New Credential Types

1. **Define credential schema** in `/backend/src/services/CredentialService.ts`:

```typescript
case "myCustomAuth":
  return {
    name: "myCustomAuth",
    displayName: "My Custom Auth",
    description: "Custom authentication method",
    properties: [
      {
        displayName: "Token",
        name: "token",
        type: "password",
        required: true,
      },
    ],
  };
```

2. **Add validation logic** in `/backend/src/services/TriggerService.ts`:

```typescript
case "myCustomAuth":
  authConfig = {
    type: "custom",
    settings: {
      token: credentialData.token,
    },
  };
  break;
```

3. **Implement validation** in `validateWebhookAuthentication()`:

```typescript
case "custom":
  const customToken = auth.settings?.token;
  const providedToken = request.headers['x-custom-token'];
  return customToken === providedToken;
```

### Debugging Authentication

Enable debug logs to see authentication flow:

```typescript
// In TriggerService.ts, temporarily change logger.debug to logger.info
logger.info("Webhook authentication check", {
  webhookId,
  authConfig,
  authConfigType: typeof authConfig,
});
```

View logs:

```bash
# Backend terminal will show authentication attempts
[INFO] Webhook authentication check
[WARN] Webhook authentication failed
```

### Testing in Postman

**Basic Auth**:

1. Authorization tab → Type: **Basic Auth**
2. Enter username and password
3. Send request

**Header Auth**:

1. Headers tab → Add header: `X-API-Key: your-token`
2. Send request

**Query Auth**:

1. Params tab → Add query param: `token=your-token`
2. Send request

---

## 📚 Code Reference

### Key Files

| File                   | Purpose                          |
| ---------------------- | -------------------------------- |
| `TriggerService.ts`    | Main authentication logic        |
| `CredentialService.ts` | Credential encryption/decryption |
| `webhook.ts`           | Webhook route handler            |
| `ConfigTab.tsx`        | Frontend credential selection    |

### Key Methods

```typescript
// Fetch and decrypt credential
await credentialService.getCredentialById(credentialId);

// Validate webhook authentication
await validateWebhookAuthentication(authConfig, request);

// Handle webhook with auth
await handleWebhookTrigger(webhookId, request);
```

### Data Flow

```
Frontend ConfigTab
  → node.parameters.authentication = credentialId
  → Save workflow
    → extractTriggersFromNodes()
      → trigger.settings.authentication = credentialId
        → activateWebhookTrigger()
          → webhookTriggers.set(webhookId, trigger)

Incoming Request
  → webhook.ts route handler
    → TriggerService.handleWebhookTrigger()
      → Detect credential ID format
        → credentialService.getCredentialById()
          → Decrypt credential data
            → Map to auth config
              → validateWebhookAuthentication()
                → Return 401 if fails
                  → Execute workflow if succeeds
```

---

## 🐛 Common Issues

### Issue: "Credential not found"

**Cause**: Invalid credential ID or credential deleted
**Fix**: Re-select credential in webhook node and save

### Issue: "Failed to decrypt credential data"

**Cause**: `CREDENTIAL_ENCRYPTION_KEY` mismatch or corrupted data
**Fix**:

1. Verify `.env` has correct `CREDENTIAL_ENCRYPTION_KEY`
2. Restart server
3. Re-create credentials if issue persists

### Issue: Still getting 401 with correct credentials

**Cause**: Credential type mismatch or wrong auth method
**Fix**:

1. Check credential type matches webhook requirement
2. Verify request format (header name, param name, etc.)
3. Check logs for specific error

### Issue: Webhook works without authentication

**Cause**: Credential not selected in webhook node
**Fix**: Open webhook node config, select credential, save workflow

---

## 🔐 Security Best Practices

✅ **DO**:

- Use environment variables for encryption keys
- Rotate credentials regularly
- Use HTTPS in production
- Log authentication failures for security monitoring
- Set credential expiration dates

❌ **DON'T**:

- Hardcode credentials in workflow definitions
- Share credentials between different security contexts
- Log credential values in plaintext
- Reuse same credentials across multiple webhooks
- Expose webhook URLs publicly without authentication

---

## 📖 Related Documentation

- [Webhook Trigger Node Documentation](./docs/WEBHOOK_TRIGGER_NODE.md)
- [Credential Management Guide](./docs/CREDENTIALS_STANDARD_FORMAT.md)
- [HTTP Request Credentials](./HTTP_REQUEST_CREDENTIALS.md)
- [Full Implementation Details](./WEBHOOK_AUTHENTICATION_IMPLEMENTATION.md)

---

**Need Help?** Check logs in the backend terminal for detailed error messages.
