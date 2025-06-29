import { MUPMessage } from '@muprotocol/types';
import { Session } from './session-manager';

export interface MiddlewareContext {
  session: Session;
  message: MUPMessage;
  timestamp: number;
  [key: string]: any;
}

export type MiddlewareNext = () => Promise<void>;

export type Middleware = (
  context: MiddlewareContext,
  next: MiddlewareNext
) => Promise<void>;

export class MiddlewareManager {
  private middlewares: Middleware[] = [];

  /**
   * Add a middleware to the stack
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Process an incoming message through the middleware stack
   */
  async processIncoming(message: MUPMessage, session: Session): Promise<MUPMessage | null> {
    const context: MiddlewareContext = {
      session,
      message,
      timestamp: Date.now()
    };

    let index = 0;
    const processed = true;

    const next: MiddlewareNext = async () => {
      if (index >= this.middlewares.length) {
        return;
      }

      const middleware = this.middlewares[index++];
      await middleware(context, next);
    };

    try {
      await next();
      return context.message;
    } catch (error) {
      console.error('Middleware error:', error);
      return null;
    }
  }

  /**
   * Get the number of registered middlewares
   */
  getMiddlewareCount(): number {
    return this.middlewares.length;
  }

  /**
   * Clear all middlewares
   */
  clear(): void {
    this.middlewares = [];
  }
}

// Built-in middleware functions

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  maxRequests: number,
  windowMs: number
): Middleware {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (context, next) => {
    const sessionId = context.session.id;
    const now = Date.now();
    
    let sessionData = requests.get(sessionId);
    
    if (!sessionData || now >= sessionData.resetTime) {
      sessionData = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(sessionId, sessionData);
    }

    sessionData.count++;

    if (sessionData.count > maxRequests) {
      throw new Error(`Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`);
    }

    await next();
  };
}

/**
 * Authentication middleware
 */
export function authMiddleware(
  requireAuth = true,
  exemptMessageTypes: string[] = ['handshake_request']
): Middleware {
  return async (context, next) => {
    if (!requireAuth || exemptMessageTypes.includes(context.message.type)) {
      await next();
      return;
    }

    if (!context.session.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    await next();
  };
}

/**
 * Logging middleware
 */
export function loggingMiddleware(
  logger: (message: string, context: MiddlewareContext) => void = console.log
): Middleware {
  return async (context, next) => {
    const start = Date.now();
    
    logger(
      `[${new Date().toISOString()}] Incoming message: ${context.message.type} from session ${context.session.id}`,
      context
    );

    try {
      await next();
      const duration = Date.now() - start;
      logger(
        `[${new Date().toISOString()}] Processed message: ${context.message.type} in ${duration}ms`,
        context
      );
    } catch (error) {
      const duration = Date.now() - start;
      logger(
        `[${new Date().toISOString()}] Error processing message: ${context.message.type} in ${duration}ms - ${error}`,
        context
      );
      throw error;
    }
  };
}

/**
 * Message validation middleware
 */
export function validationMiddleware(
  validator: (message: MUPMessage) => boolean
): Middleware {
  return async (context, next) => {
    if (!validator(context.message)) {
      throw new Error('Message validation failed');
    }
    await next();
  };
}

/**
 * Message transformation middleware
 */
export function transformMiddleware(
  transformer: (message: MUPMessage, session: Session) => MUPMessage
): Middleware {
  return async (context, next) => {
    context.message = transformer(context.message, context.session);
    await next();
  };
}

/**
 * CORS middleware for WebSocket handshake
 */
export function corsMiddleware(
  allowedOrigins: string[] = ['*']
): Middleware {
  return async (context, next) => {
    const origin = context.session.getRequest().headers.origin;
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      await next();
    } else {
      throw new Error(`Origin ${origin} not allowed`);
    }
  };
}

/**
 * IP filtering middleware
 */
export function ipFilterMiddleware(
  allowedIps: string[] = [],
  blockedIps: string[] = []
): Middleware {
  return async (context, next) => {
    const ip = context.session.getIp();
    
    if (!ip) {
      throw new Error('Unable to determine client IP');
    }

    if (blockedIps.includes(ip)) {
      throw new Error(`IP ${ip} is blocked`);
    }

    if (allowedIps.length > 0 && !allowedIps.includes(ip)) {
      throw new Error(`IP ${ip} is not allowed`);
    }

    await next();
  };
}

/**
 * Message size limiting middleware
 */
export function messageSizeMiddleware(
  maxSize: number
): Middleware {
  return async (context, next) => {
    const messageSize = JSON.stringify(context.message).length;
    
    if (messageSize > maxSize) {
      throw new Error(`Message size ${messageSize} exceeds limit of ${maxSize} bytes`);
    }

    await next();
  };
}

/**
 * Session metadata middleware
 */
export function sessionMetadataMiddleware(
  extractor: (message: MUPMessage, session: Session) => Record<string, any>
): Middleware {
  return async (context, next) => {
    const metadata = extractor(context.message, context.session);
    
    Object.entries(metadata).forEach(([key, value]) => {
      context.session.setMetadata(key, value);
    });

    await next();
  };
}

/**
 * Error handling middleware
 */
export function errorHandlingMiddleware(
  errorHandler: (error: Error, context: MiddlewareContext) => void
): Middleware {
  return async (context, next) => {
    try {
      await next();
    } catch (error) {
      errorHandler(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  };
}

/**
 * Caching middleware
 */
export function cachingMiddleware(
  cache: Map<string, any>,
  keyGenerator: (message: MUPMessage, session: Session) => string,
  ttl: number = 60000 // 1 minute default
): Middleware {
  const timestamps = new Map<string, number>();

  return async (context, next) => {
    const key = keyGenerator(context.message, context.session);
    const now = Date.now();
    const timestamp = timestamps.get(key);

    // Check if cached value exists and is not expired
    if (timestamp && now - timestamp < ttl && cache.has(key)) {
      context.message = cache.get(key);
      return;
    }

    await next();

    // Cache the processed message
    cache.set(key, context.message);
    timestamps.set(key, now);
  };
}