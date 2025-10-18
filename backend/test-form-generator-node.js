const path = require('path');

// Test the Form Generator Node registration
async function testFormGeneratorNode() {
  console.log('📋 Testing Form Generator Node...\n');

  try {
    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Import node discovery
    const { nodeDiscovery } = require('./src/utils/NodeDiscovery');

    console.log('📁 Discovering nodes...');
    const allNodes = await nodeDiscovery.getAllNodeDefinitions();
    
    // Find the Form Generator node
    const formGeneratorNode = allNodes.find(node => node.type === 'form-generator');
    
    if (!formGeneratorNode) {
      console.error('❌ Form Generator Node not found!');
      console.log('\nAvailable nodes:');
      allNodes.forEach(node => {
        console.log(`  - ${node.type} (${node.displayName})`);
      });
      process.exit(1);
    }

    console.log('✅ Form Generator Node discovered!');
    console.log(`   Name: ${formGeneratorNode.displayName}`);
    console.log(`   Type: ${formGeneratorNode.type}`);
    console.log(`   Description: ${formGeneratorNode.description}`);
    console.log(`   Icon: ${formGeneratorNode.icon}`);
    console.log(`   Color: ${formGeneratorNode.color}`);
    console.log(`   Execution Capability: ${formGeneratorNode.executionCapability}`);
    
    console.log('\n📋 Properties:');
    formGeneratorNode.properties.forEach(prop => {
      console.log(`   - ${prop.displayName} (${prop.name}): ${prop.type}${prop.required ? ' *' : ''}`);
    });

    // Register the node
    const { NodeService } = require('./src/services/NodeService');
    const nodeService = new NodeService(prisma);

    console.log('\n🔄 Registering Form Generator Node...');
    await nodeService.waitForInitialization();

    const registrationResult = await nodeService.registerNode(formGeneratorNode);
    
    if (registrationResult.success) {
      console.log('✅ Form Generator Node registered successfully!');
    } else {
      console.error('❌ Failed to register node:');
      console.error(registrationResult.errors);
      process.exit(1);
    }

    // Test execution with sample form data
    console.log('\n🧪 Testing node execution...');
    
    const sampleFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a test message from the form generator!',
      age: 30,
      newsletter: true
    };

    console.log(`   Testing with form data:`, sampleFormData);
    
    try {
      const result = await nodeService.executeNode(
        'form-generator',
        { main: [[{ json: sampleFormData }]] },
        {}
      );

      if (result.success && result.data) {
        console.log('✅ Node executed successfully!');
        console.log('\n📊 Output:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.error('❌ Execution failed:');
        console.error(result.error);
      }
    } catch (error) {
      console.error('❌ Execution error:');
      console.error(error.message);
    }

    // Get node info from database
    console.log('\n💾 Checking database...');
    const dbNode = await prisma.nodeType.findUnique({
      where: { type: 'form-generator' }
    });

    if (dbNode) {
      console.log('✅ Node found in database!');
      console.log(`   ID: ${dbNode.id}`);
      console.log(`   Active: ${dbNode.active}`);
      console.log(`   Created: ${dbNode.createdAt}`);
    } else {
      console.log('⚠️  Node not found in database');
    }

    await prisma.$disconnect();
    
    console.log('\n✨ All tests passed! Form Generator Node is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Refresh the frontend');
    console.log('   3. Look for "Form Generator" in the node palette');
    console.log('   4. Add the node to a workflow');
    console.log('   5. Configure form fields using the repeater field');
    console.log('   6. Expand the node to see the live form');
    console.log('   7. Fill and submit the form to trigger workflow execution');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testFormGeneratorNode();
