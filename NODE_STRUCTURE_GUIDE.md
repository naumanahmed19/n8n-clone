# Node Structure Auto-Discovery System

This document describes the new automated node structure and discovery system for the n8n-clone project.

## Overview

The node system has been refactored to provide:
- **Auto-discovery**: Automatically discovers and loads all nodes from the nodes directory
- **Individual folders**: Each node has its own dedicated folder
- **Consistent structure**: Standardized folder and file organization
- **CLI tools**: Command-line utilities for managing nodes
- **Auto-registration**: Automatic registration of all discovered nodes

## Directory Structure

```
backend/src/nodes/
├── HttpRequest/
│   ├── index.ts
│   └── HttpRequest.node.ts
├── If/
│   ├── index.ts
│   └── If.node.ts
├── Json/
│   ├── index.ts
│   └── Json.node.ts
├── Set/
│   ├── index.ts
│   └── Set.node.ts
├── Switch/
│   ├── index.ts
│   └── SwitchExample.node.ts
├── WebhookTrigger/
│   ├── index.ts
│   └── WebhookTrigger.node.ts
├── ScheduleTrigger/
│   ├── index.ts
│   └── ScheduleTrigger.node.ts
├── ManualTrigger/
│   ├── index.ts
│   └── ManualTrigger.node.ts
├── CustomTemplate/
│   ├── index.ts
│   └── CustomTemplate.node.ts
├── DynamicProperties/
│   ├── index.ts
│   └── DynamicProperties.node.ts
└── TestNode/
    ├── index.ts
    └── TestNode.node.ts
```

## Node Folder Requirements

Each node folder must contain:
1. **index.ts** - Exports the node definition
2. **[NodeName].node.ts** - Contains the actual node implementation

### Example index.ts
```typescript
export { HttpRequestNode } from "./HttpRequest.node";
```

### Example Node Implementation
```typescript
import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const HttpRequestNode: NodeDefinition = {
  type: BuiltInNodeTypes.HTTP_REQUEST,
  displayName: "HTTP Request",
  name: "httpRequest",
  group: ["transform"],
  version: 1,
  description: "Make HTTP requests to any URL",
  // ... rest of node definition
};
```

## CLI Commands

The new system provides several npm scripts for managing nodes:

### List all available nodes
```bash
npm run nodes:list
```
Shows all discovered nodes with their descriptions.

### Create a new node
```bash
npm run nodes:create <NodeName>
```
Creates a new node folder with boilerplate files.

### Discover nodes
```bash
npm run nodes:discover
```
Scans and reports all discovered node directories and definitions.

### Validate node structure
```bash
npm run nodes:validate
```
Validates that all node directories have the required files.

### Register all nodes
```bash
npm run nodes:register
```
Automatically discovers and registers all nodes in the database.

## Auto-Discovery System

The `NodeDiscovery` utility class (`src/utils/NodeDiscovery.ts`) provides:

### Key Features
- **Automatic scanning**: Finds all valid node directories
- **Dynamic loading**: Imports node definitions at runtime  
- **Windows compatibility**: Handles Windows file paths correctly
- **Error handling**: Graceful handling of invalid or missing nodes
- **Validation**: Ensures node directories meet requirements

### Usage in Code
```typescript
import { nodeDiscovery } from "../utils/NodeDiscovery";

// Get all node definitions
const nodes = await nodeDiscovery.getAllNodeDefinitions();

// Get nodes grouped by directory
const nodesByDir = await nodeDiscovery.getNodesByDirectory();

// Get directory names only
const directories = await nodeDiscovery.discoverNodeDirectories();
```

## Auto-Registration

The registration system has been updated to use auto-discovery:

### Key Benefits
- **No manual configuration**: No need to manually import/export nodes
- **Automatic updates**: New nodes are automatically included
- **Consistent registration**: All discovered nodes are registered uniformly
- **Detailed reporting**: Shows registration status and summary

### Registration Process
1. Scans the nodes directory for valid node folders
2. Loads each node definition dynamically
3. Validates node structure and properties
4. Registers each node with the NodeService
5. Reports success/failure for each node
6. Provides summary statistics

## Migration from Old Structure

The old categorized structure has been migrated:

### Old Structure
```
nodes/
├── core/
│   ├── HttpRequest.node.ts
│   ├── If.node.ts
│   └── ...
├── triggers/
│   ├── WebhookTrigger.ts
│   └── ...
└── examples/
    ├── CustomTemplate.node.ts
    └── ...
```

### New Structure
Each node now has its own folder with consistent naming and structure.

## Creating New Nodes

### Using the CLI (Recommended)
```bash
npm run nodes:create MyNewNode
```

This creates:
- `MyNewNode/` directory
- `MyNewNode/MyNewNode.node.ts` with boilerplate
- `MyNewNode/index.ts` with proper export

### Manual Creation
1. Create a new directory: `nodes/MyNewNode/`
2. Add `MyNewNode.node.ts` with node implementation
3. Add `index.ts` with export statement
4. Run `npm run nodes:register` to register

## Validation and Testing

### Validate Structure
```bash
npm run nodes:validate
```

### Test Discovery
```bash
npm run nodes:discover
```

### Register Nodes
```bash
npm run nodes:register
```

## Best Practices

1. **Consistent naming**: Use PascalCase for node names
2. **Clear descriptions**: Provide meaningful descriptions for each node
3. **Proper exports**: Always export through index.ts
4. **Validation**: Run validation before committing changes
5. **Testing**: Test node discovery and registration after changes

## Troubleshooting

### Node not discovered
- Check that the folder contains `index.ts` and a `.node.ts` file
- Verify the exports in `index.ts` are correct
- Run `npm run nodes:validate` to check structure

### Registration failures
- Check node definition follows the correct interface
- Verify all required properties are present
- Check console output for specific error messages

### Import errors
- Ensure file paths are correct in imports
- Verify TypeScript compilation is successful
- Check for circular dependencies

## Development Workflow

1. **Create node**: `npm run nodes:create NodeName`
2. **Implement logic**: Edit the generated `.node.ts` file
3. **Validate**: `npm run nodes:validate`
4. **Test discovery**: `npm run nodes:discover`
5. **Register**: `npm run nodes:register`
6. **Verify**: Check logs for successful registration

This new system provides a much more maintainable and scalable approach to managing nodes in the n8n-clone project.