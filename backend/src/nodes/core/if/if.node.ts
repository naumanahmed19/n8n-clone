import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../../types/node.types";

export class IfNode {
  static getNodeDefinition(): NodeDefinition {
    return {
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
        console.log(
          "----------------------------------------------------------------"
        );
        console.log("inputData:", JSON.stringify(inputData, null, 2));
        console.log("inputData.main:", inputData.main);
        console.log("typeof inputData.main:", typeof inputData.main);
        console.log(
          "Array.isArray(inputData.main):",
          Array.isArray(inputData.main)
        );
        if (inputData.main && inputData.main.length > 0) {
          console.log("inputData.main[0]:", inputData.main[0]);
          console.log("typeof inputData.main[0]:", typeof inputData.main[0]);
          console.log(
            "Array.isArray(inputData.main[0]):",
            Array.isArray(inputData.main[0])
          );
        }

        const value1 = this.getNodeParameter("value1") as string;
        const operation = this.getNodeParameter("operation") as string;
        const value2 = this.getNodeParameter("value2") as string;

        // inputData.main is the array of items to process
        let items = inputData.main || [];
        console.log(
          "Raw items from inputData.main:",
          JSON.stringify(items, null, 2)
        );

        // Handle different input structures
        if (items.length === 1 && items[0] && Array.isArray(items[0])) {
          // If items is wrapped in an extra array layer: [[{json: {...}}, {json: {...}}]]
          items = items[0];
          console.log(
            "Unwrapped items from nested array:",
            JSON.stringify(items, null, 2)
          );
        }

        // Extract actual data objects from the json wrappers if needed
        const processedItems = items.map((item: any) => {
          if (item && typeof item === "object" && "json" in item) {
            return item.json; // Extract the actual data from {json: {...}}
          }
          return item; // Use item directly if it's already the data object
        });

        console.log(
          "Final processed items for IF evaluation:",
          JSON.stringify(processedItems, null, 2)
        );
        console.log("Number of items to process:", processedItems.length);
        const trueItems: any[] = [];
        const falseItems: any[] = [];

        // Helper function to resolve values with placeholders
        const resolveValue = (value: string, item: any): any => {
          if (typeof value !== "string") {
            return value;
          }

          // Replace placeholders like {{json.fieldName}}
          return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            console.log(
              `[IF Node Debug] Trying to resolve placeholder: ${match}`
            );
            console.log(`[IF Node Debug] Path: ${path}`);

            const parts = path.split(".");
            let result = item;
            let currentPath = "";

            // Skip 'json' prefix if it exists, since we already extracted the json data
            let startIndex = 0;
            if (parts[0] === "json") {
              startIndex = 1;
              console.log(
                `[IF Node Debug] Skipping 'json' prefix, starting from: ${parts[1]}`
              );
            }

            for (let i = startIndex; i < parts.length; i++) {
              const part = parts[i];
              currentPath += (currentPath ? "." : "") + part;
              console.log(
                `[IF Node Debug] Accessing: ${currentPath}, Current result:`,
                result
              );

              if (result && typeof result === "object" && part in result) {
                result = result[part];
                console.log(`[IF Node Debug] Found ${part}:`, result);
              } else {
                console.log(
                  `[IF Node Debug] Could not find ${part} in:`,
                  result
                );
                console.log(
                  `[IF Node Debug] Available keys:`,
                  result && typeof result === "object"
                    ? Object.keys(result)
                    : "N/A"
                );
                return match; // Return original if path not found
              }
            }

            const finalResult = result !== undefined ? String(result) : match;
            console.log(
              `[IF Node Debug] Final resolved value for ${match}: "${finalResult}"`
            );
            return finalResult;
          });
        };

        // Helper function to evaluate individual conditions
        const evaluateCondition = (
          value1: any,
          operation: string,
          value2: any
        ): boolean => {
          // Convert values to appropriate types for comparison
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

        for (const item of processedItems) {
          // Ensure item exists and has the expected structure
          if (!item || typeof item !== "object") {
            console.log(`[IF Node Debug] Skipping invalid item:`, item);
            continue;
          }

          // Debug: Log available fields in the item
          const availableFields = item ? Object.keys(item) : [];
          console.log(
            `[IF Node Debug] Item fields available:`,
            availableFields
          );
          console.log(
            `[IF Node Debug] Full item structure:`,
            JSON.stringify(item, null, 2)
          );

          // Replace placeholders in values with actual data from item
          const resolvedValue1 = resolveValue(value1, item);
          const resolvedValue2 = resolveValue(value2, item);

          // Debug: Log resolution process
          console.log(
            `[IF Node Debug] Original value1: "${value1}" → Resolved: "${resolvedValue1}"`
          );
          console.log(
            `[IF Node Debug] Original value2: "${value2}" → Resolved: "${resolvedValue2}"`
          );
          console.log(`[IF Node Debug] Operation: ${operation}`);

          const conditionResult = evaluateCondition(
            resolvedValue1,
            operation,
            resolvedValue2
          );

          console.log(`[IF Node Debug] Condition result: ${conditionResult}`);

          // Wrap the item back in the expected format for output
          const wrappedItem = { json: item };

          if (conditionResult) {
            trueItems.push(wrappedItem);
          } else {
            falseItems.push(wrappedItem);
          }
        }

        console.log(`[IF Node Debug] Final results:`);
        console.log(`[IF Node Debug] - True items: ${trueItems.length}`);
        console.log(`[IF Node Debug] - False items: ${falseItems.length}`);
        console.log(
          `[IF Node Debug] - True items data:`,
          JSON.stringify(trueItems, null, 2)
        );
        console.log(
          `[IF Node Debug] - False items data:`,
          JSON.stringify(falseItems, null, 2)
        );

        // Always return both outputs - the workflow execution engine will handle empty branches
        const result: NodeOutputData[] = [
          { true: trueItems },
          { false: falseItems },
        ];

        console.log(
          `[IF Node Debug] Returning both outputs - true: ${trueItems.length} items, false: ${falseItems.length} items`
        );
        console.log(
          `[IF Node Debug] Complete result structure:`,
          JSON.stringify(result, null, 2)
        );
        console.log(`[IF Node Debug] Result array length:`, result.length);
        console.log(`[IF Node Debug] Result[0] keys:`, Object.keys(result[0]));
        console.log(`[IF Node Debug] Result[1] keys:`, Object.keys(result[1]));
        return result;
      },
    };
  }
}
