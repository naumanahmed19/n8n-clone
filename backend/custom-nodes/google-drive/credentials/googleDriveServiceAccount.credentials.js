const GoogleDriveServiceAccountCredentials = {
  name: "googleDriveServiceAccount",
  displayName: "Google Drive Service Account",
  documentationUrl: "https://developers.google.com/drive/api/v3/about-auth",
  icon: "🗂️",
  color: "#4285F4",
  testable: true,
  properties: [
    {
      displayName: "Service Account Email",
      name: "serviceAccountEmail",
      type: "string",
      required: true,
      default: "",
      description: "Service account email address",
      placeholder: "your-service-account@project-id.iam.gserviceaccount.com"
    },
    {
      displayName: "Private Key",
      name: "privateKey",
      type: "password",
      typeOptions: {
        password: true,
        rows: 5
      },
      required: true,
      default: "",
      description: "Private key from the service account JSON file",
      placeholder: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    },
    {
      displayName: "Scopes",
      name: "scopes",
      type: "multiOptions",
      options: [
        {
          name: "Drive (Full Access)",
          value: "https://www.googleapis.com/auth/drive",
          description: "Full access to Google Drive"
        },
        {
          name: "Drive Files (Limited)",
          value: "https://www.googleapis.com/auth/drive.file",
          description: "Access only to files created by this application"
        },
        {
          name: "Drive Readonly",
          value: "https://www.googleapis.com/auth/drive.readonly",
          description: "Read-only access to Google Drive"
        },
        {
          name: "Drive Metadata",
          value: "https://www.googleapis.com/auth/drive.metadata",
          description: "Access to file metadata only"
        }
      ],
      default: ["https://www.googleapis.com/auth/drive"],
      required: true,
      description: "Google Drive API scopes"
    }
  ],

  /**
   * Test the Google Drive Service Account connection
   */
  async test(data) {
    try {
      const { google } = require("googleapis");

      // Validate required fields
      if (!data.serviceAccountEmail || !data.privateKey) {
        return {
          success: false,
          message: "Service account email and private key are required"
        };
      }

      // Create service account auth
      const auth = new google.auth.JWT(
        data.serviceAccountEmail,
        null,
        data.privateKey.replace(/\\n/g, '\n'),
        data.scopes || ["https://www.googleapis.com/auth/drive"]
      );

      // Create Drive API client
      const drive = google.drive({ version: "v3", auth });

      // Test the connection by getting user info
      const response = await drive.about.get({
        fields: "user,storageQuota"
      });

      if (response.data && response.data.user) {
        const user = response.data.user;
        const quota = response.data.storageQuota;
        
        let message = `Connected successfully as ${user.displayName || user.emailAddress}`;
        
        if (quota && quota.limit) {
          const usedGB = Math.round((parseInt(quota.usage) / (1024 * 1024 * 1024)) * 100) / 100;
          const limitGB = Math.round((parseInt(quota.limit) / (1024 * 1024 * 1024)) * 100) / 100;
          message += ` (${usedGB}GB / ${limitGB}GB used)`;
        }

        return {
          success: true,
          message
        };
      }

      return {
        success: true,
        message: "Connection successful"
      };
    } catch (error) {
      // Handle specific Google API errors
      if (error.code === 401) {
        return {
          success: false,
          message: "Authentication failed. Please check your service account credentials."
        };
      } else if (error.code === 403) {
        return {
          success: false,
          message: "Access denied. Please check your API permissions and scopes."
        };
      } else if (error.code === 404) {
        return {
          success: false,
          message: "Google Drive API not found. Please enable the Drive API in your Google Cloud Console."
        };
      } else if (error.message && error.message.includes("invalid_grant")) {
        return {
          success: false,
          message: "Invalid grant. Please check your service account key."
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${error.message || "Unknown error"}`
        };
      }
    }
  }
};

module.exports = GoogleDriveServiceAccountCredentials;