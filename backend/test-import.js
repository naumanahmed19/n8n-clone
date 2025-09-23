// Simple compilation test
try {
  console.log("Testing import of NodeTemplateGenerator...");
  const {
    NodeTemplateGenerator,
  } = require("./src/services/NodeTemplateGenerator.ts");
  console.log("✅ Import successful");
} catch (error) {
  console.log("❌ Import failed:", error.message);
}
