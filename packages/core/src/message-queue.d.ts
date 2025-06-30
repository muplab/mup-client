/**
 * MUP Message Queue
 * Message queue implementation for MUP protocol v1
 */
import { UIRequest, UIResponse, EventTrigger, ErrorMessage } from '@muprotocol/types';
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
    maxSize?: number;
    defaultPriority?: number;
    maxRetries?: number;
    retryDelay?: number;
    processingTimeout?: number;
}
/**
 * Message queue event types
 */
export type QueueEventType = 'message_added' | 'message_processed' | 'message_failed' | 'message_retry' | 'queue_full' | 'queue_empty';
/**
 * Queue event listener
 */
export type QueueEventListener = (data: any) => void;
/**
 * Message processor function
 */
export type MessageProcessor = (message: UIRequest | UIResponse | EventTrigger | ErrorMessage) => Promise<void>;
/**
 * Message queue implementation
 */
export declare class MessageQueue {
    private queue;
    private processing;
    private config;
    private eventListeners;
    private processingTimeouts;
    constructor(config?: QueueConfig);
    /**
     * Add a message to the queue
     * @param message - Message to add
     * @param priority - Message priority (higher = more important)
     * @param maxRetries - Maximum retry attempts for this message
     * @returns Queue item ID
     */
    enqueue(message: UIRequest | UIResponse | EventTrigger | ErrorMessage, priority?: number, maxRetries?: number): string;
    /**
     * Remove a message from the queue
     * @param messageId - Message ID to remove
     * @returns True if message was removed
     */
    dequeue(messageId: string): boolean;
    /**
     * Get the next message without removing it
     * @returns Next message item or null
     */
    peek(): QueueItem | null;
    /**
     * Get queue size
     * @returns Number of messages in queue
     */
    size(): number;
    /**
     * Check if queue is empty
     * @returns True if queue is empty
     */
    isEmpty(): boolean;
    /**
     * Clear all messages from queue
     */
    clear(): void;
    /**
     * Start processing messages
     * @param processor - Message processor function
     */
    startProcessing(processor: MessageProcessor): Promise<void>;
    /**
     * Stop processing messages
     */
    stopProcessing(): void;
    /**
     * Check if queue is currently processing
     * @returns True if processing
     */
    isProcessing(): boolean;
    /**
     * Add event listener
     * @param event - Event type
     * @param listener - Event listener function
     */
    on(event: QueueEventType, listener: QueueEventListener): void;
    /**
     * Remove event listener
     * @param event - Event type
     * @param listener - Event listener function
     */
    off(event: QueueEventType, listener: QueueEventListener): void;
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
    };
    /**
     * Emit event to listeners
     * @param event - Event type
     * @param data - Event data
     */
    private emit;
    /**
     * Handle processing error
     * @param item - Queue item that failed
     * @param error - Error that occurred
     */
    private handleProcessingError;
    /**
     * Handle processing timeout
     * @param item - Queue item that timed out
     */
    private handleProcessingTimeout;
    /**
     * Clear processing timeout
     * @param messageId - Message ID
     */
    private clearProcessingTimeout;
}
//# sourceMappingURL=message-queue.d.ts.map