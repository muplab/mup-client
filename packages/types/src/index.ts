/**
 * MUP Types Package
 * Main entry point for MUP protocol v1 type definitions
 */

// Export protocol constants
export {
  MUP_VERSION
} from './protocol';

// Export protocol types
export type {
  MessageType,
  MUPMessage,
  UIRequestPayload,
  UIResponsePayload,
  EventTriggerPayload,
  ErrorPayload,
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,

  Component,
  ComponentType
} from './protocol';

// Export component types
export type * from './components';

// Note: Specific exports above to avoid circular dependencies