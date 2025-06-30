/**
 * MUP Validator
 * Validation utilities for MUP protocol v1 messages and components
 */

import {
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,
  Component,
  ComponentType,
  ComponentConstraints,
  MessageType
} from '@muprotocol/types';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * MUP validator class
 */
export class MUPValidator {
  /**
   * Validate a MUP message
   * @param message - Message to validate
   * @throws ValidationError if message is invalid
   */
  static validateMessage(
    message: UIRequest | UIResponse | EventTrigger | ErrorMessage
  ): void {
    // Validate version
    if (!message.version || typeof message.version !== 'string') {
      throw new ValidationError('Invalid or missing version', 'INVALID_VERSION');
    }

    // Validate message ID
    if (!message.message_id || typeof message.message_id !== 'string') {
      throw new ValidationError('Invalid or missing message_id', 'INVALID_MESSAGE_ID');
    }

    // Validate timestamp
    if (!message.timestamp || typeof message.timestamp !== 'string') {
      throw new ValidationError('Invalid or missing timestamp', 'INVALID_TIMESTAMP');
    }

    // Validate timestamp format
    try {
      const date = new Date(message.timestamp);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid timestamp format', 'INVALID_TIMESTAMP_FORMAT');
      }
    } catch {
      throw new ValidationError('Invalid timestamp format', 'INVALID_TIMESTAMP_FORMAT');
    }

    // Validate message type
    if (!this.isValidMessageType(message.type)) {
      throw new ValidationError('Invalid message type', 'INVALID_MESSAGE_TYPE');
    }

    // Validate payload
    if (!message.payload || typeof message.payload !== 'object') {
      throw new ValidationError('Invalid or missing payload', 'INVALID_PAYLOAD');
    }

    // Type-specific validation
    switch (message.type) {
      case 'ui_request':
        this.validateUIRequestPayload((message as UIRequest).payload);
        break;
      case 'ui_response':
        this.validateUIResponsePayload((message as UIResponse).payload);
        break;
      case 'event_trigger':
        this.validateEventTriggerPayload((message as EventTrigger).payload);
        break;
      case 'error':
        this.validateErrorPayload((message as ErrorMessage).payload);
        break;
    }
  }

  /**
   * Validate UI request payload
   * @param payload - UI request payload
   */
  private static validateUIRequestPayload(payload: any): void {
    if (!payload.user_input || typeof payload.user_input !== 'string') {
      throw new ValidationError('Invalid or missing user_input', 'INVALID_USER_INPUT');
    }

    if (payload.context) {
      if (typeof payload.context !== 'object') {
        throw new ValidationError('Invalid context format', 'INVALID_CONTEXT');
      }

      if (payload.context.previous_components) {
        if (!Array.isArray(payload.context.previous_components)) {
          throw new ValidationError('Invalid previous_components format', 'INVALID_PREVIOUS_COMPONENTS');
        }
        payload.context.previous_components.forEach((component: any, index: number) => {
          try {
            this.validateComponent(component);
          } catch (error) {
            throw new ValidationError(
              `Invalid component at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'INVALID_COMPONENT'
            );
          }
        });
      }
    }
  }

  /**
   * Validate UI response payload
   * @param payload - UI response payload
   */
  private static validateUIResponsePayload(payload: any): void {
    if (typeof payload.success !== 'boolean') {
      throw new ValidationError('Invalid or missing success field', 'INVALID_SUCCESS');
    }

    if (payload.components) {
      if (!Array.isArray(payload.components)) {
        throw new ValidationError('Invalid components format', 'INVALID_COMPONENTS');
      }
      payload.components.forEach((component: any, index: number) => {
        try {
          this.validateComponent(component);
        } catch (error) {
          throw new ValidationError(
            `Invalid component at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'INVALID_COMPONENT'
          );
        }
      });
    }

    if (payload.error) {
      if (typeof payload.error !== 'object' ||
          typeof payload.error.code !== 'string' ||
          typeof payload.error.message !== 'string') {
        throw new ValidationError('Invalid error format', 'INVALID_ERROR');
      }
    }
  }

  /**
   * Validate event trigger payload
   * @param payload - Event trigger payload
   */
  private static validateEventTriggerPayload(payload: any): void {
    if (!payload.component_id || typeof payload.component_id !== 'string') {
      throw new ValidationError('Invalid or missing component_id', 'INVALID_COMPONENT_ID');
    }

    if (!payload.event_type || typeof payload.event_type !== 'string') {
      throw new ValidationError('Invalid or missing event_type', 'INVALID_EVENT_TYPE');
    }
  }

  /**
   * Validate error payload
   * @param payload - Error payload
   */
  private static validateErrorPayload(payload: any): void {
    if (!payload.code || typeof payload.code !== 'string') {
      throw new ValidationError('Invalid or missing error code', 'INVALID_ERROR_CODE');
    }

    if (!payload.message || typeof payload.message !== 'string') {
      throw new ValidationError('Invalid or missing error message', 'INVALID_ERROR_MESSAGE');
    }
  }

  /**
   * Validate a component
   * @param component - Component to validate
   * @param constraints - Optional validation constraints
   */
  static validateComponent(
    component: Component,
    constraints?: ComponentConstraints
  ): void {
    // Validate required fields
    if (!component.id || typeof component.id !== 'string') {
      throw new ValidationError('Invalid or missing component id', 'INVALID_COMPONENT_ID');
    }

    if (!component.type || !this.isValidComponentType(component.type)) {
      throw new ValidationError('Invalid or missing component type', 'INVALID_COMPONENT_TYPE');
    }

    if (!component.version || typeof component.version !== 'string') {
      throw new ValidationError('Invalid or missing component version', 'INVALID_COMPONENT_VERSION');
    }

    // Validate constraints
    if (constraints) {
      if (constraints.allowed_types && !constraints.allowed_types.includes(component.type)) {
        throw new ValidationError(
          `Component type '${component.type}' is not allowed`,
          'FORBIDDEN_COMPONENT_TYPE'
        );
      }

      if (constraints.required_props) {
        for (const prop of constraints.required_props) {
          if (!component.props || !(prop in component.props)) {
            throw new ValidationError(
              `Required property '${prop}' is missing`,
              'MISSING_REQUIRED_PROP'
            );
          }
        }
      }

      if (constraints.forbidden_props && component.props) {
        for (const prop of constraints.forbidden_props) {
          if (prop in component.props) {
            throw new ValidationError(
              `Forbidden property '${prop}' is present`,
              'FORBIDDEN_PROP_PRESENT'
            );
          }
        }
      }
    }

    // Validate children recursively
    if (component.children) {
      if (!Array.isArray(component.children)) {
        throw new ValidationError('Invalid children format', 'INVALID_CHILDREN');
      }

      if (constraints?.max_children && component.children.length > constraints.max_children) {
        throw new ValidationError(
          `Too many children: ${component.children.length} > ${constraints.max_children}`,
          'TOO_MANY_CHILDREN'
        );
      }

      component.children.forEach((child, index) => {
        try {
          this.validateComponent(child, constraints);
        } catch (error) {
          throw new ValidationError(
            `Invalid child component at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'INVALID_CHILD_COMPONENT'
          );
        }
      });
    }

    // Validate events
    if (component.events) {
      if (!Array.isArray(component.events)) {
        throw new ValidationError('Invalid events format', 'INVALID_EVENTS');
      }

      component.events.forEach((event, index) => {
        if (!event.type || typeof event.type !== 'string') {
          throw new ValidationError(
            `Invalid event type at index ${index}`,
            'INVALID_EVENT_TYPE'
          );
        }
      });
    }
  }

  /**
   * Check if message type is valid
   * @param type - Message type to check
   * @returns True if valid
   */
  private static isValidMessageType(type: string): type is MessageType {
    const validTypes: MessageType[] = ['ui_request', 'ui_response', 'event_trigger', 'error'];
    return validTypes.includes(type as MessageType);
  }

  /**
   * Check if component type is valid
   * @param type - Component type to check
   * @returns True if valid
   */
  private static isValidComponentType(type: string): type is ComponentType {
    const validTypes: ComponentType[] = [
      'container', 'text', 'button', 'input', 'image',
      'list', 'card', 'form', 'navigation', 'modal',
      'table', 'chart', 'custom'
    ];
    return validTypes.includes(type as ComponentType);
  }

  /**
   * Validate component tree depth
   * @param component - Root component
   * @param maxDepth - Maximum allowed depth
   * @param currentDepth - Current depth (internal use)
   */
  static validateComponentDepth(
    component: Component,
    maxDepth: number,
    currentDepth: number = 1
  ): void {
    if (currentDepth > maxDepth) {
      throw new ValidationError(
        `Component tree depth exceeds maximum: ${currentDepth} > ${maxDepth}`,
        'DEPTH_EXCEEDED'
      );
    }

    if (component.children) {
      component.children.forEach(child => {
        this.validateComponentDepth(child, maxDepth, currentDepth + 1);
      });
    }
  }
}