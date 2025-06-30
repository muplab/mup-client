import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { buildProject } from '../utils';

export const buildCommand = new Command('build')
  .description('Build MUP project for production')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('-c, --config <config>', 'Configuration file path')
  .option('--minify', 'Minify output files')
  .option('--sourcemap', 'Generate source maps')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      const outputDir = path.resolve(process.cwd(), options.output);
      
      console.log(chalk.blue('Building MUP project...'));
      console.log(chalk.gray(`Output directory: ${outputDir}`));
      console.log();

      // Clean output directory
      if (await fs.pathExists(outputDir)) {
        await fs.remove(outputDir);
      }
      await fs.ensureDir(outputDir);

      // Build project
      const result = await buildProject({
        outputDir,
        configFile: options.config,
        minify: options.minify,
        sourcemap: options.sourcemap,
        verbose: options.verbose
      });

      if (result.success) {
        console.log(chalk.green('✅ Build completed successfully!'));
        console.log();
        console.log(chalk.bold('Build summary:'));
        console.log(chalk.gray(`  Files: ${result.files?.length || 0}`));
        console.log(chalk.gray(`  Size: ${result.totalSize || 'Unknown'}`));
        console.log(chalk.gray(`  Time: ${result.buildTime || 'Unknown'}`));
      } else {
        console.log(chalk.red('❌ Build failed!'));
        if (result.errors) {
          console.log();
          console.log(chalk.red('Errors:'));
          result.errors.forEach((error: string) => {
            console.log(chalk.red(`  ❌ ${error}`));
          });
        }
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('Error during build:'), error);
      process.exit(1);
    }
  });