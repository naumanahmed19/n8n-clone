# Workflow Template System

## Overview

The Workflow Template System provides a comprehensive view of workflow requirements, similar to n8n's template system. It automatically analyzes workflows to extract and display:

- **Required Credentials**: All credentials needed to run the workflow
- **Required Variables**: Variables and expressions used in the workflow
- **Trigger Configuration**: Types of triggers used
- **Setup Complexity**: Estimated setup time and complexity level
- **Setup Checklist**: Step-by-step guide to configure the workflow

## Features

### 1. Automatic Analysis

The system automatically scans workflows to identify:

- Credential requirements from node definitions
- Variable expressions (e.g., `{{apiKey}}`, `{{baseUrl}}`)
- Trigger types and configurations
- Node dependencies

### 2. Template Metadata

For each workflow, the system provides:

```typescript
{
  workflowId: string;
  workflowName: string;
  description?: string;
  credentials: TemplateCredentialRequirement[];
  variables: TemplateVariableRequirement[];
  nodeCount: number;
  triggerTypes: string[];
  complexity: "simple" | "medium" | "complex";
  estimatedSetupTime: string;
  setupChecklist: string[];
}
```

### 3. Credential Requirements

Each credential requirement includes:

- **Type**: The credential type (e.g., "apiKey", "oauth2")
- **Display Name**: Human-readable name
- **Description**: Optional documentation or help text
- **Required**: Whether it's mandatory
- **Node Usage**: Which nodes use this credential

### 4. Variable Requirements

Each variable requirement includes:

- **Name**: The variable name (e.g., "apiKey")
- **Description**: Where and how it's used
- **Required**: Whether it's mandatory
- **Node Usage**: Which nodes reference this variable
- **Property Path**: The parameter path where it's used

## Usage

### Backend API

#### Get Workflow Template Metadata

```http
GET /api/workflows/:id/template
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "workflowId": "workflow-123",
    "workflowName": "Email Notification System",
    "description": "Automated email notifications",
    "credentials": [
      {
        "type": "apiKey",
        "displayName": "API Key",
        "required": true,
        "nodeIds": ["node-1", "node-2"],
        "nodeNames": ["OpenAI", "Anthropic"]
      }
    ],
    "variables": [
      {
        "name": "apiEndpoint",
        "description": "Used in HTTP Request (url)",
        "required": true,
        "nodeIds": ["node-3"],
        "nodeNames": ["HTTP Request"],
        "propertyPath": "url"
      }
    ],
    "nodeCount": 5,
    "triggerTypes": ["webhook-trigger"],
    "complexity": "medium",
    "estimatedSetupTime": "7 minutes",
    "setupChecklist": [
      "Configure required credentials:",
      "  - API Key (used by OpenAI, Anthropic)",
      "Set up required variables:",
      "  - apiEndpoint: Used in HTTP Request (url)",
      "Configure triggers:",
      "  - webhook-trigger",
      "Test the workflow",
      "Activate the workflow"
    ]
  }
}
```

### Frontend Components

#### WorkflowTemplateView

Display template requirements for a workflow:

```tsx
import { WorkflowTemplateView } from '@/components/workflow/WorkflowTemplateView';

<WorkflowTemplateView workflowId="workflow-123" />
```

#### WorkflowTemplateDialog

Show template requirements in a modal:

```tsx
import { WorkflowTemplateDialog } from '@/components/workflow/WorkflowTemplateDialog';

<WorkflowTemplateDialog
  workflowId={workflowId}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### Integration in Workflow List

The template view is integrated into the workflow list dropdown menu:

1. Navigate to the Workflows page
2. Click the "..." menu on any workflow
3. Select "View Template"
4. See all requirements and setup instructions

## Implementation Details

### Backend Service

**WorkflowTemplateService** (`backend/src/services/WorkflowTemplateService.ts`):

- `analyzeWorkflow()`: Main analysis method
- `extractCredentialRequirements()`: Scans nodes for credential needs
- `extractVariableRequirements()`: Finds variable expressions
- `calculateComplexity()`: Determines workflow complexity
- `estimateSetupTime()`: Calculates estimated setup time
- `generateSetupChecklist()`: Creates step-by-step guide

### Frontend Components

**WorkflowTemplateView** (`frontend/src/components/workflow/WorkflowTemplateView.tsx`):

- Displays template metadata in a clean, organized layout
- Shows quick stats (nodes, credentials, variables, setup time)
- Lists all credential requirements with usage details
- Lists all variable requirements with descriptions
- Shows trigger configuration
- Provides setup checklist

**WorkflowTemplateDialog** (`frontend/src/components/workflow/WorkflowTemplateDialog.tsx`):

- Wraps WorkflowTemplateView in a modal dialog
- Handles open/close state
- Responsive design for mobile and desktop

## Complexity Calculation

The system calculates complexity based on:

```typescript
complexityScore = nodeCount + (credentialCount * 2) + variableCount

if (complexityScore <= 5) → "simple"
if (complexityScore <= 15) → "medium"
else → "complex"
```

## Setup Time Estimation

Estimated setup time is calculated as:

```typescript
baseTime = {
  simple: 2 minutes,
  medium: 5 minutes,
  complex: 10 minutes
}

totalTime = baseTime + (credentials * 2 min) + (variables * 0.5 min)
```

## Interactive Setup

### Setup Tab

The template dialog includes an interactive setup tab where users can:

1. **Select Credentials**: Choose from existing credentials or create new ones
2. **Set Variables**: Enter values for all required variables
3. **Real-time Validation**: See which requirements are complete
4. **One-Click Save**: Apply all configurations to the workflow at once

### Setup Process

1. Open workflow template dialog
2. Switch to "Setup Configuration" tab
3. For each credential requirement:
   - Select an existing credential from dropdown
   - Or click "Create New" to add a credential
4. For each variable requirement:
   - Enter the value in the input field
5. Click "Save Configuration" when all required fields are complete

### Status Indicators

- **Green checkmark**: Requirement is configured
- **Yellow warning**: Requirement is incomplete
- **Red badge**: Requirement is mandatory
- **Ready/Incomplete**: Overall setup status

## Future Enhancements

Potential improvements:

1. **Template Marketplace**: Share and discover workflow templates
2. **Template Validation**: Advanced validation of configurations
3. **Template Export**: Export workflows with requirement documentation
4. **Template Categories**: Organize templates by use case
5. **Template Ratings**: User ratings and reviews
6. **Template Versioning**: Track template changes over time
7. **Dependency Detection**: Identify node dependencies and conflicts
8. **Bulk Import**: Import multiple credentials at once

## Examples

### Simple Workflow

- 3 nodes
- 1 credential (API Key)
- 0 variables
- Complexity: Simple
- Setup Time: 4 minutes

### Medium Workflow

- 8 nodes
- 2 credentials (API Key, OAuth2)
- 3 variables
- Complexity: Medium
- Setup Time: 10 minutes

### Complex Workflow

- 15 nodes
- 4 credentials
- 8 variables
- Complexity: Complex
- Setup Time: 24 minutes

## Best Practices

1. **Clear Naming**: Use descriptive names for credentials and variables
2. **Documentation**: Add descriptions to help users understand requirements
3. **Minimal Requirements**: Keep workflows simple when possible
4. **Reusable Credentials**: Use the same credential type across nodes
5. **Environment Variables**: Use variables for environment-specific values
6. **Testing**: Always test workflows after setup
7. **Documentation**: Document any special setup requirements

## Troubleshooting

### Credentials Not Detected

- Ensure nodes have proper credential definitions
- Check that credential types are registered
- Verify node definitions include credential properties

### Variables Not Found

- Variables must use `{{variableName}}` syntax
- Avoid using `{{json.field}}` for data references
- Check parameter values are strings

### Incorrect Complexity

- Review complexity calculation formula
- Adjust weights if needed
- Consider workflow-specific factors

## Related Documentation

- [Node System](./NODE_SYSTEM.md)
- [Credential Management](./CREDENTIALS.md)
- [Workflow Editor](./WORKFLOW_EDITOR.md)
- [Custom Nodes](./CUSTOM_NODES.md)
