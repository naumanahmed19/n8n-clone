# Template Setup - Quick Guide

## 🚀 Quick Start

### Option 1: View Requirements (Read-Only)

```
Workflows Page → Click "..." → "View Template"
```

**What you see:**
- 📊 Quick stats (nodes, credentials, variables, time)
- 🔑 List of required credentials
- 🔤 List of required variables
- ⚡ Trigger types
- ✅ Setup checklist

**Use when:**
- You want to understand what's needed
- You're evaluating a workflow
- You're documenting requirements

---

### Option 2: Setup Configuration (Interactive)

```
Workflows Page → Click "..." → "Setup Template"
```

**What you can do:**
- ✏️ Select credentials from dropdowns
- ✏️ Enter variable values
- ✅ See real-time validation
- 💾 Save all configurations at once

**Use when:**
- You're ready to configure the workflow
- You want to set up everything in one place
- You need to update credentials or variables

---

## 📋 Setup Checklist

### Step 1: Open Setup
- [ ] Navigate to Workflows page
- [ ] Find the workflow you want to configure
- [ ] Click the "..." menu
- [ ] Select "Setup Template"

### Step 2: Configure Credentials
For each credential requirement:
- [ ] Read the description
- [ ] Check which nodes use it
- [ ] Select from dropdown OR click "Create New"
- [ ] Verify green checkmark appears

### Step 3: Set Variables
For each variable:
- [ ] Read the description
- [ ] Check which nodes use it
- [ ] Enter the value
- [ ] Verify green checkmark appears

### Step 4: Save
- [ ] Check overall status shows "Ready"
- [ ] Click "Save Configuration"
- [ ] Wait for success notification
- [ ] Done! Workflow is configured ✨

---

## 🎯 Example: Setting Up an AI Workflow

### Workflow: "AI Content Generator"
**Requirements:**
- 1 credential: OpenAI API Key
- 2 variables: webhookUrl, outputFormat

### Setup Process:

#### 1. Open Setup
```
Click "..." → "Setup Template"
```

#### 2. Configure OpenAI Credential
```
Credential: OpenAI API Key
Status: ⚠️ Required
Action: Select "My OpenAI Key" from dropdown
Result: ✅ Configured
```

#### 3. Set webhookUrl Variable
```
Variable: {{webhookUrl}}
Description: Used in HTTP Request (url)
Status: ⚠️ Required
Action: Enter "https://api.example.com/webhook"
Result: ✅ Set
```

#### 4. Set outputFormat Variable
```
Variable: {{outputFormat}}
Description: Used in OpenAI (responseFormat)
Status: ⚠️ Required
Action: Enter "markdown"
Result: ✅ Set
```

#### 5. Save Configuration
```
Overall Status: ✅ Ready
Action: Click "Save Configuration"
Result: Success! Workflow configured
```

---

## 🎨 Visual Indicators

### Status Badges

| Badge | Meaning |
|-------|---------|
| 🔴 **Required** | Must be configured |
| 🟢 **Configured** | Credential selected |
| 🟢 **Set** | Variable has value |
| ⚠️ **Incomplete** | Missing requirements |
| ✅ **Ready** | All requirements met |

### Complexity Levels

| Level | Color | Setup Time |
|-------|-------|------------|
| **Simple** | 🟢 Green | < 5 minutes |
| **Medium** | 🟡 Yellow | 5-15 minutes |
| **Complex** | 🔴 Red | > 15 minutes |

---

## 💡 Tips & Tricks

### Tip 1: Create Credentials First
If you don't have credentials yet:
1. Click "Create New" button
2. Opens credentials page in new tab
3. Create the credential
4. Return to setup tab
5. Refresh the page
6. Select your new credential

### Tip 2: Use Descriptive Variable Names
Good: `{{apiEndpoint}}`, `{{webhookUrl}}`
Bad: `{{url}}`, `{{value}}`

### Tip 3: Check Node Usage
Each requirement shows which nodes use it:
- Helps understand the workflow
- Ensures you configure the right thing
- Useful for troubleshooting

### Tip 4: Save Often
The save button is disabled until complete:
- Fill in all required fields
- Button will enable automatically
- Click to save all at once

### Tip 5: Use View Tab for Reference
Switch between tabs:
- **View**: See requirements and checklist
- **Setup**: Configure credentials and variables
- No need to close and reopen

---

## ❓ Common Questions

### Q: Can I save partial configurations?
**A:** No, all required fields must be complete. This ensures the workflow will work correctly.

### Q: What happens to existing configurations?
**A:** They are preserved. Setup only updates what you change.

### Q: Can I use the same credential for multiple nodes?
**A:** Yes! Select the same credential for each requirement that needs it.

### Q: How do I know which credential type to use?
**A:** The requirement card shows the credential type and which nodes need it.

### Q: Can I change configurations later?
**A:** Yes! Open "Setup Template" again and update any values.

### Q: What if I don't have a required credential?
**A:** Click "Create New" to open the credentials page and create one.

---

## 🔧 Troubleshooting

### Problem: Save button is disabled
**Solution:** Check that all required fields are filled:
- All required credentials selected (green checkmark)
- All required variables have values (green checkmark)
- Overall status shows "Ready"

### Problem: Can't find my credential in dropdown
**Solution:** 
1. Verify credential type matches requirement
2. Check credential exists in credentials page
3. Refresh the page to reload credentials

### Problem: Variable not being replaced
**Solution:**
1. Ensure variable name matches exactly (case-sensitive)
2. Use correct syntax: `{{variableName}}`
3. Check variable is used in node parameters

### Problem: Configuration not saving
**Solution:**
1. Check browser console for errors
2. Verify you have permission to edit workflow
3. Try refreshing and setting up again

---

## 📚 Related Documentation

- [Workflow Template System](./docs/WORKFLOW_TEMPLATE_SYSTEM.md) - Complete technical documentation
- [Template Setup Feature](./TEMPLATE_SETUP_FEATURE.md) - Detailed implementation guide
- [Workflow Template Implementation](./WORKFLOW_TEMPLATE_IMPLEMENTATION.md) - Original feature overview

---

## 🎉 Success!

Once you see the success notification:
- ✅ All credentials are configured
- ✅ All variables are set
- ✅ Workflow is ready to use
- ✅ You can test or activate it

**Next Steps:**
1. Test the workflow
2. Activate it if needed
3. Monitor executions
4. Enjoy your automated workflow! 🚀
