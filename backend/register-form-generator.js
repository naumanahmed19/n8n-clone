const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function checkAndRegisterNode() {
  const prisma = new PrismaClient();

  try {
    // Check if node exists
    console.log("🔍 Checking if form-generator node is registered...\n");

    const existing = await prisma.nodeType.findUnique({
      where: { type: "form-generator" },
    });

    if (existing) {
      console.log("✅ Form Generator Node is ALREADY REGISTERED!");
      console.log("   ID:", existing.id);
      console.log("   Display Name:", existing.displayName);
      console.log("   Active:", existing.active);
      console.log("   Created:", existing.createdAt);
    } else {
      console.log("❌ Form Generator Node is NOT registered");
      console.log("\n🔄 Attempting to register...\n");

      // Load the node definition
      const nodePath = path.join(
        __dirname,
        "custom-nodes",
        "form-generator",
        "nodes",
        "form-generator.node.js"
      );
      const FormGeneratorNode = require(nodePath);

      console.log("✅ Node definition loaded successfully");
      console.log("   Type:", FormGeneratorNode.type);
      console.log("   Display Name:", FormGeneratorNode.displayName);
      console.log("   Properties:", FormGeneratorNode.properties.length);

      // Register the node
      const { NodeService } = require("./dist/services/NodeService");
      const nodeService = new NodeService(prisma);

      console.log("\n⏳ Waiting for NodeService initialization...");
      await nodeService.waitForInitialization();

      console.log("📝 Registering node...");
      const result = await nodeService.registerNode(FormGeneratorNode);

      if (result.success) {
        console.log("\n✅ Form Generator Node REGISTERED SUCCESSFULLY!");
        console.log("   Node Type:", result.nodeType);
      } else {
        console.error("\n❌ Registration failed:");
        console.error(result.errors);
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndRegisterNode();
