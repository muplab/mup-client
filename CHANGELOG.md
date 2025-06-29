# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 0.1.2 (2025-06-29)

**Note:** Version bump only for package mup-sdk





## 0.1.1 (2025-06-29)

**Note:** Version bump only for package mup-sdk





# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup and monorepo structure
- Core type definitions for MUP protocol v1.0
- WebSocket connection management utilities
- Message serialization and deserialization
- Handshake protocol implementation
- Component state management system
- Event handling and delegation
- Client SDK with DOM rendering engine
- Server SDK with session management
- Middleware system for request processing
- Authentication and authorization support
- Rate limiting and security features
- TypeScript support with strict type checking
- Comprehensive test suite with Jest
- Build system with Rollup
- ESLint and Prettier configuration
- GitHub Actions CI/CD pipeline
- Documentation and examples

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Implemented secure WebSocket connections
- Added input validation and sanitization
- Included CORS protection
- Added rate limiting to prevent abuse

## [1.0.0] - TBD

### Added
- **@muprotocol/types v1.0.0**
  - Core MUP protocol type definitions
  - Component, message, and event interfaces
  - Authentication and session types
  - Error and validation types

- **@muprotocol/core v1.0.0**
  - WebSocket connection management
  - Message serialization/deserialization
  - Protocol validation utilities
  - Error handling and recovery
  - Logging and debugging utilities

- **@muprotocol/client v1.0.0**
  - MUPClient class for WebSocket connections
  - Component state management
  - DOM rendering engine
  - Event handling and delegation
  - Auto-reconnection with exponential backoff
  - Component lifecycle management

- **@muprotocol/server v1.0.0**
  - MUPServer class for WebSocket server
  - Session management system
  - Component broadcasting
  - Middleware support
  - Authentication and authorization
  - Rate limiting and security features

### Technical Details

#### Core Features
- Full MUP Protocol v1.0 implementation
- TypeScript-first development with strict typing
- Modular architecture with clear separation of concerns
- Comprehensive error handling and recovery
- Performance optimizations for real-time communication

#### Component System
- Built-in component types: container, text, input, button, form
- Custom component registration support
- Component tree management and updates
- Event delegation and handling
- Style and layout management

#### Connection Management
- WebSocket-based real-time communication
- Automatic reconnection with configurable backoff
- Connection state monitoring and events
- Heartbeat and keepalive mechanisms
- Graceful connection handling and cleanup

#### Security
- Authentication middleware support
- Input validation and sanitization
- Rate limiting and DDoS protection
- CORS configuration for web security
- Secure session management

#### Developer Experience
- Comprehensive TypeScript definitions
- Detailed API documentation
- Code examples and tutorials
- Development tools and debugging support
- Linting and formatting configuration

### Breaking Changes
- N/A (initial release)

### Migration Guide
- N/A (initial release)

---

## Release Notes Format

For future releases, we'll follow this format:

### [Version] - YYYY-MM-DD

#### Added
- New features and capabilities

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Now removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements and fixes

---

## Versioning Strategy

We use [Semantic Versioning](https://semver.org/) for all packages:

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

### Package Versioning

All packages in this monorepo are versioned together to ensure compatibility:

- `@muprotocol/types`
- `@muprotocol/core`
- `@muprotocol/client`
- `@muprotocol/server`

### Pre-release Versions

Pre-release versions follow this format:
- **Alpha**: `1.0.0-alpha.1` (early development, may have breaking changes)
- **Beta**: `1.0.0-beta.1` (feature complete, testing phase)
- **RC**: `1.0.0-rc.1` (release candidate, final testing)

---

## Contributing

When contributing changes, please:

1. Update this CHANGELOG.md file
2. Follow the format above
3. Add entries under "Unreleased" section
4. Include breaking changes and migration notes
5. Reference related issues and pull requests

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).
