const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const GoogleDriveNode = {
    type: "google-drive",
    displayName: "Google Drive",
    name: "google-drive",
    group: ["cloud-storage"],
    version: 1,
    description: "Interact with Google Drive - upload, download, list, and manage files and folders",
    icon: "file:icon.svg",
    color: "#4285F4",
    defaults: {
        name: "Google Drive"
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
        {
            name: "googleDriveServiceAccount",
            required: false
        },
        {
            name: "googleDriveOAuth2",
            required: false
        }
    ],
    properties: [
        {
            displayName: "Authentication",
            name: "authentication",
            type: "credential",
            required: true,
            default: "",
            description: "Select Google Drive credentials",
            placeholder: "Select credentials...",
            allowedTypes: ["googleDriveServiceAccount", "googleDriveOAuth2"]
        },
        {
            displayName: "Operation",
            name: "operation",
            type: "options",
            default: "list",
            required: true,
            options: [
                {
                    name: "List Files",
                    value: "list",
                    description: "List files and folders"
                },
                {
                    name: "Upload File",
                    value: "upload",
                    description: "Upload a file to Google Drive"
                },
                {
                    name: "Download File",
                    value: "download",
                    description: "Download a file from Google Drive"
                },
                {
                    name: "Delete File",
                    value: "delete",
                    description: "Delete a file or folder"
                },
                {
                    name: "Create Folder",
                    value: "createFolder",
                    description: "Create a new folder"
                },
                {
                    name: "Get File Info",
                    value: "getInfo",
                    description: "Get detailed information about a file"
                },
                {
                    name: "Share File",
                    value: "share",
                    description: "Share a file or folder"
                },
                {
                    name: "Copy File",
                    value: "copy",
                    description: "Copy a file"
                },
                {
                    name: "Move File",
                    value: "move",
                    description: "Move a file to a different folder"
                }
            ],
            description: "The operation to perform"
        },
        // List Files options
        {
            displayName: "Folder",
            name: "folderId",
            type: "autocomplete",
            typeOptions: {
                loadOptionsMethod: "getFolders",
            },
            displayOptions: {
                show: {
                    operation: ["list", "upload", "createFolder", "download", "delete", "getInfo", "share", "copy", "move"]
                }
            },
            default: "",
            description: "Select a folder to browse (leave empty for root)",
            placeholder: "Search and select folder..."
        },
        {
            displayName: "Query",
            name: "query",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["list"]
                }
            },
            default: "",
            description: "Search query to filter files (Google Drive search syntax)",
            placeholder: "name contains 'report' and mimeType = 'application/pdf'"
        },
        {
            displayName: "Max Results",
            name: "maxResults",
            type: "number",
            displayOptions: {
                show: {
                    operation: ["list"]
                }
            },
            default: 100,
            description: "Maximum number of files to return"
        },
        {
            displayName: "Include Trashed",
            name: "includeTrashed",
            type: "boolean",
            displayOptions: {
                show: {
                    operation: ["list"]
                }
            },
            default: false,
            description: "Include trashed files in results"
        },
        // File operations
        {
            displayName: "File",
            name: "fileId",
            type: "autocomplete",
            typeOptions: {
                loadOptionsMethod: "getFilesInFolder",
                loadOptionsDependsOn: ["folderId"]
            },
            displayOptions: {
                show: {
                    operation: ["download", "delete", "getInfo", "share", "copy", "move"]
                }
            },
            default: "",
            required: true,
            description: "Select a file to operate on",
            placeholder: "Search and select file..."
        },
        // Upload options
        {
            displayName: "File Path",
            name: "filePath",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["upload"]
                }
            },
            default: "",
            required: true,
            description: "Local path to the file to upload",
            placeholder: "/path/to/file.pdf"
        },
        {
            displayName: "File Name",
            name: "fileName",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["upload", "createFolder", "copy"]
                }
            },
            default: "",
            description: "Name for the file/folder (leave empty to use original name)",
            placeholder: "my-document.pdf"
        },
        // Download options
        {
            displayName: "Download Path",
            name: "downloadPath",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["download"]
                }
            },
            default: "",
            description: "Local path to save the downloaded file (leave empty to return content)",
            placeholder: "/path/to/save/file.pdf"
        },
        // Share options
        {
            displayName: "Share Type",
            name: "shareType",
            type: "options",
            displayOptions: {
                show: {
                    operation: ["share"]
                }
            },
            options: [
                {
                    name: "Anyone with Link",
                    value: "anyone",
                    description: "Anyone with the link can access"
                },
                {
                    name: "Specific Email",
                    value: "user",
                    description: "Share with specific email address"
                },
                {
                    name: "Domain",
                    value: "domain",
                    description: "Share with entire domain"
                }
            ],
            default: "anyone",
            required: true,
            description: "Type of sharing permission"
        },
        {
            displayName: "Email Address",
            name: "emailAddress",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["share"],
                    shareType: ["user"]
                }
            },
            default: "",
            required: true,
            description: "Email address to share with",
            placeholder: "user@example.com"
        },
        {
            displayName: "Domain",
            name: "domain",
            type: "string",
            displayOptions: {
                show: {
                    operation: ["share"],
                    shareType: ["domain"]
                }
            },
            default: "",
            required: true,
            description: "Domain to share with",
            placeholder: "example.com"
        },
        {
            displayName: "Role",
            name: "role",
            type: "options",
            displayOptions: {
                show: {
                    operation: ["share"]
                }
            },
            options: [
                {
                    name: "Viewer",
                    value: "reader",
                    description: "Can view and download"
                },
                {
                    name: "Commenter",
                    value: "commenter",
                    description: "Can view, download, and comment"
                },
                {
                    name: "Editor",
                    value: "writer",
                    description: "Can view, download, comment, and edit"
                }
            ],
            default: "reader",
            required: true,
            description: "Permission level for the shared file"
        },
        // Move options
        {
            displayName: "Target Folder",
            name: "targetFolderId",
            type: "autocomplete",
            typeOptions: {
                loadOptionsMethod: "getFolders",
            },
            displayOptions: {
                show: {
                    operation: ["move"]
                }
            },
            default: "",
            required: true,
            description: "Select the folder to move the file to",
            placeholder: "Search and select target folder..."
        }
    ],

    // Custom settings
    settings: {
        timeout: {
            displayName: "Request Timeout (ms)",
            name: "timeout",
            type: "number",
            default: 30000,
            description: "Maximum time to wait for API requests"
        },
        chunkSize: {
            displayName: "Upload Chunk Size (MB)",
            name: "chunkSize",
            type: "number",
            default: 5,
            description: "Chunk size for resumable uploads (1-100 MB)"
        }
    },

    execute: async function (inputData) {
        const items = inputData.main?.[0] || [];
        const results = [];

        // If no input items, create a default item
        const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

        // Get settings
        const continueOnFail = this.settings?.continueOnFail ?? false;
        const timeout = this.settings?.timeout ?? 30000;

        // Get credentials and create auth
        let auth;
        let credentialType;
        try {
            // Get the credential that was selected by the user
            // The system maps the authentication field to the first allowed type,
            // but we need to determine the actual type from the credential data
            let credentials = null;

            // Try to get the credential using the mapped type (first allowed type)
            try {
                credentials = await this.getCredentials("googleDriveServiceAccount");
                if (credentials) {
                    // Check if this is actually a service account credential
                    if (credentials.serviceAccountEmail && credentials.privateKey) {
                        credentialType = "serviceAccount";
                    } else if (credentials.clientId && credentials.clientSecret) {
                        // This is actually an OAuth2 credential, but mapped to service account
                        credentialType = "oauth2";
                    }
                }
            } catch (error) {
                // Credential not available
            }

            // If we didn't get a credential or couldn't determine type, try OAuth2 directly
            if (!credentials || !credentialType) {
                try {
                    credentials = await this.getCredentials("googleDriveOAuth2");
                    if (credentials && credentials.clientId && credentials.clientSecret) {
                        credentialType = "oauth2";
                    }
                } catch (error) {
                    // OAuth2 credential not available
                }
            }

            if (!credentials || !credentialType) {
                throw new Error("No Google Drive credentials found. Please configure either OAuth2 or Service Account credentials.");
            }

            if (credentialType === "serviceAccount") {
                auth = new google.auth.JWT(
                    credentials.serviceAccountEmail,
                    null,
                    credentials.privateKey.replace(/\\n/g, '\n'),
                    credentials.scopes || ["https://www.googleapis.com/auth/drive"]
                );
            } else if (credentialType === "oauth2") {
                auth = new google.auth.OAuth2(
                    credentials.clientId,
                    credentials.clientSecret
                );
                auth.setCredentials({
                    access_token: credentials.accessToken,
                    refresh_token: credentials.refreshToken
                });
            } else {
                throw new Error("Invalid credential type");
            }
        } catch (error) {
            throw new Error(`Failed to get credentials: ${error.message}`);
        }

        // Create Drive API client
        const drive = google.drive({ version: "v3", auth, timeout });

        const operation = await this.getNodeParameter("operation");

        for (const item of itemsToProcess) {
            try {
                let result;

                switch (operation) {
                    case "list": {
                        const folderId = await this.getNodeParameter("folderId");
                        const query = await this.getNodeParameter("query");
                        const maxResults = await this.getNodeParameter("maxResults");
                        const includeTrashed = await this.getNodeParameter("includeTrashed");

                        let searchQuery = query || "";

                        // Add folder filter if specified
                        if (folderId) {
                            searchQuery = searchQuery ?
                                `'${folderId}' in parents and (${searchQuery})` :
                                `'${folderId}' in parents`;
                        }

                        // Add trashed filter
                        if (!includeTrashed) {
                            searchQuery = searchQuery ?
                                `${searchQuery} and trashed=false` :
                                "trashed=false";
                        }

                        const response = await drive.files.list({
                            q: searchQuery,
                            pageSize: Math.min(maxResults, 1000),
                            fields: "files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink,webContentLink,thumbnailLink,owners,shared)"
                        });

                        result = {
                            ...item.json,
                            files: response.data.files || [],
                            totalFiles: response.data.files?.length || 0
                        };
                        break;
                    }

                    case "upload": {
                        const filePath = await this.getNodeParameter("filePath");
                        const fileName = await this.getNodeParameter("fileName");
                        const folderId = await this.getNodeParameter("folderId");

                        if (!fs.existsSync(filePath)) {
                            throw new Error(`File not found: ${filePath}`);
                        }

                        const fileStats = fs.statSync(filePath);
                        const finalFileName = fileName || path.basename(filePath);

                        const fileMetadata = {
                            name: finalFileName,
                            parents: folderId ? [folderId] : undefined
                        };

                        const media = {
                            body: fs.createReadStream(filePath)
                        };

                        const response = await drive.files.create({
                            resource: fileMetadata,
                            media: media,
                            fields: "id,name,mimeType,size,webViewLink,webContentLink"
                        });

                        result = {
                            ...item.json,
                            file: response.data,
                            uploaded: true,
                            originalPath: filePath,
                            fileSize: fileStats.size
                        };
                        break;
                    }

                    case "download": {
                        const fileId = await this.getNodeParameter("fileId");
                        const downloadPath = await this.getNodeParameter("downloadPath");

                        // Get file metadata first
                        const fileInfo = await drive.files.get({
                            fileId: fileId,
                            fields: "id,name,mimeType,size"
                        });

                        // Download file content
                        const response = await drive.files.get({
                            fileId: fileId,
                            alt: "media"
                        }, { responseType: "stream" });

                        if (downloadPath) {
                            // Save to file
                            const writer = fs.createWriteStream(downloadPath);
                            response.data.pipe(writer);

                            await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                            });

                            result = {
                                ...item.json,
                                file: fileInfo.data,
                                downloaded: true,
                                downloadPath: downloadPath
                            };
                        } else {
                            // Return content as buffer
                            const chunks = [];
                            for await (const chunk of response.data) {
                                chunks.push(chunk);
                            }
                            const content = Buffer.concat(chunks);

                            result = {
                                ...item.json,
                                file: fileInfo.data,
                                content: content.toString("base64"),
                                contentType: fileInfo.data.mimeType
                            };
                        }
                        break;
                    }

                    case "delete": {
                        const fileId = await this.getNodeParameter("fileId");

                        await drive.files.delete({
                            fileId: fileId
                        });

                        result = {
                            ...item.json,
                            deleted: true,
                            fileId: fileId
                        };
                        break;
                    }

                    case "createFolder": {
                        const folderName = await this.getNodeParameter("fileName");
                        const parentFolderId = await this.getNodeParameter("folderId");

                        if (!folderName) {
                            throw new Error("Folder name is required");
                        }

                        const fileMetadata = {
                            name: folderName,
                            mimeType: "application/vnd.google-apps.folder",
                            parents: parentFolderId ? [parentFolderId] : undefined
                        };

                        const response = await drive.files.create({
                            resource: fileMetadata,
                            fields: "id,name,webViewLink"
                        });

                        result = {
                            ...item.json,
                            folder: response.data,
                            created: true
                        };
                        break;
                    }

                    case "getInfo": {
                        const fileId = await this.getNodeParameter("fileId");

                        const response = await drive.files.get({
                            fileId: fileId,
                            fields: "id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink,webContentLink,thumbnailLink,owners,shared,permissions"
                        });

                        result = {
                            ...item.json,
                            file: response.data
                        };
                        break;
                    }

                    case "share": {
                        const fileId = await this.getNodeParameter("fileId");
                        const shareType = await this.getNodeParameter("shareType");
                        const role = await this.getNodeParameter("role");

                        let permission = {
                            role: role
                        };

                        if (shareType === "anyone") {
                            permission.type = "anyone";
                        } else if (shareType === "user") {
                            const emailAddress = await this.getNodeParameter("emailAddress");
                            permission.type = "user";
                            permission.emailAddress = emailAddress;
                        } else if (shareType === "domain") {
                            const domain = await this.getNodeParameter("domain");
                            permission.type = "domain";
                            permission.domain = domain;
                        }

                        const response = await drive.permissions.create({
                            fileId: fileId,
                            resource: permission,
                            fields: "id,type,role,emailAddress,domain"
                        });

                        // Get the file's web view link
                        const fileInfo = await drive.files.get({
                            fileId: fileId,
                            fields: "webViewLink,webContentLink"
                        });

                        result = {
                            ...item.json,
                            shared: true,
                            permission: response.data,
                            fileId: fileId,
                            webViewLink: fileInfo.data.webViewLink,
                            webContentLink: fileInfo.data.webContentLink
                        };
                        break;
                    }

                    case "copy": {
                        const fileId = await this.getNodeParameter("fileId");
                        const fileName = await this.getNodeParameter("fileName");

                        const copyMetadata = {
                            name: fileName
                        };

                        const response = await drive.files.copy({
                            fileId: fileId,
                            resource: copyMetadata,
                            fields: "id,name,webViewLink,webContentLink"
                        });

                        result = {
                            ...item.json,
                            copied: true,
                            originalFileId: fileId,
                            newFile: response.data
                        };
                        break;
                    }

                    case "move": {
                        const fileId = await this.getNodeParameter("fileId");
                        const targetFolderId = await this.getNodeParameter("targetFolderId");

                        // Get current parents
                        const file = await drive.files.get({
                            fileId: fileId,
                            fields: "parents"
                        });

                        const previousParents = file.data.parents ? file.data.parents.join(",") : "";

                        // Move file
                        const response = await drive.files.update({
                            fileId: fileId,
                            addParents: targetFolderId,
                            removeParents: previousParents,
                            fields: "id,name,parents"
                        });

                        result = {
                            ...item.json,
                            moved: true,
                            fileId: fileId,
                            newParents: response.data.parents,
                            previousParents: previousParents.split(",").filter(p => p)
                        };
                        break;
                    }

                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

                results.push({ json: result });

            } catch (error) {
                this.logger.error(`[GoogleDrive] Error in operation ${operation}:`, error.message);

                if (continueOnFail) {
                    results.push({
                        json: {
                            ...item.json,
                            error: true,
                            errorMessage: error.message,
                            errorDetails: error.toString()
                        }
                    });
                } else {
                    throw error;
                }
            }
        }

        return [{ main: results }];
    },

    /**
     * Load options methods - dynamically load dropdown options
     */
    loadOptions: {
        /**
         * Get list of folders from Google Drive
         */
        async getFolders() {
            try {
                // Get the credential that was selected by the user
                // The system maps the authentication field to the first allowed type,
                // but we need to determine the actual type from the credential data
                let credentials = null;
                let credentialType = null;

                // Try to get the credential using the mapped type (first allowed type)
                try {
                    credentials = await this.getCredentials("googleDriveServiceAccount");
                    if (credentials) {
                        // Check if this is actually a service account credential
                        if (credentials.serviceAccountEmail && credentials.privateKey) {
                            credentialType = "serviceAccount";
                        } else if (credentials.clientId && credentials.clientSecret) {
                            // This is actually an OAuth2 credential, but mapped to service account
                            credentialType = "oauth2";
                        }
                    }
                } catch (error) {
                    // Credential not available
                }

                // If we didn't get a credential or couldn't determine type, try OAuth2 directly
                if (!credentials || !credentialType) {
                    try {
                        credentials = await this.getCredentials("googleDriveOAuth2");
                        if (credentials && credentials.clientId && credentials.clientSecret) {
                            credentialType = "oauth2";
                        }
                    } catch (error) {
                        // OAuth2 credential not available
                    }
                }

                if (!credentials || !credentialType) {
                    return [
                        {
                            name: "No credentials configured",
                            value: "",
                            description: "Please configure Google Drive credentials first",
                        },
                    ];
                }

                // Create auth based on credential type
                if (credentialType === "serviceAccount") {
                    auth = new google.auth.JWT(
                        credentials.serviceAccountEmail,
                        null,
                        credentials.privateKey.replace(/\\n/g, '\n'),
                        credentials.scopes || ["https://www.googleapis.com/auth/drive"]
                    );
                } else if (credentialType === "oauth2") {
                    auth = new google.auth.OAuth2(
                        credentials.clientId,
                        credentials.clientSecret
                    );
                    auth.setCredentials({
                        access_token: credentials.accessToken,
                        refresh_token: credentials.refreshToken
                    });
                }

                // Create Drive API client
                const drive = google.drive({ version: "v3", auth });

                // Query to get all folders with parent information
                const response = await drive.files.list({
                    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
                    pageSize: 1000, // Increased to get more folders
                    fields: "files(id,name,parents)",
                    orderBy: "name"
                });

                const folders = response.data.files || [];

                // Build folder hierarchy
                const folderMap = new Map();
                const rootFolders = [];

                // First pass: create folder map
                folders.forEach(folder => {
                    folderMap.set(folder.id, {
                        id: folder.id,
                        name: folder.name,
                        parents: folder.parents || [],
                        children: [],
                        path: folder.name
                    });
                });

                // Second pass: build hierarchy and paths
                folders.forEach(folder => {
                    const folderData = folderMap.get(folder.id);
                    if (folder.parents && folder.parents.length > 0) {
                        const parentId = folder.parents[0];
                        const parent = folderMap.get(parentId);
                        if (parent) {
                            parent.children.push(folderData);
                            // Build full path
                            folderData.path = `${parent.path}/${folder.name}`;
                        } else {
                            // Parent not in our list (might be root or shared), treat as root level
                            rootFolders.push(folderData);
                        }
                    } else {
                        // No parents, this is a root level folder
                        rootFolders.push(folderData);
                    }
                });

                // Function to recursively build options with indentation
                const buildOptions = (folders, depth = 0) => {
                    const options = [];
                    folders.sort((a, b) => a.name.localeCompare(b.name));

                    folders.forEach(folder => {
                        const indent = "  ".repeat(depth); // 2 spaces per level
                        const icon = depth === 0 ? "📁" : "📂";

                        options.push({
                            name: `${indent}${icon} ${folder.name}`,
                            value: folder.id,
                            description: `Path: ${folder.path}`
                        });

                        // Add children recursively
                        if (folder.children.length > 0) {
                            options.push(...buildOptions(folder.children, depth + 1));
                        }
                    });

                    return options;
                };

                // Start with root folder option
                const options = [
                    {
                        name: "📁 Root (My Drive)",
                        value: "",
                        description: "Root folder of Google Drive"
                    }
                ];

                // Add hierarchical folders
                options.push(...buildOptions(rootFolders));

                return options;

            } catch (error) {
                this.logger?.error("Failed to load folders", { error });

                // Return error message as option
                return [
                    {
                        name: "Error loading folders - check credentials",
                        value: "",
                        description: error.message,
                    },
                ];
            }
        },

        /**
         * Get list of files from Google Drive
         */
        async getFiles() {
            try {
                // Get the credential that was selected by the user
                let credentials = null;
                let credentialType = null;

                // Try to get the credential using the mapped type (first allowed type)
                try {
                    credentials = await this.getCredentials("googleDriveServiceAccount");
                    if (credentials) {
                        // Check if this is actually a service account credential
                        if (credentials.serviceAccountEmail && credentials.privateKey) {
                            credentialType = "serviceAccount";
                        } else if (credentials.clientId && credentials.clientSecret) {
                            // This is actually an OAuth2 credential, but mapped to service account
                            credentialType = "oauth2";
                        }
                    }
                } catch (error) {
                    // Credential not available
                }

                // If we didn't get a credential or couldn't determine type, try OAuth2 directly
                if (!credentials || !credentialType) {
                    try {
                        credentials = await this.getCredentials("googleDriveOAuth2");
                        if (credentials && credentials.clientId && credentials.clientSecret) {
                            credentialType = "oauth2";
                        }
                    } catch (error) {
                        // OAuth2 credential not available
                    }
                }

                if (!credentials || !credentialType) {
                    return [
                        {
                            name: "No credentials configured",
                            value: "",
                            description: "Please configure Google Drive credentials first",
                        },
                    ];
                }

                // Create auth based on credential type
                if (credentialType === "serviceAccount") {
                    auth = new google.auth.JWT(
                        credentials.serviceAccountEmail,
                        null,
                        credentials.privateKey.replace(/\\n/g, '\n'),
                        credentials.scopes || ["https://www.googleapis.com/auth/drive"]
                    );
                } else if (credentialType === "oauth2") {
                    auth = new google.auth.OAuth2(
                        credentials.clientId,
                        credentials.clientSecret
                    );
                    auth.setCredentials({
                        access_token: credentials.accessToken,
                        refresh_token: credentials.refreshToken
                    });
                }

                // Create Drive API client
                const drive = google.drive({ version: "v3", auth });

                // Query to get all files (excluding folders)
                const response = await drive.files.list({
                    q: "mimeType!='application/vnd.google-apps.folder' and trashed=false",
                    pageSize: 100,
                    fields: "files(id,name,mimeType,size)",
                    orderBy: "name"
                });

                const files = response.data.files || [];

                // Format results for dropdown
                return files.map(file => {
                    // Get file icon based on mime type
                    let icon = "📄";
                    if (file.mimeType) {
                        if (file.mimeType.includes("image")) icon = "🖼️";
                        else if (file.mimeType.includes("video")) icon = "🎥";
                        else if (file.mimeType.includes("audio")) icon = "🎵";
                        else if (file.mimeType.includes("pdf")) icon = "📕";
                        else if (file.mimeType.includes("document")) icon = "📝";
                        else if (file.mimeType.includes("spreadsheet")) icon = "📊";
                        else if (file.mimeType.includes("presentation")) icon = "📽️";
                        else if (file.mimeType.includes("zip") || file.mimeType.includes("archive")) icon = "🗜️";
                    }

                    // Format file size
                    let sizeText = "";
                    if (file.size) {
                        const sizeBytes = parseInt(file.size);
                        if (sizeBytes < 1024) sizeText = ` (${sizeBytes} B)`;
                        else if (sizeBytes < 1024 * 1024) sizeText = ` (${Math.round(sizeBytes / 1024)} KB)`;
                        else if (sizeBytes < 1024 * 1024 * 1024) sizeText = ` (${Math.round(sizeBytes / (1024 * 1024))} MB)`;
                        else sizeText = ` (${Math.round(sizeBytes / (1024 * 1024 * 1024))} GB)`;
                    }

                    return {
                        name: `${icon} ${file.name}${sizeText}`,
                        value: file.id,
                        description: `File: ${file.name}`
                    };
                });

            } catch (error) {
                this.logger?.error("Failed to load files", { error });

                // Return error message as option
                return [
                    {
                        name: "Error loading files - check credentials",
                        value: "",
                        description: error.message,
                    },
                ];
            }
        },

        /**
         * Get list of files from a specific folder
         */
        async getFilesInFolder() {
            console.log(`[GoogleDrive] ===== getFilesInFolder method called =====`);
            try {
                // Get the selected folder ID from the form
                const folderId = this.getNodeParameter("folderId") || "";

                // Debug logging
                console.log(`[GoogleDrive] getFilesInFolder called with folderId: "${folderId}"`);
                if (this.logger) {
                    this.logger.info(`[GoogleDrive] getFilesInFolder called with folderId: ${folderId}`);
                }

                // Get the credential that was selected by the user
                let credentials = null;
                let credentialType = null;

                // Try to get the credential using the mapped type (first allowed type)
                try {
                    credentials = await this.getCredentials("googleDriveServiceAccount");
                    if (credentials) {
                        // Check if this is actually a service account credential
                        if (credentials.serviceAccountEmail && credentials.privateKey) {
                            credentialType = "serviceAccount";
                        } else if (credentials.clientId && credentials.clientSecret) {
                            // This is actually an OAuth2 credential, but mapped to service account
                            credentialType = "oauth2";
                        }
                    }
                } catch (error) {
                    // Credential not available
                }

                // If we didn't get a credential or couldn't determine type, try OAuth2 directly
                if (!credentials || !credentialType) {
                    try {
                        credentials = await this.getCredentials("googleDriveOAuth2");
                        if (credentials && credentials.clientId && credentials.clientSecret) {
                            credentialType = "oauth2";
                        }
                    } catch (error) {
                        // OAuth2 credential not available
                    }
                }

                if (!credentials || !credentialType) {
                    return [
                        {
                            name: "No credentials configured",
                            value: "",
                            description: "Please configure Google Drive credentials first",
                        },
                    ];
                }

                // Create auth based on credential type
                if (credentialType === "serviceAccount") {
                    auth = new google.auth.JWT(
                        credentials.serviceAccountEmail,
                        null,
                        credentials.privateKey.replace(/\\n/g, '\n'),
                        credentials.scopes || ["https://www.googleapis.com/auth/drive"]
                    );
                } else if (credentialType === "oauth2") {
                    auth = new google.auth.OAuth2(
                        credentials.clientId,
                        credentials.clientSecret
                    );
                    auth.setCredentials({
                        access_token: credentials.accessToken,
                        refresh_token: credentials.refreshToken
                    });
                }

                // Create Drive API client
                const drive = google.drive({ version: "v3", auth });

                // Build query based on folder selection
                let query = "mimeType!='application/vnd.google-apps.folder' and trashed=false";
                if (folderId) {
                    query += ` and '${folderId}' in parents`;
                } else {
                    // If no folder selected, show files in root
                    query += " and 'root' in parents";
                }

                console.log(`[GoogleDrive] Query: ${query}`);

                // Query to get files in the specified folder
                const response = await drive.files.list({
                    q: query,
                    pageSize: 100,
                    fields: "files(id,name,mimeType,size)",
                    orderBy: "name"
                });

                const files = response.data.files || [];
                console.log(`[GoogleDrive] Found ${files.length} files`);

                if (files.length === 0) {
                    const folderName = folderId ? "selected folder" : "root folder";
                    return [
                        {
                            name: `📁 No files found in ${folderName}`,
                            value: "",
                            description: folderId ?
                                "The selected folder is empty or contains only subfolders" :
                                "Root folder is empty or contains only subfolders"
                        }
                    ];
                }

                // Format results for dropdown
                return files.map(file => {
                    // Get file icon based on mime type
                    let icon = "📄";
                    if (file.mimeType) {
                        if (file.mimeType.includes("image")) icon = "🖼️";
                        else if (file.mimeType.includes("video")) icon = "🎥";
                        else if (file.mimeType.includes("audio")) icon = "🎵";
                        else if (file.mimeType.includes("pdf")) icon = "📕";
                        else if (file.mimeType.includes("document")) icon = "📝";
                        else if (file.mimeType.includes("spreadsheet")) icon = "📊";
                        else if (file.mimeType.includes("presentation")) icon = "📽️";
                        else if (file.mimeType.includes("zip") || file.mimeType.includes("archive")) icon = "🗜️";
                    }

                    // Format file size
                    let sizeText = "";
                    if (file.size) {
                        const sizeBytes = parseInt(file.size);
                        if (sizeBytes < 1024) sizeText = ` (${sizeBytes} B)`;
                        else if (sizeBytes < 1024 * 1024) sizeText = ` (${Math.round(sizeBytes / 1024)} KB)`;
                        else if (sizeBytes < 1024 * 1024 * 1024) sizeText = ` (${Math.round(sizeBytes / (1024 * 1024))} MB)`;
                        else sizeText = ` (${Math.round(sizeBytes / (1024 * 1024 * 1024))} GB)`;
                    }

                    return {
                        name: `${icon} ${file.name}${sizeText}`,
                        value: file.id,
                        description: `File: ${file.name}`
                    };
                });

            } catch (error) {
                if (this.logger) {
                    this.logger.error("Failed to load files in folder", { error: error.message, folderId: this.getNodeParameter("folderId") });
                }

                // Return error message as option
                return [
                    {
                        name: "❌ Error loading files",
                        value: "",
                        description: `Failed to load files: ${error.message}`,
                    },
                ];
            }
        },
    },
};

module.exports = GoogleDriveNode;