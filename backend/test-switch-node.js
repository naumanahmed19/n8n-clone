/**
 * Quick test to verify Switch node structure
 */

async function testSwitchNode() {
  try {
    // Import the Switch node
    const { SwitchNode } = await import('./src/nodes/examples/Switch.node.ts');
    
    console.log('✅ Switch Node loaded successfully!');
    console.log('\n📋 Node Details:');
    console.log('  Type:', SwitchNode.type);
    console.log('  Display Name:', SwitchNode.displayName);
    console.log('  Group:', SwitchNode.group);
    console.log('  Properties count:', SwitchNode.properties.length);
    
    console.log('\n🔍 Properties:');
    SwitchNode.properties.forEach((prop, index) => {
      console.log(`\n  ${index + 1}. ${prop.displayName} (${prop.name})`);
      console.log(`     Type: ${prop.type}`);
      
      if (prop.type === 'collection') {
        console.log(`     Multiple Values: ${prop.typeOptions?.multipleValues}`);
        console.log(`     Button Text: ${prop.typeOptions?.multipleValueButtonText}`);
        console.log(`     Component: ${prop.component}`);
        
        if (prop.componentProps?.fields) {
          console.log(`     Nested Fields (${prop.componentProps.fields.length}):`);
          prop.componentProps.fields.forEach((field, i) => {
            console.log(`       ${i + 1}. ${field.displayName} (${field.name}) - ${field.type}`);
          });
        }
      }
      
      if (prop.options && prop.type === 'options') {
        console.log(`     Options: ${prop.options.map(o => o.name).join(', ')}`);
      }
    });
    
    console.log('\n✅ Switch node structure looks good!');
    console.log('\n💡 To see it in your UI:');
    console.log('   1. Make sure backend server is running (npm run dev)');
    console.log('   2. Refresh your frontend');
    console.log('   3. Check the node list - Switch should appear');
    console.log('   4. Click on Switch node to see the Outputs field with RepeatingField');
    
  } catch (error) {
    console.error('❌ Error loading Switch node:', error.message);
    console.error(error);
  }
}

testSwitchNode();
