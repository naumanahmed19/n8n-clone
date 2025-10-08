# AI Nodes - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get API Keys

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy it (starts with `sk-...`)

**Anthropic:**
1. Visit https://console.anthropic.com/settings/keys
2. Create new API key
3. Copy it (starts with `sk-ant-...`)

### Step 2: Add Credentials

1. Open your n8n-clone app
2. Go to **Credentials** page
3. Click **+ Add Credential**
4. Search for **"OpenAI API Key"** or **"Anthropic API Key"**
5. Fill in:
   - **Name:** `My OpenAI Key` (or any name)
   - **API Key:** Paste your key
6. Click **Save**

### Step 3: Use in Workflow

1. Create new workflow
2. Add **Manual Trigger** node
3. Add **OpenAI** or **Anthropic** node
4. Select your credential
5. Configure parameters
6. Execute! 🎉

---

## ⚡ Common Use Cases

### 1. Text Summarization

```yaml
Node: OpenAI
Model: gpt-4o-mini
User Message: "Summarize this in 3 sentences: {{json.text}}"
```

### 2. Customer Support Bot

```yaml
Node: Anthropic (Claude)
Model: claude-3-5-sonnet
System Prompt: "You are a helpful support agent"
User Message: "{{json.customerQuestion}}"
Enable Memory: true
Session ID: "{{json.userId}}"
```

### 3. Data Extraction

```yaml
Node: OpenAI
Model: gpt-4-turbo
System Prompt: "Extract as JSON: {name, email, phone}"
User Message: "{{json.text}}"
JSON Mode: true
```

### 4. Creative Writing

```yaml
Node: OpenAI
Model: gpt-4o
System Prompt: "You are a creative writer"
Temperature: 1.2
User Message: "Write a short story about {{json.topic}}"
```

### 5. Code Review

```yaml
Node: Anthropic (Claude)
Model: claude-3-5-sonnet
System Prompt: "You are an expert code reviewer"
User Message: "Review this code:\n\n{{json.code}}"
```

---

## 💡 Best Practices

### Model Selection

| Need | Use This |
|------|----------|
| Fast & Cheap | GPT-4o Mini, Claude 3.5 Haiku |
| Balanced | GPT-4o, Claude 3.5 Sonnet |
| Most Powerful | GPT-4, Claude 3 Opus |
| Long Context | Any Claude model (200K tokens) |

### Temperature Guide

- **0.0**: Perfect for facts, data extraction, translation
- **0.3-0.5**: Good for most tasks, balanced
- **0.7-1.0**: Creative tasks, brainstorming
- **1.2+**: Very creative, experimental

### Memory Usage

✅ **Use memory for:**
- Chatbots
- Multi-turn conversations
- Context-dependent tasks

❌ **Don't use memory for:**
- One-off requests
- Batch processing
- Independent tasks

---

## 🔧 Quick Fixes

### "Invalid API key"
→ Re-enter your API key in credentials

### "Rate limit exceeded"
→ Wait 1 minute and retry

### "No response"
→ Check your API key and model selection

### "Memory not working"
→ Ensure Session ID is the same across requests

---

## 📊 Cost Estimates

### OpenAI (per 1M tokens)

- **GPT-4o Mini:** $0.15 input / $0.60 output ⭐ Best value
- **GPT-4o:** $2.50 input / $10 output
- **GPT-3.5 Turbo:** $0.50 input / $1.50 output

### Anthropic (per 1M tokens)

- **Claude 3.5 Haiku:** $0.80 input / $4 output ⭐ Best value
- **Claude 3.5 Sonnet:** $3 input / $15 output
- **Claude 3 Opus:** $15 input / $75 output

### Typical Costs

- **Simple chat message (50 words):** ~$0.0001
- **Summarize article (1000 words):** ~$0.001
- **Long conversation (10 turns):** ~$0.01

---

## 🎯 Example Workflows

### Workflow 1: Email Classifier

```
HTTP Trigger (new email)
  ↓
OpenAI Node (classify email)
  Model: gpt-4o-mini
  Message: "Classify this email as urgent/normal/spam: {{json.email}}"
  ↓
IF Node (check classification)
  ↓
Send to appropriate handler
```

### Workflow 2: Content Generator

```
Schedule Trigger (daily)
  ↓
OpenAI Node (generate title)
  ↓
OpenAI Node (generate content)
  ↓
Save to database
  ↓
Post to social media
```

### Workflow 3: Intelligent Form Processor

```
Webhook (form submission)
  ↓
Claude Node (extract structured data)
  JSON Mode: true
  ↓
Validate data
  ↓
Save to CRM
  ↓
Send confirmation email
```

---

## 🚦 Status & Limits

### Memory Limits
- **Max messages per session:** 50
- **Session lifetime:** 24 hours
- **Auto-cleanup:** Hourly

### API Limits (vary by plan)
- **OpenAI Free Tier:** 3 RPM, 200 RPD
- **OpenAI Pay-as-go:** 3,500 RPM
- **Anthropic Free Tier:** Limited
- **Anthropic Paid:** Check your plan

---

## 📚 Learn More

- Full Documentation: `AI_NODES_DOCUMENTATION.md`
- OpenAI Docs: https://platform.openai.com/docs
- Anthropic Docs: https://docs.anthropic.com/

---

**Ready to build? Start creating intelligent workflows! 🚀**
