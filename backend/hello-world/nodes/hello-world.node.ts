import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
  NodeProperty,
} from "../src/types/node.types";

const HelloWorldNode: NodeDefinition = {
  type: "hello-world",
  displayName: "Hello World",
  name: "helloWorld",
  group: ["transform"],
  version: 1,
  description: "A simple greeting node",
  icon: "fa:hand-wave",
  color: "#4CAF50",
  defaults: {
    name: "Hello World",
    greeting: "Hello",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Greeting",
      name: "greeting",
      type: "string",
      required: true,
      default: "Hello",
      description: "The greeting to use",
    },
    {
      displayName: "Name Field",
      name: "nameField",
      type: "string",
      required: false,
      default: "name",
      description: "Field containing the name to greet",
    },
  ] as NodeProperty[],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const greeting = this.getNodeParameter("greeting") as string;
    const nameField = this.getNodeParameter("nameField") as string;
    const items = inputData.main?.[0] || [];

    // Validate required parameters
    if (!greeting) {
      throw new Error("Greeting parameter is required");
    }

    const outputItems = items.map((item: any) => {
      const name = item.json[nameField];
      if (!name && this.logger && this.logger.warn) {
        this.logger.warn(
          `No name found in field '${nameField}' for item`,
          item
        );
      }

      return {
        json: {
          ...item.json,
          message: `${greeting}, ${name || "World"}!`,
          timestamp: new Date().toISOString(),
          processed: true,
        },
      };
    });

    return [{ main: outputItems }];
  },
};

export default HelloWorldNode;
