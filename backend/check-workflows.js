const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkWorkflows() {
  try {
    console.log("Checking workflows in database...\n");

    const workflows = await prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        userId: true,
        triggers: true,
      },
    });

    console.log(`Found ${workflows.length} workflows:\n`);
    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. Workflow:`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Name: ${workflow.name}`);
      console.log(`   Active: ${workflow.active}`);
      console.log(`   User ID: ${workflow.userId}`);
      console.log(`   Triggers: ${JSON.stringify(workflow.triggers, null, 2)}`);
      console.log("");
    });

    // Check for the specific workflow ID from the error
    const targetWorkflowId = "cmge0ny3c0001wa2vqj3wli5v";
    console.log(`\nChecking for workflow ID: ${targetWorkflowId}`);
    const targetWorkflow = await prisma.workflow.findUnique({
      where: { id: targetWorkflowId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (targetWorkflow) {
      console.log("✓ Workflow found!");
      console.log(JSON.stringify(targetWorkflow, null, 2));
    } else {
      console.log("✗ Workflow not found in database");
    }

    // Also check the workflow that's executing (the caller)
    const callerWorkflowId = "cmgcnct8g0003og8n3q8tpcdg";
    console.log(`\n\nChecking caller workflow ID: ${callerWorkflowId}`);
    const callerWorkflow = await prisma.workflow.findUnique({
      where: { id: callerWorkflowId },
      include: {
        nodes: {
          select: {
            id: true,
            type: true,
            position: true,
            parameters: true,
          },
        },
      },
    });

    if (callerWorkflow) {
      console.log("✓ Caller workflow found!");
      console.log(JSON.stringify(callerWorkflow, null, 2));
    } else {
      console.log("✗ Caller workflow not found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflows();
