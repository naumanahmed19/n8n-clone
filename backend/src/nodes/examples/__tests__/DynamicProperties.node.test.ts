import { DynamicPropertiesNode } from "../DynamicProperties.node";
import { NodeProperty } from "../../../types/node.types";

describe("DynamicPropertiesNode", () => {
  describe("Node Definition", () => {
    it("should have correct basic properties", () => {
      expect(DynamicPropertiesNode.type).toBe("dynamic-properties-example");
      expect(DynamicPropertiesNode.displayName).toBe("Dynamic Properties Example");
      expect(DynamicPropertiesNode.name).toBe("dynamicPropertiesExample");
      expect(DynamicPropertiesNode.version).toBe(1);
      expect(DynamicPropertiesNode.group).toContain("transform");
    });

    it("should have dynamic properties as a function", () => {
      expect(typeof DynamicPropertiesNode.properties).toBe("function");
    });
  });

  describe("Properties Generation", () => {
    let properties: NodeProperty[];

    beforeEach(() => {
      // Resolve properties
      properties =
        typeof DynamicPropertiesNode.properties === "function"
          ? DynamicPropertiesNode.properties()
          : DynamicPropertiesNode.properties;
    });

    it("should generate properties array", () => {
      expect(Array.isArray(properties)).toBe(true);
      expect(properties.length).toBeGreaterThan(0);
    });

    it("should include base operationType property", () => {
      const operationTypeProp = properties.find(
        (p) => p.name === "operationType"
      );
      expect(operationTypeProp).toBeDefined();
      expect(operationTypeProp?.type).toBe("options");
      expect(operationTypeProp?.options).toHaveLength(3);
    });

    it("should include transform-specific properties", () => {
      const fieldNameProp = properties.find((p) => p.name === "fieldName");
      expect(fieldNameProp).toBeDefined();
      expect(fieldNameProp?.displayOptions?.show).toEqual({
        operationType: ["transform"],
      });

      const transformActionProp = properties.find(
        (p) => p.name === "transformAction"
      );
      expect(transformActionProp).toBeDefined();
      expect(transformActionProp?.type).toBe("options");
      expect(transformActionProp?.options).toHaveLength(4);
    });

    it("should include filter-specific properties", () => {
      const filterFieldProp = properties.find((p) => p.name === "filterField");
      expect(filterFieldProp).toBeDefined();
      expect(filterFieldProp?.displayOptions?.show).toEqual({
        operationType: ["filter"],
      });

      const filterConditionProp = properties.find(
        (p) => p.name === "filterCondition"
      );
      expect(filterConditionProp).toBeDefined();

      const filterValueProp = properties.find((p) => p.name === "filterValue");
      expect(filterValueProp).toBeDefined();
    });

    it("should include aggregate-specific properties", () => {
      const aggregateFieldProp = properties.find(
        (p) => p.name === "aggregateField"
      );
      expect(aggregateFieldProp).toBeDefined();
      expect(aggregateFieldProp?.displayOptions?.show).toEqual({
        operationType: ["aggregate"],
      });

      const aggregateMethodProp = properties.find(
        (p) => p.name === "aggregateMethod"
      );
      expect(aggregateMethodProp).toBeDefined();
      expect(aggregateMethodProp?.options).toHaveLength(5);
    });

    it("should have options with descriptions", () => {
      const operationTypeProp = properties.find(
        (p) => p.name === "operationType"
      );
      expect(operationTypeProp?.options?.[0]).toHaveProperty("description");
      expect(operationTypeProp?.options?.[0].description).toBe(
        "Transform the data"
      );
    });
  });

  describe("Execute Function - Transform Operation", () => {
    const createMockContext = (parameters: Record<string, any>) => ({
      getNodeParameter: jest.fn((paramName: string) => parameters[paramName]),
      getCredentials: jest.fn(),
      getInputData: jest.fn(),
      helpers: {} as any,
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });

    it("should transform data to uppercase", async () => {
      const mockContext = createMockContext({
        operationType: "transform",
        fieldName: "name",
        transformAction: "uppercase",
      });

      const inputData = {
        main: [
          [
            { json: { name: "john", age: 30 } },
            { json: { name: "jane", age: 25 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result).toHaveLength(1);
      expect(result[0].main).toHaveLength(2);
      expect(result[0].main?.[0].json.name).toBe("JOHN");
      expect(result[0].main?.[1].json.name).toBe("JANE");
    });

    it("should transform data to lowercase", async () => {
      const mockContext = createMockContext({
        operationType: "transform",
        fieldName: "name",
        transformAction: "lowercase",
      });

      const inputData = {
        main: [[{ json: { name: "JOHN" } }]],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.name).toBe("john");
    });

    it("should capitalize data", async () => {
      const mockContext = createMockContext({
        operationType: "transform",
        fieldName: "name",
        transformAction: "capitalize",
      });

      const inputData = {
        main: [[{ json: { name: "john doe" } }]],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.name).toBe("John doe");
    });

    it("should reverse string data", async () => {
      const mockContext = createMockContext({
        operationType: "transform",
        fieldName: "name",
        transformAction: "reverse",
      });

      const inputData = {
        main: [[{ json: { name: "hello" } }]],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.name).toBe("olleh");
    });
  });

  describe("Execute Function - Filter Operation", () => {
    const createMockContext = (parameters: Record<string, any>) => ({
      getNodeParameter: jest.fn((paramName: string) => parameters[paramName]),
      getCredentials: jest.fn(),
      getInputData: jest.fn(),
      helpers: {} as any,
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });

    it("should filter data by contains condition", async () => {
      const mockContext = createMockContext({
        operationType: "filter",
        filterField: "name",
        filterCondition: "contains",
        filterValue: "jo",
      });

      const inputData = {
        main: [
          [
            { json: { name: "john", age: 30 } },
            { json: { name: "jane", age: 25 } },
            { json: { name: "joey", age: 28 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main).toHaveLength(2);
      expect(result[0].main?.[0].json.name).toBe("john");
      expect(result[0].main?.[1].json.name).toBe("joey");
    });

    it("should filter data by equals condition", async () => {
      const mockContext = createMockContext({
        operationType: "filter",
        filterField: "age",
        filterCondition: "equals",
        filterValue: "30",
      });

      const inputData = {
        main: [
          [
            { json: { name: "john", age: 30 } },
            { json: { name: "jane", age: 25 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main).toHaveLength(1);
      expect(result[0].main?.[0].json.name).toBe("john");
    });
  });

  describe("Execute Function - Aggregate Operation", () => {
    const createMockContext = (parameters: Record<string, any>) => ({
      getNodeParameter: jest.fn((paramName: string) => parameters[paramName]),
      getCredentials: jest.fn(),
      getInputData: jest.fn(),
      helpers: {} as any,
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });

    it("should calculate sum", async () => {
      const mockContext = createMockContext({
        operationType: "aggregate",
        aggregateField: "price",
        aggregateMethod: "sum",
      });

      const inputData = {
        main: [
          [
            { json: { item: "A", price: 10 } },
            { json: { item: "B", price: 20 } },
            { json: { item: "C", price: 30 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main).toHaveLength(1);
      expect(result[0].main?.[0].json.result).toBe(60);
      expect(result[0].main?.[0].json.count).toBe(3);
    });

    it("should calculate average", async () => {
      const mockContext = createMockContext({
        operationType: "aggregate",
        aggregateField: "price",
        aggregateMethod: "average",
      });

      const inputData = {
        main: [[{ json: { price: 10 } }, { json: { price: 20 } }]],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.result).toBe(15);
    });

    it("should calculate min", async () => {
      const mockContext = createMockContext({
        operationType: "aggregate",
        aggregateField: "price",
        aggregateMethod: "min",
      });

      const inputData = {
        main: [
          [
            { json: { price: 30 } },
            { json: { price: 10 } },
            { json: { price: 20 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.result).toBe(10);
    });

    it("should calculate max", async () => {
      const mockContext = createMockContext({
        operationType: "aggregate",
        aggregateField: "price",
        aggregateMethod: "max",
      });

      const inputData = {
        main: [
          [
            { json: { price: 30 } },
            { json: { price: 10 } },
            { json: { price: 20 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.result).toBe(30);
    });

    it("should count items", async () => {
      const mockContext = createMockContext({
        operationType: "aggregate",
        aggregateField: "price",
        aggregateMethod: "count",
      });

      const inputData = {
        main: [
          [
            { json: { price: 10 } },
            { json: { price: 20 } },
            { json: { price: 30 } },
          ],
        ],
      };

      const result = await DynamicPropertiesNode.execute.call(
        mockContext,
        inputData
      );

      expect(result[0].main?.[0].json.result).toBe(3);
    });
  });
});
