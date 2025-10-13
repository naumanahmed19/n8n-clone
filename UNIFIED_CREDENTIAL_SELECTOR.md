# Unified Credential Selector Implementation

## Overview

The Unified Credential Selector is a new feature that replaces multiple separate credential dropdowns with a single, intelligent autocomplete selector. This provides a better user experience when a node supports multiple authentication methods.

## Problem Solved

**Before:** When a node supported multiple authentication methods (e.g., HTTP Request with Basic Auth, Bearer Token, Header Auth, and API Key), users would see **4 separate dropdown boxes**, even though they only needed to select ONE credential.

**After:** Users now see a **single autocomplete selector** that shows all available credentials from any of the supported authentication types, with clear labels showing which type each credential is.

## Implementation Details

### 1. Backend Type Definition

Added `credentialSelector` to `NodeDefinition` interface:

```typescript
// backend/src/types/node.types.ts
export interface NodeDefinition {
  // ... existing fields
  credentialSelector?: {
    displayName: string; // Label for the selector
    description?: string; // Help text
    placeholder?: string; // Placeholder text
    allowedTypes: string[]; // Array of credential type names
    required?: boolean; // Whether credential is required
  };
}
```

### 2. Frontend Type Definition

Added matching `credentialSelector` to `NodeType` interface:

```typescript
// frontend/src/types/workflow.ts
export interface NodeType {
  // ... existing fields
  credentialSelector?: {
    displayName: string;
    description?: string;
    placeholder?: string;
    allowedTypes: string[];
    required?: boolean;
  };
}
```

### 3. Unified Credential Selector Component

Created a new React component: `UnifiedCredentialSelector.tsx`

**Key Features:**

- Uses `AutoComplete` component for searchable dropdown
- Filters credentials by multiple allowed types
- Shows credential name + type as subtitle
- Supports creating new credentials with type selection
- Includes refresh button to reload credentials
- Clear button (when not required)

**Props:**

```typescript
interface UnifiedCredentialSelectorProps {
  allowedTypes: string[]; // e.g., ['httpBasicAuth', 'apiKey']
  value?: string; // Selected credential ID
  onChange: (credentialId: string | undefined) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}
```

### 4. Integration in ConfigTab

Updated `ConfigTab.tsx` to:

- Check if `nodeType.credentialSelector` is defined
- Use `UnifiedCredentialSelector` when present
- Fall back to traditional `CredentialSelector` for backward compatibility

```typescript
{
  /* Unified Credential Selector */
}
{
  nodeType.credentialSelector && (
    <UnifiedCredentialSelector
      allowedTypes={nodeType.credentialSelector.allowedTypes}
      value={Object.values(credentials)[0]}
      onChange={(credentialId) => {
        // Logic to update credentials based on selected credential type
      }}
    />
  );
}

{
  /* Traditional Multiple Selectors */
}
{
  !nodeType.credentialSelector && nodeType.credentials?.map(/* ... */);
}
```

### 5. HTTP Request Node Update

Updated `HttpRequest.node.ts` to use the unified selector:

```typescript
export const HttpRequestNode: NodeDefinition = {
  // ... existing fields
  credentials: [
    // Define all 4 credential types with their properties
    { name: "httpBasicAuth", displayName: "Basic Auth", ... },
    { name: "httpHeaderAuth", displayName: "Header Auth", ... },
    { name: "httpBearerAuth", displayName: "Bearer Token", ... },
    { name: "apiKey", displayName: "API Key", ... },
  ],
  credentialSelector: {
    displayName: "Authentication",
    description: "Select authentication method for HTTP requests",
    placeholder: "Select authentication...",
    allowedTypes: ["httpBasicAuth", "httpHeaderAuth", "httpBearerAuth", "apiKey"],
  },
  // ... rest of node definition
}
```

**Important:** The `credentials` array is still defined to maintain the credential type definitions (their properties and validation), but the UI now shows a single unified selector instead of 4 separate dropdowns.

## User Experience Flow

1. **Viewing the Node Config:**

   - User sees a single "Authentication" field
   - Placeholder says "Select authentication..."

2. **Opening the Selector:**

   - Shows searchable autocomplete dropdown
   - Lists all credentials matching any of the 4 allowed types
   - Each credential shows:
     - **Name** (primary text) - e.g., "My API Key"
     - **Type** (subtitle) - e.g., "API Key" or "Basic Auth"

3. **Searching:**

   - User can type to filter credentials
   - Searches both credential name and type

4. **Selecting:**

   - Click a credential to select it
   - Selector shows: "My API Key (API Key)"
   - Selected credential is saved to workflow

5. **Creating New:**

   - If only 1 allowed type: Direct "New" button
   - If multiple types: Hover "New" button shows dropdown with type selection
   - Opens credential creation modal for selected type

6. **Clearing:**
   - If not required: Shows X button to clear selection
   - If required: No clear button (must select something)

## AutoComplete Features Used

The implementation leverages the existing `AutoComplete` component features:

```typescript
<AutoComplete
  value={value}
  onChange={onChange}
  options={options} // Credentials as options
  icon={<Key />} // Key icon
  renderOption={customRender} // Show name + type
  renderSelected={customRender} // Show selected with type
  placeholder="Select authentication..."
  searchPlaceholder="Search credentials..."
  emptyMessage="No credentials found"
  noOptionsMessage="No matching credentials"
  clearable={!required} // Based on required flag
  refreshable={true} // Refresh button
  searchable={true} // Search functionality
/>
```

## Backend Execution Logic

The execute function in `HttpRequest.node.ts` already handles all 4 credential types:

```typescript
// Try Basic Auth
const basicAuth = await this.getCredentials("httpBasicAuth");
if (basicAuth) {
  /* apply */
}

// Try Bearer Token
const bearerAuth = await this.getCredentials("httpBearerAuth");
if (bearerAuth) {
  /* apply */
}

// Try Header Auth
const headerAuth = await this.getCredentials("httpHeaderAuth");
if (headerAuth) {
  /* apply */
}

// Try API Key
const apiKeyAuth = await this.getCredentials("apiKey");
if (apiKeyAuth) {
  /* apply */
}
```

**Key Point:** The function tries all 4 types and applies whichever one is configured. Only ONE will be configured at a time (the one selected in the UI), so only that one gets applied.

## Benefits

### 1. **Better UX**

- Single field instead of 4 separate dropdowns
- Clear visual hierarchy (name + type)
- Searchable
- Less visual clutter

### 2. **Clearer Intent**

- Makes it obvious that only ONE authentication method should be selected
- Users don't have to wonder "Can I select multiple?"

### 3. **Scalable Pattern**

- Easy to add more authentication types in the future
- Just add to `allowedTypes` array
- Define credential type in `credentials` array

### 4. **Backward Compatible**

- Nodes without `credentialSelector` still use traditional multi-selector approach
- No breaking changes to existing nodes

## Usage in Other Nodes

To use unified credential selector in other nodes:

```typescript
export const MyNode: NodeDefinition = {
  // ... other fields

  // 1. Define credential types (traditional way)
  credentials: [
    { name: "typeA", displayName: "Type A", properties: [...] },
    { name: "typeB", displayName: "Type B", properties: [...] },
  ],

  // 2. Add unified selector configuration
  credentialSelector: {
    displayName: "Authentication",
    description: "Choose how to authenticate",
    placeholder: "Select auth method...",
    allowedTypes: ["typeA", "typeB"],
    required: false, // Optional credential
  },

  // 3. Execute function tries all types (same as before)
  execute: async function(inputData) {
    try {
      const credA = await this.getCredentials("typeA");
      if (credA) { /* use it */ }
    } catch {}

    try {
      const credB = await this.getCredentials("typeB");
      if (credB) { /* use it */ }
    } catch {}

    // ... rest of execution
  }
}
```

## Files Modified

### Backend

- `backend/src/types/node.types.ts` - Added `credentialSelector` to `NodeDefinition`
- `backend/src/nodes/HttpRequest/HttpRequest.node.ts` - Added `credentialSelector` config

### Frontend

- `frontend/src/types/workflow.ts` - Added `credentialSelector` to `NodeType`
- `frontend/src/components/credential/UnifiedCredentialSelector.tsx` - New component
- `frontend/src/components/credential/index.ts` - Export new component
- `frontend/src/components/workflow/node-config/tabs/ConfigTab.tsx` - Use unified selector

## Testing

Test scenarios:

1. ✅ Open HTTP Request node config
2. ✅ See single "Authentication" selector instead of 4 dropdowns
3. ✅ Open selector and see all credentials (Basic Auth, Bearer Token, etc.)
4. ✅ Search for credential by name
5. ✅ Select a credential and save
6. ✅ Execute workflow with authenticated request
7. ✅ Create new credential from selector
8. ✅ Clear credential selection (if not required)
9. ✅ Refresh credentials list
10. ✅ Verify other nodes without credentialSelector still work normally

## Future Enhancements

Possible improvements:

1. **Smart credential suggestions** - Based on URL patterns
2. **Credential type icons** - Show icon for each credential type
3. **Credential status indicators** - Show if credential needs refresh
4. **Quick credential testing** - Test credential directly from selector
5. **Recent credentials** - Show recently used credentials at top
6. **Credential grouping** - Group by type in dropdown

## Conclusion

The Unified Credential Selector provides a significantly better user experience for nodes with multiple authentication options. It reduces visual clutter, makes the intent clearer, and leverages the powerful AutoComplete component for a modern, searchable interface.
