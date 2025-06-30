import { Command } from 'commander';
import inquirer from 'inquirer';
import { createProject, getAvailableTemplates, templateExists } from '../templates';
import { TemplateType } from '../index';
import { validateProjectName } from '../utils';
import { logger } from '../utils/logger';
import { isDirectoryEmpty } from '../utils/file-utils';
import path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Initialize a new MUP project')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Project template', 'basic-chat')
  .option('-f, --force', 'Overwrite existing directory')
  .action(async (projectName: string, options) => {
    try {
      let name = projectName;
      let template = options.template;

      // Interactive mode if no project name provided
      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Project name is required';
              }
              if (!validateProjectName(input)) {
                return 'Invalid project name. Use lowercase letters, numbers, and hyphens only.';
              }
              return true;
            }
          },
          {
            type: 'list',
            name: 'template',
            message: 'Choose a template:',
            choices: [
              {
                name: 'Basic Chat - Simple chat interface',
                value: TemplateType.BASIC_CHAT
              },
              {
                name: 'Form Generator - Dynamic form builder',
                value: TemplateType.FORM_GENERATOR
              },
              {
                name: 'Dashboard - Data visualization dashboard',
                value: TemplateType.DASHBOARD
              },
              {
                name: 'AI Assistant - AI-powered assistant interface',
                value: TemplateType.AI_ASSISTANT
              }
            ]
          }
        ]);

        name = answers.projectName;
        template = answers.template;
      }

      // Validate project name
      if (!validateProjectName(name)) {
        console.error(chalk.red('Error: Invalid project name. Use lowercase letters, numbers, and hyphens only.'));
        process.exit(1);
      }

      const projectPath = path.resolve(process.cwd(), name);

      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        if (!options.force) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `Directory ${name} already exists. Overwrite?`,
              default: false
            }
          ]);

          if (!overwrite) {
            console.log(chalk.yellow('Operation cancelled.'));
            process.exit(0);
          }
        }

        await fs.remove(projectPath);
      }

      console.log(chalk.blue(`Creating MUP project "${name}"...`));
      console.log(chalk.gray(`Template: ${template}`));
      console.log(chalk.gray(`Location: ${projectPath}`));
      console.log();

      // Create project from template
      await createProject(template, projectPath, {
        projectName: name,
        description: `A MUP application created with ${template} template`
      });

      console.log(chalk.green('✅ Project created successfully!'));
      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray(`  cd ${name}`));
      console.log(chalk.gray('  npm install'));
      console.log(chalk.gray('  npm run dev'));
      console.log();
      console.log(chalk.blue('Happy coding! 🚀'));

    } catch (error) {
      console.error(chalk.red('Error creating project:'), error);
      process.exit(1);
    }
  });