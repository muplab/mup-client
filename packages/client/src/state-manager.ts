import { MUPComponent } from '@muprotocol/types';
import { ComponentUtils, MUPUtils } from '@muprotocol/core';

export interface ComponentState {
  component: MUPComponent;
  lastUpdated: number;
}

export class StateManager {
  private components: Map<string, ComponentState> = new Map();
  private rootComponent: MUPComponent | null = null;
  
  /**
   * Update a component in the state
   */
  updateComponent(component: MUPComponent): void {
    if (!component.id) {
      console.warn('Component missing ID, cannot update state');
      return;
    }

    // Check if this is the root component
    if (!this.rootComponent || component.id === this.rootComponent.id) {
      this.rootComponent = MUPUtils.deepCopy(component);
    } else {
      // Update component in the tree
      if (this.rootComponent) {
        const updated = ComponentUtils.updateComponent(this.rootComponent, component);
        if (!updated) {
          console.warn(`Component with ID ${component.id} not found in component tree`);
        }
      }
    }

    // Update the component in the flat map
    this.components.set(component.id, {
      component: MUPUtils.deepCopy(component),
      lastUpdated: Date.now()
    });

    // If component has children, update them in the flat map too
    if (component.children && Array.isArray(component.children)) {
      this.updateChildrenInMap(component.children);
    }
  }

  /**
   * Recursively update all children in the component map
   */
  private updateChildrenInMap(children: MUPComponent[]): void {
    for (const child of children) {
      if (!child.id) continue;

      this.components.set(child.id, {
        component: MUPUtils.deepCopy(child),
        lastUpdated: Date.now()
      });

      if (child.children && Array.isArray(child.children)) {
        this.updateChildrenInMap(child.children);
      }
    }
  }

  /**
   * Get a component by ID
   */
  getComponent(componentId: string): MUPComponent | null {
    const state = this.components.get(componentId);
    return state ? MUPUtils.deepCopy(state.component) : null;
  }

  /**
   * Get all components as a flat array
   */
  getAllComponents(): MUPComponent[] {
    return Array.from(this.components.values()).map(state => 
      MUPUtils.deepCopy(state.component)
    );
  }

  /**
   * Get the root component (component tree)
   */
  getComponentTree(): MUPComponent | null {
    return this.rootComponent ? MUPUtils.deepCopy(this.rootComponent) : null;
  }

  /**
   * Remove a component by ID
   */
  removeComponent(componentId: string): boolean {
    // Remove from flat map
    const removed = this.components.delete(componentId);

    // Remove from tree if it exists
    if (this.rootComponent) {
      if (this.rootComponent.id === componentId) {
        this.rootComponent = null;
      } else {
        ComponentUtils.removeComponent(this.rootComponent, componentId);
      }
    }

    return removed;
  }

  /**
   * Find components by type
   */
  findComponentsByType(type: string): MUPComponent[] {
    return Array.from(this.components.values())
      .filter(state => state.component.type === type)
      .map(state => MUPUtils.deepCopy(state.component));
  }

  /**
   * Find components by property value
   */
  findComponentsByProperty(propPath: string, value: any): MUPComponent[] {
    return Array.from(this.components.values())
      .filter(state => {
        const propValue = MUPUtils.getNestedValue(state.component, propPath);
        return propValue === value;
      })
      .map(state => MUPUtils.deepCopy(state.component));
  }

  /**
   * Get components updated since a specific timestamp
   */
  getComponentsUpdatedSince(timestamp: number): MUPComponent[] {
    return Array.from(this.components.values())
      .filter(state => state.lastUpdated >= timestamp)
      .map(state => MUPUtils.deepCopy(state.component));
  }

  /**
   * Get the last update timestamp for a component
   */
  getLastUpdated(componentId: string): number | null {
    const state = this.components.get(componentId);
    return state ? state.lastUpdated : null;
  }

  /**
   * Check if a component exists
   */
  hasComponent(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Get the number of components in the state
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Clear all components from the state
   */
  clear(): void {
    this.components.clear();
    this.rootComponent = null;
  }

  /**
   * Get debug information about the state
   */
  getDebugInfo(): {
    componentCount: number;
    hasRootComponent: boolean;
    componentTypes: Record<string, number>;
    lastUpdated: number | null;
    } {
    const componentTypes: Record<string, number> = {};
    let lastUpdated: number | null = null;

    this.components.forEach(state => {
      const type = state.component.type;
      componentTypes[type] = (componentTypes[type] || 0) + 1;

      if (!lastUpdated || state.lastUpdated > lastUpdated) {
        lastUpdated = state.lastUpdated;
      }
    });

    return {
      componentCount: this.components.size,
      hasRootComponent: this.rootComponent !== null,
      componentTypes,
      lastUpdated
    };
  }
}