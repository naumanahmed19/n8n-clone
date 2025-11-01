# Template Setup - Canvas Integration Guide

## 🎯 Quick Access

### From Workflow Canvas (NEW! ⭐)

```
┌─────────────────────────────────────────┐
│  Workflow Editor                        │
│  ┌────────────────────────────────────┐ │
│  │ [Save] [Execute] [...More]         │ │
│  │                      ↓              │ │
│  │              ┌──────────────────┐   │ │
│  │              │ Workflow Settings│   │ │
│  │              │ Setup Template ⭐│   │ │
│  │              │ Import Workflow  │   │ │
│  │              │ Export Workflow  │   │ │
│  │              └──────────────────┘   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [Your Workflow Canvas]                 │
└─────────────────────────────────────────┘
```

**Steps**:
1. Open workflow in editor
2. Click "..." (More Options) in toolbar
3. Click "Setup Template"
4. Configure and save
5. Done! ✨

---

## 🔄 Complete Flow

### Step 1: Open Workflow
```
Workflows Page → Click on workflow → Opens in editor
```

### Step 2: Access Template Setup
```
Toolbar → "..." → "Setup Template"
```

### Step 3: Configure
```
┌─────────────────────────────────────────────┐
│ Workflow Template                           │
│ ┌─────────────┬─────────────────────────┐  │
│ │ View Reqs   │ Setup Configuration ✓   │  │
│ └─────────────┴─────────────────────────┘  │
│                                             │
│ 🔑 Configure Credentials                    │
│ ┌─────────────────────────────────────────┐│
│ │ OpenAI API Key          [Select ▼]     ││
│ │ ✅ Configured                           ││
│ └─────────────────────────────────────────┘│
│                                             │
│ 🔤 Configure Variables                      │
│ ┌─────────────────────────────────────────┐│
│ │ {{webhookUrl}}                          ││
│ │ [https://api.example.com/webhook]       ││
│ │ ✅ Set                                  ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [Cancel]              [Save Configuration] │
└─────────────────────────────────────────────┘
```

### Step 4: Save & Reload
```
Click "Save Configuration"
  ↓
Success notification
  ↓
Page reloads automatically
  ↓
Configuration applied to nodes ✅
```

### Step 5: Verify
```
Open any node → Check parameters
  ↓
✅ Credential selected in "Authentication"
✅ Variables replaced with actual values
```

---

## 📊 Before vs After

### Before (Old Way)
```
1. Workflows Page
   ↓
2. Click "..." on workflow
   ↓
3. Select "Setup Template"
   ↓
4. Configure in dialog
   ↓
5. Save
   ↓
6. Close dialog
   ↓
7. Click workflow to open editor
   ↓
8. Check if it worked 🤞
```

**Problems**:
- ❌ Multiple page navigations
- ❌ Context switching
- ❌ Unclear if changes applied
- ❌ Had to manually verify

### After (New Way)
```
1. Workflow Editor (already open)
   ↓
2. Click "..." → "Setup Template"
   ↓
3. Configure in dialog
   ↓
4. Save
   ↓
5. Auto-reload with changes ✅
```

**Benefits**:
- ✅ No page navigation
- ✅ Stay in context
- ✅ Immediate feedback
- ✅ Auto-verification

---

## 🎨 Visual Indicators

### In Toolbar
```
┌──────────────────────────────────┐
│ [...More Options]                │
│   ├─ Workflow Settings           │
│   ├─ Setup Template 🔧 ⭐        │
│   ├─ Import Workflow             │
│   └─ Export Workflow             │
└──────────────────────────────────┘
```

### In Dialog
```
Status Indicators:
🔴 Required    - Must configure
🟢 Configured  - Credential selected
🟢 Set         - Variable has value
✅ Ready       - All complete
⚠️ Incomplete  - Missing items
```

---

## 💡 Usage Scenarios

### Scenario 1: New Workflow Setup
```
1. Create new workflow
2. Add nodes (OpenAI, HTTP Request, etc.)
3. Click "..." → "Setup Template"
4. See what's needed
5. Configure everything
6. Save
7. Start using workflow immediately
```

### Scenario 2: Update Credentials
```
1. Open existing workflow
2. Click "..." → "Setup Template"
3. Change credential selection
4. Save
5. Workflow updated with new credentials
```

### Scenario 3: Change Variables
```
1. Open workflow
2. Click "..." → "Setup Template"
3. Update variable values
4. Save
5. All nodes updated with new values
```

### Scenario 4: Duplicate & Reconfigure
```
1. Duplicate workflow
2. Open duplicate
3. Click "..." → "Setup Template"
4. Change credentials/variables for new environment
5. Save
6. Ready to use in new environment
```

---

## 🔧 Technical Details

### What Gets Updated

**Credentials**:
```typescript
// Before save
node.parameters.authentication = undefined

// After save
node.parameters.authentication = "credential-id-123"
```

**Variables**:
```typescript
// Before save
node.parameters.url = "https://api.example.com/{{endpoint}}"

// After save (endpoint = "users")
node.parameters.url = "https://api.example.com/users"
```

### Reload Behavior

After saving:
1. Success notification appears
2. Dialog closes
3. Page reloads (`window.location.reload()`)
4. Workflow loads with updated configuration
5. All nodes reflect changes

**Why reload?**
- Ensures React state syncs with backend
- Prevents stale data issues
- Guarantees UI shows correct values

---

## ✅ Verification Steps

### After Configuration

1. **Check Node Parameters**:
   ```
   Open any node → Parameters tab
   ↓
   Verify "Authentication" field has credential
   Verify variables are replaced
   ```

2. **Test Execution**:
   ```
   Click "Execute" button
   ↓
   Workflow should run successfully
   No credential errors
   ```

3. **Check Multiple Nodes**:
   ```
   If multiple nodes use same credential
   ↓
   Open each node
   Verify all have credential set
   ```

---

## 🚨 Troubleshooting

### Problem: Save button disabled
**Solution**: 
- Check all required fields are filled
- Look for red "Required" badges
- Fill in missing credentials/variables

### Problem: Changes not visible after save
**Solution**:
- Wait for page reload to complete
- Check browser console for errors
- Try manual refresh (F5)

### Problem: Credential not in dropdown
**Solution**:
- Go to Credentials page
- Create the credential
- Return to workflow
- Refresh page
- Try again

### Problem: Variable not replaced
**Solution**:
- Check variable name matches exactly
- Ensure using `{{variableName}}` syntax
- Verify variable is in node parameters
- Check for typos

---

## 📚 Related Features

### Also Available in Workflows List
```
Workflows Page → Click "..." on workflow
  ├─ View Template (read-only)
  └─ Setup Template (interactive)
```

### Workflow Settings
```
Toolbar → "..." → "Workflow Settings"
  ├─ Timezone
  ├─ Execution settings
  ├─ Error handling
  └─ Caller policy
```

---

## 🎉 Summary

### What's New
✅ Template setup button in workflow canvas
✅ Direct access from editor toolbar
✅ No need to go back to workflows list
✅ Immediate configuration and feedback

### What's Fixed
✅ Credentials save correctly to nodes
✅ Variables replace properly
✅ Changes reflect immediately
✅ Reliable and predictable behavior

### What's Better
✅ Faster workflow setup
✅ Better user experience
✅ Less context switching
✅ More intuitive flow

**Now you can configure workflows without ever leaving the editor!** 🚀
