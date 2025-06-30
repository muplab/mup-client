/**
 * MUP Core Utilities
 * Utility functions for MUP protocol v1
 */

import {
  Component,
  ComponentType,
  ComponentTree,
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage
} from '@muprotocol/types';

/**
 * Message utilities
 */
export class MessageUtils {
  /**
   * Check if a message is a request type
   * @param message - Message to check
   * @returns True if message is a request
   */
  static isRequest(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is UIRequest {
    return message.type === 'ui_request';
  }

  /**
   * Check if a message is a response type
   * @param message - Message to check
   * @returns True if message is a response
   */
  static isResponse(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is UIResponse {
    return message.type === 'ui_response';
  }

  /**
   * Check if a message is an event trigger
   * @param message - Message to check
   * @returns True if message is an event trigger
   */
  static isEventTrigger(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is EventTrigger {
    return message.type === 'event_trigger';
  }

  /**
   * Check if a message is an error
   * @param message - Message to check
   * @returns True if message is an error
   */
  static isError(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is ErrorMessage {
    return message.type === 'error';
  }

  /**
   * Get message age in milliseconds
   * @param message - Message to check
   * @returns Age in milliseconds
   */
  static getMessageAge(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): number {
    const messageTime = new Date(message.timestamp).getTime();
    return Date.now() - messageTime;
  }

  /**
   * Check if a response indicates success
   * @param response - UI response message
   * @returns True if response is successful
   */
  static isSuccessResponse(response: UIResponse): boolean {
    return response.payload.success === true;
  }

  /**
   * Extract error from response
   * @param response - UI response message
   * @returns Error object or null
   */
  static getResponseError(response: UIResponse): { code: string; message: string; details?: any } | null {
    return response.payload.error || null;
  }
}

/**
 * Component utilities
 */
export class ComponentUtils {
  /**
   * Find a component by ID in a component tree
   * @param root - Root component
   * @param id - Component ID to find
   * @returns Found component or null
   */
  static findComponentById(root: Component, id: string): Component | null {
    if (root.id === id) {
      return root;
    }

    if (root.children) {
      for (const child of root.children) {
        const found = this.findComponentById(child, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Find components by type
   * @param root - Root component
   * @param type - Component type to find
   * @returns Array of matching components
   */
  static findComponentsByType(root: Component, type: ComponentType): Component[] {
    const results: Component[] = [];

    if (root.type === type) {
      results.push(root);
    }

    if (root.children) {
      for (const child of root.children) {
        results.push(...this.findComponentsByType(child, type));
      }
    }

    return results;
  }

  /**
   * Get component tree depth
   * @param root - Root component
   * @returns Maximum depth of the tree
   */
  static getTreeDepth(root: Component): number {
    if (!root.children || root.children.length === 0) {
      return 1;
    }

    const childDepths = root.children.map(child => this.getTreeDepth(child));
    return 1 + Math.max(...childDepths);
  }

  /**
   * Count total components in tree
   * @param root - Root component
   * @returns Total number of components
   */
  static countComponents(root: Component): number {
    let count = 1; // Count the root

    if (root.children) {
      for (const child of root.children) {
        count += this.countComponents(child);
      }
    }

    return count;
  }

  /**
   * Get all component IDs in tree
   * @param root - Root component
   * @returns Array of all component IDs
   */
  static getAllComponentIds(root: Component): string[] {
    const ids = [root.id];

    if (root.children) {
      for (const child of root.children) {
        ids.push(...this.getAllComponentIds(child));
      }
    }

    return ids;
  }

  /**
   * Clone a component (deep copy)
   * @param component - Component to clone
   * @returns Cloned component
   */
  static cloneComponent(component: Component): Component {
    return JSON.parse(JSON.stringify(component));
  }

  /**
   * Get component path from root to target
   * @param root - Root component
   * @param targetId - Target component ID
   * @returns Array of component IDs representing the path, or null if not found
   */
  static getComponentPath(root: Component, targetId: string): string[] | null {
    if (root.id === targetId) {
      return [root.id];
    }

    if (root.children) {
      for (const child of root.children) {
        const childPath = this.getComponentPath(child, targetId);
        if (childPath) {
          return [root.id, ...childPath];
        }
      }
    }

    return null;
  }

  /**
   * Get parent component of target
   * @param root - Root component
   * @param targetId - Target component ID
   * @returns Parent component or null
   */
  static getParentComponent(root: Component, targetId: string): Component | null {
    if (root.children) {
      for (const child of root.children) {
        if (child.id === targetId) {
          return root;
        }
        const parent = this.getParentComponent(child, targetId);
        if (parent) {
          return parent;
        }
      }
    }

    return null;
  }

  /**
   * Remove component from tree
   * @param root - Root component
   * @param targetId - Component ID to remove
   * @returns True if component was removed
   */
  static removeComponent(root: Component, targetId: string): boolean {
    if (root.children) {
      const index = root.children.findIndex(child => child.id === targetId);
      if (index !== -1) {
        root.children.splice(index, 1);
        return true;
      }

      for (const child of root.children) {
        if (this.removeComponent(child, targetId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Add component as child
   * @param parent - Parent component
   * @param child - Child component to add
   * @param index - Optional index to insert at
   */
  static addChild(parent: Component, child: Component, index?: number): void {
    if (!parent.children) {
      parent.children = [];
    }

    if (index !== undefined && index >= 0 && index <= parent.children.length) {
      parent.children.splice(index, 0, child);
    } else {
      parent.children.push(child);
    }
  }

  /**
   * Create component tree structure
   * @param root - Root component
   * @returns Component tree object
   */
  static createComponentTree(root: Component): ComponentTree {
    return {
      root,
      metadata: {
        total_components: this.countComponents(root),
        max_depth: this.getTreeDepth(root),
        created_at: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }
}

/**
 * General utilities
 */
export class GeneralUtils {
  /**
   * Generate a timestamp in ISO 8601 format
   * @returns ISO 8601 timestamp string
   */
  static generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Check if a string is a valid UUID v4
   * @param uuid - String to check
   * @returns True if valid UUID v4
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Deep merge two objects
   * @param target - Target object
   * @param source - Source object
   * @returns Merged object
   */
  static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue as any);
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }

  /**
   * Check if value is a plain object
   * @param value - Value to check
   * @returns True if plain object
   */
  static isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Debounce function execution
   * @param func - Function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced function
   */
  static debounce<T extends (...args: any[]) => any>(
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
   * @param func - Function to throttle
   * @param delay - Delay in milliseconds
   * @returns Throttled function
   */
  static throttle<T extends (...args: any[]) => any>(
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
}