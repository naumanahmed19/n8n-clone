import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const ChatNode: NodeDefinition = {
  type: "chat",
  displayName: "Chat",
  name: "chat",
  group: ["communication", "ai"],
  version: 1,
  description:
    "Interactive chat interface - Send messages and trigger workflows. Can be used as a trigger.",
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
    // For trigger nodes, create a default item if no input
    const items = inputData.main?.[0] || [{ json: {} }];
    const results = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        // Get user message
        const userMessage = this.getNodeParameter("userMessage", i) as string;

        this.logger?.info("Chat node executing", {
          userMessageLength: userMessage.length,
        });

        // Build simple output with just the user message
        const resultData: any = {
          message: userMessage,
          userMessage: userMessage,
          timestamp: new Date().toISOString(),
        };

        results.push({
          json: {
            ...item.json,
            ...resultData,
          },
        });

        this.logger?.info("Chat node completed", {
          message: userMessage,
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
