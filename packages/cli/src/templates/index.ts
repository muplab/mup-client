import path from 'path';
import { copyTemplate } from '../utils/file-utils';
import { logger } from '../utils/logger';

export interface TemplateConfig {
  name: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  variables?: Record<string, string>;
}

export interface ProjectVariables {
  projectName: string;
  description?: string;
  author?: string;
  version?: string;
  license?: string;
}

// Available templates
export const TEMPLATES: Record<string, TemplateConfig> = {
  'basic-chat': {
    name: 'Basic Chat',
    description: 'A simple chat interface using MUP protocol',
    dependencies: [
      '@muprotocol/client@^0.1.2',
      '@muprotocol/types@^0.1.2'
    ],
    devDependencies: [
      '@muprotocol/cli@^0.1.2',
      'typescript@^5.0.0',
      '@types/node@^20.0.0'
    ],
    scripts: {
      'dev': 'mup dev',
      'build': 'mup build',
      'serve': 'mup serve',
      'validate': 'mup validate'
    },
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: '{{projectName}}',
          version: '{{version}}',
          description: '{{description}}',
          main: 'src/index.ts',
          scripts: {},
          dependencies: {},
          devDependencies: {},
          keywords: ['mup', 'chat', 'protocol'],
          author: '{{author}}',
          license: '{{license}}'
        }, null, 2)
      },
      {
        path: 'src/index.ts',
        content: `import { MupClient } from '@muprotocol/client';
import { Component } from '@muprotocol/types';

// Initialize MUP client
const client = new MupClient({
  url: 'ws://localhost:8080',
  reconnect: true
});

// Chat interface components
const chatInterface: Component = {
  type: 'container',
  id: 'chat-container',
  props: {
    className: 'chat-container'
  },
  children: [
    {
      type: 'container',
      id: 'messages-container',
      props: {
        className: 'messages'
      },
      children: []
    },
    {
      type: 'container',
      id: 'input-container',
      props: {
        className: 'input-container'
      },
      children: [
        {
          type: 'input',
          id: 'message-input',
          props: {
            type: 'text',
            placeholder: 'Type your message...',
            className: 'message-input'
          },
          events: {
            onKeyPress: 'handleKeyPress'
          }
        },
        {
          type: 'button',
          id: 'send-button',
          props: {
            text: 'Send',
            className: 'send-button'
          },
          events: {
            onClick: 'sendMessage'
          }
        }
      ]
    }
  ]
};

// Event handlers
const handlers = {
  sendMessage: () => {
    const input = document.getElementById('message-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      addMessage(input.value, 'user');
      input.value = '';
      
      // Simulate bot response
      setTimeout(() => {
        addMessage('Hello! This is a demo response.', 'bot');
      }, 1000);
    }
  },
  
  handleKeyPress: (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handlers.sendMessage();
    }
  }
};

function addMessage(text: string, sender: 'user' | 'bot') {
  const messagesContainer = document.getElementById('messages-container');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.className = \`message \${sender}\`;
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Connect and initialize
client.connect().then(() => {
  console.log('Connected to MUP server');
  client.updateComponents([chatInterface]);
}).catch(error => {
  console.error('Failed to connect:', error);
});

// Export for global access
(window as any).mupHandlers = handlers;
`
      },
      {
        path: 'src/styles.css',
        content: `.chat-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px 8px 0 0;
}

.message {
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word;
}

.message.user {
  background: #007bff;
  color: white;
  margin-left: auto;
  text-align: right;
}

.message.bot {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.input-container {
  display: flex;
  padding: 20px;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.message-input:focus {
  border-color: #007bff;
}

.send-button {
  margin-left: 10px;
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.send-button:hover {
  background: #0056b3;
}

.send-button:active {
  transform: translateY(1px);
}
`
      },
      {
        path: 'public/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectName}} - MUP Chat</title>
    <link rel="stylesheet" href="../src/styles.css">
</head>
<body>
    <div id="app"></div>
    <script src="../src/index.ts"></script>
</body>
</html>
`
      },
      {
        path: 'mup.config.json',
        content: JSON.stringify({
          version: '1.0',
          server: {
            port: 8080,
            host: 'localhost'
          },
          client: {
            reconnect: true,
            timeout: 5000
          },
          build: {
            outDir: 'dist',
            minify: true,
            sourcemap: true
          }
        }, null, 2)
      },
      {
        path: 'README.md',
        content: `# {{projectName}}

{{description}}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and navigate to \`http://localhost:8080\`

## Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm run serve\` - Serve production build
- \`npm run validate\` - Validate MUP components

## Project Structure

- \`src/index.ts\` - Main application entry point
- \`src/styles.css\` - Application styles
- \`public/index.html\` - HTML template
- \`mup.config.json\` - MUP configuration

## Learn More

- [MUP Protocol Documentation](https://github.com/muprotocol/mup)
- [MUP SDK Documentation](https://github.com/muprotocol/mup-sdk)
`
      }
    ]
  },
  
  'form-generator': {
    name: 'Form Generator',
    description: 'Dynamic form generator with validation using MUP',
    dependencies: [
      '@muprotocol/client@^0.1.2',
      '@muprotocol/types@^0.1.2'
    ],
    devDependencies: [
      '@muprotocol/cli@^0.1.2',
      'typescript@^5.0.0',
      '@types/node@^20.0.0'
    ],
    scripts: {
      'dev': 'mup dev',
      'build': 'mup build',
      'serve': 'mup serve',
      'validate': 'mup validate'
    },
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: '{{projectName}}',
          version: '{{version}}',
          description: '{{description}}',
          main: 'src/index.ts',
          scripts: {},
          dependencies: {},
          devDependencies: {},
          keywords: ['mup', 'form', 'generator'],
          author: '{{author}}',
          license: '{{license}}'
        }, null, 2)
      },
      {
        path: 'src/index.ts',
        content: `import { MupClient } from '@muprotocol/client';
import { Component } from '@muprotocol/types';

// Form configuration
interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required?: boolean;
  options?: string[];
  validation?: RegExp;
}

const formConfig: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Full Name',
    required: true
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  {
    id: 'age',
    type: 'number',
    label: 'Age',
    required: false
  },
  {
    id: 'country',
    type: 'select',
    label: 'Country',
    required: true,
    options: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other']
  },
  {
    id: 'newsletter',
    type: 'checkbox',
    label: 'Subscribe to newsletter',
    required: false
  },
  {
    id: 'comments',
    type: 'textarea',
    label: 'Additional Comments',
    required: false
  }
];

// Initialize MUP client
const client = new MupClient({
  url: 'ws://localhost:8080',
  reconnect: true
});

// Generate form components
function generateForm(): Component {
  const formFields = formConfig.map(field => {
    const fieldComponent: Component = {
      type: 'container',
      id: \`field-\${field.id}\`,
      props: {
        className: 'form-field'
      },
      children: [
        {
          type: 'text',
          id: \`label-\${field.id}\`,
          props: {
            text: field.label + (field.required ? ' *' : ''),
            className: 'field-label'
          }
        }
      ]
    };

    // Add input based on type
    switch (field.type) {
      case 'select':
        fieldComponent.children!.push({
          type: 'select',
          id: field.id,
          props: {
            options: field.options,
            className: 'field-input'
          },
          events: {
            onChange: 'validateField'
          }
        });
        break;
      case 'checkbox':
        fieldComponent.children!.push({
          type: 'checkbox',
          id: field.id,
          props: {
            className: 'field-checkbox'
          },
          events: {
            onChange: 'validateField'
          }
        });
        break;
      case 'textarea':
        fieldComponent.children!.push({
          type: 'textarea',
          id: field.id,
          props: {
            rows: 4,
            className: 'field-input'
          },
          events: {
            onInput: 'validateField'
          }
        });
        break;
      default:
        fieldComponent.children!.push({
          type: 'input',
          id: field.id,
          props: {
            type: field.type,
            className: 'field-input',
            required: field.required
          },
          events: {
            onInput: 'validateField'
          }
        });
    }

    // Add error message container
    fieldComponent.children!.push({
      type: 'text',
      id: \`error-\${field.id}\`,
      props: {
        text: '',
        className: 'field-error'
      }
    });

    return fieldComponent;
  });

  return {
    type: 'container',
    id: 'form-container',
    props: {
      className: 'form-container'
    },
    children: [
      {
        type: 'text',
        id: 'form-title',
        props: {
          text: 'Dynamic Form Generator',
          className: 'form-title'
        }
      },
      {
        type: 'form',
        id: 'dynamic-form',
        props: {
          className: 'dynamic-form'
        },
        children: [
          ...formFields,
          {
            type: 'container',
            id: 'form-actions',
            props: {
              className: 'form-actions'
            },
            children: [
              {
                type: 'button',
                id: 'submit-button',
                props: {
                  text: 'Submit',
                  type: 'submit',
                  className: 'submit-button'
                },
                events: {
                  onClick: 'submitForm'
                }
              },
              {
                type: 'button',
                id: 'reset-button',
                props: {
                  text: 'Reset',
                  type: 'button',
                  className: 'reset-button'
                },
                events: {
                  onClick: 'resetForm'
                }
              }
            ]
          }
        ]
      }
    ]
  };
}

// Event handlers
const handlers = {
  validateField: (event: Event) => {
    const target = event.target as HTMLInputElement;
    const fieldId = target.id;
    const field = formConfig.find(f => f.id === fieldId);
    
    if (field) {
      const errorElement = document.getElementById(\`error-\${fieldId}\`);
      let errorMessage = '';
      
      if (field.required && !target.value.trim()) {
        errorMessage = \`\${field.label} is required\`;
      } else if (field.validation && target.value && !field.validation.test(target.value)) {
        errorMessage = \`\${field.label} format is invalid\`;
      }
      
      if (errorElement) {
        errorElement.textContent = errorMessage;
        target.classList.toggle('error', !!errorMessage);
      }
    }
  },
  
  submitForm: (event: Event) => {
    event.preventDefault();
    
    const formData: Record<string, any> = {};
    let hasErrors = false;
    
    formConfig.forEach(field => {
      const element = document.getElementById(field.id) as HTMLInputElement;
      if (element) {
        if (field.type === 'checkbox') {
          formData[field.id] = element.checked;
        } else {
          formData[field.id] = element.value;
        }
        
        // Validate
        if (field.required && !formData[field.id]) {
          hasErrors = true;
          const errorElement = document.getElementById(\`error-\${field.id}\`);
          if (errorElement) {
            errorElement.textContent = \`\${field.label} is required\`;
            element.classList.add('error');
          }
        }
      }
    });
    
    if (!hasErrors) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    }
  },
  
  resetForm: () => {
    formConfig.forEach(field => {
      const element = document.getElementById(field.id) as HTMLInputElement;
      const errorElement = document.getElementById(\`error-\${field.id}\`);
      
      if (element) {
        if (field.type === 'checkbox') {
          element.checked = false;
        } else {
          element.value = '';
        }
        element.classList.remove('error');
      }
      
      if (errorElement) {
        errorElement.textContent = '';
      }
    });
  }
};

// Connect and initialize
client.connect().then(() => {
  console.log('Connected to MUP server');
  const form = generateForm();
  client.updateComponents([form]);
}).catch(error => {
  console.error('Failed to connect:', error);
});

// Export for global access
(window as any).mupHandlers = handlers;
`
      }
    ]
  }
};

/**
 * Create a new project from template
 */
export async function createProject(
  templateName: string,
  projectPath: string,
  variables: ProjectVariables
): Promise<void> {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  logger.info(`Creating project from template: ${template.name}`);

  // Default variables
  const defaultVariables: ProjectVariables = {
    ...variables,
    description: variables.description || template.description,
    author: variables.author || 'Your Name',
    version: variables.version || '1.0.0',
    license: variables.license || 'MIT',
    projectName: variables.projectName || path.basename(projectPath)
  };

  // Create project files
  for (const file of template.files) {
    const filePath = path.join(projectPath, file.path);
    let content = file.content;

    // Replace variables
    for (const [key, value] of Object.entries(defaultVariables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
    }

    // Handle package.json specially
    if (file.path === 'package.json') {
      const packageJson = JSON.parse(content);
      packageJson.scripts = { ...packageJson.scripts, ...template.scripts };
      
      // Add dependencies
      packageJson.dependencies = packageJson.dependencies || {};
      template.dependencies.forEach(dep => {
        const [name, version] = dep.split('@');
        packageJson.dependencies[name] = version || 'latest';
      });
      
      // Add dev dependencies
      packageJson.devDependencies = packageJson.devDependencies || {};
      template.devDependencies.forEach(dep => {
        const [name, version] = dep.split('@');
        packageJson.devDependencies[name] = version || 'latest';
      });
      
      content = JSON.stringify(packageJson, null, 2);
    }

    await copyTemplate(filePath, content, defaultVariables);
  }

  logger.success(`Project created successfully at ${projectPath}`);
}

/**
 * Get available templates
 */
export function getAvailableTemplates(): Array<{ name: string; description: string }> {
  return Object.entries(TEMPLATES).map(([key, template]) => ({
    name: key,
    description: template.description
  }));
}

/**
 * Check if template exists
 */
export function templateExists(templateName: string): boolean {
  return templateName in TEMPLATES;
}