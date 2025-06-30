/**
 * MUP Client SDK
 * Client-side implementation for MUP protocol v1
 */

// Export main client class
export { MUPClient } from './client';

// Export event management
export { EventManager } from './event-manager';

// Export rendering utilities
export { MUPRenderer } from './renderer';

// Export state management
export { StateManager } from './state-manager';

// Note: Avoid re-exporting to prevent circular dependencies
// Import specific types as needed in your application