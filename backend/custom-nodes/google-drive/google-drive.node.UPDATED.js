/**
 * EXAMPLE: Google Drive Node Using Core Credentials
 * 
 * This is an example of how the Google Drive node would look after
 * migrating to use the core googleOAuth2 credential instead of
 * a custom googleDriveOAuth2 credential.
 * 
 * Key changes:
 * 1. credentials array references "googleOAuth2" instead of "googleDriveOAuth2"
 * 2. Credential retrieval logic updated to use core credential
 * 3. Backward compatibility maintained for existing workflows
 */

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
    
    // UPDATED: Now uses core credentials
    credentials: [
        {
            name: "googleDriveServiceAccount",
            required: false
        },
        {
            name: "googleOAuth2",  // Core credential (NEW)
            required: false
        },
        {
            name: "googleDriveOAuth2",  // Legacy credential (for backward compatibility)
            required: false,
            deprecated: true  // Mark as deprecated
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
            // UPDATED: Include core credential
            allowedTypes: ["googleDriveServiceAccount", "googleOAuth2", "googleDriveOAuth2"]
        },
        // ... rest of properties remain the same
    ],

    execute: async function (inputData) {
        const items = inputData.main?.[0] || [];
        const results = [];
        const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

        // Get settings
        const continueOnFail = this.settings?.continueOnFail ?? false;
        const timeout = this.settings?.timeout ?? 30000;

        // UPDATED: Get credentials with fallback to legacy
        let auth;
        let credentialType;
        try {
            let credentials = null;

            // Try service account first
            try {
                credentials = await this.getCredentials("googleDriveServiceAccount");
                if (credentials && credentials.serviceAccountEmail && credentials.privateKey) {
                    credentialType = "serviceAccount";
                }
            } catch (error) {
                // Service account not available
            }

            // If no service account, try OAuth2 (core credential first, then legacy)
            if (!credentials || !credentialType) {
                // Try new core credential
                try {
                    credentials = await this.getCredentials("googleOAuth2");
                    if (credentials && credentials.clientId && credentials.clientSecret) {
                        credentialType = "oauth2";
                        this.logger.info("Using core Google OAuth2 credential");
                    }
                } catch (error) {
                    // Core credential not available, try legacy
                    try {
                        credentials = await this.getCredentials("googleDriveOAuth2");
                        if (credentials && credentials.clientId && credentials.clientSecret) {
                            credentialType = "oauth2";
                            this.logger.warn("Using legacy googleDriveOAuth2 credential. Please migrate to googleOAuth2 for better credential reuse.");
                        }
                    } catch (error) {
                        // No OAuth2 credential available
                    }
                }
            }

            if (!credentials || !credentialType) {
                throw new Error("No Google Drive credentials found. Please configure either OAuth2 or Service Account credentials.");
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
            } else {
                throw new Error("Invalid credential type");
            }
        } catch (error) {
            throw new Error(`Failed to get credentials: ${error.message}`);
        }

        // Create Drive API client
        const drive = google.drive({ version: "v3", auth, timeout });

        // ... rest of execute logic remains the same
        
        return [{ main: results }];
    },

    // ... rest of node definition remains the same
};

module.exports = GoogleDriveNode;
