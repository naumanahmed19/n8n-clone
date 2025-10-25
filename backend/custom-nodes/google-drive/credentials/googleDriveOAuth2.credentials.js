const GoogleDriveOAuth2Credentials = {
  name: "googleDriveOAuth2",
  displayName: "Google Drive OAuth2",
  documentationUrl: "https://developers.google.com/drive/api/v3/about-auth",
  icon: "🗂️",
  color: "#4285F4",
  testable: true,
  properties: [
    {
      displayName: "OAuth Redirect URL",
      name: "oauthCallbackUrl",
      type: "string",
      required: false,
      description:
        "Copy this URL and add it to 'Authorized redirect URIs' in your Google Cloud Console OAuth2 credentials",
      placeholder: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/oauth/callback`,
      default: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/oauth/callback`,
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      required: true,
      description: "OAuth2 Client ID from Google Cloud Console",
      placeholder: "123456789-abc123.apps.googleusercontent.com",
    },
    {
      displayName: "Client Secret",
      name: "clientSecret",
      type: "password",
      required: true,
      description: "OAuth2 Client Secret from Google Cloud Console",
      placeholder: "GOCSPX-***",
    },
    // Note: accessToken and refreshToken are stored in the credential
    // but not shown in the form - they're automatically filled via OAuth
  ],

  /**
   * Test the Google Drive OAuth2 connection
   */
  async test(data) {
    try {
      const { google } = require("googleapis");

      // Validate required fields
      if (!data.clientId || !data.clientSecret) {
        return {
          success: false,
          message: "Client ID and client secret are required"
        };
      }

      // For OAuth2 testing, we need the access token
      if (!data.accessToken) {
        return {
          success: false,
          message: "Please complete OAuth2 authorization first"
        };
      }

      // Create OAuth2 auth
      const auth = new google.auth.OAuth2(
        data.clientId,
        data.clientSecret
      );
      
      auth.setCredentials({
        access_token: data.accessToken,
        refresh_token: data.refreshToken
      });

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
          message: "Authentication failed. Please re-authorize with Google."
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
          message: "Invalid grant. Please re-authorize with Google."
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

module.exports = GoogleDriveOAuth2Credentials;