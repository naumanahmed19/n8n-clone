import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import { NodeExecutionStatus } from "../types/database";
import {
  ExecutionEventData,
  ExecutionProgress,
} from "../types/execution.types";
import { logger } from "../utils/logger";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: {
    id: string;
    email: string;
  };
}

export interface SocketAuthPayload {
  id: string;
  email: string;
}

export interface ExecutionLogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
}

export class SocketService {
  private io: SocketIOServer;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();

  // Event buffering for late subscribers
  private executionEventBuffer: Map<string, ExecutionEventData[]> = new Map();
  private bufferRetentionMs = 10000; // Keep events for 10 seconds
  private bufferCleanupInterval: NodeJS.Timeout;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();

    // Start cleanup interval for event buffer
    this.bufferCleanupInterval = setInterval(() => {
      this.cleanupEventBuffer();
    }, 5000); // Clean up every 5 seconds
  }

  /**
   * Setup Socket.io authentication middleware
   */
  private setupAuthentication(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          logger.warn("Socket connection attempted without token");
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as SocketAuthPayload;

        socket.userId = decoded.id;
        socket.user = {
          id: decoded.id,
          email: decoded.email,
        };

        logger.info(`Socket authenticated for user ${decoded.id}`);
        next();
      } catch (error) {
        logger.error("Socket authentication failed:", error);
        next(new Error("Invalid authentication token"));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      logger.info(`User ${authSocket.userId} connected via Socket.io`);

      // Store authenticated socket
      this.authenticatedSockets.set(authSocket.userId, authSocket);

      // Join user-specific room for targeted broadcasts
      socket.join(`user:${authSocket.userId}`);

      // Handle execution subscription
      socket.on(
        "subscribe-execution",
        (executionId: string, callback?: Function) => {
          this.handleExecutionSubscription(authSocket, executionId, callback);
        }
      );

      // Handle execution unsubscription
      socket.on(
        "unsubscribe-execution",
        (executionId: string, callback?: Function) => {
          this.handleExecutionUnsubscription(authSocket, executionId, callback);
        }
      );

      // Handle workflow subscription (for all executions of a workflow)
      socket.on("subscribe-workflow", (workflowId: string) => {
        this.handleWorkflowSubscription(authSocket, workflowId);
      });

      // Handle workflow unsubscription
      socket.on("unsubscribe-workflow", (workflowId: string) => {
        this.handleWorkflowUnsubscription(authSocket, workflowId);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 User ${authSocket.userId} DISCONNECTED from Socket.io - Socket ID: ${socket.id}`);
        const rooms = Array.from(socket.rooms);
        console.log(`🔌 Socket was in rooms:`, rooms);
        logger.info(`User ${authSocket.userId} disconnected from Socket.io`);
        this.authenticatedSockets.delete(authSocket.userId);
      });

      // Send connection confirmation
      socket.emit("connected", {
        message: "Successfully connected to real-time updates",
        userId: authSocket.userId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Handle execution subscription
   */
  private handleExecutionSubscription(
    socket: AuthenticatedSocket,
    executionId: string,
    callback?: Function
  ): void {
    logger.debug(
      `User ${socket.userId} subscribing to execution ${executionId}`
    );

    try {
      // Join execution-specific room
      socket.join(`execution:${executionId}`);

      // Send any buffered events for this execution to the new subscriber
      const bufferedEvents = this.executionEventBuffer.get(executionId);
      if (bufferedEvents && bufferedEvents.length > 0) {
        logger.info(
          `Sending ${bufferedEvents.length} buffered events for execution ${executionId} to late subscriber`
        );
        bufferedEvents.forEach((eventData) => {
          socket.emit("execution-event", eventData);
        });
      }

      // Confirm subscription with callback if provided
      if (callback) {
        callback({ success: true, executionId });
      }

      // Also emit the traditional event for compatibility
      socket.emit("execution-subscribed", {
        executionId,
        timestamp: new Date().toISOString(),
      });

      logger.info(
        `User ${socket.userId} successfully subscribed to execution ${executionId}`
      );
    } catch (error) {
      logger.error(
        `Failed to subscribe user ${socket.userId} to execution ${executionId}:`,
        error
      );

      if (callback) {
        callback({ success: false, error: "Subscription failed" });
      }
    }
  }

  /**
   * Handle execution unsubscription
   */
  private handleExecutionUnsubscription(
    socket: AuthenticatedSocket,
    executionId: string,
    callback?: Function
  ): void {
    logger.debug(
      `User ${socket.userId} unsubscribing from execution ${executionId}`
    );

    try {
      // Leave execution-specific room
      socket.leave(`execution:${executionId}`);

      // Confirm unsubscription with callback if provided
      if (callback) {
        callback({ success: true, executionId });
      }

      // Also emit the traditional event for compatibility
      socket.emit("execution-unsubscribed", {
        executionId,
        timestamp: new Date().toISOString(),
      });

      logger.info(
        `User ${socket.userId} successfully unsubscribed from execution ${executionId}`
      );
    } catch (error) {
      logger.error(
        `Failed to unsubscribe user ${socket.userId} from execution ${executionId}:`,
        error
      );

      if (callback) {
        callback({ success: false, error: "Unsubscription failed" });
      }
    }
  }

  /**
   * Handle workflow subscription
   */
  private handleWorkflowSubscription(
    socket: AuthenticatedSocket,
    workflowId: string
  ): void {
    console.log(`📡 User ${socket.userId} subscribing to workflow:${workflowId}`);
    logger.debug(`User ${socket.userId} subscribing to workflow ${workflowId}`);

    // Join workflow-specific room
    socket.join(`workflow:${workflowId}`);
    
    // Log the rooms this socket is in
    const rooms = Array.from(socket.rooms);
    console.log(`📡 Socket ${socket.id} is now in rooms:`, rooms);

    // Confirm subscription
    socket.emit("workflow-subscribed", {
      workflowId,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`✅ Workflow subscription confirmed for workflow:${workflowId}`);
  }

  /**
   * Handle workflow unsubscription
   */
  private handleWorkflowUnsubscription(
    socket: AuthenticatedSocket,
    workflowId: string
  ): void {
    console.log(`📡 User ${socket.userId} UNSUBSCRIBING from workflow:${workflowId}`);
    logger.debug(
      `User ${socket.userId} unsubscribing from workflow ${workflowId}`
    );

    // Leave workflow-specific room
    socket.leave(`workflow:${workflowId}`);

    // Confirm unsubscription
    socket.emit("workflow-unsubscribed", {
      workflowId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast execution event to subscribers
   */
  public broadcastExecutionEvent(
    executionId: string,
    eventData: ExecutionEventData,
    workflowId?: string // Optional workflow ID to also broadcast to workflow room
  ): void {
    logger.debug(
      `Broadcasting execution event for ${executionId}:`,
      eventData.type
    );

    // Add timestamp if not present
    const eventWithTimestamp = {
      ...eventData,
      executionId,
      timestamp: eventData.timestamp || new Date(),
    };

    // Buffer the event for late subscribers
    this.bufferExecutionEvent(executionId, eventWithTimestamp);

    // Emit to execution-specific room
    this.io
      .to(`execution:${executionId}`)
      .emit("execution-event", eventWithTimestamp);

    // ALSO emit to workflow room if workflowId provided
    // This allows users viewing the workflow to see webhook executions in real-time
    if (workflowId) {
      logger.debug(
        `Also broadcasting execution event to workflow room: workflow:${workflowId}`
      );
      this.io
        .to(`workflow:${workflowId}`)
        .emit("execution-event", eventWithTimestamp);
    }
  }

  /**
   * Broadcast execution progress update
   */
  public broadcastExecutionProgress(
    executionId: string,
    progress: ExecutionProgress
  ): void {
    logger.debug(`Broadcasting execution progress for ${executionId}:`, {
      completedNodes: progress.completedNodes,
      totalNodes: progress.totalNodes,
      status: progress.status,
    });

    this.io.to(`execution:${executionId}`).emit("execution-progress", {
      ...progress,
      executionId,
    });
  }

  /**
   * Broadcast execution log entry
   */
  public broadcastExecutionLog(
    executionId: string,
    logEntry: ExecutionLogEntry
  ): void {
    logger.debug(`Broadcasting execution log for ${executionId}`);

    this.io.to(`execution:${executionId}`).emit("execution-log", {
      executionId,
      ...logEntry,
    });
  }

  /**
   * Broadcast node execution event
   */
  public broadcastNodeExecutionEvent(
    executionId: string,
    nodeId: string,
    eventType: "started" | "completed" | "failed",
    data?: any
  ): void {
    logger.debug(
      `Broadcasting node execution event for ${executionId}:${nodeId}:`,
      eventType
    );

    this.io.to(`execution:${executionId}`).emit("node-execution-event", {
      executionId,
      nodeId,
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast node execution state update
   */
  public broadcastNodeStateUpdate(
    executionId: string,
    nodeId: string,
    status: NodeExecutionStatus,
    data?: {
      progress?: number;
      error?: any;
      inputData?: any;
      outputData?: any;
      startTime?: number;
      endTime?: number;
      duration?: number;
    }
  ): void {
    logger.debug(
      `Broadcasting node state update for ${executionId}:${nodeId}:`,
      status
    );

    const eventData: ExecutionEventData = {
      executionId,
      type: "node-status-update",
      nodeId,
      status,
      progress: data?.progress,
      data: data
        ? {
            inputData: data.inputData,
            outputData: data.outputData,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration,
          }
        : undefined,
      error: data?.error,
      timestamp: new Date(),
    };

    this.io.to(`execution:${executionId}`).emit("execution-event", eventData);
  }

  /**
   * Broadcast execution flow status update
   */
  public broadcastExecutionFlowStatus(
    executionId: string,
    flowStatus: {
      overallStatus: "running" | "completed" | "failed" | "cancelled";
      progress: number;
      currentlyExecuting: string[];
      completedNodes: string[];
      failedNodes: string[];
      queuedNodes: string[];
      executionPath: string[];
      estimatedTimeRemaining?: number;
    }
  ): void {
    logger.debug(
      `Broadcasting execution flow status for ${executionId}:`,
      flowStatus.overallStatus
    );

    const eventData: ExecutionEventData = {
      executionId,
      type: "execution-progress",
      progress: flowStatus.progress,
      data: flowStatus,
      timestamp: new Date(),
    };

    this.io.to(`execution:${executionId}`).emit("execution-event", eventData);
  }

  /**
   * Send execution status to specific user
   */
  public sendExecutionStatusToUser(
    userId: string,
    executionId: string,
    status: any
  ): void {
    this.io.to(`user:${userId}`).emit("execution-status", {
      executionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit event to a specific user
   */
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.authenticatedSockets.size;
  }

  /**
   * Get connected users for a specific execution
   */
  public getExecutionSubscribersCount(executionId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`execution:${executionId}`);
    return room ? room.size : 0;
  }

  /**
   * Disconnect all sockets for a user (useful for logout)
   */
  public disconnectUser(userId: string): void {
    this.io.to(`user:${userId}`).disconnectSockets();
  }

  /**
   * Get Socket.io server instance
   */
  public getServer(): SocketIOServer {
    return this.io;
  }

  /**
   * Debug: Get all rooms and their clients
   */
  public getAllRooms(): Map<string, Set<string>> {
    return this.io.sockets.adapter.rooms;
  }

  /**
   * Debug: Log all workflow rooms
   */
  public logWorkflowRooms(): void {
    const rooms = this.getAllRooms();
    console.log('\n📊 === SOCKET ROOMS DEBUG ===');
    console.log(`Total rooms: ${rooms.size}`);
    
    rooms.forEach((clients, roomName) => {
      if (roomName.startsWith('workflow:')) {
        console.log(`  ${roomName}: ${clients.size} client(s)`);
        clients.forEach(clientId => {
          console.log(`    - ${clientId}`);
        });
      }
    });
    console.log('📊 === END DEBUG ===\n');
  }

  /**
   * Shutdown the socket service
   */
  public async shutdown(): Promise<void> {
    logger.info("Shutting down Socket.io service...");

    // Clear the buffer cleanup interval
    if (this.bufferCleanupInterval) {
      clearInterval(this.bufferCleanupInterval);
    }

    // Disconnect all clients
    this.io.disconnectSockets();

    // Close the server
    this.io.close();

    logger.info("Socket.io service shutdown complete");
  }

  /**
   * Buffer execution event for late subscribers
   */
  private bufferExecutionEvent(
    executionId: string,
    eventData: ExecutionEventData
  ): void {
    if (!this.executionEventBuffer.has(executionId)) {
      this.executionEventBuffer.set(executionId, []);
    }

    const buffer = this.executionEventBuffer.get(executionId)!;
    buffer.push(eventData);

    // Limit buffer size to prevent memory issues (keep last 50 events per execution)
    if (buffer.length > 50) {
      buffer.splice(0, buffer.length - 50);
    }

    logger.debug(
      `Buffered event for execution ${executionId}, buffer size: ${buffer.length}`
    );
  }

  /**
   * Clean up old buffered events
   */
  private cleanupEventBuffer(): void {
    const now = Date.now();

    for (const [executionId, events] of this.executionEventBuffer.entries()) {
      // Remove events older than retention period
      const filteredEvents = events.filter((event) => {
        const eventTime =
          event.timestamp instanceof Date
            ? event.timestamp.getTime()
            : new Date(event.timestamp).getTime();
        return now - eventTime < this.bufferRetentionMs;
      });

      if (filteredEvents.length === 0) {
        // Remove empty buffers
        this.executionEventBuffer.delete(executionId);
        logger.debug(`Cleaned up event buffer for execution ${executionId}`);
      } else {
        // Update buffer with filtered events
        this.executionEventBuffer.set(executionId, filteredEvents);
      }
    }
  }
}
