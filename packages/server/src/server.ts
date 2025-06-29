import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';
import {
  AuthCredentials,
  EndpointType,
  MUPComponent,
  MUPEventNotification,
  MUPMessage,
  MUPServerInterface,
  MessageType,
  ServerCapabilities
} from '@muprotocol/types';
import {
  ErrorCodes,
  ErrorFactory,
  MUPUtils,
  MUPValidator,
  MessageBuilder,
  MessageParser
} from '@muprotocol/core';
import { ComponentManager } from './component-manager';
import { Session, SessionManager } from './session-manager';
import { Middleware, MiddlewareManager } from './middleware';

export interface MUPServerConfig {
  port?: number;
  host?: string;
  path?: string;
  capabilities?: Partial<ServerCapabilities>;
  auth?: {
    required: boolean;
    validator?: (credentials: AuthCredentials) => Promise<boolean>;
  };
  validateMessages?: boolean;
  maxMessageSize?: number;
  pingInterval?: number;
  pingTimeout?: number;
}

export interface MUPServerEvents {
  started: () => void;
  stopped: () => void;
  error: (error: Error) => void;
  client_connected: (session: Session) => void;
  client_disconnected: (session: Session, reason?: string) => void;
  client_event: (session: Session, event: MUPEventNotification) => void;
  handshake_request: (session: Session, message: MUPMessage) => void;
  handshake_complete: (session: Session) => void;
  handshake_failed: (session: Session, reason: string) => void;
}

export class MUPServer implements MUPServerInterface {
  private server?: WebSocket.Server;
  private messageBuilder: MessageBuilder;
  private messageParser: MessageParser;
  private validator: MUPValidator;
  private componentManager: ComponentManager;
  private sessionManager: SessionManager;
  private middlewareManager: MiddlewareManager;
  private config: Required<MUPServerConfig>;
  private pingIntervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: MUPServerConfig = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      path: '/mup',
      capabilities: {
        version: '1.0.0',
        supported_components: ['container', 'text', 'input', 'button', 'form'],
        supported_events: ['click', 'change', 'submit', 'focus', 'blur'],
        max_component_depth: 10,
        max_components_per_update: 100
      },
      auth: {
        required: false
      },
      validateMessages: true,
      maxMessageSize: 1024 * 1024, // 1MB
      pingInterval: 30000, // 30 seconds
      pingTimeout: 5000, // 5 seconds
      ...config
    };

    this.messageBuilder = new MessageBuilder();
    this.messageParser = new MessageParser();
    this.validator = new MUPValidator();
    this.componentManager = new ComponentManager();
    this.sessionManager = new SessionManager();
    this.middlewareManager = new MiddlewareManager();
  }

  /**
   * Start the MUP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.server = new WebSocket.Server({
      port: this.config.port,
      host: this.config.host,
      path: this.config.path
    });

    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('error', this.handleServerError.bind(this));

    this.startPingInterval();
    this.isRunning = true;

    this.sessionManager.emit('started');
  }

  /**
   * Stop the MUP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    this.stopPingInterval();

    // Close all client connections
    this.sessionManager.getAllSessions().forEach(session => {
      session.disconnect('Server shutdown');
    });

    // Close the server
    await new Promise<void>((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.server = undefined;
    this.isRunning = false;

    this.sessionManager.emit('stopped');
  }

  /**
   * Handle a new WebSocket connection
   */
  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const session = this.sessionManager.createSession(socket, request);

    socket.on('message', (data: WebSocket.Data) => {
      this.handleMessage(session, data);
    });

    socket.on('close', (code: number, reason: string) => {
      this.sessionManager.removeSession(session.id);
      this.sessionManager.emit('client_disconnected', session, reason || `Code: ${code}`);
    });

    socket.on('error', (error: Error) => {
      this.sessionManager.emit('error', error);
    });

    this.sessionManager.emit('client_connected', session);
  }

  /**
   * Handle a message from a client
   */
  private async handleMessage(session: Session, data: WebSocket.Data): Promise<void> {
    try {
      // Check message size
      if (data.toString().length > this.config.maxMessageSize) {
        throw ErrorFactory.createValidationError(
          `Message exceeds maximum size of ${this.config.maxMessageSize} bytes`
        );
      }

      // Parse the message
      const message = this.messageParser.parse(data.toString());

      // Validate the message
      if (this.config.validateMessages && !this.validator.validateMessage(message)) {
        throw ErrorFactory.createValidationError('Invalid message format');
      }

      // Process the message through middleware
      const processedMessage = await this.middlewareManager.processIncoming(message, session);
      if (!processedMessage) {
        // Message was handled by middleware
        return;
      }

      // Handle the message based on its type
      switch (processedMessage.type) {
      case MessageType.HANDSHAKE_REQUEST:
        await this.handleHandshakeRequest(session, processedMessage);
        break;
      case MessageType.EVENT_NOTIFICATION:
        await this.handleEventNotification(session, processedMessage);
        break;
      case MessageType.COMPONENT_AVAILABILITY:
        await this.handleComponentAvailability(session, processedMessage);
        break;
      default:
        throw ErrorFactory.createValidationError(`Unsupported message type: ${processedMessage.type}`);
      }
    } catch (error) {
      this.handleClientError(session, error);
    }
  }

  /**
   * Handle a handshake request from a client
   */
  private async handleHandshakeRequest(session: Session, message: MUPMessage): Promise<void> {
    try {
      this.sessionManager.emit('handshake_request', session, message);

      // Check if authentication is required
      if (this.config.auth.required) {
        const credentials = message.payload?.auth;
        if (!credentials) {
          throw ErrorFactory.createAuthenticationError('Authentication required');
        }

        // Validate credentials if a validator is provided
        if (this.config.auth.validator) {
          const isValid = await this.config.auth.validator(credentials);
          if (!isValid) {
            throw ErrorFactory.createAuthenticationError('Invalid credentials');
          }
        }
      }

      // Store client capabilities
      session.setClientCapabilities(message.payload?.client_capabilities);

      // Send handshake response
      const response = this.messageBuilder.createHandshakeResponse({
        success: true,
        server_capabilities: this.config.capabilities as ServerCapabilities
      });

      await session.send(response);
      session.setAuthenticated(true);

      this.sessionManager.emit('handshake_complete', session);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Send handshake failure response
      const response = this.messageBuilder.createHandshakeResponse({
        success: false,
        error: errorMessage
      });

      await session.send(response);
      this.sessionManager.emit('handshake_failed', session, errorMessage);
    }
  }

  /**
   * Handle an event notification from a client
   */
  private async handleEventNotification(session: Session, message: MUPMessage): Promise<void> {
    if (!session.isAuthenticated()) {
      throw ErrorFactory.createAuthenticationError('Not authenticated');
    }

    const eventPayload = message.payload as MUPEventNotification;
    this.sessionManager.emit('client_event', session, eventPayload);
  }

  /**
   * Handle a component availability query from a client
   */
  private async handleComponentAvailability(session: Session, message: MUPMessage): Promise<void> {
    if (!session.isAuthenticated()) {
      throw ErrorFactory.createAuthenticationError('Not authenticated');
    }

    // Respond with available components
    const response = this.messageBuilder.createComponentAvailabilityResponse({
      available_components: this.config.capabilities.supported_components
    });

    await session.send(response);
  }

  /**
   * Handle a server error
   */
  private handleServerError(error: Error): void {
    this.sessionManager.emit('error', error);
  }

  /**
   * Handle a client error
   */
  private handleClientError(session: Session, error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.sessionManager.emit('error', errorObj);

    // Send error message to client
    try {
      const errorCode = (error as any).code || ErrorCodes.UNKNOWN_ERROR;
      const errorMessage = this.messageBuilder.createErrorMessage({
        code: errorCode,
        message: errorObj.message,
        recoverable: errorCode < 5000 // Consider errors with code < 5000 as recoverable
      });

      session.send(errorMessage).catch(sendError => {
        this.sessionManager.emit('error', new Error(`Failed to send error message: ${sendError.message}`));
      });
    } catch (sendError) {
      this.sessionManager.emit('error', new Error(`Failed to create error message: ${String(sendError)}`));
    }
  }

  /**
   * Start the ping interval to keep connections alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingIntervalId = setInterval(() => {
      this.sessionManager.getAllSessions().forEach(session => {
        if (!session.isAlive()) {
          session.disconnect('Ping timeout');
          return;
        }

        session.ping();
      });
    }, this.config.pingInterval);
  }

  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = undefined;
    }
  }

  /**
   * Send a component update to a specific client
   */
  async sendComponentUpdate(sessionId: string, component: MUPComponent): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.isAuthenticated()) {
      throw ErrorFactory.createAuthenticationError('Client not authenticated');
    }

    // Validate component
    if (this.config.validateMessages && !this.validator.validateComponent(component)) {
      throw ErrorFactory.createValidationError('Invalid component structure');
    }

    // Store component in component manager
    this.componentManager.registerComponent(component, sessionId);

    // Send component update
    const message = this.messageBuilder.createComponentUpdate({
      component
    });

    await session.send(message);
  }

  /**
   * Send a component update to all authenticated clients
   */
  async broadcastComponentUpdate(component: MUPComponent): Promise<void> {
    // Validate component
    if (this.config.validateMessages && !this.validator.validateComponent(component)) {
      throw ErrorFactory.createValidationError('Invalid component structure');
    }

    // Store component in component manager for all sessions
    this.sessionManager.getAllSessions().forEach(session => {
      this.componentManager.registerComponent(component, session.id);
    });

    // Create component update message
    const message = this.messageBuilder.createComponentUpdate({
      component
    });

    // Send to all authenticated clients
    const promises = this.sessionManager.getAllSessions()
      .filter(session => session.isAuthenticated())
      .map(session => session.send(message));

    await Promise.all(promises);
  }

  /**
   * Send an error message to a specific client
   */
  async sendError(sessionId: string, code: number, message: string, recoverable = true): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const errorMessage = this.messageBuilder.createErrorMessage({
      code,
      message,
      recoverable
    });

    await session.send(errorMessage);
  }

  /**
   * Register a middleware
   */
  use(middleware: Middleware): void {
    this.middlewareManager.use(middleware);
  }

  /**
   * Register an event listener
   */
  on<K extends keyof MUPServerEvents>(event: K, listener: MUPServerEvents[K]): void {
    this.sessionManager.on(event, listener);
  }

  /**
   * Remove an event listener
   */
  off<K extends keyof MUPServerEvents>(event: K, listener: MUPServerEvents[K]): void {
    this.sessionManager.off(event, listener);
  }

  /**
   * Register a one-time event listener
   */
  once<K extends keyof MUPServerEvents>(event: K, listener: MUPServerEvents[K]): void {
    this.sessionManager.once(event, listener);
  }

  /**
   * Get the component manager
   */
  getComponentManager(): ComponentManager {
    return this.componentManager;
  }

  /**
   * Get the session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): ServerCapabilities {
    return this.config.capabilities as ServerCapabilities;
  }

  /**
   * Check if the server is running
   */
  isStarted(): boolean {
    return this.isRunning;
  }

  /**
   * Get the server address
   */
  getAddress(): { host: string; port: number; path: string } {
    return {
      host: this.config.host,
      port: this.config.port,
      path: this.config.path
    };
  }
}