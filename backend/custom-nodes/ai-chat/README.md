# AI Chat Node

A custom node for AI-powered chat interactions in your workflow automation.

## Features

- 🤖 Multiple AI model support (GPT-3.5, GPT-4)
- 💬 Conversation history support
- ⚙️ Configurable temperature and max tokens
- 📊 Optional metadata output
- 🔄 Supports workflow chaining
- 🎯 System prompt customization

## Installation

This node is automatically registered when you run:

```bash
npm run nodes:register
```

## Usage

### Basic Chat

1. Add the "AI Chat" node to your workflow
2. Set the **User Message** parameter
3. Execute the workflow
4. The AI response will be in the output

### With Conversation History

```json
[
  {"role": "user", "content": "What is Node.js?"},
  {"role": "assistant", "content": "Node.js is a JavaScript runtime..."}
]
```

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| AI Model | options | Select GPT model | gpt-3.5-turbo |
| System Prompt | string | Define AI behavior | "You are a helpful AI assistant." |
| User Message | string | Message to send | (required) |
| Conversation History | json | Previous messages | [] |
| Temperature | number | Randomness (0-2) | 0.7 |
| Max Tokens | number | Response length | 2000 |
| Include Metadata | boolean | Add token usage info | false |

## Output

The node outputs:

```json
{
  "message": "AI response text",
  "conversation": [...],
  "lastMessage": {
    "role": "assistant",
    "content": "..."
  },
  "userMessage": "Original message",
  "model": "gpt-3.5-turbo"
}
```

With metadata enabled:

```json
{
  "message": "...",
  "metadata": {
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 2000,
    "timestamp": "2025-10-09T...",
    "tokensUsed": {
      "prompt": 100,
      "completion": 150,
      "total": 250
    }
  }
}
```

## Connecting to Real AI

Currently, this node uses **demo responses**. To connect to a real AI service:

### 1. Install AI SDK

```bash
npm install openai
# or
npm install @anthropic-ai/sdk
```

### 2. Add API Key

Set environment variable or use credentials:

```bash
OPENAI_API_KEY=your-api-key-here
```

### 3. Update execute function

Replace the demo code in `chat.node.js` with actual API calls:

```javascript
const OpenAI = require('openai');

execute: async function (inputData) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens,
  });

  const aiResponse = completion.choices[0].message;
  // ... rest of the code
}
```

## Example Workflows

### Simple Q&A
```
Input → AI Chat → Output
```

### Customer Support
```
Webhook → AI Chat (with history) → Send Email
```

### Content Generation
```
Get Data → AI Chat (creative temp) → Format → Save
```

### Multi-step Reasoning
```
Question → AI Chat (analyze) → AI Chat (elaborate) → Response
```

## Tips

- **Temperature**: 
  - 0.0-0.3: Precise, factual
  - 0.4-0.7: Balanced
  - 0.8-2.0: Creative, varied

- **Max Tokens**: 
  - Short answer: 500
  - Paragraph: 1000
  - Long form: 2000+

- **System Prompt**: Be specific about role and behavior

## Troubleshooting

**Node not appearing?**
- Run `npm run nodes:register` in backend
- Check console for errors

**Empty responses?**
- Verify AI API is connected
- Check API key is valid
- Review error output

## Future Enhancements

- [ ] OpenAI integration
- [ ] Anthropic Claude support
- [ ] Streaming responses
- [ ] Function calling
- [ ] Image generation
- [ ] Vision capabilities
- [ ] Embeddings support

## License

Part of n8n-clone project.
