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
      displayName: "Form URL",
      name: "formUrl",
      type: "custom",
      required: false,
      default: "",
      description: "Generated public URL for accessing the form",
      component: "WebhookUrlGenerator",
      componentProps: {
        mode: "production",
        urlType: "form",
      },
    },
    {
      displayName: "Form Title",
      name: "formTitle",
      type: "string",
      default: "Custom Form",
      required: true,
      tooltip: "Title displayed at the top of the form",
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
      tooltip: "Optional description shown below the form title",
      placeholder: "Fill out this form to...",
    },
    {
      displayName: "Form Fields",
      name: "formFields",
      type: "collection",
      required: false,
      default: [],
      tooltip:
        "Define the fields for your form. Click 'Add Field' to create form fields.",
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: "Add Field",
      },
      component: "RepeatingField",
      componentProps: {
        titleField: "displayName",
        fields: [
          {
            displayName: "Field Type",
            name: "type",
            type: "options",
            default: "string",
            required: true,
            tooltip: "Select the type of form field to add",
            options: [
              {
                name: "Text",
                value: "string",
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
                name: "Select/Dropdown",
                value: "options",
                description: "Dropdown selection",
              },
              {
                name: "Checkbox",
                value: "boolean",
                description: "Single checkbox",
              },
              {
                name: "Date",
                value: "dateTime",
                description: "Date picker",
              },
            ],
            description: "Type of form field",
          },
          {
            displayName: "Field Label",
            name: "displayName",
            type: "string",
            default: "",
            required: true,
            tooltip: "Label displayed for the field",
            placeholder: "Email Address",
          },
          {
            displayName: "Field Name",
            name: "name",
            type: "string",
            default: "",
            required: false,
            tooltip:
              "Unique name/key for the field (used in output data). If not provided, will be generated from the field label.",
            placeholder: "email",
          },
          {
            displayName: "Placeholder",
            name: "placeholder",
            type: "string",
            default: "",
            tooltip: "Placeholder text shown in the input",
            placeholder: "Enter your email...",
            displayOptions: {
              show: {
                type: ["string", "email", "number", "textarea"],
              },
            },
          },
          {
            displayName: "Required",
            name: "required",
            type: "boolean",
            default: false,
            tooltip: "Whether this field is required",
          },
          {
            displayName: "Default Value",
            name: "default",
            type: "string",
            default: "",
            tooltip: "Default value for the field",
            displayOptions: {
              show: {
                type: ["string", "email", "number", "textarea", "dateTime"],
              },
            },
          },
          {
            displayName: "Description",
            name: "description",
            type: "string",
            default: "",
            tooltip: "Optional help text shown below the field",
            placeholder: "We'll never share your email",
          },
          {
            displayName: "Options",
            name: "options",
            type: "string",
            typeOptions: {
              rows: 3,
            },
            default: "",
            tooltip:
              "Options for select/dropdown fields (one per line or comma-separated)",
            placeholder: "Option 1\nOption 2\nOption 3",
            displayOptions: {
              show: {
                type: ["options"],
              },
            },
          },
          {
            displayName: "Validation",
            name: "validation",
            type: "collection",
            default: {},
            tooltip: "Validation rules for the field",
            displayOptions: {
              show: {
                type: ["number"],
              },
            },
            componentProps: {
              fields: [
                {
                  displayName: "Min Value",
                  name: "min",
                  type: "number",
                  default: 0,
                  tooltip: "Minimum value",
                },
                {
                  displayName: "Max Value",
                  name: "max",
                  type: "number",
                  default: 100,
                  tooltip: "Maximum value",
                },
              ],
            },
          },
          {
            displayName: "Rows",
            name: "rows",
            type: "number",
            default: 3,
            tooltip: "Number of rows for textarea",
            displayOptions: {
              show: {
                type: ["textarea"],
              },
            },
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
      tooltip: "Text displayed on the submit button",
      placeholder: "Submit Form",
    },
    {
      displayName: "Form Protection",
      name: "formProtection",
      type: "options",
      default: "none",
      required: true,
      tooltip: "Enable credential protection for the public form",
      options: [
        {
          name: "None (Public)",
          value: "none",
          description: "Form is publicly accessible without authentication",
        },
        {
          name: "Password Protection",
          value: "password",
          description: "Require a password to access the form",
        },
        {
          name: "Access Key",
          value: "accessKey",
          description: "Require an access key to submit the form",
        },
      ],
    },
    {
      displayName: "Password",
      name: "formPassword",
      type: "string",
      default: "",
      required: true,
      tooltip: "Password required to access the form",
      placeholder: "Enter a secure password",
      displayOptions: {
        show: {
          formProtection: ["password"],
        },
      },
    },
    {
      displayName: "Access Key",
      name: "accessKey",
      type: "string",
      default: "",
      required: true,
      tooltip: "Access key required to submit the form",
      placeholder: "Enter an access key",
      displayOptions: {
        show: {
          formProtection: ["accessKey"],
        },
      },
    },
    {
      displayName: "Widget Embed Code",
      name: "widgetEmbedCode",
      type: "custom",
      required: false,
      default: "",
      description:
        "Get embed code to add this form to any website without iframes",
      component: "WidgetEmbedGenerator",
      componentProps: {
        dependsOn: ["formUrl"],
      },
    },
  ],

  execute: async function (inputData) {
    // Get form configuration - await the promises
    const formTitle = await this.getNodeParameter("formTitle");
    const formDescription = await this.getNodeParameter("formDescription");
    const formFields = await this.getNodeParameter("formFields");
    const submitButtonText = await this.getNodeParameter("submitButtonText");
    const formProtection = await this.getNodeParameter("formProtection");
    const formPassword =
      formProtection === "password"
        ? await this.getNodeParameter("formPassword")
        : null;
    const accessKey =
      formProtection === "accessKey"
        ? await this.getNodeParameter("accessKey")
        : null;
    const submittedFormData = await this.getNodeParameter("submittedFormData");

    // For trigger nodes, this executes when form is submitted
    // Check if we have submitted form data
    const items = inputData.main?.[0] || [];

    const results = [];

    // Process form fields - now using standardized structure
    const processFormFields = (fields) => {
      if (!Array.isArray(fields)) return [];
      return fields.map((field) => {
        const fieldData = field.values || field;
        // Direct mapping - no conversion needed
        return {
          name: fieldData.name,
          displayName: fieldData.displayName,
          type: fieldData.type,
          required: fieldData.required,
          default: fieldData.default,
          description: fieldData.description,
          placeholder: fieldData.placeholder,
          options: fieldData.options,
          rows: fieldData.rows,
          validation: fieldData.validation,
        };
      });
    };

    const processedFields = processFormFields(formFields);

    // Priority 1: Check if we have input items (from trigger/public form submission)
    if (items.length > 0) {
      for (const item of items) {
        const itemData = item.json || item;

        // Extract the actual form field data
        // For public form submission, triggerData contains the actual submitted form data
        // The structure is: { timestamp, source, triggerNodeId, formId, submittedAt, submissionId }
        // We need to get formData from the node parameters (submittedFormData)

        let actualFormData = submittedFormData;
        let submissionMeta = {};
        let submittedAt = itemData.submittedAt || new Date().toISOString();
        let submissionId =
          itemData.submissionId ||
          `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // If actualFormData is not available from parameters, try to extract from itemData
        if (!actualFormData || Object.keys(actualFormData).length === 0) {
          // Check if itemData has formData property
          if (
            itemData.formData &&
            itemData.formData.main &&
            Array.isArray(itemData.formData.main)
          ) {
            // Unwrap: main[0][0].formData contains the actual field values
            const unwrapped = itemData.formData.main[0]?.[0];
            if (unwrapped) {
              actualFormData = unwrapped.formData || unwrapped;
              submissionMeta = unwrapped._meta || itemData._meta || {};
              submittedAt =
                unwrapped.submittedAt || itemData.submittedAt || submittedAt;
              submissionId =
                unwrapped.submissionId || itemData.submissionId || submissionId;
            }
          } else if (
            itemData.formData &&
            typeof itemData.formData === "object"
          ) {
            // Direct structure: formData contains actual field values
            actualFormData = itemData.formData;
            submissionMeta = itemData._meta || {};
            submittedAt = itemData.submittedAt || submittedAt;
            submissionId = itemData.submissionId || submissionId;
          }
        }

        results.push({
          json: {
            formData: actualFormData,
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
      }
    }

    // Priority 3: Preview mode - no submission yet
    else {
      // No submission yet - return form configuration for preview
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
