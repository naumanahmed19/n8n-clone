#!/usr/bin/env node
/**
 * Script to manually register built-in nodes
 * Run this to register new built-in nodes without restarting the server
 */

import { PrismaClient } from "@prisma/client";
import { NodeService } from "../services/NodeService";

async function registerBuiltInNodes() {
  const prisma = new PrismaClient();
  const nodeService = new NodeService(prisma);

  try {
    console.log("🔄 Registering built-in nodes...\n");

    // Import all nodes
    const { DynamicPropertiesNode, CustomTemplateNode, SwitchNode } = await import("../nodes/examples");
    const { HttpRequestNode, JsonNode, SetNode, IfNode } = await import(
      "../nodes/core"
    );
    const { WebhookTriggerNode, ScheduleTriggerNode, ManualTriggerNode } =
      await import("../nodes/triggers");

    const nodes = [
      HttpRequestNode,
      JsonNode,
      SetNode,
      IfNode,
      WebhookTriggerNode,
      ScheduleTriggerNode,
      ManualTriggerNode,
      DynamicPropertiesNode,
      CustomTemplateNode,
      SwitchNode,
    ];

    let registered = 0;
    let failed = 0;

    for (const node of nodes) {
      try {
        const result = await nodeService.registerNode(node);

        if (result.success) {
          console.log(`✅ Registered: ${node.displayName} (${node.type})`);
          registered++;
        } else {
          console.error(`❌ Failed: ${node.displayName} (${node.type})`);
          result.errors?.forEach((error) => console.error(`   ${error}`));
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error registering ${node.displayName}:`, error);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Registered: ${registered}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${nodes.length}`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the registration
registerBuiltInNodes()
  .then(() => {
    console.log("\n✅ Node registration complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Node registration failed:", error);
    process.exit(1);
  });
