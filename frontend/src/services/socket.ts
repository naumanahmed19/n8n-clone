import { io, Socket } from 'socket.io-client';

export interface ExecutionEvent {
  executionId: string;
  type: 'started' | 'node-started' | 'node-completed' | 'node-failed' | 'completed' | 'failed' | 'cancelled';
  nodeId?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    nodeId?: string;
    timestamp: Date;
  };
  timestamp: Date;
}

export interface ExecutionProgress {
  executionId: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  currentNode?: string;
  status: 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  error?: {
    message: string;
    stack?: string;
    nodeId?: string;
    timestamp: Date;
  };
}

export interface ExecutionLogEntry {
  executionId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
}

export interface NodeExecutionEvent {
  executionId: string;
  nodeId: string;
  type: 'started' | 'completed' | 'failed';
  data?: any;
  timestamp: string;
}

export type SocketEventHandler<T = any> = (data: T) => void;

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<SocketEventHandler>> = new Map();

  constructor() {
    // Don't auto-connect in constructor to avoid circular dependency
    // Connection will be initiated when needed
  }

  /**
   * Connect to Socket.io server
   */
  private async connect(token?: string): Promise<void> {
    // Dynamically import to avoid circular dependency
    if (!token) {
      const { useAuthStore } = await import('../stores/auth');
      const authStore = useAuthStore.getState();
      token = authStore.token || undefined;
    }

    if (!token) {
      console.warn('No authentication token available for Socket.io connection');
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      this.reconnectAttempts = 0;
      this.emit('socket-connected', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
      this.emit('socket-disconnected', { reason, timestamp: new Date() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('socket-error', { error: error.message, timestamp: new Date() });
      }
    });

    // Server confirmation events
    this.socket.on('connected', (data) => {
      console.log('Socket.io connection confirmed:', data);
    });

    // Execution events
    this.socket.on('execution-event', (data: ExecutionEvent) => {
      this.emit('execution-event', data);
    });

    this.socket.on('execution-progress', (data: ExecutionProgress) => {
      this.emit('execution-progress', data);
    });

    this.socket.on('execution-log', (data: ExecutionLogEntry) => {
      this.emit('execution-log', data);
    });

    this.socket.on('node-execution-event', (data: NodeExecutionEvent) => {
      this.emit('node-execution-event', data);
    });

    this.socket.on('execution-status', (data: any) => {
      this.emit('execution-status', data);
    });

    // Subscription confirmation events
    this.socket.on('execution-subscribed', (data) => {
      console.log('Subscribed to execution:', data.executionId);
      this.emit('execution-subscribed', data);
    });

    this.socket.on('execution-unsubscribed', (data) => {
      console.log('Unsubscribed from execution:', data.executionId);
      this.emit('execution-unsubscribed', data);
    });

    this.socket.on('workflow-subscribed', (data) => {
      console.log('Subscribed to workflow:', data.workflowId);
      this.emit('workflow-subscribed', data);
    });

    this.socket.on('workflow-unsubscribed', (data) => {
      console.log('Unsubscribed from workflow:', data.workflowId);
      this.emit('workflow-unsubscribed', data);
    });
  }

  /**
   * Subscribe to execution updates
   */
  public async subscribeToExecution(executionId: string): Promise<void> {
    await this.ensureConnected();
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot subscribe to execution');
      return;
    }

    console.log('Subscribing to execution:', executionId);
    this.socket.emit('subscribe-execution', executionId);
  }

  /**
   * Unsubscribe from execution updates
   */
  public async unsubscribeFromExecution(executionId: string): Promise<void> {
    await this.ensureConnected();
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot unsubscribe from execution');
      return;
    }

    console.log('Unsubscribing from execution:', executionId);
    this.socket.emit('unsubscribe-execution', executionId);
  }

  /**
   * Subscribe to workflow updates (all executions of a workflow)
   */
  public async subscribeToWorkflow(workflowId: string): Promise<void> {
    await this.ensureConnected();
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot subscribe to workflow');
      return;
    }

    console.log('Subscribing to workflow:', workflowId);
    this.socket.emit('subscribe-workflow', workflowId);
  }

  /**
   * Unsubscribe from workflow updates
   */
  public async unsubscribeFromWorkflow(workflowId: string): Promise<void> {
    await this.ensureConnected();
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot unsubscribe from workflow');
      return;
    }

    console.log('Unsubscribing from workflow:', workflowId);
    this.socket.emit('unsubscribe-workflow', workflowId);
  }

  /**
   * Add event listener
   */
  public on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  public off<T = any>(event: string, handler: SocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Emit event to local handlers
   */
  private emit<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Ensure socket is connected
   */
  private async ensureConnected(): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }
  }

  /**
   * Manually reconnect
   */
  public async reconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    } else {
      await this.connect();
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  /**
   * Update authentication token
   */
  public async updateAuth(token: string): Promise<void> {
    if (this.socket) {
      this.socket.auth = { token };
      await this.reconnect();
    } else {
      await this.connect(token);
    }
  }

  /**
   * Initialize connection with token
   */
  public async initialize(token?: string): Promise<void> {
    if (!this.socket) {
      await this.connect(token);
    }
  }
}

// Create singleton instance
export const socketService = new SocketService();

// React hook for using socket service
export const useSocket = () => {
  return socketService;
};