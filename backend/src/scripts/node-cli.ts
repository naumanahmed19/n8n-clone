#!/usr/bin/env node
/**
 * CLI tool for managing nodes
 * Provides commands to create, list, and manage nodes in the new structure
 */

import * as fs from "fs";
import * as path from "path";
import { nodeDiscovery } from "../utils/NodeDiscovery";

const NODES_DIR = path.join(__dirname, "..", "nodes");

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "list":
      await listNodes();
      break;
    case "create":
      await createNode(args[1]);
      break;
    case "discover":
      await discoverNodes();
      break;
    case "validate":
      await validateNodeStructure();
      break;
    default:
      showHelp();
  }
}

async function listNodes() {
  console.log("📋 Available nodes:\n");
  
  try {
    // Create discovery instance with correct path
    const { NodeDiscovery } = await import("../utils/NodeDiscovery");
    const discovery = new NodeDiscovery(NODES_DIR);
    const nodesByDir = await discovery.getNodesByDirectory();
    
    if (Object.keys(nodesByDir).length === 0) {
      console.log("   No nodes found");
      return;
    }
    
    for (const [dirName, nodes] of Object.entries(nodesByDir)) {
      console.log(`📁 ${dirName}/`);
      nodes.forEach(node => {
        console.log(`   └─ ${node.displayName} (${node.type})`);
        console.log(`      └─ ${node.description || 'No description'}`);
      });
      console.log();
    }
  } catch (error) {
    console.error("❌ Error listing nodes:", error);
  }
}

async function createNode(nodeName: string) {
  if (!nodeName) {
    console.error("❌ Please provide a node name");
    console.log("Usage: npm run nodes:create <NodeName>");
    return;
  }

  const nodeDir = path.join(NODES_DIR, nodeName);
  
  if (fs.existsSync(nodeDir)) {
    console.error(`❌ Node directory ${nodeName} already exists`);
    return;
  }

  try {
    // Create directory
    await fs.promises.mkdir(nodeDir, { recursive: true });
    
    // Create node file
    const nodeFileContent = `import {
  BuiltInNodeTypes,
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../types/node.types";

export const ${nodeName}Node: NodeDefinition = {
  type: "${nodeName.toUpperCase()}_NODE" as BuiltInNodeTypes,
  displayName: "${nodeName}",
  name: "${nodeName.toLowerCase()}",
  group: ["transform"],
  version: 1,
  description: "Description for ${nodeName} node",
  icon: "fa:gear",
  color: "#2196F3",
  defaults: {},
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Options",
      name: "options",
      type: "string",
      required: false,
      default: "",
      description: "Configuration options for this node",
    },
  ],
  execute: async (
    inputData: NodeInputData,
    properties: Record<string, any>
  ): Promise<NodeOutputData> => {
    // TODO: Implement node logic
    return {
      success: true,
      data: inputData,
    };
  },
};
`;

    const nodeFilePath = path.join(nodeDir, `${nodeName}.node.ts`);
    await fs.promises.writeFile(nodeFilePath, nodeFileContent);
    
    // Create index file
    const indexContent = `export { ${nodeName}Node } from "./${nodeName}.node";`;
    const indexPath = path.join(nodeDir, "index.ts");
    await fs.promises.writeFile(indexPath, indexContent);
    
    console.log(`✅ Created node: ${nodeName}`);
    console.log(`   📁 Directory: ${nodeDir}`);
    console.log(`   📄 Node file: ${nodeFilePath}`);
    console.log(`   📄 Index file: ${indexPath}`);
    console.log();
    console.log("🔧 Next steps:");
    console.log("   1. Edit the node implementation");
    console.log("   2. Run 'npm run nodes:register' to register the node");
    
  } catch (error) {
    console.error(`❌ Error creating node ${nodeName}:`, error);
  }
}

async function discoverNodes() {
  console.log("🔍 Discovering nodes...\n");
  
  try {
    // Create discovery instance with correct path
    const { NodeDiscovery } = await import("../utils/NodeDiscovery");
    const discovery = new NodeDiscovery(NODES_DIR);
    
    const directories = await discovery.discoverNodeDirectories();
    const nodeInfos = await discovery.loadAllNodes();
    
    console.log(`📁 Found ${directories.length} node directories:`);
    directories.forEach(dir => console.log(`   - ${dir}`));
    
    console.log(`\n📦 Loaded ${nodeInfos.length} node definitions:`);
    nodeInfos.forEach(info => {
      console.log(`   - ${info.definition.displayName} (from ${info.name}/)`);
    });
    
  } catch (error) {
    console.error("❌ Error discovering nodes:", error);
  }
}

async function validateNodeStructure() {
  console.log("🔍 Validating node structure...\n");
  
  try {
    // Create discovery instance with correct path
    const { NodeDiscovery } = await import("../utils/NodeDiscovery");
    const discovery = new NodeDiscovery(NODES_DIR);
    
    const directories = await discovery.discoverNodeDirectories();
    let valid = 0;
    let invalid = 0;
    
    for (const dir of directories) {
      const dirPath = path.join(NODES_DIR, dir);
      const isValid = await validateSingleNode(dir, dirPath);
      
      if (isValid) {
        valid++;
      } else {
        invalid++;
      }
    }
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`   ✅ Valid: ${valid}`);
    console.log(`   ❌ Invalid: ${invalid}`);
    console.log(`   📁 Total: ${directories.length}`);
    
  } catch (error) {
    console.error("❌ Error validating structure:", error);
  }
}

async function validateSingleNode(dirName: string, dirPath: string): Promise<boolean> {
  try {
    const files = await fs.promises.readdir(dirPath);
    
    // Check for required files
    const hasIndex = files.includes("index.ts");
    const hasNodeFile = files.some(file => file.endsWith(".node.ts"));
    
    if (hasIndex && hasNodeFile) {
      console.log(`✅ ${dirName} - Valid structure`);
      return true;
    } else {
      console.log(`❌ ${dirName} - Missing required files`);
      if (!hasIndex) console.log(`   - Missing index.ts`);
      if (!hasNodeFile) console.log(`   - Missing .node.ts file`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${dirName} - Error accessing directory: ${error}`);
    return false;
  }
}

function showHelp() {
  console.log("📦 Node Management CLI\n");
  console.log("Available commands:");
  console.log("  list      - List all available nodes");
  console.log("  create    - Create a new node");
  console.log("  discover  - Discover and analyze node structure");
  console.log("  validate  - Validate node directory structure");
  console.log();
  console.log("Usage:");
  console.log("  npm run nodes:list");
  console.log("  npm run nodes:create <NodeName>");
  console.log("  npm run nodes:discover");
  console.log("  npm run nodes:validate");
}

// Run the CLI
main().catch(error => {
  console.error("❌ CLI Error:", error);
  process.exit(1);
});