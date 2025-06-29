import {
  ButtonProps,
  Component,
  ContainerProps,
  FormProps,
  InputProps,
  MUPMessage,
  MUP_VERSION,
  TextProps,
  ValidationRules
} from '@muprotocol/types';
import { ErrorFactory, ValidationError } from './errors';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Schema validator for MUP protocol
 */
export class MUPValidator {
  private static readonly MAX_COMPONENT_DEPTH = 20;
  private static readonly MAX_COMPONENT_COUNT = 1000;
  private static readonly MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate MUP message structure
   */
  static validateMessage(message: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if message is an object
    if (!message || typeof message !== 'object') {
      errors.push('Message must be an object');
      return { valid: false, errors, warnings };
    }

    // Check for mup wrapper
    if (!message.mup) {
      errors.push('Message must have "mup" property');
      return { valid: false, errors, warnings };
    }

    const { mup } = message;

    // Validate required fields
    const requiredFields = [
      'version',
      'message_id',
      'timestamp',
      'message_type',
      'source',
      'target',
      'payload'
    ];

    for (const field of requiredFields) {
      if (!(field in mup)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate version
    if (mup.version && typeof mup.version === 'string') {
      if (!this.isValidVersion(mup.version)) {
        errors.push(`Invalid version format: ${mup.version}`);
      }
      if (mup.version !== MUP_VERSION) {
        warnings.push(`Version mismatch: expected ${MUP_VERSION}, got ${mup.version}`);
      }
    }

    // Validate message_id
    if (mup.message_id && typeof mup.message_id !== 'string') {
      errors.push('message_id must be a string');
    }

    // Validate timestamp
    if (mup.timestamp && typeof mup.timestamp === 'string') {
      if (!this.isValidTimestamp(mup.timestamp)) {
        errors.push(`Invalid timestamp format: ${mup.timestamp}`);
      }
    }

    // Validate message_type
    if (mup.message_type && !this.isValidMessageType(mup.message_type)) {
      errors.push(`Invalid message_type: ${mup.message_type}`);
    }

    // Validate source and target
    if (mup.source) {
      const sourceErrors = this.validateEndpoint(mup.source, 'source');
      errors.push(...sourceErrors);
    }

    if (mup.target) {
      const targetErrors = this.validateEndpoint(mup.target, 'target');
      errors.push(...targetErrors);
    }

    // Validate message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.MAX_MESSAGE_SIZE) {
      errors.push(`Message size exceeds limit: ${messageSize} > ${this.MAX_MESSAGE_SIZE}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate component structure
   */
  static validateComponent(component: any, depth = 0): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check depth limit
    if (depth > this.MAX_COMPONENT_DEPTH) {
      errors.push(`Component nesting depth exceeds limit: ${depth} > ${this.MAX_COMPONENT_DEPTH}`);
      return { valid: false, errors, warnings };
    }

    // Check if component is an object
    if (!component || typeof component !== 'object') {
      errors.push('Component must be an object');
      return { valid: false, errors, warnings };
    }

    // Validate required fields
    const requiredFields = ['id', 'type', 'version', 'props'];
    for (const field of requiredFields) {
      if (!(field in component)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate id
    if (component.id && typeof component.id !== 'string') {
      errors.push('Component id must be a string');
    }

    // Validate type
    if (component.type && !this.isValidComponentType(component.type)) {
      errors.push(`Invalid component type: ${component.type}`);
    }

    // Validate version
    if (component.version && !this.isValidVersion(component.version)) {
      errors.push(`Invalid component version: ${component.version}`);
    }

    // Validate props based on component type
    if (component.type && component.props) {
      const propsErrors = this.validateComponentProps(component.type, component.props);
      errors.push(...propsErrors);
    }

    // Validate children recursively
    if (component.children && Array.isArray(component.children)) {
      let childCount = 0;
      for (const child of component.children) {
        childCount++;
        if (childCount > this.MAX_COMPONENT_COUNT) {
          errors.push(`Too many child components: ${childCount} > ${this.MAX_COMPONENT_COUNT}`);
          break;
        }

        const childResult = this.validateComponent(child, depth + 1);
        errors.push(...childResult.errors);
        warnings.push(...(childResult.warnings || []));
      }
    }

    // Validate events
    if (component.events) {
      const eventErrors = this.validateEvents(component.events);
      errors.push(...eventErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate component tree
   */
  static validateComponentTree(tree: any): ValidationResult {
    return this.validateComponent(tree, 0);
  }

  /**
   * Validate endpoint structure
   */
  private static validateEndpoint(endpoint: any, name: string): string[] {
    const errors: string[] = [];

    if (!endpoint || typeof endpoint !== 'object') {
      errors.push(`${name} must be an object`);
      return errors;
    }

    if (!endpoint.type || typeof endpoint.type !== 'string') {
      errors.push(`${name}.type must be a string`);
    } else if (!['client', 'server'].includes(endpoint.type)) {
      errors.push(`${name}.type must be 'client' or 'server'`);
    }

    if (!endpoint.id || typeof endpoint.id !== 'string') {
      errors.push(`${name}.id must be a string`);
    }

    return errors;
  }

  /**
   * Validate component props based on type
   */
  private static validateComponentProps(type: string, props: any): string[] {
    const errors: string[] = [];

    if (!props || typeof props !== 'object') {
      errors.push('Component props must be an object');
      return errors;
    }

    switch (type) {
    case 'container':
      errors.push(...this.validateContainerProps(props));
      break;
    case 'text':
      errors.push(...this.validateTextProps(props));
      break;
    case 'input':
      errors.push(...this.validateInputProps(props));
      break;
    case 'button':
      errors.push(...this.validateButtonProps(props));
      break;
    case 'form':
      errors.push(...this.validateFormProps(props));
      break;
    default:
      // For unknown component types, just check that props is an object
      break;
    }

    return errors;
  }

  /**
   * Validate container props
   */
  private static validateContainerProps(props: ContainerProps): string[] {
    const errors: string[] = [];

    if (props.layout && !['flex', 'grid', 'absolute'].includes(props.layout)) {
      errors.push(`Invalid layout: ${props.layout}`);
    }

    if (props.direction && !['row', 'column'].includes(props.direction)) {
      errors.push(`Invalid direction: ${props.direction}`);
    }

    if (props.justify_content && ![
      'flex-start', 'center', 'flex-end', 'space-between', 'space-around'
    ].includes(props.justify_content)) {
      errors.push(`Invalid justify_content: ${props.justify_content}`);
    }

    if (props.align_items && ![
      'flex-start', 'center', 'flex-end', 'stretch'
    ].includes(props.align_items)) {
      errors.push(`Invalid align_items: ${props.align_items}`);
    }

    if (props.spacing !== undefined && (typeof props.spacing !== 'number' || props.spacing < 0)) {
      errors.push('spacing must be a non-negative number');
    }

    if (props.padding && (!Array.isArray(props.padding) || props.padding.length !== 4)) {
      errors.push('padding must be an array of 4 numbers');
    }

    if (props.margin && (!Array.isArray(props.margin) || props.margin.length !== 4)) {
      errors.push('margin must be an array of 4 numbers');
    }

    return errors;
  }

  /**
   * Validate text props
   */
  private static validateTextProps(props: TextProps): string[] {
    const errors: string[] = [];

    if (!props.content || typeof props.content !== 'string') {
      errors.push('text content is required and must be a string');
    }

    if (props.variant && ![
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'subtitle'
    ].includes(props.variant)) {
      errors.push(`Invalid text variant: ${props.variant}`);
    }

    if (props.align && !['left', 'center', 'right', 'justify'].includes(props.align)) {
      errors.push(`Invalid text align: ${props.align}`);
    }

    if (props.size !== undefined && (typeof props.size !== 'number' || props.size <= 0)) {
      errors.push('text size must be a positive number');
    }

    return errors;
  }

  /**
   * Validate input props
   */
  private static validateInputProps(props: InputProps): string[] {
    const errors: string[] = [];

    if (!props.input_type) {
      errors.push('input_type is required');
    } else if (![
      'text', 'number', 'email', 'password', 'textarea', 'select',
      'checkbox', 'radio', 'file', 'date', 'time', 'datetime'
    ].includes(props.input_type)) {
      errors.push(`Invalid input_type: ${props.input_type}`);
    }

    if (!props.name || typeof props.name !== 'string') {
      errors.push('input name is required and must be a string');
    }

    if (props.validation) {
      errors.push(...this.validateValidationRules(props.validation));
    }

    return errors;
  }

  /**
   * Validate button props
   */
  private static validateButtonProps(props: ButtonProps): string[] {
    const errors: string[] = [];

    if (!props.text || typeof props.text !== 'string') {
      errors.push('button text is required and must be a string');
    }

    if (props.variant && ![
      'primary', 'secondary', 'outline', 'text', 'danger', 'success', 'warning'
    ].includes(props.variant)) {
      errors.push(`Invalid button variant: ${props.variant}`);
    }

    if (props.size && !['small', 'medium', 'large'].includes(props.size)) {
      errors.push(`Invalid button size: ${props.size}`);
    }

    return errors;
  }

  /**
   * Validate form props
   */
  private static validateFormProps(props: FormProps): string[] {
    const errors: string[] = [];

    if (props.method && !['POST', 'GET', 'PUT', 'DELETE'].includes(props.method)) {
      errors.push(`Invalid form method: ${props.method}`);
    }

    if (props.validation_mode && ![
      'onSubmit', 'onChange', 'onBlur'
    ].includes(props.validation_mode)) {
      errors.push(`Invalid validation_mode: ${props.validation_mode}`);
    }

    return errors;
  }

  /**
   * Validate validation rules
   */
  private static validateValidationRules(rules: ValidationRules): string[] {
    const errors: string[] = [];

    if (rules.min_length !== undefined && (typeof rules.min_length !== 'number' || rules.min_length < 0)) {
      errors.push('min_length must be a non-negative number');
    }

    if (rules.max_length !== undefined && (typeof rules.max_length !== 'number' || rules.max_length < 0)) {
      errors.push('max_length must be a non-negative number');
    }

    if (rules.min_length !== undefined && rules.max_length !== undefined && rules.min_length > rules.max_length) {
      errors.push('min_length cannot be greater than max_length');
    }

    if (rules.pattern && typeof rules.pattern === 'string') {
      try {
        new RegExp(rules.pattern);
      } catch {
        errors.push('Invalid regex pattern');
      }
    }

    return errors;
  }

  /**
   * Validate events object
   */
  private static validateEvents(events: any): string[] {
    const errors: string[] = [];

    if (!events || typeof events !== 'object') {
      errors.push('events must be an object');
      return errors;
    }

    for (const [eventName, handler] of Object.entries(events)) {
      if (!handler || typeof handler !== 'object') {
        errors.push(`Event handler for ${eventName} must be an object`);
        continue;
      }

      const handlerObj = handler as any;
      if (!handlerObj.handler || typeof handlerObj.handler !== 'string') {
        errors.push(`Event handler for ${eventName} must have a handler string`);
      }
    }

    return errors;
  }

  /**
   * Check if version string is valid
   */
  private static isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    return versionRegex.test(version);
  }

  /**
   * Check if timestamp is valid ISO 8601 format
   */
  private static isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  }

  /**
   * Check if message type is valid
   */
  private static isValidMessageType(messageType: string): boolean {
    const validTypes = [
      'handshake_request',
      'handshake_response',
      'capability_query',
      'component_update',
      'event_notification',
      'error',
      'request',
      'response',
      'notification'
    ];
    return validTypes.includes(messageType);
  }

  /**
   * Check if component type is valid
   */
  private static isValidComponentType(type: string): boolean {
    const validTypes = [
      'container',
      'text',
      'input',
      'button',
      'form',
      'image',
      'link',
      'list',
      'table',
      'chart'
    ];
    return validTypes.includes(type);
  }
}

/**
 * Validation utility functions
 */
export class ValidationUtils {
  /**
   * Validate and throw error if invalid
   */
  static validateOrThrow(validationResult: ValidationResult, context: string) {
    if (!validationResult.valid) {
      throw new ValidationError(
        `Validation failed for ${context}`,
        { errors: validationResult.errors }
      );
    }
  }

  /**
   * Validate MUP message and throw if invalid
   */
  static validateMessageOrThrow(message: any) {
    const result = MUPValidator.validateMessage(message);
    this.validateOrThrow(result, 'MUP message');
  }

  /**
   * Validate component and throw if invalid
   */
  static validateComponentOrThrow(component: any) {
    const result = MUPValidator.validateComponent(component);
    this.validateOrThrow(result, 'component');
  }

  /**
   * Validate component tree and throw if invalid
   */
  static validateComponentTreeOrThrow(tree: any) {
    const result = MUPValidator.validateComponentTree(tree);
    this.validateOrThrow(result, 'component tree');
  }
}