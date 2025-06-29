import { MUPUtils } from '@muprotocol/core';

export type EventListener<T = any> = (data: T) => void;

export interface EventMap {
  [event: string]: EventListener[];
}

export class EventManager {
  private events: EventMap = {};
  private maxListeners = 100;
  private onceListeners = new WeakMap<EventListener, EventListener>();

  /**
   * Add an event listener
   */
  on<T = any>(event: string, listener: EventListener<T>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    if (this.events[event].length >= this.maxListeners) {
      console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event: ${event}`);
      return;
    }

    this.events[event].push(listener);
  }

  /**
   * Add a one-time event listener
   */
  once<T = any>(event: string, listener: EventListener<T>): void {
    const onceWrapper = (data: T) => {
      this.off(event, onceWrapper);
      listener(data);
    };

    this.onceListeners.set(listener, onceWrapper);
    this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  off<T = any>(event: string, listener: EventListener<T>): void {
    if (!this.events[event]) {
      return;
    }

    // Check if this is a once listener
    const onceWrapper = this.onceListeners.get(listener);
    const targetListener = onceWrapper || listener;

    const index = this.events[event].indexOf(targetListener);
    if (index > -1) {
      this.events[event].splice(index, 1);
      
      if (onceWrapper) {
        this.onceListeners.delete(listener);
      }
    }

    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit<T = any>(event: string, data?: T): void {
    if (!this.events[event]) {
      return;
    }

    // Create a copy of listeners to avoid issues if listeners are modified during emission
    const listeners = [...this.events[event]];
    
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
      // Clear the WeakMap by creating a new one
      this.onceListeners = new WeakMap();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Set the maximum number of listeners per event
   */
  setMaxListeners(max: number): void {
    this.maxListeners = Math.max(0, max);
  }

  /**
   * Get the maximum number of listeners per event
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Create a debounced event emitter
   */
  createDebouncedEmitter<T = any>(event: string, delay: number): (data?: T) => void {
    return MUPUtils.debounce((data?: T) => {
      this.emit(event, data);
    }, delay);
  }

  /**
   * Create a throttled event emitter
   */
  createThrottledEmitter<T = any>(event: string, delay: number): (data?: T) => void {
    return MUPUtils.throttle((data?: T) => {
      this.emit(event, data);
    }, delay);
  }

  /**
   * Wait for an event to be emitted
   */
  waitFor<T = any>(event: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      const listener = (data: T) => {
        cleanup();
        resolve(data);
      };

      this.once(event, listener);

      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          this.off(event, listener);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeout);
      }
    });
  }

  /**
   * Create a promise that resolves when any of the specified events are emitted
   */
  waitForAny<T = any>(events: string[], timeout?: number): Promise<{ event: string; data: T }> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
      const listeners: Array<{ event: string; listener: EventListener }> = [];

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        listeners.forEach(({ event, listener }) => {
          this.off(event, listener);
        });
      };

      events.forEach(event => {
        const listener = (data: T) => {
          cleanup();
          resolve({ event, data });
        };
        listeners.push({ event, listener });
        this.once(event, listener);
      });

      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for events: ${events.join(', ')}`));
        }, timeout);
      }
    });
  }

  /**
   * Get debug information about the event manager
   */
  getDebugInfo(): {
    totalEvents: number;
    totalListeners: number;
    events: Record<string, number>;
    maxListeners: number;
    } {
    const events: Record<string, number> = {};
    let totalListeners = 0;

    Object.keys(this.events).forEach(event => {
      const count = this.events[event].length;
      events[event] = count;
      totalListeners += count;
    });

    return {
      totalEvents: Object.keys(this.events).length,
      totalListeners,
      events,
      maxListeners: this.maxListeners
    };
  }
}