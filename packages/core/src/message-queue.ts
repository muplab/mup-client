/**
 * MUP Message Queue
 * Message queue implementation for MUP protocol v1
 */

import {
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage
} from '@muprotocol/types';

/**
 * Message queue item
 */
export interface QueueItem {
  id: string;
  message: UIRequest | UIResponse | EventTrigger | ErrorMessage;
  timestamp: number;
  priority: number;
  retryCount: number;
  maxRetries: number;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxSize?: number;           // Maximum queue size
  defaultPriority?: number;   // Default message priority
  maxRetries?: number;        // Maximum retry attempts
  retryDelay?: number;        // Delay between retries (ms)
  processingTimeout?: number; // Processing timeout (ms)
}

/**
 * Message queue event types
 */
export type QueueEventType = 
  | 'message_added'
  | 'message_processed'
  | 'message_failed'
  | 'message_retry'
  | 'queue_full'
  | 'queue_empty';

/**
 * Queue event listener
 */
export type QueueEventListener = (data: any) => void;

/**
 * Message processor function
 */
export type MessageProcessor = (
  message: UIRequest | UIResponse | EventTrigger | ErrorMessage
) => Promise<void>;

/**
 * Message queue implementation
 */
export class MessageQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private config: Required<QueueConfig>;
  private eventListeners: Map<QueueEventType, QueueEventListener[]> = new Map();
  private processingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      defaultPriority: config.defaultPriority ?? 0,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      processingTimeout: config.processingTimeout ?? 30000
    };
  }

  /**
   * Add a message to the queue
   * @param message - Message to add
   * @param priority - Message priority (higher = more important)
   * @param maxRetries - Maximum retry attempts for this message
   * @returns Queue item ID
   */
  enqueue(
    message: UIRequest | UIResponse | EventTrigger | ErrorMessage,
    priority: number = this.config.defaultPriority,
    maxRetries: number = this.config.maxRetries
  ): string {
    if (this.queue.length >= this.config.maxSize) {
      this.emit('queue_full', { queueSize: this.queue.length });
      throw new Error('Queue is full');
    }

    const item: QueueItem = {
      id: message.message_id,
      message,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries
    };

    // Insert based on priority (higher priority first)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, item);
    this.emit('message_added', { item });

    return item.id;
  }

  /**
   * Remove a message from the queue
   * @param messageId - Message ID to remove
   * @returns True if message was removed
   */
  dequeue(messageId: string): boolean {
    const index = this.queue.findIndex(item => item.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.clearProcessingTimeout(messageId);
      return true;
    }
    return false;
  }

  /**
   * Get the next message without removing it
   * @returns Next message item or null
   */
  peek(): QueueItem | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get queue size
   * @returns Number of messages in queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   * @returns True if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all messages from queue
   */
  clear(): void {
    this.queue.forEach(item => {
      this.clearProcessingTimeout(item.id);
    });
    this.queue = [];
    this.emit('queue_empty', {});
  }

  /**
   * Start processing messages
   * @param processor - Message processor function
   */
  async startProcessing(processor: MessageProcessor): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.processing && !this.isEmpty()) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        // Set processing timeout
        const timeoutId = setTimeout(() => {
          this.handleProcessingTimeout(item);
        }, this.config.processingTimeout);
        this.processingTimeouts.set(item.id, timeoutId);

        // Process message
        await processor(item.message);
        
        // Clear timeout and emit success
        this.clearProcessingTimeout(item.id);
        this.emit('message_processed', { item });

      } catch (error) {
        this.clearProcessingTimeout(item.id);
        await this.handleProcessingError(item, error);
      }
    }

    this.processing = false;
    
    if (this.isEmpty()) {
      this.emit('queue_empty', {});
    }
  }

  /**
   * Stop processing messages
   */
  stopProcessing(): void {
    this.processing = false;
  }

  /**
   * Check if queue is currently processing
   * @returns True if processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Add event listener
   * @param event - Event type
   * @param listener - Event listener function
   */
  on(event: QueueEventType, listener: QueueEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   * @param event - Event type
   * @param listener - Event listener function
   */
  off(event: QueueEventType, listener: QueueEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get queue statistics
   * @returns Queue statistics
   */
  getStats(): {
    size: number;
    processing: boolean;
    oldestMessage?: number;
    newestMessage?: number;
    averagePriority?: number;
  } {
    const stats = {
      size: this.queue.length,
      processing: this.processing
    };

    if (this.queue.length > 0) {
      const timestamps = this.queue.map(item => item.timestamp);
      const priorities = this.queue.map(item => item.priority);
      
      return {
        ...stats,
        oldestMessage: Math.min(...timestamps),
        newestMessage: Math.max(...timestamps),
        averagePriority: priorities.reduce((sum, p) => sum + p, 0) / priorities.length
      };
    }

    return stats;
  }

  /**
   * Emit event to listeners
   * @param event - Event type
   * @param data - Event data
   */
  private emit(event: QueueEventType, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in queue event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle processing error
   * @param item - Queue item that failed
   * @param error - Error that occurred
   */
  private async handleProcessingError(item: QueueItem, error: any): Promise<void> {
    item.retryCount++;

    if (item.retryCount <= item.maxRetries) {
      // Retry after delay
      this.emit('message_retry', { item, error, attempt: item.retryCount });
      
      setTimeout(() => {
        this.enqueue(item.message, item.priority, item.maxRetries);
      }, this.config.retryDelay * item.retryCount); // Exponential backoff
    } else {
      // Max retries exceeded
      this.emit('message_failed', { item, error, finalAttempt: true });
    }
  }

  /**
   * Handle processing timeout
   * @param item - Queue item that timed out
   */
  private handleProcessingTimeout(item: QueueItem): void {
    const error = new Error(`Processing timeout for message ${item.id}`);
    this.handleProcessingError(item, error);
  }

  /**
   * Clear processing timeout
   * @param messageId - Message ID
   */
  private clearProcessingTimeout(messageId: string): void {
    const timeoutId = this.processingTimeouts.get(messageId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.processingTimeouts.delete(messageId);
    }
  }
}