import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { ClientCapabilities, MUPMessage } from '@muprotocol/types';
import { MUPUtils, MessageParser } from '@muprotocol/core';

export interface SessionMetadata {
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export class Session {
  readonly id: string;
  private socket: WebSocket;
  private request: IncomingMessage;
  private authenticated = false;
  private clientCapabilities: ClientCapabilities | null = null;
  private metadata: SessionMetadata = {};
  private createdAt: number;
  private lastActivity: number;
  private isAliveFlag = true;
  private pingTimeout?: NodeJS.Timeout;

  constructor(socket: WebSocket, request: IncomingMessage) {
    this.id = uuidv4();
    this.socket = socket;
    this.request = request;
    this.createdAt = Date.now();
    this.lastActivity = this.createdAt;

    // Extract basic metadata
    this.metadata.ip = request.socket.remoteAddress;
    this.metadata.userAgent = request.headers['user-agent'];

    // Setup pong handler
    socket.on('pong', () => {
      this.isAliveFlag = true;
      this.updateActivity();
    });
  }

  /**
   * Send a message to the client
   */
  async send(message: MUPMessage | string): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      
      this.socket.send(data, (error) => {
        if (error) {
          reject(error);
        } else {
          this.updateActivity();
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect the client
   */
  disconnect(reason?: string): void {
    try {
      this.socket.close(1000, reason);
    } catch (error) {
      console.error('Error closing socket:', error);
    }
  }

  /**
   * Send a ping to the client
   */
  ping(timeout = 5000): void {
    this.isAliveFlag = false;
    
    // Clear any existing timeout
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }

    // Set a new timeout
    this.pingTimeout = setTimeout(() => {
      this.isAliveFlag = false;
    }, timeout);

    // Send ping
    try {
      this.socket.ping();
    } catch (error) {
      console.error('Error sending ping:', error);
      this.isAliveFlag = false;
    }
  }

  /**
   * Check if the client is alive
   */
  isAlive(): boolean {
    return this.isAliveFlag && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Set the client as authenticated
   */
  setAuthenticated(value: boolean): void {
    this.authenticated = value;
    this.updateActivity();
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Set client capabilities
   */
  setClientCapabilities(capabilities: ClientCapabilities | null): void {
    this.clientCapabilities = capabilities ? MUPUtils.deepCopy(capabilities) : null;
  }

  /**
   * Get client capabilities
   */
  getClientCapabilities(): ClientCapabilities | null {
    return this.clientCapabilities ? MUPUtils.deepCopy(this.clientCapabilities) : null;
  }

  /**
   * Set session metadata
   */
  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * Get session metadata
   */
  getMetadata(key?: string): any {
    if (key) {
      return this.metadata[key];
    }
    return { ...this.metadata };
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Get session creation time
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Get last activity time
   */
  getLastActivity(): number {
    return this.lastActivity;
  }

  /**
   * Get session age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt;
  }

  /**
   * Get time since last activity in milliseconds
   */
  getIdleTime(): number {
    return Date.now() - this.lastActivity;
  }

  /**
   * Get the client's IP address
   */
  getIp(): string | undefined {
    return this.metadata.ip;
  }

  /**
   * Get the client's user agent
   */
  getUserAgent(): string | undefined {
    return this.metadata.userAgent;
  }

  /**
   * Get the WebSocket readyState
   */
  getReadyState(): number {
    return this.socket.readyState;
  }

  /**
   * Check if the WebSocket is open
   */
  isOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the original request
   */
  getRequest(): IncomingMessage {
    return this.request;
  }
}

export type SessionEventListener<T = any> = (data: T) => void;

export interface SessionEventMap {
  [event: string]: SessionEventListener[];
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private events: SessionEventMap = {};

  /**
   * Create a new session
   */
  createSession(socket: WebSocket, request: IncomingMessage): Session {
    const session = new Session(socket, request);
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get authenticated sessions
   */
  getAuthenticatedSessions(): Session[] {
    return this.getAllSessions().filter(session => session.isAuthenticated());
  }

  /**
   * Get the number of sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get the number of authenticated sessions
   */
  getAuthenticatedSessionCount(): number {
    return this.getAuthenticatedSessions().length;
  }

  /**
   * Broadcast a message to all sessions
   */
  async broadcast(message: MUPMessage | string, authenticatedOnly = true): Promise<void> {
    const sessions = authenticatedOnly ? this.getAuthenticatedSessions() : this.getAllSessions();
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    
    const promises = sessions.map(session => session.send(data));
    await Promise.all(promises);
  }

  /**
   * Disconnect all sessions
   */
  disconnectAll(reason?: string): void {
    this.getAllSessions().forEach(session => {
      session.disconnect(reason);
    });
  }

  /**
   * Find sessions by metadata
   */
  findSessionsByMetadata(key: string, value: any): Session[] {
    return this.getAllSessions().filter(session => {
      const metadataValue = session.getMetadata(key);
      return metadataValue === value;
    });
  }

  /**
   * Find sessions by IP address
   */
  findSessionsByIp(ip: string): Session[] {
    return this.findSessionsByMetadata('ip', ip);
  }

  /**
   * Find sessions by user agent
   */
  findSessionsByUserAgent(userAgent: string): Session[] {
    return this.findSessionsByMetadata('userAgent', userAgent);
  }

  /**
   * Find idle sessions
   */
  findIdleSessions(idleTime: number): Session[] {
    const now = Date.now();
    return this.getAllSessions().filter(session => {
      return now - session.getLastActivity() >= idleTime;
    });
  }

  /**
   * Disconnect idle sessions
   */
  disconnectIdleSessions(idleTime: number, reason = 'Session timeout'): number {
    const idleSessions = this.findIdleSessions(idleTime);
    idleSessions.forEach(session => {
      session.disconnect(reason);
    });
    return idleSessions.length;
  }

  /**
   * Add an event listener
   */
  on<T = any>(event: string, listener: SessionEventListener<T>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Remove an event listener
   */
  off<T = any>(event: string, listener: SessionEventListener<T>): void {
    if (!this.events[event]) {
      return;
    }
    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  /**
   * Add a one-time event listener
   */
  once<T = any>(event: string, listener: SessionEventListener<T>): void {
    const onceListener = (data: T) => {
      this.off(event, onceListener);
      listener(data);
    };
    this.on(event, onceListener);
  }

  /**
   * Emit an event
   */
  emit<T = any>(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }
    const listeners = [...this.events[event]];
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    totalSessions: number;
    authenticatedSessions: number;
    openSessions: number;
    events: Record<string, number>;
    } {
    const events: Record<string, number> = {};
    Object.keys(this.events).forEach(event => {
      events[event] = this.events[event].length;
    });

    return {
      totalSessions: this.sessions.size,
      authenticatedSessions: this.getAuthenticatedSessionCount(),
      openSessions: this.getAllSessions().filter(session => session.isOpen()).length,
      events
    };
  }
}