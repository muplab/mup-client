/**
 * MUP Message Builder
 * Utility class for building MUP protocol v1 messages
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MUP_VERSION,
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,
  UIRequestPayload,
  UIResponsePayload,
  EventTriggerPayload,
  ErrorPayload,
  Component
} from '@muprotocol/types';
import { DecisionEngine, UIGenerationResult } from './ai-decision-engine';
import { QualityValidator, ValidationResult } from './quality-validator';

/**
 * Message builder class for creating MUP protocol messages
 * Enhanced with AI-driven UI generation capabilities
 */
export class MessageBuilder {
  private static decisionEngine = new DecisionEngine();
  private static qualityValidator = new QualityValidator();
  /**
   * Create a UI request message
   * @param payload - UI request payload
   * @param messageId - Optional custom message ID
   * @returns UI request message
   */
  static createUIRequest(
    payload: UIRequestPayload,
    messageId?: string
  ): UIRequest {
    const id = messageId || uuidv4();
    return {
      version: MUP_VERSION,
      message_id: id,
      id: id,
      timestamp: new Date().toISOString(),
      type: 'ui_request',
      payload
    };
  }

  /**
   * Create a UI response message
   * @param payload - UI response payload
   * @param messageId - Optional custom message ID
   * @returns UI response message
   */
  static createUIResponse(
    payload: UIResponsePayload,
    messageId?: string
  ): UIResponse {
    return {
      version: MUP_VERSION,
      message_id: messageId || uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'ui_response',
      payload
    };
  }

  /**
   * Create an event trigger message
   * @param payload - Event trigger payload
   * @param messageId - Optional custom message ID
   * @returns Event trigger message
   */
  static createEventTrigger(
    payload: EventTriggerPayload,
    messageId?: string
  ): EventTrigger {
    return {
      version: MUP_VERSION,
      message_id: messageId || uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'event_trigger',
      payload
    };
  }

  /**
   * Create an error message
   * @param payload - Error payload
   * @param messageId - Optional custom message ID
   * @returns Error message
   */
  static createError(
    payload: ErrorPayload,
    messageId?: string
  ): ErrorMessage {
    return {
      version: MUP_VERSION,
      message_id: messageId || uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'error',
      payload
    };
  }

  /**
   * Create a success UI response with AI-generated components
   * @param components - Generated components
   * @param aiReasoning - Optional AI reasoning information
   * @param generationMetadata - Optional generation metadata
   * @param messageId - Optional custom message ID
   * @returns Success UI response message
   */
  static createSuccessResponse(
    components: Component[],
    aiReasoning?: UIResponsePayload['ai_reasoning'],
    generationMetadata?: UIResponsePayload['generation_metadata'],
    messageId?: string
  ): UIResponse {
    return this.createUIResponse(
      {
        success: true,
        ui_structure: {
          components,
          layout_metadata: {
            total_components: components.length,
            complexity_score: 0.5, // Default complexity
            estimated_render_time: components.length * 10 // Rough estimate
          }
        },
        ai_reasoning: aiReasoning,
        generation_metadata: generationMetadata
      },
      messageId
    );
  }

  /**
   * Create an error UI response
   * @param error - Error information
   * @param messageId - Optional custom message ID
   * @returns Error UI response message
   */
  static createErrorResponse(
    error: {
      code: string;
      message: string;
      category?: 'understanding' | 'generation' | 'validation' | 'system';
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
    },
    messageId?: string
  ): UIResponse {
    return this.createUIResponse(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          category: error.category || 'system',
          details: error.details,
          recovery_suggestions: error.recovery_suggestions,
          partial_result: error.partial_result
        }
      },
      messageId
    );
  }

  /**
   * Create a UI request for AI-driven generation
   * Enhanced to support the AI model's internal request construction mechanism
   * @param userIntent - Natural language description of what user wants
   * @param requestType - Type of UI operation
   * @param context - Context for AI understanding
   * @param generationOptions - Generation constraints and preferences
   * @param messageId - Optional custom message ID
   * @returns UI request message
   */
  static createAIGenerationRequest(
    userIntent: string,
    requestType: 'generate' | 'refine' | 'update' = 'generate',
    context?: UIRequestPayload['context'],
    generationOptions?: UIRequestPayload['generation_options'],
    messageId?: string
  ): UIRequest {
    // Enhanced context with AI model guidance
    const enhancedContext = {
      ...context,
      // Add semantic analysis hints for AI model
      semantic_hints: this.extractSemanticHints(userIntent),
      // Add design pattern suggestions
      suggested_patterns: this.inferDesignPatterns(userIntent),
      // Add technical constraints inference
      inferred_constraints: this.inferTechnicalConstraints(userIntent, context)
    };

    // Enhanced generation options with AI decision support
    const enhancedOptions = {
      ...generationOptions,
      // Enable AI reasoning output
      include_ai_reasoning: true,
      // Enable quality validation
      enable_quality_validation: true,
      // Set default complexity based on intent analysis
      complexity_level: generationOptions?.complexity_level || this.assessComplexity(userIntent)
    };

    return this.createUIRequest(
      {
        user_intent: userIntent,
        request_type: requestType,
        context: enhancedContext,
        generation_options: enhancedOptions
      },
      messageId
    );
  }

  /**
   * Generate AI-driven UI response with comprehensive decision making
   * @param userIntent - Natural language description
   * @param context - Request context
   * @param requestId - Original request ID
   * @returns Promise<UIResponse> - AI-generated UI response
   */
  static async generateAIResponse(
    userIntent: string,
    context?: UIRequestPayload['context'],
    requestId?: string
  ): Promise<UIResponse> {
    try {
      // Execute AI decision engine
      const generationResult: UIGenerationResult = await this.decisionEngine.executeDecision(
        userIntent,
        context
      );

      // Validate and optimize the generated UI
      const validationResult: ValidationResult = await this.qualityValidator.validateAndOptimize(
        generationResult
      );

      // Create comprehensive UI response
      return this.createUIResponse(
        {
          success: true,
          ui_structure: {
            components: validationResult.optimized_components,
            layout_metadata: {
              total_components: validationResult.optimized_components.length,
              complexity_score: generationResult.metadata.confidence_score,
              estimated_render_time: validationResult.optimized_components.length * 10
            },
            interaction_map: this.generateInteractionMap(validationResult.optimized_components)
          },
          ai_reasoning: {
            intent_analysis: {
              understood_requirements: [generationResult.reasoning.intent_analysis.semantic_analysis.intent_type],
              assumptions_made: ['User wants modern UI design'],
              ambiguities_resolved: ['Assumed responsive design needed']
            },
            design_rationale: {
              overall_approach: generationResult.reasoning.design_rationale,
              layout_choice: generationResult.layout.strategy,
              component_selection: [{
                component_type: 'container',
                reason: 'Provides structure and layout'
              }],
              style_decisions: [this.summarizeStyleChoices(generationResult.styles).color_scheme]
            },
            ux_considerations: {
              user_journey_alignment: 'Optimized for user intent',
              accessibility_features: generationResult.layout.accessibility_features || [],
              usability_optimizations: ['Responsive design', 'Clear navigation']
            },
            technical_notes: {
              performance_optimizations: ['Lazy loading', 'Component optimization'],
              browser_compatibility: ['Modern browsers'],
              scalability_considerations: ['Component reusability', 'Maintainable code']
            }
          },
          generation_metadata: {
            model_version: '1.0.0',
            generation_time: generationResult.metadata.generation_time,
            confidence_score: generationResult.metadata.confidence_score,
            quality_metrics: {
              design_coherence: this.calculateAccessibilityScore(validationResult.quality_assessment.accessibility),
              requirement_coverage: this.calculateUsabilityScore(validationResult.quality_assessment.usability),
              accessibility_score: this.calculatePerformanceScore(validationResult.quality_assessment.performance)
            }
          },
          improvement_suggestions: validationResult.quality_assessment.improvement_suggestions.map(suggestion => ({
            category: suggestion.category as 'design' | 'functionality' | 'performance' | 'accessibility',
            suggestion: suggestion.description,
            impact: suggestion.priority as 'low' | 'medium' | 'high',
            implementation_effort: 'moderate' as 'easy' | 'moderate' | 'complex'
          }))
        },
        requestId
      );
    } catch (error) {
      // Return error response if AI generation fails
      return this.createErrorResponse(
        {
          code: 'AI_GENERATION_FAILED',
          message: `Failed to generate AI-driven UI: ${error instanceof Error ? error.message : String(error)}`,
          category: 'system'
        },
        requestId
      );
    }
  }



  /**
   * Extract semantic hints from user intent for AI model processing
   * @param userIntent - User's natural language intent
   * @returns Semantic analysis hints
   */
  private static extractSemanticHints(userIntent: string): {
    keywords: string[];
    intent_type: string;
    domain: string;
    complexity_indicators: string[];
  } {
    const keywords = userIntent.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Detect UI component keywords
    const componentKeywords = keywords.filter(word => 
      ['form', 'button', 'input', 'table', 'card', 'modal', 'navigation', 'menu'].includes(word)
    );
    
    // Detect style keywords
    const styleKeywords = keywords.filter(word => 
      ['modern', 'minimal', 'colorful', 'dark', 'light', 'responsive'].includes(word)
    );
    
    // Infer domain
    let domain = 'general';
    if (keywords.some(word => ['login', 'register', 'auth', 'password'].includes(word))) {
      domain = 'authentication';
    } else if (keywords.some(word => ['product', 'cart', 'shop', 'buy'].includes(word))) {
      domain = 'ecommerce';
    } else if (keywords.some(word => ['dashboard', 'chart', 'analytics', 'data'].includes(word))) {
      domain = 'analytics';
    }
    
    return {
      keywords: [...componentKeywords, ...styleKeywords],
      intent_type: componentKeywords.length > 0 ? 'ui_generation' : 'general',
      domain,
      complexity_indicators: keywords.filter(word => 
        ['complex', 'advanced', 'detailed', 'comprehensive'].includes(word)
      )
    };
  }

  /**
   * Infer design patterns from user intent
   * @param userIntent - User's natural language intent
   * @returns Suggested design patterns
   */
  private static inferDesignPatterns(userIntent: string): Array<{
    pattern: string;
    confidence: number;
    rationale: string;
  }> {
    const patterns = [];
    const lowerIntent = userIntent.toLowerCase();
    
    if (lowerIntent.includes('form') || lowerIntent.includes('register') || lowerIntent.includes('login')) {
      patterns.push({
        pattern: 'form_layout',
        confidence: 0.9,
        rationale: 'User explicitly mentioned form-related functionality'
      });
    }
    
    if (lowerIntent.includes('list') || lowerIntent.includes('table') || lowerIntent.includes('data')) {
      patterns.push({
        pattern: 'data_display',
        confidence: 0.8,
        rationale: 'User intent suggests data presentation needs'
      });
    }
    
    if (lowerIntent.includes('navigation') || lowerIntent.includes('menu')) {
      patterns.push({
        pattern: 'navigation_pattern',
        confidence: 0.85,
        rationale: 'User mentioned navigation elements'
      });
    }
    
    return patterns;
  }

  /**
   * Infer technical constraints from user intent and context
   * @param userIntent - User's natural language intent
   * @param context - Request context
   * @returns Inferred technical constraints
   */
  private static inferTechnicalConstraints(
    userIntent: string,
    context?: UIRequestPayload['context']
  ): {
    platform: string;
    responsive: boolean;
    accessibility: boolean;
    performance_priority: 'low' | 'medium' | 'high';
  } {
    const lowerIntent = userIntent.toLowerCase();
    
    return {
      platform: context?.app_type || 'web',
      responsive: lowerIntent.includes('mobile') || lowerIntent.includes('responsive') || true,
      accessibility: true, // Always prioritize accessibility
      performance_priority: lowerIntent.includes('fast') || lowerIntent.includes('performance') ? 'high' : 'medium'
    };
  }

  /**
   * Assess complexity level from user intent
   * @param userIntent - User's natural language intent
   * @returns Complexity level
   */
  private static assessComplexity(userIntent: string): 'simple' | 'moderate' | 'complex' {
    const lowerIntent = userIntent.toLowerCase();
    const complexityIndicators = [
      'advanced', 'complex', 'detailed', 'comprehensive', 'multiple', 'various', 'different'
    ];
    
    const componentCount = (lowerIntent.match(/\b(form|button|input|table|card|modal|navigation|menu)\b/g) || []).length;
    const hasComplexityWords = complexityIndicators.some(word => lowerIntent.includes(word));
    
    if (hasComplexityWords || componentCount > 5) {
      return 'complex';
    } else if (componentCount > 2) {
      return 'moderate';
    } else {
      return 'simple';
    }
  }

  /**
   * Create a UI refinement request
   * @param userIntent - What user wants to change/improve
   * @param existingComponents - Current components to refine
   * @param userFeedback - User feedback on current UI
   * @param messageId - Optional custom message ID
   * @returns UI request message for refinement
   */
  static createRefinementRequest(
    userIntent: string,
    existingComponents: Component[],
    userFeedback?: {
      liked_aspects?: string[];
      issues?: string[];
      specific_requests?: string[];
    },
    messageId?: string
  ): UIRequest {
    return this.createUIRequest(
      {
        user_intent: userIntent,
        request_type: 'refine',
        context: {
          existing_components: existingComponents,
          user_feedback: userFeedback
        }
      },
      messageId
    );
  }

  // Helper methods for AI response generation
  private static generateInteractionMap(components: Component[]): { component_id: string; triggers: string[]; effects: string[]; }[] {
    const interactionMap: { component_id: string; triggers: string[]; effects: string[]; }[] = [];
    
    components.forEach(component => {
      if (component.events && component.events.length > 0) {
        interactionMap.push({
          component_id: component.id,
          triggers: component.events.map(event => event.type),
          effects: component.events.map(event => event.handler || 'default_handler')
        });
      }
    });
    
    return interactionMap;
  }

  private static summarizeStyleChoices(styles: any): Record<string, any> {
    return {
      color_scheme: styles.color_scheme?.primary || 'default',
      typography: styles.typography?.font_family || 'system',
      spacing: styles.spacing_system?.base_unit || 8,
      layout_strategy: 'responsive'
    };
  }

  private static calculateAccessibilityScore(metrics: any): number {
    const wcagScore = metrics.wcag_compliance_level === 'AAA' ? 1.0 : 
                     metrics.wcag_compliance_level === 'AA' ? 0.8 : 0.6;
    return (wcagScore + metrics.keyboard_navigation_score + metrics.screen_reader_compatibility) / 3;
  }

  private static calculateUsabilityScore(metrics: any): number {
    return (metrics.user_flow_clarity + metrics.interaction_intuitiveness + metrics.visual_hierarchy_score) / 3;
  }

  private static calculatePerformanceScore(metrics: any): number {
    return (metrics.rendering_efficiency + metrics.interaction_responsiveness + (1 - metrics.bundle_size_impact)) / 3;
  }
}