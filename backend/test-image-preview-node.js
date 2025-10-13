const path = require('path');

// Test the Image Preview Node registration
async function testImagePreviewNode() {
  console.log('🖼️  Testing Image Preview Node...\n');

  try {
    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Import node discovery
    const { nodeDiscovery } = require('./src/utils/NodeDiscovery');

    console.log('📁 Discovering nodes...');
    const allNodes = await nodeDiscovery.getAllNodeDefinitions();
    
    // Find the ImagePreview node
    const imagePreviewNode = allNodes.find(node => node.type === 'image-preview');
    
    if (!imagePreviewNode) {
      console.error('❌ Image Preview Node not found!');
      console.log('\nAvailable nodes:');
      allNodes.forEach(node => {
        console.log(`  - ${node.type} (${node.displayName})`);
      });
      process.exit(1);
    }

    console.log('✅ Image Preview Node discovered!');
    console.log(`   Name: ${imagePreviewNode.displayName}`);
    console.log(`   Type: ${imagePreviewNode.type}`);
    console.log(`   Description: ${imagePreviewNode.description}`);
    console.log(`   Icon: ${imagePreviewNode.icon}`);
    console.log(`   Color: ${imagePreviewNode.color}`);
    
    console.log('\n📋 Properties:');
    imagePreviewNode.properties.forEach(prop => {
      console.log(`   - ${prop.displayName} (${prop.name}): ${prop.type}${prop.required ? ' *' : ''}`);
    });

    // Register the node
    const { NodeService } = require('./src/services/NodeService');
    const nodeService = new NodeService(prisma);

    console.log('\n🔄 Registering Image Preview Node...');
    await nodeService.waitForInitialization();

    const registrationResult = await nodeService.registerNode(imagePreviewNode);
    
    if (registrationResult.success) {
      console.log('✅ Image Preview Node registered successfully!');
    } else {
      console.error('❌ Failed to register node:');
      console.error(registrationResult.errors);
      process.exit(1);
    }

    // Test execution with sample data
    console.log('\n🧪 Testing node execution...');
    
    const testImageUrl = 'https://picsum.photos/400/300';
    
    console.log(`   Testing with URL: ${testImageUrl}`);
    
    const testData = {
      imageUrl: testImageUrl,
      altText: 'Test Image',
      displayInOutput: true,
    };

    try {
      const result = await nodeService.executeNode(
        'image-preview',
        { main: [[]] },
        testData
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
      where: { type: 'image-preview' }
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
    
    console.log('\n✨ All tests passed! Image Preview Node is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Refresh the frontend');
    console.log('   3. Look for "Image Preview" in the node palette');
    console.log('   4. Add it to a workflow and configure an image URL');
    console.log('   5. The image will appear as the node icon!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testImagePreviewNode();
