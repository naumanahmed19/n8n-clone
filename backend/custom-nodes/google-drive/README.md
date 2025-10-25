# Google Drive Node

A custom node for interacting with Google Drive API in workflow automation.

## Features

- **List Files**: Browse and search files and folders
- **Upload File**: Upload local files to Google Drive
- **Download File**: Download files from Google Drive
- **Delete File**: Remove files and folders
- **Create Folder**: Create new folders
- **Get File Info**: Retrieve detailed file information
- **Share File**: Share files with specific permissions
- **Copy File**: Duplicate files
- **Move File**: Move files between folders

## Authentication

Supports two authentication methods:

### Google Drive OAuth2 (Recommended for user authentication)
1. Create OAuth2 credentials in Google Cloud Console
2. Add the callback URL to authorized redirect URIs: `http://localhost:3000/oauth/callback`
3. Configure the credentials with:
   - Client ID
   - Client Secret
4. Click "Sign in with Google" to complete OAuth2 flow
5. Access and refresh tokens are automatically managed

### Google Drive Service Account (For server applications)
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Extract the service account email and private key
4. Configure the credentials with:
   - Service Account Email
   - Private Key
   - Scopes (default: full Drive access)

## Required Scopes

### OAuth2 (Default)
- `https://www.googleapis.com/auth/drive` - Full access (automatically configured)

### Service Account (Configurable)
- `https://www.googleapis.com/auth/drive` - Full access (recommended)
- `https://www.googleapis.com/auth/drive.file` - Limited access to app-created files
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access
- `https://www.googleapis.com/auth/drive.metadata` - Metadata access only

## Operations

### List Files
- Browse files in a specific folder or root
- **Dynamic folder selection** with autocomplete dropdown
- Search with Google Drive query syntax
- Filter by file type, name, etc.
- Control number of results returned

### Upload File
- Upload local files to Google Drive
- **Select target folder** from dropdown
- Custom file naming
- Automatic MIME type detection

### Download File
- **Select files** from autocomplete dropdown with icons and sizes
- Download files to local storage
- Return file content as base64
- Preserve original file metadata

### File Management
- **Visual file selection** with file type icons
- Delete files and folders
- Create new folders
- Copy files with new names
- **Move files between folders** with folder picker

### Sharing
- Share with anyone via link
- Share with specific email addresses
- Share with entire domains
- Set permission levels (viewer, commenter, editor)

## Dynamic Options (LoadOptions)

The node provides intelligent autocomplete dropdowns that load data from your Google Drive:

- **📁 Folder Selection**: Browse and select folders with visual hierarchy
- **📄 File Selection**: Choose files with type icons and size information
- **🔄 Real-time Loading**: Options are loaded dynamically based on your credentials
- **🎯 Context-aware**: File lists can be filtered by selected folder

## Error Handling

The node includes comprehensive error handling for:
- Authentication failures
- File not found errors
- Permission denied errors
- Network timeouts
- Invalid parameters

## Settings

- **Request Timeout**: Configure API request timeout (default: 30 seconds)
- **Upload Chunk Size**: Set chunk size for large file uploads (default: 5MB)
- **Continue on Fail**: Process remaining items even if some fail

## Examples

### Basic File Listing
```json
{
  "operation": "list",
  "folderId": "",
  "maxResults": 50
}
```

### Upload with Custom Name
```json
{
  "operation": "upload",
  "filePath": "/path/to/document.pdf",
  "fileName": "My Document.pdf",
  "folderId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
}
```

### Share File Publicly
```json
{
  "operation": "share",
  "fileId": "selected_from_dropdown",
  "shareType": "anyone",
  "role": "reader"
}
```

### Move File Between Folders
```json
{
  "operation": "move",
  "fileId": "selected_from_file_dropdown",
  "targetFolderId": "selected_from_folder_dropdown"
}
```

## User Experience Improvements

- **No more manual ID copying**: Select folders and files from visual dropdowns
- **File type recognition**: Icons help identify file types at a glance
- **Size information**: See file sizes in the dropdown for better selection
- **Error handling**: Clear error messages when credentials are missing
- **Folder hierarchy**: Root folder clearly marked as "📁 Root (My Drive)"

## Dependencies

- `googleapis`: Google APIs client library
- `form-data`: For multipart form uploads

## Installation

1. Place this node in your custom nodes directory
2. Install dependencies: `npm install googleapis form-data`
3. Enable Google Drive API in Google Cloud Console
4. Configure credentials:
   - **OAuth2**: Create OAuth2 credentials and use "Sign in with Google" button
   - **Service Account**: Create service account and configure manually

## OAuth2 Setup (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Drive API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/oauth/callback`
7. Copy Client ID and Client Secret to the credential form
8. Click "Sign in with Google" to complete authorization