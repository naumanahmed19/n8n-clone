const axios = require("axios");

async function testEnvironmentAPI() {
  const workflowId = "cmgmvln5j0001masaxfem815o";
  const baseURL = "http://localhost:4000/api";

  // You need to replace this with your actual auth token from cookies or localStorage
  // Check your browser DevTools > Application > Cookies > localhost:3000
  const token = "YOUR_TOKEN_HERE"; // Replace with actual token

  console.log(`Testing environment API for workflow: ${workflowId}\n`);

  try {
    // Test 1: Get environment summaries
    console.log("1. Testing GET /workflows/:workflowId/environments/summary");
    const summaryResponse = await axios.get(
      `${baseURL}/workflows/${workflowId}/environments/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ Success!");
    console.log("Response:", JSON.stringify(summaryResponse.data, null, 2));
    console.log("");

    // Test 2: Get all environments
    console.log("2. Testing GET /workflows/:workflowId/environments");
    const environmentsResponse = await axios.get(
      `${baseURL}/workflows/${workflowId}/environments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ Success!");
    console.log(
      "Response:",
      JSON.stringify(environmentsResponse.data, null, 2)
    );
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log("\n⚠️  You need to update the token in this script!");
      console.log("1. Open browser DevTools");
      console.log("2. Go to Application > Cookies > localhost:3000");
      console.log('3. Copy the "token" value');
      console.log("4. Replace YOUR_TOKEN_HERE in this script");
    }
  }
}

testEnvironmentAPI();
