import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

/**
 * Switch Node - Routes data to different outputs based on conditions
 *
 * This demonstrates how to use collection/multipleValues for repeating fields
 * Users can add multiple outputs, each with their own conditions
 * Output pins are dynamically created based on configured outputs
 */
export const SwitchNode: NodeDefinition = {
  type: "switch",
  displayName: "Switch",
  name: "switch",
  group: ["transform"],
  version: 1,
  description:
    "Route data to different outputs based on conditions. Add multiple outputs with custom rules.",
  icon: "fa:code-branch",
  color: "#7E57C2",
  defaults: {
    mode: "rules",
    outputs: [],
  },
  inputs: ["main"],
  outputs: ["main"], // Base output - actual outputs are determined by configuration

  properties: [
    {
      displayName: "Mode",
      name: "mode",
      type: "options",
      required: true,
      default: "rules",
      description: "How to determine which output to use",
      options: [
        {
          name: "Rules",
          value: "rules",
          description: "Define rules to route data",
        },
        {
          name: "Expression",
          value: "expression",
          description: "Use an expression to determine output",
        },
      ],
    },

    // Outputs configuration - This will use RepeatingField component
    // Frontend will detect: type="collection" + typeOptions.multipleValues=true
    // and render using RepeatingField with the nested options as fields
    {
      displayName: "Outputs",
      name: "outputs",
      type: "collection",
      required: false,
      default: [],
      description:
        "Define multiple outputs with conditions. Click 'Add Output' to create routing rules.",
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: "Add Output",
      },
      displayOptions: {
        show: {
          mode: ["rules"],
        },
      },
      // These are NOT options for a dropdown, but FIELD DEFINITIONS for each item
      // The frontend needs to interpret this correctly
      component: "RepeatingField",
      componentProps: {
        fields: [
          {
            displayName: "Output Name",
            name: "outputName",
            type: "string",
            required: true,
            default: "",
            description: "Name for this output branch",
          },
          {
            displayName: "Field",
            name: "field",
            type: "string",
            required: true,
            default: "",
            description:
              "Field name to check in each item. Use 'id' or 'user.name' for nested fields. Do NOT use array indices like json[0].id - that will reference a specific item instead of checking each item.",
            placeholder: "id",
          },
          {
            displayName: "Condition",
            name: "condition",
            type: "options",
            required: true,
            default: "equals",
            description: "Condition to evaluate",
            options: [
              { name: "Equals", value: "equals" },
              { name: "Not Equals", value: "notEquals" },
              { name: "Contains", value: "contains" },
              { name: "Does Not Contain", value: "notContains" },
              { name: "Starts With", value: "startsWith" },
              { name: "Ends With", value: "endsWith" },
              { name: "Greater Than", value: "greaterThan" },
              { name: "Less Than", value: "lessThan" },
              { name: "Greater or Equal", value: "greaterOrEqual" },
              { name: "Less or Equal", value: "lessOrEqual" },
              { name: "Is Empty", value: "isEmpty" },
              { name: "Is Not Empty", value: "isNotEmpty" },
              { name: "Regex Match", value: "regex" },
            ],
          },
          {
            displayName: "Value",
            name: "value",
            type: "string",
            required: false,
            default: "",
            description: "Value to compare against",
            displayOptions: {
              hide: {
                condition: ["isEmpty", "isNotEmpty"],
              },
            },
          },
        ],
      },
    },

    // Expression mode
    {
      displayName: "Expression",
      name: "expression",
      type: "string",
      required: true,
      default: "",
      description: "Expression that returns output index (0-based)",
      displayOptions: {
        show: {
          mode: ["expression"],
        },
      },
    },
  ],

  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const mode = this.getNodeParameter("mode") as string;

    // Get items to process
    let items = inputData.main || [];

    if (items.length === 1 && items[0] && Array.isArray(items[0])) {
      items = items[0];
    }

    const processedItems = items.map((item: any) => {
      if (item && typeof item === "object" && "json" in item) {
        return item.json;
      }
      return item;
    });

    if (mode === "rules") {
      // Get outputs configuration
      const outputs = this.getNodeParameter("outputs") as any[];

      // If no outputs configured, return all items through first output
      if (!outputs || outputs.length === 0) {
        return [
          {
            main: processedItems.map((item: any) => ({ json: item })),
          },
        ];
      }

      // Route items based on conditions
      const routedOutputs: Record<number, any[]> = {};

      // Helper function to resolve field value from item
      // Handles both simple field names ("id") and template expressions ("{{json.id}}")
      const resolveFieldValue = (item: any, fieldExpression: string): any => {
        // If it's a template expression like {{json.id}} or {{json.user.address.city}}, extract the field path
        const templateMatch = fieldExpression.match(
          /\{\{json(?:\[\d+\])?\.([\w.[\]]+)\}\}/
        );
        if (templateMatch) {
          const fieldPath = templateMatch[1];
          // Support deeply nested paths like "user.address.city" or "items[0].name"
          return resolvePath(item, fieldPath);
        }

        // Otherwise treat as direct field path
        // Support deeply nested paths like "user.address.city"
        return resolvePath(item, fieldExpression);
      };

      // Helper to resolve nested paths including array access
      const resolvePath = (obj: any, path: string): any => {
        // Handle array notation: items[0].name -> items.0.name
        const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");

        return normalizedPath.split(".").reduce((current, key) => {
          if (current === null || current === undefined) {
            return undefined;
          }
          return current[key];
        }, obj);
      };

      // Helper function to evaluate conditions
      const evaluateCondition = (
        item: any,
        fieldExpression: string,
        condition: string,
        value: string
      ): boolean => {
        const fieldValue = resolveFieldValue(item, fieldExpression);
        const fieldStr = String(fieldValue || "");

        switch (condition) {
          case "equals":
            return fieldStr === value;
          case "notEquals":
            return fieldStr !== value;
          case "contains":
            return fieldStr.includes(value);
          case "notContains":
            return !fieldStr.includes(value);
          case "startsWith":
            return fieldStr.startsWith(value);
          case "endsWith":
            return fieldStr.endsWith(value);
          case "greaterThan":
            return Number(fieldValue) > Number(value);
          case "lessThan":
            return Number(fieldValue) < Number(value);
          case "greaterOrEqual":
            return Number(fieldValue) >= Number(value);
          case "lessOrEqual":
            return Number(fieldValue) <= Number(value);
          case "isEmpty":
            return !fieldValue || fieldValue === "";
          case "isNotEmpty":
            return fieldValue && fieldValue !== "";
          case "regex":
            try {
              const regex = new RegExp(value);
              return regex.test(fieldStr);
            } catch {
              return false;
            }
          default:
            return false;
        }
      };

      processedItems.forEach((item: any, itemIndex: number) => {
        let matched = false;

        // Check each output condition
        for (let i = 0; i < outputs.length; i++) {
          const output = outputs[i];
          const outputConfig = output.values || output; // Handle both nested and flat structure
          const field = outputConfig.field;
          const condition = outputConfig.condition;
          const value = outputConfig.value;

          if (evaluateCondition(item, field, condition, value)) {
            if (!routedOutputs[i]) {
              routedOutputs[i] = [];
            }
            routedOutputs[i].push({ json: item });
            matched = true;
            break; // Only route to first matching output
          }
        }

        // If no match found, item is discarded (not routed to any output)
      });

      // Convert to array format - one entry per output
      // Each output gets its routed items with the output name as key (like IF node)
      const result: NodeOutputData[] = [];
      for (let i = 0; i < outputs.length; i++) {
        const outputConfig = outputs[i].values || outputs[i]; // Handle both nested and flat structure
        const outputName = outputConfig.outputName || `output${i}`;
        const outputItems = routedOutputs[i] || [];

        result.push({
          [outputName]: outputItems, // Use output name as key
        });
      }

      return result;
    } else {
      // Expression mode
      const expression = this.getNodeParameter("expression") as string;

      // Simple expression evaluation (in reality, use a proper expression evaluator)
      const outputIndex = parseInt(expression, 10) || 0;

      return [
        {
          main: processedItems.map((item: any) => ({ json: item })),
        },
      ];
    }
  },
};
