import { AIMessage, ConversationMemory } from "../../types/ai.types";

/**
 * Simple in-memory conversation manager
 * For production, this should be moved to Redis or database
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private conversations: Map<string, ConversationMemory> = new Map();
  private readonly MAX_MESSAGES = 50; // Maximum messages to keep in memory
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupOldConversations(), 60 * 60 * 1000); // Every hour
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get or create conversation memory
   */
  getMemory(sessionId: string): ConversationMemory {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const memory = this.conversations.get(sessionId)!;
    memory.updatedAt = Date.now();
    return memory;
  }

  /**
   * Add message to conversation
   */
  addMessage(sessionId: string, message: AIMessage): void {
    const memory = this.getMemory(sessionId);

    message.timestamp = message.timestamp || Date.now();
    memory.messages.push(message);
    memory.updatedAt = Date.now();

    // Prune if needed
    this.pruneMemoryIfNeeded(memory);
    this.conversations.set(sessionId, memory);
  }

  /**
   * Get all messages for a session
   */
  getMessages(sessionId: string): AIMessage[] {
    const memory = this.getMemory(sessionId);
    return [...memory.messages];
  }

  /**
   * Clear memory for a session
   */
  clearMemory(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.conversations.keys());
  }

  /**
   * Get conversation count
   */
  getConversationCount(): number {
    return this.conversations.size;
  }

  /**
   * Prune messages if exceeding limit
   */
  private pruneMemoryIfNeeded(memory: ConversationMemory): void {
    if (memory.messages.length <= this.MAX_MESSAGES) {
      return;
    }

    // Keep system message (if first) and recent messages
    const systemMessage =
      memory.messages[0]?.role === "system" ? memory.messages[0] : null;

    const recentMessages = memory.messages.slice(-this.MAX_MESSAGES);

    if (systemMessage && recentMessages[0]?.role !== "system") {
      memory.messages = [systemMessage, ...recentMessages];
    } else {
      memory.messages = recentMessages;
    }
  }

  /**
   * Cleanup conversations older than MAX_AGE_MS
   */
  private cleanupOldConversations(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, memory] of this.conversations.entries()) {
      if (now - memory.updatedAt > this.MAX_AGE_MS) {
        toDelete.push(sessionId);
      }
    }

    toDelete.forEach((sessionId) => this.conversations.delete(sessionId));

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} old conversations`);
    }
  }

  /**
   * Get memory stats
   */
  getStats() {
    const totalMessages = Array.from(this.conversations.values()).reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );

    return {
      activeConversations: this.conversations.size,
      totalMessages,
      averageMessagesPerConversation:
        this.conversations.size > 0
          ? Math.round(totalMessages / this.conversations.size)
          : 0,
    };
  }
}
