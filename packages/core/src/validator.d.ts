/**
 * MUP Validator
 * Validation utilities for MUP protocol v1 messages and components
 */
import { UIRequest, UIResponse, EventTrigger, ErrorMessage, Component, ComponentConstraints } from '@muprotocol/types';
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    code: string;
    constructor(message: string, code?: string);
}
/**
 * MUP validator class
 */
export declare class MUPValidator {
    /**
     * Validate a MUP message
     * @param message - Message to validate
     * @throws ValidationError if message is invalid
     */
    static validateMessage(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): void;
    /**
     * Validate UI request payload
     * @param payload - UI request payload
     */
    private static validateUIRequestPayload;
    /**
     * Validate UI response payload
     * @param payload - UI response payload
     */
    private static validateUIResponsePayload;
    /**
     * Validate event trigger payload
     * @param payload - Event trigger payload
     */
    private static validateEventTriggerPayload;
    /**
     * Validate error payload
     * @param payload - Error payload
     */
    private static validateErrorPayload;
    /**
     * Validate a component
     * @param component - Component to validate
     * @param constraints - Optional validation constraints
     */
    static validateComponent(component: Component, constraints?: ComponentConstraints): void;
    /**
     * Check if message type is valid
     * @param type - Message type to check
     * @returns True if valid
     */
    private static isValidMessageType;
    /**
     * Check if component type is valid
     * @param type - Component type to check
     * @returns True if valid
     */
    private static isValidComponentType;
    /**
     * Validate component tree depth
     * @param component - Root component
     * @param maxDepth - Maximum allowed depth
     * @param currentDepth - Current depth (internal use)
     */
    static validateComponentDepth(component: Component, maxDepth: number, currentDepth?: number): void;
}
//# sourceMappingURL=validator.d.ts.map