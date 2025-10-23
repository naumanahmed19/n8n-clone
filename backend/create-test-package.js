const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function createTestPackage() {
  console.log('📦 Creating test package for uninstall testing...\n');
  
  const tempDir = path.join(__dirname, 'temp');
  const packageDir = path.join(tempDir, 'test-uninstall-node');
  
  // Ensure directories exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  
  // Create package.json
  const packageJson = {
    name: "test-uninstall-node",
    version: "1.0.0",
    description: "Test node for uninstall functionality testing",
    main: "index.js",
    nodeDrop: {
      nodes: ["nodes/TestUninstall.node.js"]
    }
  };
  
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create nodes directory
  const nodesDir = path.join(packageDir, 'nodes');
  if (!fs.existsSync(nodesDir)) {
    fs.mkdirSync(nodesDir);
  }
  
  // Create test node file
  const nodeContent = `const TestUninstallNode = {
  type: "test-uninstall",
  displayName: "Test Uninstall Node",
  name: "testUninstall",
  group: ["Custom"],
  version: 1,
  description: "A test node for testing uninstall functionality",
  icon: "fa:test",
  color: "#ff6b6b",
  defaults: {
    name: "Test Uninstall"
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Test Message",
      name: "message",
      type: "string",
      default: "Hello from test uninstall node!",
      required: true,
      description: "A test message"
    },
    {
      displayName: "Test Number",
      name: "number",
      type: "number",
      default: 42,
      description: "A test number"
    }
  ],
  
  execute: async function(inputData) {
    const message = await this.getNodeParameter("message");
    const number = await this.getNodeParameter("number");
    
    const items = inputData.main?.[0] || [];
    const results = items.map(item => ({
      json: {
        ...item.json,
        testMessage: message,
        testNumber: number,
        processedAt: new Date().toISOString()
      }
    }));
    
    return [{ main: results }];
  }
};

module.exports = TestUninstallNode;`;
  
  fs.writeFileSync(
    path.join(nodesDir, 'TestUninstall.node.js'),
    nodeContent
  );
  
  // Create index.js
  const indexContent = `module.exports = {
  nodes: ['./nodes/TestUninstall.node.js']
};`;
  
  fs.writeFileSync(
    path.join(packageDir, 'index.js'),
    indexContent
  );
  
  // Create README
  const readmeContent = `# Test Uninstall Node

This is a test node package created for testing the uninstall functionality.

## Features
- Simple test node with basic properties
- Used to verify that uninstall removes both database entries and files
- Safe to delete

## Usage
This package is automatically created for testing purposes.
`;
  
  fs.writeFileSync(
    path.join(packageDir, 'README.md'),
    readmeContent
  );
  
  // Create ZIP file
  const zip = new AdmZip();
  
  function addDirectoryToZip(dirPath, zipPath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const zipItemPath = zipPath ? path.join(zipPath, item) : item;
      
      if (fs.statSync(fullPath).isDirectory()) {
        addDirectoryToZip(fullPath, zipItemPath);
      } else {
        zip.addLocalFile(fullPath, zipPath, item);
      }
    }
  }
  
  addDirectoryToZip(packageDir);
  
  const zipPath = path.join(tempDir, 'test-uninstall-node.zip');
  zip.writeZip(zipPath);
  
  console.log('✅ Test package created successfully!');
  console.log(`📁 Package directory: ${packageDir}`);
  console.log(`📦 ZIP file: ${zipPath}`);
  console.log(`📏 ZIP size: ${fs.statSync(zipPath).size} bytes`);
  
  console.log('\n📋 Package contents:');
  console.log('   📄 package.json');
  console.log('   📄 index.js');
  console.log('   📄 README.md');
  console.log('   📁 nodes/');
  console.log('      📄 TestUninstall.node.js');
  
  console.log('\n💡 To upload this package:');
  console.log('1. Go to http://localhost:3000 (frontend)');
  console.log('2. Navigate to node management');
  console.log(`3. Upload the ZIP file: ${zipPath}`);
  console.log('4. Then run: node test-uninstall-debug.js');
  
  return zipPath;
}

createTestPackage();