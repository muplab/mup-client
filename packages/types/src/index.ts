// MUP Protocol Types v1.0.0

/**
 * Protocol version information
 */
export const MUP_VERSION = '1.0.0';

/**
 * Message types supported by MUP protocol
 */
export type MessageType = 
  | 'handshake_request'
  | 'handshake_response'
  | 'capability_query'
  | 'component_update'
  | 'event_notification'
  | 'error'
  | 'request'
  | 'response'
  | 'notification';

/**
 * Source/Target types
 */
export type EndpointType = 'client' | 'server';

/**
 * Base MUP message structure
 */
export interface MUPMessage<T = any> {
  mup: {
    version: string;
    message_id: string;
    timestamp: string;
    message_type: MessageType;
    source: {
      type: EndpointType;
      id: string;
      version: string;
    };
    target: {
      type: EndpointType;
      id: string;
    };
    payload: T;
  };
}

/**
 * Client capabilities
 */
export interface ClientCapabilities {
  rendering_targets: string[];
  supported_events: string[];
  max_component_depth: number;
  concurrent_updates: boolean;
  batch_operations: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  font_size: 'small' | 'medium' | 'large';
  accessibility: {
    high_contrast: boolean;
    screen_reader: boolean;
    reduced_motion: boolean;
  };
}

/**
 * Client context information
 */
export interface ClientContext {
  user_id: string;
  session_id: string;
  locale: string;
  timezone: string;
  preferences: UserPreferences;
}

/**
 * Client information for handshake
 */
export interface ClientInfo {
  name: string;
  version: string;
  platform: 'web' | 'desktop' | 'mobile';
  capabilities: ClientCapabilities;
}

/**
 * Handshake request payload
 */
export interface HandshakeRequestPayload {
  client_info: ClientInfo;
  context: ClientContext;
}

/**
 * Component type information
 */
export interface ComponentTypeInfo {
  type: string;
  version: string;
  features: string[];
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  component_types: ComponentTypeInfo[];
  event_handlers: string[];
  security: {
    authentication_required: boolean;
    supported_auth_methods: string[];
    permissions_model: string;
  };
}

/**
 * Server information
 */
export interface ServerInfo {
  name: string;
  version: string;
  description: string;
  vendor: string;
}

/**
 * Handshake response payload
 */
export interface HandshakeResponsePayload {
  server_info: ServerInfo;
  client_id: string;
  session_id: string;
  capabilities: ServerCapabilities;
}

/**
 * Component layout types
 */
export type LayoutType = 'flex' | 'grid' | 'absolute';
export type FlexDirection = 'row' | 'column';
export type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
export type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch';

/**
 * Border style
 */
export interface BorderStyle {
  width: number;
  color: string;
  radius: number;
  style: 'solid' | 'dashed' | 'dotted';
}

/**
 * Responsive breakpoints
 */
export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

/**
 * Container component props
 */
export interface ContainerProps {
  layout: LayoutType;
  direction?: FlexDirection;
  justify_content?: JustifyContent;
  align_items?: AlignItems;
  spacing?: number;
  padding?: [number, number, number, number];
  margin?: [number, number, number, number];
  background_color?: string;
  border?: BorderStyle;
  responsive?: {
    breakpoints: ResponsiveBreakpoints;
  };
}

/**
 * Text component props
 */
export interface TextProps {
  content: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'subtitle';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'bold' | 'light' | string;
  size?: number;
  line_height?: number;
  font_family?: string;
  decoration?: 'none' | 'underline' | 'line-through';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  selectable?: boolean;
  copyable?: boolean;
}

/**
 * Input validation rules
 */
export interface ValidationRules {
  pattern?: string;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  custom_validator?: string;
  error_message?: string;
}

/**
 * Select option
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Input component props
 */
export interface InputProps {
  input_type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'time' | 'datetime';
  name: string;
  label?: string;
  placeholder?: string;
  value?: any;
  default_value?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  multiple?: boolean;
  options?: SelectOption[];
  validation?: ValidationRules;
  autocomplete?: string;
  spellcheck?: boolean;
}

/**
 * Icon configuration
 */
export interface IconConfig {
  name: string;
  position: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Button component props
 */
export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconConfig;
  full_width?: boolean;
  tooltip?: string;
}

/**
 * Form component props
 */
export interface FormProps {
  title?: string;
  description?: string;
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  action?: string;
  validation_mode?: 'onSubmit' | 'onChange' | 'onBlur';
  auto_save?: boolean;
  reset_on_submit?: boolean;
}

/**
 * Event handler definition
 */
export interface EventHandler {
  handler: string;
  payload_schema?: Record<string, any>;
}

/**
 * Component metadata
 */
export interface ComponentMetadata {
  created_at: string;
  updated_at: string;
  source: string;
  version: string;
  tags?: string[];
}

/**
 * Base component structure
 */
export interface BaseComponent {
  id: string;
  type: string;
  version: string;
  props: Record<string, any>;
  children?: BaseComponent[];
  events?: Record<string, EventHandler>;
  style?: Record<string, any>;
  metadata?: ComponentMetadata;
}

/**
 * Typed component interfaces
 */
export interface ContainerComponent extends BaseComponent {
  type: 'container';
  props: ContainerProps;
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  props: TextProps;
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  props: InputProps;
}

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  props: ButtonProps;
}

export interface FormComponent extends BaseComponent {
  type: 'form';
  props: FormProps;
}

/**
 * Union type for all components
 */
export type Component = 
  | ContainerComponent
  | TextComponent
  | InputComponent
  | ButtonComponent
  | FormComponent
  | BaseComponent;

/**
 * Component update types
 */
export type UpdateType = 'full' | 'partial' | 'incremental';

/**
 * Component update payload
 */
export interface ComponentUpdatePayload {
  update_type: UpdateType;
  component_tree: Component;
}

/**
 * Event notification payload
 */
export interface EventNotificationPayload {
  component_id: string;
  event_type: string;
  event_data: Record<string, any>;
  context?: Record<string, any>;
}

/**
 * Error information
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  recovery_suggestions?: string[];
}

/**
 * Error payload
 */
export interface ErrorPayload {
  error: ErrorInfo;
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  token?: string;
  token_type?: string;
  api_key?: string;
  client_id?: string;
}

/**
 * Authentication request payload
 */
export interface AuthRequestPayload {
  auth_method: 'bearer_token' | 'api_key';
  credentials: AuthCredentials;
}

/**
 * Permission configuration
 */
export interface Permissions {
  ui_generation: {
    allowed_components: string[];
    restricted_components: string[];
    max_component_count: number;
    max_nesting_depth: number;
    max_payload_size: string;
  };
  data_access: {
    read_user_data: boolean;
    write_user_data: boolean;
    access_external_apis: boolean;
    allowed_domains: string[];
  };
  event_handling: {
    allowed_events: string[];
    restricted_events: string[];
  };
}

/**
 * Capability query payload
 */
export interface CapabilityQueryPayload {
  query_type: string;
  filters?: Record<string, any>;
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  url: string;
  protocols?: string[];
  timeout?: number;
  reconnect?: boolean;
  max_reconnect_attempts?: number;
  reconnect_interval?: number;
}

/**
 * Event listener function type
 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/**
 * MUP Client interface
 */
export interface MUPClient {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(message: MUPMessage): Promise<void>;
  on<T = any>(event: string, listener: EventListener<T>): void;
  off(event: string, listener: EventListener): void;
  getState(): ConnectionState;
}

/**
 * MUP Server interface
 */
export interface MUPServer {
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  broadcast(message: MUPMessage): Promise<void>;
  sendToClient(clientId: string, message: MUPMessage): Promise<void>;
  on<T = any>(event: string, listener: EventListener<T>): void;
  off(event: string, listener: EventListener): void;
}