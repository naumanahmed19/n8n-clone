# Testing Documentation

This document describes the comprehensive testing system for the node-drop flow execution platform.

## Test Structure

### Test Categories

#### 1. Unit Tests (`src/__tests__/unit/`)

- Test individual components, functions, and classes in isolation
- Fast execution (< 1 second per test)
- No external dependencies (database, network, etc.)
- Mock all external services

**Examples:**

- Error handling utilities
- Data validation functions
- Business logic components
- Helper functions

#### 2. Integration Tests (`src/__tests__/integration/`)

- Test component interactions and API endpoints
- Use real database (test environment)
- Test WebSocket communications
- Validate end-to-end workflows

**Examples:**

- API endpoint functionality
- Database operations
- Service interactions
- WebSocket real-time features

#### 3. Performance Tests (`src/__tests__/performance/`)

- Measure system performance under load
- Memory usage monitoring
- Concurrent request handling
- Scalability validation

**Examples:**

- API response times
- Database query performance
- Memory leak detection
- Concurrent execution handling

## Test Configuration

### Jest Configuration

Located in `jest.config.ts`, provides:

- TypeScript support
- Coverage reporting
- Multi-project setup
- Custom matchers and utilities

### Environment Setup

- **Development**: Uses local test database
- **CI/CD**: Isolated test environment
- **Performance**: Extended timeouts and memory monitoring

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance
```

### Coverage Report

```bash
npm run test:coverage
```

### Watch Mode (Development)

```bash
npm run test:watch
```

## Test Utilities

### Global Test Utilities

Available in all tests via `global.testUtils`:

```typescript
// Create test user and get auth token
const token = await global.testUtils.createTestUser("user@example.com");

// Create test workflow
const workflowId = await global.testUtils.createTestWorkflow("Test Workflow");

// Clean up test data
await global.testUtils.cleanupTestData();

// Wait for condition
await global.testUtils.waitFor(() => someCondition, 5000);
```

### Performance Utilities

Available in performance tests via `global.performanceUtils`:

```typescript
// Measure execution time
const { result, duration } = await global.performanceUtils.measureTime(
  async () => {
    return await someAsyncOperation();
  }
);

// Measure memory usage
const { result, memoryDelta } = global.performanceUtils.measureMemory(() => {
  return someMemoryIntensiveOperation();
});

// Sleep utility
await global.performanceUtils.sleep(1000);
```

## Test Coverage

### Current Coverage Targets

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Coverage Reports

- **Text**: Console output during test runs
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`

## Database Testing

### Test Database Setup

1. Create test database: `nd_test`
2. Set environment variable: `TEST_DATABASE_URL`
3. Run migrations: Database is automatically set up during tests

### Test Data Management

- **Before Each Test**: Clean up test data
- **After All Tests**: Close database connections
- **Isolation**: Each test runs with clean state

## API Testing

### Authentication

```typescript
const response = await request(app)
  .post("/api/some-endpoint")
  .set("Authorization", `Bearer ${authToken}`)
  .send(data);
```

### Error Testing

```typescript
// Test error responses
const response = await request(app).post("/api/endpoint").send(invalidData);

expect(response.status).toBe(400);
expect(response.body.success).toBe(false);
expect(response.body.error).toBeDefined();
```

## WebSocket Testing

### Connection Testing

```typescript
const clientSocket = Client(`http://localhost:${port}`);

clientSocket.on("connect", () => {
  // Test connection established
});

clientSocket.emit("join-execution", { executionId: "test-123" });

clientSocket.on("execution-status", (data) => {
  // Test real-time updates
});
```

### Real-time Communication

```typescript
// Test broadcasting
socketService.broadcastExecutionFlowStatus(executionId, status);

// Verify client receives update
clientSocket.on("execution-status", (data) => {
  expect(data.executionId).toBe(executionId);
  expect(data.status).toBe(status);
});
```

## Error Handling Testing

### Error Classification

```typescript
const error = new WorkflowExecutionError(
  "Test error",
  "network_error",
  "transient"
);

expect(error.isRetryable).toBe(true);
expect(error.category).toBe("transient");
```

### Recovery Testing

```typescript
const analysis = await recoveryService.analyzeFailure(executionId, error);

expect(analysis.suggestedStrategy.type).toBe("retry");
expect(analysis.isRetryable).toBe(true);
```

## Performance Testing

### Response Time Testing

```typescript
const start = performance.now();
const response = await request(app).get("/api/endpoint");
const duration = performance.now() - start;

expect(response.status).toBe(200);
expect(duration).toBeLessThan(1000); // < 1 second
```

### Concurrent Request Testing

```typescript
const promises = Array.from({ length: 10 }, () =>
  request(app).get("/api/endpoint")
);

const responses = await Promise.all(promises);

responses.forEach((response) => {
  expect(response.status).toBe(200);
});
```

### Memory Usage Testing

```typescript
const initialMemory = process.memoryUsage();

// Perform memory-intensive operations
await performOperations();

const finalMemory = process.memoryUsage();
const growth = finalMemory.heapUsed - initialMemory.heapUsed;

expect(growth).toBeLessThan(100 * 1024 * 1024); // < 100MB
```

## Best Practices

### Test Organization

1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the operation being tested
3. **Assert**: Verify the expected outcomes
4. **Cleanup**: Clean up any test data

### Error Testing

- Test both success and failure scenarios
- Verify error messages and codes
- Test error recovery mechanisms
- Validate user-friendly error responses

### Performance Testing

- Set realistic performance expectations
- Test under various load conditions
- Monitor memory usage and leaks
- Validate concurrent operation handling

### Database Testing

- Use transactions for test isolation
- Clean up test data after each test
- Test constraint validations
- Verify data integrity

## Continuous Integration

### CI Pipeline

1. **Setup**: Install dependencies and set up test database
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: Validate component interactions
4. **Performance Tests**: Ensure performance regression detection
5. **Coverage**: Generate and validate coverage reports

### Quality Gates

- All tests must pass
- Coverage thresholds must be met
- Performance benchmarks must be maintained
- No critical security vulnerabilities

## Debugging Tests

### Verbose Output

```bash
VERBOSE_TESTS=true npm test
```

### Debug Single Test

```bash
npm test -- --testNamePattern="specific test name"
```

### Debug with Breakpoints

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Maintenance

### Adding New Tests

1. Create test file in appropriate category directory
2. Follow naming convention: `*.test.ts`
3. Include both positive and negative test cases
4. Update coverage expectations if needed

### Test Data Management

- Use factories for consistent test data creation
- Avoid hardcoded values where possible
- Clean up test data to prevent interference
- Use realistic but safe test data

### Performance Baselines

- Update performance expectations as system evolves
- Monitor test execution times
- Investigate and fix slow tests
- Maintain performance regression tests

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Verify `TEST_DATABASE_URL` is set correctly
- Ensure test database exists and is accessible
- Check database migrations are up to date

#### Test Timeouts

- Increase timeout for slow operations
- Check for resource leaks or deadlocks
- Optimize slow test operations

#### Memory Leaks

- Use `global.gc()` in performance tests
- Monitor memory growth patterns
- Clean up event listeners and timers

#### WebSocket Connection Issues

- Verify test server is properly started
- Check for proper connection cleanup
- Monitor for connection limit issues

For additional help, consult the team or create an issue in the project repository.
