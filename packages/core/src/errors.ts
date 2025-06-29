/**
 * Base MUP error class
 */
export class MUPError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;

  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'MUPError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    this.timestamp = new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MUPError.prototype);
  }

  /**
   * Convert error to JSON format for transmission
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Create MUPError from JSON
   */
  static fromJSON(json: any): MUPError {
    const error = new MUPError(json.code, json.message, json.details);
    if (json.stack) {
      error.stack = json.stack;
    }
    return error;
  }
}

/**
 * Connection related errors
 */
export class ConnectionError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONNECTION_ERROR', message, details);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout related errors
 */
export class TimeoutError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('TIMEOUT_ERROR', message, details);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('AUTHORIZATION_ERROR', message, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Component related errors
 */
export class ComponentError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('COMPONENT_ERROR', message, details);
    this.name = 'ComponentError';
    Object.setPrototypeOf(this, ComponentError.prototype);
  }
}

/**
 * Protocol version mismatch errors
 */
export class VersionMismatchError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('VERSION_MISMATCH_ERROR', message, details);
    this.name = 'VersionMismatchError';
    Object.setPrototypeOf(this, VersionMismatchError.prototype);
  }
}

/**
 * Unsupported operation errors
 */
export class UnsupportedOperationError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('UNSUPPORTED_OPERATION_ERROR', message, details);
    this.name = 'UnsupportedOperationError';
    Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends MUPError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    super('RATE_LIMIT_ERROR', message, details);
    this.name = 'RateLimitError';
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server errors
 */
export class ServerError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('SERVER_ERROR', message, details);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Client errors
 */
export class ClientError extends MUPError {
  constructor(message: string, details?: Record<string, any>) {
    super('CLIENT_ERROR', message, details);
    this.name = 'ClientError';
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

/**
 * Error codes enumeration
 */
export enum ErrorCodes {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Validation errors
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  INVALID_COMPONENT_STRUCTURE = 'INVALID_COMPONENT_STRUCTURE',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  
  // Component errors
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  COMPONENT_NOT_SUPPORTED = 'COMPONENT_NOT_SUPPORTED',
  COMPONENT_RENDER_ERROR = 'COMPONENT_RENDER_ERROR',
  
  // Protocol errors
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  UNSUPPORTED_MESSAGE_TYPE = 'UNSUPPORTED_MESSAGE_TYPE',
  PROTOCOL_VIOLATION = 'PROTOCOL_VIOLATION',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Client errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  /**
   * Create error from error code
   */
  static createError(code: string, message: string, details?: Record<string, any>): MUPError {
    switch (code) {
    case ErrorCodes.CONNECTION_FAILED:
    case ErrorCodes.CONNECTION_LOST:
      return new ConnectionError(message, details);
      
    case ErrorCodes.CONNECTION_TIMEOUT:
    case ErrorCodes.REQUEST_TIMEOUT:
      return new TimeoutError(message, details);
      
    case ErrorCodes.INVALID_CREDENTIALS:
    case ErrorCodes.TOKEN_EXPIRED:
    case ErrorCodes.AUTHENTICATION_REQUIRED:
      return new AuthenticationError(message, details);
      
    case ErrorCodes.INSUFFICIENT_PERMISSIONS:
    case ErrorCodes.ACCESS_DENIED:
      return new AuthorizationError(message, details);
      
    case ErrorCodes.INVALID_MESSAGE_FORMAT:
    case ErrorCodes.INVALID_COMPONENT_STRUCTURE:
    case ErrorCodes.SCHEMA_VALIDATION_FAILED:
      return new ValidationError(message, details);
      
    case ErrorCodes.COMPONENT_NOT_FOUND:
    case ErrorCodes.COMPONENT_NOT_SUPPORTED:
    case ErrorCodes.COMPONENT_RENDER_ERROR:
      return new ComponentError(message, details);
      
    case ErrorCodes.VERSION_MISMATCH:
      return new VersionMismatchError(message, details);
      
    case ErrorCodes.UNSUPPORTED_MESSAGE_TYPE:
    case ErrorCodes.PROTOCOL_VIOLATION:
      return new UnsupportedOperationError(message, details);
      
    case ErrorCodes.RATE_LIMIT_EXCEEDED:
      return new RateLimitError(message, undefined, details);
      
    case ErrorCodes.INTERNAL_SERVER_ERROR:
    case ErrorCodes.SERVICE_UNAVAILABLE:
      return new ServerError(message, details);
      
    case ErrorCodes.INVALID_REQUEST:
      return new ClientError(message, details);
      
    default:
      return new MUPError(code, message, details);
    }
  }

  /**
   * Create connection error
   */
  static connectionError(message: string, details?: Record<string, any>): ConnectionError {
    return new ConnectionError(message, details);
  }

  /**
   * Create timeout error
   */
  static timeoutError(message: string, details?: Record<string, any>): TimeoutError {
    return new TimeoutError(message, details);
  }

  /**
   * Create authentication error
   */
  static authenticationError(message: string, details?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(message, details);
  }

  /**
   * Create authorization error
   */
  static authorizationError(message: string, details?: Record<string, any>): AuthorizationError {
    return new AuthorizationError(message, details);
  }

  /**
   * Create validation error
   */
  static validationError(message: string, details?: Record<string, any>): ValidationError {
    return new ValidationError(message, details);
  }

  /**
   * Create component error
   */
  static componentError(message: string, details?: Record<string, any>): ComponentError {
    return new ComponentError(message, details);
  }

  /**
   * Create version mismatch error
   */
  static versionMismatchError(message: string, details?: Record<string, any>): VersionMismatchError {
    return new VersionMismatchError(message, details);
  }

  /**
   * Create unsupported operation error
   */
  static unsupportedOperationError(message: string, details?: Record<string, any>): UnsupportedOperationError {
    return new UnsupportedOperationError(message, details);
  }

  /**
   * Create rate limit error
   */
  static rateLimitError(message: string, retryAfter?: number, details?: Record<string, any>): RateLimitError {
    return new RateLimitError(message, retryAfter, details);
  }

  /**
   * Create server error
   */
  static serverError(message: string, details?: Record<string, any>): ServerError {
    return new ServerError(message, details);
  }

  /**
   * Create client error
   */
  static clientError(message: string, details?: Record<string, any>): ClientError {
    return new ClientError(message, details);
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof TimeoutError || error instanceof ConnectionError) {
      return true;
    }
    
    if (error instanceof RateLimitError) {
      return true;
    }
    
    return false;
  }

  /**
   * Get retry delay for recoverable errors
   */
  static getRetryDelay(error: Error, attempt: number): number {
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  /**
   * Format error for logging
   */
  static formatError(error: Error): string {
    if (error instanceof MUPError) {
      return `[${error.code}] ${error.message}${error.details ? ` - Details: ${JSON.stringify(error.details)}` : ''}`;
    }
    
    return `[${error.name}] ${error.message}`;
  }
}