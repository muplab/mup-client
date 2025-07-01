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
    user_intent: string;
    request_type: 'generate' | 'refine' | 'update';
    context: {
        app_type?: 'web' | 'mobile' | 'desktop' | 'embedded';
        page_context?: string;
        user_journey?: string;
        user_profile?: {
            experience_level?: 'beginner' | 'intermediate' | 'expert';
            preferences?: Record<string, any>;
            accessibility_needs?: string[];
            language?: string;
        };
        session_history?: Array<{
            action: string;
            timestamp: string;
            result?: string;
        }>;
        current_state?: Record<string, any>;
        existing_components?: Component[];
        user_feedback?: {
            liked_aspects?: string[];
            issues?: string[];
            specific_requests?: string[];
        };
    };
    generation_options?: {
        style_preferences?: string[];
        complexity_level?: 'simple' | 'moderate' | 'complex';
        target_audience?: string;
        brand_guidelines?: Record<string, any>;
        max_components?: number;
        allowed_component_types?: ComponentType[];
        layout_constraints?: {
            max_width?: string;
            responsive?: boolean;
            grid_system?: string;
        };
        performance_budget?: {
            max_load_time?: number;
            max_bundle_size?: number;
        };
    };
    session_id?: string;
    correlation_id?: string;
}
export interface UIResponsePayload {
    success: boolean;
    ui_structure?: {
        components: Component[];
        layout_metadata: {
            total_components: number;
            complexity_score: number;
            estimated_render_time: number;
            responsive_breakpoints?: string[];
        };
        interaction_map?: Array<{
            component_id: string;
            triggers: string[];
            effects: string[];
        }>;
    };
    ai_reasoning?: {
        intent_analysis: {
            understood_requirements: string[];
            assumptions_made: string[];
            ambiguities_resolved: string[];
        };
        design_rationale: {
            overall_approach: string;
            layout_choice: string;
            component_selection: Array<{
                component_type: string;
                reason: string;
                alternatives_considered?: string[];
            }>;
            style_decisions: string[];
        };
        ux_considerations: {
            user_journey_alignment: string;
            accessibility_features: string[];
            usability_optimizations: string[];
            potential_pain_points?: string[];
        };
        technical_notes?: {
            performance_optimizations: string[];
            browser_compatibility: string[];
            scalability_considerations: string[];
        };
    };
    generation_metadata?: {
        model_version: string;
        generation_time: number;
        confidence_score: number;
        tokens_used?: number;
        quality_metrics?: {
            design_coherence: number;
            requirement_coverage: number;
            accessibility_score: number;
        };
    };
    improvement_suggestions?: Array<{
        category: 'design' | 'functionality' | 'performance' | 'accessibility';
        suggestion: string;
        impact: 'low' | 'medium' | 'high';
        implementation_effort: 'easy' | 'moderate' | 'complex';
    }>;
    error?: {
        code: string;
        message: string;
        category: 'understanding' | 'generation' | 'validation' | 'system';
        details?: any;
        recovery_suggestions?: Array<{
            action: string;
            description: string;
            auto_applicable?: boolean;
        }>;
        partial_result?: {
            components?: Component[];
            analysis?: string;
        };
    };
    correlation_id?: string;
    next_suggested_actions?: string[];
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
    id: string;
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