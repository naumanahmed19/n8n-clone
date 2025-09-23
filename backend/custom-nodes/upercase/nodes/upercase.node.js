const UpercaseNode = {
  type: "upercase",
  displayName: "Uppercase",
  name: "upercase",
  group: ["transform"],
  version: 1,
  description: "Convert text to uppercase",
  icon: "fa:font",
  color: "#2196F3",
  defaults: {
    name: "Uppercase",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Text to Convert to Uppercase",
      name: "text",
      type: "string",
      required: true,
      default: "",
      placeholder: "Enter text to convert to uppercase",
      description: "The text that will be converted to uppercase",
    },
  ],
  execute: async function (inputData) {
    const text = this.getNodeParameter("text");
    const items = inputData.main?.[0] || [];

    // If no input items, create a single item with the uppercase text
    if (items.length === 0) {
      const uppercaseText = text.toUpperCase();
      return [
        [
          {
            json: {
              text: text,
              uppercaseText: uppercaseText,
              processedAt: new Date().toISOString(),
            },
          },
        ],
      ];
    }

    // Process each input item and add uppercase text
    const processedItems = items.map((item) => {
      const inputText = text || item.json?.text || "";
      const uppercaseText = inputText.toUpperCase();

      return {
        json: {
          ...item.json,
          originalText: inputText,
          uppercaseText: uppercaseText,
          processedAt: new Date().toISOString(),
        },
      };
    });

    return [processedItems];
  },
};

module.exports = UpercaseNode;
