# Debug Webhook Test Mode

## Step-by-Step Debugging

### 1. Check Backend Logs

When you trigger the webhook with `?test=true`, you should see in the backend console:

```
📨 Webhook received: GET /webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514
🧪 Emitting webhook-test-triggered to workflow:<workflow-id>
🧪 Webhook test mode - execution visible in editor
✅ Webhook processed successfully - Execution ID: <execution-id>
```

**If you DON'T see these logs:**
- The `?test=true` parameter might not be working
- Check the URL carefully: `http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true`

### 2. Check Frontend Console

When you open the workflow editor, you should see:

```
[WorkflowEditor] Subscribing to workflow: <workflow-id>
[WorkflowEditor] Registering event listeners including webhook-test-triggered
[WorkflowEditor] Event listeners registered
```

**If you DON'T see these logs:**
- The WorkflowEditorPage component might not be mounting
- Check that you're on the editor page, not the workflows list

### 3. Trigger Webhook and Check Logs

After triggering the webhook with `?test=true`, check:

**Backend should log:**
```
🧪 Emitting webhook-test-triggered to workflow:<workflow-id>
```

**Frontend should log:**
```
🧪 [WorkflowEditor] Webhook test triggered: { ... }
🧪 [WorkflowEditor] Current workflow ID: <workflow-id>
🧪 [WorkflowEditor] Event workflow ID: <workflow-id>
✅ [WorkflowEditor] Subscribed to webhook execution: <execution-id>
```

## Common Issues

### Issue 1: Not seeing backend logs

**Problem:** Backend doesn't log `🧪 Emitting webhook-test-triggered`

**Solution:** 
- Make sure you're using `?test=true` in the URL
- Check: `http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true`
- NOT: `http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514`

### Issue 2: Not seeing frontend logs

**Problem:** Frontend doesn't log `🧪 [WorkflowEditor] Webhook test triggered`

**Possible causes:**

1. **Not subscribed to workflow room**
   - Check if you see: `[WorkflowEditor] Subscribing to workflow: <workflow-id>`
   - If not, the component isn't mounting properly

2. **Wrong workflow ID**
   - The webhook is registered to a specific workflow
   - Make sure you're viewing the correct workflow in the editor
   - Check backend logs for the workflow ID

3. **Socket not connected**
   - Check browser console for socket connection errors
   - Look for: `Socket not connected` warnings

4. **Event listener not registered**
   - Check if you see: `[WorkflowEditor] Registering event listeners`
   - If not, the useEffect might not be running

### Issue 3: Seeing execution events but not webhook-test-triggered

**Problem:** You see `🟢 [WorkflowEditor] Execution event received` but not `🧪 [WorkflowEditor] Webhook test triggered`

**This means:**
- Socket connection is working ✅
- Workflow subscription is working ✅
- But the `webhook-test-triggered` event is not being received ❌

**Possible causes:**

1. **testMode flag not set**
   - Backend might not be detecting `?test=true`
   - Check backend logs for: `🧪 Emitting webhook-test-triggered`

2. **Event emitted to wrong room**
   - Check backend logs for the workflow ID
   - Compare with the workflow ID in the frontend

3. **Event listener not registered**
   - Refresh the page and check for: `[WorkflowEditor] Registering event listeners`

## Manual Test

### Test 1: Check if backend detects test mode

```bash
curl "http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Webhook received - execution will be visible in editor",
  "executionId": "...",
  "testMode": true,
  "timestamp": "..."
}
```

**Key:** Look for `"testMode": true` in the response!

### Test 2: Check socket connection

Run this in a separate terminal:
```bash
node backend/test-socket-connection.js
```

Then trigger the webhook:
```bash
curl "http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true"
```

You should see:
```
🧪 WEBHOOK TEST TRIGGERED!
{
  "webhookId": "...",
  "executionId": "...",
  "workflowId": "...",
  ...
}
```

If you see this, the backend is emitting correctly!

### Test 3: Check workflow ID

In the browser console, type:
```javascript
window.location.pathname
```

Should show: `/workflows/<workflow-id>/edit`

Compare this workflow ID with the one in the backend logs.

## Next Steps

Based on what you see:

1. **If backend logs show `🧪 Emitting webhook-test-triggered`**
   - Backend is working correctly
   - Issue is on the frontend

2. **If backend logs DON'T show this**
   - Backend isn't detecting test mode
   - Check the URL has `?test=true`

3. **If test-socket-connection.js receives the event**
   - Backend is emitting correctly
   - Frontend listener might not be registered
   - Try refreshing the browser

4. **If workflow IDs don't match**
   - You're viewing the wrong workflow
   - Open the correct workflow in the editor
