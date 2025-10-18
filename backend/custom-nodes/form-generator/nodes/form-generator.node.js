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
    console.log(
      "formDescription:",
      formDescription,
      "type:",
      typeof formDescription
    );
    console.log("formFields:", JSON.stringify(formFields, null, 2));
    console.log(
      "submitButtonText:",
      submitButtonText,
      "type:",
      typeof submitButtonText
    );
    console.log(
      "submittedFormData:",
      JSON.stringify(submittedFormData, null, 2)
    );
    console.log("=== END DEBUG ===");

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

    console.log("=== CHECKING INPUT DATA ===");
    console.log("items.length:", items.length);
    console.log("items:", JSON.stringify(items, null, 2));
    console.log("=== END INPUT DATA CHECK ===");

    // Priority 1: Check if we have input items (from trigger/public form submission)
    if (items.length > 0) {
      for (const item of items) {
        console.log("=== INPUT ITEM DEBUG ===");
        console.log("item:", JSON.stringify(item, null, 2));
        console.log("=== END INPUT ITEM DEBUG ===");

        const itemData = item.json || item;

        // Extract the actual form field data
        // The trigger sends data wrapped as: { json: { formData: {...}, formId, submittedAt, ... } }
        // But execution engine wraps it further as: main: [[{ json: {...} }]]
        // So we need to check if formData contains the wrapped structure or actual data

        let actualFormData;
        let submissionMeta = {};
        let submittedAt = new Date().toISOString();
        let submissionId = `form_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Check if itemData.formData is the wrapped execution structure
        if (
          itemData.formData &&
          itemData.formData.main &&
          Array.isArray(itemData.formData.main)
        ) {
          // Unwrap: main[0][0].formData contains the actual field values
          console.log("=== UNWRAPPING NESTED STRUCTURE ===");
          const unwrapped = itemData.formData.main[0]?.[0];
          if (unwrapped) {
            actualFormData = unwrapped.formData || unwrapped;
            submissionMeta = unwrapped._meta || itemData._meta || {};
            submittedAt =
              unwrapped.submittedAt || itemData.submittedAt || submittedAt;
            submissionId =
              unwrapped.submissionId || itemData.submissionId || submissionId;
          }
        } else if (itemData.formData && typeof itemData.formData === "object") {
          // Direct structure: formData contains actual field values
          actualFormData = itemData.formData;
          submissionMeta = itemData._meta || {};
          submittedAt = itemData.submittedAt || submittedAt;
          submissionId = itemData.submissionId || submissionId;
        } else {
          // Fallback: use the item data directly
          actualFormData = itemData;
        }

        console.log("=== EXTRACTED FORM DATA ===");
        console.log("actualFormData:", JSON.stringify(actualFormData, null, 2));
        console.log("=== END EXTRACTION ===");

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
    // Priority 2: If we have submitted form data from the frontend UI node
    else if (submittedFormData && typeof submittedFormData === "object") {
      console.log("=== USING SUBMITTED FORM DATA (UI) ===");
      console.log(
        "submittedFormData:",
        JSON.stringify(submittedFormData, null, 2)
      );

      results.push({
        json: {
          formData: submittedFormData,
          formFields: processedFields,
          _meta: {
            formTitle,
            formDescription,
            submitButtonText,
            submittedAt: new Date().toISOString(),
            submissionId: `form_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          },
        },
      });
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
