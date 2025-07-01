import Ajv from 'ajv';
import { ValidationResult } from '../utils/validation';

// JSON Schema for MUP messages
const messageSchema = {
  type: 'object',
  required: ['type', 'id'],
  properties: {
    type: {
      type: 'string',
      enum: [
        'handshake_request',
        'handshake_response',
        'component_update',
        'user_action',
        'error',
        'ping',
        'pong'
      ]
    },
    id: {
      type: 'string',
      minLength: 1
    },
    timestamp: {
      type: 'number'
    },
    data: {
      type: 'object'
    }
  },
  additionalProperties: false
};

// JSON Schema for MUP components
const componentSchema = {
  type: 'object',
  required: ['type', 'id'],
  properties: {
    type: {
      type: 'string',
      enum: [
        'container',
        'text',
        'button',
        'input',
        'select',
        'checkbox',
        'radio',
        'textarea',
        'image',
        'link',
        'list',
        'table',
        'form',
        'modal',
        'tabs',
        'accordion',
        'chart',
        'progress',
        'spinner',
        'alert',
        'card',
        'grid'
      ]
    },
    id: {
      type: 'string',
      minLength: 1
    },
    props: {
      type: 'object'
    },
    children: {
      type: 'array',
      items: {
        $ref: '#'
      }
    },
    events: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9_]*$': {
          type: 'string'
        }
      }
    },
    style: {
      type: 'object'
    },
    className: {
      type: 'string'
    },
    visible: {
      type: 'boolean'
    },
    disabled: {
      type: 'boolean'
    }
  },
  additionalProperties: false
};

// Create AJV instance
const ajv = new Ajv({ allErrors: true });

// Compile schemas
const validateMessageSchema = ajv.compile(messageSchema);
const validateComponentSchema = ajv.compile(componentSchema);

/**
 * Validate MUP message
 */
export function validateMessage(message: any): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    errors: [],
    warnings: []
  };

  // Basic type check
  if (!message || typeof message !== 'object') {
    result.errors.push('Message must be an object');
    return result;
  }

  // Schema validation
  const isValid = validateMessageSchema(message);
  
  if (isValid) {
    result.valid = true;
    
    // Additional validations
    if (message.timestamp && typeof message.timestamp === 'number' && message.timestamp > Date.now() + 60000) {
      result.warnings!.push('Message timestamp is in the future');
    }
    
    if (message.timestamp && typeof message.timestamp === 'number' && message.timestamp < Date.now() - 300000) {
      result.warnings!.push('Message timestamp is more than 5 minutes old');
    }
    
    // Type-specific validations
    switch (message.type) {
    case 'handshake_request':
      validateHandshakeRequest(message, result);
      break;
    case 'handshake_response':
      validateHandshakeResponse(message, result);
      break;
    case 'component_update':
      validateComponentUpdate(message, result);
      break;
    case 'user_action':
      validateUserAction(message, result);
      break;
    case 'error':
      validateErrorMessage(message, result);
      break;
    }
  } else {
    result.errors = validateMessageSchema.errors?.map(error => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message}`;
    }) || ['Unknown validation error'];
  }

  return result;
}

/**
 * Validate MUP component
 */
export function validateComponent(component: any): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    errors: [],
    warnings: []
  };

  // Basic type check
  if (!component || typeof component !== 'object') {
    result.errors.push('Component must be an object');
    return result;
  }

  // Schema validation
  const isValid = validateComponentSchema(component);
  
  if (isValid) {
    result.valid = true;
    
    // Additional validations
    validateComponentProps(component, result);
    validateComponentChildren(component, result);
    validateComponentEvents(component, result);
  } else {
    result.errors = validateComponentSchema.errors?.map(error => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message}`;
    }) || ['Unknown validation error'];
  }

  return result;
}

// Type-specific validation functions
function validateHandshakeRequest(message: any, result: ValidationResult): void {
  if (!message.data?.version) {
    result.errors.push('Handshake request must include version in data');
  }
  
  if (!message.data?.capabilities) {
    result.warnings!.push('Handshake request should include capabilities');
  }
}

function validateHandshakeResponse(message: any, result: ValidationResult): void {
  if (!message.data?.accepted) {
    result.errors.push('Handshake response must include accepted status in data');
  }
  
  if (message.data?.accepted && !message.data?.sessionId) {
    result.errors.push('Accepted handshake response must include sessionId');
  }
}

function validateComponentUpdate(message: any, result: ValidationResult): void {
  if (!message.data?.components) {
    result.errors.push('Component update must include components in data');
  }
  
  if (message.data?.components && !Array.isArray(message.data.components)) {
    result.errors.push('Components must be an array');
  }
}

function validateUserAction(message: any, result: ValidationResult): void {
  if (!message.data?.componentId) {
    result.errors.push('User action must include componentId in data');
  }
  
  if (!message.data?.action) {
    result.errors.push('User action must include action in data');
  }
}

function validateErrorMessage(message: any, result: ValidationResult): void {
  if (!message.data?.message) {
    result.errors.push('Error message must include message in data');
  }
  
  if (!message.data?.code) {
    result.warnings!.push('Error message should include error code');
  }
}

function validateComponentProps(component: any, result: ValidationResult): void {
  // Type-specific prop validation
  switch (component.type) {
  case 'button':
    if (component.props?.onClick && typeof component.props.onClick !== 'string') {
      result.errors.push('Button onClick prop must be a string');
    }
    break;
  case 'input':
    if (component.props?.type && !['text', 'email', 'password', 'number'].includes(component.props.type)) {
        result.warnings!.push('Input type should be one of: text, email, password, number');
    }
    break;
  case 'image':
    if (!component.props?.src) {
      result.errors.push('Image component must have src prop');
    }
    break;
  }
}

function validateComponentChildren(component: any, result: ValidationResult): void {
  if (component.children) {
    for (let i = 0; i < component.children.length; i++) {
      const child = component.children[i];
      const childResult = validateComponent(child);
      
      if (!childResult.valid) {
        result.errors.push(`Child component at index ${i}: ${childResult.errors.join(', ')}`);
      }
      
      if (childResult.warnings && childResult.warnings.length > 0) {
        result.warnings!.push(`Child component at index ${i}: ${childResult.warnings.join(', ')}`);
      }
    }
  }
}

function validateComponentEvents(component: any, result: ValidationResult): void {
  if (component.events) {
    for (const [eventName, handler] of Object.entries(component.events)) {
      if (typeof handler !== 'string') {
        result.errors.push(`Event handler for ${eventName} must be a string`);
      }
      
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(eventName)) {
        result.errors.push(`Event name ${eventName} is invalid`);
      }
    }
  }
}