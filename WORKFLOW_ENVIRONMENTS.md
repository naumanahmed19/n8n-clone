# Workflow Environments

A comprehensive system for managing workflows across different environments (Development, Staging, Production).

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Usage Guide](#usage-guide)
- [Best Practices](#best-practices)

## Overview

The Workflow Environments feature enables you to:

- Manage separate environments for your workflows (Dev, Staging, Prod)
- Deploy workflows between environments
- Promote workflows through the deployment pipeline
- Rollback to previous versions
- Compare differences between environments
- Track deployment history

## Features

### ✅ Multi-Environment Support

- **Development** (🔧) - For testing and experimentation
- **Staging** (🔬) - For pre-production validation
- **Production** (🚀) - For live deployments

### ✅ Deployment Operations

- **Create Environment** - Initialize a new environment from current workflow
- **Deploy** - Copy workflow from one environment to another
- **Promote** - Move workflow up the deployment chain (Dev → Staging → Prod)
- **Rollback** - Revert to a previous deployment version

### ✅ Environment Management

- **Version Control** - Automatic or manual version management
- **Status Tracking** - Active, Inactive, Draft, Archived states
- **Variable Isolation** - Environment-specific variables
- **Deployment History** - Complete audit trail

### ✅ Comparison & Analysis

- **Environment Comparison** - See differences between environments
  - Node changes (added, removed, modified)
  - Connection changes
  - Trigger changes
  - Setting changes
  - Variable changes

## Architecture

### Backend Structure

```
backend/
├── src/
│   ├── types/
│   │   └── environment.ts          # TypeScript types
│   ├── services/
│   │   └── WorkflowEnvironmentService.ts  # Business logic
│   ├── routes/
│   │   └── environment.ts          # API endpoints
│   └── prisma/
│       └── schema.prisma           # Database schema
```

### Frontend Structure

```
frontend/
├── src/
│   ├── types/
│   │   └── environment.ts          # Frontend types
│   ├── services/
│   │   └── environment.ts          # API client
│   ├── stores/
│   │   └── environment.ts          # State management (Zustand)
│   └── components/
│       └── environment/
│           ├── EnvironmentSelector.tsx      # Environment dropdown
│           └── EnvironmentDeploymentDialog.tsx  # Deployment dialog
```

## API Endpoints

All endpoints require authentication.

### Get Environments

```http
GET /api/workflows/:workflowId/environments
```

### Deploy to Environment

```http
POST /api/workflows/:workflowId/environments/deploy

{
  "sourceEnvironment": "DEVELOPMENT",
  "targetEnvironment": "STAGING",
  "version": "1.1.0",
  "deploymentNote": "Feature: Added new nodes",
  "copyVariables": true,
  "activateAfterDeploy": false
}
```

### Promote Environment

```http
POST /api/workflows/:workflowId/environments/:environment/promote
```

### Rollback Environment

```http
POST /api/workflows/:workflowId/environments/:environment/rollback
```

### Compare Environments

```http
GET /api/workflows/:workflowId/environments/compare?source=DEVELOPMENT&target=STAGING
```

## Usage Guide

### 1. Create Your First Environment

```typescript
const { createEnvironment } = useEnvironmentStore();

await createEnvironment(workflowId, {
  environment: EnvironmentType.DEVELOPMENT,
  version: "1.0.0",
  deploymentNote: "Initial development environment",
});
```

### 2. Deploy to Staging

```typescript
const { deployToEnvironment } = useEnvironmentStore();

await deployToEnvironment(workflowId, {
  sourceEnvironment: EnvironmentType.DEVELOPMENT,
  targetEnvironment: EnvironmentType.STAGING,
  deploymentNote: "Ready for testing",
  copyVariables: true,
  activateAfterDeploy: false,
});
```

### 3. Promote to Production

```typescript
const { promoteEnvironment } = useEnvironmentStore();

await promoteEnvironment(workflowId, EnvironmentType.STAGING, {
  version: "2.0.0",
  deploymentNote: "Production release v2.0",
  activateAfterDeploy: true,
});
```

## Best Practices

### Environment Workflow

Follow this deployment pipeline:

```
Development → Staging → Production
    🔧          🔬           🚀
```

### Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Auto-increment for minor changes
- Manually specify for major releases

### Deployment Notes

Always include:

- What changed
- Why it changed
- Any breaking changes
- Migration steps if needed

### Security

- Production environments should be activated cautiously
- Limit who can promote to production
- Review deployment history regularly
- Use deployment notes for audit trail

---

**Created**: October 12, 2025  
**Version**: 1.0.0  
**Status**: ✅ Implemented
