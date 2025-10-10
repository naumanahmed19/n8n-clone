import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import { createServer } from "http";
import { asyncHandler } from "../middleware/asyncHandler";
import ExecutionHistoryService from "../services/ExecutionHistoryService";
import { ExecutionService } from "../services/ExecutionService";
import { SocketService } from "../services/SocketService";
import { WorkflowService } from "../services/WorkflowService";
import { getTriggerService, initializeTriggerService } from "../services/triggerServiceSingleton";

const router = Router();
const prisma = new PrismaClient();

// Use lazy initialization to get services when needed
const getNodeService = () => {
  if (!global.nodeService) {
    throw new Error(
      "NodeService not initialized. Make sure the server is properly started."
    );
  }
  return global.nodeService;
};

// Initialize non-dependent services immediately
const workflowService = new WorkflowService(prisma);
const executionHistoryService = new ExecutionHistoryService(prisma);
const httpServer = createServer();
const socketService = new SocketService(httpServer);

// Lazy initialization for services that depend on NodeService
let executionService: ExecutionService;

const getExecutionService = () => {
  if (!executionService) {
    executionService = new ExecutionService(
      prisma,
      getNodeService(),
      executionHistoryService
    );
  }
  return executionService;
};

// Initialize TriggerService singleton on first access
let triggerServiceInitialized = false;
const ensureTriggerServiceInitialized = async () => {
  if (!triggerServiceInitialized) {
    await initializeTriggerService(
      prisma,
      workflowService,
      getExecutionService(),
      socketService,
      getNodeService(),
      executionHistoryService
    );
    triggerServiceInitialized = true;
  }
  return getTriggerService();
};

/**
 * Debug endpoint - List all registered webhooks
 * MUST come before /:webhookId route to avoid pattern matching conflict
 */
router.get("/debug/list", asyncHandler(async (req: Request, res: Response) => {
  const triggerService = await ensureTriggerServiceInitialized();
  const webhooks = triggerService.getRegisteredWebhooks();
  
  res.json({
    success: true,
    count: webhooks.length,
    webhooks,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Public Webhook Endpoint - handles incoming webhook requests
 * This route is accessible without authentication to allow external services to trigger workflows
 * 
 * URL format: http://localhost:4000/webhook/{webhookId}
 * Optional path: http://localhost:4000/webhook/{webhookId}/custom-path
 * 
 * Supports all HTTP methods: GET, POST, PUT, DELETE, PATCH
 */
router.all(
  "/:webhookId",
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;

    console.log(`📨 Webhook received: ${req.method} /webhook/${webhookId}`);
    console.log(`📝 Headers:`, req.headers);
    console.log(`📝 Body:`, req.body);
    console.log(`📝 Query:`, req.query);

    const webhookRequest = {
      method: req.method,
      path: req.path,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, any>,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.get("User-Agent"),
    };

    try {
      const triggerService = await ensureTriggerServiceInitialized();
      const result = await triggerService.handleWebhookTrigger(
        webhookId,
        webhookRequest
      );

      if (result.success) {
        console.log(`✅ Webhook processed successfully - Execution ID: ${result.executionId}`);
        res.status(200).json({
          success: true,
          message: "Webhook received and workflow triggered",
          executionId: result.executionId,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error(`❌ Webhook processing failed: ${result.error}`);
        const statusCode = result.error?.includes("not found")
          ? 404
          : result.error?.includes("authentication")
          ? 401
          : 400;
        
        res.status(statusCode).json({
          success: false,
          error: result.error || "Failed to process webhook",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error(`❌ Webhook error:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error processing webhook",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Route with path suffix (must come after the test route to avoid conflicts)
router.all(
  "/:webhookId/*",
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;
    const pathSuffix = req.params[0] || "";

    console.log(`📨 Webhook received: ${req.method} /webhook/${webhookId}/${pathSuffix}`);
    console.log(`📝 Headers:`, req.headers);
    console.log(`📝 Body:`, req.body);
    console.log(`📝 Query:`, req.query);

    const webhookRequest = {
      method: req.method,
      path: req.path,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, any>,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.get("User-Agent"),
    };

    try {
      const triggerService = await ensureTriggerServiceInitialized();
      const result = await triggerService.handleWebhookTrigger(
        webhookId,
        webhookRequest
      );

      if (result.success) {
        console.log(`✅ Webhook processed successfully - Execution ID: ${result.executionId}`);
        res.status(200).json({
          success: true,
          message: "Webhook received and workflow triggered",
          executionId: result.executionId,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error(`❌ Webhook processing failed: ${result.error}`);
        const statusCode = result.error?.includes("not found")
          ? 404
          : result.error?.includes("authentication")
          ? 401
          : 400;
        
        res.status(statusCode).json({
          success: false,
          error: result.error || "Failed to process webhook",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error(`❌ Webhook error:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error processing webhook",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * Webhook Test Endpoint - allows testing webhook without triggering workflow
 * Useful for debugging and validation
 */
router.post(
  "/:webhookId/test",
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookId } = req.params;

    console.log(`🧪 Webhook test: ${webhookId}`);

    // Just validate the webhook exists without triggering
    const triggerService = await ensureTriggerServiceInitialized();
    const webhookExists = (triggerService as any).webhookTriggers?.has(webhookId);

    if (webhookExists) {
      res.json({
        success: true,
        message: "Webhook is configured and ready to receive requests",
        webhookId,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Webhook not found or not active",
        webhookId,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export { router as webhookRoutes };
export default router;
