import {
  AuthCredentials,
  ClientCapabilities,
  ConnectionState,
  EndpointType,
  MUPClientInterface,
  MUPComponent,
  MUPEventNotification,
  MUPMessage,
  MessageType
} from '@muprotocol/types';
import {
  ErrorCodes,
  ErrorFactory,
  MUPUtils,
  MUPValidator,
  MessageBuilder,
  MessageParser,
  WebSocketConnection
} from '@muprotocol/core';
import { EventManager } from './event-manager';
import { StateManager } from './state-manager';
import { ComponentRenderer } from './renderer';

export interface MUPClientConfig {
  url: string;
  auth?: AuthCredentials;
  capabilities?: Partial<ClientCapabilities>;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  timeout?: number;
  validateMessages?: boolean;
}

export interface MUPClientEvents {
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (error: Error) => void;
  component_update: (component: MUPComponent) => void;
  handshake_complete: (serverCapabilities: any) => void;
  reconnecting: (attempt: number) => void;
  reconnect_failed: () => void;
}

export class MUPClient implements MUPClientInterface {
  private connection: WebSocketConnection;
  private eventManager: EventManager;
  private stateManager: StateManager;
  private renderer: ComponentRenderer;
  private messageBuilder: MessageBuilder;
  private messageParser: MessageParser;
  private validator: MUPValidator;
  private config: Required<MUPClientConfig>;
  private isHandshakeComplete = false;
  private serverCapabilities: any = null;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(config: MUPClientConfig) {
    this.config = {
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      timeout: 30000,
      validateMessages: true,
      capabilities: {
        version: '1.0.0',
        supported_components: ['container', 'text', 'input', 'button', 'form'],
        supported_events: ['click', 'change', 'submit', 'focus', 'blur'],
        max_component_depth: 10,
        max_components_per_update: 100
      },
      ...config
    };

    this.connection = new WebSocketConnection(this.config.url, {
      timeout: this.config.timeout
    });
    this.eventManager = new EventManager();
    this.stateManager = new StateManager();
    this.renderer = new ComponentRenderer();
    this.messageBuilder = new MessageBuilder();
    this.messageParser = new MessageParser();
    this.validator = new MUPValidator();

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    this.connection.on('connected', () => {
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.performHandshake();
    });

    this.connection.on('disconnected', (reason) => {
      this.isHandshakeComplete = false;
      this.serverCapabilities = null;
      this.eventManager.emit('disconnected', reason);
      
      if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        this.eventManager.emit('reconnect_failed');
      }
    });

    this.connection.on('message', (data) => {
      this.handleMessage(data);
    });

    this.connection.on('error', (error) => {
      this.eventManager.emit('error', error);
    });
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;
    
    this.eventManager.emit('reconnecting', this.reconnectAttempts);
    
    this.reconnectTimer = setTimeout(() => {
      this.connection.connect();
    }, this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1));
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private async performHandshake(): Promise<void> {
    try {
      const handshakeMessage = this.messageBuilder.createHandshakeRequest(
        this.config.capabilities as ClientCapabilities,
        this.config.auth
      );

      await this.connection.send(handshakeMessage);
    } catch (error) {
      this.eventManager.emit('error', ErrorFactory.createConnectionError(
        'Failed to send handshake',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = this.messageParser.parse(data);
      
      if (this.config.validateMessages && !this.validator.validateMessage(message)) {
        throw ErrorFactory.createValidationError('Invalid message format');
      }

      switch (message.type) {
      case MessageType.HANDSHAKE_RESPONSE:
        this.handleHandshakeResponse(message);
        break;
      case MessageType.COMPONENT_UPDATE:
        this.handleComponentUpdate(message);
        break;
      case MessageType.ERROR:
        this.handleError(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this.eventManager.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private handleHandshakeResponse(message: MUPMessage): void {
    if (message.payload?.success) {
      this.isHandshakeComplete = true;
      this.serverCapabilities = message.payload.server_capabilities;
      this.eventManager.emit('connected');
      this.eventManager.emit('handshake_complete', this.serverCapabilities);
    } else {
      const error = ErrorFactory.createAuthenticationError(
        message.payload?.error || 'Handshake failed'
      );
      this.eventManager.emit('error', error);
    }
  }

  private handleComponentUpdate(message: MUPMessage): void {
    if (!this.isHandshakeComplete) {
      console.warn('Received component update before handshake completion');
      return;
    }

    const component = message.payload?.component;
    if (!component) {
      this.eventManager.emit('error', ErrorFactory.createValidationError(
        'Component update missing component data'
      ));
      return;
    }

    if (this.config.validateMessages && !this.validator.validateComponent(component)) {
      this.eventManager.emit('error', ErrorFactory.createValidationError(
        'Invalid component structure'
      ));
      return;
    }

    this.stateManager.updateComponent(component);
    this.eventManager.emit('component_update', component);
  }

  private handleError(message: MUPMessage): void {
    const errorPayload = message.payload;
    const error = ErrorFactory.createProtocolError(
      errorPayload?.message || 'Server error',
      errorPayload?.code || ErrorCodes.UNKNOWN_ERROR
    );
    this.eventManager.emit('error', error);
  }

  // Public API
  async connect(): Promise<void> {
    return this.connection.connect();
  }

  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.isHandshakeComplete = false;
    this.serverCapabilities = null;
    return this.connection.disconnect();
  }

  async sendEvent(componentId: string, eventType: string, eventData?: any): Promise<void> {
    if (!this.isHandshakeComplete) {
      throw ErrorFactory.createConnectionError('Not connected to server');
    }

    const eventMessage = this.messageBuilder.createEventNotification({
      component_id: componentId,
      event_type: eventType,
      event_data: eventData,
      timestamp: Date.now()
    });

    return this.connection.send(eventMessage);
  }

  getComponent(componentId: string): MUPComponent | null {
    return this.stateManager.getComponent(componentId);
  }

  getAllComponents(): MUPComponent[] {
    return this.stateManager.getAllComponents();
  }

  getComponentTree(): MUPComponent | null {
    return this.stateManager.getComponentTree();
  }

  renderComponent(component: MUPComponent, container?: HTMLElement): HTMLElement {
    return this.renderer.render(component, container);
  }

  renderComponentTree(container?: HTMLElement): HTMLElement | null {
    const tree = this.getComponentTree();
    if (!tree) return null;
    return this.renderer.render(tree, container);
  }

  on<K extends keyof MUPClientEvents>(event: K, listener: MUPClientEvents[K]): void {
    this.eventManager.on(event, listener);
  }

  off<K extends keyof MUPClientEvents>(event: K, listener: MUPClientEvents[K]): void {
    this.eventManager.off(event, listener);
  }

  once<K extends keyof MUPClientEvents>(event: K, listener: MUPClientEvents[K]): void {
    this.eventManager.once(event, listener);
  }

  getConnectionState(): ConnectionState {
    return this.connection.getState();
  }

  isConnected(): boolean {
    return this.connection.getState() === ConnectionState.CONNECTED && this.isHandshakeComplete;
  }

  getServerCapabilities(): any {
    return this.serverCapabilities;
  }

  getClientCapabilities(): ClientCapabilities {
    return this.config.capabilities as ClientCapabilities;
  }

  destroy(): void {
    this.clearReconnectTimer();
    this.connection.disconnect();
    this.eventManager.removeAllListeners();
    this.stateManager.clear();
  }
}