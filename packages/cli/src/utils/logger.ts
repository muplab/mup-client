import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.INFO, prefix = 'MUP') {
    this.level = level;
    this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(chalk.red(`[${this.prefix}] ERROR:`), message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(chalk.yellow(`[${this.prefix}] WARN:`), message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(chalk.blue(`[${this.prefix}] INFO:`), message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(chalk.gray(`[${this.prefix}] DEBUG:`), message, ...args);
    }
  }

  verbose(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.VERBOSE) {
      console.log(chalk.gray(`[${this.prefix}] VERBOSE:`), message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(chalk.green(`[${this.prefix}] SUCCESS:`), message, ...args);
  }

  log(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  newLine(): void {
    console.log();
  }

  separator(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }
}

// Default logger instance
export const logger = new Logger();

// Utility functions
export function createLogger(prefix: string, level?: LogLevel): Logger {
  return new Logger(level, prefix);
}

export function setGlobalLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

// Progress indicator
export class ProgressIndicator {
  private message: string;
  private spinner: string[];
  private current: number;
  private interval: NodeJS.Timeout | null;

  constructor(message: string) {
    this.message = message;
    this.spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.current = 0;
    this.interval = null;
  }

  start(): void {
    process.stdout.write(`${this.spinner[this.current]} ${this.message}`);
    
    this.interval = setInterval(() => {
      this.current = (this.current + 1) % this.spinner.length;
      process.stdout.write(`\r${this.spinner[this.current]} ${this.message}`);
    }, 100);
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (finalMessage) {
      process.stdout.write(`\r${finalMessage}\n`);
    } else {
      process.stdout.write(`\r${chalk.green('✓')} ${this.message}\n`);
    }
  }

  fail(errorMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    const message = errorMessage || this.message;
    process.stdout.write(`\r${chalk.red('✗')} ${message}\n`);
  }
}

// Utility function to create progress indicator
export function createProgress(message: string): ProgressIndicator {
  return new ProgressIndicator(message);
}