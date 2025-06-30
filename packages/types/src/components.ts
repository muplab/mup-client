/**
 * MUP Component Types
 * Component type definitions for MUP protocol v1
 */

// Component types
export type ComponentType = 
  | 'container'      // Container component
  | 'text'           // Text component
  | 'button'         // Button component
  | 'input'          // Input component
  | 'image'          // Image component
  | 'list'           // List component
  | 'card'           // Card component
  | 'form'           // Form component
  | 'navigation'     // Navigation component
  | 'modal'          // Modal component
  | 'table'          // Table component
  | 'chart'          // Chart component
  | 'custom';        // Custom component

// Component properties
export interface ComponentProps {
  [key: string]: any;
}

// Component event definition
export interface ComponentEvent {
  type: string;                        // Event type
  handler?: string;                    // Event handler function name
  data?: any;                          // Event data
}

// Component style definition
export interface ComponentStyle {
  [property: string]: string | number;
}

// Base component interface
export interface Component {
  id: string;                          // Unique component identifier
  type: ComponentType;                 // Component type
  version: string;                     // Component version
  props?: ComponentProps;              // Component properties
  style?: ComponentStyle;              // Component styles
  events?: ComponentEvent[];           // Component events
  children?: Component[];              // Child components
  metadata?: {
    created_at?: string;               // Creation timestamp
    updated_at?: string;               // Last update timestamp
    author?: string;                   // Component author
    description?: string;              // Component description
    tags?: string[];                   // Component tags
  };
}

// Component validation constraints
export interface ComponentConstraints {
  max_depth?: number;                  // Maximum nesting depth
  max_children?: number;               // Maximum number of children
  allowed_types?: ComponentType[];     // Allowed component types
  required_props?: string[];           // Required properties
  forbidden_props?: string[];          // Forbidden properties
}

// Component tree structure
export interface ComponentTree {
  root: Component;                     // Root component
  metadata?: {
    total_components?: number;         // Total number of components
    max_depth?: number;                // Maximum depth reached
    created_at?: string;               // Tree creation timestamp
    version?: string;                  // Tree version
  };
}

// Component library definition
export interface ComponentLibrary {
  name: string;                        // Library name
  version: string;                     // Library version
  components: Component[];             // Available components
  metadata?: {
    description?: string;              // Library description
    author?: string;                   // Library author
    license?: string;                  // Library license
    repository?: string;               // Repository URL
  };
}

// Component template
export interface ComponentTemplate {
  id: string;                          // Template identifier
  name: string;                        // Template name
  type: ComponentType;                 // Base component type
  template: Component;                 // Template definition
  variables?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object';
      default?: any;
      required?: boolean;
      description?: string;
    };
  };
}

// Export utility types
export type ComponentId = string;
export type ComponentVersion = string;
export type ComponentPath = string[];