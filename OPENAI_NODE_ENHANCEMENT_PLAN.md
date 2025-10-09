# OpenAI Node Enhancement Plan - Full Feature Implementation

## Research Summary: OpenAI API Capabilities (2024-2025)

Based on OpenAI's current API offerings, here are the main capabilities we need to support:

### 1. **Text Generation (Chat Completions)**
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo, o1, o1-mini
- **Features**: 
  - Chat completions with system/user/assistant messages
  - JSON mode for structured outputs
  - Function calling
  - Streaming responses
  - Token usage tracking
  - Context windows: 4K - 128K tokens

### 2. **Text-to-Speech (TTS)**
- **Models**: tts-1, tts-1-hd
- **Voices**: alloy, echo, fable, onyx, nova, shimmer
- **Formats**: mp3, opus, aac, flac, wav, pcm
- **Features**: 
  - High quality audio generation
  - Variable speed (0.25x - 4.0x)
  - Different voice personalities

### 3. **Speech-to-Text (STT/Whisper)**
- **Models**: whisper-1
- **Features**:
  - Audio transcription
  - Audio translation (to English)
  - Multiple language support
  - Timestamps
  - Word-level timestamps
  - Formats: mp3, mp4, mpeg, mpga, m4a, wav, webm

### 4. **Image Generation (DALL-E)**
- **Models**: dall-e-3, dall-e-2
- **Features**:
  - Text-to-image generation
  - Image editing (variations)
  - Multiple sizes: 256x256, 512x512, 1024x1024, 1792x1024, 1024x1792
  - Quality: standard, hd (DALL-E 3)
  - Style: vivid, natural (DALL-E 3)
  - Multiple images per request (DALL-E 2)

### 5. **Vision (Image Understanding)**
- **Models**: GPT-4o, GPT-4 Turbo, GPT-4 Vision
- **Features**:
  - Image analysis and description
  - OCR (text extraction from images)
  - Object detection
  - Scene understanding
  - Multiple images in one request
  - Image URLs or base64

### 6. **Embeddings**
- **Models**: text-embedding-3-large, text-embedding-3-small, text-embedding-ada-002
- **Features**:
  - Text vectorization for semantic search
  - Document similarity
  - Clustering and classification
  - Dimensions: 1536 (ada-002), 3072 (large), variable

### 7. **Moderation**
- **Models**: text-moderation-latest, text-moderation-stable
- **Categories**: hate, harassment, self-harm, sexual, violence
- **Features**:
  - Content filtering
  - Multi-category scoring
  - Automatic flagging

### 8. **Assistants API** (Advanced - Phase 2)
- Code Interpreter
- File Search (RAG)
- Function Calling
- Persistent threads
- Knowledge retrieval

### 9. **Fine-tuning** (Advanced - Phase 2)
- Custom model training
- Dataset management
- Model versioning

---

## Implementation Architecture

### Resource-Based Design

The enhanced OpenAI node will use a **resource selector** pattern similar to professional automation tools:

```
┌─────────────────────────────────────┐
│  Resource Type Selector             │
│  ┌───────────────────────────────┐  │
│  │ • Text (Chat)                 │  │
│  │ • Audio (TTS)                 │  │
│  │ • Audio (STT/Transcribe)      │  │
│  │ • Image (Generate)            │  │
│  │ • Image (Edit/Variation)      │  │
│  │ • Vision (Analyze)            │  │
│  │ • Embeddings                  │  │
│  │ • Moderation                  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Operation Selector (if applicable) │
│  (Based on selected resource)       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Model Selector                     │
│  (Filtered by resource type)        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Resource-Specific Parameters       │
│  (Dynamic based on selection)       │
└─────────────────────────────────────┘
```

---

## Detailed Feature Breakdown

### 1. Text (Chat Completions) - CURRENT + ENHANCEMENTS

**Current Features:**
- ✅ Model selection
- ✅ System prompt
- ✅ User message
- ✅ Temperature
- ✅ Max tokens
- ✅ Conversation memory
- ✅ JSON mode

**New Enhancements:**
- 🆕 Top P (nucleus sampling)
- 🆕 Frequency penalty
- 🆕 Presence penalty
- 🆕 Stop sequences
- 🆕 Response format (JSON schema)
- 🆕 Seed (for reproducibility)
- 🆕 Add o1 and o1-mini models
- ⏳ Streaming support (Phase 3 - requires WebSocket)
- ⏳ Function calling (Future - requires Agent node)

**New Models:**
```typescript
"o1-preview": {
  name: "O1 Preview",
  contextWindow: 128000,
  costPer1kInput: 0.015,
  costPer1kOutput: 0.06,
},
"o1-mini": {
  name: "O1 Mini",
  contextWindow: 128000,
  costPer1kInput: 0.003,
  costPer1kOutput: 0.012,
}
```

---

### 2. Audio - Text-to-Speech (TTS) - NEW

**Purpose:** Convert text to natural-sounding speech

**Models:**
```typescript
"tts-1": {
  name: "TTS-1 (Standard)",
  costPer1kChars: 0.015,
  quality: "standard",
  latency: "realtime"
},
"tts-1-hd": {
  name: "TTS-1 HD (High Quality)",
  costPer1kChars: 0.030,
  quality: "hd",
  latency: "slower"
}
```

**Parameters:**
- **Text Input** (string, required, supports autocomplete from previous nodes)
- **Model** (options: tts-1, tts-1-hd)
- **Voice** (options: alloy, echo, fable, onyx, nova, shimmer)
  - Use autocomplete with descriptions
- **Speed** (number, 0.25 - 4.0, default: 1.0)
- **Output Format** (options: mp3, opus, aac, flac, wav, pcm)
- **Save to File** (boolean) - Option to save audio file
- **Output Path** (string, conditional) - Where to save file

**Output:**
```json
{
  "audio": "<base64_audio_data>",
  "format": "mp3",
  "duration": 15.5,
  "model": "tts-1",
  "voice": "alloy",
  "filePath": "/uploads/audio_12345.mp3" // if saved
}
```

---

### 3. Audio - Speech-to-Text (Whisper) - NEW

**Purpose:** Transcribe or translate audio to text

**Operations:**
- Transcribe (speech to text in original language)
- Translate (speech to English text)

**Parameters:**
- **Operation** (options: transcribe, translate)
- **Audio Source** (options: file, url, base64)
- **Audio File** (file upload or path from previous node)
- **Audio URL** (string, conditional)
- **Audio Data** (string, base64, conditional)
- **Language** (autocomplete: en, es, fr, de, it, pt, ja, ko, zh, etc.)
  - Only for transcribe operation
- **Response Format** (options: json, text, srt, vtt, verbose_json)
- **Temperature** (number, 0-1, optional)
- **Timestamp Granularities** (multiselect: segment, word)

**Output:**
```json
{
  "text": "The transcribed text content",
  "language": "en",
  "duration": 45.2,
  "segments": [...], // if verbose
  "words": [...], // if word timestamps requested
  "model": "whisper-1"
}
```

---

### 4. Image - Generate (DALL-E) - NEW

**Purpose:** Generate images from text descriptions

**Models:**
```typescript
"dall-e-3": {
  name: "DALL-E 3",
  costPer1Image: 0.040, // for 1024x1024 standard
  maxImages: 1,
  sizes: ["1024x1024", "1792x1024", "1024x1792"]
},
"dall-e-2": {
  name: "DALL-E 2",
  costPer1Image: 0.020, // for 1024x1024
  maxImages: 10,
  sizes: ["256x256", "512x512", "1024x1024"]
}
```

**Parameters:**
- **Model** (options: dall-e-3, dall-e-2)
- **Prompt** (string, required, supports autocomplete)
  - Max 4000 characters
- **Size** (options: dynamic based on model)
- **Quality** (options: standard, hd) - DALL-E 3 only
- **Style** (options: vivid, natural) - DALL-E 3 only
- **Number of Images** (number, 1-10) - DALL-E 2 only
- **Response Format** (options: url, b64_json)
- **Save to File** (boolean)
- **Output Path** (string, conditional)

**Output:**
```json
{
  "images": [
    {
      "url": "https://...",
      "b64_json": "...",
      "filePath": "/uploads/image_12345.png",
      "revisedPrompt": "Enhanced prompt used by DALL-E 3"
    }
  ],
  "model": "dall-e-3",
  "size": "1024x1024",
  "cost": 0.040
}
```

---

### 5. Image - Edit/Variation - NEW

**Purpose:** Edit images or create variations

**Operations:**
- Edit (modify image with prompt)
- Variation (create variations of image)

**Parameters:**
- **Operation** (options: edit, variation)
- **Image Source** (options: file, url, base64)
- **Image File** (file upload or path)
- **Mask Image** (file upload, optional, for edit only)
- **Prompt** (string, required for edit)
- **Number of Images** (number, 1-10)
- **Size** (options: 256x256, 512x512, 1024x1024)
- **Response Format** (options: url, b64_json)
- **Save to File** (boolean)

**Output:**
```json
{
  "images": [
    {
      "url": "https://...",
      "b64_json": "...",
      "filePath": "/uploads/image_edited_12345.png"
    }
  ],
  "model": "dall-e-2",
  "operation": "edit"
}
```

---

### 6. Vision - Analyze Image - NEW

**Purpose:** Analyze and describe images using GPT-4 Vision

**Models:**
- GPT-4o
- GPT-4 Turbo
- GPT-4 Vision

**Parameters:**
- **Model** (options: gpt-4o, gpt-4-turbo, gpt-4-vision-preview)
- **System Prompt** (string, optional)
- **User Message** (string, required, supports autocomplete)
- **Images** (array of image sources)
  - **Image Source** (repeating field)
    - Source Type (options: url, base64, file)
    - Image URL (conditional)
    - Image File (conditional)
    - Image Data (conditional)
    - Detail Level (options: auto, low, high)
- **Temperature** (number)
- **Max Tokens** (number)

**Output:**
```json
{
  "response": "Description and analysis of the image(s)",
  "model": "gpt-4o",
  "imageCount": 2,
  "usage": {
    "promptTokens": 1500,
    "completionTokens": 200,
    "totalTokens": 1700,
    "estimatedCost": 0.00425
  }
}
```

---

### 7. Embeddings - NEW

**Purpose:** Convert text to vector embeddings for semantic search

**Models:**
```typescript
"text-embedding-3-large": {
  name: "Text Embedding 3 Large",
  dimensions: 3072,
  costPer1kTokens: 0.00013
},
"text-embedding-3-small": {
  name: "Text Embedding 3 Small",
  dimensions: 1536,
  costPer1kTokens: 0.00002
},
"text-embedding-ada-002": {
  name: "Ada 002 (Legacy)",
  dimensions: 1536,
  costPer1kTokens: 0.0001
}
```

**Parameters:**
- **Model** (options: text-embedding-3-large, text-embedding-3-small, ada-002)
- **Input** (string or array of strings, supports autocomplete)
- **Dimensions** (number, optional) - For new models only
- **Encoding Format** (options: float, base64)

**Output:**
```json
{
  "embeddings": [
    {
      "index": 0,
      "embedding": [0.123, -0.456, ...],
      "dimensions": 1536
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "promptTokens": 50,
    "totalTokens": 50
  }
}
```

---

### 8. Moderation - NEW

**Purpose:** Check content for policy violations

**Parameters:**
- **Text** (string, required, supports autocomplete)
- **Model** (options: text-moderation-latest, text-moderation-stable)

**Categories Checked:**
- Hate
- Hate/Threatening
- Harassment
- Harassment/Threatening
- Self-harm
- Self-harm/Intent
- Self-harm/Instructions
- Sexual
- Sexual/Minors
- Violence
- Violence/Graphic

**Output:**
```json
{
  "flagged": false,
  "categories": {
    "hate": false,
    "harassment": false,
    "sexual": false,
    "violence": false,
    ...
  },
  "categoryScores": {
    "hate": 0.001,
    "harassment": 0.002,
    "sexual": 0.0001,
    "violence": 0.0005,
    ...
  },
  "model": "text-moderation-latest"
}
```

---

## UI/UX Design

### Main Parameter Structure

```typescript
properties: [
  // 1. Resource Type (Main Selector)
  {
    displayName: "Resource",
    name: "resource",
    type: "options",
    options: [
      { name: "Text (Chat)", value: "text", description: "Generate text with GPT models" },
      { name: "Audio - Text to Speech", value: "tts", description: "Convert text to speech" },
      { name: "Audio - Transcribe", value: "transcribe", description: "Convert speech to text" },
      { name: "Image - Generate", value: "imageGenerate", description: "Generate images with DALL-E" },
      { name: "Image - Edit", value: "imageEdit", description: "Edit or create image variations" },
      { name: "Vision", value: "vision", description: "Analyze images with GPT-4 Vision" },
      { name: "Embeddings", value: "embeddings", description: "Convert text to vectors" },
      { name: "Moderation", value: "moderation", description: "Check content for violations" }
    ],
    default: "text"
  },

  // 2. Model Selector (Dynamic based on resource)
  {
    displayName: "Model",
    name: "model",
    type: "autocomplete",
    triggerOnAutocomplete: true,
    default: "gpt-4o-mini",
    displayOptions: {
      show: {
        resource: ["text", "vision"]
      }
    }
  },

  // 3. Resource-specific parameters
  // ... (shown dynamically based on resource selection)
]
```

---

## Autocomplete Fields to Use

Based on your system's autocomplete capability:

1. **Model Selection** (all resources) - Autocomplete with search
2. **Voice Selection** (TTS) - Autocomplete with descriptions
3. **Language Selection** (Whisper) - Autocomplete with language codes
4. **Text Inputs** (prompts, messages) - Support {{json.field}} autocomplete
5. **File Paths** - Autocomplete from previous node outputs
6. **Format Options** - Autocomplete for audio/image formats

---

## Implementation Phases

### Phase 1: Core Resources (Priority)
1. ✅ Text (existing - enhance)
2. 🆕 Vision (high value)
3. 🆕 TTS (Text to Speech)
4. 🆕 Image Generation (DALL-E 3)

### Phase 2: Advanced Resources
5. 🆕 Whisper (STT)
6. 🆕 Embeddings
7. 🆕 Image Edit/Variation
8. 🆕 Moderation

### Phase 3: Enterprise Features (Future)
9. 🔮 Assistants API
10. 🔮 Fine-tuning
11. 🔮 Batch API
12. 🔮 Streaming

---

## File Structure

```
backend/src/nodes/OpenAI/
├── OpenAI.node.ts                    # Main node definition
├── index.ts                          # Export
├── resources/                        # Resource handlers
│   ├── TextResource.ts               # Chat completions
│   ├── TTSResource.ts                # Text-to-speech
│   ├── WhisperResource.ts            # Speech-to-text
│   ├── ImageGenerateResource.ts      # DALL-E image generation
│   ├── ImageEditResource.ts          # Image editing/variations
│   ├── VisionResource.ts             # Image analysis
│   ├── EmbeddingsResource.ts         # Text embeddings
│   └── ModerationResource.ts         # Content moderation
├── utils/                            # Utilities
│   ├── fileHandler.ts                # Audio/image file handling
│   ├── modelConfig.ts                # Model configurations
│   └── validators.ts                 # Input validators
└── types/                            # Types
    └── openai.types.ts               # OpenAI-specific types
```

---

## Cost Tracking Enhancement

Update cost tracking to support all resource types:

```typescript
interface CostBreakdown {
  resource: string;
  model: string;
  usage: {
    // Text
    promptTokens?: number;
    completionTokens?: number;
    // TTS
    characters?: number;
    // Images
    imageCount?: number;
    imageSize?: string;
    // Embeddings
    totalTokens?: number;
  };
  estimatedCost: number;
  costDetails: {
    inputCost?: number;
    outputCost?: number;
    perUnitCost?: number;
  };
}
```

---

## Testing Strategy

### Unit Tests
- Test each resource handler independently
- Mock OpenAI API responses
- Test parameter validation
- Test error handling

### Integration Tests
- Test with actual OpenAI API (optional, with test keys)
- Test file upload/download
- Test autocomplete functionality
- Test cost calculations

### E2E Tests
- Test complete workflows
- Test node connections
- Test data transformation
- Test error scenarios

---

## Documentation Updates

1. Update `AI_NODES_DOCUMENTATION.md` with new resources
2. Create separate guides for each resource type
3. Add workflow examples for common use cases
4. Add troubleshooting section for each resource
5. Add cost optimization tips per resource

---

## Benefits of This Design

### 1. **User-Friendly**
- Single node for all OpenAI capabilities
- Clear resource categories
- Context-aware parameters
- Helpful descriptions

### 2. **Powerful**
- Full OpenAI API coverage
- Support for advanced features
- Flexible data handling
- Cost tracking

### 3. **Maintainable**
- Modular resource handlers
- Clear separation of concerns
- Easy to add new resources
- Type-safe implementation

### 4. **Production-Ready**
- Error handling
- File management
- Rate limiting awareness
- Cost optimization

---

## Next Steps

1. **Review and approve this plan**
2. **Start with Phase 1 implementation**
3. **Test thoroughly with each resource**
4. **Update documentation**
5. **Deploy and gather feedback**
6. **Iterate with Phase 2**

---

## Questions for Discussion

1. Should we split into multiple nodes or keep one unified node?
   - **Recommendation**: Keep unified, use resource selector
   
2. How to handle file storage (uploads folder structure)?
   - **Recommendation**: Use existing uploads system with subdirectories

3. Should streaming be supported in Phase 1?
   - **Recommendation**: Add in Phase 3 (requires WebSocket support)

4. Rate limiting - handle at node level or service level?
   - **Recommendation**: Add configurable retry logic at node level

5. Cost limits - add warnings or hard limits?
   - **Recommendation**: Add warnings, optional hard limits in settings

---

**Ready to implement? Let's build the most powerful OpenAI node! 🚀**
