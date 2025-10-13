# HTTP Request Node - Credentials Support

## Overview

The HTTP Request node now supports multiple authentication methods through credentials. This allows you to securely store and reuse authentication information across multiple HTTP Request nodes.

## Supported Authentication Types

### 1. Basic Auth (httpBasicAuth)

Traditional HTTP Basic Authentication using username and password.

**Configuration:**

- **Username**: Your username for authentication
- **Password**: Your password for authentication

**How it works:**

- Automatically encodes username:password in Base64
- Adds `Authorization: Basic <encoded-credentials>` header
- Compatible with most APIs that support Basic Auth

**Example Use Cases:**

- Legacy APIs
- Simple authentication scenarios
- Development/testing environments

**Example:**

```
Username: admin
Password: secret123

Result Header: Authorization: Basic YWRtaW46c2VjcmV0MTIz
```

---

### 2. Bearer Token (httpBearerAuth)

Modern token-based authentication commonly used with OAuth 2.0 and JWT.

**Configuration:**

- **Token**: Your bearer token

**How it works:**

- Adds `Authorization: Bearer <token>` header
- Supports JWT tokens, OAuth tokens, and custom bearer tokens

**Example Use Cases:**

- OAuth 2.0 APIs
- JWT-based APIs
- Modern REST APIs

**Example:**

```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Result Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. Header Auth (httpHeaderAuth)

Custom header-based authentication for flexible scenarios.

**Configuration:**

- **Header Name**: Name of the header (e.g., `Authorization`, `X-API-Key`, `X-Auth-Token`)
- **Header Value**: Value to send in the header

**How it works:**

- Adds a custom header with the specified name and value
- Flexible for any header-based authentication scheme

**Example Use Cases:**

- Custom authentication schemes
- API keys in custom headers
- Non-standard authentication

**Example:**

```
Header Name: X-API-Key
Header Value: sk_live_1234567890abcdef

Result Header: X-API-Key: sk_live_1234567890abcdef
```

---

### 4. API Key (apiKey)

API key authentication with flexible placement options.

**Configuration:**

- **API Key**: Your API key
- **Add To**: Where to add the API key (`Header` or `Query String`)
- **Key Name**: Name of the header/parameter (e.g., `api_key`, `apiKey`, `key`)

**How it works:**

- **Header mode**: Adds API key as a header
- **Query String mode**: Appends API key to URL as query parameter

**Example Use Cases:**

- SaaS APIs (Stripe, SendGrid, etc.)
- Cloud services
- Third-party integrations

**Example (Header mode):**

```
API Key: sk_test_1234567890
Add To: Header
Key Name: X-API-Key

Result Header: X-API-Key: sk_test_1234567890
```

**Example (Query String mode):**

```
API Key: abc123def456
Add To: Query String
Key Name: api_key
URL: https://api.example.com/users

Result URL: https://api.example.com/users?api_key=abc123def456
```

---

## How to Use Credentials

### Step 1: Create a Credential

1. Open the HTTP Request node
2. Click on the **Credentials** dropdown
3. Select **Create New Credential**
4. Choose the authentication type (Basic Auth, Bearer Token, etc.)
5. Fill in the required fields
6. Click **Save**

### Step 2: Use the Credential

1. Select your saved credential from the dropdown
2. The node will automatically apply the authentication
3. You can reuse the same credential across multiple nodes

### Step 3: Test Your Request

1. Configure your HTTP Request node settings
2. The credential will be automatically applied
3. Execute the workflow to test

---

## Security Best Practices

### ✅ Do:

- Store sensitive credentials using the credential system (not in node parameters)
- Use environment variables for credential values in production
- Rotate credentials regularly
- Use the most restrictive authentication method available
- Limit credential access to necessary team members

### ❌ Don't:

- Hardcode credentials in node parameters
- Share credentials in plain text
- Use the same credentials across different environments (dev/prod)
- Commit credentials to version control
- Use admin credentials for automated workflows

---

## Priority and Conflict Resolution

If multiple credential types are configured, they are applied in this order (last one wins):

1. Basic Auth
2. Bearer Token
3. Header Auth
4. API Key

**Note:** It's recommended to use only one authentication method per node to avoid conflicts.

---

## Examples

### Example 1: Accessing a Webhook with Bearer Token

```json
{
  "method": "GET",
  "url": "http://localhost:4000/webhook/d26c867e-9e61-4b5d-86c5-e14de62299ba",
  "credentials": {
    "httpBearerAuth": {
      "token": "your-webhook-token-here"
    }
  }
}
```

### Example 2: Stripe API with API Key

```json
{
  "method": "GET",
  "url": "https://api.stripe.com/v1/customers",
  "credentials": {
    "apiKey": {
      "apiKey": "sk_test_...",
      "addTo": "header",
      "keyName": "Authorization"
    }
  }
}
```

**Note:** For Stripe, the value would be: `Bearer sk_test_...` (handled by Bearer Auth)

### Example 3: Custom API with Header Auth

```json
{
  "method": "POST",
  "url": "https://api.custom.com/data",
  "credentials": {
    "httpHeaderAuth": {
      "name": "X-Custom-Auth",
      "value": "custom-secret-token"
    }
  }
}
```

### Example 4: Query Parameter API Key

```json
{
  "method": "GET",
  "url": "https://api.weather.com/forecast",
  "credentials": {
    "apiKey": {
      "apiKey": "abc123",
      "addTo": "query",
      "keyName": "appid"
    }
  }
}
```

Result URL: `https://api.weather.com/forecast?appid=abc123`

---

## Troubleshooting

### Issue: Authentication Still Failing

**Possible Causes:**

1. Wrong credential type selected
2. Expired or invalid credentials
3. Incorrect header/parameter names
4. URL encoding issues with special characters

**Solutions:**

- Verify the API documentation for the correct authentication method
- Test credentials directly (e.g., using Postman or curl)
- Check credential expiration dates
- Ensure proper encoding of special characters

### Issue: Credentials Not Applied

**Possible Causes:**

1. Credential not saved properly
2. Wrong credential selected in dropdown
3. Node cached old configuration

**Solutions:**

- Re-save the credential
- Refresh the workflow editor
- Check the execution logs for applied credentials

### Issue: Multiple Authentication Headers

**Possible Causes:**

1. Headers set both in credentials and in the Headers parameter
2. Multiple credential types configured

**Solutions:**

- Use credentials OR manual headers, not both
- Configure only one authentication method

---

## Migration Guide

### From Manual Headers to Credentials

**Before:**

```javascript
{
  "headers": {
    "Authorization": "Bearer mytoken123"
  }
}
```

**After:**

```javascript
{
  "credentials": {
    "httpBearerAuth": {
      "token": "mytoken123"
    }
  },
  "headers": {}  // Remove auth from headers
}
```

### Benefits:

- ✅ Secure storage
- ✅ Reusable across nodes
- ✅ Easy to update
- ✅ Better for team collaboration

---

## Advanced Usage

### Combining with Continue On Fail

```javascript
{
  "url": "https://api.example.com/data",
  "credentials": { /* ... */ },
  "continueOnFail": true,
  "alwaysOutputData": true
}
```

This allows you to:

- See authentication errors without stopping the workflow
- Access error response bodies (e.g., "Invalid API key")
- Build retry logic with different credentials

### Using with Dynamic URLs

Credentials work with dynamic URLs (using expressions):

```javascript
{
  "url": "{{$json.apiEndpoint}}",
  "credentials": { /* ... */ }
}
```

The credential will be applied to the resolved URL.

---

## Related Features

- **Continue On Fail**: Handle authentication errors gracefully
- **Always Output Data**: See 401/403 responses as data
- **Security Validation**: URLs are validated even with credentials

---

## Implementation Details

### Credential Application Order:

1. Parse user-provided headers
2. Check and apply credentials (in priority order)
3. Validate final URL with security validator
4. Execute request with combined headers

### Logging:

The node logs when credentials are applied:

```
INFO: Applied Bearer Token credentials
INFO: Applied API Key to header: X-API-Key
```

This helps with debugging without exposing sensitive values.

---

## Related Files

- `/backend/src/nodes/HttpRequest/HttpRequest.node.ts` - Main implementation
- `/backend/src/types/node.types.ts` - Credential type definitions
- `CONTINUE_ON_FAIL_FEATURE.md` - Related error handling feature

## References

- [HTTP Authentication RFC 7235](https://tools.ietf.org/html/rfc7235)
- [Bearer Token RFC 6750](https://tools.ietf.org/html/rfc6750)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
