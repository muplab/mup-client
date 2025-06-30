/**
 * MUP Protocol v1 Core Types
 * Core types for MUP protocol v1 as defined in architecture documentation
 */

import { Component, ComponentType } from './components';

// Protocol version
export const MUP_VERSION = '1.0.0';

// Message types
export type MessageType = 
  | 'ui_request'     // UI generation request
  | 'ui_response'    // UI generation response
  | 'event_trigger'  // Event trigger
  | 'error';         // Error message

// Base message interface
export interface MUPMessage<T = any> {
  version: string;                     // Protocol version
  message_id: string;                  // Unique message identifier
  timestamp: string;                   // ISO 8601 timestamp
  type: MessageType;                   // Message type
  payload: T;                          // Message payload
}

// UI request payload
export interface UIRequestPayload {
  action: string;                      // Action to perform
  method?: string;                     // HTTP method (GET, POST, etc.)
  query?: string;                      // Query parameters
  user_input: string;                  // User requirement description
  context?: {
    previous_components?: Component[]; // Previous components
    user_preferences?: Record<string, any>; // User preferences
    constraints?: {
      max_depth?: number;              // Maximum nesting depth
      allowed_types?: ComponentType[]; // Allowed component types
      theme?: 'light' | 'dark';        // Theme
    };
  };
}

// UI response payload
export interface UIResponsePayload {
  success: boolean;
  components?: Component[];            // Generated component array
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Event trigger payload
export interface EventTriggerPayload {
  component_id: string;                // Component ID that triggered the event
  event_type: string;                  // Event type
  event_data?: any;                    // Event data
  context?: any;                       // Context information
  timestamp?: number;                  // Event timestamp
}

// Error payload
export interface ErrorPayload {
  code: string;                        // Error code
  message: string;                     // Error description
  source?: string;                     // Error source
  details?: any;                       // Error details
}

// Specific message types
export interface UIRequest extends MUPMessage<UIRequestPayload> {
  type: 'ui_request';
  id: string;                          // Request ID for correlation
}

export interface UIResponse extends MUPMessage<UIResponsePayload> {
  type: 'ui_response';
}

export interface EventTrigger extends MUPMessage<EventTriggerPayload> {
  type: 'event_trigger';
}

export interface ErrorMessage extends MUPMessage<ErrorPayload> {
  type: 'error';
}

// Component related types (imported from components.ts)
export type { Component, ComponentType } from './components';