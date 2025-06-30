import { Command } from 'commander';
import { MupDevServer } from '../server';
import { CLIConfig, DEFAULT_CONFIG } from '../index';
import chalk from 'chalk';
import path from 'path';
import * as fs from 'fs-extra';

export const devCommand = new Command('dev')
  .description('Start MUP development server with hot reload')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('-c, --config <config>', 'Configuration file path')
  .option('--open', 'Open browser automatically')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      let config: CLIConfig = { ...DEFAULT_CONFIG };

      // Load config file if specified
      if (options.config) {
        const configPath = path.resolve(process.cwd(), options.config);
        if (await fs.pathExists(configPath)) {
          try {
            const configContent = await fs.readFile(configPath, 'utf-8');
            const fileConfig = JSON.parse(configContent);
            config = { ...config, ...fileConfig };
            console.log(chalk.blue(`Loaded config from: ${options.config}`));
          } catch (error) {
            console.error(chalk.red(`Error loading config file: ${error}`));
            process.exit(1);
          }
        } else {
          console.error(chalk.red(`Config file not found: ${options.config}`));
          process.exit(1);
        }
      }

      // Override config with command line options
      if (options.port) config.port = parseInt(options.port, 10);
      if (options.host) config.host = options.host;

      // Validate port
      if (isNaN(config.port!) || config.port! < 1 || config.port! > 65535) {
        console.error(chalk.red('Error: Invalid port number'));
        process.exit(1);
      }

      console.log(chalk.blue('Starting MUP development server with hot reload...'));
      console.log();
      console.log(chalk.gray(`Host: ${config.host}`));
      console.log(chalk.gray(`Port: ${config.port}`));
      console.log(chalk.gray('Hot reload: enabled'));
      console.log();

      // Start the development server with hot reload
      const server = new MupDevServer({
        port: config.port,
        host: config.host,
        protocol: 'http',
        staticDir: config.staticDir,
        hotReload: true,
        cors: true
      } as any);

      const url = `http://${config.host}:${config.port}`;
      console.log(chalk.green('✅ Development server started!'));
      console.log();
      console.log(chalk.bold(`Local: ${chalk.cyan(url)}`));
      
      // Try to get network address
      try {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(chalk.bold(`Network: ${chalk.cyan(`http://${iface.address}:${config.port}`)}`));
              break;
            }
          }
        }
      } catch (error) {
        // Ignore network interface errors
      }

      console.log();
      console.log(chalk.gray('Ready for connections. Press Ctrl+C to stop.'));

      // Open browser if requested
      if (options.open) {
        try {
          const { default: open } = await import('open');
          await open(url);
        } catch (error) {
          console.log(chalk.yellow('Could not open browser automatically.'));
        }
      }

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log();
        console.log(chalk.yellow('Shutting down development server...'));
        server.close(() => {
          console.log(chalk.green('Development server stopped.'));
          process.exit(0);
        });
      });

    } catch (error) {
      console.error(chalk.red('Error starting development server:'), error);
      process.exit(1);
    }
  });