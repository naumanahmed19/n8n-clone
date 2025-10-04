import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const SetNode: NodeDefinition = {
  type: BuiltInNodeTypes.SET,
  displayName: "Set",
  name: "set",
  group: ["transform"],
  version: 1,
  description: "Set values on the data",
  icon: "S",
  color: "#4CAF50",
  defaults: {
    values: [],
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Values",
      name: "values",
      type: "collection",
      required: false,
      default: [],
      description: "The values to set",
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: "Add Value",
      },
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const values = this.getNodeParameter("values") as Array<{
      name: string;
      value: any;
    }>;
    const items = inputData.main?.[0] || [{}];

    const outputItems = items.map((item) => {
      const newItem = { ...item };

      values.forEach(({ name, value }) => {
        if (name) {
          newItem[name] = value;
        }
      });

      return { json: newItem };
    });

    return [{ main: outputItems }];
  },
};
