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

    // If no input items, create a default item with only selectedOperation
    const workingItems =
      items.length > 0
        ? items
        : [
            {
              selectedOperation: operation,
            },
          ];

    console.log("Working with items:", workingItems.length);

    let resultItems;

    switch (operation) {
      case "a":
        // Option A: Return selectedOperation
        resultItems = workingItems.map((item) => ({
          selectedOperation: operation,
        }));
        console.log("Option A result:", JSON.stringify(resultItems, null, 2));
        break;

      case "b":
        // Option B: Return selectedOperation
        resultItems = workingItems.map((item) => ({
          selectedOperation: operation,
        }));
        console.log("Option B result:", JSON.stringify(resultItems, null, 2));
        break;

      case "c":
        // Option C: Return selectedOperation
        resultItems = workingItems.map((item) => ({
          selectedOperation: operation,
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
