/**
 * MUP Core Utilities
 * Utility functions for MUP protocol v1
 */
import { Component, ComponentType, ComponentTree, UIRequest, UIResponse, EventTrigger, ErrorMessage } from '@muprotocol/types';
/**
 * Message utilities
 */
export declare class MessageUtils {
    /**
     * Check if a message is a request type
     * @param message - Message to check
     * @returns True if message is a request
     */
    static isRequest(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is UIRequest;
    /**
     * Check if a message is a response type
     * @param message - Message to check
     * @returns True if message is a response
     */
    static isResponse(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is UIResponse;
    /**
     * Check if a message is an event trigger
     * @param message - Message to check
     * @returns True if message is an event trigger
     */
    static isEventTrigger(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is EventTrigger;
    /**
     * Check if a message is an error
     * @param message - Message to check
     * @returns True if message is an error
     */
    static isError(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): message is ErrorMessage;
    /**
     * Get message age in milliseconds
     * @param message - Message to check
     * @returns Age in milliseconds
     */
    static getMessageAge(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): number;
    /**
     * Check if a response indicates success
     * @param response - UI response message
     * @returns True if response is successful
     */
    static isSuccessResponse(response: UIResponse): boolean;
    /**
     * Extract error from response
     * @param response - UI response message
     * @returns Error object or null
     */
    static getResponseError(response: UIResponse): {
        code: string;
        message: string;
        details?: any;
    } | null;
}
/**
 * Component utilities
 */
export declare class ComponentUtils {
    /**
     * Find a component by ID in a component tree
     * @param root - Root component
     * @param id - Component ID to find
     * @returns Found component or null
     */
    static findComponentById(root: Component, id: string): Component | null;
    /**
     * Find components by type
     * @param root - Root component
     * @param type - Component type to find
     * @returns Array of matching components
     */
    static findComponentsByType(root: Component, type: ComponentType): Component[];
    /**
     * Get component tree depth
     * @param root - Root component
     * @returns Maximum depth of the tree
     */
    static getTreeDepth(root: Component): number;
    /**
     * Count total components in tree
     * @param root - Root component
     * @returns Total number of components
     */
    static countComponents(root: Component): number;
    /**
     * Get all component IDs in tree
     * @param root - Root component
     * @returns Array of all component IDs
     */
    static getAllComponentIds(root: Component): string[];
    /**
     * Clone a component (deep copy)
     * @param component - Component to clone
     * @returns Cloned component
     */
    static cloneComponent(component: Component): Component;
    /**
     * Get component path from root to target
     * @param root - Root component
     * @param targetId - Target component ID
     * @returns Array of component IDs representing the path, or null if not found
     */
    static getComponentPath(root: Component, targetId: string): string[] | null;
    /**
     * Get parent component of target
     * @param root - Root component
     * @param targetId - Target component ID
     * @returns Parent component or null
     */
    static getParentComponent(root: Component, targetId: string): Component | null;
    /**
     * Remove component from tree
     * @param root - Root component
     * @param targetId - Component ID to remove
     * @returns True if component was removed
     */
    static removeComponent(root: Component, targetId: string): boolean;
    /**
     * Add component as child
     * @param parent - Parent component
     * @param child - Child component to add
     * @param index - Optional index to insert at
     */
    static addChild(parent: Component, child: Component, index?: number): void;
    /**
     * Create component tree structure
     * @param root - Root component
     * @returns Component tree object
     */
    static createComponentTree(root: Component): ComponentTree;
}
/**
 * General utilities
 */
export declare class GeneralUtils {
    /**
     * Generate a timestamp in ISO 8601 format
     * @returns ISO 8601 timestamp string
     */
    static generateTimestamp(): string;
    /**
     * Check if a string is a valid UUID v4
     * @param uuid - String to check
     * @returns True if valid UUID v4
     */
    static isValidUUID(uuid: string): boolean;
    /**
     * Deep merge two objects
     * @param target - Target object
     * @param source - Source object
     * @returns Merged object
     */
    static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
    /**
     * Check if value is a plain object
     * @param value - Value to check
     * @returns True if plain object
     */
    static isObject(value: any): value is Record<string, any>;
    /**
     * Debounce function execution
     * @param func - Function to debounce
     * @param delay - Delay in milliseconds
     * @returns Debounced function
     */
    static debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
    /**
     * Throttle function execution
     * @param func - Function to throttle
     * @param delay - Delay in milliseconds
     * @returns Throttled function
     */
    static throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
}
//# sourceMappingURL=utils.d.ts.map