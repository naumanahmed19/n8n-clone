const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflow() {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: 'cmfsk7lvl0001no7v4qto4pxi' }
    });
    
    if (workflow) {
      console.log('Workflow found:');
      console.log('Name:', workflow.name);
      console.log('Nodes:', JSON.stringify(workflow.nodes, null, 2));
      console.log('Connections:', JSON.stringify(workflow.connections, null, 2));
      
      // Check for the specific node being executed
      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : JSON.parse(workflow.nodes);
      const targetNode = nodes.find(n => n.id === 'node-1758386680468');
      if (targetNode) {
        console.log('Target node found:', JSON.stringify(targetNode, null, 2));
      } else {
        console.log('Target node node-1758386680468 not found in workflow');
        console.log('Available node IDs:', nodes.map(n => n.id));
      }
    } else {
      console.log('Workflow not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflow();