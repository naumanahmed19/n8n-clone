/**
 * Core Credential Definitions
 * 
 * These are reusable credential types that can be used across multiple nodes.
 * Instead of each custom node defining its own OAuth2 or HTTP Basic Auth,
 * they can reference these core credentials.
 * 
 * Benefits:
 * - No duplication of credential definitions
 * - Consistent authentication across nodes
 * - Easier maintenance and updates
 * - Users can reuse the same credentials across multiple nodes
 */

export { GoogleOAuth2Credentials } from "./GoogleOAuth2.credentials";
export { HttpBasicAuthCredentials } from "./HttpBasicAuth.credentials";
export { OAuth2Credentials } from "./OAuth2.credentials";
export { ApiKeyCredentials } from "./ApiKey.credentials";

// Export all core credentials as an array for easy registration
import { GoogleOAuth2Credentials } from "./GoogleOAuth2.credentials";
import { HttpBasicAuthCredentials } from "./HttpBasicAuth.credentials";
import { OAuth2Credentials } from "./OAuth2.credentials";
import { ApiKeyCredentials } from "./ApiKey.credentials";

export const CoreCredentials = [
  GoogleOAuth2Credentials,
  HttpBasicAuthCredentials,
  OAuth2Credentials,
  ApiKeyCredentials,
];
