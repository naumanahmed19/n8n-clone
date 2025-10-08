# AI Nodes Architecture - Complete Diagram

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Credential System](#credential-system)
5. [Memory Management](#memory-management)
6. [Execution Flow](#execution-flow)
7. [Error Handling](#error-handling)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          N8N-CLONE PLATFORM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │   Frontend UI   │ ◄─────► │   Backend API   │                   │
│  │   (React/TS)    │  HTTP   │   (Node/TS)     │                   │
│  └─────────────────┘         └─────────────────┘                   │
│         │                             │                              │
│         │                             │                              │
│         ▼                             ▼                              │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │  Node Config    │         │  Node Registry  │                   │
│  │  Panel          │         │  & Execution    │                   │
│  └─────────────────┘         └─────────────────┘                   │
│         │                             │                              │
│         │                             ▼                              │
│         │                     ┌─────────────────┐                   │
│         │                     │   AI Services   │                   │
│         │                     │  ┌───────────┐  │                   │
│         │                     │  │  OpenAI   │  │                   │
│         │                     │  │ Anthropic │  │                   │
│         │                     │  └───────────┘  │                   │
│         │                     └─────────────────┘                   │
│         │                             │                              │
│         └─────────────────────────────┘                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Backend Components

```
backend/
│
├── src/
│   ├── nodes/                          ← Node Definitions
│   │   ├── OpenAI/
│   │   │   ├── OpenAI.node.ts         ← OpenAI Node Definition
│   │   │   └── index.ts
│   │   │
│   │   └── Anthropic/
│   │       ├── Anthropic.node.ts      ← Anthropic Node Definition
│   │       └── index.ts
│   │
│   ├── types/
│   │   ├── node.types.ts              ← NodeDefinition Interface
│   │   └── ai.types.ts                ← AI-specific Types
│   │       ├── AIMessage
│   │       ├── AIUsage
│   │       ├── ConversationMemory
│   │       ├── OPENAI_MODELS
│   │       └── ANTHROPIC_MODELS
│   │
│   ├── utils/
│   │   └── ai/
│   │       └── MemoryManager.ts       ← Conversation Memory
│   │
│   └── services/
│       ├── NodeService.ts             ← Node Registration & Execution
│       └── CredentialService.ts       ← Credential Management
│
└── package.json                       ← Dependencies (openai, @anthropic-ai/sdk)
```

### 2.2 Frontend Components

```
frontend/
│
├── src/
│   ├── components/
│   │   ├── workflow/
│   │   │   └── node-config/
│   │   │       └── tabs/
│   │   │           └── ConfigTab.tsx  ← Renders Node Configuration
│   │   │
│   │   └── credential/
│   │       └── CredentialSelector.tsx ← Credential Dropdown
│   │
│   ├── stores/
│   │   └── credential.ts              ← Credential State Management
│   │
│   └── types/
│       └── index.ts                   ← TypeScript Types
│
└── package.json
```

---

## 3. Data Flow Diagrams

### 3.1 Complete Request Flow

```
┌─────────────┐
│    USER     │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Clicks "Execute"
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐         ┌─────────────────┐            │
│  │  Workflow      │         │  Node Config    │            │
│  │  Canvas        │────────►│  Panel          │            │
│  └────────────────┘         └────────┬────────┘            │
│                                      │                       │
│                                      │ 2. Gather params     │
│                                      ▼                       │
│                              ┌─────────────────┐            │
│                              │ Credential      │            │
│                              │ Selector        │            │
│                              └────────┬────────┘            │
│                                       │                      │
└───────────────────────────────────────┼──────────────────────┘
                                        │
                                        │ 3. POST /api/workflows/:id/execute
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      4. Find Node     ┌──────────────┐   │
│  │ API Route    │───────Definition──────►│ NodeService  │   │
│  │ Handler      │                        └──────┬───────┘   │
│  └──────────────┘                               │            │
│                                                  │            │
│                                5. Execute Node   │            │
│                                                  ▼            │
│                                         ┌────────────────┐   │
│                                         │  OpenAI.node   │   │
│                                         │    or          │   │
│                                         │ Anthropic.node │   │
│                                         └────────┬───────┘   │
│                                                  │            │
│                              6. Get Credentials  │            │
│                                                  ▼            │
│                                         ┌────────────────┐   │
│                                         │  Credential    │   │
│                                         │  Service       │   │
│                                         └────────┬───────┘   │
│                                                  │            │
│                              7. Decrypt API Key  │            │
│                                                  ▼            │
│                                         ┌────────────────┐   │
│                                         │  Memory        │   │
│                                         │  Manager       │   │
│                                         └────────┬───────┘   │
│                                                  │            │
│                              8. Get Conversation │            │
│                                      History     │            │
│                                                  ▼            │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                                   │ 9. API Call
                                                   ▼
                                          ┌─────────────────┐
                                          │   OpenAI API    │
                                          │       or        │
                                          │ Anthropic API   │
                                          └────────┬────────┘
                                                   │
                                                   │ 10. Response
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐   11. Save to Memory   ┌─────────────┐ │
│  │ MemoryManager  │◄──────────────────────│  AI Node    │ │
│  └────────────────┘                        └──────┬──────┘ │
│                                                    │         │
│                        12. Format Response        │         │
│                                                    ▼         │
│                                           ┌────────────────┐│
│                                           │   Return JSON  ││
│                                           │   - response   ││
│                                           │   - usage      ││
│                                           │   - cost       ││
│                                           └────────┬───────┘│
└────────────────────────────────────────────────────┼────────┘
                                                     │
                                                     │ 13. HTTP Response
                                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐         ┌─────────────────┐            │
│  │ Update Canvas  │◄────────│  Display Result │            │
│  │ with Output    │         │  in Panel       │            │
│  └────────────────┘         └─────────────────┘            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Node Execution Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│           OpenAI/Anthropic Node Execution Flow                  │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─► 1. Get Node Parameters
  │     ├── model (e.g., "gpt-4o-mini")
  │     ├── systemPrompt
  │     ├── userMessage
  │     ├── temperature
  │     ├── maxTokens
  │     ├── enableMemory
  │     └── sessionId
  │
  ├─► 2. Get Credentials
  │     │
  │     ├─► this.getCredentials('apiKey')
  │     │
  │     ├─► CredentialService.getCredential()
  │     │     │
  │     │     ├─► Query Database
  │     │     │     SELECT * FROM credentials WHERE type='apiKey'
  │     │     │
  │     │     └─► Decrypt Data
  │     │           AES-256-CBC decryption
  │     │
  │     └─► Return { apiKey: "sk-..." }
  │
  ├─► 3. Resolve Dynamic Parameters
  │     │
  │     ├─► Extract input data from previous node
  │     │     this.extractJsonData(inputData.main)
  │     │
  │     └─► Replace {{json.field}} with actual values
  │           "Summarize: {{json.text}}" → "Summarize: [actual text]"
  │
  ├─► 4. Memory Management (if enabled)
  │     │
  │     ├─► Get Memory Manager Instance
  │     │     MemoryManager.getInstance()
  │     │
  │     ├─► Retrieve Conversation History
  │     │     memory.getMemory(sessionId)
  │     │
  │     └─► Build Messages Array
  │           [
  │             { role: 'system', content: 'You are...' },
  │             { role: 'user', content: 'Previous message' },
  │             { role: 'assistant', content: 'Previous response' },
  │             { role: 'user', content: 'Current message' }  ← NEW
  │           ]
  │
  ├─► 5. Initialize AI Client
  │     │
  │     ├─► OpenAI:
  │     │     new OpenAI({ apiKey: credentials.apiKey })
  │     │
  │     └─► Anthropic:
  │           new Anthropic({ apiKey: credentials.apiKey })
  │
  ├─► 6. Make API Call
  │     │
  │     ├─► OpenAI:
  │     │     openai.chat.completions.create({
  │     │       model: 'gpt-4o-mini',
  │     │       messages: [...],
  │     │       temperature: 0.7,
  │     │       max_tokens: 1000
  │     │     })
  │     │
  │     └─► Anthropic:
  │           anthropic.messages.create({
  │             model: 'claude-3-5-sonnet-20241022',
  │             system: 'You are...',
  │             messages: [...],
  │             temperature: 0.7,
  │             max_tokens: 1024
  │           })
  │
  ├─► 7. Process Response
  │     │
  │     ├─► Extract Content
  │     │     response.choices[0].message.content (OpenAI)
  │     │     response.content[0].text (Anthropic)
  │     │
  │     ├─► Calculate Cost
  │     │     const cost = 
  │     │       (promptTokens / 1000) * modelInfo.costPer1kInput +
  │     │       (completionTokens / 1000) * modelInfo.costPer1kOutput
  │     │
  │     └─► Log Metrics
  │           logger.info({ model, tokens, cost, finishReason })
  │
  ├─► 8. Save to Memory (if enabled)
  │     │
  │     ├─► Add User Message
  │     │     memoryManager.addMessage(sessionId, {
  │     │       role: 'user',
  │     │       content: userMessage,
  │     │       timestamp: Date.now()
  │     │     })
  │     │
  │     └─► Add Assistant Response
  │           memoryManager.addMessage(sessionId, {
  │             role: 'assistant',
  │             content: response,
  │             timestamp: Date.now()
  │           })
  │
  └─► 9. Return Output
        │
        └─► Format as NodeOutputData
              {
                main: [{
                  json: {
                    response: "AI response here...",
                    model: "gpt-4o-mini",
                    usage: {
                      promptTokens: 100,
                      completionTokens: 50,
                      totalTokens: 150,
                      estimatedCost: 0.000225
                    },
                    finishReason: "stop",
                    sessionId: "user-123",
                    conversationLength: 4
                  }
                }]
              }

END
```

---

## 4. Credential System

### 4.1 Credential Storage Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    Credential Lifecycle                         │
└────────────────────────────────────────────────────────────────┘

1. USER CREATES CREDENTIAL
   │
   ├─► Frontend: CredentialModal
   │     │
   │     ├── User enters:
   │     │   - Name: "My OpenAI Key"
   │     │   - Type: "apiKey"
   │     │   - Data: { apiKey: "sk-..." }
   │     │
   │     └── POST /api/credentials
   │
   ├─► Backend: CredentialService.createCredential()
   │     │
   │     ├── Validate Input
   │     │     - Check credential type exists
   │     │     - Validate required fields
   │     │
   │     ├── Encrypt Data (AES-256-CBC)
   │     │     const cipher = crypto.createCipheriv(
   │     │       'aes-256-cbc',
   │     │       encryptionKey,
   │     │       iv
   │     │     )
   │     │     encrypted = cipher.update(JSON.stringify(data)) + cipher.final()
   │     │
   │     ├── Save to Database
   │     │     INSERT INTO credentials (
   │     │       name, type, userId, data, createdAt
   │     │     ) VALUES (
   │     │       'My OpenAI Key',
   │     │       'apiKey',
   │     │       'user-123',
   │     │       '7a3f2e1c...',  ← Encrypted
   │     │       '2025-10-08T20:24:54.642Z'
   │     │     )
   │     │
   │     └── Return Credential (without decrypted data)
   │           { id, name, type, userId, createdAt, updatedAt }
   │
   └─► Frontend: Update Store
         credentialStore.credentials.push(credential)


2. NODE EXECUTION REQUESTS CREDENTIAL
   │
   ├─► Node: this.getCredentials('apiKey')
   │     │
   │     └── NodeExecutionContext.getCredentials()
   │
   ├─► Backend: CredentialService.getCredential()
   │     │
   │     ├── Query Database
   │     │     SELECT * FROM credentials
   │     │     WHERE type='apiKey' AND userId='user-123'
   │     │
   │     ├── Decrypt Data (AES-256-CBC)
   │     │     const decipher = crypto.createDecipheriv(
   │     │       'aes-256-cbc',
   │     │       encryptionKey,
   │     │       iv
   │     │     )
   │     │     decrypted = decipher.update(encrypted) + decipher.final()
   │     │     data = JSON.parse(decrypted.toString())
   │     │
   │     └── Return Decrypted Data
   │           { apiKey: "sk-proj-..." }
   │
   └─► Node: Use API Key
         const openai = new OpenAI({ apiKey: credentials.apiKey })


3. CREDENTIAL SELECTOR IN UI
   │
   ├─► User opens node config
   │
   ├─► Frontend: CredentialSelector component
   │     │
   │     ├── Fetch All Credentials
   │     │     GET /api/credentials
   │     │
   │     ├── Filter by Type
   │     │     const availableCredentials = 
   │     │       credentials.filter(c => c.type === 'apiKey')
   │     │
   │     └── Render Dropdown
   │           <select>
   │             <option value="cred-1">My OpenAI Key</option>
   │             <option value="cred-2">Backup API Key</option>
   │           </select>
   │
   └─► User selects credential
         onChange(credentialId)
```

### 4.2 Credential-Node Mapping

```
┌──────────────────────────────────────────────────────────────────┐
│            How Nodes Find Their Credentials                      │
└──────────────────────────────────────────────────────────────────┘

NODE DEFINITION (OpenAI.node.ts):
┌────────────────────────────────────────────────────────┐
│ credentials: [                                         │
│   {                                                    │
│     name: 'apiKey',           ← Credential Type       │
│     displayName: 'API Key',                           │
│     properties: []                                    │
│   }                                                    │
│ ]                                                      │
└────────────────────────────────────────────────────────┘
              │
              │ Registered in Database
              ▼
┌────────────────────────────────────────────────────────┐
│ NodeType Table:                                        │
│ {                                                      │
│   type: 'openai',                                     │
│   credentials: [                                       │
│     { name: 'apiKey', displayName: 'API Key' }       │
│   ]                                                    │
│ }                                                      │
└────────────────────────────────────────────────────────┘
              │
              │ Frontend fetches node schema
              ▼
┌────────────────────────────────────────────────────────┐
│ ConfigTab.tsx renders:                                 │
│                                                        │
│ <CredentialSelector                                   │
│   credentialType="apiKey"    ← From node definition   │
│   value={credentials.apiKey}                          │
│   onChange={updateCredentials}                        │
│ />                                                     │
└────────────────────────────────────────────────────────┘
              │
              │ Filters credentials
              ▼
┌────────────────────────────────────────────────────────┐
│ getCredentialsByType('apiKey'):                       │
│                                                        │
│ credentials.filter(c => c.type === 'apiKey')         │
│                                                        │
│ Returns:                                               │
│ [                                                      │
│   { id: '1', name: 'My OpenAI Key', type: 'apiKey' },│
│   { id: '2', name: 'Backup Key', type: 'apiKey' }    │
│ ]                                                      │
└────────────────────────────────────────────────────────┘
              │
              │ User selects credential
              ▼
┌────────────────────────────────────────────────────────┐
│ Workflow JSON stores:                                  │
│                                                        │
│ nodes: [{                                              │
│   id: 'node-1',                                       │
│   type: 'openai',                                     │
│   credentials: {                                       │
│     apiKey: 'cred-id-123'    ← Credential ID         │
│   }                                                    │
│ }]                                                     │
└────────────────────────────────────────────────────────┘
              │
              │ During execution
              ▼
┌────────────────────────────────────────────────────────┐
│ Node: this.getCredentials('apiKey')                   │
│   ↓                                                    │
│ Execution Context:                                     │
│   - Looks up workflow.nodes[x].credentials.apiKey     │
│   - Gets credential ID: 'cred-id-123'                 │
│   - Fetches from CredentialService                    │
│   - Decrypts and returns data                         │
│                                                        │
│ Returns: { apiKey: "sk-proj-..." }                    │
└────────────────────────────────────────────────────────┘
```

---

## 5. Memory Management

### 5.1 Memory Manager Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      MemoryManager (Singleton)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Private Properties:                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ conversations: Map<sessionId, ConversationMemory>        │   │
│  │                                                            │   │
│  │ Example:                                                   │   │
│  │ {                                                          │   │
│  │   "user-123-chat": {                                      │   │
│  │     sessionId: "user-123-chat",                           │   │
│  │     messages: [                                            │   │
│  │       { role: 'system', content: '...', timestamp: ... }, │   │
│  │       { role: 'user', content: '...', timestamp: ... },   │   │
│  │       { role: 'assistant', content: '...', timestamp: ...}│   │
│  │     ],                                                     │   │
│  │     createdAt: 1696780800000,                             │   │
│  │     updatedAt: 1696784400000                              │   │
│  │   },                                                       │   │
│  │   "workflow-456": { ... }                                 │   │
│  │ }                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Configuration:                                                    │
│  ├─ MAX_MESSAGES: 50       ← Prune if exceeded                   │
│  └─ MAX_AGE_MS: 24 hours   ← Cleanup old conversations           │
│                                                                    │
│  Public Methods:                                                   │
│  ├─ getInstance()          → Returns singleton instance           │
│  ├─ getMemory(sessionId)   → Get/create conversation             │
│  ├─ addMessage(...)        → Add message to conversation          │
│  ├─ getMessages(sessionId) → Get all messages                     │
│  ├─ clearMemory(sessionId) → Delete conversation                  │
│  ├─ getActiveSessions()    → List all session IDs                 │
│  └─ getStats()             → Get memory statistics                │
│                                                                    │
│  Background Tasks:                                                 │
│  └─ cleanupOldConversations() → Runs every hour                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Conversation Flow with Memory

```
CONVERSATION EXAMPLE: Customer Support Chat
═════════════════════════════════════════════

Session ID: "user-123-support"
Enable Memory: TRUE

┌─────────────────────────────────────────────────────────────────┐
│                          MESSAGE 1                               │
└─────────────────────────────────────────────────────────────────┘

User Input: "I want to return an item"

Memory State BEFORE:
  messages: []  ← Empty

API Call to Claude:
  messages: [
    { role: "system", content: "You are a support agent..." },
    { role: "user", content: "I want to return an item" }
  ]

AI Response: "I'd be happy to help. What's your order number?"

Memory State AFTER:
  messages: [
    { role: "system", content: "You are a support agent...", timestamp: 1001 },
    { role: "user", content: "I want to return an item", timestamp: 1002 },
    { role: "assistant", content: "I'd be happy to help...", timestamp: 1003 }
  ]


┌─────────────────────────────────────────────────────────────────┐
│                          MESSAGE 2                               │
└─────────────────────────────────────────────────────────────────┘

User Input: "Order #12345"

Memory State BEFORE:
  messages: [
    { role: "system", content: "You are a support agent..." },
    { role: "user", content: "I want to return an item" },
    { role: "assistant", content: "I'd be happy to help..." }
  ]

API Call to Claude:
  messages: [
    { role: "system", content: "You are a support agent..." },
    { role: "user", content: "I want to return an item" },      ← From memory
    { role: "assistant", content: "I'd be happy to help..." },  ← From memory
    { role: "user", content: "Order #12345" }                   ← New message
  ]

AI Response: "Thanks! I found order #12345. What item would you like to return?"

Memory State AFTER:
  messages: [
    { role: "system", content: "You are a support agent..." },
    { role: "user", content: "I want to return an item" },
    { role: "assistant", content: "I'd be happy to help..." },
    { role: "user", content: "Order #12345" },                  ← Added
    { role: "assistant", content: "Thanks! I found..." }        ← Added
  ]

┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY PRUNING LOGIC                          │
└─────────────────────────────────────────────────────────────────┘

IF messages.length > MAX_MESSAGES (50):
  
  1. Preserve System Message (if first)
     systemMessage = messages[0].role === 'system' ? messages[0] : null
  
  2. Keep Recent Messages
     recentMessages = messages.slice(-50)
  
  3. Rebuild Array
     IF systemMessage exists AND not in recentMessages:
       messages = [systemMessage, ...recentMessages]
     ELSE:
       messages = recentMessages

Result: Always ≤ 50 messages, system prompt preserved


┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC CLEANUP                             │
└─────────────────────────────────────────────────────────────────┘

Every 60 minutes:
  FOR EACH conversation IN conversations:
    IF (now - conversation.updatedAt) > 24 hours:
      DELETE conversation
  
  Log: "Cleaned up X old conversations"
```

### 5.3 Memory vs No Memory Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITH MEMORY ENABLED                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Execution 1:                                                     │
│  ─────────────                                                    │
│  Input: "What's 2+2?"                                            │
│  Memory: []                                                       │
│  API: [system, "What's 2+2?"]                                    │
│  Response: "2+2 equals 4"                                        │
│  Memory After: [system, user:"What's 2+2?", ai:"...equals 4"]   │
│                                                                   │
│  Execution 2: (Same session)                                     │
│  ─────────────                                                    │
│  Input: "What about 3+3?"                                        │
│  Memory: [system, user:"What's 2+2?", ai:"...equals 4"]         │
│  API: [system, "What's 2+2?", "...equals 4", "What about 3+3?"] │
│  Response: "3+3 equals 6"                                        │
│  Memory After: [... previous ..., user:"What about 3+3?", ...]  │
│                                                                   │
│  Execution 3: (Same session)                                     │
│  ─────────────                                                    │
│  Input: "Add those two numbers"  ← Context-dependent!           │
│  Memory: [... all previous messages ...]                         │
│  API: [... entire conversation history ...]                      │
│  Response: "4 + 6 = 10" ← AI remembers both numbers!           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WITHOUT MEMORY (Default)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Execution 1:                                                     │
│  ─────────────                                                    │
│  Input: "What's 2+2?"                                            │
│  API: [system, "What's 2+2?"]                                    │
│  Response: "2+2 equals 4"                                        │
│  Memory: NONE ← Discarded immediately                           │
│                                                                   │
│  Execution 2: (Independent)                                      │
│  ─────────────                                                    │
│  Input: "What about 3+3?"                                        │
│  API: [system, "What about 3+3?"]  ← No previous context       │
│  Response: "3+3 equals 6"                                        │
│  Memory: NONE                                                     │
│                                                                   │
│  Execution 3: (Independent)                                      │
│  ─────────────                                                    │
│  Input: "Add those two numbers"                                  │
│  API: [system, "Add those two numbers"]                         │
│  Response: "I don't know which numbers you mean" ← No context! │
│  Memory: NONE                                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. Execution Flow

### 6.1 Workflow Execution Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    Workflow Execution Pipeline                    │
└──────────────────────────────────────────────────────────────────┘

USER TRIGGERS WORKFLOW
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. WORKFLOW SERVICE                                              │
├─────────────────────────────────────────────────────────────────┤
│  ├─► Load workflow from database                                │
│  ├─► Validate structure                                         │
│  ├─► Build execution graph                                      │
│  └─► Determine execution order                                  │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. NODE EXECUTION LOOP                                           │
├─────────────────────────────────────────────────────────────────┤
│  FOR EACH node IN executionOrder:                               │
│    │                                                             │
│    ├─► Get node definition from NodeService                     │
│    ├─► Prepare input data from previous nodes                   │
│    ├─► Create execution context                                 │
│    └─► Execute node                                             │
└─────────────────────────────────────────────────────────────────┘
  │
  │ Example: OpenAI Node
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. AI NODE EXECUTION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ A. SETUP PHASE                                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Get parameters (model, temperature, etc.)             │   │
│  │ • Fetch credentials                                     │   │
│  │ • Initialize AI client                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ B. DATA PREPARATION                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Extract input from previous node                      │   │
│  │ • Resolve dynamic values {{json.field}}                 │   │
│  │ • Build message history (if memory enabled)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ C. API CALL                                              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Send request to OpenAI/Anthropic                      │   │
│  │ • Wait for response (streaming not yet implemented)     │   │
│  │ • Handle errors (rate limits, timeouts, etc.)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ D. RESPONSE PROCESSING                                   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Extract response text                                 │   │
│  │ • Calculate token usage & cost                          │   │
│  │ • Save to memory (if enabled)                           │   │
│  │ • Log metrics                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ E. OUTPUT FORMATTING                                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Return: {                                                │   │
│  │   main: [{                                               │   │
│  │     json: {                                              │   │
│  │       response: "...",                                   │   │
│  │       model: "gpt-4o-mini",                             │   │
│  │       usage: { ... },                                    │   │
│  │       estimatedCost: 0.000225                           │   │
│  │     }                                                     │   │
│  │   }]                                                      │   │
│  │ }                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CONTINUE WITH NEXT NODE                                       │
├─────────────────────────────────────────────────────────────────┤
│  ├─► Pass output as input to next node                          │
│  ├─► Next node can access: {{$json.response}}                   │
│  └─► Repeat until workflow completes                            │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. WORKFLOW COMPLETION                                           │
├─────────────────────────────────────────────────────────────────┤
│  ├─► Save execution result to database                          │
│  ├─► Update execution status (success/error)                    │
│  ├─► Send result to frontend                                    │
│  └─► Trigger webhooks (if configured)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Node Execution Context

```
┌──────────────────────────────────────────────────────────────────┐
│               NodeExecutionContext Interface                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Available to EVERY node during execution via "this"             │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Methods:                                                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │ this.getNodeParameter(name, itemIndex?)                   │ │
│  │   → Get node configuration value                          │ │
│  │   Example: this.getNodeParameter('model')                 │ │
│  │   Returns: "gpt-4o-mini"                                   │ │
│  │                                                             │ │
│  │ this.getCredentials(type)                                  │ │
│  │   → Get decrypted credentials                             │ │
│  │   Example: this.getCredentials('apiKey')                  │ │
│  │   Returns: { apiKey: "sk-..." }                           │ │
│  │                                                             │ │
│  │ this.getInputData(inputName?)                             │ │
│  │   → Get data from previous nodes                          │ │
│  │   Returns: NodeInputData                                   │ │
│  │                                                             │ │
│  │ this.resolveValue(value, item)                            │ │
│  │   → Resolve {{json.field}} expressions                    │ │
│  │   Example: "Hello {{json.name}}"                          │ │
│  │   Returns: "Hello John"                                    │ │
│  │                                                             │ │
│  │ this.resolvePath(obj, path)                               │ │
│  │   → Get nested property                                    │ │
│  │   Example: resolvePath(data, 'user.name')                │ │
│  │   Returns: "John"                                          │ │
│  │                                                             │ │
│  │ this.extractJsonData(items)                               │ │
│  │   → Extract JSON from items                               │ │
│  │                                                             │ │
│  │ this.wrapJsonData(items)                                  │ │
│  │   → Wrap data in standard format                          │ │
│  │                                                             │ │
│  │ this.normalizeInputItems(items)                           │ │
│  │   → Normalize input format                                │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Helpers:                                                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │ this.helpers.request(options)                             │ │
│  │   → Make HTTP request                                      │ │
│  │                                                             │ │
│  │ this.helpers.requestWithAuthentication(type, options)     │ │
│  │   → HTTP request with auto-authentication                 │ │
│  │                                                             │ │
│  │ this.helpers.returnJsonArray(data)                        │ │
│  │   → Format output as JSON array                           │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Logger:                                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │ this.logger.debug('message', metadata)                    │ │
│  │ this.logger.info('message', metadata)                     │ │
│  │ this.logger.warn('message', metadata)                     │ │
│  │ this.logger.error('message', metadata)                    │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 7. Error Handling

### 7.1 Error Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Error Handling Flow                        │
└──────────────────────────────────────────────────────────────────┘

TRY {
  Execute AI Node
}
CATCH (error) {
  │
  ├─► Check Error Type
  │
  ├─► 401 Unauthorized
  │     └─► throw new Error('Invalid API key. Please check credentials.')
  │
  ├─► 429 Rate Limit
  │     └─► throw new Error('Rate limit exceeded. Please try again later.')
  │
  ├─► 500 Server Error
  │     └─► throw new Error('AI service error. Please try again later.')
  │
  ├─► 400 Bad Request
  │     └─► throw new Error('Invalid request: ' + error.message)
  │
  └─► Other Errors
        └─► throw new Error('AI error: ' + error.message)
}

Error propagates up:
  Node → NodeService → WorkflowService → API Response → Frontend

Frontend displays error in:
  • Execution panel
  • Toast notification
  • Node status indicator
```

### 7.2 Common Error Scenarios

```
┌──────────────────────────────────────────────────────────────────┐
│                    Common Error Scenarios                         │
└──────────────────────────────────────────────────────────────────┘

1. INVALID API KEY
   ────────────────
   Symptom: 401 error
   Cause: Wrong/expired API key
   Solution: 
     • Re-enter API key in credentials
     • Check API key is active on provider's dashboard
     • Ensure correct API key format (OpenAI: sk-..., Anthropic: sk-ant-...)

2. RATE LIMIT EXCEEDED
   ────────────────────
   Symptom: 429 error
   Cause: Too many requests
   Solution:
     • Wait and retry (backoff strategy)
     • Upgrade API plan
     • Reduce workflow execution frequency

3. CONTEXT LENGTH EXCEEDED
   ────────────────────────
   Symptom: Error about token limit
   Cause: Input + conversation history + output > model limit
   Solution:
     • Reduce input size
     • Lower maxTokens parameter
     • Clear conversation memory
     • Use model with larger context window

4. EMPTY USER MESSAGE
   ────────────────────
   Symptom: "User message cannot be empty"
   Cause: Empty or undefined message parameter
   Solution:
     • Check {{json.field}} references exist in input data
     • Provide default value
     • Add IF node to check for empty values

5. CREDENTIAL NOT FOUND
   ─────────────────────
   Symptom: "Credential not found" or dropdown empty
   Cause: Credential type mismatch
   Solution:
     • Ensure credential type matches node expectation
     • Create new credential of correct type
     • Check credential is not deleted

6. MEMORY OVERFLOW
   ───────────────
   Symptom: Slow responses, high memory usage
   Cause: Too many active conversations
   Solution:
     • Memory auto-cleans after 24 hours
     • Manually clear old conversations
     • Use unique session IDs
     • Disable memory for one-off requests

7. NETWORK TIMEOUT
   ────────────────
   Symptom: Request timeout
   Cause: Slow network or API response
   Solution:
     • Retry the request
     • Check internet connection
     • Increase timeout (if configurable)
     • Check API status page
```

---

## 8. Complete Example: End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│         COMPLETE EXAMPLE: Email Summarization Workflow           │
└──────────────────────────────────────────────────────────────────┘

WORKFLOW STRUCTURE:
───────────────────

Webhook Trigger → OpenAI Node → Send Email Node
     (1)              (2)            (3)


STEP-BY-STEP EXECUTION:
───────────────────────

1. WEBHOOK RECEIVES EMAIL
   ────────────────────────
   POST /webhook/abc123
   Body: {
     "from": "customer@example.com",
     "subject": "Product Inquiry",
     "body": "I'm interested in your premium subscription..."
   }
   
   Output:
   ├─► main: [{
   │     json: {
   │       from: "customer@example.com",
   │       subject: "Product Inquiry",
   │       body: "I'm interested in..."
   │     }
   │   }]

2. OPENAI NODE PROCESSES
   ──────────────────────
   
   Configuration:
   ├─► Credential: "My OpenAI Key" (type: apiKey)
   ├─► Model: gpt-4o-mini
   ├─► System Prompt: "You are an email summarizer. Be concise."
   ├─► User Message: "Summarize this email:\n\nSubject: {{json.subject}}\n\nBody: {{json.body}}"
   ├─► Temperature: 0.3
   ├─► Max Tokens: 150
   └─► Enable Memory: false
   
   Execution:
   
   A. Get Credentials
      ├─► this.getCredentials('apiKey')
      └─► Returns: { apiKey: "sk-proj-..." }
   
   B. Resolve Dynamic Values
      ├─► Input: {{json.subject}} → "Product Inquiry"
      ├─► Input: {{json.body}} → "I'm interested in..."
      └─► Final: "Summarize this email:\n\nSubject: Product Inquiry\n\nBody: I'm interested in..."
   
   C. Call OpenAI API
      ├─► POST https://api.openai.com/v1/chat/completions
      ├─► Headers: { Authorization: "Bearer sk-proj-..." }
      └─► Body: {
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an email summarizer..." },
              { role: "user", content: "Summarize this email:\n\n..." }
            ],
            temperature: 0.3,
            max_tokens: 150
          }
   
   D. Process Response
      ├─► Response: "Customer inquiry about premium subscription. Interested in features and pricing."
      ├─► Usage: { prompt_tokens: 45, completion_tokens: 15, total_tokens: 60 }
      ├─► Cost: (45 * 0.00015 + 15 * 0.0006) / 1000 = $0.0000158
      └─► Log: "OpenAI request completed: 60 tokens, $0.0000158"
   
   Output:
   └─► main: [{
         json: {
           response: "Customer inquiry about premium subscription...",
           model: "gpt-4o-mini",
           usage: {
             promptTokens: 45,
             completionTokens: 15,
             totalTokens: 60,
             estimatedCost: 0.0000158
           },
           finishReason: "stop"
         }
       }]

3. SEND EMAIL NODE
   ────────────────
   
   Configuration:
   ├─► To: "support@company.com"
   ├─► Subject: "Email Summary: {{$node.Webhook.json.subject}}"
   └─► Body: "Summary: {{$node.OpenAI.json.response}}\n\nOriginal from: {{$node.Webhook.json.from}}"
   
   Execution:
   ├─► Resolve: {{$node.OpenAI.json.response}} → "Customer inquiry about..."
   ├─► Resolve: {{$node.Webhook.json.from}} → "customer@example.com"
   └─► Send email via SMTP
   
   Output:
   └─► main: [{
         json: {
           status: "sent",
           messageId: "abc123"
         }
       }]

WORKFLOW COMPLETE ✅
────────────────────
Total Execution Time: 2.3s
Cost: $0.0000158
```

---

## 9. Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                      Database Tables                              │
└──────────────────────────────────────────────────────────────────┘

credentials
───────────
id              String    @id @default(cuid())
name            String    (e.g., "My OpenAI Key")
type            String    (e.g., "apiKey", "googleSheetsOAuth2")
userId          String    (Owner)
data            String    (Encrypted JSON)
expiresAt       DateTime? (Optional expiration)
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt

Example:
{
  id: "cmgiftm5u000110mrw4lnjbfa",
  name: "Open Ai",
  type: "apiKey",
  userId: "cmgcnb3ra0000scgg28pfgow8",
  data: "7a3f2e1c..." ← Encrypted: { apiKey: "sk-proj-..." }
  expiresAt: null,
  createdAt: "2025-10-08T20:24:54.642Z",
  updatedAt: "2025-10-08T20:24:54.642Z"
}


nodeTypes
─────────
id              String   @id @default(cuid())
type            String   @unique (e.g., "openai", "anthropic")
schema          Json     (Full node definition)
active          Boolean  @default(true)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt

Example:
{
  id: "node-type-123",
  type: "openai",
  schema: {
    type: "openai",
    displayName: "OpenAI",
    credentials: [{ name: "apiKey", displayName: "API Key" }],
    properties: [...]
  },
  active: true,
  createdAt: "2025-10-08T20:00:00.000Z",
  updatedAt: "2025-10-08T20:41:09.000Z"
}


workflows
─────────
id              String   @id @default(cuid())
name            String
definition      Json     (Nodes, connections)
userId          String
active          Boolean  @default(true)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt

Example workflow.definition:
{
  nodes: [
    {
      id: "node-1",
      type: "openai",
      position: { x: 100, y: 100 },
      parameters: {
        model: "gpt-4o-mini",
        systemPrompt: "You are...",
        userMessage: "{{json.text}}",
        temperature: 0.7,
        maxTokens: 1000,
        enableMemory: false
      },
      credentials: {
        apiKey: "cmgiftm5u000110mrw4lnjbfa" ← Credential ID
      }
    }
  ],
  connections: [...]
}


executions
──────────
id              String   @id @default(cuid())
workflowId      String
status          String   (running, success, error)
startedAt       DateTime
finishedAt      DateTime?
data            Json     (Execution results)
userId          String
createdAt       DateTime @default(now())

Example execution.data:
{
  nodes: {
    "node-1": {
      output: {
        main: [{
          json: {
            response: "AI response...",
            usage: { totalTokens: 150, estimatedCost: 0.000225 }
          }
        }]
      },
      executionTime: 1234,
      status: "success"
    }
  }
}
```

---

## 10. Key Takeaways

```
┌──────────────────────────────────────────────────────────────────┐
│                        System Highlights                          │
└──────────────────────────────────────────────────────────────────┘

✅ MODULAR ARCHITECTURE
   • Nodes are self-contained with their own execute() function
   • Easy to add new AI providers (just create new node file)
   • Shared utilities (MemoryManager, types) keep code DRY

✅ SECURE CREDENTIAL MANAGEMENT
   • API keys encrypted at rest (AES-256-CBC)
   • Credentials fetched only during execution
   • Never stored in workflow definition (only IDs)
   • Frontend never sees actual API keys

✅ CONVERSATION MEMORY
   • Singleton pattern ensures shared state
   • Automatic pruning prevents memory overflow
   • Auto-cleanup removes old conversations
   • Session IDs enable multi-user support

✅ DYNAMIC PARAMETER RESOLUTION
   • {{json.field}} syntax for accessing previous node data
   • Resolved at execution time
   • Supports nested paths: {{json.user.email}}

✅ COST TRACKING
   • Token usage calculated for every request
   • Estimated cost based on current pricing
   • Logged for monitoring and billing

✅ ERROR HANDLING
   • Clear error messages for common issues
   • Proper HTTP status code handling
   • Errors propagate cleanly through the system

✅ EXTENSIBLE DESIGN
   • Easy to add new models (just update OPENAI_MODELS/ANTHROPIC_MODELS)
   • Future features: streaming, function calling, vector memory
   • Plugin architecture supports custom nodes
```

---

## 11. Future Enhancements

```
PLANNED FEATURES:
─────────────────

🔄 Streaming Responses
   • Real-time token-by-token responses
   • WebSocket connection to frontend
   • Progress indicators

🛠️ Function/Tool Calling
   • AI can call other workflow nodes
   • Dynamic workflow execution
   • Multi-agent systems

💾 Persistent Memory
   • Redis/Database storage
   • Vector embeddings for semantic search
   • Long-term memory across sessions

📊 Advanced Analytics
   • Token usage dashboards
   • Cost projections
   • Model performance comparisons

🔐 Enhanced Security
   • API key rotation
   • Usage quotas per credential
   • Audit logs

🎨 UI Improvements
   • Live chat interface
   • Message history viewer
   • Token usage visualizer

🚀 Performance
   • Request batching
   • Response caching
   • Parallel execution
```

---

**End of Architecture Documentation** 🎉
