// Main entry point for the n8n clone backend
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";

// Import routes
import { authRoutes } from "./routes/auth";
import credentialRoutes from "./routes/credentials";
import { customNodeRoutes } from "./routes/custom-nodes";
import environmentRoutes from "./routes/environment";
import executionControlRoutes from "./routes/execution-control";
import executionHistoryRoutes from "./routes/execution-history";
import executionRecoveryRoutes from "./routes/execution-recovery";
import { executionRoutes } from "./routes/executions";
import flowExecutionRoutes from "./routes/flow-execution";
import googleRoutes from "./routes/google";
import { nodeTypeRoutes } from "./routes/node-types";
import { nodeRoutes } from "./routes/nodes";
import oauthRoutes from "./routes/oauth";
import { publicFormsRoutes } from "./routes/public-forms";
import { publicChatsRoutes } from "./routes/public-chats";
import triggerRoutes from "./routes/triggers";
import userRoutes from "./routes/user.routes";
import variableRoutes from "./routes/variables";
import webhookRoutes from "./routes/webhook";
import { workflowRoutes } from "./routes/workflows";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Import services
import { PrismaClient } from "@prisma/client";
import { CredentialService } from "./services/CredentialService";
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
const credentialService = new CredentialService();
const nodeLoader = new NodeLoader(nodeService, credentialService, prisma);
const socketService = new SocketService(httpServer);

// Make services available globally for other services
declare global {
  var socketService: SocketService;
  var nodeLoader: NodeLoader;
  var nodeService: NodeService;
  var credentialService: CredentialService;
  var prisma: PrismaClient;
}
global.socketService = socketService;
global.nodeLoader = nodeLoader;
global.nodeService = nodeService;
global.credentialService = credentialService;
global.prisma = prisma;

// Initialize node systems
async function initializeNodeSystems() {
  try {
    // First, ensure built-in nodes are loaded
    console.log("⏳ Initializing built-in nodes...");
    await nodeService.waitForInitialization();
    console.log("✅ Built-in nodes initialized");

    // Then, load custom nodes
    console.log("⏳ Initializing custom node system...");
    await nodeLoader.initialize();
    console.log("✅ Custom node system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize node systems:", error);
    throw error;
  }
}

// Basic middleware
app.use(helmet());
// Configure CORS origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:8080", // For widget examples
      "http://localhost:8081", // Alternative widget port
      "http://localhost:9000", // Widget examples server
      "http://127.0.0.1:8080", // Alternative localhost
      "http://127.0.0.1:8081", // Alternative localhost
      "http://127.0.0.1:9000", // Alternative localhost
    ];

// Dynamic CORS origin function
const corsOriginFunction = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Check if origin is in allowed list
  if (corsOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  // For development, allow all localhost and 127.0.0.1 origins
  if (process.env.NODE_ENV === 'development' && 
      (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return callback(null, true);
  }
  
  // Log rejected origins for debugging
  console.warn(`CORS: Rejected origin: ${origin}`);
  return callback(new Error('Not allowed by CORS'), false);
};

app.use(
  cors({
    origin: corsOriginFunction,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(compression());
app.use(cookieParser()); // Parse cookies
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
      variables: "/api/variables",
      triggers: "/api/triggers",
      webhooks: "/webhook/{webhookId}",
      webhookTest: "/webhook/{webhookId}/test",
      customNodes: "/api/custom-nodes",
      flowExecution: "/api/flow-execution",
      executionControl: "/api/execution-control",
      executionHistory: "/api/execution-history",
      executionRecovery: "/api/execution-recovery",
      oauth: "/api/oauth",
      google: "/api/google",
      health: "/health",
      publicForms: "/api/public/forms/{formId}",
      publicFormSubmit: "/api/public/forms/{formId}/submit",
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api", environmentRoutes); // Environment routes are nested under workflows
app.use("/api/executions", executionRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/node-types", nodeTypeRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/variables", variableRoutes);
app.use("/api/triggers", triggerRoutes);
app.use("/api/custom-nodes", customNodeRoutes);
app.use("/api/flow-execution", flowExecutionRoutes);
app.use("/api/execution-control", executionControlRoutes);
app.use("/api/execution-history", executionHistoryRoutes);
app.use("/api/execution-recovery", executionRecoveryRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/google", googleRoutes);

// Public API routes (no authentication required)
app.use("/api/public/forms", publicFormsRoutes);
app.use("/api/public/chats", publicChatsRoutes);

// Webhook routes (public endpoints without /api prefix for easier external integration)
app.use("/webhook", webhookRoutes);

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
  console.log(`   - Variables: http://localhost:${PORT}/api/variables`);
  console.log(`   - Triggers: http://localhost:${PORT}/api/triggers`);
  console.log(`   - Custom Nodes: http://localhost:${PORT}/api/custom-nodes`);
  console.log(`📨 Webhook endpoint (public):`);
  console.log(`   - http://localhost:${PORT}/webhook/{webhookId}`);

  // Initialize node systems after server starts
  await initializeNodeSystems();
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
