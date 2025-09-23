
import DddNode from '../nodes/ddd.node';
import { NodeInputData, NodeExecutionContext } from '../types/node.types';


describe('DddNode', () => {
  let mockContext: Partial<NodeExecutionContext>;

  beforeEach(() => {
    mockContext = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn(),
      getInputData: jest.fn(),
      helpers: {
        request: jest.fn(),
        requestWithAuthentication: jest.fn(),
        returnJsonArray: jest.fn(),
        normalizeItems: jest.fn()
      },
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    };
  });

  test('should have correct node definition', () => {
    expect(DddNode.type).toBe('ddd');
    expect(DddNode.displayName).toBe('ggg');
    expect(DddNode.name).toBe('ddd');
    expect(DddNode.version).toBe(1);
  });

  test('should execute successfully with valid input', async () => {
    const inputData: NodeInputData = {
      main: [[
        { json: { test: 'data' } }
      ]]
    };

    // Mock parameter values
    (mockContext.getNodeParameter as jest.Mock).mockImplementation((paramName) => {
      switch (paramName) {
        case 'operation':
        case 'transformType':
          return 'process';
        case 'fieldName':
          return 'testField';
        default:
          return undefined;
      }
    });

    const result = await DddNode.execute.call(mockContext, inputData);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle empty input data', async () => {
    const inputData: NodeInputData = {
      main: [[]]
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation((paramName) => {
      switch (paramName) {
        case 'operation':
        case 'transformType':
          return 'process';
        default:
          return undefined;
      }
    });

    const result = await DddNode.execute.call(mockContext, inputData);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  test('should throw error for invalid operation', async () => {
    const inputData: NodeInputData = {
      main: [[
        { json: { test: 'data' } }
      ]]
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation((paramName) => {
      if (paramName === 'operation' || paramName === 'transformType') {
        return 'invalid';
      }
      return undefined;
    });

    await expect(
      DddNode.execute.call(mockContext, inputData)
    ).rejects.toThrow();
  });
});
