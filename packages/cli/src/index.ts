export * from './commands';
export * from './utils';
export * from './templates';
export * from './server';
export * from './validator';

// CLI version
export const CLI_VERSION = '0.1.0';

// Default configuration
export const DEFAULT_CONFIG: CLIConfig = {
  port: 3000,
  host: 'localhost',
  protocol: 'ws' as const,
  timeout: 30000,
  maxConnections: 100
};

// Template types
export enum TemplateType {
  BASIC_CHAT = 'basic-chat',
  FORM_GENERATOR = 'form-generator',
  DASHBOARD = 'dashboard',
  AI_ASSISTANT = 'ai-assistant'
}

// CLI configuration interface
export interface CLIConfig {
  port?: number;
  host?: string;
  protocol?: 'ws' | 'wss';
  timeout?: number;
  maxConnections?: number;
  staticDir?: string;
  ssl?: {
    cert: string;
    key: string;
  };
}