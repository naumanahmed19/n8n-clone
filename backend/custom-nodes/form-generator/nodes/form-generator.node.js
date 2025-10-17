const FormGeneratorNode = {
  type: "form-generator",
  displayName: "Form Generator",
  name: "formGenerator",
  group: ["input", "trigger"],
  version: 1,
  description:
    "Generate and display interactive forms - Build custom forms visually and trigger workflows on submission",
  icon: "fa:wpforms",
  color: "#10b981",
  executionCapability: "trigger",
  defaults: {
    name: "Form Generator",
    formTitle: "Custom Form",
    formDescription: "",
    formFields: [],
    submitButtonText: "Submit",
  },
  inputs: [],
  outputs: ["main"],
  properties: [
    {
      displayName: "Form Title",
      name: "formTitle",
      type: "string",
      default: "Custom Form",
      required: true,
      description: "Title displayed at the top of the form",
      placeholder: "My Custom Form",
    },
    {
      displayName: "Form Description",
      name: "formDescription",
      type: "string",
      typeOptions: {
        rows: 2,
      },
      default: "",
      description: "Optional description shown below the form title",
      placeholder: "Fill out this form to...",
    },
    {
      displayName: "Form Fields",
      name: "formFields",
      type: "collection",
      required: false,
      default: [],
      description:
        "Define the fields for your form. Click 'Add Field' to create form fields.",
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: "Add Field",
      },
      component: "RepeatingField",
      componentProps: {
        fields: [
          {
            displayName: "Field Type",
            name: "fieldType",
            type: "options",
            default: "text",
            required: true,
            description: "Select the type of form field to add",
            options: [
              {
                name: "Text",
                value: "text",
                description: "Single-line text input",
              },
              {
                name: "Email",
                value: "email",
                description: "Email address input",
              },
              {
                name: "Number",
                value: "number",
                description: "Numeric input",
              },
              {
                name: "Textarea",
                value: "textarea",
                description: "Multi-line text input",
              },
              {
                name: "Select",
                value: "select",
                description: "Dropdown selection",
              },
              {
                name: "Checkbox",
                value: "checkbox",
                description: "Single checkbox",
              },
              {
                name: "Radio",
                value: "radio",
                description: "Radio button group",
              },
              {
                name: "Date",
                value: "date",
                description: "Date picker",
              },
              {
                name: "File",
                value: "file",
                description: "File upload",
              },
            ],
            description: "Type of form field",
          },
          {
            displayName: "Field Label",
            name: "fieldLabel",
            type: "string",
            default: "",
            required: true,
            description: "Label displayed for the field",
            placeholder: "Email Address",
          },
          {
            displayName: "Field Name",
            name: "fieldName",
            type: "string",
            default: "",
            required: false,
            description: "Unique name/key for the field (used in output data). If not provided, will be generated from the field label.",
            placeholder: "email",
          },
          {
            displayName: "Placeholder",
            name: "placeholder",
            type: "string",
            default: "",
            description: "Placeholder text shown in the input",
            placeholder: "Enter your email...",
            displayOptions: {
              show: {
                fieldType: ["text", "email", "number", "textarea"],
              },
            },
          },
          {
            displayName: "Required",
            name: "required",
            type: "boolean",
            default: false,
            description: "Whether this field is required",
          },
          {
            displayName: "Default Value",
            name: "defaultValue",
            type: "string",
            default: "",
            description: "Default value for the field",
            displayOptions: {
              show: {
                fieldType: ["text", "email", "number", "textarea", "date"],
              },
            },
          },
          {
            displayName: "Options",
            name: "options",
            type: "string",
            typeOptions: {
              rows: 3,
            },
            default: "",
            description:
              "Options for select/radio fields (one per line or comma-separated)",
            placeholder: "Option 1\nOption 2\nOption 3",
            displayOptions: {
              show: {
                fieldType: ["select", "radio"],
              },
            },
          },
          {
            displayName: "Min Value",
            name: "min",
            type: "number",
            default: 0,
            description: "Minimum value for number fields",
            displayOptions: {
              show: {
                fieldType: ["number"],
              },
            },
          },
          {
            displayName: "Max Value",
            name: "max",
            type: "number",
            default: 100,
            description: "Maximum value for number fields",
            displayOptions: {
              show: {
                fieldType: ["number"],
              },
            },
          },
          {
            displayName: "Rows",
            name: "rows",
            type: "number",
            default: 3,
            description: "Number of rows for textarea",
            displayOptions: {
              show: {
                fieldType: ["textarea"],
              },
            },
          },
          {
            displayName: "Accept File Types",
            name: "accept",
            type: "string",
            default: "",
            description:
              "Accepted file types (e.g., .pdf,.doc,.docx or image/*)",
            placeholder: ".pdf,.doc,.docx",
            displayOptions: {
              show: {
                fieldType: ["file"],
              },
            },
          },
          {
            displayName: "Help Text",
            name: "helpText",
            type: "string",
            default: "",
            description: "Optional help text shown below the field",
            placeholder: "We'll never share your email",
          },
        ],
      },
    },
    {
      displayName: "Submit Button Text",
      name: "submitButtonText",
      type: "string",
      default: "Submit",
      required: true,
      description: "Text displayed on the submit button",
      placeholder: "Submit Form",
    },
  ],

  execute: async function (inputData) {
    // Get form configuration - await the promises
    const formTitle = await this.getNodeParameter("formTitle");
    const formDescription = await this.getNodeParameter("formDescription");
    const formFields = await this.getNodeParameter("formFields");
    const submitButtonText = await this.getNodeParameter("submitButtonText");
    const submittedFormData = await this.getNodeParameter("submittedFormData");
    
    console.log("=== FORM GENERATOR DEBUG ===");
    console.log("formTitle:", formTitle, "type:", typeof formTitle);
    console.log("formDescription:", formDescription, "type:", typeof formDescription);
    console.log("formFields:", JSON.stringify(formFields, null, 2));
    console.log("submitButtonText:", submitButtonText, "type:", typeof submitButtonText);
    console.log("submittedFormData:", JSON.stringify(submittedFormData, null, 2));
    console.log("=== END DEBUG ===");

    // For trigger nodes, this executes when form is submitted
    // Check if we have submitted form data
    const items = inputData.main?.[0] || [];

    const results = [];

    // If we have submitted form data from the frontend
    if (submittedFormData && typeof submittedFormData === 'object') {
      results.push({
        json: {
          formData: submittedFormData, // Wrap form data in formData object
          _meta: {
            formTitle,
            submittedAt: new Date().toISOString(),
            submissionId: `form_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          },
        },
      });
    }
    // If we have input items (from form submission via inputData)
    else if (items.length > 0) {
      for (const item of items) {
        // Extract form data from the item
        const formData = item.json || item;

        // Build output with clean form data
        results.push({
          json: {
            formData, // Wrap form data in formData object
            _meta: {
              formTitle,
              submittedAt: new Date().toISOString(),
              submissionId: `form_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            },
          },
        });
      }
    } else {
      // No submission yet - return form configuration for preview
      // formFields comes as array of {id, values} from RepeatingField
      const processedFields = Array.isArray(formFields) 
        ? formFields.map((field) => {
            // Handle RepeatingField structure: {id, values: {fieldType, fieldLabel, ...}}
            const fieldData = field.values || field;
            return {
              type: fieldData.fieldType,
              label: fieldData.fieldLabel,
              name: fieldData.fieldName,
              required: fieldData.required,
              placeholder: fieldData.placeholder,
              defaultValue: fieldData.defaultValue,
              options: fieldData.options,
              helpText: fieldData.helpText,
              min: fieldData.min,
              max: fieldData.max,
              rows: fieldData.rows,
              accept: fieldData.accept,
            };
          })
        : [];

      results.push({
        json: {
          formTitle,
          formDescription,
          formFields: processedFields,
          submitButtonText,
          _isPreview: true,
        },
      });
    }

    return [{ main: results }];
  },
};

module.exports = FormGeneratorNode;
