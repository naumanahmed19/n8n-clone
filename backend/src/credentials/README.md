# Core Credentials

This directory contains reusable credential definitions that can be shared across multiple nodes.

## Problem

Previously, each custom node (Google Drive, Google Sheets, etc.) had to define its own credential types, leading to:
- **Duplication**: Same OAuth2 logic repeated in multiple places
- **Inconsistency**: Different implementations of the same auth method
- **Maintenance burden**: Updates needed in multiple locations
- **User confusion**: Multiple similar credentials for the same service

## Solution

Core credentials are centralized, reusable authentication definitions that nodes can reference instead of creating their own.

## Available Core Credentials

### 1. Google OAuth2 (`googleOAuth2`)
Generic Google OAuth2 credential that works with all Google services.

**Use for**: Google Drive, Google Sheets, Gmail, Google Calendar, etc.

**Properties**:
- Client ID
- Client Secret
- Scopes (optional, service-specific)
- Access Token (auto-filled via OAuth)
- Refresh Token (auto-filled via OAuth)

### 2. HTTP Basic Auth (`httpBasicAuth`)
Username and password authentication.

**Use for**: APIs that require HTTP Basic Authentication

**Properties**:
- Username
- Password
- Test URL (optional)

### 3. Generic OAuth2 (`oauth2`)
Generic OAuth2 credential for any OAuth2 provider.

**Use for**: GitHub, GitLab, Slack, or any OAuth2 service

**Properties**:
- Authorization URL
- Token URL
- Client ID
- Client Secret
- Scopes
- Access Token (auto-filled)
- Refresh Token (auto-filled)

### 4. API Key (`apiKey`)
Simple API key authentication.

**Use for**: OpenAI, Anthropic, or any API key-based service

**Properties**:
- API Key
- Header Name (default: "Authorization")
- Header Value Prefix (default: "Bearer")
- Test URL (optional)

## How to Use Core Credentials in Your Node

### Option 1: Reference Core Credential (Recommended)

Instead of defining your own credential, reference a core credential:

```javascript
const MyNode = {
  type: "my-service",
  displayName: "My Service",
  // ... other properties
  
  credentials: [
    {
      name: "googleOAuth2",  // Reference the core credential
      required: true
    }
  ],
  
  execute: async function(inputData) {
    // Get the credential data
    const credentials = await this.getCredentials("googleOAuth2");
    
    // Use it with Google APIs
    const { google } = require("googleapis");
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });
    
    // Now use the auth with any Google service
    const drive = google.drive({ version: "v3", auth });
    // ... your logic
  }
};
```

### Option 2: Create Service-Specific Credential (When Needed)

Only create a custom credential if:
- You need service-specific properties
- The core credential doesn't fit your use case
- You need custom validation logic

```javascript
// custom-nodes/my-service/credentials/myService.credentials.js
const MyServiceCredentials = {
  name: "myServiceAuth",
  displayName: "My Service Auth",
  extends: "oauth2",  // Optional: extend a core credential
  properties: [
    // Add service-specific properties
    {
      displayName: "Account ID",
      name: "accountId",
      type: "string",
      required: true
    }
  ],
  test: async (data) => {
    // Custom test logic
  }
};
```

## Benefits of Using Core Credentials

1. **No Duplication**: Write once, use everywhere
2. **Consistency**: Same auth experience across all nodes
3. **Credential Reuse**: Users can use one Google OAuth2 credential for Drive, Sheets, Gmail, etc.
4. **Easier Maintenance**: Update auth logic in one place
5. **Better Testing**: Core credentials have comprehensive test methods
6. **Security**: Centralized security updates

## Migration Guide

### Before (Custom Credential per Node)

```javascript
// google-drive/credentials/googleDriveOAuth2.credentials.js
const GoogleDriveOAuth2Credentials = {
  name: "googleDriveOAuth2",
  displayName: "Google Drive OAuth2",
  properties: [/* OAuth2 properties */],
  test: async (data) => {/* OAuth2 test logic */}
};

// google-sheets/credentials/googleSheetsOAuth2.credentials.js
const GoogleSheetsOAuth2Credentials = {
  name: "googleSheetsOAuth2",
  displayName: "Google Sheets OAuth2",
  properties: [/* Same OAuth2 properties */],
  test: async (data) => {/* Same OAuth2 test logic */}
};
```

### After (Using Core Credential)

```javascript
// google-drive/nodes/google-drive.node.js
const GoogleDriveNode = {
  type: "google-drive",
  displayName: "Google Drive",
  credentials: [
    {
      name: "googleOAuth2",  // Use core credential
      required: true
    }
  ],
  // ... rest of node definition
};

// google-sheets/nodes/google-sheets.node.js
const GoogleSheetsNode = {
  type: "google-sheets",
  displayName: "Google Sheets",
  credentials: [
    {
      name: "googleOAuth2",  // Same core credential
      required: true
    }
  ],
  // ... rest of node definition
};
```

Now users can create ONE Google OAuth2 credential and use it with both Google Drive and Google Sheets nodes!

## Adding New Core Credentials

1. Create a new file in `backend/src/credentials/`
2. Export the credential definition
3. Add it to `index.ts`
4. Register it in the CredentialService initialization

Example:

```typescript
// backend/src/credentials/Slack.credentials.ts
import { CredentialType, CredentialData } from "../services/CredentialService";

export const SlackOAuth2Credentials: CredentialType = {
  name: "slackOAuth2",
  displayName: "Slack OAuth2",
  description: "OAuth2 authentication for Slack",
  icon: "💬",
  color: "#4A154B",
  testable: true,
  properties: [
    // Define properties
  ],
  test: async (data: CredentialData) => {
    // Test logic
  }
};
```

Then add to `index.ts`:
```typescript
export { SlackOAuth2Credentials } from "./Slack.credentials";
```

## Best Practices

1. **Always check for core credentials first** before creating a custom one
2. **Use descriptive names** for service-specific credentials
3. **Implement test methods** to validate credentials
4. **Document required scopes** for OAuth2 credentials
5. **Handle token refresh** for OAuth2 credentials
6. **Sanitize sensitive data** in logs and errors

## Questions?

If you're unsure whether to use a core credential or create a custom one, ask:
- Is this a standard auth method (OAuth2, API Key, Basic Auth)? → Use core credential
- Does my service need special properties? → Extend or create custom
- Will other nodes use this auth? → Consider making it a core credential
