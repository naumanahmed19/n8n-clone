import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../../types/node.types";

export class JsonNode {
  static getNodeDefinition(): NodeDefinition {
    return {
      type: BuiltInNodeTypes.JSON,
      displayName: "JSON",
      name: "json",
      group: ["transform"],
      version: 1,
      description: "Compose a JSON object",
      icon: "fa:code",
      color: "#FF9800",
      defaults: {
        jsonData: "{}",
      },
      inputs: ["main"],
      outputs: ["main"],
      properties: [
        {
          displayName: "JSON Data",
          name: "jsonData",
          type: "json",
          required: true,
          default: "{}",
          description: "The JSON data to output",
        },
      ],
      execute: async function (
        inputData: NodeInputData
      ): Promise<NodeOutputData[]> {
        const jsonData = this.getNodeParameter("jsonData") as string;

        console.log(
          "----------------------------------------------------------------"
        );
        console.log("JSON Data:", jsonData);
        try {
          const parsedData =
            typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
          return [{ main: [{ json: parsedData }] }];
        } catch (error) {
          throw new Error(
            `Invalid JSON data: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
    };
  }
}
