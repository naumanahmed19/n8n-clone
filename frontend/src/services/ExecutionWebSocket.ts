import { NodeExecutionStatus } from "@/types/execution";
import { io, Socket } from "socket.io-client";

export interface ExecutionEventData {
  type:
    | "node-status-update"
    | "execution-progress"
    | "execution-complete"
    | "execution-error"
    | "started"
    | "node-started"
    | "node-completed"
    | "node-failed"
    | "completed"
    | "failed"
    | "cancelled";
  executionId: string;
  nodeId?: string;
  status?: NodeExecutionStatus;
  progress?: number;
  data?: any;
  error?: any;
  timestamp: number;
}

export class ExecutionWebSocket {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: ExecutionEventData) => void>> =
    new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private baseUrl: string = import.meta.env.VITE_API_URL ||
      "http://localhost:3001"
  ) {}

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.baseUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("Connected to execution WebSocket");
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        this.handleReconnect();
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
        if (reason === "io server disconnect") {
          // Server initiated disconnect, try to reconnect
          this.handleReconnect();
        }
      });

      // Listen for execution events
      this.socket.on("execution-event", (data: ExecutionEventData) => {
        this.handleExecutionEvent(data);
      });

      this.socket.on("node-execution-event", (data: ExecutionEventData) => {
        this.handleExecutionEvent(data);
      });

      this.socket.on("execution-progress", (data: ExecutionEventData) => {
        this.handleExecutionEvent(data);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Subscribe to execution updates for a specific execution
   */
  subscribeToExecution(executionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      this.socket.emit("subscribe-execution", executionId, (response: any) => {
        if (response?.success !== false) {
          console.log(`Subscribed to execution ${executionId}`);
          resolve();
        } else {
          console.error(
            `Failed to subscribe to execution ${executionId}:`,
            response?.error
          );
          reject(new Error(response?.error || "Subscription failed"));
        }
      });
    });
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribeFromExecution(executionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        resolve(); // If not connected, consider it unsubscribed
        return;
      }

      this.socket.emit(
        "unsubscribe-execution",
        executionId,
        (response: any) => {
          if (response?.success !== false) {
            console.log(`Unsubscribed from execution ${executionId}`);
            resolve();
          } else {
            console.error(
              `Failed to unsubscribe from execution ${executionId}:`,
              response?.error
            );
            reject(new Error(response?.error || "Unsubscription failed"));
          }
        }
      );
    });
  }

  /**
   * Add event listener for execution events
   */
  addEventListener(
    executionId: string,
    listener: (data: ExecutionEventData) => void
  ): () => void {
    if (!this.listeners.has(executionId)) {
      this.listeners.set(executionId, new Set());
    }

    this.listeners.get(executionId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const executionListeners = this.listeners.get(executionId);
      if (executionListeners) {
        executionListeners.delete(listener);
        if (executionListeners.size === 0) {
          this.listeners.delete(executionId);
        }
      }
    };
  }

  /**
   * Remove all listeners for an execution
   */
  removeExecutionListeners(executionId: string): void {
    this.listeners.delete(executionId);
  }

  /**
   * Handle incoming execution events
   */
  private handleExecutionEvent(data: ExecutionEventData): void {
    const executionListeners = this.listeners.get(data.executionId);
    if (executionListeners) {
      executionListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error("Error in execution event listener:", error);
        }
      });
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): "connected" | "connecting" | "disconnected" | "error" {
    if (!this.socket) return "disconnected";
    if (this.socket.connected) return "connected";
    if (this.socket.disconnected && !this.socket.connected) return "connecting";
    return "error";
  }
}

// Create singleton instance
export const executionWebSocket = new ExecutionWebSocket();
