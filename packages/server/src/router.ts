/**
 * MUP Router
 * Request routing and middleware system for MUP protocol v1
 */

import { UIRequest, UIResponse } from '@muprotocol/types';
import { MessageBuilder } from '@muprotocol/core';

/**
 * Route handler function
 */
export type RouteHandler = (
  context: RouteContext
) => Promise<UIResponse> | UIResponse;

/**
 * Middleware function
 */
export type Middleware = (
  context: RouteContext,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Route context
 */
export interface RouteContext {
  clientId: string;
  request: UIRequest;
  params: Record<string, string>;
  query: Record<string, string>;
  metadata: Record<string, any>;
  state: Record<string, any>;
}

/**
 * Route definition
 */
export interface Route {
  pattern: string;
  handler: RouteHandler;
  middleware: Middleware[];
  method?: string;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  caseSensitive?: boolean;
  strict?: boolean;
  enableLogging?: boolean;
}

/**
 * Route match result
 */
interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

/**
 * MUP request router
 */
export class MUPRouter {
  private routes: Route[] = [];
  private globalMiddleware: Middleware[] = [];
  private config: Required<RouterConfig>;

  constructor(config: RouterConfig = {}) {
    this.config = {
      caseSensitive: config.caseSensitive ?? false,
      strict: config.strict ?? false,
      enableLogging: config.enableLogging ?? false
    };
  }

  /**
   * Add global middleware
   * @param middleware - Middleware function
   */
  use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Add route with handler
   * @param pattern - Route pattern
   * @param handler - Route handler
   * @param middleware - Route-specific middleware
   */
  route(
    pattern: string,
    handler: RouteHandler,
    ...middleware: Middleware[]
  ): void {
    this.routes.push({
      pattern: this.normalizePattern(pattern),
      handler,
      middleware
    });
  }

  /**
   * Add GET-like route
   * @param pattern - Route pattern
   * @param handler - Route handler
   * @param middleware - Route-specific middleware
   */
  get(
    pattern: string,
    handler: RouteHandler,
    ...middleware: Middleware[]
  ): void {
    this.route(pattern, handler, ...middleware);
  }

  /**
   * Add POST-like route
   * @param pattern - Route pattern
   * @param handler - Route handler
   * @param middleware - Route-specific middleware
   */
  post(
    pattern: string,
    handler: RouteHandler,
    ...middleware: Middleware[]
  ): void {
    this.routes.push({
      pattern: this.normalizePattern(pattern),
      handler,
      middleware,
      method: 'POST'
    });
  }

  /**
   * Add PUT-like route
   * @param pattern - Route pattern
   * @param handler - Route handler
   * @param middleware - Route-specific middleware
   */
  put(
    pattern: string,
    handler: RouteHandler,
    ...middleware: Middleware[]
  ): void {
    this.routes.push({
      pattern: this.normalizePattern(pattern),
      handler,
      middleware,
      method: 'PUT'
    });
  }

  /**
   * Add DELETE-like route
   * @param pattern - Route pattern
   * @param handler - Route handler
   * @param middleware - Route-specific middleware
   */
  delete(
    pattern: string,
    handler: RouteHandler,
    ...middleware: Middleware[]
  ): void {
    this.routes.push({
      pattern: this.normalizePattern(pattern),
      handler,
      middleware,
      method: 'DELETE'
    });
  }

  /**
   * Handle incoming request
   * @param clientId - Client ID
   * @param request - UI request
   * @returns Promise resolving to UI response
   */
  async handle(clientId: string, request: UIRequest): Promise<UIResponse> {
    const action = request.payload.action;
    
    if (this.config.enableLogging) {
      console.log(`[Router] Handling request: ${action} from client: ${clientId}`);
    }

    // Find matching route
    const match = this.findRoute(action, request.payload.method);
    
    if (!match) {
      return MessageBuilder.createErrorResponse(
        {
          code: 'ROUTE_NOT_FOUND',
          message: `No route found for action: ${action}`
        },
        request.id
      );
    }

    // Create route context
    const context: RouteContext = {
      clientId,
      request,
      params: match.params,
      query: this.parseQuery(request.payload.query),
      metadata: {},
      state: {}
    };

    try {
      // Execute middleware chain
      await this.executeMiddleware(context, match.route);
      
      // Execute route handler
      const response = await match.route.handler(context);
      
      if (this.config.enableLogging) {
        console.log(`[Router] Request handled successfully: ${action}`);
      }
      
      return response;
      
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[Router] Error handling request: ${action}`, error);
      }
      
      return MessageBuilder.createErrorResponse(
        {
          code: 'HANDLER_ERROR',
          message: 'Request handler failed',
          details: (error as Error).message
        },
        request.id
      );
    }
  }

  /**
   * Get all registered routes
   * @returns Array of routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes = [];
    this.globalMiddleware = [];
  }

  /**
   * Find matching route for action
   * @param action - Action string
   * @param method - Optional method
   * @returns Route match or null
   */
  private findRoute(action: string, method?: string): RouteMatch | null {
    for (const route of this.routes) {
      // Check method if specified
      if (route.method && method && route.method !== method) {
        continue;
      }
      
      const params = this.matchPattern(route.pattern, action);
      if (params !== null) {
        return { route, params };
      }
    }
    
    return null;
  }

  /**
   * Match action against route pattern
   * @param pattern - Route pattern
   * @param action - Action string
   * @returns Parameters object or null if no match
   */
  private matchPattern(pattern: string, action: string): Record<string, string> | null {
    // Convert pattern to regex
    const paramNames: string[] = [];
    const regexPattern = pattern
      .replace(/:[^/]+/g, (match) => {
        paramNames.push(match.slice(1)); // Remove ':' prefix
        return '([^/]+)';
      })
      .replace(/\*/g, '(.*)');

    const flags = this.config.caseSensitive ? '' : 'i';
    const regex = new RegExp(`^${regexPattern}$`, flags);
    
    const match = action.match(regex);
    if (!match) {
      return null;
    }

    // Extract parameters
    const params: Record<string, string> = {};
    for (let i = 0; i < paramNames.length; i++) {
      const paramName = paramNames[i];
      const paramValue = match[i + 1];
      if (paramName && paramValue) {
        params[paramName] = paramValue;
      }
    }
    
    return params;
  }

  /**
   * Execute middleware chain
   * @param context - Route context
   * @param route - Matched route
   */
  private async executeMiddleware(context: RouteContext, route: Route): Promise<void> {
    const middleware = [...this.globalMiddleware, ...route.middleware];
    
    let index = 0;
    
    const next: () => Promise<void> = async (): Promise<void> => {
      if (index >= middleware.length) {
        return;
      }
      
      const currentMiddleware = middleware[index++];
      if (currentMiddleware) {
        await currentMiddleware(context, next);
      }
    };
    
    await next();
  }

  /**
   * Normalize route pattern
   * @param pattern - Raw pattern
   * @returns Normalized pattern
   */
  private normalizePattern(pattern: string): string {
    if (!this.config.strict) {
      // Remove trailing slash unless it's the root
      if (pattern.length > 1 && pattern.endsWith('/')) {
        pattern = pattern.slice(0, -1);
      }
    }
    
    return pattern;
  }

  /**
   * Parse query string
   * @param query - Query string or object
   * @returns Parsed query object
   */
  private parseQuery(query?: string | Record<string, any>): Record<string, string> {
    if (!query) {
      return {};
    }
    
    if (typeof query === 'object') {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(query)) {
        result[key] = String(value);
      }
      return result;
    }
    
    // Parse query string
    const result: Record<string, string> = {};
    const pairs = query.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        result[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
    
    return result;
  }
}

/**
 * Built-in middleware functions
 */
export class BuiltinMiddleware {
  /**
   * Logging middleware
   * @param options - Logging options
   * @returns Middleware function
   */
  static logger(options: { verbose?: boolean } = {}): Middleware {
    return async (context, next) => {
      const start = Date.now();
      const { clientId, request } = context;
      
      console.log(`[${new Date().toISOString()}] ${request.payload.action} - Client: ${clientId}`);
      
      if (options.verbose) {
        console.log('Request payload:', JSON.stringify(request.payload, null, 2));
      }
      
      await next();
      
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] Completed in ${duration}ms`);
    };
  }

  /**
   * Authentication middleware
   * @param validator - Authentication validator function
   * @returns Middleware function
   */
  static auth(validator: (context: RouteContext) => boolean | Promise<boolean>): Middleware {
    return async (context, next) => {
      const isValid = await validator(context);
      
      if (!isValid) {
        throw new Error('Authentication failed');
      }
      
      await next();
    };
  }

  /**
   * Rate limiting middleware
   * @param options - Rate limiting options
   * @returns Middleware function
   */
  static rateLimit(options: {
    windowMs: number;
    maxRequests: number;
  }): Middleware {
    const requests = new Map<string, { count: number; resetTime: number }>();
    
    return async (context, next) => {
      const { clientId } = context;
      const now = Date.now();
      
      let clientData = requests.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        clientData = {
          count: 0,
          resetTime: now + options.windowMs
        };
        requests.set(clientId, clientData);
      }
      
      clientData.count++;
      
      if (clientData.count > options.maxRequests) {
        throw new Error('Rate limit exceeded');
      }
      
      await next();
    };
  }

  /**
   * Validation middleware
   * @param validator - Validation function
   * @returns Middleware function
   */
  static validate(validator: (context: RouteContext) => boolean | string[]): Middleware {
    return async (context, next) => {
      const result = validator(context);
      
      if (result === false) {
        throw new Error('Validation failed');
      }
      
      if (Array.isArray(result) && result.length > 0) {
        throw new Error(`Validation errors: ${result.join(', ')}`);
      }
      
      await next();
    };
  }

  /**
   * CORS middleware
   * @param options - CORS options
   * @returns Middleware function
   */
  static cors(options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  } = {}): Middleware {
    return async (context, next) => {
      // Add CORS headers to context metadata
      context.metadata.cors = {
        'Access-Control-Allow-Origin': options.origin || '*',
        'Access-Control-Allow-Methods': (options.methods || ['GET', 'POST', 'PUT', 'DELETE']).join(', '),
        'Access-Control-Allow-Headers': (options.headers || ['Content-Type', 'Authorization']).join(', ')
      };
      
      await next();
    };
  }
}