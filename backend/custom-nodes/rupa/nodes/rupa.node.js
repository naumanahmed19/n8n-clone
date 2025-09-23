const RupaNode = {
  type: "rupa",
  displayName: "rupa",
  name: "rupa",
  group: ["transform"],
  version: 1,
  description: "rupa",
  icon: "fa:cog",
  color: "#2196F3",
  defaults: {
    name: "rupa",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      required: true,
      default: "a",
      options: [
        {
          name: "Option A",
          value: "a",
          description: "Process the input data",
        },
        {
          name: "Option B",
          value: "b",
          description: "Process the input data",
        },
        {
          name: "Option C",
          value: "c",
          description: "Process the input data",
        },
      ],
    },
  ],
  execute: async function (inputData) {
    console.log("=== RUPA NODE EXECUTION START ===");
    console.log("Node type:", this.type || "rupa");
    console.log("Input data:", JSON.stringify(inputData, null, 2));

    const operation = this.getNodeParameter("operation");
    const items = inputData.main?.[0] || [];

    console.log("Selected operation:", operation);
    console.log("Number of input items:", items.length);
    console.log("Input items:", JSON.stringify(items, null, 2));

    // If no input items, create a default item for demonstration
    const workingItems =
      items.length > 0
        ? items
        : [
            {
              json: {
                message: "No input data provided - using default data",
                timestamp: new Date().toISOString(),
                nodeType: "rupa",
                selectedOperation: operation,
              },
            },
          ];

    console.log("Working with items:", workingItems.length);

    let resultItems;

    switch (operation) {
      case "a":
        // Option A: Process the input data
        resultItems = workingItems.map((item) => ({
          json: {
            ...item.json,
            processed: true,
            processedAt: new Date().toISOString(),
            operation: "Option A",
            originalData: item.json,
          },
        }));
        console.log("Option A result:", JSON.stringify(resultItems, null, 2));
        break;

      case "b":
        // Option B: Transform the input data
        resultItems = workingItems.map((item) => ({
          json: {
            ...item.json,
            transformed: true,
            transformedAt: new Date().toISOString(),
            operation: "Option B",
            transformedData: {
              uppercase: JSON.stringify(item.json).toUpperCase(),
              itemCount: Object.keys(item.json).length,
            },
          },
        }));
        console.log("Option B result:", JSON.stringify(resultItems, null, 2));
        break;

      case "c":
        // Option C: Enhance the input data
        resultItems = workingItems.map((item) => ({
          json: {
            ...item.json,
            enhanced: true,
            enhancedAt: new Date().toISOString(),
            operation: "Option C",
            enhancement: {
              dataType: typeof item.json,
              hasData: Object.keys(item.json).length > 0,
              summary: `Enhanced item with ${
                Object.keys(item.json).length
              } properties`,
            },
          },
        }));
        console.log("Option C result:", JSON.stringify(resultItems, null, 2));
        break;

      default:
        const error = `Unknown operation: ${operation}`;
        console.error("ERROR:", error);
        throw new Error(error);
    }

    // Return the correct structure - just the items, not wrapped in another main array
    console.log(
      "Final output structure:",
      JSON.stringify(resultItems, null, 2)
    );
    return resultItems;
  },
};

module.exports = RupaNode;
