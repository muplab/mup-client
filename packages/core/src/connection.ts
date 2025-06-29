import { EventEmitter } from 'events';
import {
  ConnectionConfig,
  ConnectionState,
  EventListener,
  MUPMessage
} from '@muprotocol/types';
import { MessageParser } from './message';
import { ConnectionError, MUPError, TimeoutError } from './errors';

/**
 * Connection events
 */
export interface ConnectionEvents {
  'state-change': (state: ConnectionState) => void;
  'message': (message: MUPMessage) => void;
  'error': (error: Error) => void;
  'connect': () => void;
  'disconnect': () => void;
  'reconnect': (attempt: number) => void;
}

/**
 * Base connection manager for MUP protocol
 */
export abstract class BaseConnection extends EventEmitter {
  protected state: ConnectionState = 'disconnected';
  protected config: ConnectionConfig;
  protected reconnectAttempts = 0;
  protected reconnectTimer?: NodeJS.Timeout;
  protected connectionTimeout?: NodeJS.Timeout;

  constructor(config: ConnectionConfig) {
    super();
    this.config = {
      timeout: 30000,
      reconnect: true,
      max_reconnect_attempts: 5,
      reconnect_interval: 5000,
      ...config
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Update connection state and emit event
   */
  protected setState(newState: ConnectionState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.emit('state-change', newState, oldState);

      // Emit specific state events
      if (newState === 'connected') {
        this.emit('connect');
        this.resetReconnectAttempts();
      } else if (newState === 'disconnected' && oldState === 'connected') {
        this.emit('disconnect');
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Handle incoming raw message
   */
  protected handleRawMessage(rawMessage: string) {
    try {
      const message = MessageParser.parse(rawMessage);
      this.emit('message', message);
    } catch (error) {
      this.emit('error', new MUPError(
        'MESSAGE_PARSE_ERROR',
        `Failed to parse incoming message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { rawMessage }
      ));
    }
  }

  /**
   * Handle connection error
   */
  protected handleError(error: Error) {
    this.setState('error');
    this.emit('error', error);
  }

  /**
   * Schedule reconnection attempt
   */
  protected scheduleReconnect() {
    if (!this.config.reconnect || this.reconnectAttempts >= (this.config.max_reconnect_attempts || 5)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnect', this.reconnectAttempts);
      this.connect();
    }, this.config.reconnect_interval || 5000);
  }

  /**
   * Reset reconnection attempts counter
   */
  protected resetReconnectAttempts() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      delete (this as any).reconnectTimer;
    }
  }

  /**
   * Set connection timeout
   */
  protected setConnectionTimeout() {
    if (this.config.timeout) {
      this.connectionTimeout = setTimeout(() => {
        this.handleError(new TimeoutError('Connection timeout'));
      }, this.config.timeout);
    }
  }

  /**
   * Clear connection timeout
   */
  protected clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      delete (this as any).connectionTimeout;
    }
  }

  /**
   * Clean up resources
   */
  protected cleanup() {
    this.resetReconnectAttempts();
    this.clearConnectionTimeout();
    this.removeAllListeners();
  }

  // Abstract methods to be implemented by subclasses
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: MUPMessage): Promise<void>;
}

/**
 * WebSocket connection implementation
 */
export class WebSocketConnection extends BaseConnection {
  private ws?: WebSocket;

  constructor(config: ConnectionConfig) {
    super(config);
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.setState('connecting');
    this.setConnectionTimeout();

    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.WebSocket) {
        this.ws = new window.WebSocket(this.config.url, this.config.protocols);
      } else {
        // Node.js environment - dynamic import to avoid bundling issues
        const { default: WebSocket } = await import('ws');
        this.ws = new WebSocket(this.config.url, this.config.protocols) as any;
      }

      this.setupWebSocketHandlers();
    } catch (error) {
      this.clearConnectionTimeout();
      throw new ConnectionError(
        `Failed to create WebSocket connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.config.reconnect = false; // Disable auto-reconnect for manual disconnect
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      delete (this as any).ws;
    }
    
    this.setState('disconnected');
    this.cleanup();
  }

  /**
   * Send message through WebSocket
   */
  async send(message: MUPMessage): Promise<void> {
    if (!this.isConnected() || !this.ws) {
      throw new ConnectionError('WebSocket is not connected');
    }

    try {
      const serialized = MessageParser.serialize(message);
      this.ws.send(serialized);
    } catch (error) {
      throw new MUPError(
        'MESSAGE_SEND_ERROR',
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { message }
      );
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.clearConnectionTimeout();
      this.setState('connected');
    };

    this.ws.onmessage = (event) => {
      this.handleRawMessage(event.data);
    };

    this.ws.onclose = (event) => {
      delete (this as any).ws;
      
      if (event.code === 1000) {
        // Normal closure
        this.setState('disconnected');
      } else {
        // Abnormal closure
        this.handleError(new ConnectionError(
          `WebSocket closed with code ${event.code}: ${event.reason || 'Unknown reason'}`
        ));
      }
    };

    this.ws.onerror = (event) => {
      this.clearConnectionTimeout();
      this.handleError(new ConnectionError(
        `WebSocket error: ${event instanceof ErrorEvent ? event.message : 'Unknown error'}`
      ));
    };
  }

  /**
   * Get WebSocket ready state
   */
  getReadyState(): number | undefined {
    return this.ws?.readyState;
  }
}

/**
 * Connection manager with automatic reconnection and message queuing
 */
export class ConnectionManager extends EventEmitter {
  private connection: BaseConnection;
  private messageQueue: MUPMessage[] = [];
  private isProcessingQueue = false;

  constructor(connection: BaseConnection) {
    super();
    this.connection = connection;
    this.setupConnectionHandlers();
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers() {
    this.connection.on('state-change', (state) => {
      this.emit('state-change', state);
      
      if (state === 'connected') {
        this.processMessageQueue();
      }
    });

    this.connection.on('message', (message) => {
      this.emit('message', message);
    });

    this.connection.on('error', (error) => {
      this.emit('error', error);
    });

    this.connection.on('connect', () => {
      this.emit('connect');
    });

    this.connection.on('disconnect', () => {
      this.emit('disconnect');
    });

    this.connection.on('reconnect', (attempt) => {
      this.emit('reconnect', attempt);
    });
  }

  /**
   * Connect to server
   */
  async connect(): Promise<void> {
    return this.connection.connect();
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    return this.connection.disconnect();
  }

  /**
   * Send message (with queuing if not connected)
   */
  async send(message: MUPMessage): Promise<void> {
    if (this.connection.isConnected()) {
      return this.connection.send(message);
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.messageQueue.length > 0 && this.connection.isConnected()) {
        const message = this.messageQueue.shift();
        if (message) {
          await this.connection.send(message);
        }
      }
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.connection.getState();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection.isConnected();
  }

  /**
   * Get queued message count
   */
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearMessageQueue() {
    this.messageQueue = [];
  }
}