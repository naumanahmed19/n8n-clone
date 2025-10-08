# AI Nodes - OpenAI & Anthropic (Claude)

## Overview

Two powerful AI nodes have been added to your n8n-clone platform, allowing you to integrate large language models (LLMs) into your workflows:

1. **OpenAI Node** - Access GPT-4, GPT-3.5, and other OpenAI models
2. **Anthropic Node** - Access Claude 3.5 Sonnet, Opus, Haiku, and other Claude models

Both nodes support:

- ✅ **Conversation Memory** - Maintain context across multiple messages
- ✅ **Dynamic Parameters** - Use data from previous nodes with `{{json.fieldName}}`
- ✅ **Cost Tracking** - Monitor token usage and estimated costs
- ✅ **Secure Credentials** - API keys stored securely using the existing credential system
- ✅ **Multiple Models** - Choose from various models based on your needs

---

## Installation

### 1. Install Dependencies

Already installed! The following packages have been added to your backend:

- `openai` - Official OpenAI SDK
- `@anthropic-ai/sdk` - Official Anthropic SDK

### 2. Register Nodes

The nodes have been registered in your database. They should appear in your node list.

---

## Setup Credentials

### OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In your n8n-clone interface:
   - Go to **Credentials**
   - Click **Add Credential**
   - Select **"OpenAI API Key"**
   - Name: `My OpenAI Key`
   - API Key: Paste your `sk-...` key
   - Save

### Anthropic API Key

1. Get your API key from [Anthropic Console](https://console.anthropic.com/settings/keys)
2. In your n8n-clone interface:
   - Go to **Credentials**
   - Click **Add Credential**
   - Select **"Anthropic API Key"**
   - Name: `My Anthropic Key`
   - API Key: Paste your `sk-ant-...` key
   - Save

---

## OpenAI Node

### Available Models

| Model             | Context Window | Cost (Input/Output per 1K tokens) | Best For                         |
| ----------------- | -------------- | --------------------------------- | -------------------------------- |
| **GPT-4o**        | 128,000        | $0.0025 / $0.01                   | Latest, most capable, multimodal |
| **GPT-4o Mini**   | 128,000        | $0.00015 / $0.0006                | Fast, affordable, intelligent    |
| **GPT-4 Turbo**   | 128,000        | $0.01 / $0.03                     | Previous generation, reliable    |
| **GPT-4**         | 8,192          | $0.03 / $0.06                     | Original GPT-4                   |
| **GPT-3.5 Turbo** | 16,385         | $0.0005 / $0.0015                 | Fast, cheap for simple tasks     |

### Parameters

#### **Model** (required)

Choose which OpenAI model to use.

#### **System Prompt** (optional)

Instructions that define the AI's behavior and personality.

```
Example: "You are a helpful customer support agent. Be friendly and professional."
```

#### **User Message** (required)

The actual message/question for the AI. Supports dynamic data:

```
Static: "What is the capital of France?"
Dynamic: "Summarize this text: {{json.articleContent}}"
```

#### **Temperature** (0.0 - 2.0, default: 0.7)

Controls randomness:

- **0.0-0.3**: Very focused, deterministic (good for factual tasks)
- **0.7-1.0**: Balanced creativity
- **1.5-2.0**: Very creative, random

#### **Max Tokens** (default: 1000)

Maximum length of the response. Note: Both input and output count toward model limits.

#### **Enable Conversation Memory** (default: false)

When enabled, the AI remembers previous messages in the conversation.

#### **Session ID** (default: "default")

Unique identifier for the conversation. Use different IDs for different conversations:

- User-specific: `{{json.userId}}-chat`
- Workflow-specific: `order-processing-chat`

#### **JSON Mode** (default: false)

Forces the model to return valid JSON (GPT-4 Turbo and newer only).

### Output

```json
{
  "response": "The capital of France is Paris.",
  "model": "gpt-4o-mini",
  "usage": {
    "promptTokens": 15,
    "completionTokens": 8,
    "totalTokens": 23,
    "estimatedCost": 0.000007
  },
  "finishReason": "stop",
  "sessionId": "default",
  "conversationLength": 2
}
```

---

## Anthropic (Claude) Node

### Available Models

| Model                 | Context Window | Cost (Input/Output per 1K tokens) | Best For                     |
| --------------------- | -------------- | --------------------------------- | ---------------------------- |
| **Claude 3.5 Sonnet** | 200,000        | $0.003 / $0.015                   | Latest, most capable         |
| **Claude 3.5 Haiku**  | 200,000        | $0.0008 / $0.004                  | Fast, affordable             |
| **Claude 3 Opus**     | 200,000        | $0.015 / $0.075                   | Most powerful, complex tasks |
| **Claude 3 Sonnet**   | 200,000        | $0.003 / $0.015                   | Balanced performance         |
| **Claude 3 Haiku**    | 200,000        | $0.00025 / $0.00125               | Fastest, cheapest            |

### Parameters

Similar to OpenAI node, but Claude models are known for:

- ✅ Longer context windows (200K tokens)
- ✅ Better at following complex instructions
- ✅ Strong reasoning and analysis capabilities
- ✅ More careful and nuanced responses

### Output

```json
{
  "response": "Let me analyze that for you...",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "promptTokens": 20,
    "completionTokens": 150,
    "totalTokens": 170,
    "estimatedCost": 0.00231
  },
  "stopReason": "end_turn",
  "sessionId": "default",
  "conversationLength": 4
}
```

---

## Usage Examples

### Example 1: Simple Question & Answer

**Workflow:**

```
Manual Trigger → OpenAI Node
```

**OpenAI Configuration:**

- Model: `gpt-4o-mini`
- System Prompt: `You are a helpful assistant.`
- User Message: `What is the capital of France?`

**Output:**

```json
{
  "response": "The capital of France is Paris."
}
```

---

### Example 2: Summarize Data from Previous Node

**Workflow:**

```
HTTP Request → OpenAI Node → Save to Database
```

**HTTP Request Output:**

```json
{
  "article": {
    "title": "AI in 2024",
    "content": "Long article about AI trends..."
  }
}
```

**OpenAI Configuration:**

- User Message: `Summarize this article in 3 bullet points: {{json.article.content}}`

**Output:**

```json
{
  "response": "• Point 1...\n• Point 2...\n• Point 3..."
}
```

---

### Example 3: Chatbot with Memory

**Workflow:**

```
Webhook Trigger → Anthropic Node → Return Response
```

**Anthropic Configuration:**

- Model: `claude-3-5-sonnet-20241022`
- System Prompt: `You are a customer support agent for an e-commerce store.`
- User Message: `{{json.userMessage}}`
- Enable Memory: `true`
- Session ID: `{{json.userId}}`

**Conversation Flow:**

**Message 1:**

```
Input: "I want to return an item"
Output: "I'd be happy to help with your return. Could you provide your order number?"
```

**Message 2 (remembers context):**

```
Input: "Order #12345"
Output: "Thank you! I found order #12345. What item would you like to return?"
```

---

### Example 4: JSON Output for Structured Data

**Workflow:**

```
Manual Trigger → OpenAI Node (JSON Mode) → Process Data
```

**OpenAI Configuration:**

- Model: `gpt-4-turbo`
- System Prompt: `Extract person information as JSON with fields: name, age, occupation`
- User Message: `John is 30 years old and works as a software engineer.`
- JSON Mode: `true`

**Output:**

```json
{
  "response": "{\"name\":\"John\",\"age\":30,\"occupation\":\"software engineer\"}"
}
```

---

### Example 5: Compare Multiple AI Models

**Workflow:**

```
Manual Trigger
  ↓
  Split in two paths:
  ├─ OpenAI Node (GPT-4)
  └─ Anthropic Node (Claude 3.5 Sonnet)
  ↓
Merge Results → Compare
```

Ask both models the same question and compare their responses!

---

## Conversation Memory Details

### How It Works

1. **First Message:** System prompt + user message sent to AI
2. **AI Response:** Saved to memory with session ID
3. **Second Message:** Previous messages + new message sent
4. **Continues:** Full conversation history maintained

### Memory Limits

- **Max Messages:** 50 messages per session (automatic pruning)
- **Max Age:** 24 hours (auto-cleanup of old conversations)
- **System Prompt:** Always preserved when pruning

### Session ID Patterns

```typescript
// User-specific conversations
sessionId: `user-${userId}-support`;

// Workflow-specific
sessionId: `workflow-${workflowId}-chat`;

// Time-based
sessionId: `daily-${currentDate}`;

// No memory (each execution is independent)
enableMemory: false;
```

---

## Cost Management

### Monitoring Costs

Each response includes cost estimates:

```json
{
  "usage": {
    "promptTokens": 100,
    "completionTokens": 50,
    "totalTokens": 150,
    "estimatedCost": 0.000225 // $0.000225
  }
}
```

### Cost Optimization Tips

1. **Choose the right model:**

   - Simple tasks: GPT-4o Mini or Claude 3 Haiku
   - Complex tasks: GPT-4o or Claude 3.5 Sonnet
   - Only use Opus for most demanding tasks

2. **Limit max tokens:**

   - Set lower limits for short responses
   - Typical: 500-1000 tokens

3. **Optimize system prompts:**

   - Shorter prompts = fewer input tokens
   - Clear instructions = better responses

4. **Use memory wisely:**
   - Don't enable for one-off requests
   - Clear old conversations
   - Monitor conversation length

---

## Error Handling

### Common Errors

**"Invalid API key"**

- Check your credentials configuration
- Ensure API key is correct and active

**"Rate limit exceeded"**

- You've hit API rate limits
- Wait and retry, or upgrade your plan

**"Context length exceeded"**

- Input + output exceeds model's token limit
- Reduce input size or max tokens
- Use a model with larger context window

**"User message cannot be empty"**

- User message field is required
- Check your dynamic data references

---

## Advanced Features (Coming Soon)

Future enhancements planned:

- [ ] **Tool Calling:** Let AI use other workflow nodes as tools
- [ ] **Streaming Responses:** Real-time response streaming
- [ ] **Vector Memory:** Long-term semantic memory with similarity search
- [ ] **Prompt Templates:** Pre-built templates for common use cases
- [ ] **Cost Alerts:** Notifications when spending thresholds are reached
- [ ] **Multi-agent Workflows:** Multiple AI agents working together
- [ ] **Fine-tuning Support:** Use your custom fine-tuned models

---

## Technical Details

### File Structure

```
backend/src/
├── nodes/
│   ├── OpenAI/
│   │   ├── OpenAI.node.ts
│   │   └── index.ts
│   └── Anthropic/
│       ├── Anthropic.node.ts
│       └── index.ts
├── types/
│   └── ai.types.ts
└── utils/
    └── ai/
        └── MemoryManager.ts
```

### Memory Architecture

The `MemoryManager` is a singleton service that:

- Stores conversations in-memory (Map data structure)
- Auto-prunes old messages (max 50 per session)
- Auto-cleans expired sessions (24 hours)
- Thread-safe for concurrent requests

**Note:** Memory is currently in-memory only. For production, consider:

- Redis for distributed systems
- Database persistence
- Vector stores for semantic search

---

## Troubleshooting

### Node doesn't appear in UI

```bash
cd backend
npm run nodes:register
```

### Credentials not saving

- Check backend logs
- Verify CREDENTIAL_ENCRYPTION_KEY in .env
- Ensure database is connected

### AI responses are inconsistent

- Lower temperature for more deterministic responses
- Use more specific system prompts
- Try different models

### Memory not working

- Check Session ID is consistent across requests
- Verify "Enable Memory" is checked
- Check backend logs for memory stats

---

## API Reference

### Memory Manager Methods

```typescript
// Get memory stats
const stats = MemoryManager.getInstance().getStats();
console.log(stats);
// { activeConversations: 5, totalMessages: 127, averageMessagesPerConversation: 25 }

// Clear specific session
MemoryManager.getInstance().clearMemory("user-123-chat");

// Get all active sessions
const sessions = MemoryManager.getInstance().getActiveSessions();
```

---

## Support & Resources

### Documentation

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)

### Community

- Report issues on GitHub
- Join our Discord/Slack
- Check the forums

---

## Changelog

### v1.0.0 (Initial Release)

- ✅ OpenAI node with GPT-4o, GPT-3.5 support
- ✅ Anthropic node with Claude 3.5, Claude 3 support
- ✅ Conversation memory system
- ✅ Dynamic parameter support
- ✅ Cost tracking and usage statistics
- ✅ Secure credential management
- ✅ JSON mode for structured outputs
- ✅ Auto-cleanup for old conversations

---

**Happy building with AI! 🤖✨**
