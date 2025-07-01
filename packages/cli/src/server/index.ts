import { Server, createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { existsSync, readFileSync, watchFile } from 'fs';
import { extname, join } from 'path';
import { URL } from 'url';
import { createProgress, logger } from '../utils/logger';
import { Component, MUPMessage } from '@muprotocol/types';

export interface ServerConfig {
  port: number;
  host: string;
  protocol: 'http' | 'https';
  ssl?: {
    cert: string;
    key: string;
  };
  staticDir?: string;
  hotReload?: boolean;
  cors?: boolean;
  maxConnections?: number;
  timeout?: number;
}

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  lastPing: number;
  capabilities?: string[];
}

export class MupDevServer {
  private config: ServerConfig;
  private httpServer: Server;
  private wsServer: WebSocketServer;
  private connections: Map<string, ClientConnection>;
  private components: Component[];
  private isRunning: boolean;
  private pingInterval?: NodeJS.Timeout;
  private fileWatchers: Map<string, () => void>;

  constructor(config: ServerConfig) {
    this.config = {
      staticDir: 'public',
      hotReload: true,
      cors: true,
      maxConnections: 100,
      timeout: 30000,
      ...config
    };
    
    this.connections = new Map();
    this.components = [];
    this.isRunning = false;
    this.fileWatchers = new Map();
    
    this.httpServer = createServer(this.handleHttpRequest.bind(this));
    this.wsServer = new WebSocketServer({ server: this.httpServer });
    
    this.setupWebSocketServer();
  }

  /**
   * Start the development server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    const progress = createProgress('Starting MUP development server');
    progress.start();

    try {
      await new Promise<void>((resolve, reject) => {
        this.httpServer.listen(this.config.port, this.config.host, () => {
          resolve();
        });
        
        this.httpServer.on('error', reject);
      });

      this.isRunning = true;
      this.startPingInterval();
      
      if (this.config.hotReload) {
        this.setupFileWatching();
      }

      progress.stop();
      logger.success(`Server started on ${this.config.protocol}://${this.config.host}:${this.config.port}`);
      
      if (this.config.staticDir) {
        logger.info(`Serving static files from: ${this.config.staticDir}`);
      }
      
      if (this.config.hotReload) {
        logger.info('Hot reload enabled');
      }
      
    } catch (error) {
      progress.fail('Failed to start server');
      throw error;
    }
  }

  /**
   * Stop the development server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping server...');

    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Stop file watchers
    this.fileWatchers.forEach(unwatch => unwatch());
    this.fileWatchers.clear();

    // Close all WebSocket connections
    this.connections.forEach(connection => {
      connection.ws.close(1000, 'Server shutting down');
    });
    this.connections.clear();

    // Close servers
    this.wsServer.close();
    
    await new Promise<void>((resolve) => {
      this.httpServer.close(() => resolve());
    });

    this.isRunning = false;
    logger.success('Server stopped');
  }

  /**
   * Close the server (alias for stop)
   */
  close(callback?: () => void): void {
    this.stop().then(() => {
      if (callback) callback();
    }).catch((error) => {
      logger.error('Error closing server:', error);
      if (callback) callback();
    });
  }

  /**
   * Get server status
   */
  getStatus(): {
    running: boolean;
    connections: number;
    uptime: number;
    config: ServerConfig;
    } {
    return {
      running: this.isRunning,
      connections: this.connections.size,
      uptime: this.isRunning ? process.uptime() : 0,
      config: this.config
    };
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.connections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    });
    
    logger.debug(`Broadcasted message to ${this.connections.size} clients:`, message.type);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: any): boolean {
    const connection = this.connections.get(clientId);
    
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
      logger.debug(`Sent message to client ${clientId}:`, message.type);
      return true;
    }
    
    return false;
  }

  /**
   * Update components and broadcast to clients
   */
  updateComponents(components: Component[]): void {
    this.components = components;
    
    const message: any = {
      type: 'component_update',
      id: `update_${Date.now()}`,
      timestamp: Date.now(),
      data: { components }
    };
    
    this.broadcast(message);
    logger.info(`Updated ${components.length} components`);
  }

  private setupWebSocketServer(): void {
    this.wsServer.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const connection: ClientConnection = {
        id: clientId,
        ws,
        lastPing: Date.now()
      };

      // Check connection limit
      if (this.connections.size >= this.config.maxConnections!) {
        ws.close(1013, 'Server at capacity');
        return;
      }

      this.connections.set(clientId, connection);
      logger.info(`Client connected: ${clientId} (${this.connections.size} total)`);

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message: any = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error(`Invalid message from client ${clientId}:`, error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Handle disconnection
      ws.on('close', (code, reason) => {
        this.connections.delete(clientId);
        logger.info(`Client disconnected: ${clientId} (${code}: ${reason})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.connections.delete(clientId);
      });

      // Send initial handshake
      this.sendHandshakeResponse(clientId);
    });
  }

  private handleMessage(clientId: string, message: any): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    logger.debug(`Received message from ${clientId}:`, message.type);

    switch (message.type) {
    case 'handshake_request':
      this.handleHandshake(clientId, message);
      break;
    case 'user_action':
      this.handleUserAction(clientId, message);
      break;
    case 'ping':
      this.handlePing(clientId, message);
      break;
    default:
      logger.warn(`Unknown message type from ${clientId}:`, message.type);
    }
  }

  private handleHandshake(clientId: string, message: any): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    const { version, capabilities } = message.data || {};
    
    // Validate version compatibility
    if (version && !this.isVersionCompatible(version)) {
      this.sendError(clientId, `Unsupported protocol version: ${version}`);
      return;
    }

    // Store capabilities
    connection.capabilities = capabilities || [];
    connection.sessionId = this.generateSessionId();

    this.sendHandshakeResponse(clientId, true);
    
    // Send current components
    if (this.components.length > 0) {
      this.sendToClient(clientId, {
        type: 'component_update',
        id: `initial_${Date.now()}`,
        timestamp: Date.now(),
        data: { components: this.components }
      });
    }
  }

  private handleUserAction(clientId: string, message: any): void {
    logger.info(`User action from ${clientId}:`, message.data);
    
    // Echo the action back for demo purposes
    // In a real application, this would trigger business logic
    this.sendToClient(clientId, {
      type: 'user_action',
      id: `response_${message.id}`,
      timestamp: Date.now(),
      data: {
        originalAction: message.data,
        response: 'Action received and processed'
      }
    });
  }

  private handlePing(clientId: string, message: any): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastPing = Date.now();
      
      // Send pong response
      this.sendToClient(clientId, {
        type: 'pong',
        id: `pong_${message.id}`,
        timestamp: Date.now(),
        data: {}
      });
    }
  }

  private sendHandshakeResponse(clientId: string, accepted = true): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    this.sendToClient(clientId, {
      type: 'handshake_response',
      id: `handshake_${Date.now()}`,
      timestamp: Date.now(),
      data: {
        accepted,
        sessionId: connection.sessionId,
        serverCapabilities: ['hot_reload', 'component_update', 'user_action'],
        version: '1.0'
      }
    });
  }

  private sendError(clientId: string, message: string, code = 'GENERAL_ERROR'): void {
    this.sendToClient(clientId, {
      type: 'error',
      id: `error_${Date.now()}`,
      timestamp: Date.now(),
      data: {
        message,
        code
      }
    });
  }

  private handleHttpRequest(req: any, res: any): void {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS headers
    if (this.config.cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve static files
    if (this.config.staticDir) {
      this.serveStaticFile(pathname, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private serveStaticFile(pathname: string, res: any): void {
    let filePath = join(this.config.staticDir!, pathname === '/' ? 'index.html' : pathname);
    
    if (!existsSync(filePath)) {
      // Try with .html extension
      const htmlPath = `${filePath  }.html`;
      if (existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = this.getContentType(ext);
      
      res.setHeader('Content-Type', contentType);
      res.writeHead(200);
      res.end(content);
      
    } catch (error) {
      logger.error('Error serving file:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    
    return types[ext] || 'application/octet-stream';
  }

  private setupFileWatching(): void {
    if (!this.config.staticDir || !existsSync(this.config.staticDir)) {
      return;
    }

    // Watch for file changes and trigger hot reload
    const watchPath = this.config.staticDir;
    
    const watcher = () => {
      logger.info('File changed, triggering hot reload');
      
      this.broadcast({
        type: 'component_update',
        id: `reload_${Date.now()}`,
        timestamp: Date.now(),
        data: {
          reload: true
        }
      });
    };

    watchFile(watchPath, watcher);
    this.fileWatchers.set(watchPath, watcher);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.timeout!;
      
      this.connections.forEach((connection, clientId) => {
        if (now - connection.lastPing > timeout) {
          logger.warn(`Client ${clientId} timed out`);
          connection.ws.close(1000, 'Timeout');
          this.connections.delete(clientId);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const supportedVersions = ['1.0', '1.1'];
    return supportedVersions.includes(version);
  }
}

/**
 * Create and start a development server
 */
export async function startDevServer(config: ServerConfig): Promise<MupDevServer> {
  const server = new MupDevServer(config);
  await server.start();
  return server;
}

/**
 * Default server configuration
 */
export const defaultServerConfig: ServerConfig = {
  port: 8080,
  host: 'localhost',
  protocol: 'http',
  staticDir: 'public',
  hotReload: true,
  cors: true,
  maxConnections: 100,
  timeout: 30000
};