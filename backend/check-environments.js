const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkEnvironments() {
  try {
    console.log("Checking workflow environments in database...\n");

    // Get all workflow environments
    const environments = await prisma.workflowEnvironment.findMany({
      include: {
        workflow: {
          select: {
            name: true,
            userId: true,
          },
        },
      },
    });

    console.log(`Found ${environments.length} environment(s):\n`);

    environments.forEach((env, index) => {
      console.log(`${index + 1}. Environment:`);
      console.log(`   ID: ${env.id}`);
      console.log(`   Workflow ID: ${env.workflowId}`);
      console.log(`   Workflow Name: ${env.workflow?.name || "N/A"}`);
      console.log(`   User ID: ${env.workflow?.userId || "N/A"}`);
      console.log(`   Environment Type: ${env.environment}`);
      console.log(`   Version: ${env.version}`);
      console.log(`   Active: ${env.active}`);
      console.log(`   Status: ${env.status}`);
      console.log(
        `   Node Count: ${
          env.nodes ? JSON.parse(JSON.stringify(env.nodes)).length : 0
        }`
      );
      console.log(`   Created At: ${env.createdAt}`);
      console.log("");
    });

    // Check if there are any workflows
    const workflows = await prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    console.log(`\nTotal workflows: ${workflows.length}`);
    workflows.forEach((w, i) => {
      console.log(`${i + 1}. ${w.name} (ID: ${w.id}, User: ${w.userId})`);
    });
  } catch (error) {
    console.error("Error checking environments:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnvironments();
