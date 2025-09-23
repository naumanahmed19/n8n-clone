const _ = require("lodash");

const UpercaseNode = {
  type: "upercase",
  displayName: "Text Transformer",
  name: "upercase",
  group: ["transform"],
  version: 1,
  description: "Transform text using various formatting options",
  icon: "fa:font",
  color: "#2196F3",
  defaults: {
    name: "Text Transformer",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Transformation Type",
      name: "conversionType",
      type: "options",
      required: true,
      default: "uppercase",
      options: [
        {
          name: "Uppercase",
          value: "uppercase",
          description: "Convert text to UPPERCASE",
        },
        {
          name: "Lowercase",
          value: "lowercase",
          description: "Convert text to lowercase",
        },
        {
          name: "Title Case",
          value: "titleCase",
          description: "Convert Text To Title Case",
        },
        {
          name: "Camel Case",
          value: "camelCase",
          description: "convertTextToCamelCase",
        },
        {
          name: "Pascal Case",
          value: "pascalCase",
          description: "ConvertTextToPascalCase",
        },
        {
          name: "Snake Case",
          value: "snakeCase",
          description: "convert_text_to_snake_case",
        },
        {
          name: "Kebab Case",
          value: "kebabCase",
          description: "convert-text-to-kebab-case",
        },
        {
          name: "Start Case",
          value: "startCase",
          description: "Convert Text To Start Case",
        },
        {
          name: "Capitalize",
          value: "capitalize",
          description: "Capitalize first letter only",
        },
        {
          name: "Deburr",
          value: "deburr",
          description: "Remove diacritical marks (café → cafe)",
        },
        {
          name: "Trim",
          value: "trim",
          description: "Remove leading and trailing whitespace",
        },
        {
          name: "Reverse",
          value: "reverse",
          description: "Reverse the text",
        },
        {
          name: "Remove Spaces",
          value: "removeSpaces",
          description: "Remove all spaces from text",
        },
        {
          name: "Remove Special Characters",
          value: "removeSpecialChars",
          description: "Remove all non-alphanumeric characters",
        },
        {
          name: "Slugify",
          value: "slugify",
          description:
            "Convert to URL-friendly slug (Hello World → hello-world)",
        },
        {
          name: "Count Characters",
          value: "countChars",
          description: "Return character count instead of transformed text",
        },
        {
          name: "Count Words",
          value: "countWords",
          description: "Return word count instead of transformed text",
        },
        {
          name: "Extract Numbers",
          value: "extractNumbers",
          description: "Extract only numbers from text",
        },
        {
          name: "Extract Letters",
          value: "extractLetters",
          description: "Extract only letters from text",
        },
        {
          name: "Truncate",
          value: "truncate",
          description: "Truncate text to specified length",
        },
      ],
      description: "Choose the text transformation type",
    },
    {
      displayName: "Text to Convert",
      name: "text",
      type: "string",
      required: false,
      default: "",
      placeholder: "Enter text to convert",
      description: "The text that will be converted",
    },
    {
      displayName: "Truncate Length",
      name: "truncateLength",
      type: "number",
      required: false,
      default: 50,
      displayOptions: {
        show: {
          conversionType: ["truncate"],
        },
      },
      description: "Maximum length for truncated text",
    },
    {
      displayName: "Prefix",
      name: "prefix",
      type: "string",
      required: false,
      default: "",
      placeholder: "Text to add before",
      description: "Text to add at the beginning of the transformed text",
    },
    {
      displayName: "Postfix",
      name: "postfix",
      type: "string",
      required: false,
      default: "",
      placeholder: "Text to add after",
      description: "Text to add at the end of the transformed text",
    },
  ],
  execute: async function (inputData) {
    const conversionType = this.getNodeParameter("conversionType");
    const text = this.getNodeParameter("text");
    const prefix = this.getNodeParameter("prefix") || "";
    const postfix = this.getNodeParameter("postfix") || "";
    const truncateLength = this.getNodeParameter("truncateLength") || 50;
    const items = inputData.main?.[0] || [];

    // Function to convert text based on conversion type using lodash
    const convertText = (inputText) => {
      if (!inputText) return inputText;

      let transformedText;
      switch (conversionType) {
        case "uppercase":
          transformedText = inputText.toUpperCase();
          break;
        case "lowercase":
          transformedText = inputText.toLowerCase();
          break;
        case "titleCase":
          transformedText = _.startCase(_.toLower(inputText));
          break;
        case "camelCase":
          transformedText = _.camelCase(inputText);
          break;
        case "pascalCase":
          transformedText = _.upperFirst(_.camelCase(inputText));
          break;
        case "snakeCase":
          transformedText = _.snakeCase(inputText);
          break;
        case "kebabCase":
          transformedText = _.kebabCase(inputText);
          break;
        case "startCase":
          transformedText = _.startCase(inputText);
          break;
        case "capitalize":
          transformedText = _.capitalize(inputText.toLowerCase());
          break;
        case "deburr":
          transformedText = _.deburr(inputText);
          break;
        case "trim":
          transformedText = _.trim(inputText);
          break;
        case "reverse":
          transformedText = inputText.split("").reverse().join("");
          break;
        case "removeSpaces":
          transformedText = inputText.replace(/\s+/g, "");
          break;
        case "removeSpecialChars":
          transformedText = inputText.replace(/[^a-zA-Z0-9\s]/g, "");
          break;
        case "slugify":
          transformedText = _.kebabCase(_.deburr(inputText.toLowerCase()));
          break;
        case "countChars":
          transformedText = inputText.length.toString();
          break;
        case "countWords":
          transformedText = inputText
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0)
            .length.toString();
          break;
        case "extractNumbers":
          transformedText = inputText.replace(/[^0-9]/g, "");
          break;
        case "extractLetters":
          transformedText = inputText.replace(/[^a-zA-Z]/g, "");
          break;
        case "truncate":
          transformedText = _.truncate(inputText, { length: truncateLength });
          break;
        default:
          transformedText = inputText;
      }

      // Add prefix and postfix (except for count operations where it doesn't make sense)
      if (conversionType === "countChars" || conversionType === "countWords") {
        return transformedText;
      }

      return `${prefix}${transformedText}${postfix}`;
    };

    // If no input items, create a single item with the converted text
    if (items.length === 0) {
      const transformedText = convertText(text);

      // Create output data with appropriate fields based on operation type
      const outputData = {
        originalText: text,
        transformedText: transformedText,
        transformationType: conversionType,
        processedAt: new Date().toISOString(),
      };

      // Add prefix/postfix info only for text transformations
      if (conversionType !== "countChars" && conversionType !== "countWords") {
        outputData.prefix = prefix;
        outputData.postfix = postfix;
      }

      // Add specific metadata for certain operations
      if (conversionType === "countChars") {
        outputData.characterCount = parseInt(transformedText);
      } else if (conversionType === "countWords") {
        outputData.wordCount = parseInt(transformedText);
      } else if (conversionType === "truncate") {
        outputData.truncateLength = truncateLength;
        outputData.wasTruncated = text.length > truncateLength;
      }

      return [
        [
          {
            json: outputData,
          },
        ],
      ];
    }

    // Process each input item and add converted text
    const processedItems = items.map((item) => {
      const inputText = text || item.json?.text || "";
      const transformedText = convertText(inputText);

      // Create output data with appropriate fields based on operation type
      const outputData = {
        ...item.json,
        originalText: inputText,
        transformedText: transformedText,
        transformationType: conversionType,
        processedAt: new Date().toISOString(),
      };

      // Add prefix/postfix info only for text transformations
      if (conversionType !== "countChars" && conversionType !== "countWords") {
        outputData.prefix = prefix;
        outputData.postfix = postfix;
      }

      // Add specific metadata for certain operations
      if (conversionType === "countChars") {
        outputData.characterCount = parseInt(transformedText);
      } else if (conversionType === "countWords") {
        outputData.wordCount = parseInt(transformedText);
      } else if (conversionType === "truncate") {
        outputData.truncateLength = truncateLength;
        outputData.wasTruncated = inputText.length > truncateLength;
      }

      return {
        json: outputData,
      };
    });

    return [processedItems];
  },
};

module.exports = UpercaseNode;
