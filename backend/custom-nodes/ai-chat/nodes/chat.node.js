const ChatNode = {
  type: "ai-chat",
  displayName: "AI Chat",
  name: "ai-chat",
  group: ["communication", "ai"],
  version: 1,
  description:
    "Interactive chat interface with AI - Send messages and receive AI responses",
  icon: "fa:comments",
  color: "#3b82f6",
  defaults: {
    name: "AI Chat",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "AI Model",
      name: "model",
      type: "options",
      default: "gpt-3.5-turbo",
      required: true,
      options: [
        {
          name: "GPT-3.5 Turbo",
          value: "gpt-3.5-turbo",
          description: "Fast and cost-effective",
        },
        {
          name: "GPT-4",
          value: "gpt-4",
          description: "Most capable model",
        },
        {
          name: "GPT-4 Turbo",
          value: "gpt-4-turbo-preview",
          description: "Latest GPT-4 with improved performance",
        },
      ],
      description: "Select the AI model to use",
    },
    {
      displayName: "System Prompt",
      name: "systemPrompt",
      type: "string",
      typeOptions: {
        rows: 4,
      },
      default: "You are a helpful AI assistant.",
      description: "System prompt to define AI behavior and personality",
    },
    {
      displayName: "User Message",
      name: "userMessage",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      default: "",
      required: true,
      description: "The message to send to the AI",
      placeholder: "Enter your message here...",
    },
    {
      displayName: "Conversation Historyxx",
      name: "conversationHistory",
      type: "json",
      default: "[]",
      description: "Previous messages in JSON format (optional)",
      placeholder:
        '[{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi!"}]',
    },
    {
      displayName: "Temperature",
      name: "temperature",
      type: "number",
      default: 0.7,
      typeOptions: {
        minValue: 0,
        maxValue: 2,
        numberPrecision: 1,
      },
      description: "Controls randomness: 0 is focused, 2 is creative",
    },
    {
      displayName: "Max Tokens",
      name: "maxTokens",
      type: "number",
      default: 2000,
      typeOptions: {
        minValue: 1,
        maxValue: 4000,
      },
      description: "Maximum length of the response",
    },
    {
      displayName: "Include Metadata",
      name: "includeMetadata",
      type: "boolean",
      default: false,
      description: "Include token usage and model information in output",
    },
  ],
  execute: async function (inputData) {
    const items = inputData.main?.[0] || [];
    const results = [];

    for (const item of items) {
      try {
        // Get parameters
        const model = this.getNodeParameter("model");
        const systemPrompt = this.getNodeParameter("systemPrompt");
        const userMessage = this.getNodeParameter("userMessage");
        const temperature = this.getNodeParameter("temperature");
        const maxTokens = this.getNodeParameter("maxTokens");
        const includeMetadata = this.getNodeParameter("includeMetadata");

        // Parse conversation history
        let conversationHistory = [];
        try {
          const historyParam = this.getNodeParameter("conversationHistory");
          if (historyParam && typeof historyParam === "string") {
            conversationHistory = JSON.parse(historyParam);
          } else if (Array.isArray(historyParam)) {
            conversationHistory = historyParam;
          }
        } catch (e) {
          console.warn("Failed to parse conversation history:", e);
        }

        // Build messages array
        const messages = [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ];

        // THIS IS A DEMO RESPONSE
        // In production, you would call an actual AI API here
        // For example: OpenAI, Anthropic, etc.

        // Simulated AI response
        const aiResponse = {
          role: "assistant",
          content: `[Demo Response using ${model}]\n\nI received your message: "${userMessage}"\n\nThis is a simulated response. To connect to a real AI:\n\n1. Install an AI SDK (e.g., openai package)\n2. Add your API key\n3. Replace this demo code with actual API calls\n\nSystem Prompt: ${systemPrompt}\nTemperature: ${temperature}\nMax Tokens: ${maxTokens}`,
          timestamp: new Date().toISOString(),
        };

        // Build result
        const resultData = {
          message: aiResponse.content,
          conversation: [...messages, aiResponse],
          lastMessage: {
            role: "assistant",
            content: aiResponse.content,
          },
          userMessage: userMessage,
          model: model,
        };

        // Add metadata if requested
        if (includeMetadata) {
          resultData.metadata = {
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            timestamp: aiResponse.timestamp,
            tokensUsed: {
              prompt: Math.floor(userMessage.length / 4), // Rough estimate
              completion: Math.floor(aiResponse.content.length / 4),
              total: Math.floor(
                (userMessage.length + aiResponse.content.length) / 4
              ),
            },
          };
        }

        results.push({
          json: {
            ...item.json,
            ...resultData,
          },
        });
      } catch (error) {
        // Handle errors gracefully
        results.push({
          json: {
            ...item.json,
            error: true,
            errorMessage: error.message,
            errorDetails: error.toString(),
          },
        });
      }
    }

    return [{ main: results }];
  },
};

module.exports = ChatNode;
