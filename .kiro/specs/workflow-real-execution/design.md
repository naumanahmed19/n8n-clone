# Design Document

## Overview

This design transforms the current workflow execution system from simulation-only to actual execution of nodes. The system currently has a complete execution engine architecture with proper database models, queue management, and security services, but the actual node execution is simulated. This design focuses on implementing real execution for Manual Trigger and HTTP Request nodes while maintaining the existing security and architectural patterns.

The key insight is that the backend already has a robust execution framework - we need to enhance the node execution logic to perform real operations instead of simulations, and ensure the frontend properly handles real execution results.

## Architecture

### Current Architecture Analysis

The system already has:
- **ExecutionEngine**: Manages workflow execution with Bull queues and Redis
- **ExecutionService**: Provides high-level execution APIs
- **NodeService**: Handles node registration and execution with security
- **SecureExecutionService**: Provides sandboxed execution environment
- **Database Models**: Complete execution tracking with Prisma
- **Frontend Store**: Comprehensive workflow state management

### Enhanced Architecture Components

#### 1. Real Node Execution Layer
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  WorkflowEditor → WorkflowStore → ExecutionService API      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ExecutionController → ExecutionService → ExecutionEngine   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node Execution Layer                        │
├─────────────────────────────────────────────────────────────┤
│  NodeService → SecureExecutionService → RealNodeExecutors   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                External Systems Layer                       │
├─────────────────────────────────────────────────────────────┤
│     HTTP APIs    │    File System    │    Databases        │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Node Execution Flow
```
Manual Trigger → Real HTTP Request → Data Processing → Results Storage
      │                  │                 │              │
      ▼                  ▼                 ▼              ▼
  User Input    →   Network Call   →   Transform   →   Database
  Validation         with Timeout       Response        Persistence
```

## Components and Interfaces

### 1. Enhanced Node Executors

#### HTTP Request Node Executor
```typescript
interface HttpRequestExecutor {
  execute(parameters: HttpRequestParams, context: ExecutionContext): Promise<HttpResponse>
  validateUrl(url: string): ValidationResult
  enforceSecurityLimits(request: HttpRequest): void
  handleTimeout(request: HttpRequest, timeout: number): Promise<HttpResponse>
}

interface HttpRequestParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: any
  timeout: number
  followRedirects: boolean
  maxRedirects: number
}

interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  responseTime: number
  finalUrl: string
}
```

#### Manual Trigger Node Executor
```typescript
interface ManualTriggerExecutor {
  execute(parameters: ManualTriggerParams, triggerData: any): Promise<TriggerOutput>
  validateTriggerData(data: any): ValidationResult
  prepareTriggerOutput(data: any, parameters: ManualTriggerParams): TriggerOutput
}

interface ManualTriggerParams {
  description: string
  allowCustomData: boolean
  defaultData: string
  dataValidation?: DataValidationRules
}

interface TriggerOutput {
  triggeredAt: string
  triggerType: 'manual'
  description: string
  customData?: any
  metadata: TriggerMetadata
}
```

### 2. Security and Validation Layer

#### URL Security Validator
```typescript
interface UrlSecurityValidator {
  validateUrl(url: string): SecurityValidationResult
  isInternalNetwork(url: string): boolean
  isBlockedDomain(url: string): boolean
  sanitizeUrl(url: string): string
}

interface SecurityValidationResult {
  isValid: boolean
  errors: SecurityError[]
  sanitizedUrl?: string
  riskLevel: 'low' | 'medium' | 'high'
}
```

#### Resource Limits Enforcer
```typescript
interface ResourceLimitsEnforcer {
  enforceMemoryLimit(context: ExecutionContext): void
  enforceTimeoutLimit(operation: Promise<any>, timeout: number): Promise<any>
  enforceNetworkLimits(request: HttpRequest): void
  trackResourceUsage(executionId: string): ResourceUsage
}

interface ResourceUsage {
  memoryUsed: number
  executionTime: number
  networkRequests: number
  dataTransferred: number
}
```

### 3. Real-time Communication Layer

#### Execution Event Broadcaster
```typescript
interface ExecutionEventBroadcaster {
  broadcastExecutionStart(executionId: string, workflowId: string): void
  broadcastNodeStart(executionId: string, nodeId: string, nodeType: string): void
  broadcastNodeComplete(executionId: string, nodeId: string, result: NodeResult): void
  broadcastNodeError(executionId: string, nodeId: string, error: ExecutionError): void
  broadcastExecutionComplete(executionId: string, result: ExecutionResult): void
}
```

### 4. Enhanced Frontend State Management

#### Real Execution State
```typescript
interface RealExecutionState extends ExecutionState {
  realTimeResults: Map<string, NodeExecutionResult>
  networkActivity: NetworkActivityState
  resourceUsage: ResourceUsageState
  executionLogs: ExecutionLogEntry[]
}

interface NetworkActivityState {
  activeRequests: ActiveHttpRequest[]
  completedRequests: CompletedHttpRequest[]
  failedRequests: FailedHttpRequest[]
}

interface ExecutionLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: any
}
```

## Data Models

### 1. Enhanced Execution Tracking

#### Real Node Execution Results
```sql
-- Extend existing NodeExecution table
ALTER TABLE NodeExecution ADD COLUMN real_output_data JSONB;
ALTER TABLE NodeExecution ADD COLUMN network_metrics JSONB;
ALTER TABLE NodeExecution ADD COLUMN resource_usage JSONB;
ALTER TABLE NodeExecution ADD COLUMN security_events JSONB;

-- Add indexes for performance
CREATE INDEX idx_node_execution_real_data ON NodeExecution USING GIN (real_output_data);
CREATE INDEX idx_node_execution_metrics ON NodeExecution USING GIN (network_metrics);
```

#### HTTP Request Tracking
```sql
CREATE TABLE HttpRequestLog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_execution_id UUID REFERENCES NodeExecution(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_headers JSONB,
  response_body JSONB,
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Security Audit Trail

#### Security Events Tracking
```sql
CREATE TABLE SecurityEvent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES Execution(id) ON DELETE CASCADE,
  node_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_events_execution ON SecurityEvent(execution_id);
CREATE INDEX idx_security_events_type ON SecurityEvent(event_type);
```

## Error Handling

### 1. HTTP Request Error Categories

#### Network Errors
```typescript
enum HttpErrorType {
  TIMEOUT = 'TIMEOUT',
  DNS_RESOLUTION = 'DNS_RESOLUTION',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  SSL_ERROR = 'SSL_ERROR',
  NETWORK_UNREACHABLE = 'NETWORK_UNREACHABLE'
}

interface HttpExecutionError extends ExecutionError {
  httpErrorType: HttpErrorType
  statusCode?: number
  responseHeaders?: Record<string, string>
  responseBody?: string
  requestUrl: string
  requestMethod: string
}
```

#### Security Errors
```typescript
enum SecurityErrorType {
  BLOCKED_URL = 'BLOCKED_URL',
  INTERNAL_NETWORK = 'INTERNAL_NETWORK',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  INVALID_PROTOCOL = 'INVALID_PROTOCOL',
  MALICIOUS_CONTENT = 'MALICIOUS_CONTENT'
}

interface SecurityExecutionError extends ExecutionError {
  securityErrorType: SecurityErrorType
  blockedResource: string
  securityRule: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}
```

### 2. Error Recovery Strategies

#### Retry Logic for HTTP Requests
```typescript
interface RetryStrategy {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
  retryableErrors: HttpErrorType[]
}

const DEFAULT_HTTP_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    HttpErrorType.TIMEOUT,
    HttpErrorType.CONNECTION_REFUSED,
    HttpErrorType.NETWORK_UNREACHABLE
  ]
}
```

#### Graceful Degradation
```typescript
interface ExecutionFallbackStrategy {
  continueOnNodeFailure: boolean
  skipFailedNodes: boolean
  useDefaultValues: boolean
  notifyOnFailure: boolean
  logFailureDetails: boolean
}
```

## Testing Strategy

### 1. Unit Testing

#### Node Executor Tests
- HTTP Request executor with various response scenarios
- Manual Trigger executor with different data configurations
- Security validator with malicious URL attempts
- Resource limit enforcer with memory/timeout violations

#### Mock External Services
```typescript
interface MockHttpService {
  mockResponse(url: string, response: HttpResponse): void
  mockError(url: string, error: HttpError): void
  mockTimeout(url: string, delay: number): void
  mockNetworkFailure(url: string): void
  clearMocks(): void
}
```

### 2. Integration Testing

#### End-to-End Execution Tests
- Complete workflow execution with real HTTP calls to test APIs
- Manual trigger workflows with various data payloads
- Error scenarios with network failures and timeouts
- Security enforcement with blocked URLs and resource limits

#### Performance Testing
```typescript
interface ExecutionPerformanceTest {
  testConcurrentExecutions(count: number): Promise<PerformanceResult>
  testLargeDataProcessing(dataSize: number): Promise<PerformanceResult>
  testLongRunningWorkflows(duration: number): Promise<PerformanceResult>
  testResourceUsage(workflowComplexity: number): Promise<ResourceUsageResult>
}
```

### 3. Security Testing

#### Security Validation Tests
- URL validation against internal networks
- Resource limit enforcement
- Input sanitization and validation
- Credential handling and storage

#### Penetration Testing Scenarios
```typescript
interface SecurityTestScenario {
  testInternalNetworkAccess(): Promise<SecurityTestResult>
  testResourceExhaustion(): Promise<SecurityTestResult>
  testMaliciousPayloads(): Promise<SecurityTestResult>
  testCredentialLeakage(): Promise<SecurityTestResult>
}
```

## Implementation Phases

### Phase 1: Core Real Execution (Requirements 1, 2)
1. Enhance HTTP Request node with real network calls
2. Implement Manual Trigger with actual data passing
3. Add basic error handling and timeout management
4. Update frontend to handle real execution results

### Phase 2: Advanced Error Handling (Requirement 4)
1. Implement comprehensive error categorization
2. Add retry logic for network failures
3. Enhance security validation and blocking
4. Improve error reporting in the UI

### Phase 3: Execution Persistence (Requirement 5)
1. Store real execution results in database
2. Implement execution history with actual data
3. Add execution analytics and metrics
4. Create execution result viewer in frontend

### Phase 4: Security Hardening (Requirement 6)
1. Implement URL security validation
2. Add resource usage monitoring and limits
3. Create security audit trail
4. Add security event notifications

### Phase 5: Real-time Monitoring (Requirement 3)
1. Enhance real-time execution progress
2. Add live execution logs and metrics
3. Implement execution cancellation
4. Add performance monitoring dashboard

## Security Considerations

### 1. Network Security
- Block access to internal network ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Validate and sanitize all URLs before making requests
- Implement domain blacklisting for known malicious sites
- Enforce HTTPS for sensitive operations

### 2. Resource Protection
- Limit memory usage per node execution (128MB default)
- Enforce execution timeouts (30 seconds default)
- Limit concurrent HTTP requests per execution
- Monitor and limit data transfer sizes

### 3. Data Security
- Sanitize all input data to prevent injection attacks
- Encrypt sensitive data in execution logs
- Implement proper credential management
- Audit all security-related events

### 4. Execution Isolation
- Use isolated execution contexts for node processing
- Prevent access to system resources from node code
- Implement proper error boundaries to prevent crashes
- Monitor resource usage and terminate runaway processes