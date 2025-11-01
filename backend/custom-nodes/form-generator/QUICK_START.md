# Form Generator Node - Quick Start 🚀

## What is it?

A visual form builder node that creates interactive forms and triggers workflows when submitted.

## Quick Setup (3 steps)

### 1️⃣ Add Node to Workflow

Drag "Form Generator" from the node palette to your canvas.

### 2️⃣ Configure Form Fields

Open node properties → Add fields using the repeater:

**Example Contact Form:**

```
Field 1:
  - Type: Text
  - Label: "Full Name"
  - Name: "name"
  - Required: ✓

Field 2:
  - Type: Email
  - Label: "Email Address"
  - Name: "email"
  - Required: ✓

Field 3:
  - Type: Textarea
  - Label: "Message"
  - Name: "message"
  - Rows: 4
  - Required: ✓
```

### 3️⃣ Use the Form

1. Expand the node (double-click or toggle)
2. Fill out the form
3. Click Submit
4. 🎉 Workflow executes with your data!

## Field Types

| Type        | Description           | Example Use Case        |
| ----------- | --------------------- | ----------------------- |
| 📝 Text     | Single-line text      | Name, Address, Phone    |
| 📧 Email    | Email with validation | Contact Email           |
| 🔢 Number   | Numeric input         | Age, Quantity, Price    |
| 📄 Textarea | Multi-line text       | Message, Description    |
| 📋 Select   | Dropdown menu         | Country, Category       |
| ☑️ Checkbox | Yes/No checkbox       | Newsletter subscription |
| ⭕ Radio    | Single choice         | Gender, Plan type       |
| 📅 Date     | Date picker           | Birth date, Event date  |
| 📎 File     | File upload           | Resume, Photo           |

## Field Properties

### Common Properties (All Fields)

- **Field Label**: Display name (e.g., "Full Name")
- **Field Name**: Output key (e.g., "name")
- **Required**: Make field mandatory
- **Help Text**: Additional guidance

### Type-Specific Properties

#### Text/Email/Number/Textarea

- **Placeholder**: Example text
- **Default Value**: Pre-filled value

#### Number

- **Min Value**: Minimum allowed
- **Max Value**: Maximum allowed

#### Textarea

- **Rows**: Number of visible lines

#### Select/Radio

- **Options**: One per line or comma-separated
  ```
  Option 1
  Option 2
  Option 3
  ```
  OR
  ```
  Option 1, Option 2, Option 3
  ```

#### File

- **Accept**: File type restrictions
  ```
  .pdf,.doc,.docx
  ```
  OR
  ```
  image/*
  ```

## Output Data

When submitted, form outputs clean data:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "newsletter": true,
  "_meta": {
    "formTitle": "Contact Form",
    "submittedAt": "2025-10-17T10:30:00.000Z",
    "submissionId": "form_1729162200000_abc123"
  }
}
```

Access in next node: `{{$json.name}}`, `{{$json.email}}`, etc.

## Common Patterns

### 📮 Contact Form

```
1. Text → Full Name → name
2. Email → Email → email
3. Textarea → Message → message
4. Checkbox → Subscribe → newsletter
```

### 📝 Registration Form

```
1. Text → Username → username
2. Email → Email → email
3. Number → Age → age
4. Select → Country → country
   Options: USA, Canada, UK, Australia
5. Checkbox → Terms → acceptTerms
```

### 📊 Survey Form

```
1. Text → Name → name
2. Radio → Satisfaction → satisfaction
   Options: Very Satisfied, Satisfied, Neutral, Dissatisfied
3. Textarea → Feedback → feedback
4. Number → Rating → rating (1-10)
```

### 🛒 Order Form

```
1. Text → Product Name → product
2. Number → Quantity → quantity (Min: 1)
3. Select → Size → size
   Options: Small, Medium, Large, X-Large
4. Textarea → Special Instructions → notes
```

## Tips & Tricks

### ✅ Best Practices

- Use lowercase field names without spaces (e.g., "email_address" or "emailAddress")
- Add help text for fields that need explanation
- Mark required fields to ensure data quality
- Test form before connecting to other nodes

### ⚡ Workflow Integration

```
Form Generator → Code → HTTP Request → Email
     ↓                ↓         ↓          ↓
  Collect          Process    Send to     Notify
    Data            Data       API        User
```

### 🎨 Form Customization

- **Form Title**: Main heading of your form
- **Form Description**: Subtitle/explanation text
- **Submit Button Text**: Customize button label

### 🔍 Validation

Built-in validation for:

- ✓ Required fields (shows error if empty)
- ✓ Email format (validates email@domain.com)
- ✓ Number ranges (min/max values)
- ✓ Field types (browser validation)

### 🐛 Troubleshooting

**Form not appearing?**
→ Make sure you've expanded the node (click the expand icon)

**Submission not working?**
→ Check that all required fields are filled
→ Look for red error messages below fields

**Data not flowing to next node?**
→ Verify nodes are connected
→ Check execution panel for errors

**Field not showing?**
→ Verify field name is unique
→ Check field type is set correctly

## Examples

### Simple Contact Form

```yaml
Form Title: "Get in Touch"
Form Description: "We'd love to hear from you!"
Submit Button: "Send Message"

Fields:
  - Name (text, required)
  - Email (email, required)
  - Message (textarea, 4 rows, required)
```

**Output:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "message": "I'd like to know more about your services."
}
```

### Event Registration

```yaml
Form Title: "Event Registration"
Form Description: "Register for our upcoming conference"
Submit Button: "Register Now"

Fields:
  - Full Name (text, required)
  - Email (email, required)
  - Company (text)
  - Ticket Type (select: Early Bird, Regular, VIP)
  - Dietary Restrictions (textarea, 2 rows)
  - Newsletter (checkbox)
```

**Output:**

```json
{
  "full_name": "Bob Johnson",
  "email": "bob@company.com",
  "company": "Tech Corp",
  "ticket_type": "Early Bird",
  "dietary_restrictions": "Vegetarian",
  "newsletter": true
}
```

## Next Steps

1. ✅ Create your first form
2. ✅ Test form submission
3. ✅ Connect to other nodes (Code, HTTP Request, Email)
4. ✅ Build your automation workflow!

## Need Help?

- 📖 See [Implementation Guide](./IMPLEMENTATION_GUIDE.md) for technical details
- 📖 Check [README.md](./README.md) for full documentation
- 💡 Look at example workflows in the app
- 🐛 Check browser console for errors

---

**Happy Form Building! 🎉**
