# Quick Start: Using Core Credentials

## For Node Developers

### Scenario 1: Adding a New Google Service Node

You want to add a Gmail node. Instead of creating a new credential:

```javascript
// ❌ DON'T DO THIS (old way)
// gmail/credentials/gmailOAuth2.credentials.js
const GmailOAuth2Credentials = {
  name: "gmailOAuth2",
  // ... duplicate OAuth2 logic
};

// ✅ DO THIS (new way)
// gmail/nodes/gmail.node.js
const GmailNode = {
  type: "gmail",
  displayName: "Gmail",
  credentials: [
    {
      name: "googleOAuth2",  // Use core credential
      required: true
    }
  ],
  execute: async function(inputData) {
    const credentials = await this.getCredentials("googleOAuth2");
    
    // Use with Gmail API
    const { google } = require("googleapis");
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });
    
    const gmail = google.gmail({ version: "v1", auth });
    // ... your Gmail logic
  }
};
```

**That's it!** No credential file needed. Users can now use their existing Google OAuth2 credential with your Gmail node.

### Scenario 2: Adding a Node with API Key Auth

You want to add an OpenAI node:

```javascript
// openai/nodes/openai.node.js
const OpenAINode = {
  type: "openai",
  displayName: "OpenAI",
  credentials: [
    {
      name: "apiKey",  // Use core credential
      required: true
    }
  ],
  execute: async function(inputData) {
    const credentials = await this.getCredentials("apiKey");
    
    // Use the API key
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [/* ... */]
      })
    });
    
    // ... process response
  }
};
```

### Scenario 3: Adding a Node with HTTP Basic Auth

You want to add a node for a service that uses basic auth:

```javascript
// myservice/nodes/myservice.node.js
const MyServiceNode = {
  type: "myservice",
  displayName: "My Service",
  credentials: [
    {
      name: "httpBasicAuth",  // Use core credential
      required: true
    }
  ],
  execute: async function(inputData) {
    const credentials = await this.getCredentials("httpBasicAuth");
    
    // Use basic auth
    const response = await fetch("https://api.myservice.com/data", {
      headers: {
        "Authorization": `Basic ${Buffer.from(
          `${credentials.username}:${credentials.password}`
        ).toString("base64")}`
      }
    });
    
    // ... process response
  }
};
```

### Scenario 4: Adding a Node with Generic OAuth2

You want to add a GitHub node:

```javascript
// github/nodes/github.node.js
const GitHubNode = {
  type: "github",
  displayName: "GitHub",
  credentials: [
    {
      name: "oauth2",  // Use core generic OAuth2
      required: true
    }
  ],
  execute: async function(inputData) {
    const credentials = await this.getCredentials("oauth2");
    
    // Use OAuth2 token
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        "Authorization": `Bearer ${credentials.accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    
    // ... process response
  }
};
```

## Decision Tree: Which Credential to Use?

```
Is it a Google service (Drive, Sheets, Gmail, Calendar)?
├─ YES → Use "googleOAuth2"
└─ NO
   │
   Does it use OAuth2?
   ├─ YES → Use "oauth2"
   └─ NO
      │
      Does it use an API key?
      ├─ YES → Use "apiKey"
      └─ NO
         │
         Does it use username/password?
         ├─ YES → Use "httpBasicAuth"
         └─ NO → Create a custom credential
```

## Common Patterns

### Pattern 1: Multiple Auth Methods

Support both OAuth2 and API key:

```javascript
credentials: [
  {
    name: "oauth2",
    required: false
  },
  {
    name: "apiKey",
    required: false
  }
],

execute: async function(inputData) {
  let auth;
  
  // Try OAuth2 first
  try {
    const credentials = await this.getCredentials("oauth2");
    auth = { type: "oauth2", token: credentials.accessToken };
  } catch (error) {
    // Fall back to API key
    const credentials = await this.getCredentials("apiKey");
    auth = { type: "apiKey", key: credentials.apiKey };
  }
  
  // Use auth...
}
```

### Pattern 2: Optional Credentials

Make credentials optional for public APIs:

```javascript
credentials: [
  {
    name: "apiKey",
    required: false  // Optional
  }
],

execute: async function(inputData) {
  let headers = {};
  
  // Add auth if available
  try {
    const credentials = await this.getCredentials("apiKey");
    headers["Authorization"] = `Bearer ${credentials.apiKey}`;
  } catch (error) {
    // No credentials, use public API
  }
  
  const response = await fetch(url, { headers });
  // ...
}
```

### Pattern 3: Service-Specific Scopes

Request specific scopes for Google services:

```javascript
// In your node's documentation or description
description: "Access Gmail. Requires Google OAuth2 credential with Gmail scopes: " +
             "https://www.googleapis.com/auth/gmail.readonly"

// Users will add these scopes when creating the credential
```

## Testing Your Node

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check logs**:
   ```
   ✅ Registered 4 core credential types
   ```

3. **In the UI**:
   - Go to Credentials
   - Create a new credential
   - Select the core credential type (e.g., "Google OAuth2")
   - Complete the OAuth flow
   - Add your node to a workflow
   - Select the credential
   - Test execution

## When to Create a Custom Credential

Create a custom credential only if:

1. **Service-specific properties needed**:
   ```javascript
   // Example: Twilio needs Account SID + Auth Token
   const TwilioCredentials = {
     name: "twilioApi",
     properties: [
       { name: "accountSid", type: "string" },
       { name: "authToken", type: "password" }
     ]
   };
   ```

2. **Complex authentication flow**:
   ```javascript
   // Example: AWS needs region + access key + secret key
   const AWSCredentials = {
     name: "awsApi",
     properties: [
       { name: "region", type: "string" },
       { name: "accessKeyId", type: "string" },
       { name: "secretAccessKey", type: "password" }
     ]
   };
   ```

3. **Custom validation logic**:
   ```javascript
   const CustomCredentials = {
     name: "customApi",
     test: async (data) => {
       // Custom validation logic
       const isValid = await validateWithService(data);
       return { success: isValid, message: "..." };
     }
   };
   ```

## Troubleshooting

### "Credential type not found"

**Problem**: Node references a credential that doesn't exist.

**Solution**: Check the credential name matches exactly:
```javascript
// ❌ Wrong
credentials: [{ name: "googleOauth2" }]  // lowercase 'o'

// ✅ Correct
credentials: [{ name: "googleOAuth2" }]  // camelCase
```

### "No credentials available"

**Problem**: User hasn't created a credential yet.

**Solution**: Add helpful error message:
```javascript
try {
  const credentials = await this.getCredentials("googleOAuth2");
} catch (error) {
  throw new Error(
    "No Google OAuth2 credential found. Please create one in the Credentials section."
  );
}
```

### "Access token expired"

**Problem**: OAuth2 token needs refresh.

**Solution**: Core credentials handle this automatically. If you see this error, the refresh token might be invalid. User needs to re-authorize.

## Best Practices

1. **Use core credentials whenever possible**
2. **Document required scopes** for OAuth2
3. **Provide helpful error messages**
4. **Test with real credentials**
5. **Handle missing credentials gracefully**
6. **Don't log sensitive credential data**

## Examples in the Codebase

Check these files for reference:

- `backend/custom-nodes/google-drive/google-drive.node.UPDATED.js` - Example of using googleOAuth2
- `backend/src/nodes/HttpRequest/` - Example of using httpBasicAuth and apiKey
- `backend/src/credentials/README.md` - Detailed documentation

## Need Help?

1. Check `backend/src/credentials/README.md` for detailed docs
2. Look at existing nodes for examples
3. Review `backend/src/credentials/ARCHITECTURE.md` for system design
4. Check the core credential definitions in `backend/src/credentials/*.credentials.ts`

## Summary

**Before**: Define credentials for each node → Duplication → Maintenance nightmare

**After**: Reference core credentials → No duplication → Easy maintenance

**Result**: Faster development, better user experience, easier maintenance! 🚀
