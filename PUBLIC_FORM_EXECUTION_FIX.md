# Public Form Execution Fix

## Problem

When submitting forms via the public form API (`/api/public/forms/:formId/submit`), the execution was not working as expected:

1. **Workflow execution was failing** - The execution payload structure didn't match the expected format
2. **WorkflowSnapshot was not being saved** - The execution record lacked proper workflow snapshot data
3. **Form data was not being passed correctly** - The form generator node wasn't receiving submitted data properly

## Root Cause

The public form submission route was using the `TriggerService` and `TriggerManager` to execute workflows, which had a different execution flow than manual execution. This resulted in:

- Missing workflow snapshot in execution records
- Incorrect data structure passed to the form generator node
- Different execution context than manual form submission

## Solution

### 1. Updated Public Form Submission Route (`backend/src/routes/public-forms.ts`)

Changed from using `TriggerService` to directly using `ExecutionService.executeWorkflow()`, matching the manual execution flow:

```typescript
// ✅ NEW: Direct ExecutionService call
const executionResult = await getExecutionService().executeWorkflow(
  targetWorkflow.id,
  targetWorkflow.userId, // Use actual workflow owner's user ID
  triggerData, // Structured trigger data
  {
    timeout: 300000,
    manual: true, // Mark as manual-like execution
  },
  formNode.id, // triggerNodeId
  workflowData // Pass complete workflow data with updated node parameters
);
```

**Key Changes:**

1. **Trigger Data Structure** - Now matches manual execution format:

   ```typescript
   const triggerData = {
     timestamp,
     source: "public-form",
     triggeredBy: "public",
     workflowName: targetWorkflow.name,
     nodeCount: workflowNodes.length,
     triggerNodeId: formNode.id,
     triggerNodeType: "form-generator",
     formId,
     submittedAt: timestamp,
     submissionId,
   };
   ```

2. **Workflow Data with Snapshot** - Now includes complete workflow structure:

   ```typescript
   const workflowData = {
     nodes: updatedNodes, // Nodes with submitted form data
     connections: parsedConnections,
     settings: parsedSettings,
   };
   ```

3. **Updated Node Parameters** - Form node is updated with submission data:
   ```typescript
   const updatedNodes = workflowData.nodes.map((node: any) => {
     if (node.id === formNode.id) {
       return {
         ...node,
         parameters: {
           ...node.parameters,
           submittedFormData: formData,
           lastSubmission: formData,
           submittedAt: timestamp,
         },
       };
     }
     return node;
   });
   ```

### 2. Updated Form Generator Node (`backend/custom-nodes/form-generator/nodes/form-generator.node.js`)

Fixed form data extraction to properly read from `submittedFormData` parameter:

```javascript
// Priority 1: Use submittedFormData from parameters (for public form submissions)
let actualFormData = submittedFormData;

// If not available, try to extract from itemData
if (!actualFormData || Object.keys(actualFormData).length === 0) {
  // Check nested structures or direct formData
  // ... extraction logic
}

results.push({
  json: {
    formData: actualFormData, // Now uses the correct submitted data
    formFields: processedFields,
    _meta: {
      formTitle,
      formDescription,
      submitButtonText,
      submittedAt,
      submissionId,
      ...submissionMeta,
    },
  },
});
```

## Comparison: Manual vs Public Form Execution

### Before Fix

| Aspect              | Manual Execution                     | Public Form Submission            |
| ------------------- | ------------------------------------ | --------------------------------- |
| Execution Method    | `ExecutionService.executeWorkflow()` | `TriggerManager.executeTrigger()` |
| Workflow Snapshot   | ✅ Saved                             | ❌ Missing                        |
| Form Data           | ✅ In node parameters                | ❌ In triggerData only            |
| Execution Context   | Direct                               | Through trigger system            |
| Trigger Data Format | Standard                             | Custom trigger format             |

### After Fix

| Aspect              | Manual Execution                     | Public Form Submission               |
| ------------------- | ------------------------------------ | ------------------------------------ |
| Execution Method    | `ExecutionService.executeWorkflow()` | `ExecutionService.executeWorkflow()` |
| Workflow Snapshot   | ✅ Saved                             | ✅ Saved                             |
| Form Data           | ✅ In node parameters                | ✅ In node parameters                |
| Execution Context   | Direct                               | Direct (same as manual)              |
| Trigger Data Format | Standard                             | Standard (matches manual)            |

## Execution Payload Structure

### Working Execution Payload (from manual execution)

```json
{
  "workflowId": "cmguz4qfe0001o3mkhsbonf27",
  "triggerData": {
    "timestamp": "2025-10-18T18:11:42.441Z",
    "source": "manual",
    "triggeredBy": "user",
    "workflowName": "New Workflow",
    "nodeCount": 3,
    "triggerNodeId": "node-1760735753568",
    "triggerNodeType": "form-generator"
  },
  "triggerNodeId": "node-1760735753568",
  "workflowData": {
    "nodes": [
      {
        "id": "node-1760735753568",
        "type": "form-generator",
        "parameters": {
          "submittedFormData": { "first_name": "xxx", "last_name": "yyy" },
          "lastSubmission": { "first_name": "xxx", "last_name": "yyy" },
          "submittedAt": "2025-10-18T18:11:42.324Z"
        }
      }
    ],
    "connections": [...],
    "settings": {...}
  }
}
```

### Now Matches Public Form Submission

The public form submission now generates the same structure, ensuring consistent execution behavior.

## Benefits

1. ✅ **Workflow Snapshot Saved** - Execution records now include complete workflow state
2. ✅ **Consistent Execution** - Public forms execute exactly like manual submissions
3. ✅ **Proper Form Data** - Form data correctly passed to downstream nodes
4. ✅ **Better Debugging** - Execution history shows full workflow context
5. ✅ **Real-time Updates** - Socket events properly emitted for execution progress

## Testing

To test the fix:

1. Create a workflow with a Form Generator node
2. Connect it to any downstream node (e.g., MongoDB)
3. Activate the workflow
4. Submit the form via public URL
5. Verify:
   - Execution starts and completes
   - Workflow snapshot is saved in database
   - Form data is passed to downstream nodes
   - Execution history shows complete workflow state

## Files Modified

1. `backend/src/routes/public-forms.ts` - Changed to use ExecutionService directly
2. `backend/custom-nodes/form-generator/nodes/form-generator.node.js` - Fixed form data extraction

---

**Date**: October 18, 2025
**Issue**: Public form execution not working as expected
**Status**: ✅ Fixed
