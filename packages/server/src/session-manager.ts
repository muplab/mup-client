/**
 * MUP Session Manager
 * Manages client sessions for MUP protocol v1
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session data
 */
export interface SessionData {
  id: string;
  clientId: string;
  userId?: string;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
  data: Record<string, any>;
  isActive: boolean;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  ttl?: number;                    // Session TTL in milliseconds
  cleanupInterval?: number;        // Cleanup interval in milliseconds
  maxSessions?: number;           // Maximum sessions per client
  enablePersistence?: boolean;    // Enable session persistence
  storageAdapter?: SessionStorageAdapter;
}

/**
 * Session storage adapter interface
 */
export interface SessionStorageAdapter {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, session: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  list(): Promise<SessionData[]>;
  cleanup(expiredBefore: number): Promise<number>;
}

/**
 * Session manager events
 */
export interface SessionManagerEvents {
  'session:created': (session: SessionData) => void;
  'session:updated': (session: SessionData) => void;
  'session:expired': (sessionId: string) => void;
  'session:destroyed': (sessionId: string) => void;
  'cleanup:completed': (removedCount: number) => void;
}

/**
 * In-memory session storage adapter
 */
export class MemorySessionStorage implements SessionStorageAdapter {
  private sessions = new Map<string, SessionData>();

  async get(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    this.sessions.set(sessionId, session);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async list(): Promise<SessionData[]> {
    return Array.from(this.sessions.values());
  }

  async cleanup(expiredBefore: number): Promise<number> {
    let removedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < expiredBefore) {
        this.sessions.delete(sessionId);
        removedCount++;
      }
    }
    
    return removedCount;
  }
}

/**
 * MUP session manager
 */
export class SessionManager extends EventEmitter<SessionManagerEvents> {
  private config: Required<SessionConfig>;
  private storage: SessionStorageAdapter;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: SessionConfig = {}) {
    super();
    
    this.config = {
      ttl: config.ttl ?? 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1 hour
      maxSessions: config.maxSessions ?? 10,
      enablePersistence: config.enablePersistence ?? false,
      storageAdapter: config.storageAdapter ?? new MemorySessionStorage()
    };

    this.storage = this.config.storageAdapter;
    this.startCleanupTimer();
  }

  /**
   * Create new session
   * @param clientId - Client ID
   * @param userId - Optional user ID
   * @param initialData - Initial session data
   * @returns Created session
   */
  async createSession(
    clientId: string,
    userId?: string,
    initialData: Record<string, any> = {}
  ): Promise<SessionData> {
    // Check session limit for client
    const existingSessions = await this.getSessionsByClient(clientId);
    if (existingSessions.length >= this.config.maxSessions) {
      // Remove oldest session
      const oldestSession = existingSessions
        .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0];
      await this.destroySession(oldestSession.id);
    }

    const now = Date.now();
    const session: SessionData = {
      id: uuidv4(),
      clientId,
      userId,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.config.ttl,
      data: { ...initialData },
      isActive: true
    };

    await this.storage.set(session.id, session);
    this.emit('session:created', session);
    
    return session;
  }

  /**
   * Get session by ID
   * @param sessionId - Session ID
   * @returns Session data or null
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.storage.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await this.expireSession(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = Date.now();
    await this.storage.set(sessionId, session);
    
    return session;
  }

  /**
   * Update session data
   * @param sessionId - Session ID
   * @param data - Data to update
   * @returns Updated session or null
   */
  async updateSession(
    sessionId: string,
    data: Partial<Record<string, any>>
  ): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Merge data
    session.data = { ...session.data, ...data };
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return session;
  }

  /**
   * Set session data value
   * @param sessionId - Session ID
   * @param key - Data key
   * @param value - Data value
   * @returns True if successful
   */
  async setSessionData(sessionId: string, key: string, value: any): Promise<boolean> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    session.data[key] = value;
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return true;
  }

  /**
   * Get session data value
   * @param sessionId - Session ID
   * @param key - Data key
   * @returns Data value or undefined
   */
  async getSessionData(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    return session?.data[key];
  }

  /**
   * Remove session data value
   * @param sessionId - Session ID
   * @param key - Data key
   * @returns True if successful
   */
  async removeSessionData(sessionId: string, key: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    delete session.data[key];
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return true;
  }

  /**
   * Extend session expiration
   * @param sessionId - Session ID
   * @param additionalTime - Additional time in milliseconds
   * @returns True if successful
   */
  async extendSession(sessionId: string, additionalTime?: number): Promise<boolean> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    const extension = additionalTime ?? this.config.ttl;
    session.expiresAt = Math.max(session.expiresAt, Date.now()) + extension;
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return true;
  }

  /**
   * Destroy session
   * @param sessionId - Session ID
   * @returns True if successful
   */
  async destroySession(sessionId: string): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    
    if (!session) {
      return false;
    }

    await this.storage.delete(sessionId);
    this.emit('session:destroyed', sessionId);
    
    return true;
  }

  /**
   * Get sessions by client ID
   * @param clientId - Client ID
   * @returns Array of sessions
   */
  async getSessionsByClient(clientId: string): Promise<SessionData[]> {
    const allSessions = await this.storage.list();
    return allSessions.filter(session => 
      session.clientId === clientId && 
      session.expiresAt > Date.now()
    );
  }

  /**
   * Get sessions by user ID
   * @param userId - User ID
   * @returns Array of sessions
   */
  async getSessionsByUser(userId: string): Promise<SessionData[]> {
    const allSessions = await this.storage.list();
    return allSessions.filter(session => 
      session.userId === userId && 
      session.expiresAt > Date.now()
    );
  }

  /**
   * Get all active sessions
   * @returns Array of active sessions
   */
  async getActiveSessions(): Promise<SessionData[]> {
    const allSessions = await this.storage.list();
    return allSessions.filter(session => 
      session.isActive && 
      session.expiresAt > Date.now()
    );
  }

  /**
   * Get session count
   * @returns Number of active sessions
   */
  async getSessionCount(): Promise<number> {
    const activeSessions = await this.getActiveSessions();
    return activeSessions.length;
  }

  /**
   * Deactivate session
   * @param sessionId - Session ID
   * @returns True if successful
   */
  async deactivateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    session.isActive = false;
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return true;
  }

  /**
   * Reactivate session
   * @param sessionId - Session ID
   * @returns True if successful
   */
  async reactivateSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
      return false;
    }

    session.isActive = true;
    session.lastAccessedAt = Date.now();
    
    await this.storage.set(sessionId, session);
    this.emit('session:updated', session);
    
    return true;
  }

  /**
   * Destroy all sessions for client
   * @param clientId - Client ID
   * @returns Number of destroyed sessions
   */
  async destroyClientSessions(clientId: string): Promise<number> {
    const sessions = await this.getSessionsByClient(clientId);
    let destroyedCount = 0;
    
    for (const session of sessions) {
      if (await this.destroySession(session.id)) {
        destroyedCount++;
      }
    }
    
    return destroyedCount;
  }

  /**
   * Destroy all sessions for user
   * @param userId - User ID
   * @returns Number of destroyed sessions
   */
  async destroyUserSessions(userId: string): Promise<number> {
    const sessions = await this.getSessionsByUser(userId);
    let destroyedCount = 0;
    
    for (const session of sessions) {
      if (await this.destroySession(session.id)) {
        destroyedCount++;
      }
    }
    
    return destroyedCount;
  }

  /**
   * Clean up expired sessions
   * @returns Number of cleaned up sessions
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const removedCount = await this.storage.cleanup(now);
    
    this.emit('cleanup:completed', removedCount);
    
    return removedCount;
  }

  /**
   * Stop session manager
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get session statistics
   * @returns Session statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byClient: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const allSessions = await this.storage.list();
    const now = Date.now();
    
    const stats = {
      total: allSessions.length,
      active: 0,
      expired: 0,
      byClient: {} as Record<string, number>,
      byUser: {} as Record<string, number>
    };
    
    for (const session of allSessions) {
      if (session.expiresAt > now && session.isActive) {
        stats.active++;
      } else {
        stats.expired++;
      }
      
      // Count by client
      stats.byClient[session.clientId] = (stats.byClient[session.clientId] || 0) + 1;
      
      // Count by user
      if (session.userId) {
        stats.byUser[session.userId] = (stats.byUser[session.userId] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * Expire session
   * @param sessionId - Session ID
   */
  private async expireSession(sessionId: string): Promise<void> {
    await this.storage.delete(sessionId);
    this.emit('session:expired', sessionId);
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }, this.config.cleanupInterval);
  }
}