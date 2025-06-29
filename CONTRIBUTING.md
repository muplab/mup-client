# Contributing to MUP SDK

We love your input! We want to make contributing to MUP SDK as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/muprotocol/mup-sdk.git
   cd mup-sdk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Bootstrap packages**
   ```bash
   npm run bootstrap
   ```

4. **Build all packages**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   ```

### Project Structure

```
mup-sdk/
├── packages/
│   ├── types/          # Core type definitions
│   ├── core/           # Shared utilities and core functionality
│   ├── client/         # Client-side SDK
│   └── server/         # Server-side SDK
├── docs/               # Documentation
├── examples/           # Example applications
└── tools/              # Build and development tools
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. **Make your changes**
   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/my-awesome-feature
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow strict type checking
- Prefer interfaces over types for object shapes
- Use meaningful names for variables and functions
- Add JSDoc comments for public APIs

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline structures

### Naming Conventions

- **Files**: Use kebab-case (e.g., `component-manager.ts`)
- **Classes**: Use PascalCase (e.g., `ComponentManager`)
- **Functions/Variables**: Use camelCase (e.g., `sendMessage`)
- **Constants**: Use SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: Use PascalCase with descriptive names (e.g., `MUPComponent`)

### Testing

- Write unit tests for all new functionality
- Use Jest as the testing framework
- Aim for high test coverage (>90%)
- Write integration tests for complex features
- Mock external dependencies

### Documentation

- Update README files for significant changes
- Add JSDoc comments for public APIs
- Include code examples in documentation
- Update CHANGELOG.md for notable changes

## Commit Message Guidelines

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat(client): add component caching mechanism
fix(server): resolve memory leak in session manager
docs: update API documentation for v1.1
test(core): add unit tests for message serialization
```

## Issue Guidelines

### Bug Reports

Great bug reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

When proposing new features:

- Explain the motivation and use case
- Describe the proposed solution
- Consider alternative solutions
- Provide examples or mockups if applicable
- Discuss potential breaking changes

## Package-Specific Guidelines

### @muprotocol/types

- All type definitions must be exported from `index.ts`
- Use clear, descriptive names for types
- Add JSDoc comments for complex types
- Avoid circular dependencies

### @muprotocol/core

- Keep utilities framework-agnostic
- Write comprehensive tests
- Optimize for performance
- Maintain backward compatibility

### @muprotocol/client

- Ensure browser compatibility
- Handle edge cases gracefully
- Provide clear error messages
- Test across different browsers

### @muprotocol/server

- Focus on security and performance
- Handle concurrent connections properly
- Provide comprehensive logging
- Test under load conditions

## Release Process

1. **Version Bump**: Use Lerna to version packages
   ```bash
   npm run version
   ```

2. **Build**: Ensure all packages build successfully
   ```bash
   npm run build
   ```

3. **Test**: Run full test suite
   ```bash
   npm run test
   ```

4. **Publish**: Publish to npm
   ```bash
   npm run publish
   ```

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Getting Help

- **Documentation**: Check the docs first
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time community chat

### Recognition

We recognize contributors in several ways:

- Contributors list in README
- Release notes acknowledgments
- Community showcase
- Contributor badges

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to reach out if you have questions about contributing:

- Open a GitHub Discussion
- Join our Discord community
- Email the maintainers

Thank you for contributing to MUP SDK! 🎉