// Main entry point for the n8n clone backend
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";

// Import routes
import { authRoutes } from "./routes/auth";
import credentialRoutes from "./routes/credentials";
import { customNodeRoutes } from "./routes/custom-nodes";
import executionControlRoutes from "./routes/execution-control";
import executionHistoryRoutes from "./routes/execution-history";
import executionRecoveryRoutes from "./routes/execution-recovery";
import { executionRoutes } from "./routes/executions";
import flowExecutionRoutes from "./routes/flow-execution";
import { nodeRoutes } from "./routes/nodes";
import { nodeTypeRoutes } from "./routes/node-types";
import triggerRoutes from "./routes/triggers";
import { workflowRoutes } from "./routes/workflows";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Import services
import { PrismaClient } from "@prisma/client";
import { NodeLoader } from "./services/NodeLoader";
import { NodeService } from "./services/NodeService";
import { SocketService } from "./services/SocketService";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize services
const prisma = new PrismaClient();
const nodeService = new NodeService(prisma);
const nodeLoader = new NodeLoader(nodeService, prisma);
const socketService = new SocketService(httpServer);

// Make services available globally for other services
declare global {
  var socketService: SocketService;
  var nodeLoader: NodeLoader;
  var nodeService: NodeService;
  var prisma: PrismaClient;
}
global.socketService = socketService;
global.nodeLoader = nodeLoader;
global.nodeService = nodeService;
global.prisma = prisma;

// Initialize custom node system
async function initializeCustomNodes() {
  try {
    await nodeLoader.initialize();
    console.log("✅ Custom node system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize custom node system:", error);
  }
}

// Basic middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "n8n-clone-backend",
    version: "1.0.0",
    websocket: {
      connected_users: socketService.getConnectedUsersCount(),
    },
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "n8n Clone Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      workflows: "/api/workflows",
      executions: "/api/executions",
      nodes: "/api/nodes",
      nodeTypes: "/api/node-types",
      credentials: "/api/credentials",
      triggers: "/api/triggers",
      webhooks: "/api/triggers/webhooks",
      customNodes: "/api/custom-nodes",
      flowExecution: "/api/flow-execution",
      executionControl: "/api/execution-control",
      executionHistory: "/api/execution-history",
      executionRecovery: "/api/execution-recovery",
      health: "/health",
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/executions", executionRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/node-types", nodeTypeRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/triggers", triggerRoutes);
app.use("/api/custom-nodes", customNodeRoutes);
app.use("/api/flow-execution", flowExecutionRoutes);
app.use("/api/execution-control", executionControlRoutes);
app.use("/api/execution-history", executionHistoryRoutes);
app.use("/api/execution-recovery", executionRecoveryRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io enabled for real-time updates`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Workflows: http://localhost:${PORT}/api/workflows`);
  console.log(`   - Executions: http://localhost:${PORT}/api/executions`);
  console.log(`   - Nodes: http://localhost:${PORT}/api/nodes`);
  console.log(`   - Node Types: http://localhost:${PORT}/api/node-types`);
  console.log(`   - Credentials: http://localhost:${PORT}/api/credentials`);
  console.log(`   - Triggers: http://localhost:${PORT}/api/triggers`);
  console.log(`   - Webhooks: http://localhost:${PORT}/api/triggers/webhooks`);
  console.log(`   - Custom Nodes: http://localhost:${PORT}/api/custom-nodes`);

  // Initialize custom node system after server starts
  await initializeCustomNodes();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await nodeLoader.cleanup();
  await socketService.shutdown();
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await nodeLoader.cleanup();
  await socketService.shutdown();
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export { app };
export default app;
