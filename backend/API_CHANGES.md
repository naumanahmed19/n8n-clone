# API Changes: Node Template Generation

## New Endpoint: Generate Node Template as Zip

### POST `/api/custom-nodes/generate-zip`

Generates a new custom node package template and returns it as a downloadable zip file instead of creating files on the server.

#### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

```json
{
  "name": "my-custom-node",
  "displayName": "My Custom Node",
  "description": "A custom node that does something useful",
  "type": "action", // "action" | "trigger" | "transform"
  "author": "Your Name",
  "version": "1.0.0",
  "group": "custom,utility", // comma-separated string
  "includeCredentials": true,
  "includeTests": true,
  "typescript": true
}
```

#### Response

- **Success (200)**: Returns zip file as binary data with appropriate headers

  - `Content-Type: application/zip`
  - `Content-Disposition: attachment; filename="my-custom-node.zip"`
  - `Content-Length: <file-size>`

- **Error (400)**: Missing required fields

```json
{
  "success": false,
  "error": "Name, displayName, description, and type are required"
}
```

- **Error (500)**: Server error

```json
{
  "success": false,
  "error": "Failed to generate package zip",
  "details": ["Error details..."]
}
```

#### Example Usage (JavaScript)

```javascript
const response = await fetch("/api/custom-nodes/generate-zip", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "my-custom-node",
    displayName: "My Custom Node",
    description: "A custom node that does something useful",
    type: "action",
    author: "Your Name",
    includeCredentials: true,
    includeTests: true,
    typescript: true,
  }),
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-custom-node.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

## Changes Made

1. **NodeTemplateGenerator.ts**:

   - Added `TemplateZipResult` interface
   - Added `generateNodePackageZip()` method that creates zip in memory
   - Refactored existing methods to separate content generation from file writing
   - Added helper methods: `generatePackageJsonContent()`, `generateTypeScriptConfigContent()`, `getGitignoreContent()`

2. **custom-nodes.ts**:
   - Added new `/generate-zip` endpoint
   - Endpoint returns zip file as binary download
   - Maintains existing `/generate` endpoint for backward compatibility

## Benefits

- **Better UX**: Users can immediately download and use the generated template
- **Server Resources**: No temporary files created on server disk
- **Security**: No file system access required for template generation
- **Portability**: Generated templates can be easily shared and distributed
