# Quick Start: Webhook Testing with Visualization

## TL;DR

Add `?test=true` to your webhook URL to see executions in real-time in the workflow editor.

## Your Webhook URLs

### Background Execution (Production)
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514
```

### Visible Execution (Testing/Development)
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true
```

## Quick Test (3 Steps)

### Step 1: Open Workflow Editor
```
http://localhost:3000/workflows/cmhc339fl0003ugricrt1qm49/edit
```
**Important**: Must be the editor page, not the workflows list!

### Step 2: Open Browser Console
Press `F12` or right-click → Inspect → Console

### Step 3: Trigger Webhook
In another browser tab or terminal:
```bash
curl "http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true"
```

Or just visit this URL in a new browser tab:
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true
```

**Note**: Keep the workflow editor tab open to see the execution!

## What You'll See

✅ Console message: `🧪 [WorkflowEditor] Webhook test triggered`  
✅ Console message: `✅ [WorkflowEditor] Subscribed to webhook execution`  
✅ Nodes lighting up as they execute  
✅ Real-time execution logs  
✅ Progress updates  

## Automated Test

Run this to test both modes:
```bash
node backend/test-webhook-visualize.js
```

## Troubleshooting

**Not seeing execution?**
- ✓ Is the workflow editor open?
- ✓ Is the backend server running?
- ✓ Did you add `?test=true` to the URL?
- ✓ Check browser console for errors

**Execution ID mismatch?**
- This bug has been fixed!
- Restart the backend server if you still see it

## When to Use Each Mode

| Mode | URL | Use Case |
|------|-----|----------|
| **Standard** | `/webhook/ID` | Production, external services |
| **Test** | `/webhook/ID?test=true` | Development, debugging, demos |

## Alternative Parameter

Both work the same:
- `?test=true`
- `?visualize=true`

Choose whichever you prefer!

## Pro Tips

💡 Keep the workflow editor open while testing webhooks  
💡 Use test mode for debugging failing workflows  
💡 Use standard mode for production webhooks  
💡 Multiple tabs can watch the same execution  
💡 Works with all HTTP methods (GET, POST, PUT, DELETE, PATCH)  

## Need More Info?

- Full documentation: `WEBHOOK_TEST_MODE.md`
- Implementation details: `WEBHOOK_FIXES_SUMMARY.md`
