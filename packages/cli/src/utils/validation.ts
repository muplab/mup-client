/**
 * Validation utilities for MUP CLI
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate project structure
 */
export function validateProjectStructure(projectPath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // TODO: Implement project structure validation
  // This would check for:
  // - Required files (package.json, src/index.ts, etc.)
  // - Proper directory structure
  // - Valid configuration files
  // - Dependencies

  return result;
}

/**
 * Validate MUP configuration
 */
export function validateMupConfig(config: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!config) {
    result.valid = false;
    result.errors.push('Configuration is required');
    return result;
  }

  // Validate port
  if (config.port !== undefined) {
    if (typeof config.port !== 'number' || config.port < 1 || config.port > 65535) {
      result.valid = false;
      result.errors.push('Port must be a number between 1 and 65535');
    }
  }

  // Validate host
  if (config.host !== undefined) {
    if (typeof config.host !== 'string' || config.host.trim() === '') {
      result.valid = false;
      result.errors.push('Host must be a non-empty string');
    }
  }

  // Validate protocol
  if (config.protocol !== undefined) {
    if (!['ws', 'wss'].includes(config.protocol)) {
      result.valid = false;
      result.errors.push('Protocol must be "ws" or "wss"');
    }
  }

  // Validate SSL configuration
  if (config.ssl !== undefined) {
    if (typeof config.ssl !== 'object' || !config.ssl.cert || !config.ssl.key) {
      result.valid = false;
      result.errors.push('SSL configuration must include both cert and key paths');
    }
  }

  // Validate timeout
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout < 1000) {
      result.valid = false;
      result.errors.push('Timeout must be a number >= 1000 (milliseconds)');
    }
  }

  // Validate maxConnections
  if (config.maxConnections !== undefined) {
    if (typeof config.maxConnections !== 'number' || config.maxConnections < 1) {
      result.valid = false;
      result.errors.push('maxConnections must be a positive number');
    }
  }

  return result;
}

/**
 * Validate file path
 */
export function validateFilePath(filePath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!filePath || typeof filePath !== 'string') {
    result.valid = false;
    result.errors.push('File path is required and must be a string');
    return result;
  }

  if (filePath.trim() === '') {
    result.valid = false;
    result.errors.push('File path cannot be empty');
    return result;
  }

  // Check for potentially dangerous paths
  if (filePath.includes('..')) {
    result.warnings!.push('File path contains ".." which may be unsafe');
  }

  return result;
}

/**
 * Validate template name
 */
export function validateTemplateName(template: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  const validTemplates = [
    'basic-chat',
    'form-generator',
    'dashboard',
    'ai-assistant'
  ];

  if (!validTemplates.includes(template)) {
    result.valid = false;
    result.errors.push(`Invalid template "${template}". Valid templates: ${validTemplates.join(', ')}`);
  }

  return result;
}