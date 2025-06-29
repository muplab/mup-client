// Jest setup file

// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }

  send(data) {
    // Mock implementation
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }

  ping() {
    // Mock implementation
  }
};

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console.warn and console.error in tests unless explicitly needed
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test utilities
global.createMockComponent = (overrides = {}) => {
  return {
    id: 'test-component-1',
    type: 'container',
    version: '1.0.0',
    props: {},
    children: [],
    events: {},
    style: {},
    metadata: {},
    ...overrides
  };
};

global.createMockMessage = (type, payload = {}) => {
  return {
    version: '1.0.0',
    type,
    id: `msg-${Date.now()}`,
    timestamp: Date.now(),
    source: 'client',
    target: 'server',
    payload
  };
};

// Increase timeout for async tests
jest.setTimeout(10000);