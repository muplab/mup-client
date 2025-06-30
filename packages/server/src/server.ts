/**
 * MUP WebSocket Server
 * Server-side implementation for MUP protocol v1
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  MUPMessage,
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,
  MessageType
} from '@muprotocol/types';
import {
  MessageParser,
  MessageBuilder,
  MUPValidator
} from '@muprotocol/core';

/**
 * Client connection information
 */
export interface ClientConnection {
  id: string;
  socket: WebSocket;
  isAlive: boolean;
  lastSeen: number;
  metadata?: Record<string, any>;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  port?: number;                    // Server port
  host?: string;                   // Server host
  path?: string;                   // WebSocket path
  pingInterval?: number;           // Ping interval in ms
  pingTimeout?: number;            // Ping timeout in ms
  maxConnections?: number;         // Maximum connections
  enableCompression?: boolean;     // Enable compression
  enableValidation?: boolean;      // Enable message validation
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
}

/**
 * Server events
 */
export interface ServerEvents {
  'client:connect': (client: ClientConnection) => void;
  'client:disconnect': (clientId: string, reason: string) => void;
  'client:error': (clientId: string, error: Error) => void;
  'message:received': (clientId: string, message: MUPMessage) => void;
  'message:sent': (clientId: string, message: MUPMessage) => void;
  'ui:request': (clientId: string, request: UIRequest) => void;
  'event:trigger': (clientId: string, event: EventTrigger) => void;
  'server:start': (port: number) => void;
  'server:stop': () => void;
  'server:error': (error: Error) => void;
}

/**
 * Request handler function
 */
export type RequestHandler = (
  clientId: string,
  request: UIRequest
) => Promise<UIResponse> | UIResponse;

/**
 * Event handler function
 */
export type EventHandler = (
  clientId: string,
  event: EventTrigger
) => Promise<void> | void;

/**
 * MUP WebSocket server
 */
export class MUPServer extends EventEmitter<ServerEvents> {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientConnection>();
  private requestHandlers = new Map<string, RequestHandler>();
  private eventHandlers = new Map<string, EventHandler>();
  private config: Required<ServerConfig>;
  private validator: MUPValidator;
  private pingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: ServerConfig = {}) {
    super();
    
    this.config = {
      port: config.port ?? 8080,
      host: config.host ?? 'localhost',
      path: config.path ?? '/mup',
      pingInterval: config.pingInterval ?? 30000,
      pingTimeout: config.pingTimeout ?? 5000,
      maxConnections: config.maxConnections ?? 1000,
      enableCompression: config.enableCompression ?? true,
      enableValidation: config.enableValidation ?? true,
      cors: config.cors ?? { origin: '*', credentials: false }
    };

    this.validator = new MUPValidator();
  }

  /**
   * Start the server
   * @returns Promise that resolves when server starts
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.config.port,
          host: this.config.host,
          path: this.config.path,
          perMessageDeflate: this.config.enableCompression
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', (error) => {
          this.emit('server:error', error);
          reject(error);
        });

        this.wss.on('listening', () => {
          this.isRunning = true;
          this.startPingInterval();
          this.emit('server:start', this.config.port);
          resolve();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   * @returns Promise that resolves when server stops
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.wss) {
      return;
    }

    return new Promise((resolve) => {
      // Stop ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      // Close all client connections
      for (const client of this.clients.values()) {
        client.socket.close(1000, 'Server shutting down');
      }
      this.clients.clear();

      // Close server
      this.wss!.close(() => {
        this.isRunning = false;
        this.wss = null;
        this.emit('server:stop');
        resolve();
      });
    });
  }

  /**
   * Send message to specific client
   * @param clientId - Client ID
   * @param message - Message to send
   * @returns True if message was sent
   */
  sendToClient(clientId: string, message: MUPMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const serialized = MessageParser.serialize(message);
      client.socket.send(serialized);
      this.emit('message:sent', clientId, message);
      return true;
    } catch (error) {
      this.emit('client:error', clientId, error as Error);
      return false;
    }
  }

  /**
   * Send message to all connected clients
   * @param message - Message to send
   * @returns Number of clients that received the message
   */
  broadcast(message: MUPMessage): number {
    let sentCount = 0;
    
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  /**
   * Send UI response to client
   * @param clientId - Client ID
   * @param requestId - Original request ID
   * @param response - Response data
   * @returns True if response was sent
   */
  sendUIResponse(
    clientId: string,
    requestId: string,
    response: Omit<UIResponse, 'id' | 'type' | 'timestamp'>
  ): boolean {
    const message = MessageBuilder.createUIResponse({
      ...response,
      requestId
    });
    
    return this.sendToClient(clientId, message);
  }

  /**
   * Send error message to client
   * @param clientId - Client ID
   * @param error - Error information
   * @param requestId - Optional request ID
   * @returns True if error was sent
   */
  sendError(
    clientId: string,
    error: { code: string; message: string; details?: any },
    requestId?: string
  ): boolean {
    const message = MessageBuilder.createError({
      ...error,
      requestId
    });
    
    return this.sendToClient(clientId, message);
  }

  /**
   * Register UI request handler
   * @param action - Action name
   * @param handler - Handler function
   */
  onUIRequest(action: string, handler: RequestHandler): void {
    this.requestHandlers.set(action, handler);
  }

  /**
   * Register event handler
   * @param eventType - Event type
   * @param handler - Handler function
   */
  onEvent(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Remove UI request handler
   * @param action - Action name
   */
  removeUIRequestHandler(action: string): void {
    this.requestHandlers.delete(action);
  }

  /**
   * Remove event handler
   * @param eventType - Event type
   */
  removeEventHandler(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Get connected client
   * @param clientId - Client ID
   * @returns Client connection or undefined
   */
  getClient(clientId: string): ClientConnection | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all connected clients
   * @returns Array of client connections
   */
  getClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get number of connected clients
   * @returns Number of clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Check if server is running
   * @returns True if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Disconnect client
   * @param clientId - Client ID
   * @param reason - Disconnect reason
   */
  disconnectClient(clientId: string, reason = 'Server disconnect'): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.close(1000, reason);
    }
  }

  /**
   * Handle new WebSocket connection
   * @param socket - WebSocket instance
   */
  private handleConnection(socket: WebSocket): void {
    // Check connection limit
    if (this.clients.size >= this.config.maxConnections) {
      socket.close(1013, 'Server at capacity');
      return;
    }

    // Create client connection
    const clientId = uuidv4();
    const client: ClientConnection = {
      id: clientId,
      socket,
      isAlive: true,
      lastSeen: Date.now()
    };

    this.clients.set(clientId, client);
    this.emit('client:connect', client);

    // Set up socket event handlers
    socket.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    socket.on('close', (code, reason) => {
      this.handleDisconnect(clientId, `${code}: ${reason}`);
    });

    socket.on('error', (error) => {
      this.emit('client:error', clientId, error);
    });

    socket.on('pong', () => {
      client.isAlive = true;
      client.lastSeen = Date.now();
    });
  }

  /**
   * Handle incoming message from client
   * @param clientId - Client ID
   * @param data - Raw message data
   */
  private async handleMessage(clientId: string, data: any): Promise<void> {
    try {
      // Parse message
      const message = MessageParser.parse(data.toString());
      
      // Validate message if enabled
      if (this.config.enableValidation) {
        const validation = this.validator.validateMessage(message);
        if (!validation.isValid) {
          this.sendError(clientId, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid message format',
            details: validation.errors
          });
          return;
        }
      }

      this.emit('message:received', clientId, message);

      // Handle different message types
      switch (message.type) {
        case MessageType.UI_REQUEST:
          await this.handleUIRequest(clientId, message as UIRequest);
          break;
          
        case MessageType.EVENT_TRIGGER:
          await this.handleEventTrigger(clientId, message as EventTrigger);
          break;
          
        default:
          this.sendError(clientId, {
            code: 'UNSUPPORTED_MESSAGE_TYPE',
            message: `Unsupported message type: ${message.type}`
          });
      }
      
    } catch (error) {
      this.emit('client:error', clientId, error as Error);
      this.sendError(clientId, {
        code: 'MESSAGE_PARSE_ERROR',
        message: 'Failed to parse message',
        details: (error as Error).message
      });
    }
  }

  /**
   * Handle UI request from client
   * @param clientId - Client ID
   * @param request - UI request
   */
  private async handleUIRequest(clientId: string, request: UIRequest): Promise<void> {
    this.emit('ui:request', clientId, request);
    
    const handler = this.requestHandlers.get(request.payload.action);
    if (!handler) {
      this.sendError(clientId, {
        code: 'NO_HANDLER',
        message: `No handler registered for action: ${request.payload.action}`
      }, request.id);
      return;
    }

    try {
      const response = await handler(clientId, request);
      this.sendToClient(clientId, response);
    } catch (error) {
      this.sendError(clientId, {
        code: 'HANDLER_ERROR',
        message: 'Request handler failed',
        details: (error as Error).message
      }, request.id);
    }
  }

  /**
   * Handle event trigger from client
   * @param clientId - Client ID
   * @param event - Event trigger
   */
  private async handleEventTrigger(clientId: string, event: EventTrigger): Promise<void> {
    this.emit('event:trigger', clientId, event);
    
    const handler = this.eventHandlers.get(event.payload.eventType);
    if (!handler) {
      // Events don't require responses, so we just ignore unknown events
      return;
    }

    try {
      await handler(clientId, event);
    } catch (error) {
      this.emit('client:error', clientId, error as Error);
    }
  }

  /**
   * Handle client disconnect
   * @param clientId - Client ID
   * @param reason - Disconnect reason
   */
  private handleDisconnect(clientId: string, reason: string): void {
    this.clients.delete(clientId);
    this.emit('client:disconnect', clientId, reason);
  }

  /**
   * Start ping interval to check client connections
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          // Client didn't respond to ping, disconnect
          client.socket.terminate();
          this.handleDisconnect(clientId, 'Ping timeout');
        } else {
          // Send ping and mark as not alive
          client.isAlive = false;
          client.socket.ping();
        }
      }
    }, this.config.pingInterval);
  }
}