import { Component, MUPMessage } from '@muprotocol/types';

/**
 * Utility functions for MUP protocol
 */
export class MUPUtils {
  /**
   * Generate a unique ID
   */
  static generateId(prefix = 'mup'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * Deep merge two objects
   */
  static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target);

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue as any, sourceValue as any) as any;
        } else {
          result[key] = sourceValue as any;
        }
      }
    }

    return result;
  }

  /**
   * Check if value is a plain object
   */
  static isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Flatten a nested object
   */
  static flatten(obj: Record<string, any>, prefix = '', separator = '.'): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        const value = obj[key];

        if (this.isObject(value)) {
          Object.assign(result, this.flatten(value, newKey, separator));
        } else {
          result[newKey] = value;
        }
      }
    }

    return result;
  }

  /**
   * Get nested property value safely
   */
  static getNestedValue(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (!key || current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested property value
   */
  static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      if (!(key in current) || !this.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
  }

  /**
   * Remove undefined and null values from object
   */
  static removeEmpty(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined && value !== null) {
          if (this.isObject(value)) {
            const cleaned = this.removeEmpty(value);
            if (Object.keys(cleaned).length > 0) {
              result[key] = cleaned;
            }
          } else if (Array.isArray(value)) {
            const cleanedArray = value.filter(item => item !== undefined && item !== null);
            if (cleanedArray.length > 0) {
              result[key] = cleanedArray;
            }
          } else {
            result[key] = value;
          }
        }
      }
    }

    return result;
  }

  /**
   * Debounce function execution
   */
  static debounce<T extends(...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends(...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Create a promise that resolves after specified delay
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a promise with timeout
   */
  static withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts || !shouldRetry(lastError)) {
          throw lastError;
        }

        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape HTML characters
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate a hash code for a string
   */
  static hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash;
  }

  /**
   * Convert camelCase to kebab-case
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert kebab-case to camelCase
   */
  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number, suffix = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Check if two objects are deeply equal
   */
  static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) return false;
        }
        return true;
      }

      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }

      return true;
    }

    return false;
  }
}

/**
 * Component utility functions
 */
export class ComponentUtils {
  /**
   * Find component by ID in component tree
   */
  static findComponentById(tree: Component, id: string): Component | null {
    if (tree.id === id) {
      return tree;
    }

    if (tree.children) {
      for (const child of tree.children) {
        const found = this.findComponentById(child, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Find all components by type in component tree
   */
  static findComponentsByType(tree: Component, type: string): Component[] {
    const results: Component[] = [];

    if (tree.type === type) {
      results.push(tree);
    }

    if (tree.children) {
      for (const child of tree.children) {
        results.push(...this.findComponentsByType(child, type));
      }
    }

    return results;
  }

  /**
   * Get component path (array of IDs from root to component)
   */
  static getComponentPath(tree: Component, targetId: string): string[] | null {
    if (tree.id === targetId) {
      return [tree.id];
    }

    if (tree.children) {
      for (const child of tree.children) {
        const path = this.getComponentPath(child, targetId);
        if (path) {
          return [tree.id, ...path];
        }
      }
    }

    return null;
  }

  /**
   * Count total components in tree
   */
  static countComponents(tree: Component): number {
    let count = 1; // Count current component

    if (tree.children) {
      for (const child of tree.children) {
        count += this.countComponents(child);
      }
    }

    return count;
  }

  /**
   * Get maximum depth of component tree
   */
  static getMaxDepth(tree: Component): number {
    if (!tree.children || tree.children.length === 0) {
      return 1;
    }

    let maxChildDepth = 0;
    for (const child of tree.children) {
      const childDepth = this.getMaxDepth(child);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return 1 + maxChildDepth;
  }

  /**
   * Update component in tree by ID
   */
  static updateComponent(tree: Component, id: string, updates: Partial<Component>): Component {
    if (tree.id === id) {
      return MUPUtils.deepMerge(tree, updates);
    }

    if (tree.children) {
      const updatedChildren = tree.children.map(child => 
        this.updateComponent(child, id, updates)
      );
      return { ...tree, children: updatedChildren };
    }

    return tree;
  }

  /**
   * Remove component from tree by ID
   */
  static removeComponent(tree: Component, id: string): Component | null {
    if (tree.id === id) {
      return null; // Remove this component
    }

    if (tree.children) {
      const filteredChildren = tree.children
        .map(child => this.removeComponent(child, id))
        .filter(child => child !== null) as Component[];
      
      return { ...tree, children: filteredChildren };
    }

    return tree;
  }

  /**
   * Add component to parent by ID
   */
  static addComponent(tree: Component, parentId: string, newComponent: Component): Component {
    if (tree.id === parentId) {
      const children = tree.children || [];
      return { ...tree, children: [...children, newComponent] };
    }

    if (tree.children) {
      const updatedChildren = tree.children.map(child => 
        this.addComponent(child, parentId, newComponent)
      );
      return { ...tree, children: updatedChildren };
    }

    return tree;
  }

  /**
   * Validate component tree structure
   */
  static validateTree(tree: Component): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    const validateNode = (node: Component, depth: number) => {
      // Check for duplicate IDs
      if (seenIds.has(node.id)) {
        errors.push(`Duplicate component ID: ${node.id}`);
      } else {
        seenIds.add(node.id);
      }

      // Check depth limit
      if (depth > 20) {
        errors.push(`Component tree too deep at ${node.id}`);
      }

      // Validate children
      if (node.children) {
        for (const child of node.children) {
          validateNode(child, depth + 1);
        }
      }
    };

    validateNode(tree, 0);

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Message utility functions
 */
export class MessageUtils {
  /**
   * Extract message metadata
   */
  static getMessageMetadata(message: MUPMessage) {
    return {
      id: message.mup.message_id,
      type: message.mup.message_type,
      timestamp: message.mup.timestamp,
      source: message.mup.source,
      target: message.mup.target,
      version: message.mup.version
    };
  }

  /**
   * Check if message is a request type
   */
  static isRequest(message: MUPMessage): boolean {
    return [
      'handshake_request',
      'capability_query',
      'request'
    ].includes(message.mup.message_type);
  }

  /**
   * Check if message is a response type
   */
  static isResponse(message: MUPMessage): boolean {
    return [
      'handshake_response',
      'response'
    ].includes(message.mup.message_type);
  }

  /**
   * Check if message is a notification type
   */
  static isNotification(message: MUPMessage): boolean {
    return [
      'component_update',
      'event_notification',
      'notification'
    ].includes(message.mup.message_type);
  }

  /**
   * Check if message is an error
   */
  static isError(message: MUPMessage): boolean {
    return message.mup.message_type === 'error';
  }

  /**
   * Get message age in milliseconds
   */
  static getMessageAge(message: MUPMessage): number {
    const messageTime = new Date(message.mup.timestamp).getTime();
    const currentTime = Date.now();
    return currentTime - messageTime;
  }

  /**
   * Check if message is from client
   */
  static isFromClient(message: MUPMessage): boolean {
    return message.mup.source.type === 'client';
  }

  /**
   * Check if message is from server
   */
  static isFromServer(message: MUPMessage): boolean {
    return message.mup.source.type === 'server';
  }
}