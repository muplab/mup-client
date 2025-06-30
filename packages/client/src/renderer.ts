/**
 * MUP Component Renderer
 * Renders MUP components to DOM elements for MUP protocol v1
 */

import { Component, ComponentType, ComponentStyle } from '@muprotocol/types';
import { EventManager } from './event-manager';

/**
 * Renderer configuration
 */
export interface RendererConfig {
  container?: HTMLElement;        // Container element
  theme?: 'light' | 'dark';      // Theme
  customRenderers?: Map<ComponentType, ComponentRenderer>; // Custom renderers
  eventManager?: EventManager;    // Event manager instance
}

/**
 * Component renderer function
 */
export type ComponentRenderer = (
  component: Component,
  context: RenderContext
) => HTMLElement;

/**
 * Render context
 */
export interface RenderContext {
  renderer: MUPRenderer;
  eventManager?: EventManager;
  theme: 'light' | 'dark';
  depth: number;
}

/**
 * MUP component renderer
 */
export class MUPRenderer {
  private config: Required<RendererConfig>;
  private renderers = new Map<ComponentType, ComponentRenderer>();
  private renderedComponents = new Map<string, HTMLElement>();

  constructor(config: RendererConfig = {}) {
    this.config = {
      container: config.container || document.body,
      theme: config.theme || 'light',
      customRenderers: config.customRenderers || new Map(),
      eventManager: config.eventManager || new EventManager()
    };

    this.initializeDefaultRenderers();
    this.mergeCustomRenderers();
  }

  /**
   * Render a component tree
   * @param component - Root component to render
   * @param container - Optional container element
   * @returns Rendered DOM element
   */
  render(component: Component, container?: HTMLElement): HTMLElement {
    const targetContainer = container || this.config.container;
    
    // Register component events
    this.config.eventManager.registerComponent(component);
    
    // Create render context
    const context: RenderContext = {
      renderer: this,
      eventManager: this.config.eventManager,
      theme: this.config.theme,
      depth: 0
    };
    
    // Render component
    const element = this.renderComponent(component, context);
    
    // Store rendered component
    this.renderedComponents.set(component.id, element);
    
    // Append to container if provided
    if (container) {
      container.appendChild(element);
    }
    
    return element;
  }

  /**
   * Render multiple components
   * @param components - Components to render
   * @param container - Optional container element
   * @returns Array of rendered DOM elements
   */
  renderComponents(components: Component[], container?: HTMLElement): HTMLElement[] {
    return components.map(component => this.render(component, container));
  }

  /**
   * Update a rendered component
   * @param componentId - Component ID to update
   * @param newComponent - New component data
   * @returns True if component was updated
   */
  updateComponent(componentId: string, newComponent: Component): boolean {
    const existingElement = this.renderedComponents.get(componentId);
    if (!existingElement || !existingElement.parentNode) {
      return false;
    }

    // Create render context
    const context: RenderContext = {
      renderer: this,
      eventManager: this.config.eventManager,
      theme: this.config.theme,
      depth: 0
    };

    // Render new component
    const newElement = this.renderComponent(newComponent, context);
    
    // Replace existing element
    existingElement.parentNode.replaceChild(newElement, existingElement);
    
    // Update stored reference
    this.renderedComponents.set(componentId, newElement);
    
    return true;
  }

  /**
   * Remove a rendered component
   * @param componentId - Component ID to remove
   * @returns True if component was removed
   */
  removeComponent(componentId: string): boolean {
    const element = this.renderedComponents.get(componentId);
    if (!element || !element.parentNode) {
      return false;
    }

    // Remove from DOM
    element.parentNode.removeChild(element);
    
    // Remove from storage
    this.renderedComponents.delete(componentId);
    
    // Unregister events
    this.config.eventManager.unregisterComponent(componentId);
    
    return true;
  }

  /**
   * Get rendered element for a component
   * @param componentId - Component ID
   * @returns DOM element or null
   */
  getRenderedElement(componentId: string): HTMLElement | null {
    return this.renderedComponents.get(componentId) || null;
  }

  /**
   * Clear all rendered components
   */
  clear(): void {
    for (const element of this.renderedComponents.values()) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    
    this.renderedComponents.clear();
    this.config.eventManager.clear();
  }

  /**
   * Set theme
   * @param theme - New theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.config.theme = theme;
    
    // Update theme class on rendered elements
    for (const element of this.renderedComponents.values()) {
      element.classList.remove('mup-theme-light', 'mup-theme-dark');
      element.classList.add(`mup-theme-${theme}`);
    }
  }

  /**
   * Add custom renderer
   * @param type - Component type
   * @param renderer - Renderer function
   */
  addRenderer(type: ComponentType, renderer: ComponentRenderer): void {
    this.renderers.set(type, renderer);
  }

  /**
   * Remove custom renderer
   * @param type - Component type
   */
  removeRenderer(type: ComponentType): void {
    this.renderers.delete(type);
  }

  /**
   * Render a single component
   * @param component - Component to render
   * @param context - Render context
   * @returns Rendered DOM element
   */
  private renderComponent(component: Component, context: RenderContext): HTMLElement {
    const renderer = this.renderers.get(component.type);
    if (!renderer) {
      throw new Error(`No renderer found for component type: ${component.type}`);
    }

    const element = renderer(component, {
      ...context,
      depth: context.depth + 1
    });

    // Apply common attributes
    this.applyCommonAttributes(element, component);
    
    // Apply styles
    if (component.style) {
      this.applyStyles(element, component.style);
    }
    
    // Attach events
    this.attachEvents(element, component, context);
    
    return element;
  }

  /**
   * Apply common attributes to element
   * @param element - DOM element
   * @param component - Component data
   */
  private applyCommonAttributes(element: HTMLElement, component: Component): void {
    element.setAttribute('data-component-id', component.id);
    element.setAttribute('data-component-type', component.type);
    element.classList.add('mup-component', `mup-${component.type}`);
    element.classList.add(`mup-theme-${this.config.theme}`);
  }

  /**
   * Apply styles to element
   * @param element - DOM element
   * @param styles - Component styles
   */
  private applyStyles(element: HTMLElement, styles: ComponentStyle): void {
    for (const [property, value] of Object.entries(styles)) {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      element.style.setProperty(cssProperty, String(value));
    }
  }

  /**
   * Attach event listeners to element
   * @param element - DOM element
   * @param component - Component data
   * @param context - Render context
   */
  private attachEvents(
    element: HTMLElement,
    component: Component,
    context: RenderContext
  ): void {
    if (!component.events || !context.eventManager) {
      return;
    }

    component.events.forEach(event => {
      element.addEventListener(event.type, (domEvent) => {
        context.eventManager!.emit(component.id, event.type, {
          ...event.data,
          domEvent,
          element
        });
      });
    });
  }

  /**
   * Initialize default component renderers
   */
  private initializeDefaultRenderers(): void {
    // Container renderer
    this.renderers.set('container', (component, context) => {
      const div = document.createElement('div');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          div.appendChild(childElement);
        });
      }
      
      return div;
    });

    // Text renderer
    this.renderers.set('text', (component) => {
      const span = document.createElement('span');
      span.textContent = component.props?.text || '';
      return span;
    });

    // Button renderer
    this.renderers.set('button', (component) => {
      const button = document.createElement('button');
      button.textContent = component.props?.text || 'Button';
      button.disabled = component.props?.disabled || false;
      return button;
    });

    // Input renderer
    this.renderers.set('input', (component) => {
      const input = document.createElement('input');
      input.type = component.props?.type || 'text';
      input.placeholder = component.props?.placeholder || '';
      input.value = component.props?.value || '';
      input.disabled = component.props?.disabled || false;
      return input;
    });

    // Image renderer
    this.renderers.set('image', (component) => {
      const img = document.createElement('img');
      img.src = component.props?.src || '';
      img.alt = component.props?.alt || '';
      return img;
    });

    // List renderer
    this.renderers.set('list', (component, context) => {
      const ul = document.createElement('ul');
      
      if (component.children) {
        component.children.forEach(child => {
          const li = document.createElement('li');
          const childElement = this.renderComponent(child, context);
          li.appendChild(childElement);
          ul.appendChild(li);
        });
      }
      
      return ul;
    });

    // Card renderer
    this.renderers.set('card', (component, context) => {
      const card = document.createElement('div');
      card.classList.add('mup-card');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          card.appendChild(childElement);
        });
      }
      
      return card;
    });

    // Form renderer
    this.renderers.set('form', (component, context) => {
      const form = document.createElement('form');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          form.appendChild(childElement);
        });
      }
      
      return form;
    });

    // Navigation renderer
    this.renderers.set('navigation', (component, context) => {
      const nav = document.createElement('nav');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          nav.appendChild(childElement);
        });
      }
      
      return nav;
    });

    // Modal renderer
    this.renderers.set('modal', (component, context) => {
      const modal = document.createElement('div');
      modal.classList.add('mup-modal');
      
      const content = document.createElement('div');
      content.classList.add('mup-modal-content');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          content.appendChild(childElement);
        });
      }
      
      modal.appendChild(content);
      return modal;
    });

    // Table renderer
    this.renderers.set('table', (component, context) => {
      const table = document.createElement('table');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          table.appendChild(childElement);
        });
      }
      
      return table;
    });

    // Chart renderer (placeholder)
    this.renderers.set('chart', (component) => {
      const div = document.createElement('div');
      div.classList.add('mup-chart');
      div.textContent = `Chart: ${component.props?.type || 'unknown'}`;
      return div;
    });

    // Custom renderer (fallback)
    this.renderers.set('custom', (component, context) => {
      const div = document.createElement('div');
      div.classList.add('mup-custom');
      
      if (component.children) {
        component.children.forEach(child => {
          const childElement = this.renderComponent(child, context);
          div.appendChild(childElement);
        });
      }
      
      return div;
    });
  }

  /**
   * Merge custom renderers with default ones
   */
  private mergeCustomRenderers(): void {
    for (const [type, renderer] of this.config.customRenderers) {
      this.renderers.set(type, renderer);
    }
  }
}