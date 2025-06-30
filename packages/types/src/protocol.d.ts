/**
 * MUP Protocol v1 Core Types
 * Core types for MUP protocol v1 as defined in architecture documentation
 */
import { Component, ComponentType } from './components';
export declare const MUP_VERSION = "1.0.0";
export type MessageType = 'ui_request' | 'ui_response' | 'event_trigger' | 'error';
export interface MUPMessage<T = any> {
    version: string;
    message_id: string;
    timestamp: string;
    type: MessageType;
    payload: T;
}
export interface UIRequestPayload {
    user_input: string;
    context?: {
        previous_components?: Component[];
        user_preferences?: Record<string, any>;
        constraints?: {
            max_depth?: number;
            allowed_types?: ComponentType[];
            theme?: 'light' | 'dark';
        };
    };
}
export interface UIResponsePayload {
    success: boolean;
    components?: Component[];
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface EventTriggerPayload {
    component_id: string;
    event_type: string;
    event_data?: any;
    context?: any;
    timestamp?: number;
}
export interface ErrorPayload {
    code: string;
    message: string;
    source?: string;
    details?: any;
}
export interface UIRequest extends MUPMessage<UIRequestPayload> {
    type: 'ui_request';
}
export interface UIResponse extends MUPMessage<UIResponsePayload> {
    type: 'ui_response';
}
export interface EventTrigger extends MUPMessage<EventTriggerPayload> {
    type: 'event_trigger';
}
export interface ErrorMessage extends MUPMessage<ErrorPayload> {
    type: 'error';
}
export type { Component, ComponentType } from './components';
//# sourceMappingURL=protocol.d.ts.map