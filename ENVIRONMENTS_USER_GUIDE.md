# Workflow Environments - User Guide

## 📚 Table of Contents

1. [What are Workflow Environments?](#what-are-workflow-environments)
2. [Getting Started](#getting-started)
3. [Creating Environments](#creating-environments)
4. [Managing Environments](#managing-environments)
5. [Deploying Between Environments](#deploying-between-environments)
6. [Best Practices](#best-practices)
7. [Common Workflows](#common-workflows)

---

## What are Workflow Environments?

Workflow Environments allow you to maintain **separate versions** of your workflow for different stages of development:

- **Development** 🔧 - For building and testing new features
- **Staging** 🔬 - For pre-production testing and validation
- **Production** 🚀 - For live, production workflows

### Key Benefits

✅ **Safe Testing** - Test changes without affecting production  
✅ **Version Control** - Track different versions of your workflow  
✅ **Easy Rollback** - Revert to previous versions if needed  
✅ **Deployment Pipeline** - Promote changes through environments  
✅ **Environment Isolation** - Each environment has its own state

---

## Getting Started

### Accessing Environments

1. **Open a Workflow** in the editor
2. Look at the **toolbar** at the top
3. Find the **Environment Selector** dropdown (next to the breadcrumb)
4. Click it to see available environments

![Environment Selector Location](docs/images/environment-selector.png)

### Initial Setup

When you first open a workflow, you'll see:

- **"Select Environment"** button
- No environments created yet

---

## Creating Environments

### Create Your First Environment

1. **Click** the Environment Selector dropdown
2. Under **"Create New Environment"**, select:

   - **Development** - Start here for new workflows
   - **Staging** - For testing before production
   - **Production** - For live workflows

3. **Fill in the Dialog:**

   ```
   Initial Version: 1.0.0
   Note (optional): Initial development environment
   ```

4. **Click "Create Environment"**

### What Happens When You Create an Environment?

- Takes a **snapshot** of your current workflow
- Saves all:
  - Nodes and their configurations
  - Connections between nodes
  - Trigger settings
  - Workflow settings
  - Variables (optional)
- Creates a **versioned copy** you can manage independently

### Versioning

Use **semantic versioning** (MAJOR.MINOR.PATCH):

- `1.0.0` - Initial version
- `1.1.0` - New features added
- `1.0.1` - Bug fixes
- `2.0.0` - Major changes

---

## Managing Environments

### Switching Between Environments

1. Click the **Environment Selector**
2. Click on any environment to **switch to it**
3. The selector shows:
   - 🔧 **Environment icon**
   - **Environment name**
   - **Version number** (e.g., v1.0.0)
   - **Node count**
   - **Active status** (if the environment is running)

### Environment Status

Each environment has a status:

- **Draft** 📝 - Created but not deployed
- **Active** ✅ - Currently running
- **Inactive** ⏸️ - Stopped/paused
- **Archived** 📦 - Old version kept for reference

### Activating/Deactivating Environments

**To Activate:**

1. Switch to the environment
2. Use the workflow's **activate toggle** in the toolbar
3. Or use the environment menu options

**To Deactivate:**

1. Switch to the environment
2. Turn off the workflow's **activate toggle**

---

## Deploying Between Environments

> **Note:** Deployment dialogs and menus are coming soon! For now, you can create and switch between environments. Use the API directly for deployments (see API Reference section).

### Currently Available

✅ **Create Environments**

- Development
- Staging
- Production

✅ **Switch Between Environments**

- Select from dropdown
- View environment details
- See version and node count

### Coming Soon

🚧 **Manual Deployment** (In Development)

- Deploy from one environment to another
- Copy settings and variables
- Auto-activate option

🚧 **Environment Promotion** (Planned)

- One-click promotion through pipeline
- Dev → Staging → Production
- Automated version bumping

🚧 **Deployment History** (Planned)

- View all deployments
- Rollback to previous versions
- Compare changes

### How to Deploy (Current Workaround)

For now, you can deploy using the API:

```bash
# Deploy from Development to Staging
curl -X POST http://localhost:4000/api/workflows/YOUR_WORKFLOW_ID/environments/deploy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceEnvironment": "DEVELOPMENT",
    "targetEnvironment": "STAGING",
    "version": "1.1.0",
    "deploymentNote": "Deploying tested features",
    "copyVariables": true,
    "activateAfterDeploy": false
  }'
```

Or promote an environment:

```bash
# Promote Development to Staging
curl -X POST http://localhost:4000/api/workflows/YOUR_WORKFLOW_ID/environments/DEVELOPMENT/promote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.0",
    "deploymentNote": "Promoting to staging",
    "activateAfterDeploy": false
  }'
```

---

## Best Practices

### 1. Development Workflow

```
1. Create Development Environment
   ↓
2. Build and test your workflow
   ↓
3. When ready, deploy to Staging
   ↓
4. Test in Staging
   ↓
5. Deploy to Production
```

### 2. Version Numbering

- **Development**: Can use any version for testing
- **Staging**: Use release candidates (e.g., 1.2.0-rc1)
- **Production**: Use stable versions only (e.g., 1.2.0)

### 3. Environment Variables

- Set **different credentials** for each environment
- Use **test APIs** in Development/Staging
- Use **production APIs** only in Production
- Never share production secrets in Development

### 4. Testing Strategy

**Development:**

- Test individual nodes
- Test connections
- Test with sample data
- Use debug mode

**Staging:**

- Test complete workflows
- Test with realistic data
- Test error handling
- Test integrations
- Performance testing

**Production:**

- Monitor executions
- Set up error alerts
- Regular backups
- Gradual rollout

### 5. Deployment Notes

Always include clear deployment notes:

```
Good ✅:
- "Added Slack notification for failed orders"
- "Fixed timeout issue in payment processing"
- "Updated API endpoint to v2"

Bad ❌:
- "Updates"
- "Changes"
- "Fix"
```

---

## Common Workflows

### Scenario 1: New Feature Development

```mermaid
1. Create Development environment (v1.0.0)
   - Build new feature
   - Test locally

2. Deploy to Staging (v1.1.0)
   - Test with team
   - QA validation

3. Deploy to Production (v1.1.0)
   - Monitor executions
   - Rollback if issues
```

### Scenario 2: Bug Fix in Production

```mermaid
1. Create hotfix in Development
   - Test the fix thoroughly

2. Deploy to Staging (v1.0.1)
   - Quick validation

3. Deploy to Production (v1.0.1)
   - Monitor closely
```

### Scenario 3: Rollback After Issues

```mermaid
1. Production has issues after deployment
   ↓
2. Open Environment menu
   ↓
3. View Deployment History
   ↓
4. Select previous stable deployment
   ↓
5. Click "Rollback"
   ↓
6. Confirm and monitor
```

---

## Viewing Deployment History

1. **Switch** to the environment
2. **Open** environment menu
3. **Select** "View Deployment History"
4. See all deployments:
   - Version numbers
   - Deployment timestamps
   - Who deployed
   - Deployment notes
   - Source environment
   - Status (success/failed/rollback)

### Rollback to Previous Version

1. **Open** Deployment History
2. **Find** the version you want to restore
3. **Click** "Rollback" button
4. **Confirm** with a note:
   ```
   Rollback Note: Reverting due to API timeout issues
   ```
5. The environment will be **restored** to that version

---

## Comparing Environments

See what's different between environments:

1. **Open** Environment Selector
2. **Click** "Compare Environments"
3. **Select** source and target
4. View differences:
   - **Added nodes** (green)
   - **Removed nodes** (red)
   - **Modified nodes** (yellow)
   - **Connection changes**
   - **Setting changes**
   - **Variable changes**

---

## Tips & Tricks

### 🎯 Quick Tips

1. **Always test in Development first**
2. **Use Staging for final validation**
3. **Deploy to Production during low-traffic hours**
4. **Keep deployment notes detailed**
5. **Regularly review deployment history**
6. **Archive old environments you don't need**

### ⚠️ Common Mistakes to Avoid

❌ **Don't** edit Production directly  
❌ **Don't** skip Staging  
❌ **Don't** deploy without testing  
❌ **Don't** use production credentials in Development  
❌ **Don't** forget to update version numbers

### 🔒 Security Best Practices

1. **Separate credentials** per environment
2. **Limit Production access** to authorized users
3. **Use environment-specific variables**
4. **Audit deployment history** regularly
5. **Enable 2FA** for production deployments (future feature)

---

## Keyboard Shortcuts (Future Feature)

```
Ctrl/Cmd + E        - Open Environment Selector
Ctrl/Cmd + D        - Deploy to Staging
Ctrl/Cmd + P        - Promote to Production
Ctrl/Cmd + H        - View Deployment History
Ctrl/Cmd + R        - Rollback
```

---

## Troubleshooting

### Issue: "Environment already exists"

**Solution:** The environment was already created. Switch to it instead of creating a new one.

### Issue: "You don't have permission to access this workflow"

**Solution:**

- Make sure you're logged in
- Verify you own the workflow
- Check if you're using the correct account

### Issue: Deployment failed

**Solution:**

1. Check deployment history for error details
2. Verify source environment is valid
3. Ensure you have permission
4. Try again with a different version number

### Issue: Can't see environments

**Solution:**

1. Refresh the page
2. Check browser console for errors
3. Verify backend is running
4. Clear browser cache

### Issue: Environment not loading

**Solution:**

1. Check if workflow ID is correct
2. Verify API is accessible
3. Check authentication token
4. Review browser console logs

---

## API Reference (For Developers)

### Endpoints

```
GET    /api/workflows/:workflowId/environments
GET    /api/workflows/:workflowId/environments/summary
GET    /api/workflows/:workflowId/environments/:environment
POST   /api/workflows/:workflowId/environments
POST   /api/workflows/:workflowId/environments/deploy
POST   /api/workflows/:workflowId/environments/:environment/promote
POST   /api/workflows/:workflowId/environments/:environment/rollback
GET    /api/workflows/:workflowId/environments/:environment/deployments
GET    /api/workflows/:workflowId/environments/compare
PUT    /api/workflows/:workflowId/environments/:environment/activate
PUT    /api/workflows/:workflowId/environments/:environment/deactivate
DELETE /api/workflows/:workflowId/environments/:environment
```

See [WORKFLOW_ENVIRONMENTS.md](./WORKFLOW_ENVIRONMENTS.md) for full technical documentation.

---

## Support & Feedback

- 📖 **Documentation**: See WORKFLOW_ENVIRONMENTS.md
- 🐛 **Report Issues**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 💬 **Community**: Discord/Slack Channel

---

## What's Next?

Planned features:

- [ ] Scheduled deployments
- [ ] Approval workflows
- [ ] Environment templates
- [ ] Automatic rollback on errors
- [ ] Deployment pipelines
- [ ] Environment cloning
- [ ] Diff viewer in UI
- [ ] Deployment notifications
- [ ] Audit logs
- [ ] Role-based access control

---

**Happy Workflow Management! 🚀**
