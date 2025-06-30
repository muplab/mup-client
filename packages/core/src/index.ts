/**
 * MUP Core Package
 * Main entry point for MUP protocol v1 core utilities
 */

// Export message handling utilities
export {
  MessageBuilder
} from './message-builder';

export {
  MessageParser
} from './message-parser';

export {
  MessageQueue,
  QueueItem,
  QueueConfig,
  QueueEventType,
  QueueEventListener,
  MessageProcessor
} from './message-queue';

// Export validation utilities
export {
  ValidationError,
  MUPValidator
} from './validator';

// Export utility classes
export {
  MessageUtils,
  ComponentUtils,
  GeneralUtils
} from './utils';

// Re-export types from @muprotocol/types
export * from '@muprotocol/types';