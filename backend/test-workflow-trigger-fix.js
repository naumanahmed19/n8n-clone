const axios = require("axios");
require("dotenv").config({ path: "../.env" });

const API_URL = process.env.VITE_API_URL || "http://localhost:4000";
const BEARER_TOKEN = process.env.ADMIN_BEARER_TOKEN;

async function testWorkflowTrigger() {
  try {
    console.log("Testing Workflow Trigger Fix...\n");
    console.log("API URL:", API_URL);
    console.log("Bearer Token:", BEARER_TOKEN ? "Present" : "Missing");

    if (!BEARER_TOKEN) {
      throw new Error("ADMIN_BEARER_TOKEN is required");
    }

    // The workflow ID from the execution response
    const workflowId = "cmgcnct8g0003og8n3q8tpcdg";

    console.log("\n1. Checking workflow:", workflowId);
    const workflowResponse = await axios.get(
      `${API_URL}/api/workflows/${workflowId}`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✓ Workflow found:", workflowResponse.data.name);
    console.log("  User ID:", workflowResponse.data.userId);
    console.log("  Active:", workflowResponse.data.active);
    console.log("  Triggers:", workflowResponse.data.triggers?.length || 0);

    // Execute the workflow
    console.log("\n2. Executing workflow...");
    const executionResponse = await axios.post(
      `${API_URL}/api/workflows/${workflowId}/execute`,
      {},
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✓ Execution started:", executionResponse.data.data.id);
    console.log("  Status:", executionResponse.data.data.status);

    // Wait a bit and check the result
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n3. Checking execution result...");
    const executionId = executionResponse.data.data.id;
    const resultResponse = await axios.get(
      `${API_URL}/api/executions/${executionId}`,
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✓ Execution completed:", resultResponse.data.data.status);
    console.log(
      "  Node executions:",
      resultResponse.data.data.nodeExecutions?.length || 0
    );

    // Check for errors in node executions
    const nodeExecutions = resultResponse.data.data.nodeExecutions || [];
    for (const nodeExec of nodeExecutions) {
      console.log(`\n  Node: ${nodeExec.nodeId}`);
      console.log(`    Status: ${nodeExec.status}`);

      if (nodeExec.outputData?.main?.[0]?.json) {
        const output = nodeExec.outputData.main[0].json;
        if (output.error) {
          console.log(`    ❌ Error: ${output.error}`);
          console.log(`    Details:`, output);
        } else if (output.success) {
          console.log(
            `    ✓ Success:`,
            output.message || "Workflow triggered successfully"
          );
        } else {
          console.log(`    Output:`, JSON.stringify(output, null, 2));
        }
      }
    }

    console.log("\n✅ Test completed!");
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

testWorkflowTrigger();
