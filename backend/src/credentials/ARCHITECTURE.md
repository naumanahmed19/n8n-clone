# Core Credentials Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BEFORE (Duplicated)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Google Drive    │      │  Google Sheets   │                │
│  │      Node        │      │      Node        │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                            │
│           │ requires                │ requires                   │
│           ▼                         ▼                            │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ googleDriveOAuth2│      │googleSheetsOAuth2│                │
│  │   Credential     │      │   Credential     │                │
│  │                  │      │                  │                │
│  │ • Client ID      │      │ • Client ID      │  ❌ Duplicated │
│  │ • Client Secret  │      │ • Client Secret  │  ❌ Duplicated │
│  │ • OAuth Logic    │      │ • OAuth Logic    │  ❌ Duplicated │
│  │ • Test Method    │      │ • Test Method    │  ❌ Duplicated │
│  └──────────────────┘      └──────────────────┘                │
│                                                                   │
│  User must create 2 separate credentials! 😞                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AFTER (Centralized)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Google Drive    │      │  Google Sheets   │                │
│  │      Node        │      │      Node        │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                            │
│           │ uses                    │ uses                       │
│           └────────┬────────────────┘                            │
│                    │                                             │
│                    ▼                                             │
│           ┌──────────────────┐                                  │
│           │  googleOAuth2    │                                  │
│           │ Core Credential  │                                  │
│           │                  │                                  │
│           │ • Client ID      │  ✅ Defined once                │
│           │ • Client Secret  │  ✅ Defined once                │
│           │ • OAuth Logic    │  ✅ Defined once                │
│           │ • Test Method    │  ✅ Defined once                │
│           └──────────────────┘                                  │
│                                                                   │
│  User creates 1 credential, uses it everywhere! 🎉              │
└─────────────────────────────────────────────────────────────────┘
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Startup                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  backend/src/index.ts                            │
│                                                                   │
│  const credentialService = new CredentialService();             │
│  credentialService.registerCoreCredentials(); ◄─────────┐       │
└─────────────────────────────────────────────────────────┼───────┘
                                                           │
                         ┌─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            backend/src/services/CredentialService.ts             │
│                                                                   │
│  registerCoreCredentials() {                                    │
│    const { CoreCredentials } = require("../credentials");       │
│    for (const credential of CoreCredentials) {                  │
│      this.registerCredentialType(credential); ◄────────┐        │
│    }                                                    │        │
│  }                                                      │        │
└─────────────────────────────────────────────────────────┼────────┘
                                                          │
                         ┌────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              backend/src/credentials/index.ts                    │
│                                                                   │
│  export const CoreCredentials = [                               │
│    GoogleOAuth2Credentials,    ◄─────────────────┐              │
│    OAuth2Credentials,          ◄─────────────┐   │              │
│    HttpBasicAuthCredentials,   ◄─────────┐   │   │              │
│    ApiKeyCredentials           ◄─────┐   │   │   │              │
│  ];                                  │   │   │   │              │
└──────────────────────────────────────┼───┼───┼───┼──────────────┘
                                       │   │   │   │
        ┌──────────────────────────────┘   │   │   │
        │  ┌───────────────────────────────┘   │   │
        │  │  ┌────────────────────────────────┘   │
        │  │  │  ┌─────────────────────────────────┘
        ▼  ▼  ▼  ▼
┌─────────────────────────────────────────────────────────────────┐
│           Core Credential Definitions (*.credentials.ts)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ GoogleOAuth2     │  │ OAuth2           │                    │
│  │ Credentials      │  │ Credentials      │                    │
│  │                  │  │                  │                    │
│  │ • Properties     │  │ • Properties     │                    │
│  │ • Test method    │  │ • Test method    │                    │
│  │ • Validation     │  │ • Validation     │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ HttpBasicAuth    │  │ ApiKey           │                    │
│  │ Credentials      │  │ Credentials      │                    │
│  │                  │  │                  │                    │
│  │ • Properties     │  │ • Properties     │                    │
│  │ • Test method    │  │ • Test method    │                    │
│  │ • Validation     │  │ • Validation     │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ Used by
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Nodes                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Google Drive │  │Google Sheets │  │ Gmail Node   │         │
│  │    Node      │  │    Node      │  │              │         │
│  │              │  │              │  │              │         │
│  │ credentials: │  │ credentials: │  │ credentials: │         │
│  │ googleOAuth2 │  │ googleOAuth2 │  │ googleOAuth2 │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ GitHub Node  │  │ Slack Node   │  │ OpenAI Node  │         │
│  │              │  │              │  │              │         │
│  │ credentials: │  │ credentials: │  │ credentials: │         │
│  │ oauth2       │  │ oauth2       │  │ apiKey       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating and Using a Credential

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Creates Credential in UI                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/credentials                                        │
│    {                                                             │
│      name: "My Google Account",                                 │
│      type: "googleOAuth2",                                      │
│      data: { clientId: "...", clientSecret: "..." }            │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CredentialService.createCredential()                         │
│    • Validates against googleOAuth2 definition                  │
│    • Encrypts sensitive data                                    │
│    • Stores in database                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. User Adds Google Drive Node to Workflow                     │
│    • Selects "My Google Account" credential                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Workflow Executes                                            │
│    • Node calls: this.getCredentials("googleOAuth2")           │
│    • CredentialService decrypts data                            │
│    • Returns: { clientId, clientSecret, accessToken, ... }     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Node Uses Credentials                                        │
│    const auth = new google.auth.OAuth2(                         │
│      credentials.clientId,                                      │
│      credentials.clientSecret                                   │
│    );                                                            │
│    auth.setCredentials({                                        │
│      access_token: credentials.accessToken,                     │
│      refresh_token: credentials.refreshToken                    │
│    });                                                           │
│    const drive = google.drive({ version: "v3", auth });        │
└─────────────────────────────────────────────────────────────────┘
```

## Credential Reuse Example

```
User: "Alice"
Credential: "Alice's Google Account" (type: googleOAuth2)

┌─────────────────────────────────────────────────────────────────┐
│                         Workflow 1                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Trigger] → [Google Drive: List Files] → [Process Data]       │
│                      ▲                                           │
│                      │                                           │
│                      └─── Uses "Alice's Google Account"         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Workflow 2                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Trigger] → [Google Sheets: Read] → [Send Email]              │
│                      ▲                                           │
│                      │                                           │
│                      └─── Uses "Alice's Google Account"         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Workflow 3                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Gmail: New Email] → [Google Drive: Upload] → [Notify]        │
│           ▲                      ▲                               │
│           │                      │                               │
│           └──────────────────────┴─── Uses "Alice's Google      │
│                                        Account"                  │
└─────────────────────────────────────────────────────────────────┘

Result: ONE credential, THREE workflows, MULTIPLE nodes! 🎉
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Credential Storage                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Plain Text Input                                               │
│  ┌──────────────────────────────────────────────────┐          │
│  │ {                                                 │          │
│  │   clientId: "123-abc.apps.googleusercontent.com",│          │
│  │   clientSecret: "GOCSPX-secret123",              │          │
│  │   accessToken: "ya29.a0...",                     │          │
│  │   refreshToken: "1//0g..."                       │          │
│  │ }                                                 │          │
│  └──────────────────────────────────────────────────┘          │
│                         │                                        │
│                         │ AES-256-CBC Encryption                │
│                         ▼                                        │
│  Encrypted in Database                                          │
│  ┌──────────────────────────────────────────────────┐          │
│  │ "a3f8b2c1d4e5f6g7:9h8i7j6k5l4m3n2o1p0q..."      │          │
│  └──────────────────────────────────────────────────┘          │
│                         │                                        │
│                         │ Decryption (only when needed)         │
│                         ▼                                        │
│  Used in Execution                                              │
│  ┌──────────────────────────────────────────────────┐          │
│  │ {                                                 │          │
│  │   clientId: "123-abc.apps.googleusercontent.com",│          │
│  │   clientSecret: "GOCSPX-secret123",              │          │
│  │   accessToken: "ya29.a0...",                     │          │
│  │   refreshToken: "1//0g..."                       │          │
│  │ }                                                 │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Comparison with Other Platforms

### n8n
```
Core Credentials:
- googleOAuth2Api
- httpBasicAuth
- oAuth2Api
- apiKey

Nodes reference these core credentials
✅ Same pattern we implemented!
```

### Zapier
```
Core Auth Types:
- OAuth2
- API Key
- Session Auth
- Basic Auth

Apps use these auth types
✅ Same pattern we implemented!
```

### Make (Integromat)
```
Connection Types:
- OAuth2
- API Key
- Custom

Modules use these connection types
✅ Same pattern we implemented!
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Code Duplication** | High (each node defines auth) | None (defined once) |
| **Maintenance** | Update N files | Update 1 file |
| **User Experience** | Create N credentials | Create 1 credential |
| **Consistency** | Varies by node | Consistent everywhere |
| **Testing** | Test each node's auth | Test once |
| **Security Updates** | Update N files | Update 1 file |
| **New Services** | Define auth again | Reference existing |

## Future Enhancements

1. **Credential Templates**: Pre-configured credentials for popular services
2. **Credential Sharing**: Share credentials across team members
3. **Credential Rotation**: Automatic token refresh and rotation
4. **Credential Monitoring**: Alert when credentials expire
5. **Credential Audit**: Track credential usage across workflows
6. **Credential Scopes**: Fine-grained permission control
7. **Credential Inheritance**: Base credentials that can be extended

## Conclusion

The core credentials system provides a scalable, maintainable foundation for authentication across all nodes. It follows industry best practices and eliminates the need to redefine authentication logic for each new service you add.
