# Form Generator Node

Visual form builder node for workflow automation. Create custom forms with various field types and trigger workflows on submission.

## Features

- **Visual Form Builder**: Use repeater fields to add and configure form fields
- **Multiple Field Types**: Text, Email, Number, Textarea, Select, Checkbox, Radio, Date, File
- **Interactive Preview**: See and interact with your form in the expanded node view
- **Trigger Workflows**: Form submissions automatically trigger workflow execution
- **Field Validation**: Built-in validation for required fields and field types
- **Customizable**: Configure labels, placeholders, help text, and more

## Installation

```bash
npm install
```

## Usage

1. Add the Form Generator node to your workflow
2. Configure form fields using the repeater field:
   - Choose field type (text, email, number, etc.)
   - Set field label and name
   - Configure validation and options
3. Expand the node to see the live form preview
4. Fill out and submit the form to trigger the workflow
5. Access form data in subsequent nodes

## Field Types

### Text

Single-line text input with optional placeholder and default value.

### Email

Email address input with built-in validation.

### Number

Numeric input with min/max value configuration.

### Textarea

Multi-line text input with configurable rows.

### Select

Dropdown selection with custom options.

### Checkbox

Single checkbox for yes/no values.

### Radio

Radio button group for single selection from multiple options.

### Date

Date picker for date selection.

### File

File upload input with file type restrictions.

## Output

Form submissions output clean data in this format:

```json
{
  "fieldName1": "value1",
  "fieldName2": "value2",
  "_meta": {
    "formTitle": "My Form",
    "submittedAt": "2025-10-17T10:30:00.000Z",
    "submissionId": "form_1729162200000_abc123"
  }
}
```

## Example Configuration

```json
{
  "formTitle": "Contact Form",
  "formDescription": "Get in touch with us",
  "formFields": {
    "fields": [
      {
        "fieldType": "text",
        "fieldLabel": "Full Name",
        "fieldName": "name",
        "required": true,
        "placeholder": "John Doe"
      },
      {
        "fieldType": "email",
        "fieldLabel": "Email Address",
        "fieldName": "email",
        "required": true,
        "placeholder": "john@example.com"
      },
      {
        "fieldType": "textarea",
        "fieldLabel": "Message",
        "fieldName": "message",
        "required": true,
        "rows": 4,
        "placeholder": "Your message..."
      }
    ]
  },
  "submitButtonText": "Send Message"
}
```

## Use Cases

- **Contact Forms**: Collect user inquiries and feedback
- **Registration Forms**: Gather user information for sign-ups
- **Survey Forms**: Collect responses and data
- **Order Forms**: Process orders and requests
- **Feedback Forms**: Gather customer feedback
- **Application Forms**: Accept job applications or submissions

## Tips

- Use descriptive field names for easy data access in subsequent nodes
- Add help text to guide users on what to enter
- Mark important fields as required
- Use appropriate field types for data validation
- Test your form by expanding the node and submitting test data

## License

MIT
