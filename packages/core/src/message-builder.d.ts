/**
 * MUP Message Builder
 * Utility class for building MUP protocol v1 messages
 */
import { UIRequest, UIResponse, EventTrigger, ErrorMessage, UIRequestPayload, UIResponsePayload, EventTriggerPayload, ErrorPayload, Component } from '@muprotocol/types';
/**
 * Message builder class for creating MUP protocol messages
 * Enhanced with AI-driven UI generation capabilities
 */
export declare class MessageBuilder {
    private static decisionEngine;
    private static qualityValidator;
    /**
     * Create a UI request message
     * @param payload - UI request payload
     * @param messageId - Optional custom message ID
     * @returns UI request message
     */
    static createUIRequest(payload: UIRequestPayload, messageId?: string): UIRequest;
    /**
     * Create a UI response message
     * @param payload - UI response payload
     * @param messageId - Optional custom message ID
     * @returns UI response message
     */
    static createUIResponse(payload: UIResponsePayload, messageId?: string): UIResponse;
    /**
     * Create an event trigger message
     * @param payload - Event trigger payload
     * @param messageId - Optional custom message ID
     * @returns Event trigger message
     */
    static createEventTrigger(payload: EventTriggerPayload, messageId?: string): EventTrigger;
    /**
     * Create an error message
     * @param payload - Error payload
     * @param messageId - Optional custom message ID
     * @returns Error message
     */
    static createError(payload: ErrorPayload, messageId?: string): ErrorMessage;
    /**
     * Create a success UI response with AI-generated components
     * @param components - Generated components
     * @param aiReasoning - Optional AI reasoning information
     * @param generationMetadata - Optional generation metadata
     * @param messageId - Optional custom message ID
     * @returns Success UI response message
     */
    static createSuccessResponse(components: Component[], aiReasoning?: UIResponsePayload['ai_reasoning'], generationMetadata?: UIResponsePayload['generation_metadata'], messageId?: string): UIResponse;
    /**
     * Create an error UI response
     * @param error - Error information
     * @param messageId - Optional custom message ID
     * @returns Error UI response message
     */
    static createErrorResponse(error: {
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
    }, messageId?: string): UIResponse;
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
    static createAIGenerationRequest(userIntent: string, requestType?: 'generate' | 'refine' | 'update', context?: UIRequestPayload['context'], generationOptions?: UIRequestPayload['generation_options'], messageId?: string): UIRequest;
    /**
     * Generate AI-driven UI response with comprehensive decision making
     * @param userIntent - Natural language description
     * @param context - Request context
     * @param requestId - Original request ID
     * @returns Promise<UIResponse> - AI-generated UI response
     */
    static generateAIResponse(userIntent: string, context?: UIRequestPayload['context'], requestId?: string): Promise<UIResponse>;
    /**
     * Extract semantic hints from user intent for AI model processing
     * @param userIntent - User's natural language intent
     * @returns Semantic analysis hints
     */
    private static extractSemanticHints;
    /**
     * Infer design patterns from user intent
     * @param userIntent - User's natural language intent
     * @returns Suggested design patterns
     */
    private static inferDesignPatterns;
    /**
     * Infer technical constraints from user intent and context
     * @param userIntent - User's natural language intent
     * @param context - Request context
     * @returns Inferred technical constraints
     */
    private static inferTechnicalConstraints;
    /**
     * Assess complexity level from user intent
     * @param userIntent - User's natural language intent
     * @returns Complexity level
     */
    private static assessComplexity;
    /**
     * Create a UI refinement request
     * @param userIntent - What user wants to change/improve
     * @param existingComponents - Current components to refine
     * @param userFeedback - User feedback on current UI
     * @param messageId - Optional custom message ID
     * @returns UI request message for refinement
     */
    static createRefinementRequest(userIntent: string, existingComponents: Component[], userFeedback?: {
        liked_aspects?: string[];
        issues?: string[];
        specific_requests?: string[];
    }, messageId?: string): UIRequest;
    private static generateInteractionMap;
    private static summarizeStyleChoices;
    private static calculateAccessibilityScore;
    private static calculateUsabilityScore;
    private static calculatePerformanceScore;
}
//# sourceMappingURL=message-builder.d.ts.map