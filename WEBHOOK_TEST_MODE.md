# Webhook Test Mode - Visualize Executions in Real-Time

## Overview

When testing webhooks, you can now see the execution happen in real-time in the workflow editor by adding a query parameter to your webhook URL.

## How to Use

### Standard Webhook (Background Execution)
```
http://localhost:4000/webhook/YOUR-WEBHOOK-ID
```
- Executes in the background
- Returns execution ID immediately
- No visualization in the editor

### Test Mode Webhook (Visible Execution)
```
http://localhost:4000/webhook/YOUR-WEBHOOK-ID?test=true
```
or
```
http://localhost:4000/webhook/YOUR-WEBHOOK-ID?visualize=true
```
- Executes and notifies the frontend
- If the workflow editor is open, you'll see:
  - Real-time node execution status
  - Execution logs in the console
  - Visual indicators on the canvas
  - Progress updates

## Example

### Your Webhook URL
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514
```

### Test Mode URL
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true
```

## What Happens in Test Mode

1. **Webhook Received**: The backend receives your webhook request
2. **Execution Started**: A workflow execution is created with a unique ID
3. **Frontend Notified**: The workflow editor receives a `webhook-test-triggered` event
4. **Auto-Subscribe**: The editor automatically subscribes to the execution
5. **Real-Time Updates**: You see the execution progress live:
   - Nodes light up as they execute
   - Execution logs appear in the console
   - Results are displayed in real-time

## Console Messages

When test mode is active, you'll see these messages in the browser console:

```
🧪 [WorkflowEditor] Webhook test triggered: { executionId: "...", webhookId: "...", ... }
✅ [WorkflowEditor] Subscribed to webhook execution: <execution-id>
🧪 Webhook test triggered - watching execution in real-time
```

## Response Format

### Standard Mode Response
```json
{
  "success": true,
  "message": "Webhook received and workflow triggered",
  "executionId": "d29fcd41-b3bf-425f-9113-6d82e3ec90b1",
  "timestamp": "2025-10-29T14:22:43.136Z"
}
```

### Test Mode Response
```json
{
  "success": true,
  "message": "Webhook received - execution will be visible in editor",
  "executionId": "d29fcd41-b3bf-425f-9113-6d82e3ec90b1",
  "testMode": true,
  "timestamp": "2025-10-29T14:22:43.136Z"
}
```

## Use Cases

- **Development**: Test your webhook workflows and see exactly what's happening
- **Debugging**: Identify which nodes are failing and why
- **Demos**: Show clients how webhooks trigger workflows in real-time
- **Learning**: Understand the execution flow of your workflows

## Notes

- Test mode works with all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- The workflow editor must be open to see the visualization
- Multiple browser tabs can watch the same execution
- Test mode doesn't change the execution behavior, only the visibility
- The execution ID is consistent between the webhook response and the editor

## Troubleshooting

**Q: I don't see the execution in the editor**
- Make sure the workflow editor is open in your browser
- Check that you're viewing the correct workflow
- Verify the `?test=true` parameter is in the URL
- Check the browser console for connection errors

**Q: The execution ID doesn't match**
- This was a bug that has been fixed
- Both the webhook response and editor should show the same execution ID
- If they differ, restart the backend server

**Q: Can I use test mode in production?**
- Yes, but it's designed for development/testing
- Production webhooks should use the standard URL without `?test=true`
- Test mode adds minimal overhead (just a socket event)
