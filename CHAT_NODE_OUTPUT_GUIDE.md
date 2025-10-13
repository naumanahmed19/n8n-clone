# Chat Node Output Guide

## ✅ Chat Node Now Has Output!

The Chat node has been updated to properly display and pass output data to the next nodes in your workflow.

## 📤 What Data Does It Output?

When the workflow executes, the Chat node outputs:

```json
{
  "message": "The AI's response text",
  "conversation": [
    { "role": "system", "content": "You are a helpful AI assistant." },
    { "role": "user", "content": "User's message" },
    { "role": "assistant", "content": "AI's response" }
  ],
  "lastMessage": {
    "role": "assistant",
    "content": "AI's response"
  },
  "userMessage": "User's message",
  "model": "gpt-3.5-turbo"
}
```

### Optional Metadata (if enabled)

If you enable "Include Metadata" in the node settings:

```json
{
  "metadata": {
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 2000,
    "timestamp": "2025-10-09T...",
    "tokensUsed": {
      "prompt": 25,
      "completion": 150,
      "total": 175
    },
    "status": "demo"
  }
}
```

## 🎯 How to Use the Output

### Example 1: Pass Response to Next Node

```
Chat Node → Set Node → HTTP Request
```

In the Set node, you can access:

- `{{ $json.message }}` - The AI response
- `{{ $json.userMessage }}` - The original user message
- `{{ $json.model }}` - The model used

### Example 2: Use in Conditions

```
Chat Node → Switch Node → Different Actions
```

In the Switch node:

- Check if `{{ $json.message }}` contains certain keywords
- Route based on conversation length: `{{ $json.conversation.length }}`

### Example 3: Store Full Conversation

```
Chat Node → Database Node
```

Store the entire conversation:

- Save `{{ $json.conversation }}` to preserve full chat history
- Use `{{ $json.lastMessage }}` for just the latest AI response

## 🎨 Visual Indicators

### Before Execution

- Node shows placeholder or local messages (interactive mode)
- No "Output Ready" badge

### After Execution

- ✅ **Green "Output Ready" badge** appears in the header
- Shows the actual conversation from the workflow execution
- Next nodes can access all the output data

## 🔧 Two Operating Modes

### 1. Interactive Mode (Before Workflow Runs)

- Type messages directly in the node
- Get demo responses
- Useful for testing the UI
- **Data is local** - not passed to other nodes

### 2. Execution Mode (When Workflow Runs)

- Node processes input data
- Calls AI service (currently demo)
- **Output is passed** to connected nodes
- Shows execution results in the UI
- Green "Output Ready" badge appears

## 📝 Example Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│  Chat Node  │────▶│   Set Node  │
│  (Manual)   │     │             │     │  Format     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Output    │
                    │  - message  │
                    │  - conversation │
                    │  - model    │
                    └─────────────┘
```

### Chat Node Configuration

- **AI Model**: GPT-3.5 Turbo
- **System Prompt**: "You are a helpful assistant"
- **User Message**: `{{ $json.userInput }}`
- **Include Metadata**: ✓ Enabled

### Set Node (Next Node)

Can access:

```javascript
{
  "aiResponse": "{{ $json.message }}",
  "modelUsed": "{{ $json.model }}",
  "tokensUsed": "{{ $json.metadata.tokensUsed.total }}",
  "conversationLength": "{{ $json.conversation.length }}"
}
```

## 🚀 Quick Test

1. **Add a Chat node** to your workflow
2. **Configure it** with a user message
3. **Add a Set node** after it
4. In the Set node, reference `{{ $json.message }}`
5. **Run the workflow**
6. ✅ Check that the Chat node shows **"Output Ready"** badge
7. ✅ Check that the Set node receives the data

## 🐛 Troubleshooting

### "No output data"

- Make sure the workflow has been executed
- Check the execution panel for errors
- Verify the Chat node has input data (if it needs it)

### "Output Ready badge not showing"

- Restart the frontend: `npm run dev`
- Execute the workflow to generate new results
- Check browser console for any errors

## 📚 Next Steps

- **Connect to Real AI**: Replace demo code in `backend/src/nodes/Chat/ChatNode.ts`
- **Add more nodes**: Use the Chat output in HTTP requests, databases, etc.
- **Chain conversations**: Feed output back into another Chat node
- **Store history**: Save conversations to a database

---

**Updated**: October 9, 2025  
**Status**: ✅ Output functionality working  
**Visual Indicator**: Green "Output Ready" badge when data available
