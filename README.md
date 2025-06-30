# MUP SDK v1.0.0

**Model UI Protocol (MUP) SDK** - A comprehensive TypeScript/JavaScript SDK for implementing the MUP protocol, enabling dynamic UI generation and interaction between AI models and client applications.

## Overview

The MUP SDK provides both client and server implementations of the Model UI Protocol v1.0, allowing developers to build applications that can dynamically generate and interact with user interfaces through a standardized WebSocket-based protocol.

## Architecture

This is a monorepo containing four main packages:

- **@muprotocol/types** - Core type definitions and interfaces
- **@muprotocol/core** - Shared utilities, connection management, and message handling
- **@muprotocol/client** - Client-side SDK for connecting to MUP servers
- **@muprotocol/server** - Server-side SDK for creating MUP-compatible servers

## Features

- 🚀 **Full TypeScript Support** - Complete type definitions and IntelliSense
- 🔄 **Real-time Communication** - WebSocket-based bidirectional messaging
- 🎨 **Dynamic UI Components** - Flexible component system with rendering support
- 🛡️ **Built-in Validation** - Message and component validation
- 📦 **Modular Architecture** - Separate packages for different use cases
- 🔧 **Extensible** - Plugin system and custom renderers
- 📊 **State Management** - Built-in state management with persistence
- 🔐 **Session Management** - Secure session handling with TTL support

### Core Features
- ✅ WebSocket-based communication
- ✅ Message serialization/deserialization
- ✅ Handshake protocol implementation
- ✅ Component tree management
- ✅ Event handling system
- ✅ Type-safe TypeScript definitions
- ✅ Authentication and authorization
- ✅ Error handling and recovery
- ✅ Connection management with auto-reconnect

### Client Features
- ✅ Automatic connection management
- ✅ Component state management
- ✅ DOM rendering engine
- ✅ Event delegation
- ✅ Real-time UI updates

### Server Features
- ✅ Session management
- ✅ Component registration and broadcasting
- ✅ Middleware support
- ✅ Rate limiting
- ✅ Authentication middleware
- ✅ CORS support

## Quick Start

### Installation

```bash
# Install all dependencies
npm install

# Bootstrap packages
npm run bootstrap

# Build all packages
npm run build
```

### Client Usage

```typescript
import { MUPClient } from '@muprotocol/client';

// Create a client instance
const client = new MUPClient({
  url: 'ws://localhost:3000/mup',
  auth: {
    type: 'bearer',
    token: 'your-auth-token'
  }
});

// Listen for component updates
client.on('component_update', (component) => {
  console.log('Received component:', component);
  
  // Render the component to DOM
  const container = document.getElementById('app');
  client.renderComponent(component, container);
});

// Connect to server
await client.connect();

// Send events
await client.sendEvent('button-1', 'click', { value: 'Hello' });
```

### Server Usage

```typescript
import { MUPServer } from '@muprotocol/server';

// Create a server instance
const server = new MUPServer({
  port: 3000,
  path: '/mup',
  auth: {
    required: true,
    validator: async (credentials) => {
      // Validate credentials
      return credentials.token === 'valid-token';
    }
  }
});

// Listen for client events
server.on('client_event', (session, event) => {
  console.log('Received event:', event);
  
  // Handle the event and send component updates
  const component = {
    id: 'response-1',
    type: 'text',
    props: {
      content: `You clicked: ${event.event_data?.value}`
    }
  };
  
  server.sendComponentUpdate(session.id, component);
});

// Start the server
await server.start();
console.log('MUP Server started on ws://localhost:3000/mup');
```

## Component Types

The MUP protocol supports several built-in component types:

### Container
```typescript
{
  id: 'container-1',
  type: 'container',
  props: {
    layout: 'flex',
    direction: 'column',
    align: 'center',
    gap: 16,
    padding: 20
  },
  children: [/* child components */]
}
```

### Text
```typescript
{
  id: 'text-1',
  type: 'text',
  props: {
    content: 'Hello, World!',
    variant: 'h1',
    color: '#333',
    align: 'center'
  }
}
```

### Input
```typescript
{
  id: 'input-1',
  type: 'input',
  props: {
    type: 'text',
    placeholder: 'Enter your name',
    required: true
  },
  events: {
    on_change: true,
    on_focus: true,
    on_blur: true
  }
}
```

### Button
```typescript
{
  id: 'button-1',
  type: 'button',
  props: {
    text: 'Click me',
    variant: 'primary',
    size: 'medium'
  },
  events: {
    on_click: true
  }
}
```

### Form
```typescript
{
  id: 'form-1',
  type: 'form',
  props: {
    title: 'User Registration',
    method: 'POST'
  },
  children: [/* form inputs */],
  events: {
    on_submit: true,
    on_reset: true
  }
}
```

## Development

### Project Structure

```
mup-sdk/
├── packages/
│   ├── types/          # Type definitions
│   ├── core/           # Core utilities
│   ├── client/         # Client SDK
│   └── server/         # Server SDK
├── package.json        # Root package configuration
├── lerna.json          # Lerna configuration
├── tsconfig.json       # TypeScript configuration
└── jest.config.js      # Jest test configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start development mode with watch
npm run build            # Build all packages
npm run clean            # Clean build artifacts

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Linting
npm run lint             # Lint all packages
npm run lint:fix         # Fix linting issues

# Publishing
npm run publish          # Publish packages to npm
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/client
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/core
npm test

# Run tests with coverage
npm run test:coverage
```

## API Reference

### Client API

#### MUPClient

```typescript
class MUPClient {
  constructor(config: MUPClientConfig)
  
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Component management
  getComponent(id: string): MUPComponent | null
  getAllComponents(): MUPComponent[]
  getComponentTree(): MUPComponent | null
  
  // Rendering
  renderComponent(component: MUPComponent, container?: HTMLElement): HTMLElement
  renderComponentTree(container?: HTMLElement): HTMLElement | null
  
  // Events
  sendEvent(componentId: string, eventType: string, data?: any): Promise<void>
  on(event: string, listener: Function): void
  off(event: string, listener: Function): void
}
```

### Server API

#### MUPServer

```typescript
class MUPServer {
  constructor(config: MUPServerConfig)
  
  // Server lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  isStarted(): boolean
  
  // Component management
  sendComponentUpdate(sessionId: string, component: MUPComponent): Promise<void>
  broadcastComponentUpdate(component: MUPComponent): Promise<void>
  
  // Middleware
  use(middleware: Middleware): void
  
  // Events
  on(event: string, listener: Function): void
  off(event: string, listener: Function): void
}
```

## Protocol Specification

This SDK implements the MUP Protocol v1.0. For detailed protocol specification, see [mup-protocol-v1.0-spec-EN.md](./mup-protocol-v1.0-spec-EN.md).

## Examples

Check out the `examples/` directory for complete working examples:

- **Basic Chat App** - Simple chat interface with real-time updates
- **Form Builder** - Dynamic form generation and validation
- **Dashboard** - Real-time data visualization
- **Game UI** - Interactive game interface

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Documentation**: [MUP Protocol Specification](./mup-protocol-v1.0-spec-EN.md)
- **Issues**: [GitHub Issues](https://github.com/muprotocol/mup-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/muprotocol/mup-sdk/discussions)

## Roadmap

See [Roadmap.md](./Roadmap.md) for planned features and development phases.

---

**MUP Foundation** - Building the future of dynamic UI protocols