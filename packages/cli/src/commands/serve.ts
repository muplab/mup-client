import { Command } from 'commander';
import { MupDevServer } from '../server';
import { CLIConfig, DEFAULT_CONFIG } from '../index';
import path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';

export const serveCommand = new Command('serve')
  .description('Start MUP development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('--protocol <protocol>', 'Protocol (ws|wss)', 'ws')
  .option('-c, --config <config>', 'Configuration file path')
  .option('--ssl-cert <cert>', 'SSL certificate file (for wss)')
  .option('--ssl-key <key>', 'SSL private key file (for wss)')
  .option('-w, --watch', 'Watch for file changes and reload')
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
      if (options.protocol) config.protocol = options.protocol;

      // SSL configuration
      if (options.sslCert && options.sslKey) {
        const certPath = path.resolve(process.cwd(), options.sslCert);
        const keyPath = path.resolve(process.cwd(), options.sslKey);

        if (!(await fs.pathExists(certPath))) {
          console.error(chalk.red(`SSL certificate not found: ${options.sslCert}`));
          process.exit(1);
        }

        if (!(await fs.pathExists(keyPath))) {
          console.error(chalk.red(`SSL private key not found: ${options.sslKey}`));
          process.exit(1);
        }

        config.ssl = {
          cert: certPath,
          key: keyPath
        };
        config.protocol = 'wss';
      }

      // Validate port
      if (isNaN(config.port!) || config.port! < 1 || config.port! > 65535) {
        console.error(chalk.red('Error: Invalid port number'));
        process.exit(1);
      }

      // Validate protocol
      if (!['ws', 'wss'].includes(config.protocol!)) {
        console.error(chalk.red('Error: Protocol must be ws or wss'));
        process.exit(1);
      }

      console.log(chalk.blue('Starting MUP development server...'));
      console.log();
      console.log(chalk.gray(`Host: ${config.host}`));
      console.log(chalk.gray(`Port: ${config.port}`));
      console.log(chalk.gray(`Protocol: ${config.protocol}`));
      if (options.watch) {
        console.log(chalk.gray('Watch mode: enabled'));
      }
      console.log();

      // Start the server
      const server = new MupDevServer({
        port: options.port,
        host: options.host,
        protocol: 'http',
        staticDir: options.staticDir,
        hotReload: options.hotReload,
        cors: options.cors
      } as any);

      const url = `${config.protocol}://${config.host}:${config.port}`;
      console.log(chalk.green('✅ Server started successfully!'));
      console.log();
      console.log(chalk.bold(`Server running at: ${chalk.cyan(url)}`));
      console.log();
      console.log(chalk.gray('Press Ctrl+C to stop the server'));

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log();
        console.log(chalk.yellow('Shutting down server...'));
        server.close(() => {
          console.log(chalk.green('Server stopped.'));
          process.exit(0);
        });
      });

    } catch (error) {
      console.error(chalk.red('Error starting server:'), error);
      process.exit(1);
    }
  });