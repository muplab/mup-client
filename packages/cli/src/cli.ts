#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CLI_VERSION } from './index';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { serveCommand } from './commands/serve';
import { buildCommand } from './commands/build';
import { devCommand } from './commands/dev';

const program = new Command();

program
  .name('mup')
  .description('MUP (Model UI Protocol) CLI - Development tools for dynamic UI applications')
  .version(CLI_VERSION);

// Add commands
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(serveCommand);
program.addCommand(buildCommand);
program.addCommand(devCommand);

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}