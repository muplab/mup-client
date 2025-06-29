import {
  ButtonProps,
  ContainerProps,
  FormProps,
  InputProps,
  MUPComponent,
  TextProps
} from '@muprotocol/types';
import { MUPUtils } from '@muprotocol/core';

export interface RendererOptions {
  enableEventHandlers?: boolean;
  cssPrefix?: string;
  customRenderers?: Record<string, ComponentRenderer>;
}

export type ComponentRenderer = (component: MUPComponent, options: RendererOptions) => HTMLElement;

export class ComponentRenderer {
  private options: Required<RendererOptions>;
  private eventHandlers: Map<string, (event: Event) => void> = new Map();

  constructor(options: RendererOptions = {}) {
    this.options = {
      enableEventHandlers: true,
      cssPrefix: 'mup-',
      customRenderers: {},
      ...options
    };
  }

  /**
   * Render a component to HTML element
   */
  render(component: MUPComponent, container?: HTMLElement): HTMLElement {
    const element = this.renderComponent(component);
    
    if (container) {
      container.appendChild(element);
    }
    
    return element;
  }

  /**
   * Render a component based on its type
   */
  private renderComponent(component: MUPComponent): HTMLElement {
    // Check for custom renderer first
    if (this.options.customRenderers[component.type]) {
      return this.options.customRenderers[component.type](component, this.options);
    }

    // Use built-in renderers
    switch (component.type) {
    case 'container':
      return this.renderContainer(component);
    case 'text':
      return this.renderText(component);
    case 'input':
      return this.renderInput(component);
    case 'button':
      return this.renderButton(component);
    case 'form':
      return this.renderForm(component);
    default:
      console.warn(`Unknown component type: ${component.type}`);
      return this.renderFallback(component);
    }
  }

  /**
   * Render a container component
   */
  private renderContainer(component: MUPComponent): HTMLElement {
    const props = component.props as ContainerProps;
    const element = document.createElement('div');
    
    this.setBaseAttributes(element, component);
    this.applyContainerStyles(element, props);
    this.renderChildren(element, component.children);
    
    return element;
  }

  /**
   * Render a text component
   */
  private renderText(component: MUPComponent): HTMLElement {
    const props = component.props as TextProps;
    const tagName = this.getTextTagName(props.variant);
    const element = document.createElement(tagName);
    
    this.setBaseAttributes(element, component);
    element.textContent = props.content || '';
    this.applyTextStyles(element, props);
    
    return element;
  }

  /**
   * Render an input component
   */
  private renderInput(component: MUPComponent): HTMLElement {
    const props = component.props as InputProps;
    const element = document.createElement('input');
    
    this.setBaseAttributes(element, component);
    this.applyInputAttributes(element, props);
    this.applyInputStyles(element, props);
    this.attachInputEvents(element, component);
    
    return element;
  }

  /**
   * Render a button component
   */
  private renderButton(component: MUPComponent): HTMLElement {
    const props = component.props as ButtonProps;
    const element = document.createElement('button');
    
    this.setBaseAttributes(element, component);
    element.textContent = props.text || '';
    element.type = 'button';
    
    if (props.disabled) {
      element.disabled = true;
    }
    
    this.applyButtonStyles(element, props);
    this.attachButtonEvents(element, component);
    
    return element;
  }

  /**
   * Render a form component
   */
  private renderForm(component: MUPComponent): HTMLElement {
    const props = component.props as FormProps;
    const element = document.createElement('form');
    
    this.setBaseAttributes(element, component);
    
    if (props.method) {
      element.method = props.method;
    }
    
    if (props.action) {
      element.action = props.action;
    }
    
    this.renderChildren(element, component.children);
    this.attachFormEvents(element, component);
    
    return element;
  }

  /**
   * Render a fallback component for unknown types
   */
  private renderFallback(component: MUPComponent): HTMLElement {
    const element = document.createElement('div');
    this.setBaseAttributes(element, component);
    element.className = `${this.options.cssPrefix}unknown-component`;
    element.textContent = `Unknown component: ${component.type}`;
    return element;
  }

  /**
   * Set base attributes for all components
   */
  private setBaseAttributes(element: HTMLElement, component: MUPComponent): void {
    if (component.id) {
      element.setAttribute('data-mup-id', component.id);
    }
    
    element.className = `${this.options.cssPrefix}${component.type}`;
    
    if (component.style) {
      this.applyInlineStyles(element, component.style);
    }
  }

  /**
   * Render children components
   */
  private renderChildren(parent: HTMLElement, children?: MUPComponent[]): void {
    if (!children || !Array.isArray(children)) {
      return;
    }
    
    children.forEach(child => {
      const childElement = this.renderComponent(child);
      parent.appendChild(childElement);
    });
  }

  /**
   * Apply container-specific styles
   */
  private applyContainerStyles(element: HTMLElement, props: ContainerProps): void {
    const style = element.style;
    
    if (props.layout) {
      style.display = props.layout === 'flex' ? 'flex' : 'block';
    }
    
    if (props.direction) {
      style.flexDirection = props.direction;
    }
    
    if (props.align) {
      style.alignItems = props.align;
    }
    
    if (props.justify) {
      style.justifyContent = props.justify;
    }
    
    if (props.gap) {
      style.gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
    }
    
    if (props.padding) {
      style.padding = typeof props.padding === 'number' ? `${props.padding}px` : props.padding;
    }
    
    if (props.margin) {
      style.margin = typeof props.margin === 'number' ? `${props.margin}px` : props.margin;
    }
    
    if (props.background_color) {
      style.backgroundColor = props.background_color;
    }
    
    if (props.border) {
      style.border = props.border;
    }
  }

  /**
   * Apply text-specific styles
   */
  private applyTextStyles(element: HTMLElement, props: TextProps): void {
    const style = element.style;
    
    if (props.color) {
      style.color = props.color;
    }
    
    if (props.align) {
      style.textAlign = props.align;
    }
    
    if (props.weight) {
      style.fontWeight = props.weight;
    }
    
    if (props.size) {
      style.fontSize = typeof props.size === 'number' ? `${props.size}px` : props.size;
    }
    
    if (props.line_height) {
      style.lineHeight = typeof props.line_height === 'number' ? `${props.line_height}` : props.line_height;
    }
    
    if (props.font_family) {
      style.fontFamily = props.font_family;
    }
    
    if (props.decoration) {
      style.textDecoration = props.decoration;
    }
  }

  /**
   * Apply input attributes
   */
  private applyInputAttributes(element: HTMLInputElement, props: InputProps): void {
    if (props.type) {
      element.type = props.type;
    }
    
    if (props.name) {
      element.name = props.name;
    }
    
    if (props.placeholder) {
      element.placeholder = props.placeholder;
    }
    
    if (props.value !== undefined) {
      element.value = String(props.value);
    }
    
    if (props.required) {
      element.required = true;
    }
    
    if (props.disabled) {
      element.disabled = true;
    }
    
    if (props.readonly) {
      element.readOnly = true;
    }
    
    if (props.min !== undefined) {
      element.min = String(props.min);
    }
    
    if (props.max !== undefined) {
      element.max = String(props.max);
    }
    
    if (props.step !== undefined) {
      element.step = String(props.step);
    }
    
    if (props.pattern) {
      element.pattern = props.pattern;
    }
  }

  /**
   * Apply input-specific styles
   */
  private applyInputStyles(element: HTMLElement, props: InputProps): void {
    // Add any input-specific styling here
  }

  /**
   * Apply button-specific styles
   */
  private applyButtonStyles(element: HTMLElement, props: ButtonProps): void {
    if (props.variant) {
      element.classList.add(`${this.options.cssPrefix}button-${props.variant}`);
    }
    
    if (props.size) {
      element.classList.add(`${this.options.cssPrefix}button-${props.size}`);
    }
  }

  /**
   * Apply inline styles from component style object
   */
  private applyInlineStyles(element: HTMLElement, styles: Record<string, any>): void {
    Object.entries(styles).forEach(([property, value]) => {
      const cssProperty = MUPUtils.kebabCase(property);
      element.style.setProperty(cssProperty, String(value));
    });
  }

  /**
   * Get appropriate HTML tag for text variant
   */
  private getTextTagName(variant?: string): string {
    switch (variant) {
    case 'h1': return 'h1';
    case 'h2': return 'h2';
    case 'h3': return 'h3';
    case 'h4': return 'h4';
    case 'h5': return 'h5';
    case 'h6': return 'h6';
    case 'p': return 'p';
    case 'span': return 'span';
    case 'strong': return 'strong';
    case 'em': return 'em';
    case 'small': return 'small';
    default: return 'div';
    }
  }

  /**
   * Attach event handlers for input components
   */
  private attachInputEvents(element: HTMLInputElement, component: MUPComponent): void {
    if (!this.options.enableEventHandlers || !component.events) {
      return;
    }

    if (component.events.on_change) {
      const handler = (event: Event) => {
        this.emitComponentEvent(component.id!, 'change', {
          value: (event.target as HTMLInputElement).value
        });
      };
      element.addEventListener('change', handler);
      this.eventHandlers.set(`${component.id}-change`, handler);
    }

    if (component.events.on_focus) {
      const handler = () => {
        this.emitComponentEvent(component.id!, 'focus', {});
      };
      element.addEventListener('focus', handler);
      this.eventHandlers.set(`${component.id}-focus`, handler);
    }

    if (component.events.on_blur) {
      const handler = () => {
        this.emitComponentEvent(component.id!, 'blur', {
          value: element.value
        });
      };
      element.addEventListener('blur', handler);
      this.eventHandlers.set(`${component.id}-blur`, handler);
    }
  }

  /**
   * Attach event handlers for button components
   */
  private attachButtonEvents(element: HTMLButtonElement, component: MUPComponent): void {
    if (!this.options.enableEventHandlers || !component.events) {
      return;
    }

    if (component.events.on_click) {
      const handler = (event: Event) => {
        event.preventDefault();
        this.emitComponentEvent(component.id!, 'click', {});
      };
      element.addEventListener('click', handler);
      this.eventHandlers.set(`${component.id}-click`, handler);
    }
  }

  /**
   * Attach event handlers for form components
   */
  private attachFormEvents(element: HTMLFormElement, component: MUPComponent): void {
    if (!this.options.enableEventHandlers || !component.events) {
      return;
    }

    if (component.events.on_submit) {
      const handler = (event: Event) => {
        event.preventDefault();
        const formData = new FormData(element);
        const data = Object.fromEntries(formData.entries());
        this.emitComponentEvent(component.id!, 'submit', data);
      };
      element.addEventListener('submit', handler);
      this.eventHandlers.set(`${component.id}-submit`, handler);
    }

    if (component.events.on_reset) {
      const handler = () => {
        this.emitComponentEvent(component.id!, 'reset', {});
      };
      element.addEventListener('reset', handler);
      this.eventHandlers.set(`${component.id}-reset`, handler);
    }
  }

  /**
   * Emit a component event (to be overridden or handled by client)
   */
  private emitComponentEvent(componentId: string, eventType: string, eventData: any): void {
    // This will be handled by the MUPClient
    const event = new CustomEvent('mup-component-event', {
      detail: {
        componentId,
        eventType,
        eventData
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Clean up event handlers
   */
  cleanup(): void {
    this.eventHandlers.clear();
  }

  /**
   * Update renderer options
   */
  updateOptions(options: Partial<RendererOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Register a custom component renderer
   */
  registerRenderer(componentType: string, renderer: ComponentRenderer): void {
    this.options.customRenderers[componentType] = renderer;
  }

  /**
   * Unregister a custom component renderer
   */
  unregisterRenderer(componentType: string): void {
    delete this.options.customRenderers[componentType];
  }
}