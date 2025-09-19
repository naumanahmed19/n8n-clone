import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { ExecutionEventData, ExecutionProgress } from '../types/execution.types';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: {
    id: string;
    email: string;
  };
}

export interface SocketAuthPayload {
  userId: string;
  email: string;
}

export interface ExecutionLogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
}

export class SocketService {
  private io: SocketIOServer;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
  }

  /**
   * Setup Socket.io authentication middleware
   */
  private setupAuthentication(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          logger.warn('Socket connection attempted without token');
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketAuthPayload;
        
        socket.userId = decoded.userId;
        socket.user = {
          id: decoded.userId,
          email: decoded.email
        };

        logger.info(`Socket authenticated for user ${decoded.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      logger.info(`User ${authSocket.userId} connected via Socket.io`);
      
      // Store authenticated socket
      this.authenticatedSockets.set(authSocket.userId, authSocket);

      // Join user-specific room for targeted broadcasts
      socket.join(`user:${authSocket.userId}`);

      // Handle execution subscription
      socket.on('subscribe-execution', (executionId: string) => {
        this.handleExecutionSubscription(authSocket, executionId);
      });

      // Handle execution unsubscription
      socket.on('unsubscribe-execution', (executionId: string) => {
        this.handleExecutionUnsubscription(authSocket, executionId);
      });

      // Handle workflow subscription (for all executions of a workflow)
      socket.on('subscribe-workflow', (workflowId: string) => {
        this.handleWorkflowSubscription(authSocket, workflowId);
      });

      // Handle workflow unsubscription
      socket.on('unsubscribe-workflow', (workflowId: string) => {
        this.handleWorkflowUnsubscription(authSocket, workflowId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${authSocket.userId} disconnected from Socket.io`);
        this.authenticatedSockets.delete(authSocket.userId);
      });

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Successfully connected to real-time updates',
        userId: authSocket.userId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle execution subscription
   */
  private handleExecutionSubscription(socket: AuthenticatedSocket, executionId: string): void {
    logger.debug(`User ${socket.userId} subscribing to execution ${executionId}`);
    
    // Join execution-specific room
    socket.join(`execution:${executionId}`);
    
    // Confirm subscription
    socket.emit('execution-subscribed', {
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle execution unsubscription
   */
  private handleExecutionUnsubscription(socket: AuthenticatedSocket, executionId: string): void {
    logger.debug(`User ${socket.userId} unsubscribing from execution ${executionId}`);
    
    // Leave execution-specific room
    socket.leave(`execution:${executionId}`);
    
    // Confirm unsubscription
    socket.emit('execution-unsubscribed', {
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle workflow subscription
   */
  private handleWorkflowSubscription(socket: AuthenticatedSocket, workflowId: string): void {
    logger.debug(`User ${socket.userId} subscribing to workflow ${workflowId}`);
    
    // Join workflow-specific room
    socket.join(`workflow:${workflowId}`);
    
    // Confirm subscription
    socket.emit('workflow-subscribed', {
      workflowId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle workflow unsubscription
   */
  private handleWorkflowUnsubscription(socket: AuthenticatedSocket, workflowId: string): void {
    logger.debug(`User ${socket.userId} unsubscribing from workflow ${workflowId}`);
    
    // Leave workflow-specific room
    socket.leave(`workflow:${workflowId}`);
    
    // Confirm unsubscription
    socket.emit('workflow-unsubscribed', {
      workflowId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast execution event to subscribers
   */
  public broadcastExecutionEvent(executionId: string, eventData: ExecutionEventData): void {
    logger.debug(`Broadcasting execution event for ${executionId}:`, eventData.type);
    
    // Emit to execution-specific room
    this.io.to(`execution:${executionId}`).emit('execution-event', {
      ...eventData,
      executionId
    });
  }

  /**
   * Broadcast execution progress update
   */
  public broadcastExecutionProgress(executionId: string, progress: ExecutionProgress): void {
    logger.debug(`Broadcasting execution progress for ${executionId}:`, {
      completedNodes: progress.completedNodes,
      totalNodes: progress.totalNodes,
      status: progress.status
    });
    
    this.io.to(`execution:${executionId}`).emit('execution-progress', {
      ...progress,
      executionId
    });
  }

  /**
   * Broadcast execution log entry
   */
  public broadcastExecutionLog(executionId: string, logEntry: ExecutionLogEntry): void {
    logger.debug(`Broadcasting execution log for ${executionId}`);
    
    this.io.to(`execution:${executionId}`).emit('execution-log', {
      executionId,
      ...logEntry
    });
  }

  /**
   * Broadcast node execution event
   */
  public broadcastNodeExecutionEvent(
    executionId: string,
    nodeId: string,
    eventType: 'started' | 'completed' | 'failed',
    data?: any
  ): void {
    logger.debug(`Broadcasting node execution event for ${executionId}:${nodeId}:`, eventType);
    
    this.io.to(`execution:${executionId}`).emit('node-execution-event', {
      executionId,
      nodeId,
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send execution status to specific user
   */
  public sendExecutionStatusToUser(userId: string, executionId: string, status: any): void {
    this.io.to(`user:${userId}`).emit('execution-status', {
      executionId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit event to a specific user
   */
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
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
   * Shutdown the socket service
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Socket.io service...');
    
    // Disconnect all clients
    this.io.disconnectSockets();
    
    // Close the server
    this.io.close();
    
    logger.info('Socket.io service shutdown complete');
  }
}