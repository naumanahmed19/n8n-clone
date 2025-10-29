# Check Socket Room Subscription

## Problem
The frontend subscribes to the workflow room, but by the time the webhook is triggered, it's no longer in the room (0 clients).

## Quick Check

### In Browser Console
Paste this to check if you're subscribed:

```javascript
// Check socket connection
console.log('Socket connected:', window.socketService.socket?.connected);

// Try to manually subscribe
await window.socketService.subscribeToWorkflow('cmhc339fl0003ugricrt1qm49');

// Wait a moment, then trigger webhook
```

### Then Trigger Webhook
```
http://localhost:4000/webhook/138a22d2-ed2c-4af1-98fa-814212352fa1?test=true
```

### Check Backend Console
Should now show:
```
🧪🧪🧪 Clients in workflow:cmhc339fl0003ugricrt1qm49 room: 1
```

## Root Cause

React 18 Strict Mode runs effects twice:
1. Mount → Subscribe
2. Unmount (cleanup) → Unsubscribe  
3. Mount again → Subscribe

But there's a timing issue where the socket leaves the room and doesn't rejoin properly.

## Solution

We need to ensure the socket stays subscribed. Try manually subscribing in the browser console before triggering the webhook.
