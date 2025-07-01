/**
 * AI Decision Engine
 * Implements the intelligent decision-making system for AI-driven UI generation
 * Based on the AI-driven UI flow architecture
 */
import { Component, ComponentType, UIRequestPayload } from '@muprotocol/types';
export interface SemanticAnalysis {
    keywords: string[];
    intent_type: string;
    complexity_level: 'simple' | 'moderate' | 'complex';
    domain_context: string;
}
export interface FunctionalRequirements {
    primary_functions: string[];
    secondary_features: string[];
    interaction_patterns: string[];
    data_requirements: string[];
}
export interface DesignConstraints {
    style_preferences: string[];
    platform_constraints: string[];
    accessibility_requirements: string[];
    performance_expectations: string[];
}
export interface IntentAnalysis {
    semantic_analysis: SemanticAnalysis;
    functional_requirements: FunctionalRequirements;
    design_constraints: DesignConstraints;
}
export interface ComponentCandidate {
    type: ComponentType;
    props: Record<string, any>;
    confidence: number;
    rationale: string;
    alternatives: ComponentType[];
}
export interface ComponentSelection {
    selected: ComponentCandidate[];
    metadata: {
        selection_strategy: string;
        total_candidates: number;
        selection_time: number;
    };
}
export interface LayoutStructure {
    strategy: string;
    components: Component[];
    responsive_breakpoints: string[];
    accessibility_features: string[];
}
export interface StyleDecisions {
    color_scheme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    typography: {
        font_family: string;
        font_sizes: Record<string, string>;
        line_heights: Record<string, number>;
    };
    spacing_system: {
        base_unit: number;
        scale: number[];
    };
    visual_hierarchy: {
        heading_levels: number;
        emphasis_styles: string[];
    };
}
export interface UIGenerationResult {
    components: Component[];
    layout: LayoutStructure;
    styles: StyleDecisions;
    reasoning: {
        intent_analysis: IntentAnalysis;
        design_rationale: string;
        quality_score: number;
    };
    metadata: {
        generation_time: number;
        confidence_score: number;
        optimization_applied: string[];
    };
}
/**
 * Core AI Decision Engine
 * Implements multi-layer decision making for UI generation
 */
export declare class DecisionEngine {
    private knowledgeBase;
    private contextEnhancer;
    private componentSelector;
    private layoutOptimizer;
    private styleDecisionEngine;
    private qualityValidator;
    constructor();
    /**
     * Execute AI-driven UI generation decision process
     * @param userIntent - User's natural language intent
     * @param context - Request context
     * @returns UI generation result
     */
    executeDecision(userIntent: string, context?: UIRequestPayload['context']): Promise<UIGenerationResult>;
    /**
     * Analyze user intent with enhanced context understanding
     */
    private analyzeIntent;
    private extractKeywords;
    private classifyIntent;
    private assessComplexity;
    private identifyDomain;
    private extractPrimaryFunctions;
    private extractSecondaryFeatures;
    private inferInteractionPatterns;
    private analyzeDataNeeds;
    private inferStylePreferences;
    private identifyPlatformConstraints;
    private assessA11yNeeds;
    private inferPerformanceNeeds;
    private createComponent;
    private generateDesignRationale;
    private calculateConfidenceScore;
}
//# sourceMappingURL=ai-decision-engine.d.ts.map