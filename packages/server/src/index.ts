/**
 * MUP Server SDK
 * Server-side implementation for MUP protocol v1
 */

// Core server functionality
export { MUPServer } from './server';
export type {
  ClientConnection,
  ServerConfig,
  ServerEvents,
  RequestHandler,
  EventHandler
} from './server';

// Request routing
export { MUPRouter, BuiltinMiddleware } from './router';
export type {
  RouteHandler,
  Middleware,
  RouteContext,
  Route,
  RouterConfig
} from './router';

// Session management
export { SessionManager, MemorySessionStorage } from './session-manager';
export type {
  SessionData,
  SessionConfig,
  SessionStorageAdapter,
  SessionManagerEvents
} from './session-manager';

// Re-export types from core packages
export * from '@muprotocol/types';
export * from '@muprotocol/core';