import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { validateMessage, validateComponent } from '../validator';

export const validateCommand = new Command('validate')
  .description('Validate MUP protocol messages and components')
  .argument('<file>', 'File to validate (JSON)')
  .option('-t, --type <type>', 'Validation type (message|component)', 'message')
  .option('-v, --verbose', 'Verbose output')
  .action(async (filePath: string, options) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);

      // Check if file exists
      if (!(await fs.pathExists(fullPath))) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
      }

      // Read and parse JSON file
      let data;
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        data = JSON.parse(content);
      } catch (error) {
        console.error(chalk.red('Error: Invalid JSON file'));
        if (options.verbose) {
          console.error(chalk.gray(error));
        }
        process.exit(1);
      }

      console.log(chalk.blue(`Validating ${options.type}: ${filePath}`));
      console.log();

      let result;
      switch (options.type) {
        case 'message':
          result = validateMessage(data);
          break;
        case 'component':
          result = validateComponent(data);
          break;
        default:
          console.error(chalk.red(`Error: Unknown validation type: ${options.type}`));
          console.log(chalk.gray('Supported types: message, component'));
          process.exit(1);
      }

      if (result.valid) {
        console.log(chalk.green('✅ Validation passed!'));
        if (options.verbose && result.warnings && result.warnings.length > 0) {
          console.log();
          console.log(chalk.yellow('Warnings:'));
          result.warnings.forEach((warning: string) => {
            console.log(chalk.yellow(`  ⚠️  ${warning}`));
          });
        }
      } else {
        console.log(chalk.red('❌ Validation failed!'));
        console.log();
        console.log(chalk.red('Errors:'));
        result.errors.forEach((error: string) => {
          console.log(chalk.red(`  ❌ ${error}`));
        });

        if (options.verbose && result.warnings && result.warnings.length > 0) {
          console.log();
          console.log(chalk.yellow('Warnings:'));
          result.warnings.forEach((warning: string) => {
            console.log(chalk.yellow(`  ⚠️  ${warning}`));
          });
        }
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('Error during validation:'), error);
      process.exit(1);
    }
  });