/**
 * MUP State Manager
 * State management for MUP client
 */

import { EventEmitter } from 'eventemitter3';
import { Component, ComponentTree } from '@muprotocol/types';

/**
 * State manager configuration
 */
export interface StateManagerConfig {
  enableHistory?: boolean;
  maxHistorySize?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

/**
 * Application state interface
 */
export interface AppState {
  components: Map<string, Component>;
  componentTree: ComponentTree | null;
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * State change event
 */
export interface StateChangeEvent {
  type: 'component_added' | 'component_updated' | 'component_removed' | 'tree_updated' | 'metadata_updated';
  componentId?: string;
  component?: Component;
  tree?: ComponentTree;
  metadata?: Record<string, any>;
  previousState: AppState;
  currentState: AppState;
}

/**
 * State manager for MUP client
 */
export class StateManager extends EventEmitter {
  private config: StateManagerConfig;
  private state: AppState;
  private history: AppState[];

  constructor(config: StateManagerConfig = {}) {
    super();
    this.config = {
      enableHistory: true,
      maxHistorySize: 50,
      enablePersistence: false,
      storageKey: 'mup-client-state',
      ...config
    };

    this.state = this.createInitialState();
    this.history = [];

    if (this.config.enablePersistence) {
      this.loadState();
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): AppState {
    return {
      components: new Map(),
      componentTree: null,
      metadata: {},
      timestamp: Date.now()
    };
  }

  /**
   * Get current state
   */
  getState(): AppState {
    return {
      ...this.state,
      components: new Map(this.state.components)
    };
  }

  /**
   * Add or update component
   * @param component - Component to add/update
   */
  setComponent(component: Component): void {
    const previousState = this.getState();
    const isUpdate = this.state.components.has(component.id);
    
    this.state.components.set(component.id, component);
    this.state.timestamp = Date.now();
    
    this.addToHistory(previousState);
    
    const event: StateChangeEvent = {
      type: isUpdate ? 'component_updated' : 'component_added',
      componentId: component.id,
      component,
      previousState,
      currentState: this.getState()
    };
    
    this.emit('stateChange', event);
    this.emit(event.type, event);
    
    if (this.config.enablePersistence) {
      this.saveState();
    }
  }

  /**
   * Remove component
   * @param componentId - Component ID to remove
   */
  removeComponent(componentId: string): boolean {
    if (!this.state.components.has(componentId)) {
      return false;
    }
    
    const previousState = this.getState();
    const component = this.state.components.get(componentId);
    
    this.state.components.delete(componentId);
    this.state.timestamp = Date.now();
    
    this.addToHistory(previousState);
    
    const event: StateChangeEvent = {
      type: 'component_removed',
      componentId,
      component,
      previousState,
      currentState: this.getState()
    };
    
    this.emit('stateChange', event);
    this.emit('component_removed', event);
    
    if (this.config.enablePersistence) {
      this.saveState();
    }
    
    return true;
  }

  /**
   * Get component by ID
   * @param componentId - Component ID
   */
  getComponent(componentId: string): Component | undefined {
    return this.state.components.get(componentId);
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.state.components.values());
  }

  /**
   * Set component tree
   * @param tree - Component tree
   */
  setComponentTree(tree: ComponentTree): void {
    const previousState = this.getState();
    
    this.state.componentTree = tree;
    this.state.timestamp = Date.now();
    
    this.addToHistory(previousState);
    
    const event: StateChangeEvent = {
      type: 'tree_updated',
      tree,
      previousState,
      currentState: this.getState()
    };
    
    this.emit('stateChange', event);
    this.emit('tree_updated', event);
    
    if (this.config.enablePersistence) {
      this.saveState();
    }
  }

  /**
   * Get component tree
   */
  getComponentTree(): ComponentTree | null {
    return this.state.componentTree;
  }

  /**
   * Set metadata
   * @param key - Metadata key
   * @param value - Metadata value
   */
  setMetadata(key: string, value: any): void {
    const previousState = this.getState();
    
    this.state.metadata[key] = value;
    this.state.timestamp = Date.now();
    
    this.addToHistory(previousState);
    
    const event: StateChangeEvent = {
      type: 'metadata_updated',
      metadata: { [key]: value },
      previousState,
      currentState: this.getState()
    };
    
    this.emit('stateChange', event);
    this.emit('metadata_updated', event);
    
    if (this.config.enablePersistence) {
      this.saveState();
    }
  }

  /**
   * Get metadata
   * @param key - Metadata key
   */
  getMetadata(key: string): any {
    return this.state.metadata[key];
  }

  /**
   * Clear all state
   */
  clearState(): void {
    const previousState = this.getState();
    
    this.state = this.createInitialState();
    this.history = [];
    
    const event: StateChangeEvent = {
      type: 'tree_updated',
      previousState,
      currentState: this.getState()
    };
    
    this.emit('stateChange', event);
    
    if (this.config.enablePersistence) {
      this.saveState();
    }
  }

  /**
   * Add state to history
   * @param state - State to add
   */
  private addToHistory(state: AppState): void {
    if (!this.config.enableHistory) {
      return;
    }
    
    this.history.push(state);
    
    if (this.history.length > (this.config.maxHistorySize || 50)) {
      this.history.shift();
    }
  }

  /**
   * Get state history
   */
  getHistory(): AppState[] {
    return [...this.history];
  }

  /**
   * Save state to storage
   */
  private saveState(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const serializedState = {
        ...this.state,
        components: Array.from(this.state.components.entries())
      };
      localStorage.setItem(this.config.storageKey!, JSON.stringify(serializedState));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Load state from storage
   */
  private loadState(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.config.storageKey!);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = {
          ...parsed,
          components: new Map(parsed.components || [])
        };
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }
}