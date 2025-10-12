import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const ChatNode: NodeDefinition = {
  type: "chat",
  displayName: "Chat One",
  name: "chat",
  group: ["communication", "ai"],
  version: 1,
  description:
    "Interactive chat interface - Send messages and trigger workflows. Can be used as a trigger or accept input from other nodes.",
  icon: "💬",
  color: "#3b82f6",
  executionCapability: "trigger",
  defaults: {
    name: "AI Chat",
  },
  inputs: [],
  outputs: ["main"],
  properties: [
    {
      displayName: "Accept Input from Other Nodes",
      name: "acceptInput",
      type: "boolean",
      default: false,
      description: "When enabled, this node can receive data from previous nodes in the workflow",
    },
    {
      displayName: "User Message",
      name: "userMessage",
      type: "string",
      default: "",
      required: true,
      description: "The message entered by the user",
      placeholder: "Enter your message here...",
    },
  ],

  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    // Check if node is configured to accept input
    const acceptInput = this.getNodeParameter("acceptInput", 0) as boolean;

    // Determine items based on input mode
    let items;
    if (acceptInput && inputData.main?.[0]?.length) {
      // Use input from previous nodes
      items = inputData.main[0];
    } else {
      // For trigger mode, create a default item if no input
      items = [{ json: {} }];
    }

    const results = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        // Get user message
        const userMessage = this.getNodeParameter("userMessage", i) as string;

        // Build output
        const resultData: any = {
          message: userMessage,
          userMessage: userMessage,
          timestamp: new Date().toISOString(),
        };

        // If accepting input, merge with incoming data
        if (acceptInput && item.json) {
          resultData.inputData = item.json;
        }

        results.push({
          json: resultData,
        });
      } catch (error: any) {
        this.logger?.error("Chat node execution failed", {
          error: error.message,
          itemIndex: i,
        });

        // Handle errors gracefully
        results.push({
          json: {
            error: true,
            errorMessage: error.message,
            errorDetails: error.toString(),
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return [{ main: results }];
  },
};
