const DateTimeNode = require("./nodes/xdata.node.js");

// Test function
async function testDateTime() {
  console.log("🕐 Testing DateTime Node Operations\n");

  const testCases = [
    {
      name: "Get Current DateTime",
      operation: "getCurrentDateTime",
      params: {
        operation: "getCurrentDateTime",
        outputFormat: "custom",
        customFormat: "YYYY-MM-DD HH:mm:ss",
      },
    },
    {
      name: "Format DateTime",
      operation: "formatDateTime",
      params: {
        operation: "formatDateTime",
        inputDateTime: "2023-12-25T10:30:00Z",
        outputFormat: "localDateTime",
      },
    },
    {
      name: "Parse DateTime",
      operation: "parseDateTime",
      params: {
        operation: "parseDateTime",
        inputDateTime: "2023-12-25T10:30:00Z",
      },
    },
    {
      name: "Add 7 Days",
      operation: "addTime",
      params: {
        operation: "addTime",
        inputDateTime: "2023-12-25T10:30:00Z",
        timeUnit: "days",
        amount: 7,
        outputFormat: "iso",
      },
    },
    {
      name: "Calculate Difference in Hours",
      operation: "calculateDifference",
      params: {
        operation: "calculateDifference",
        inputDateTime: "2023-12-25T10:30:00Z",
        secondDateTime: "2023-12-31T23:59:59Z",
        timeUnit: "hours",
      },
    },
    {
      name: "Start of Month",
      operation: "startEndOfPeriod",
      params: {
        operation: "startEndOfPeriod",
        inputDateTime: "2023-12-25T10:30:00Z",
        period: "month",
        position: "start",
        outputFormat: "iso",
      },
    },
    {
      name: "Validate DateTime",
      operation: "validateDateTime",
      params: {
        operation: "validateDateTime",
        inputDateTime: "2023-12-25T10:30:00Z",
      },
    },
    {
      name: "Convert Timezone",
      operation: "convertTimezone",
      params: {
        operation: "convertTimezone",
        inputDateTime: "2023-12-25T10:30:00Z",
        targetTimezone: "America/New_York",
        outputFormat: "iso",
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`Operation: ${testCase.operation}`);
    console.log(`Parameters:`, testCase.params);

    // Create a mock context with getNodeParameter
    const mockThis = {
      getNodeParameter: (paramName, defaultValue) => {
        return testCase.params[paramName] !== undefined
          ? testCase.params[paramName]
          : defaultValue;
      },
    };

    try {
      // Mock input data
      const inputData = {
        main: [
          [
            {
              json: {
                timestamp: new Date().toISOString(),
                testData: "sample",
              },
            },
          ],
        ],
      };

      // Execute the operation
      const result = await DateTimeNode.execute.call(mockThis, inputData);

      console.log("✅ Result:");
      console.log(JSON.stringify(result[0][0].json, null, 2));
    } catch (error) {
      console.log("❌ Error:", error.message);
      console.log("Stack:", error.stack);
    }

    console.log("─".repeat(50));
  }
}

// Run tests
console.log("🚀 Starting DateTime Node Tests...\n");
testDateTime()
  .then(() => {
    console.log("\n✨ All tests completed!");
  })
  .catch(console.error);
