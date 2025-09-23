// Test rupa node execution after the fix
const fetch = require("node-fetch");

async function testRupaExecution() {
  console.log("Testing rupa node execution...");

  try {
    const response = await fetch(
      "http://localhost:4000/api/executions/single-node",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add auth header if needed - you may need to get a token first
        },
        body: JSON.stringify({
          nodeId: "test-rupa-node",
          nodeType: "rupa",
          nodeData: {
            parameters: {
              operation: "a",
            },
          },
          inputData: {
            main: [
              [
                {
                  json: {
                    test: "data",
                    message: "hello from test",
                  },
                },
              ],
            ],
          },
        }),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error testing execution:", error.message);
  }
}

testRupaExecution();
