# Manual Deployment Feature - Implementation Guide

## 📋 Overview

The Manual Deployment feature allows users to deploy workflows between environments with full control over settings, variables, and activation options.

## ✅ Implemented Components

### 1. Manual Deployment Dialog Component

**File:** `frontend/src/components/environment/ManualDeploymentDialog.tsx`

A comprehensive dialog for manual workflow deployment with:

- **Source & Target Selection**: Dropdown selectors for choosing environments
- **Version Control**: Optional version specification with auto-increment
- **Deployment Notes**: Text area for deployment documentation
- **Deployment Options**:
  - ✅ Copy workflow settings
  - ✅ Copy environment variables
  - ✅ Auto-activate after deployment
- **Visual Flow**: Shows deployment direction with environment badges
- **Error Handling**: Displays deployment errors clearly
- **Success Feedback**: Shows confirmation when deployment succeeds

**Key Features:**

```typescript
interface ManualDeploymentDialogProps {
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultSource?: EnvironmentType;
  defaultTarget?: EnvironmentType;
}
```

### 2. Deployment Panel Component

**File:** `frontend/src/components/environment/DeploymentPanel.tsx`

A dashboard-style panel for managing deployments:

- **Environment Status Cards**: Shows current state of all environments
  - Version number
  - Node count
  - Active/Inactive status
  - Last deployment timestamp
- **Quick Deploy Routes**: Pre-configured deployment paths
  - Dev → Staging
  - Staging → Production
  - Dev → Production
- **Custom Deployment Button**: Opens full manual deployment dialog
- **Real-time Updates**: Refreshes data after deployments

**Usage:**

```tsx
<DeploymentPanel workflowId={workflowId} />
```

### 3. Updated Exports

**File:** `frontend/src/components/environment/index.ts`

Exports both new components:

```typescript
export { ManualDeploymentDialog } from "./ManualDeploymentDialog";
export { DeploymentPanel } from "./DeploymentPanel";
```

## 🎯 Features

### Copy Settings

- Copies all workflow configuration from source environment
- Includes node settings, connections, and triggers
- Preserves workflow structure

### Copy Variables

- Transfers environment-specific variables
- Optional: Can deploy without copying variables to preserve target environment settings
- Useful for maintaining different configurations per environment

### Auto-Activate

- Automatically activates workflow in target environment after deployment
- Optional: Can be disabled for manual activation later
- Useful for production deployments that should go live immediately

## 🚀 Usage Examples

### Basic Manual Deployment

```typescript
import { ManualDeploymentDialog } from "@/components/environment";

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>Deploy Workflow</Button>

      <ManualDeploymentDialog
        workflowId={workflowId}
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={() => {
          console.log("Deployment successful!");
          // Refresh your data here
        }}
      />
    </>
  );
}
```

### Pre-selected Deployment Route

```typescript
<ManualDeploymentDialog
  workflowId={workflowId}
  open={open}
  onOpenChange={setOpen}
  defaultSource={EnvironmentType.DEVELOPMENT}
  defaultTarget={EnvironmentType.STAGING}
  onSuccess={() => loadWorkflowData()}
/>
```

### Deployment Panel Integration

```typescript
import { DeploymentPanel } from "@/components/environment";

function WorkflowSettings({ workflowId }: { workflowId: string }) {
  return (
    <div className="space-y-6">
      <h2>Deployment Management</h2>
      <DeploymentPanel workflowId={workflowId} />
    </div>
  );
}
```

## 📦 Backend Integration

The components use the existing backend APIs:

### Deploy Endpoint

```http
POST /api/workflows/:workflowId/environments/deploy

{
  "sourceEnvironment": "DEVELOPMENT",
  "targetEnvironment": "STAGING",
  "version": "1.1.0",           // Optional
  "deploymentNote": "Bug fixes",  // Optional
  "copyVariables": true,
  "activateAfterDeploy": false
}
```

### Backend Service

The deployment uses `WorkflowEnvironmentService.deployToEnvironment()` which:

1. Validates source environment exists
2. Checks target environment
3. Copies nodes, connections, triggers, settings
4. Optionally copies variables
5. Optionally activates workflow
6. Creates deployment history record
7. Auto-increments version if not specified

## 🎨 UI/UX Features

### Environment Color Coding

- **Development** 🔧: Blue theme
- **Staging** 🔬: Yellow/Amber theme
- **Production** 🚀: Green theme

### Visual Indicators

- Environment icons for quick identification
- Status badges (Active/Inactive)
- Version numbers displayed prominently
- Last deployment timestamps
- Deployment flow visualization with arrows

### Responsive Design

- Mobile-friendly layouts
- Grid-based environment cards
- Collapsible sections
- Touch-friendly buttons

### Error Handling

- Clear error messages
- Validation feedback
- Success confirmations
- Loading states

## 🔧 Integration Points

### Add to Workflow Toolbar

```typescript
import { ManualDeploymentDialog } from "@/components/environment";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

function WorkflowToolbar({ workflowId }: { workflowId: string }) {
  const [showDeploy, setShowDeploy] = useState(false);

  return (
    <div className="toolbar">
      {/* ... other toolbar items ... */}

      <Button onClick={() => setShowDeploy(true)}>
        <Package className="w-4 h-4 mr-2" />
        Deploy
      </Button>

      <ManualDeploymentDialog
        workflowId={workflowId}
        open={showDeploy}
        onOpenChange={setShowDeploy}
      />
    </div>
  );
}
```

### Add to Workflow Actions Menu

```typescript
<DropdownMenuItem onClick={() => setShowDeployDialog(true)}>
  <Package className="w-4 h-4 mr-2" />
  Manual Deploy
</DropdownMenuItem>

<ManualDeploymentDialog
  workflowId={workflow.id}
  open={showDeployDialog}
  onOpenChange={setShowDeployDialog}
/>
```

### Create Dedicated Environments Page

```typescript
import { DeploymentPanel } from "@/components/environment";
import { EnvironmentSelector } from "@/components/environment";

function EnvironmentsPage() {
  const { workflowId } = useParams();

  return (
    <div className="page-container">
      <header>
        <h1>Environment Management</h1>
        <EnvironmentSelector workflowId={workflowId} showCreateOption={true} />
      </header>

      <main>
        <DeploymentPanel workflowId={workflowId} />
      </main>
    </div>
  );
}
```

## 🧪 Testing Checklist

- [ ] Deploy from Development to Staging
- [ ] Deploy from Staging to Production
- [ ] Deploy with custom version number
- [ ] Deploy with deployment notes
- [ ] Deploy with copy variables enabled
- [ ] Deploy with copy variables disabled
- [ ] Deploy with auto-activate enabled
- [ ] Deploy with auto-activate disabled
- [ ] Verify version auto-increment works
- [ ] Check deployment history is recorded
- [ ] Test quick deploy routes
- [ ] Verify environment status updates
- [ ] Test error handling for invalid deployments
- [ ] Check responsive design on mobile
- [ ] Verify all environment colors display correctly

## 📝 Next Steps

### Recommended Enhancements

1. **Add to Workflow Toolbar**

   - Add deploy button next to save/execute buttons
   - Quick access for developers

2. **Create Environments Page**

   - Dedicated page for environment management
   - Add route: `/workflows/:id/environments`
   - Include deployment panel and history

3. **Add Deployment Comparison**

   - Show diff before deploying
   - Preview changes
   - Confirm deployment impact

4. **Deployment Templates**

   - Save common deployment configurations
   - Quick deploy presets
   - Team-wide deployment standards

5. **Approval Workflow**
   - Require approval for production deployments
   - Multi-step deployment process
   - Audit trail enhancements

## 🎓 Usage Guide

### For Developers

1. **Development Workflow**:

   - Make changes in Development environment
   - Test thoroughly
   - Deploy to Staging with notes
   - QA testing in Staging
   - Deploy to Production when approved

2. **Quick Deployments**:

   - Use Quick Deploy Routes for common paths
   - Add deployment notes for tracking
   - Enable auto-activate for non-production

3. **Safe Production Deployments**:
   - Always deploy from Staging to Production
   - Review deployment notes
   - Consider disabling auto-activate
   - Manually activate after verification

### For Teams

1. **Deployment Strategy**:

   - Development → Staging → Production pipeline
   - Use version numbers for releases
   - Document all deployments
   - Track deployment history

2. **Variable Management**:

   - Keep environment-specific variables
   - Don't copy variables to production
   - Use different API keys per environment

3. **Rollback Plan**:
   - Use deployment history for rollbacks
   - Document known-good versions
   - Test rollback procedures

## 📚 Related Documentation

- [Workflow Environments](./WORKFLOW_ENVIRONMENTS.md)
- [Environment Management](./ENVIRONMENTS_USER_GUIDE.md)
- [Deployment History](./docs/DEPLOYMENT_HISTORY.md)

---

**Created**: October 12, 2025  
**Version**: 1.0.0  
**Status**: ✅ Implemented  
**Components**: ManualDeploymentDialog, DeploymentPanel
