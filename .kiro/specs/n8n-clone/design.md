# Design Document

## Overview

The n8n clone will be built as a modern web application with a React-based frontend and a Node.js backend. The architecture follows a microservices-inspired approach with clear separation between the workflow editor, execution engine, and data persistence layers. The system will support both visual workflow creation and programmatic execution with real-time monitoring capabilities.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WE[Workflow Editor]
        EM[Execution Monitor]
        WM[Workspace Manager]
    end
    
    subgraph "API Gateway"
        AG[Express.js API]
    end
    
    subgraph "Core Services"
        WS[Workflow Service]
        ES[Execution Service]
        NS[Node Service]
        AS[Auth Service]
    end
    
    subgraph "Execution Layer"
        EE[Execution Engine]
        JQ[Job Queue - Bull]
        JS[JavaScript Sandbox]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        RD[(Redis)]
        FS[File Storage]
    end
    
    WE --> AG
    EM --> AG
    WM --> AG
    AG --> WS
    AG --> ES
    AG --> NS
    AG --> AS
    ES --> EE
    EE --> JQ
    EE --> JS
    WS --> PG
    ES --> PG
    JQ --> RD
    EE --> FS
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- React Flow for visual workflow editor
- Zustand for state management
- Tailwind CSS for styling
- Socket.io-client for real-time updates

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Bull Queue with Redis for job processing
- Socket.io for real-time communication
- VM2 for secure JavaScript execution
- Prisma ORM for database operations

**Database:**
- PostgreSQL for primary data storage
- Redis for caching and queue management
- File system for workflow templates and logs

## Components and Interfaces

### Frontend Components

#### Workflow Editor
- **Canvas Component**: Drag-and-drop interface using React Flow
- **Node Palette**: Categorized list of available nodes
- **Node Configuration Panel**: Dynamic forms based on node schemas
- **Connection Manager**: Handles node connections and validation

#### Execution Monitor
- **Execution List**: Paginated list of workflow runs
- **Execution Details**: Real-time execution visualization
- **Log Viewer**: Structured log display with filtering
- **Error Handler**: User-friendly error reporting

#### Workspace Manager
- **Workflow Browser**: Search and organize workflows
- **Template Gallery**: Pre-built workflow templates
- **Import/Export**: Workflow sharing capabilities

### Backend Services

#### Workflow Service
```typescript
interface WorkflowService {
  createWorkflow(data: WorkflowData): Promise<Workflow>
  updateWorkflow(id: string, data: Partial<WorkflowData>): Promise<Workflow>
  deleteWorkflow(id: string): Promise<void>
  getWorkflow(id: string): Promise<Workflow>
  listWorkflows(userId: string, filters?: WorkflowFilters): Promise<Workflow[]>
  validateWorkflow(workflow: WorkflowData): ValidationResult
}
```

#### Execution Service
```typescript
interface ExecutionService {
  executeWorkflow(workflowId: string, triggerData?: any): Promise<ExecutionResult>
  getExecution(id: string): Promise<Execution>
  listExecutions(workflowId: string, filters?: ExecutionFilters): Promise<Execution[]>
  cancelExecution(id: string): Promise<void>
  retryExecution(id: string): Promise<ExecutionResult>
}
```

#### Node Service
```typescript
interface NodeService {
  registerNode(nodeDefinition: NodeDefinition): Promise<void>
  unregisterNode(nodeType: string): Promise<void>
  getNodeTypes(): Promise<NodeType[]>
  getNodeSchema(nodeType: string): Promise<NodeSchema>
  executeNode(nodeType: string, parameters: any, inputData: any): Promise<NodeResult>
  validateNodeDefinition(definition: NodeDefinition): ValidationResult
  installNodePackage(packagePath: string): Promise<InstallResult>
  loadNodesFromDirectory(directory: string): Promise<NodeDefinition[]>
}
```

### Custom Node System

#### Node Definition Structure
```typescript
interface NodeDefinition {
  type: string
  displayName: string
  name: string
  group: string[]
  version: number
  description: string
  defaults: Record<string, any>
  inputs: string[]
  outputs: string[]
  credentials?: CredentialDefinition[]
  properties: NodeProperty[]
  execute: NodeExecuteFunction
  hooks?: NodeHooks
  icon?: string
  color?: string
}

interface NodeProperty {
  displayName: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'options' | 'multiOptions' | 'json' | 'dateTime'
  required?: boolean
  default?: any
  description?: string
  options?: Array<{ name: string; value: any }>
  displayOptions?: {
    show?: Record<string, any[]>
    hide?: Record<string, any[]>
  }
}

type NodeExecuteFunction = (
  this: NodeExecutionContext,
  inputData: NodeInputData[]
) => Promise<NodeOutputData[]>

interface NodeExecutionContext {
  getNodeParameter(parameterName: string, itemIndex?: number): any
  getCredentials(type: string): Promise<any>
  helpers: {
    request: (options: RequestOptions) => Promise<any>
    requestWithAuthentication: (credentialType: string, options: RequestOptions) => Promise<any>
    returnJsonArray: (jsonData: any[]) => NodeOutputData[]
  }
}
```

#### Custom Node Development Kit

**Node Template Generator:**
```typescript
class NodeGenerator {
  generateTemplate(nodeType: 'trigger' | 'action' | 'transform'): string {
    // Returns boilerplate code for different node types
  }
  
  validateNode(nodePath: string): ValidationResult {
    // Validates node structure and dependencies
  }
  
  buildNode(nodePath: string): Promise<BuildResult> {
    // Compiles TypeScript and validates the node
  }
}
```

**Node Package Structure:**
```
custom-node-package/
├── package.json
├── nodes/
│   ├── MyCustomNode/
│   │   ├── MyCustomNode.node.ts
│   │   ├── MyCustomNode.node.json
│   │   └── icon.svg
├── credentials/
│   └── MyCustomApi.credentials.ts
└── dist/ (compiled output)
```

#### Dynamic Node Loading

**Hot-Reload Support:**
```typescript
class NodeLoader {
  private nodeRegistry = new Map<string, NodeDefinition>()
  private watchers = new Map<string, FSWatcher>()
  
  async loadNode(nodePath: string): Promise<void> {
    const nodeDefinition = await this.compileAndValidateNode(nodePath)
    this.nodeRegistry.set(nodeDefinition.type, nodeDefinition)
    
    // Set up file watcher for development
    if (process.env.NODE_ENV === 'development') {
      this.watchNodeChanges(nodePath, nodeDefinition.type)
    }
  }
  
  private watchNodeChanges(nodePath: string, nodeType: string): void {
    const watcher = chokidar.watch(nodePath)
    watcher.on('change', async () => {
      await this.reloadNode(nodeType, nodePath)
      this.notifyClientsOfNodeUpdate(nodeType)
    })
    this.watchers.set(nodeType, watcher)
  }
}
```

### Execution Engine

#### Core Execution Flow
```typescript
class ExecutionEngine {
  async executeWorkflow(workflow: Workflow, triggerData: any): Promise<ExecutionResult> {
    const execution = await this.createExecution(workflow.id, triggerData)
    const queue = this.createExecutionQueue(execution)
    
    try {
      const result = await this.processNodes(workflow.nodes, queue, execution)
      await this.completeExecution(execution.id, result)
      return result
    } catch (error) {
      await this.failExecution(execution.id, error)
      throw error
    }
  }
  
  private async processNodes(nodes: Node[], queue: ExecutionQueue, execution: Execution): Promise<any> {
    // Topological sort for execution order
    const sortedNodes = this.topologicalSort(nodes)
    
    for (const node of sortedNodes) {
      await queue.add('execute-node', {
        nodeId: node.id,
        executionId: execution.id,
        inputData: this.getNodeInputData(node, execution)
      })
    }
    
    return queue.process()
  }
}
```

## Data Models

### Core Entities

#### Workflow
```typescript
interface Workflow {
  id: string
  name: string
  description?: string
  userId: string
  nodes: Node[]
  connections: Connection[]
  triggers: Trigger[]
  settings: WorkflowSettings
  active: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Node
```typescript
interface Node {
  id: string
  type: string
  name: string
  parameters: Record<string, any>
  position: { x: number; y: number }
  credentials?: string[]
  disabled: boolean
}
```

#### Connection
```typescript
interface Connection {
  id: string
  sourceNodeId: string
  sourceOutput: string
  targetNodeId: string
  targetInput: string
}
```

#### Execution
```typescript
interface Execution {
  id: string
  workflowId: string
  status: 'running' | 'success' | 'error' | 'cancelled'
  startedAt: Date
  finishedAt?: Date
  triggerData?: any
  nodeExecutions: NodeExecution[]
  error?: ExecutionError
}
```

#### NodeExecution
```typescript
interface NodeExecution {
  id: string
  nodeId: string
  executionId: string
  status: 'waiting' | 'running' | 'success' | 'error'
  inputData?: any
  outputData?: any
  error?: NodeError
  startedAt?: Date
  finishedAt?: Date
}
```

### Database Schema

The PostgreSQL database will use the following main tables:
- `users` - User accounts and authentication
- `workflows` - Workflow definitions and metadata
- `executions` - Workflow execution records
- `node_executions` - Individual node execution details
- `credentials` - Encrypted credential storage
- `node_types` - Available node type definitions

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid workflow structure or node configuration
2. **Execution Errors**: Runtime failures during workflow execution
3. **Integration Errors**: External API failures or connectivity issues
4. **System Errors**: Database, queue, or infrastructure failures

### Error Handling Strategy

```typescript
class ErrorHandler {
  handleNodeError(error: NodeError, execution: Execution): Promise<void> {
    // Log error details
    // Update node execution status
    // Determine if workflow should continue or fail
    // Send real-time updates to frontend
  }
  
  handleWorkflowError(error: WorkflowError, execution: Execution): Promise<void> {
    // Mark execution as failed
    // Clean up resources
    // Send notifications if configured
    // Store error for debugging
  }
}
```

### Retry Mechanism

- Automatic retry for transient failures (network timeouts, rate limits)
- Exponential backoff for external API calls
- Manual retry option for failed executions
- Configurable retry policies per node type

## Testing Strategy

### Unit Testing
- **Node Logic**: Test individual node implementations
- **Workflow Validation**: Test workflow structure validation
- **Execution Engine**: Test execution flow and error handling
- **API Endpoints**: Test all REST API endpoints

### Integration Testing
- **Database Operations**: Test data persistence and retrieval
- **Queue Processing**: Test job queue functionality
- **External APIs**: Test integration with mock external services
- **Real-time Updates**: Test WebSocket communication

### End-to-End Testing
- **Workflow Creation**: Test complete workflow creation flow
- **Execution Monitoring**: Test real-time execution updates
- **Error Scenarios**: Test error handling and recovery
- **User Authentication**: Test login and permission flows

### Performance Testing
- **Concurrent Executions**: Test multiple simultaneous workflows
- **Large Workflows**: Test workflows with many nodes
- **Data Processing**: Test handling of large data volumes
- **Memory Usage**: Monitor memory consumption during execution

### Testing Tools
- Jest for unit and integration testing
- Playwright for end-to-end testing
- Artillery for load testing
- Docker for test environment isolation

### Custom Node Development Tools

**Node CLI Tool:**
```bash
# Create new node from template
npx n8n-node-cli create --type=action --name=MyCustomNode

# Validate node structure
npx n8n-node-cli validate ./nodes/MyCustomNode

# Build and package node
npx n8n-node-cli build ./nodes/MyCustomNode

# Test node locally
npx n8n-node-cli test ./nodes/MyCustomNode --input=test-data.json
```

**Development Environment:**
- Hot-reload support for custom nodes during development
- Built-in node testing framework with mock data
- Visual node property editor for rapid prototyping
- Automatic TypeScript compilation and validation
- Integration with popular IDEs (VS Code extensions)

**Node Marketplace Integration:**
```typescript
interface NodeMarketplace {
  publishNode(nodePackage: NodePackage): Promise<PublishResult>
  searchNodes(query: string, filters?: NodeFilters): Promise<NodeSearchResult[]>
  installNode(nodeId: string, version?: string): Promise<InstallResult>
  updateNode(nodeId: string): Promise<UpdateResult>
  getNodeInfo(nodeId: string): Promise<NodeInfo>
}
```

**Documentation Generator:**
- Automatic documentation generation from node definitions
- Interactive examples and code snippets
- API reference for node development
- Best practices and guidelines

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external integrations

### Credential Management
- AES-256 encryption for stored credentials
- Secure credential injection during execution
- Credential rotation capabilities

### Execution Security
- Sandboxed JavaScript execution using VM2
- Resource limits for node execution
- Input validation and sanitization
- Rate limiting for API endpoints

### Data Protection
- Encryption at rest for sensitive data
- TLS encryption for all communications
- Audit logging for security events
- GDPR compliance for user data

## Deployment & Containerization

### Docker Architecture

The application will be fully containerized with the following Docker setup:

```yaml
# docker-compose.yml structure
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - REACT_APP_API_URL=http://backend:4000
  
  backend:
    build: ./backend
    ports: ["4000:4000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/n8n_clone
      - REDIS_URL=redis://redis:6379
    depends_on: [postgres, redis]
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=n8n_clone
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes: ["postgres_data:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
```

### Container Features

**Multi-stage Builds:**
- Optimized production images with minimal attack surface
- Separate build and runtime stages for both frontend and backend
- Node.js Alpine images for smaller footprint

**Health Checks:**
- Container health endpoints for orchestration
- Database connection validation
- Redis connectivity checks

**Environment Configuration:**
- Environment-based configuration for different deployments
- Secrets management through Docker secrets or environment variables
- Configurable resource limits and scaling parameters

**Volume Management:**
- Persistent volumes for database data
- Shared volumes for workflow templates and logs
- Backup-friendly volume structure

### Deployment Options

**Development:**
- Docker Compose for local development
- Hot reload support for frontend and backend
- Development database seeding

**Production:**
- Kubernetes deployment manifests
- Horizontal pod autoscaling based on CPU/memory
- Load balancing for multiple backend instances
- Persistent volume claims for data storage

**Cloud Deployment:**
- AWS ECS/Fargate compatibility
- Google Cloud Run support
- Azure Container Instances ready
- Environment-specific configuration management