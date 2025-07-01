/**
 * MUP Protocol v1 Core Types
 * Core types for MUP protocol v1 as defined in architecture documentation
 */

import { Component, ComponentType } from './components';

// Protocol version
export const MUP_VERSION = '1.0.0';

// Message types
export type MessageType = 
  | 'ui_request'     // UI generation request (AI-driven by default)
  | 'ui_response'    // UI generation response
  | 'event_trigger'  // Event trigger
  | 'error';         // Error message

// Base message interface
export interface MUPMessage<T = any> {
  version: string;                     // Protocol version
  message_id: string;                  // Unique message identifier
  timestamp: string;                   // ISO 8601 timestamp
  type: MessageType;                   // Message type
  payload: T;                          // Message payload
}

// UI request payload - AI-driven UI generation
export interface UIRequestPayload {
  // Core request information
  user_intent: string;                 // Natural language description of what user wants
  request_type: 'generate' | 'refine' | 'update'; // Type of UI operation
  
  // Context for AI understanding
  context: {
    // Application context
    app_type?: 'web' | 'mobile' | 'desktop' | 'embedded'; // Target platform
    page_context?: string;             // Current page/screen context
    user_journey?: string;             // Where user is in their journey
    
    // User context
    user_profile?: {
      experience_level?: 'beginner' | 'intermediate' | 'expert';
      preferences?: Record<string, any>;
      accessibility_needs?: string[];
      language?: string;
    };
    
    // Session context
    session_history?: Array<{
      action: string;
      timestamp: string;
      result?: string;
    }>;
    current_state?: Record<string, any>;
    
    // Previous UI context (for refinement)
    existing_components?: Component[];
    user_feedback?: {
      liked_aspects?: string[];
      issues?: string[];
      specific_requests?: string[];
    };
  };
  
  // Generation constraints and preferences
  generation_options?: {
    style_preferences?: string[];      // e.g., ['modern', 'minimal', 'colorful']
    complexity_level?: 'simple' | 'moderate' | 'complex';
    target_audience?: string;          // e.g., 'children', 'professionals', 'elderly'
    brand_guidelines?: Record<string, any>;
    
    // Technical constraints
    max_components?: number;
    allowed_component_types?: ComponentType[];
    layout_constraints?: {
      max_width?: string;
      responsive?: boolean;
      grid_system?: string;
    };
    
    // Performance requirements
    performance_budget?: {
      max_load_time?: number;
      max_bundle_size?: number;
    };
  };
  
  // Metadata
  session_id?: string;
  correlation_id?: string;             // For tracking related requests
}

// UI response payload - AI-generated UI with reasoning
export interface UIResponsePayload {
  // Generation result
  success: boolean;
  
  // Generated UI structure
  ui_structure?: {
    components: Component[];           // Generated component tree
    layout_metadata: {
      total_components: number;
      complexity_score: number;        // 0-1 scale
      estimated_render_time: number;   // milliseconds
      responsive_breakpoints?: string[];
    };
    
    // Interaction flow
    interaction_map?: Array<{
      component_id: string;
      triggers: string[];              // Events that can be triggered
      effects: string[];               // What happens when triggered
    }>;
  };
  
  // AI reasoning and explanation
  ai_reasoning?: {
    // Intent understanding
    intent_analysis: {
      understood_requirements: string[];
      assumptions_made: string[];
      ambiguities_resolved: string[];
    };
    
    // Design decisions
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
    
    // User experience considerations
    ux_considerations: {
      user_journey_alignment: string;
      accessibility_features: string[];
      usability_optimizations: string[];
      potential_pain_points?: string[];
    };
    
    // Technical considerations
    technical_notes?: {
      performance_optimizations: string[];
      browser_compatibility: string[];
      scalability_considerations: string[];
    };
  };
  
  // Generation metadata
  generation_metadata?: {
    model_version: string;
    generation_time: number;           // milliseconds
    confidence_score: number;          // 0-1 scale
    tokens_used?: number;
    
    // Quality metrics
    quality_metrics?: {
      design_coherence: number;        // 0-1 scale
      requirement_coverage: number;    // 0-1 scale
      accessibility_score: number;     // 0-1 scale
    };
  };
  
  // Suggestions for improvement
  improvement_suggestions?: Array<{
    category: 'design' | 'functionality' | 'performance' | 'accessibility';
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
    implementation_effort: 'easy' | 'moderate' | 'complex';
  }>;
  
  // Error information (if success is false)
  error?: {
    code: string;
    message: string;
    category: 'understanding' | 'generation' | 'validation' | 'system';
    details?: any;
    
    // Recovery suggestions
    recovery_suggestions?: Array<{
      action: string;
      description: string;
      auto_applicable?: boolean;
    }>;
    
    // Partial results (if any)
    partial_result?: {
      components?: Component[];
      analysis?: string;
    };
  };
  
  // Metadata
  correlation_id?: string;
  next_suggested_actions?: string[];   // What user might want to do next
}

// Event trigger payload
export interface EventTriggerPayload {
  component_id: string;                // Component ID that triggered the event
  event_type: string;                  // Event type
  event_data?: any;                    // Event data
  context?: any;                       // Context information
  timestamp?: number;                  // Event timestamp
}

// Error payload
export interface ErrorPayload {
  code: string;                        // Error code
  message: string;                     // Error description
  source?: string;                     // Error source
  details?: any;                       // Error details
}



// Specific message types
export interface UIRequest extends MUPMessage<UIRequestPayload> {
  type: 'ui_request';
  id: string;                          // Request ID for correlation
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



// Component related types (imported from components.ts)
export type { Component, ComponentType } from './components';