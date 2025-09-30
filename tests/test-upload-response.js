// Test script to check upload response structure
const path = require("path");
const {
  CustomNodeUploadHandler,
} = require("../backend/src/services/CustomNodeUploadHandler");

async function testUploadResponse() {
  try {
    const handler = new CustomNodeUploadHandler();

    // Test with one of the existing extracted packages
    const testDir = path.join(__dirname, "temp/extract/1758577102056");

    console.log("Testing upload response format...");
    const result = await handler.processExtractedContent(
      testDir,
      "test-upload.zip"
    );

    console.log("=== UPLOAD RESULT ===");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n=== BACKEND API RESPONSE FORMAT ===");
    const apiResponse = {
      success: result.success,
      message: result.message,
      data: {
        nodes: result.nodes,
        extractedPath: result.extractedPath,
      },
    };

    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testUploadResponse();
