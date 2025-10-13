import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const IfNode: NodeDefinition = {
  type: BuiltInNodeTypes.IF,
  displayName: "IF",
  name: "if",
  group: ["transform"],
  version: 1,
  description: "Route data based on conditional logic",
  icon: "fa:code-branch",
  color: "#9C27B0",
  defaults: {
    value1: "",
    operation: "equal",
    value2: "",
  },
  inputs: ["main"],
  outputs: ["true", "false"],
  properties: [
    {
      displayName: "Value 1",
      name: "value1",
      type: "string",
      required: true,
      default: "",
      description:
        "First value to compare. Use {{json.fieldName}} to reference input data. Available fields will be shown in execution logs.",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      required: true,
      default: "equal",
      options: [
        { name: "Equal", value: "equal" },
        { name: "Not Equal", value: "notEqual" },
        { name: "Larger", value: "larger" },
        { name: "Larger Equal", value: "largerEqual" },
        { name: "Smaller", value: "smaller" },
        { name: "Smaller Equal", value: "smallerEqual" },
        { name: "Contains", value: "contains" },
        { name: "Not Contains", value: "notContains" },
        { name: "Starts With", value: "startsWith" },
        { name: "Ends With", value: "endsWith" },
        { name: "Is Empty", value: "isEmpty" },
        { name: "Is Not Empty", value: "isNotEmpty" },
        { name: "Regex", value: "regex" },
      ],
    },
    {
      displayName: "Value 2",
      name: "value2",
      type: "string",
      required: false,
      default: "",
      description:
        "Second value to compare (not needed for isEmpty/isNotEmpty). Use {{json.fieldName}} to reference input data. Available fields will be shown in execution logs.",
      displayOptions: {
        hide: {
          operation: ["isEmpty", "isNotEmpty"],
        },
      },
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    // Normalize and extract input items first
    const items = this.normalizeInputItems(inputData.main || []);
    const processedItems = this.extractJsonData(items);

    const trueItems: any[] = [];
    const falseItems: any[] = [];

    const evaluateCondition = (
      value1: any,
      operation: string,
      value2: any
    ): boolean => {
      const val1 = String(value1);
      const val2 = String(value2);

      switch (operation) {
        case "equal":
          return val1 === val2;

        case "notEqual":
          return val1 !== val2;

        case "larger":
          return Number(val1) > Number(val2);

        case "largerEqual":
          return Number(val1) >= Number(val2);

        case "smaller":
          return Number(val1) < Number(val2);

        case "smallerEqual":
          return Number(val1) <= Number(val2);

        case "contains":
          return val1.includes(val2);

        case "notContains":
          return !val1.includes(val2);

        case "startsWith":
          return val1.startsWith(val2);

        case "endsWith":
          return val1.endsWith(val2);

        case "isEmpty":
          return !val1 || val1.trim() === "";

        case "isNotEmpty":
          return !!(val1 && val1.trim() !== "");

        case "regex":
          try {
            const regex = new RegExp(val2);
            return regex.test(val1);
          } catch (error) {
            throw new Error(`Invalid regex pattern: ${val2}`);
          }

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    };

    // Evaluate each item with its own resolved values
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];

      if (!item || typeof item !== "object") {
        continue;
      }

      // Get parameters with automatic resolution for this specific item
      const value1 = await this.getNodeParameter("value1", i) as string;
      const operation = await this.getNodeParameter("operation", i) as string;
      const value2 = await this.getNodeParameter("value2", i) as string;

      const conditionResult = evaluateCondition(value1, operation, value2);

      const wrappedItem = { json: item };

      if (conditionResult) {
        trueItems.push(wrappedItem);
      } else {
        falseItems.push(wrappedItem);
      }
    }

    return [{ true: trueItems }, { false: falseItems }];
  },
};
