// Simple ES module wrapper for MUP Client
// This is a simplified version for the demo
// In a real application, you would import from the built packages

class EventManager {
  constructor() {
    this.listeners = new Map();
    this.maxListeners = 10;
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  off(event, listener) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}

class ComponentRenderer {
  constructor() {
    this.customRenderers = new Map();
  }

  renderComponent(component, container) {
    if (!component || !container) {
      return null;
    }

    const element = this.createElement(component);
    if (!element) {
      return null;
    }

    container.appendChild(element);
    return element;
  }

  createElement(component) {
    const { type, props = {}, children = [], events = {} } = component;

    let element;

    switch (type) {
      case 'container':
        element = document.createElement('div');
        element.className = 'mup-container';
        if (props.direction) {
          element.setAttribute('data-direction', props.direction);
        }
        break;

      case 'text':
        const tag = props.variant === 'h1' ? 'h1' : 
                   props.variant === 'h2' ? 'h2' : 
                   props.variant === 'h3' ? 'h3' : 'p';
        element = document.createElement(tag);
        element.className = 'mup-text';
        element.textContent = props.content || '';
        break;

      case 'input':
        element = document.createElement('input');
        element.className = 'mup-input';
        element.type = props.type || 'text';
        element.placeholder = props.placeholder || '';
        element.required = props.required || false;
        element.name = component.id;
        break;

      case 'button':
        element = document.createElement('button');
        element.className = 'mup-button';
        element.type = props.type || 'button';
        element.textContent = props.text || '';
        break;

      case 'form':
        element = document.createElement('form');
        element.className = 'mup-form';
        break;

      default:
        console.warn(`Unknown component type: ${type}`);
        element = document.createElement('div');
    }

    // Apply styles
    if (props.style) {
      Object.assign(element.style, props.style);
    }

    // Apply other props
    Object.keys(props).forEach(key => {
      if (key !== 'style' && key !== 'content' && key !== 'text') {
        if (typeof props[key] === 'string' || typeof props[key] === 'number') {
          element.setAttribute(key, props[key]);
        }
      }
    });

    // Set ID
    element.id = component.id;

    // Render children
    if (children && children.length > 0) {
      children.forEach(child => {
        const childElement = this.createElement(child);
        if (childElement) {
          element.appendChild(childElement);
        }
      });
    }

    // Attach event listeners
    this.attachEvents(element, component, events);

    return element;
  }

  attachEvents(element, component, events) {
    if (events.on_click) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleEvent(component.id, 'click', { target: e.target.id });
      });
    }

    if (events.on_submit && element.tagName === 'FORM') {
      element.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(element);
        const data = {};
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        this.handleEvent(component.id, 'submit', data);
        
        // Clear form inputs
        element.querySelectorAll('input[type="text"]').forEach(input => {
          if (input.name !== 'username-input') { // Keep username
            input.value = '';
          }
        });
      });
    }

    if (events.on_change) {
      element.addEventListener('change', (e) => {
        this.handleEvent(component.id, 'change', { value: e.target.value });
      });
    }
  }

  handleEvent(componentId, eventType, data) {
    if (window.mupClient) {
      window.mupClient.sendEvent(componentId, eventType, data);
    }
  }
}

class StateManager {
  constructor() {
    this.components = new Map();
  }

  updateComponent(component) {
    this.components.set(component.id, component);
  }

  getComponent(id) {
    return this.components.get(id);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  removeComponent(id) {
    this.components.delete(id);
  }

  clear() {
    this.components.clear();
  }
}

export class MUPClient {
  constructor(config) {
    this.config = {
      url: config.url,
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        delay: 1000,
        ...config.reconnect
      },
      auth: config.auth
    };

    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;

    this.eventManager = new EventManager();
    this.renderer = new ComponentRenderer();
    this.stateManager = new StateManager();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.eventManager.emit('connected');
          // Send initial UI request
          this.sendUIRequest();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.eventManager.emit('disconnected');
          
          if (this.config.reconnect.enabled && 
              this.reconnectAttempts < this.config.reconnect.maxAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.eventManager.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.eventManager.emit('reconnecting', this.reconnectAttempts);
      
      this.connect().catch(() => {
        // Reconnection failed, will try again if attempts remain
      });
    }, this.config.reconnect.delay * Math.pow(2, this.reconnectAttempts));
  }

  handleMessage(message) {
    console.log('Received message:', message);

    switch (message.type) {
      case 'ui_response':
        if (message.components && Array.isArray(message.components)) {
          message.components.forEach(component => {
            this.updateComponent(component);
          });
        }
        break;

      case 'event_trigger':
        this.eventManager.emit('event_trigger', message);
        break;

      case 'component_update':
        if (message.component) {
          this.stateManager.updateComponent(message.component);
          this.eventManager.emit('component_update', message.component);
        }
        break;

      case 'error':
        console.error('Server error:', message.error);
        this.eventManager.emit('error', new Error(message.error.message));
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  sendUIRequest() {
    if (!this.isConnected || !this.ws) {
      console.warn('Cannot send UI request: not connected');
      return;
    }

    const message = {
      type: 'ui_request',
      request_id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending UI request:', message);
    this.ws.send(JSON.stringify(message));
  }

  sendEvent(componentId, eventType, data) {
    if (!this.isConnected || !this.ws) {
      console.warn('Cannot send event: not connected');
      return;
    }

    const message = {
      type: 'event_trigger',
      component_id: componentId,
      event_type: eventType,
      event_data: data,
      timestamp: new Date().toISOString()
    };

    console.log('Sending event trigger:', message);
    this.ws.send(JSON.stringify(message));
  }

  updateComponent(component) {
    this.stateManager.updateComponent(component);
    this.eventManager.emit('component_update', component);
  }

  renderComponent(component, container) {
    return this.renderer.renderComponent(component, container);
  }

  on(event, listener) {
    this.eventManager.on(event, listener);
  }

  off(event, listener) {
    this.eventManager.off(event, listener);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  getConnectionState() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}