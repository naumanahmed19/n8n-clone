# Form Generator Node - Implementation Guide

## Overview

The **Form Generator** node is a custom node that allows users to build interactive forms visually using a repeater field configuration. When the form is submitted, it triggers workflow execution with the form data, making it perfect for data collection workflows.

## Key Features

✅ **Visual Form Builder** - Configure form fields using repeater fields in the properties dialog
✅ **Multiple Field Types** - Supports 9 field types: text, email, number, textarea, select, checkbox, radio, date, file
✅ **Live Form Preview** - Interactive form visible in the expanded node view
✅ **Workflow Trigger** - Form submission automatically triggers workflow execution
✅ **Field Validation** - Built-in validation for required fields, email format, number ranges
✅ **Custom Node Type** - Uses BaseNodeWrapper pattern like ChatInterfaceNode and ImagePreviewNode
✅ **Clean Output** - Outputs simple key-value pairs: `{fieldName: fieldValue, ...}`

## Architecture

### Backend Components

#### 1. Node Definition (`form-generator.node.js`)

- **Type**: `form-generator`
- **Group**: `["input", "trigger"]`
- **Execution Capability**: `trigger`
- **Properties**: Uses `fixedCollection` type with `multipleValues` for repeater fields

#### 2. Field Configuration Structure

```javascript
{
  formFields: {
    fields: [
      {
        fieldType:
          "text" |
          "email" |
          "number" |
          "textarea" |
          "select" |
          "checkbox" |
          "radio" |
          "date" |
          "file",
        fieldLabel: "Display Label",
        fieldName: "outputKey",
        placeholder: "Optional placeholder",
        required: true / false,
        // Type-specific options...
      },
    ];
  }
}
```

### Frontend Components

#### 1. FormGeneratorNode Component (`FormGeneratorNode.tsx`)

- Uses `BaseNodeWrapper` for consistent node behavior
- Implements dynamic form rendering based on field configuration
- Handles form submission and workflow execution trigger
- Manages form state and validation

#### 2. Field Types Implementation

Each field type has its own render logic:

- **Text/Email/Number**: Standard input fields with validation
- **Textarea**: Multi-line text input with configurable rows
- **Select**: Dropdown with options parsed from newline/comma-separated string
- **Checkbox**: Single checkbox with true/false value
- **Radio**: Radio button group with multiple options
- **Date**: Date picker input
- **File**: File upload with type restrictions

## File Structure

```
backend/custom-nodes/form-generator/
├── nodes/
│   └── form-generator.node.js    # Node definition
├── index.js                       # Module exports
├── package.json                   # Package metadata
├── README.md                      # User documentation
└── IMPLEMENTATION_GUIDE.md        # This file

frontend/src/components/workflow/nodes/
├── FormGeneratorNode.tsx          # React component
└── index.ts                       # Export statement
```

## Usage Flow

### 1. Configuration Phase

```
User opens node properties
  → Configures form title & description
  → Adds form fields using repeater
  → Sets field properties (label, name, type, validation)
  → Configures submit button text
  → Saves configuration
```

### 2. Interaction Phase

```
User expands node
  → Form is rendered with all configured fields
  → User fills out the form
  → User clicks submit button
  → Form validation runs
  → If valid: workflow execution is triggered
```

### 3. Execution Phase

```
Form data is passed to node execution
  → Node processes form values
  → Outputs clean data: {fieldName: value, ...}
  → Includes metadata (_meta): formTitle, submittedAt, submissionId
  → Data flows to connected nodes
```

## Code Patterns

### Backend: Execute Function

```javascript
execute: async function (inputData) {
  const formTitle = this.getNodeParameter("formTitle");
  const formFields = this.getNodeParameter("formFields");
  const items = inputData.main?.[0] || [];

  // Extract form data from submission
  if (items.length > 0) {
    return items.map(item => ({
      json: {
        ...item.json,
        _meta: {
          formTitle,
          submittedAt: new Date().toISOString(),
          submissionId: `form_${Date.now()}_${Math.random()}`
        }
      }
    }));
  }

  // Return preview data if no submission
  return [{ main: [{ json: { /* form config */ } }] }];
}
```

### Frontend: Form Submission Handler

```typescript
const handleSubmit = useCallback(
  async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate form
    if (!validateForm()) return;

    // Update node with form data
    updateNode(id, {
      parameters: {
        ...parameters,
        lastSubmission: formValues,
      },
    });

    // Trigger workflow execution
    await executeWorkflow(id, {
      formData: formValues,
      formTitle,
      submittedAt: new Date().toISOString(),
    });

    // Reset form after submission
    setFormValues(resetValues);
  },
  [validateForm, formValues, executeWorkflow]
);
```

## Field Type Examples

### Text Field Configuration

```javascript
{
  fieldType: 'text',
  fieldLabel: 'Full Name',
  fieldName: 'name',
  placeholder: 'Enter your full name',
  required: true,
  helpText: 'Please enter your first and last name'
}
```

### Email Field Configuration

```javascript
{
  fieldType: 'email',
  fieldLabel: 'Email Address',
  fieldName: 'email',
  placeholder: 'you@example.com',
  required: true
}
```

### Select Field Configuration

```javascript
{
  fieldType: 'select',
  fieldLabel: 'Country',
  fieldName: 'country',
  options: 'United States\nCanada\nUnited Kingdom\nAustralia',
  required: true
}
```

### Checkbox Field Configuration

```javascript
{
  fieldType: 'checkbox',
  fieldLabel: 'Subscribe to newsletter',
  fieldName: 'newsletter',
  required: false,
  helpText: 'Get weekly updates in your inbox'
}
```

## Output Data Structure

### Simple Form Submission

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, this is a test!",
  "newsletter": true,
  "_meta": {
    "formTitle": "Contact Form",
    "submittedAt": "2025-10-17T10:30:00.000Z",
    "submissionId": "form_1729162200000_abc123"
  }
}
```

## Validation Rules

### Built-in Validation

- **Required Fields**: Checks if value exists and is not empty
- **Email Format**: Validates email with regex pattern
- **Number Range**: Validates min/max values for number fields
- **Field Types**: Browser-native validation for email, number, date inputs

### Custom Error Messages

```typescript
const errors = {
  name: "Name is required",
  email: "Please enter a valid email address",
  age: "Value must be at least 18",
  _form: "Failed to submit form: Server error",
};
```

## Integration Points

### 1. Node Registration

The node is automatically discovered and registered by the NodeLoader service when the backend starts.

### 2. Frontend Integration

The component is registered in `WorkflowEditor.tsx`:

```typescript
const nodeTypes = {
  "form-generator": FormGeneratorNode,
  // ... other node types
};
```

### 3. Workflow Execution

Uses the same execution pattern as ChatInterfaceNode:

```typescript
await executeWorkflow(id, formData);
```

## Testing the Node

### Manual Testing Steps

1. **Start Backend & Frontend**

   ```bash
   # Backend
   cd backend && npm run dev

   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

2. **Create a Workflow**

   - Add Form Generator node
   - Open node properties
   - Configure form fields
   - Save configuration

3. **Test Form Interaction**

   - Expand the node
   - Fill out the form
   - Submit the form
   - Check execution results

4. **Verify Output**
   - Connect to another node (e.g., Code node)
   - Run the workflow
   - Inspect the data passed to the next node

### Expected Behavior

✅ Form renders correctly with all field types
✅ Validation prevents invalid submissions
✅ Submission triggers workflow execution
✅ Form data flows to connected nodes
✅ Form resets after successful submission
✅ Error messages display for validation failures

## Troubleshooting

### Node Not Appearing in Palette

- Restart the backend server
- Check browser console for errors
- Verify node is registered: Check database `NodeType` table

### Form Not Submitting

- Check browser console for JavaScript errors
- Verify workflow execution is not already running
- Ensure form validation is passing

### Data Not Flowing to Next Node

- Check workflow connections
- Verify node is not disabled
- Inspect execution results in ExecutionPanel

### Field Not Rendering

- Check field configuration in properties
- Verify fieldType is spelled correctly
- Check browser console for component errors

## Future Enhancements

### Potential Improvements

- [ ] Multi-step forms with pagination
- [ ] Conditional field visibility based on other field values
- [ ] File upload with actual file handling (not just metadata)
- [ ] Custom field templates/components
- [ ] Form styling options (colors, spacing, layout)
- [ ] Save form submissions to database
- [ ] Export form submissions as CSV/JSON
- [ ] Form analytics (submission count, completion rate)
- [ ] Pre-populate form from input data
- [ ] Custom validation rules per field

### API Enhancements

- [ ] Webhook URL for external form submissions
- [ ] Public form sharing link
- [ ] Embedded form widget
- [ ] reCAPTCHA integration
- [ ] Email notifications on submission

## Best Practices

### Configuration

1. Use descriptive field names (lowercase, no spaces)
2. Add help text for complex fields
3. Mark required fields appropriately
4. Test form before deploying workflow

### Development

1. Follow BaseNodeWrapper patterns
2. Use useMemo for expensive computations
3. Implement proper TypeScript types
4. Handle errors gracefully
5. Validate user input thoroughly

### Performance

1. Avoid unnecessary re-renders with useMemo/useCallback
2. Debounce field validation for better UX
3. Limit form field count for optimal performance
4. Use form reset to clear state after submission

## Related Documentation

- [Custom Nodes Guide](../../docs/create-custom-node/)
- [MongoDB Node Pattern](../MongoDB/)
- [ChatInterfaceNode Implementation](../../../frontend/src/components/workflow/nodes/ChatInterfaceNode.tsx)
- [BaseNodeWrapper Documentation](../../../frontend/src/components/workflow/nodes/BaseNodeWrapper.tsx)

## Support & Questions

For issues or questions about the Form Generator node:

1. Check this implementation guide
2. Review the code comments in source files
3. Test with the provided examples
4. Check backend logs for execution errors
5. Inspect browser console for frontend errors

---

**Created**: October 17, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
