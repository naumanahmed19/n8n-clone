# Test Webhook Visualization NOW

## Quick Test Steps

### 1. Make sure backend is running
```bash
cd backend
npm run dev
```

### 2. Open workflow editor in browser
```
http://localhost:3000/workflows/cmhc339fl0003ugricrt1qm49/edit
```

### 3. Open browser console (F12)

### 4. Trigger webhook with test mode

**Option A: Using browser**
Just visit this URL in a new tab:
```
http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true
```

**Option B: Using curl**
```bash
curl "http://localhost:4000/webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514?test=true"
```

**Option C: Using Node.js test script**
```bash
node backend/test-webhook-simple.js test
```

## What You Should See

### In Browser Console:
```
[WorkflowEditor] Subscribing to workflow: cmhc339fl0003ugricrt1qm49
🧪 [WorkflowEditor] Webhook test triggered: { executionId: "...", webhookId: "...", ... }
✅ [WorkflowEditor] Subscribed to webhook execution: <execution-id>
🟢 [WorkflowEditor] Execution event received: { type: "...", ... }
```

### In Backend Console:
```
📨 Webhook received: GET /webhook/8e283f19-c6a7-4a75-ab87-d9c46a64f514
✅ Webhook processed successfully - Execution ID: <execution-id>
🧪 Webhook test mode - execution visible in editor
```

## Troubleshooting

### Not seeing console messages?

1. **Check if workflow editor is open**
   - URL should be: `http://localhost:3000/workflows/cmhc339fl0003ugricrt1qm49/edit`
   - Not just the workflows list page

2. **Check if backend is running**
   ```bash
   curl http://localhost:4000/health
   ```

3. **Check browser console for errors**
   - Press F12
   - Look for red error messages
   - Check Network tab for failed requests

4. **Check if socket is connected**
   - In browser console, type: `window.socketService`
   - Should show connected status

5. **Restart backend server**
   - Stop the backend (Ctrl+C)
   - Run `npm run dev` again
   - Wait for "Server running on port 4000"

6. **Clear browser cache and reload**
   - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Still not working?

Check backend logs for:
```
🧪 Webhook test mode - execution visible in editor
```

If you see this, the backend is working. The issue is on the frontend.

Check frontend for:
```
[WorkflowEditor] Subscribing to workflow: cmhc339fl0003ugricrt1qm49
```

If you don't see this, the workflow editor isn't subscribing to the workflow.

## Success Indicators

✅ Backend logs show: `🧪 Webhook test mode - execution visible in editor`  
✅ Browser console shows: `🧪 [WorkflowEditor] Webhook test triggered`  
✅ Browser console shows: `✅ [WorkflowEditor] Subscribed to webhook execution`  
✅ You see execution events in the console  
✅ Nodes light up in the workflow editor  

## Next Steps

Once you see the console messages, you can:
- Watch nodes execute in real-time
- See execution logs
- Debug failing nodes
- Demo to clients
