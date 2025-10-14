# 🚀 Manual Deployment - Quick Start

## Where to Find It

### In the Workflow Editor

1. Open any workflow
2. Look for the **Package icon** 📦 next to the Environment Selector
3. Click it to open the Manual Deployment Dialog

![Workflow Toolbar](./docs/images/workflow-toolbar-deploy.png)

## How to Use

### Step 1: Open Deployment Dialog

Click the **Deploy** button (📦 icon) in the workflow toolbar

### Step 2: Select Environments

- **Source**: Where to copy from (e.g., Development)
- **Target**: Where to deploy to (e.g., Staging)

### Step 3: Configure Options

- ✅ **Copy Settings**: Include workflow configuration
- ✅ **Copy Variables**: Include environment variables
- ⬜ **Auto-Activate**: Activate immediately after deployment

### Step 4: Add Details (Optional)

- **Version**: Leave empty for auto-increment
- **Deployment Note**: Document what you're deploying

### Step 5: Deploy!

Click **"Deploy Now"** and wait for confirmation

## Common Workflows

### Standard Deployment Pipeline

```
Development → Staging → Production
```

1. **Dev to Staging**

   ```
   Source: Development
   Target: Staging
   Copy Settings: ✅
   Copy Variables: ✅
   Auto-Activate: ⬜ (test first)
   ```

2. **Staging to Production**
   ```
   Source: Staging
   Target: Production
   Copy Settings: ✅
   Copy Variables: ⬜ (keep prod vars)
   Auto-Activate: ⬜ (manual verification)
   ```

### Quick Testing

```
Development → Development (copy to test changes)
```

```
Source: Development
Target: Development
Copy Settings: ✅
Copy Variables: ⬜
Auto-Activate: ✅ (immediate testing)
```

## Deployment Panel (Alternative UI)

### Where: Create a page at `/workflows/:id/environments`

```typescript
import { DeploymentPanel } from "@/components/environment";

function EnvironmentsPage() {
  const { workflowId } = useParams();

  return <DeploymentPanel workflowId={workflowId} />;
}
```

**Features:**

- Environment status cards
- Quick deploy buttons for common routes
- Last deployment information
- One-click deployment

## Options Explained

### Copy Settings

**When to enable:**

- Deploying new features
- Syncing configurations
- Initial environment setup

**When to disable:**

- Environment has custom settings
- Testing different configurations

### Copy Variables

**When to enable:**

- Development → Staging
- Staging → Production (if same config)
- Testing with same variables

**When to disable:**

- Production has different API keys
- Different database connections
- Environment-specific URLs

### Auto-Activate

**When to enable:**

- Development environment
- Staging for immediate testing
- You're confident in changes

**When to disable:**

- Production deployments
- Need to verify first
- Large changes requiring testing

## Best Practices

### 1. Always Add Deployment Notes

```
Good: "Fix: Updated webhook handler for new API version"
Bad: "Update"
```

### 2. Use Version Numbers for Releases

```
Good: "2.1.0" (major.minor.patch)
Bad: Leave empty for every deployment
```

### 3. Follow the Pipeline

```
✅ Dev → Staging → Prod
❌ Dev → Prod (unless emergency)
```

### 4. Test Before Production

```
1. Deploy to Staging
2. Test thoroughly
3. Then deploy to Production
```

### 5. Don't Copy Variables to Production

```
Staging → Production:
Copy Settings: ✅
Copy Variables: ❌ (production has its own)
```

## Troubleshooting

### "Cannot find source environment"

- Create the environment first using Environment Selector
- Click "+" next to environment type

### "Source and target must be different"

- Select different environments
- Cannot deploy environment to itself

### "Deployment failed"

- Check network connection
- Verify you have permissions
- Check deployment history for details

### Environment not showing in selector

- Create environment first
- Refresh the page
- Check workflow has environments enabled

## Keyboard Shortcuts

Currently none, but you can:

1. Click environment selector: `Alt + E`
2. Click deploy button: `Alt + D`
3. Press Enter to deploy (when dialog open)

## Visual Guide

### Environment Colors

- **Development** 🔧: Blue
- **Staging** 🔬: Yellow/Amber
- **Production** 🚀: Green

### Status Indicators

- **● Active**: Green with dot
- **○ Inactive**: Gray with circle

### Icons

- **📦 Package**: Deploy/Deployment
- **➡️ Arrow**: Deployment direction
- **✓ Check**: Success
- **⚠️ Alert**: Error/Warning
- **🕐 Clock**: Last deployment time

## Examples

### Example 1: Feature Deployment

```
Task: Deploy new email feature from Dev to Staging

Steps:
1. Click Deploy button
2. Source: Development
3. Target: Staging
4. Copy Settings: ✅
5. Copy Variables: ✅
6. Version: 1.5.0
7. Note: "Added email notification feature"
8. Auto-Activate: ⬜
9. Deploy!
```

### Example 2: Production Release

```
Task: Release tested features to Production

Steps:
1. Click Deploy button
2. Source: Staging
3. Target: Production
4. Copy Settings: ✅
5. Copy Variables: ⬜ (keep production settings)
6. Version: 2.0.0
7. Note: "Production release v2.0"
8. Auto-Activate: ⬜ (activate manually after verification)
9. Deploy!
```

### Example 3: Hotfix

```
Task: Emergency fix in production

Steps:
1. Fix in Development
2. Test in Staging (quick deploy)
3. If good, deploy to Production
4. Add note: "Hotfix: Critical bug in payment processor"
5. Version: 2.0.1 (patch)
```

## Quick Reference Card

| Option          | Default | When to Change     |
| --------------- | ------- | ------------------ |
| Copy Settings   | ✅      | Rarely             |
| Copy Variables  | ✅      | Production deploys |
| Auto-Activate   | ⬜      | Dev/Staging only   |
| Version         | Empty   | Major releases     |
| Deployment Note | Empty   | Always add!        |

## Need Help?

### Documentation

- [Full Implementation Guide](./MANUAL_DEPLOYMENT_IMPLEMENTATION.md)
- [Environment Management](./WORKFLOW_ENVIRONMENTS.md)
- [Deployment Summary](./MANUAL_DEPLOYMENT_SUMMARY.md)

### Support

- Check deployment history for past deployments
- Review environment settings
- Check workflow logs

---

**Quick Tip**: Use the Deployment Panel for a visual overview of all your environments and one-click deployments! 🚀
