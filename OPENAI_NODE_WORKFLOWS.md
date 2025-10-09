# OpenAI Node - Workflow Examples & Use Cases

## Visual Workflow Guide

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ENHANCED OPENAI NODE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: SELECT RESOURCE                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ○ Text (Chat Completions)                          │     │
│  │ ○ Audio - Text to Speech (TTS)                     │     │
│  │ ○ Audio - Speech to Text (Whisper)                 │     │
│  │ ○ Image - Generate (DALL-E)                        │     │
│  │ ○ Image - Edit/Variation                           │     │
│  │ ○ Vision (Image Analysis)                          │     │
│  │ ○ Embeddings (Text Vectors)                        │     │
│  │ ○ Moderation (Content Safety)                      │     │
│  └────────────────────────────────────────────────────┘     │
│                           ↓                                   │
│  Step 2: SELECT MODEL (filtered by resource)                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  [GPT-4o] [GPT-4o Mini] [O1] [DALL-E 3] etc.      │     │
│  └────────────────────────────────────────────────────┘     │
│                           ↓                                   │
│  Step 3: CONFIGURE PARAMETERS (resource-specific)            │
│  ┌────────────────────────────────────────────────────┐     │
│  │  [Prompt] [Temperature] [Max Tokens] etc.          │     │
│  └────────────────────────────────────────────────────┘     │
│                           ↓                                   │
│  Step 4: EXECUTE & OUTPUT                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Response + Metadata + Cost + Files                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Real-World Workflow Examples

### 1. 📝 Content Creation Studio

**Goal**: Generate blog post with cover image and audio narration

```
┌─────────────────┐
│ Manual Trigger  │
│ Topic: "AI 2025"│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - TEXT                │
│ Resource: Text                      │
│ Model: gpt-4o                       │
│ Prompt: Write blog about {{topic}}  │
└────────┬────────────────────────────┘
         │ Output: { article: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - IMAGE GENERATION    │
│ Resource: Image Generate            │
│ Model: dall-e-3                     │
│ Prompt: {{json.article.title}}      │
│ Style: vivid, Size: 1792x1024       │
└────────┬────────────────────────────┘
         │ Output: { imageUrl: "...", filePath: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - TEXT TO SPEECH      │
│ Resource: TTS                       │
│ Model: tts-1-hd                     │
│ Text: {{json.article.content}}      │
│ Voice: nova, Format: mp3            │
└────────┬────────────────────────────┘
         │ Output: { audioPath: "...", duration: 180 }
         ▼
┌─────────────────────────────────────┐
│ Save to Database                    │
│ - Article text                      │
│ - Cover image path                  │
│ - Audio narration path              │
│ - Total cost: $0.15                 │
└─────────────────────────────────────┘
```

**Cost Breakdown**:
- Text (GPT-4o): ~$0.05
- Image (DALL-E 3): ~$0.04
- TTS (1000 words): ~$0.06
- **Total**: ~$0.15

---

### 2. 🎧 Podcast Transcription & Analysis

**Goal**: Transcribe podcast, summarize, and create searchable embeddings

```
┌─────────────────┐
│ HTTP Request    │
│ Download podcast│
│ episode.mp3     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - WHISPER             │
│ Resource: Audio Transcribe          │
│ Model: whisper-1                    │
│ File: {{binary.data}}               │
│ Format: verbose_json                │
│ Timestamps: word level              │
└────────┬────────────────────────────┘
         │ Output: { text: "...", segments: [...] }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - TEXT (Summary)      │
│ Resource: Text                      │
│ Model: gpt-4o-mini                  │
│ Prompt: Summarize: {{json.text}}    │
│ Max tokens: 500                     │
└────────┬────────────────────────────┘
         │ Output: { summary: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - EMBEDDINGS          │
│ Resource: Embeddings                │
│ Model: text-embedding-3-small       │
│ Input: {{json.segments}}            │
└────────┬────────────────────────────┘
         │ Output: { embeddings: [...] }
         ▼
┌─────────────────────────────────────┐
│ Vector Database (Pinecone/Weaviate) │
│ Store embeddings for semantic search│
└─────────────────────────────────────┘
```

**Use Case**: Search podcast content semantically

---

### 3. 🛍️ E-commerce Product Automation

**Goal**: Analyze product image, generate description, create marketing variants

```
┌─────────────────┐
│ Webhook Trigger │
│ New product     │
│ + image URL     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - VISION              │
│ Resource: Vision                    │
│ Model: gpt-4o                       │
│ Image: {{json.productImage}}        │
│ Prompt: Describe product features   │
└────────┬────────────────────────────┘
         │ Output: { description: "Modern lamp, steel..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - TEXT                │
│ Resource: Text                      │
│ Model: gpt-4o-mini                  │
│ Prompt: Write SEO description for   │
│         {{json.description}}        │
└────────┬────────────────────────────┘
         │ Output: { seoText: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - IMAGE VARIATION     │
│ Resource: Image Edit                │
│ Operation: Variation                │
│ Image: {{json.productImage}}        │
│ Count: 3                            │
└────────┬────────────────────────────┘
         │ Output: { variations: [img1, img2, img3] }
         ▼
┌─────────────────────────────────────┐
│ Update Product Database             │
│ - AI description                    │
│ - SEO text                          │
│ - Marketing variants                │
└─────────────────────────────────────┘
```

**Benefit**: Automated product listing with professional content

---

### 4. 🎯 Customer Support Automation

**Goal**: Analyze customer screenshot, generate response, check safety

```
┌─────────────────┐
│ Email Trigger   │
│ Customer inquiry│
│ + screenshot    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - VISION              │
│ Resource: Vision                    │
│ Model: gpt-4o                       │
│ Image: {{attachments[0]}}           │
│ Prompt: What issue is shown?        │
└────────┬────────────────────────────┘
         │ Output: { issue: "Login error on screen" }
         ▼
┌─────────────────────────────────────┐
│ IF Node                             │
│ Check if known issue                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - TEXT                │
│ Resource: Text                      │
│ Model: gpt-4o                       │
│ System: Customer support agent      │
│ Message: Respond to: {{json.issue}} │
│ Memory: Enable (session per user)   │
└────────┬────────────────────────────┘
         │ Output: { response: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - MODERATION          │
│ Resource: Moderation                │
│ Text: {{json.response}}             │
└────────┬────────────────────────────┘
         │ Output: { flagged: false }
         ▼
┌─────────────────────────────────────┐
│ Send Email Response                 │
│ Body: {{json.response}}             │
└─────────────────────────────────────┘
```

**Benefit**: 24/7 intelligent support with safety checks

---

### 5. 🎨 Social Media Content Pipeline

**Goal**: Generate post, create visual, convert to video narration

```
┌─────────────────┐
│ Schedule Trigger│
│ Daily at 9 AM   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - TEXT                │
│ Resource: Text                      │
│ Model: gpt-4o                       │
│ Prompt: Create engaging social post │
│ Temperature: 0.9 (creative)         │
└────────┬────────────────────────────┘
         │ Output: { post: "Motivational quote..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - IMAGE               │
│ Resource: Image Generate            │
│ Model: dall-e-3                     │
│ Prompt: Visual for: {{json.post}}   │
│ Size: 1024x1024 (square for IG)    │
│ Quality: hd                         │
└────────┬────────────────────────────┘
         │ Output: { imageUrl: "..." }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - TTS                 │
│ Resource: TTS                       │
│ Model: tts-1                        │
│ Text: {{json.post}}                 │
│ Voice: shimmer                      │
│ Format: mp3                         │
└────────┬────────────────────────────┘
         │ Output: { audioPath: "..." }
         ▼
┌─────────────────────────────────────┐
│ Post to Social Media                │
│ - Instagram: Image + Text           │
│ - Twitter: Text                     │
│ - TikTok: Video with audio          │
└─────────────────────────────────────┘
```

**Result**: Multi-platform automated content

---

### 6. 📚 Document Intelligence System

**Goal**: Process documents, extract info, make searchable

```
┌─────────────────┐
│ File Upload     │
│ PDF Document    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Convert PDF to Images               │
│ Split pages                         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - VISION (Loop)       │
│ Resource: Vision                    │
│ Model: gpt-4o                       │
│ Images: {{json.pages}}              │
│ Prompt: Extract text and key info   │
└────────┬────────────────────────────┘
         │ Output: { extractedText: "...", entities: [...] }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - TEXT                │
│ Resource: Text                      │
│ Model: gpt-4o                       │
│ Prompt: Summarize: {{json.text}}    │
│ JSON Mode: true                     │
│ Schema: {title, summary, topics}    │
└────────┬────────────────────────────┘
         │ Output: { structured data }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - EMBEDDINGS          │
│ Resource: Embeddings                │
│ Model: text-embedding-3-large       │
│ Input: {{json.summary}}             │
└────────┬────────────────────────────┘
         │ Output: { vector: [...] }
         ▼
┌─────────────────────────────────────┐
│ Store in Database                   │
│ - Original text                     │
│ - Structured data                   │
│ - Vector embeddings                 │
└─────────────────────────────────────┘
```

**Use Case**: Corporate document search and analysis

---

### 7. 🎤 Meeting Assistant

**Goal**: Record meeting, transcribe, generate minutes, action items

```
┌─────────────────┐
│ Webhook         │
│ Meeting ended   │
│ Audio file URL  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - WHISPER             │
│ Resource: Audio Transcribe          │
│ Model: whisper-1                    │
│ File: {{json.audioUrl}}             │
│ Format: verbose_json                │
│ Timestamps: segment                 │
└────────┬────────────────────────────┘
         │ Output: { transcript: "...", speakers: [...] }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - TEXT (Summary)      │
│ Resource: Text                      │
│ Model: gpt-4o                       │
│ Prompt: Extract key points and      │
│         action items from meeting   │
│ JSON Mode: true                     │
└────────┬────────────────────────────┘
         │ Output: { summary: "...", actionItems: [...] }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 3 - TEXT (Email)        │
│ Resource: Text                      │
│ Model: gpt-4o-mini                  │
│ Prompt: Write professional email    │
│         with meeting notes          │
└────────┬────────────────────────────┘
         │ Output: { email: "..." }
         ▼
┌─────────────────────────────────────┐
│ Send Email to Participants          │
│ - Transcript attached               │
│ - Summary                           │
│ - Action items with assignees       │
└─────────────────────────────────────┘
```

**Benefit**: Automated meeting documentation

---

### 8. 🔍 Content Moderation Pipeline

**Goal**: Screen user-generated content before publishing

```
┌─────────────────┐
│ Webhook Trigger │
│ New post        │
│ Text + Image    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 1 - MODERATION          │
│ Resource: Moderation                │
│ Text: {{json.postText}}             │
└────────┬────────────────────────────┘
         │ Output: { textFlagged: false, scores: {...} }
         ▼
┌─────────────────────────────────────┐
│ OpenAI Node 2 - VISION              │
│ Resource: Vision                    │
│ Model: gpt-4o                       │
│ Image: {{json.postImage}}           │
│ Prompt: Check if image violates     │
│         content policy              │
└────────┬────────────────────────────┘
         │ Output: { imageSafe: true }
         ▼
┌─────────────────────────────────────┐
│ IF Node - Check All Passed          │
│ textFlagged == false &&             │
│ imageSafe == true                   │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
  Publish   Review Queue
```

**Benefit**: Automated content safety at scale

---

## 🎛️ Advanced Parameter Examples

### Text Resource - JSON Schema Response

```json
{
  "resource": "text",
  "model": "gpt-4o",
  "message": "Extract contact info from this text: {{json.emailContent}}",
  "responseFormat": "json_schema",
  "jsonSchema": {
    "name": "contact_info",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" },
        "phone": { "type": "string" }
      },
      "required": ["name", "email"]
    }
  }
}
```

**Benefit**: Guaranteed structured output format

### TTS Resource - Voice Showcase

```json
{
  "resource": "tts",
  "model": "tts-1-hd",
  "text": "Welcome to our service!",
  "voice": "nova",     // Professional female
  "speed": 1.0,        // Normal speed
  "format": "mp3"
}
```

**Voice Characteristics**:
- **alloy**: Neutral, balanced
- **echo**: Male, clear
- **fable**: British accent
- **onyx**: Deep male voice
- **nova**: Young female (recommended)
- **shimmer**: Energetic female

### Vision Resource - Multi-Image Analysis

```json
{
  "resource": "vision",
  "model": "gpt-4o",
  "message": "Compare these two products",
  "images": [
    {
      "url": "https://example.com/product1.jpg",
      "detail": "high"
    },
    {
      "url": "https://example.com/product2.jpg",
      "detail": "high"
    }
  ]
}
```

### Image Generate - DALL-E 3 Quality

```json
{
  "resource": "imageGenerate",
  "model": "dall-e-3",
  "prompt": "A serene Japanese garden with cherry blossoms",
  "size": "1792x1024",  // Wide landscape
  "quality": "hd",       // High quality
  "style": "natural"     // Photorealistic
}
```

---

## 💰 Cost Optimization Strategies

### 1. Model Selection

```
High Traffic:
  Text → gpt-4o-mini ($0.15 vs $2.50 per 1M tokens)
  Image → dall-e-2 ($0.02 vs $0.04 per image)
  TTS → tts-1 ($15 vs $30 per 1M chars)

High Quality:
  Text → gpt-4o or o1
  Image → dall-e-3 with hd quality
  TTS → tts-1-hd
```

### 2. Parameter Optimization

```typescript
// Reduce token usage
maxTokens: 500      // Instead of 4000
temperature: 0.3    // More focused = fewer retries

// Batch processing
input: [text1, text2, text3]  // Process multiple at once

// Caching
enableMemory: true  // Reuse context
```

### 3. Conditional Execution

```
┌─────────┐
│ IF Node │ Check if AI needed
└────┬────┘
     │
  Simple → Template Response (free)
  Complex → OpenAI Node (cost)
```

---

## 🎓 Best Practices

### 1. Error Handling

```typescript
// Always wrap in try-catch
try {
  result = await openai.execute();
} catch (error) {
  if (error.status === 429) {
    // Rate limit - retry with backoff
  } else if (error.status === 500) {
    // Server error - fallback
  }
}
```

### 2. File Management

```typescript
// Clean up temporary files
if (resource === 'tts' || resource === 'imageGenerate') {
  scheduleCleanup(filePath, 24 * 60 * 60 * 1000); // 24 hours
}
```

### 3. Cost Monitoring

```typescript
// Track per workflow
const totalCost = 
  textCost + 
  imageCost + 
  ttsCost;

if (totalCost > BUDGET_LIMIT) {
  logger.warn('Budget exceeded');
}
```

### 4. Memory Management

```typescript
// Clear old conversations
if (enableMemory) {
  memoryManager.cleanup(maxAge: 7 * 24 * 60 * 60 * 1000); // 7 days
}
```

---

## 🚀 Quick Start Templates

### Template 1: Text Summarization
```json
{
  "resource": "text",
  "model": "gpt-4o-mini",
  "systemPrompt": "You are a professional summarizer.",
  "userMessage": "Summarize in 3 bullet points: {{json.article}}",
  "maxTokens": 200
}
```

### Template 2: Image Generation
```json
{
  "resource": "imageGenerate",
  "model": "dall-e-3",
  "prompt": "{{json.description}}, professional, high quality",
  "size": "1024x1024",
  "quality": "standard"
}
```

### Template 3: Audio Transcription
```json
{
  "resource": "transcribe",
  "model": "whisper-1",
  "audioSource": "file",
  "audioFile": "{{json.filePath}}",
  "responseFormat": "verbose_json"
}
```

---

## 📊 Performance Metrics

| Resource | Avg Time | Tokens/Chars | Cost |
|----------|----------|--------------|------|
| Text (GPT-4o-mini) | 1-2s | 500 tokens | $0.0001 |
| Text (GPT-4o) | 2-5s | 500 tokens | $0.0075 |
| TTS | 3-8s | 1000 chars | $0.015 |
| Whisper | 5-20s | 5 min audio | $0.03 |
| Image Gen (DALL-E 3) | 10-30s | 1 image | $0.04 |
| Vision | 2-5s | 1 image | $0.01 |
| Embeddings | 0.5-1s | 500 tokens | $0.00001 |
| Moderation | 0.2-0.5s | 500 tokens | Free |

---

**Ready to build amazing AI workflows! 🎉**

For implementation details, see: `OPENAI_NODE_ENHANCEMENT_PLAN.md`
