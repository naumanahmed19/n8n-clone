// Test manual node registration
const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function testManualRegistration() {
  console.log('Testing manual node registration...');
  
  try {
    // Load the rupa node directly
    const rupaNodePath = path.join(process.cwd(), 'custom-nodes', 'rupa', 'nodes', 'rupa.node.js');
    console.log('Loading node from:', rupaNodePath);
    
    // Clear require cache
    delete require.cache[require.resolve(rupaNodePath)];
    
    const nodeModule = require(rupaNodePath);
    const nodeDefinition = nodeModule.default || nodeModule.nodeDefinition || nodeModule;
    
    console.log('Node definition loaded:');
    console.log('  Type:', nodeDefinition.type);
    console.log('  Name:', nodeDefinition.name);
    console.log('  Display Name:', nodeDefinition.displayName);
    console.log('  Execute function:', typeof nodeDefinition.execute);
    
    // Now let's try to register it with a simplified NodeService mock
    // to test if the node definition is valid
    
    console.log('\nValidating node definition structure...');
    
    // Check required fields
    const requiredFields = ['type', 'displayName', 'name', 'group', 'version', 'inputs', 'outputs'];
    const missingFields = requiredFields.filter(field => !nodeDefinition[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
    } else {
      console.log('✓ All required fields present');
    }
    
    // Check execute function
    if (typeof nodeDefinition.execute === 'function') {
      console.log('✓ Execute function is present and is a function');
    } else {
      console.log('✗ Execute function missing or not a function');
    }
    
    // Check properties
    if (nodeDefinition.properties && Array.isArray(nodeDefinition.properties)) {
      console.log(`✓ Properties defined (${nodeDefinition.properties.length} properties)`);
      nodeDefinition.properties.forEach((prop, index) => {
        console.log(`    ${index + 1}. ${prop.displayName} (${prop.name})`);
      });
    } else {
      console.log('✗ Properties not defined or not an array');
    }
    
  } catch (error) {
    console.error('Error during manual registration test:', error);
  }
}

testManualRegistration();