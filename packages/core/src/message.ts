import { v4 as uuidv4 } from 'uuid';
import {
  CapabilityQueryPayload,
  ComponentUpdatePayload,
  EndpointType,
  ErrorPayload,
  EventNotificationPayload,
  HandshakeRequestPayload,
  HandshakeResponsePayload,
  MUPMessage,
  MUP_VERSION,
  MessageType
} from '@muprotocol/types';

/**
 * Message builder for creating MUP protocol messages
 */
export class MessageBuilder {
  private sourceId: string;
  private sourceType: EndpointType;
  private sourceVersion: string;

  constructor(sourceId: string, sourceType: EndpointType, sourceVersion: string = MUP_VERSION) {
    this.sourceId = sourceId;
    this.sourceType = sourceType;
    this.sourceVersion = sourceVersion;
  }

  /**
   * Create a base message structure
   */
  private createBaseMessage<T>(
    messageType: MessageType,
    targetType: EndpointType,
    targetId: string,
    payload: T,
    messageId?: string
  ): MUPMessage<T> {
    return {
      mup: {
        version: MUP_VERSION,
        message_id: messageId || this.generateMessageId(),
        timestamp: new Date().toISOString(),
        message_type: messageType,
        source: {
          type: this.sourceType,
          id: this.sourceId,
          version: this.sourceVersion
        },
        target: {
          type: targetType,
          id: targetId
        },
        payload
      }
    };
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '').substring(0, 8);
    return `msg_${timestamp}_${uuid}`;
  }

  /**
   * Create a handshake request message
   */
  createHandshakeRequest(
    targetId: string,
    payload: HandshakeRequestPayload
  ): MUPMessage<HandshakeRequestPayload> {
    return this.createBaseMessage('handshake_request', 'server', targetId, payload);
  }

  /**
   * Create a handshake response message
   */
  createHandshakeResponse(
    targetId: string,
    payload: HandshakeResponsePayload,
    requestMessageId?: string
  ): MUPMessage<HandshakeResponsePayload> {
    return this.createBaseMessage('handshake_response', 'client', targetId, payload, requestMessageId);
  }

  /**
   * Create a capability query message
   */
  createCapabilityQuery(
    targetType: EndpointType,
    targetId: string,
    payload: CapabilityQueryPayload
  ): MUPMessage<CapabilityQueryPayload> {
    return this.createBaseMessage('capability_query', targetType, targetId, payload);
  }

  /**
   * Create a component update message
   */
  createComponentUpdate(
    targetId: string,
    payload: ComponentUpdatePayload
  ): MUPMessage<ComponentUpdatePayload> {
    return this.createBaseMessage('component_update', 'client', targetId, payload);
  }

  /**
   * Create an event notification message
   */
  createEventNotification(
    targetId: string,
    payload: EventNotificationPayload
  ): MUPMessage<EventNotificationPayload> {
    return this.createBaseMessage('event_notification', 'server', targetId, payload);
  }

  /**
   * Create an error message
   */
  createError(
    targetType: EndpointType,
    targetId: string,
    payload: ErrorPayload,
    requestMessageId?: string
  ): MUPMessage<ErrorPayload> {
    return this.createBaseMessage('error', targetType, targetId, payload, requestMessageId);
  }

  /**
   * Create a generic request message
   */
  createRequest<T>(
    targetType: EndpointType,
    targetId: string,
    payload: T
  ): MUPMessage<T> {
    return this.createBaseMessage('request', targetType, targetId, payload);
  }

  /**
   * Create a generic response message
   */
  createResponse<T>(
    targetType: EndpointType,
    targetId: string,
    payload: T,
    requestMessageId?: string
  ): MUPMessage<T> {
    return this.createBaseMessage('response', targetType, targetId, payload, requestMessageId);
  }

  /**
   * Create a notification message
   */
  createNotification<T>(
    targetType: EndpointType,
    targetId: string,
    payload: T
  ): MUPMessage<T> {
    return this.createBaseMessage('notification', targetType, targetId, payload);
  }
}

/**
 * Message parser for handling incoming MUP messages
 */
export class MessageParser {
  /**
   * Parse a raw message string into a MUP message
   */
  static parse<T = any>(rawMessage: string): MUPMessage<T> {
    try {
      const parsed = JSON.parse(rawMessage);
      
      if (!this.isValidMUPMessage(parsed)) {
        throw new Error('Invalid MUP message format');
      }
      
      return parsed as MUPMessage<T>;
    } catch (error) {
      throw new Error(`Failed to parse MUP message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Serialize a MUP message to string
   */
  static serialize<T>(message: MUPMessage<T>): string {
    try {
      return JSON.stringify(message);
    } catch (error) {
      throw new Error(`Failed to serialize MUP message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if an object is a valid MUP message
   */
  static isValidMUPMessage(obj: any): obj is MUPMessage {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const { mup } = obj;
    if (!mup || typeof mup !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = [
      'version',
      'message_id',
      'timestamp',
      'message_type',
      'source',
      'target',
      'payload'
    ];

    for (const field of requiredFields) {
      if (!(field in mup)) {
        return false;
      }
    }

    // Validate source and target structure
    if (!this.isValidEndpoint(mup.source) || !this.isValidEndpoint(mup.target)) {
      return false;
    }

    // Validate message type
    const validMessageTypes = [
      'handshake_request',
      'handshake_response',
      'capability_query',
      'component_update',
      'event_notification',
      'error',
      'request',
      'response',
      'notification'
    ];

    if (!validMessageTypes.includes(mup.message_type)) {
      return false;
    }

    return true;
  }

  /**
   * Validate endpoint structure
   */
  private static isValidEndpoint(endpoint: any): boolean {
    if (!endpoint || typeof endpoint !== 'object') {
      return false;
    }

    return (
      typeof endpoint.type === 'string' &&
      typeof endpoint.id === 'string' &&
      (endpoint.type === 'client' || endpoint.type === 'server')
    );
  }

  /**
   * Extract message type from a MUP message
   */
  static getMessageType(message: MUPMessage): MessageType {
    return message.mup.message_type;
  }

  /**
   * Extract payload from a MUP message
   */
  static getPayload<T>(message: MUPMessage<T>): T {
    return message.mup.payload;
  }

  /**
   * Extract message ID from a MUP message
   */
  static getMessageId(message: MUPMessage): string {
    return message.mup.message_id;
  }

  /**
   * Extract source information from a MUP message
   */
  static getSource(message: MUPMessage) {
    return message.mup.source;
  }

  /**
   * Extract target information from a MUP message
   */
  static getTarget(message: MUPMessage) {
    return message.mup.target;
  }

  /**
   * Check if message is a response to a specific request
   */
  static isResponseTo(response: MUPMessage, requestMessageId: string): boolean {
    return response.mup.message_id === requestMessageId;
  }
}

/**
 * Message queue for handling message ordering and delivery
 */
export class MessageQueue {
  private queue: MUPMessage[] = [];
  private processing = false;
  private processor?: (message: MUPMessage) => Promise<void>;

  /**
   * Set the message processor function
   */
  setProcessor(processor: (message: MUPMessage) => Promise<void>) {
    this.processor = processor;
  }

  /**
   * Add a message to the queue
   */
  enqueue(message: MUPMessage) {
    this.queue.push(message);
    this.processQueue();
  }

  /**
   * Process messages in the queue
   */
  private async processQueue() {
    if (this.processing || !this.processor) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const message = this.queue.shift();
        if (message) {
          await this.processor(message);
        }
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get the current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the message queue
   */
  clear() {
    this.queue = [];
  }
}