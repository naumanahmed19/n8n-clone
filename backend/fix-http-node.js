const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixHttpRequestNode() {
  try {
    // Get the current workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: "cmfsk7lvl0001no7v4qto4pxi" },
    });

    if (!workflow) {
      console.log("Workflow not found");
      return;
    }

    // Parse the nodes
    const nodes = Array.isArray(workflow.nodes)
      ? workflow.nodes
      : JSON.parse(workflow.nodes);

    // Find and update the HTTP Request node
    const httpRequestNode = nodes.find((n) => n.type === "http-request");
    if (httpRequestNode) {
      httpRequestNode.parameters.url =
        "https://jsonplaceholder.typicode.com/posts/1";
      console.log(
        "Updated HTTP Request node URL to:",
        httpRequestNode.parameters.url
      );

      // Update the workflow in the database
      await prisma.workflow.update({
        where: { id: "cmfsk7lvl0001no7v4qto4pxi" },
        data: {
          nodes: nodes,
        },
      });

      console.log("Workflow updated successfully");
    } else {
      console.log("HTTP Request node not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHttpRequestNode();
