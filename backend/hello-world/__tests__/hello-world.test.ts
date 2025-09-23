import HelloWorldNode from "../src/nodes/hello-world.node";
import { NodeExecutionContext, NodeInputData } from "../src/types/node.types";

describe("HelloWorldNode", () => {
  let mockContext: NodeExecutionContext;

  beforeEach(() => {
    mockContext = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn(),
      getInputData: jest.fn(),
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    } as NodeExecutionContext;
  });

  test("should have correct node definition", () => {
    expect(HelloWorldNode.type).toBe("hello-world");
    expect(HelloWorldNode.displayName).toBe("Hello World");
    expect(HelloWorldNode.name).toBe("helloWorld");
    expect(HelloWorldNode.version).toBe(1);
    expect(HelloWorldNode.description).toBe("A simple greeting node");
  });

  test("should greet with default message", async () => {
    const inputData: NodeInputData = {
      main: [[{ json: { name: "Alice", age: 30 } }]],
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation(
      (paramName) => {
        switch (paramName) {
          case "greeting":
            return "Hello";
          case "nameField":
            return "name";
          default:
            return undefined;
        }
      }
    );

    const result = await HelloWorldNode.execute.call(mockContext, inputData);

    expect(result).toBeDefined();
    expect(result[0]).toBeDefined();
    expect(result[0].main).toBeDefined();
    expect(result[0].main).toHaveLength(1);
    expect(result[0].main![0].json.message).toBe("Hello, Alice!");
    expect(result[0].main![0].json.processed).toBe(true);
    expect(result[0].main![0].json.timestamp).toBeDefined();
  });

  test("should greet with custom greeting", async () => {
    const inputData: NodeInputData = {
      main: [[{ json: { name: "Bob" } }]],
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation(
      (paramName) => {
        switch (paramName) {
          case "greeting":
            return "Hi";
          case "nameField":
            return "name";
          default:
            return undefined;
        }
      }
    );

    const result = await HelloWorldNode.execute.call(mockContext, inputData);

    expect(result[0].main![0].json.message).toBe("Hi, Bob!");
  });

  test("should handle missing name field", async () => {
    const inputData: NodeInputData = {
      main: [[{ json: { age: 25 } }]],
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation(
      (paramName) => {
        switch (paramName) {
          case "greeting":
            return "Hello";
          case "nameField":
            return "name";
          default:
            return undefined;
        }
      }
    );

    const result = await HelloWorldNode.execute.call(mockContext, inputData);

    expect(result[0].main![0].json.message).toBe("Hello, World!");
    expect(mockContext.logger?.warn).toHaveBeenCalled();
  });

  test("should handle empty input data", async () => {
    const inputData: NodeInputData = {
      main: [[]],
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation(
      (paramName) => {
        switch (paramName) {
          case "greeting":
            return "Hello";
          case "nameField":
            return "name";
          default:
            return undefined;
        }
      }
    );

    const result = await HelloWorldNode.execute.call(mockContext, inputData);

    expect(result).toBeDefined();
    expect(result[0].main).toHaveLength(0);
  });

  test("should throw error for missing greeting", async () => {
    const inputData: NodeInputData = {
      main: [[{ json: { name: "Test" } }]],
    };

    (mockContext.getNodeParameter as jest.Mock).mockImplementation(
      (paramName) => {
        switch (paramName) {
          case "greeting":
            return "";
          case "nameField":
            return "name";
          default:
            return undefined;
        }
      }
    );

    await expect(
      HelloWorldNode.execute.call(mockContext, inputData)
    ).rejects.toThrow("Greeting parameter is required");
  });
});
