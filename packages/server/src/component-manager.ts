import { MUPComponent } from '@muprotocol/types';
import { ComponentUtils, MUPUtils } from '@muprotocol/core';

export interface ComponentRegistration {
  component: MUPComponent;
  sessionId: string;
  registeredAt: number;
  lastUpdated: number;
}

export interface ComponentQuery {
  type?: string;
  sessionId?: string;
  registeredAfter?: number;
  updatedAfter?: number;
}

export class ComponentManager {
  private components: Map<string, ComponentRegistration> = new Map();
  private componentsBySession: Map<string, Set<string>> = new Map();
  private componentsByType: Map<string, Set<string>> = new Map();

  /**
   * Register a component for a specific session
   */
  registerComponent(component: MUPComponent, sessionId: string): void {
    if (!component.id) {
      throw new Error('Component must have an ID');
    }

    const now = Date.now();
    const existing = this.components.get(component.id);
    
    const registration: ComponentRegistration = {
      component: MUPUtils.deepCopy(component),
      sessionId,
      registeredAt: existing?.registeredAt || now,
      lastUpdated: now
    };

    // Update main component map
    this.components.set(component.id, registration);

    // Update session index
    if (!this.componentsBySession.has(sessionId)) {
      this.componentsBySession.set(sessionId, new Set());
    }
    this.componentsBySession.get(sessionId)!.add(component.id);

    // Update type index
    if (!this.componentsByType.has(component.type)) {
      this.componentsByType.set(component.type, new Set());
    }
    this.componentsByType.get(component.type)!.add(component.id);

    // If this component has children, register them too
    if (component.children && Array.isArray(component.children)) {
      this.registerChildren(component.children, sessionId);
    }
  }

  /**
   * Recursively register child components
   */
  private registerChildren(children: MUPComponent[], sessionId: string): void {
    for (const child of children) {
      if (child.id) {
        this.registerComponent(child, sessionId);
      }
    }
  }

  /**
   * Unregister a component
   */
  unregisterComponent(componentId: string): boolean {
    const registration = this.components.get(componentId);
    if (!registration) {
      return false;
    }

    // Remove from main map
    this.components.delete(componentId);

    // Remove from session index
    const sessionComponents = this.componentsBySession.get(registration.sessionId);
    if (sessionComponents) {
      sessionComponents.delete(componentId);
      if (sessionComponents.size === 0) {
        this.componentsBySession.delete(registration.sessionId);
      }
    }

    // Remove from type index
    const typeComponents = this.componentsByType.get(registration.component.type);
    if (typeComponents) {
      typeComponents.delete(componentId);
      if (typeComponents.size === 0) {
        this.componentsByType.delete(registration.component.type);
      }
    }

    // Recursively unregister children
    if (registration.component.children && Array.isArray(registration.component.children)) {
      this.unregisterChildren(registration.component.children);
    }

    return true;
  }

  /**
   * Recursively unregister child components
   */
  private unregisterChildren(children: MUPComponent[]): void {
    for (const child of children) {
      if (child.id) {
        this.unregisterComponent(child.id);
      }
    }
  }

  /**
   * Unregister all components for a session
   */
  unregisterSession(sessionId: string): number {
    const componentIds = this.componentsBySession.get(sessionId);
    if (!componentIds) {
      return 0;
    }

    let count = 0;
    for (const componentId of Array.from(componentIds)) {
      if (this.unregisterComponent(componentId)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get a component by ID
   */
  getComponent(componentId: string): MUPComponent | null {
    const registration = this.components.get(componentId);
    return registration ? MUPUtils.deepCopy(registration.component) : null;
  }

  /**
   * Get component registration info
   */
  getComponentRegistration(componentId: string): ComponentRegistration | null {
    const registration = this.components.get(componentId);
    return registration ? { ...registration, component: MUPUtils.deepCopy(registration.component) } : null;
  }

  /**
   * Check if a component exists
   */
  hasComponent(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Query components based on criteria
   */
  queryComponents(query: ComponentQuery = {}): MUPComponent[] {
    let componentIds: Set<string>;

    // Start with all components or filter by session/type
    if (query.sessionId) {
      componentIds = this.componentsBySession.get(query.sessionId) || new Set();
    } else if (query.type) {
      componentIds = this.componentsByType.get(query.type) || new Set();
    } else {
      componentIds = new Set(this.components.keys());
    }

    // Apply additional filters
    const results: MUPComponent[] = [];
    for (const componentId of componentIds) {
      const registration = this.components.get(componentId);
      if (!registration) continue;

      // Filter by type if not already filtered
      if (query.type && !query.sessionId && registration.component.type !== query.type) {
        continue;
      }

      // Filter by session if not already filtered
      if (query.sessionId && !query.type && registration.sessionId !== query.sessionId) {
        continue;
      }

      // Filter by registration time
      if (query.registeredAfter && registration.registeredAt <= query.registeredAfter) {
        continue;
      }

      // Filter by update time
      if (query.updatedAfter && registration.lastUpdated <= query.updatedAfter) {
        continue;
      }

      results.push(MUPUtils.deepCopy(registration.component));
    }

    return results;
  }

  /**
   * Get all components for a session
   */
  getSessionComponents(sessionId: string): MUPComponent[] {
    return this.queryComponents({ sessionId });
  }

  /**
   * Get all components of a specific type
   */
  getComponentsByType(type: string): MUPComponent[] {
    return this.queryComponents({ type });
  }

  /**
   * Get components updated since a specific timestamp
   */
  getComponentsUpdatedSince(timestamp: number): MUPComponent[] {
    return this.queryComponents({ updatedAfter: timestamp });
  }

  /**
   * Update a component's properties
   */
  updateComponent(componentId: string, updates: Partial<MUPComponent>): boolean {
    const registration = this.components.get(componentId);
    if (!registration) {
      return false;
    }

    // Merge updates with existing component
    const updatedComponent = MUPUtils.deepMerge(registration.component, updates);
    
    // Ensure ID doesn't change
    updatedComponent.id = componentId;

    // Update the registration
    registration.component = updatedComponent;
    registration.lastUpdated = Date.now();

    return true;
  }

  /**
   * Get the total number of components
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Get the number of components for a session
   */
  getSessionComponentCount(sessionId: string): number {
    return this.componentsBySession.get(sessionId)?.size || 0;
  }

  /**
   * Get the number of components of a specific type
   */
  getTypeComponentCount(type: string): number {
    return this.componentsByType.get(type)?.size || 0;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.componentsBySession.keys());
  }

  /**
   * Get all component types
   */
  getComponentTypes(): string[] {
    return Array.from(this.componentsByType.keys());
  }

  /**
   * Clear all components
   */
  clear(): void {
    this.components.clear();
    this.componentsBySession.clear();
    this.componentsByType.clear();
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    totalComponents: number;
    sessionCount: number;
    typeCount: number;
    componentsBySession: Record<string, number>;
    componentsByType: Record<string, number>;
    } {
    const componentsBySession: Record<string, number> = {};
    const componentsByType: Record<string, number> = {};

    this.componentsBySession.forEach((components, sessionId) => {
      componentsBySession[sessionId] = components.size;
    });

    this.componentsByType.forEach((components, type) => {
      componentsByType[type] = components.size;
    });

    return {
      totalComponents: this.components.size,
      sessionCount: this.componentsBySession.size,
      typeCount: this.componentsByType.size,
      componentsBySession,
      componentsByType
    };
  }

  /**
   * Validate component tree integrity
   */
  validateIntegrity(): {
    valid: boolean;
    errors: string[];
    } {
    const errors: string[] = [];

    // Check if all components in indices exist in main map
    this.componentsBySession.forEach((componentIds, sessionId) => {
      componentIds.forEach(componentId => {
        if (!this.components.has(componentId)) {
          errors.push(`Component ${componentId} in session ${sessionId} not found in main map`);
        }
      });
    });

    this.componentsByType.forEach((componentIds, type) => {
      componentIds.forEach(componentId => {
        if (!this.components.has(componentId)) {
          errors.push(`Component ${componentId} of type ${type} not found in main map`);
        }
      });
    });

    // Check if all components in main map exist in indices
    this.components.forEach((registration, componentId) => {
      const sessionComponents = this.componentsBySession.get(registration.sessionId);
      if (!sessionComponents || !sessionComponents.has(componentId)) {
        errors.push(`Component ${componentId} not found in session index`);
      }

      const typeComponents = this.componentsByType.get(registration.component.type);
      if (!typeComponents || !typeComponents.has(componentId)) {
        errors.push(`Component ${componentId} not found in type index`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}