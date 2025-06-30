/**
 * MUP Client
 * Main client class for MUP protocol v1 communication
 */

import { EventEmitter } from 'eventemitter3';
import {
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,
  UIRequestPayload,
  EventTriggerPayload,
  Component
} from '@muprotocol/types';
import {
  MessageBuilder,
  MessageParser,
  MessageUtils,
  ValidationError
} from '@muprotocol/core';

/**
 * Client configuration options
 */
export interface ClientConfig {
  url: string;                    // Server URL
  reconnectAttempts?: number;     // Maximum reconnection attempts
  reconnectDelay?: number;        // Delay between reconnection attempts (ms)
  heartbeatInterval?: number;     // Heartbeat interval (ms)
  requestTimeout?: number;        // Request timeout (ms)
  autoReconnect?: boolean;        // Enable automatic reconnection
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Client event types
 */
export interface ClientEvents {
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (error: Error) => void;
  message: (message: UIResponse | EventTrigger | ErrorMessage | UIRequest) => void;
  ui_response: (response: UIResponse) => void;
  event_trigger: (event: EventTrigger) => void;
  error_message: (error: ErrorMessage) => void;
  state_change: (state: ConnectionState) => void;
}

/**
 * Request options
 */
export interface RequestOptions {
  timeout?: number;               // Request timeout (ms)
  retries?: number;               // Number of retries
}

/**
 * Pending request
 */
interface PendingRequest {
  resolve: (response: UIResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  retries: number;
}

/**
 * MUP Client implementation
 */
export class MUPClient extends EventEmitter<ClientEvents> {
  private config: Required<ClientConfig>;
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private pendingRequests = new Map<string, PendingRequest>();
  private reconnectAttempt = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: ClientConfig) {
    super();
    
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      requestTimeout: 10000,
      autoReconnect: true,
      ...config
    };
  }

  /**
   * Connect to the MUP server
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.setState('connected');
          this.reconnectAttempt = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event.reason);
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket connection error');
          this.handleError(error);
          reject(error);
        };

      } catch (error) {
        this.setState('error');
        const connectionError = error instanceof Error ? error : new Error('Connection failed');
        this.handleError(connectionError);
        reject(connectionError);
      }
    });
  }

  /**
   * Disconnect from the MUP server
   */
  disconnect(): void {
    this.config.autoReconnect = false;
    this.stopHeartbeat();
    this.stopReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setState('disconnected');
    this.rejectPendingRequests(new Error('Client disconnected'));
  }

  /**
   * Send a UI request
   * @param payload - UI request payload
   * @param options - Request options
   * @returns Promise that resolves with the UI response
   */
  async sendUIRequest(
    payload: UIRequestPayload,
    options: RequestOptions = {}
  ): Promise<UIResponse> {
    if (this.state !== 'connected') {
      throw new Error('Client is not connected');
    }

    const request = MessageBuilder.createUIRequest(payload);
    const timeout = options.timeout || this.config.requestTimeout;
    const retries = options.retries || 0;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request.message_id);
        reject(new Error('Request timeout'));
      }, timeout);

      this.pendingRequests.set(request.message_id, {
        resolve,
        reject,
        timeout: timeoutId,
        retries
      });

      try {
        const message = MessageParser.serialize(request);
        this.ws!.send(message);
      } catch (error) {
        this.pendingRequests.delete(request.message_id);
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error('Failed to send request'));
      }
    });
  }

  /**
   * Send an event trigger
   * @param payload - Event trigger payload
   */
  sendEventTrigger(payload: EventTriggerPayload): void {
    if (this.state !== 'connected') {
      throw new Error('Client is not connected');
    }

    const event = MessageBuilder.createEventTrigger(payload);
    const message = MessageParser.serialize(event);
    this.ws!.send(message);
  }

  /**
   * Get current connection state
   * @returns Current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if client is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Get client configuration
   * @returns Client configuration
   */
  getConfig(): Readonly<Required<ClientConfig>> {
    return { ...this.config };
  }

  /**
   * Get connection statistics
   * @returns Connection statistics
   */
  getStats(): {
    state: ConnectionState;
    pendingRequests: number;
    reconnectAttempt: number;
    uptime?: number;
  } {
    return {
      state: this.state,
      pendingRequests: this.pendingRequests.size,
      reconnectAttempt: this.reconnectAttempt
    };
  }

  /**
   * Handle incoming message
   * @param data - Raw message data
   */
  private handleMessage(data: string): void {
    try {
      const message = MessageParser.parse(data);
      
      // Emit general message event
      this.emit('message', message);

      // Handle specific message types
      if (MessageUtils.isResponse(message)) {
        this.handleUIResponse(message);
      } else if (MessageUtils.isEventTrigger(message)) {
        this.emit('event_trigger', message);
      } else if (MessageUtils.isError(message)) {
        this.emit('error_message', message);
      }

    } catch (error) {
      const parseError = error instanceof Error ? error : new Error('Message parsing failed');
      this.handleError(parseError);
    }
  }

  /**
   * Handle UI response
   * @param response - UI response message
   */
  private handleUIResponse(response: UIResponse): void {
    this.emit('ui_response', response);

    // Resolve pending request if exists
    const pending = this.pendingRequests.get(response.message_id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.message_id);
      pending.resolve(response);
    }
  }

  /**
   * Handle disconnection
   * @param reason - Disconnection reason
   */
  private handleDisconnection(reason?: string): void {
    this.stopHeartbeat();
    this.ws = null;
    
    if (this.state === 'connected') {
      this.emit('disconnected', reason);
    }

    if (this.config.autoReconnect && this.reconnectAttempt < this.config.reconnectAttempts) {
      this.setState('reconnecting');
      this.scheduleReconnect();
    } else {
      this.setState('disconnected');
      this.rejectPendingRequests(new Error('Connection lost'));
    }
  }

  /**
   * Handle error
   * @param error - Error that occurred
   */
  private handleError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Set connection state
   * @param newState - New connection state
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit('state_change', newState);
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send heartbeat message (ping is not available in browser WebSocket)
        // Use a simple heartbeat message instead
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.warn('Failed to send heartbeat:', error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.stopReconnectTimer();
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempt++;
      
      try {
        await this.connect();
      } catch (error) {
        // Reconnection failed, will be handled by handleDisconnection
      }
    }, delay);
  }

  /**
   * Stop reconnection timer
   */
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Reject all pending requests
   * @param error - Error to reject with
   */
  private rejectPendingRequests(error: Error): void {
    for (const [messageId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}