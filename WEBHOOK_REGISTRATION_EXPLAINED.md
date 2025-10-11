# Webhook Registration: How It Works

## Question
"Where are we registering webhooks with ID? I don't see any table or column for that in the database."

## Answer: In-Memory Registration (Not in Database)

Webhooks are **NOT stored in a separate database table**. Instead, they are:
1. **Stored as JSON in the Workflow table** (in the `triggers` column)
2. **Registered in-memory** when the server starts or workflow is saved

---

## Database Storage

### Workflow Table
```prisma
model Workflow {
  id               String             @id @default(cuid())
  name             String
  description      String?
  category         String?
  tags             String[]           @default([])
  userId           String
  nodes            Json               @default("[]")      // Node definitions
  connections      Json               @default("[]")      // Node connections
  triggers         Json               @default("[]")      // ⭐ TRIGGERS STORED HERE as JSON
  settings         Json               @default("{}")
  active           Boolean            @default(false)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  // ... relations
}
```

### Triggers JSON Format
The `triggers` column stores an array of trigger definitions:

```json
[
  {
    "id": "trigger-abc-123",
    "type": "webhook",
    "nodeId": "webhook-node-xyz",
    "active": true,
    "settings": {
      "webhookId": "550e8400-e29b-41d4-a716-446655440000",  // ⭐ The webhook UUID
      "webhookUrl": "550e8400-e29b-41d4-a716-446655440000",
      "httpMethod": "POST",
      "path": "/",
      "authentication": {
        "type": "none"
      }
    },
    "createdAt": "2025-10-10T12:00:00Z",
    "updatedAt": "2025-10-10T12:00:00Z"
  }
]
```

---

## In-Memory Registration

### TriggerService Architecture

```typescript
export class TriggerService {
  // In-memory Map storing webhook ID -> Trigger mapping
  private webhookTriggers: Map<string, TriggerDefinition> = new Map();
  
  // In-memory Map storing scheduled cron jobs
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
}
```

### Registration Flow

#### 1. Server Startup
```
Server Start
    ↓
TriggerService.initialize()
    ↓
loadActiveTriggers()
    ↓
Query: SELECT * FROM workflows WHERE active = true
    ↓
For each workflow:
    Parse triggers JSON
    ↓
    For each trigger where active = true:
        activateTrigger()
        ↓
        If type === "webhook":
            activateWebhookTrigger()
            ↓
            webhookTriggers.set(webhookId, trigger) // ⭐ IN-MEMORY REGISTRATION
```

#### 2. Workflow Save/Update
```
User saves workflow
    ↓
WorkflowService.updateWorkflow()
    ↓
Save workflow to database (includes triggers JSON)
    ↓
TriggerService.syncWorkflowTriggers(workflowId)
    ↓
Parse workflow.triggers JSON
    ↓
For each trigger:
    activateTrigger()
    ↓
    webhookTriggers.set(webhookId, trigger) // ⭐ IN-MEMORY REGISTRATION
```

---

## Code Walkthrough

### 1. Frontend: Generate Webhook ID
**File:** `frontend/src/components/workflow/node-config/custom-fields/WebhookUrlGenerator.tsx`

```typescript
// User opens webhook node config
const webhookId = uuidv4(); // Generate UUID: "550e8400-e29b-41d4-a716-446655440000"

// Display URL to user
const testUrl = `${VITE_WEBHOOK_TEST_URL}/webhook/${webhookId}`;
const prodUrl = `${VITE_WEBHOOK_PROD_URL}/webhook/${webhookId}`;

// When user saves workflow, this webhookId is stored in trigger settings
```

### 2. Backend: Store in Workflow Triggers JSON
**File:** `backend/src/services/WorkflowService.ts`

```typescript
async updateWorkflow(id: string, data: any) {
  // Save workflow to database
  const updatedWorkflow = await this.prisma.workflow.update({
    where: { id },
    data: {
      name: data.name,
      nodes: data.nodes,
      connections: data.connections,
      triggers: data.triggers, // ⭐ Triggers stored as JSON in database
      // ...
    },
  });

  // Sync triggers (register webhooks in-memory)
  await getTriggerService().syncWorkflowTriggers(id);
}
```

### 3. Backend: In-Memory Registration
**File:** `backend/src/services/TriggerService.ts`

```typescript
private async activateWebhookTrigger(trigger: TriggerDefinition): Promise<void> {
  // Extract webhook ID from trigger settings
  if (!trigger.settings.webhookId) {
    // Use webhookUrl parameter if provided
    if (trigger.settings.webhookUrl) {
      trigger.settings.webhookId = trigger.settings.webhookUrl;
    } else {
      // Generate new UUID if not provided
      trigger.settings.webhookId = uuidv4();
    }
  }

  // ⭐ REGISTER IN-MEMORY: Store webhook ID -> trigger mapping
  if (trigger.settings.webhookId) {
    this.webhookTriggers.set(trigger.settings.webhookId, trigger);
  }

  logger.info(`Webhook trigger activated: ${trigger.settings.webhookId}`);
}
```

### 4. Backend: Handle Incoming Webhook
**File:** `backend/src/routes/webhook.ts`

```typescript
router.all("/:webhookId", async (req, res) => {
  const { webhookId } = req.params;
  
  // ⭐ LOOKUP IN-MEMORY: Find trigger by webhook ID
  const result = await triggerService.handleWebhook(webhookId, {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip,
  });
  
  res.json(result);
});
```

**File:** `backend/src/services/TriggerService.ts`

```typescript
async handleWebhook(webhookId: string, request: WebhookRequest) {
  try {
    // ⭐ LOOKUP: Get trigger from in-memory Map
    const trigger = this.webhookTriggers.get(webhookId);

    if (!trigger) {
      throw new AppError("Webhook not found", 404, "WEBHOOK_NOT_FOUND");
    }

    // Execute workflow
    const result = await this.triggerManager.executeTrigger({
      triggerId: trigger.id,
      triggerType: "webhook",
      workflowId: trigger.workflowId,
      userId: await this.getUserIdFromWorkflow(trigger.workflowId),
      triggerNodeId: trigger.nodeId,
      triggerData: {
        body: request.body,
        headers: request.headers,
        query: request.query,
        method: request.method,
        path: request.path,
      },
    });

    return result;
  } catch (error) {
    logger.error(`Error handling webhook trigger ${webhookId}:`, error);
    throw error;
  }
}
```

---

## Why In-Memory Registration?

### Advantages ✅
1. **Fast Lookup**: O(1) constant time to find webhook by ID
2. **No Database Queries**: No need to query database on every webhook request
3. **Scalability**: Handles thousands of webhooks with minimal overhead
4. **Simplicity**: No need for additional database tables or indexes

### Disadvantages ❌
1. **Server Restart Required**: Webhooks only registered on startup or workflow save
2. **Memory Usage**: All webhooks stored in RAM (acceptable for most use cases)
3. **No Persistence**: Registration lost on server crash (but reloaded on restart)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
├─────────────────────────────────────────────────────────────────┤
│  1. User opens webhook node                                     │
│  2. Generate UUID: webhookId = "550e8400-..."                   │
│  3. Display webhook URL to user                                 │
│  4. User saves workflow                                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ POST /api/workflows/{id}
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Backend API                               │
├─────────────────────────────────────────────────────────────────┤
│  WorkflowService.updateWorkflow()                               │
│    ↓                                                             │
│  Save to Database:                                              │
│    UPDATE workflows                                             │
│    SET triggers = '[{                                           │
│      "id": "trigger-abc",                                       │
│      "type": "webhook",                                         │
│      "settings": {                                              │
│        "webhookId": "550e8400-..."  ← Stored as JSON           │
│      }                                                           │
│    }]'                                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ syncWorkflowTriggers()
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TriggerService                              │
├─────────────────────────────────────────────────────────────────┤
│  activateWebhookTrigger()                                       │
│    ↓                                                             │
│  In-Memory Registration:                                        │
│    webhookTriggers.set("550e8400-...", trigger)                 │
│                                                                  │
│  Memory State:                                                  │
│    webhookTriggers = Map {                                      │
│      "550e8400-..." => TriggerDefinition {                      │
│        workflowId: "workflow-xyz",                              │
│        nodeId: "webhook-node-abc",                              │
│        settings: { webhookId: "550e8400-..." }                  │
│      }                                                           │
│    }                                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Webhook now ready to receive requests
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Webhook Endpoint                              │
├─────────────────────────────────────────────────────────────────┤
│  External system sends:                                         │
│    POST http://localhost:4000/webhook/550e8400-...              │
│                                                                  │
│  Router: /webhook/:webhookId                                    │
│    ↓                                                             │
│  TriggerService.handleWebhook("550e8400-...")                   │
│    ↓                                                             │
│  Lookup in-memory:                                              │
│    trigger = webhookTriggers.get("550e8400-...")                │
│    ↓                                                             │
│  Execute workflow via TriggerManager                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checking Registered Webhooks

### Debug Endpoint
**URL:** `GET http://localhost:4000/webhook/debug/list`

**Response:**
```json
{
  "webhooks": [
    {
      "webhookId": "550e8400-e29b-41d4-a716-446655440000",
      "workflowId": "workflow-abc-123",
      "nodeId": "webhook-node-xyz",
      "type": "webhook",
      "active": true,
      "method": "POST"
    }
  ]
}
```

### Console Logs
When server starts:
```
[TriggerService] Initializing TriggerService...
[TriggerService] Webhook trigger activated: 550e8400-e29b-41d4-a716-446655440000
[TriggerService] TriggerService initialized successfully
```

When workflow saved:
```
[WorkflowService] Syncing triggers for workflow: workflow-abc-123
[TriggerService] Webhook trigger activated: 550e8400-e29b-41d4-a716-446655440000
```

When webhook received:
```
📨 Webhook received: POST /webhook/550e8400-e29b-41d4-a716-446655440000
[TriggerService] Handling webhook trigger: 550e8400-e29b-41d4-a716-446655440000
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Storage** | Workflow.triggers JSON column (database) |
| **Registration** | In-memory Map (webhookTriggers) |
| **Lookup** | O(1) constant time via Map.get() |
| **Persistence** | JSON in database, reloaded on server start |
| **When Registered** | Server startup + workflow save/update |
| **Webhook ID** | UUID v4 generated in frontend |

**Key Point:** Webhooks are stored in the database as JSON within the Workflow table, but registered in-memory for fast lookup. There is no separate database table for webhooks.

---

## Related Files

- **Frontend:** `frontend/src/components/workflow/node-config/custom-fields/WebhookUrlGenerator.tsx`
- **Backend Storage:** `backend/prisma/schema.prisma` (Workflow.triggers)
- **Backend Service:** `backend/src/services/TriggerService.ts` (in-memory registration)
- **Backend Router:** `backend/src/routes/webhook.ts` (webhook endpoint)

---

**Last Updated:** October 11, 2025  
**Topic:** Webhook Registration Architecture  
**Status:** ✅ Documented
