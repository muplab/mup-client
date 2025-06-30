/**
 * MUP Event Manager
 * Event management for MUP client
 */

import { EventEmitter } from 'eventemitter3';
import { EventTrigger, ComponentEvent } from '@muprotocol/types';

/**
 * Event manager configuration
 */
export interface EventManagerConfig {
  maxListeners?: number;
  captureRejections?: boolean;
}

/**
 * Event manager for handling MUP events
 */
export class EventManager extends EventEmitter {
  private config: EventManagerConfig;

  constructor(config: EventManagerConfig = {}) {
    super();
    this.config = {
      maxListeners: 10,
      captureRejections: false,
      ...config
    };

    if (this.config.maxListeners) {
      this.setMaxListeners(this.config.maxListeners);
    }
  }

  /**
   * Handle incoming event trigger
   * @param eventTrigger - Event trigger message
   */
  handleEventTrigger(eventTrigger: EventTrigger): void {
    const { component_id, event_type, event_data } = eventTrigger.payload;
    
    // Emit component-specific event
    this.emit(`component:${component_id}:${event_type}`, event_data);
    
    // Emit general event
    this.emit('event', {
      componentId: component_id,
      eventType: event_type,
      data: event_data
    });
  }

  /**
   * Register component event handler
   * @param componentId - Component ID
   * @param eventType - Event type
   * @param handler - Event handler function
   */
  onComponentEvent(componentId: string, eventType: string, handler: (data: any) => void): void {
    this.on(`component:${componentId}:${eventType}`, handler);
  }

  /**
   * Remove component event handler
   * @param componentId - Component ID
   * @param eventType - Event type
   * @param handler - Event handler function
   */
  offComponentEvent(componentId: string, eventType: string, handler: (data: any) => void): void {
    this.off(`component:${componentId}:${eventType}`, handler);
  }

  /**
   * Trigger component event
   * @param componentId - Component ID
   * @param event - Component event
   */
  triggerComponentEvent(componentId: string, event: ComponentEvent): void {
    this.emit(`component:${componentId}:${event.type}`, event.data);
  }

  /**
   * Clear all event listeners
   */
  clearAllListeners(): void {
    this.removeAllListeners();
  }
}