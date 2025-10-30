/**
 * Delay Node - Pauses workflow execution for a specified duration
 */

const DelayNode = {
  type: "delay",
  displayName: "Delay",
  name: "delay",
  group: ["utility"],
  version: 1,
  description: "Pause workflow execution for a specified amount of time",
  icon: "file:icon.svg",
  color: "#7B68EE",
  defaults: {
    name: "Delay",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Time Unit",
      name: "timeUnit",
      type: "options",
      default: "seconds",
      required: true,
      options: [
        {
          name: "Milliseconds",
          value: "milliseconds",
          description: "Delay in milliseconds (1/1000 of a second)",
        },
        {
          name: "Seconds",
          value: "seconds",
          description: "Delay in seconds",
        },
        {
          name: "Minutes",
          value: "minutes",
          description: "Delay in minutes",
        },
        {
          name: "Hours",
          value: "hours",
          description: "Delay in hours",
        },
      ],
      description: "The unit of time for the delay",
    },
    {
      displayName: "Amount",
      name: "amount",
      type: "number",
      default: 1,
      required: true,
      typeOptions: {
        minValue: 0,
        maxValue: 3600,
      },
      description: "The amount of time to delay",
      placeholder: "1",
    },
    {
      displayName: "Resume On",
      name: "resumeOn",
      type: "options",
      default: "afterDelay",
      options: [
        {
          name: "After Delay",
          value: "afterDelay",
          description: "Resume immediately after the delay period",
        },
      ],
      description: "When to resume workflow execution",
    },
  ],

  execute: async function (inputData) {
    const items = inputData.main?.[0] || [];
    
    // If no input items, create a default item
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    // Get delay parameters
    const timeUnit = await this.getNodeParameter("timeUnit");
    const amount = await this.getNodeParameter("amount");

    // Convert to milliseconds
    let delayMs = 0;
    switch (timeUnit) {
      case "milliseconds":
        delayMs = amount;
        break;
      case "seconds":
        delayMs = amount * 1000;
        break;
      case "minutes":
        delayMs = amount * 60 * 1000;
        break;
      case "hours":
        delayMs = amount * 60 * 60 * 1000;
        break;
      default:
        delayMs = amount * 1000;
    }

    // Log the delay
    this.logger.info(`[Delay] Starting delay of ${amount} ${timeUnit} (${delayMs}ms)`);

    const startTime = Date.now();

    // Execute the delay
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const endTime = Date.now();
    const actualDelay = endTime - startTime;

    this.logger.info(`[Delay] Delay completed. Actual delay: ${actualDelay}ms`);

    // Pass through all items with additional delay metadata
    const results = itemsToProcess.map((item) => ({
      json: {
        ...item.json,
        delayInfo: {
          requestedDelay: {
            amount,
            unit: timeUnit,
            milliseconds: delayMs,
          },
          actualDelay: {
            milliseconds: actualDelay,
            seconds: (actualDelay / 1000).toFixed(2),
          },
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        },
      },
    }));

    return [{ main: results }];
  },
};

module.exports = DelayNode;
