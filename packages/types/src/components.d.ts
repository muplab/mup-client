/**
 * MUP Component Types
 * Component type definitions for MUP protocol v1
 */
export type ComponentType = 'container' | 'text' | 'button' | 'input' | 'image' | 'list' | 'card' | 'form' | 'navigation' | 'modal' | 'table' | 'chart' | 'custom';
export interface ComponentProps {
    [key: string]: any;
}
export interface ComponentEvent {
    type: string;
    handler?: string;
    data?: any;
}
export interface ComponentStyle {
    [property: string]: string | number;
}
export interface Component {
    id: string;
    type: ComponentType;
    version: string;
    props?: ComponentProps;
    style?: ComponentStyle;
    events?: ComponentEvent[];
    children?: Component[];
    metadata?: {
        created_at?: string;
        updated_at?: string;
        author?: string;
        description?: string;
        tags?: string[];
    };
}
export interface ComponentConstraints {
    max_depth?: number;
    max_children?: number;
    allowed_types?: ComponentType[];
    required_props?: string[];
    forbidden_props?: string[];
}
export interface ComponentTree {
    root: Component;
    metadata?: {
        total_components?: number;
        max_depth?: number;
        created_at?: string;
        version?: string;
    };
}
export interface ComponentLibrary {
    name: string;
    version: string;
    components: Component[];
    metadata?: {
        description?: string;
        author?: string;
        license?: string;
        repository?: string;
    };
}
export interface ComponentTemplate {
    id: string;
    name: string;
    type: ComponentType;
    template: Component;
    variables?: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'object';
            default?: any;
            required?: boolean;
            description?: string;
        };
    };
}
export type ComponentId = string;
export type ComponentVersion = string;
export type ComponentPath = string[];
//# sourceMappingURL=components.d.ts.map