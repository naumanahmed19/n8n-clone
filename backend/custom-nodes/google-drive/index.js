// Export the node definitions
module.exports = {
  nodes: {
    "google-drive": require("./nodes/google-drive.node.js"),
  },
  credentials: {
    "googleDriveServiceAccount": require("./credentials/googleDriveServiceAccount.credentials.js"),
    "googleDriveOAuth2": require("./credentials/googleDriveOAuth2.credentials.js"),
  },
};