import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
  NodeProperty,
} from "../../types/node.types";

/**
 * Example node demonstrating dynamic properties using a properties() function
 * This allows properties to be generated dynamically based on context or other factors
 */
export const DynamicPropertiesNode: NodeDefinition = {
  type: "dynamic-properties-example",
  displayName: "Dynamic Properties Example",
  name: "dynamicPropertiesExample",
  group: ["transform"],
  version: 1,
  description:
    "Example node showing how properties can be defined as a function for dynamic generation",
  icon: "fa:magic",
  color: "#9C27B0",
  defaults: {
    operationType: "transform",
    fieldName: "",
    transformAction: "uppercase",
  },
  inputs: ["main"],
  outputs: ["main"],

  // Properties defined as a function that returns NodeProperty[]
  // This allows for dynamic property generation based on context
  properties: function (): NodeProperty[] {
    // You can add logic here to generate properties dynamically
    // For example, based on user's organization, available resources, etc.

    const baseProperties: NodeProperty[] = [
      {
        displayName: "Operation Type",
        name: "operationType",
        type: "options",
        required: true,
        default: "transform",
        description: "Choose the type of operation to perform",
        options: [
          {
            name: "Transform",
            value: "transform",
            description: "Transform the data",
          },
          {
            name: "Filter",
            value: "filter",
            description: "Filter the data based on conditions",
          },
          {
            name: "Aggregate",
            value: "aggregate",
            description: "Aggregate data using various methods",
          },
        ],
      },
    ];

    // Add conditional properties based on operation type
    // Transform-specific properties
    const transformProperties: NodeProperty[] = [
      {
        displayName: "Field Name",
        name: "fieldName",
        type: "string",
        required: false,
        default: "",
        description: "The field name to transform",
        displayOptions: {
          show: {
            operationType: ["transform"],
          },
        },
      },
      {
        displayName: "Transform Action",
        name: "transformAction",
        type: "options",
        required: false,
        default: "uppercase",
        description: "The transformation to apply",
        displayOptions: {
          show: {
            operationType: ["transform"],
          },
        },
        options: [
          {
            name: "Uppercase",
            value: "uppercase",
            description: "Convert to uppercase",
          },
          {
            name: "Lowercase",
            value: "lowercase",
            description: "Convert to lowercase",
          },
          {
            name: "Capitalize",
            value: "capitalize",
            description: "Capitalize first letter",
          },
          {
            name: "Reverse",
            value: "reverse",
            description: "Reverse the string",
          },
        ],
      },
    ];

    // Filter-specific properties
    const filterProperties: NodeProperty[] = [
      {
        displayName: "Filter Field",
        name: "filterField",
        type: "string",
        required: false,
        default: "",
        description: "The field to filter by",
        displayOptions: {
          show: {
            operationType: ["filter"],
          },
        },
      },
      {
        displayName: "Filter Condition",
        name: "filterCondition",
        type: "options",
        required: false,
        default: "contains",
        description: "The condition to apply",
        displayOptions: {
          show: {
            operationType: ["filter"],
          },
        },
        options: [
          { name: "Contains", value: "contains" },
          { name: "Equals", value: "equals" },
          { name: "Starts With", value: "startsWith" },
          { name: "Ends With", value: "endsWith" },
        ],
      },
      {
        displayName: "Filter Value",
        name: "filterValue",
        type: "string",
        required: true,
        default: "",
        description: "The value to filter by",
        displayOptions: {
          show: {
            operationType: ["filter"],
          },
        },
      },
    ];

    // Aggregate-specific properties
    const aggregateProperties: NodeProperty[] = [
      {
        displayName: "Aggregate Field",
        name: "aggregateField",
        type: "string",
        required: false,
        default: "",
        description: "The field to aggregate",
        displayOptions: {
          show: {
            operationType: ["aggregate"],
          },
        },
      },
      {
        displayName: "Aggregate Method",
        name: "aggregateMethod",
        type: "options",
        required: false,
        default: "sum",
        description: "The aggregation method to use",
        displayOptions: {
          show: {
            operationType: ["aggregate"],
          },
        },
        options: [
          { name: "Sum", value: "sum" },
          { name: "Average", value: "average" },
          { name: "Count", value: "count" },
          { name: "Min", value: "min" },
          { name: "Max", value: "max" },
        ],
      },
    ];

    // Combine all properties
    return [
      ...baseProperties,
      ...transformProperties,
      ...filterProperties,
      ...aggregateProperties,
    ];
  },

  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const operationType = this.getNodeParameter("operationType") as string;

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

    let resultItems: any[] = [];

    switch (operationType) {
      case "transform": {
        const fieldName = this.getNodeParameter("fieldName") as string;
        const transformAction = this.getNodeParameter(
          "transformAction"
        ) as string;

        resultItems = processedItems.map((item: any) => {
          const newItem = { ...item };
          if (fieldName in newItem) {
            const value = String(newItem[fieldName]);

            switch (transformAction) {
              case "uppercase":
                newItem[fieldName] = value.toUpperCase();
                break;
              case "lowercase":
                newItem[fieldName] = value.toLowerCase();
                break;
              case "capitalize":
                newItem[fieldName] =
                  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                break;
              case "reverse":
                newItem[fieldName] = value.split("").reverse().join("");
                break;
            }
          }
          return { json: newItem };
        });
        break;
      }

      case "filter": {
        const filterField = this.getNodeParameter("filterField") as string;
        const filterCondition = this.getNodeParameter(
          "filterCondition"
        ) as string;
        const filterValue = this.getNodeParameter("filterValue") as string;

        resultItems = processedItems
          .filter((item: any) => {
            if (!(filterField in item)) return false;

            const value = String(item[filterField]);

            switch (filterCondition) {
              case "contains":
                return value.includes(filterValue);
              case "equals":
                return value === filterValue;
              case "startsWith":
                return value.startsWith(filterValue);
              case "endsWith":
                return value.endsWith(filterValue);
              default:
                return false;
            }
          })
          .map((item: any) => ({ json: item }));
        break;
      }

      case "aggregate": {
        const aggregateField = this.getNodeParameter(
          "aggregateField"
        ) as string;
        const aggregateMethod = this.getNodeParameter(
          "aggregateMethod"
        ) as string;

        const values = processedItems
          .filter((item: any) => aggregateField in item)
          .map((item: any) => Number(item[aggregateField]))
          .filter((val) => !isNaN(val));

        let result: number;

        switch (aggregateMethod) {
          case "sum":
            result = values.reduce((acc, val) => acc + val, 0);
            break;
          case "average":
            result =
              values.length > 0
                ? values.reduce((acc, val) => acc + val, 0) / values.length
                : 0;
            break;
          case "count":
            result = values.length;
            break;
          case "min":
            result = values.length > 0 ? Math.min(...values) : 0;
            break;
          case "max":
            result = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            result = 0;
        }

        resultItems = [
          {
            json: {
              field: aggregateField,
              method: aggregateMethod,
              result,
              count: values.length,
            },
          },
        ];
        break;
      }

      default:
        resultItems = processedItems.map((item: any) => ({ json: item }));
    }

    return [{ main: resultItems }];
  },
};
