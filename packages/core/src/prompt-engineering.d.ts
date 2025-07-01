/**
 * Prompt Engineering System
 * Implements structured prompt design and context enhancement for AI-driven UI generation
 * Based on the AI-driven UI flow architecture
 */
import { UIRequestPayload } from '@muprotocol/types';
import { IntentAnalysis } from './ai-decision-engine';
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: PromptVariable[];
    context_requirements: string[];
    output_format: string;
}
export interface PromptVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default_value?: any;
    validation_rules?: string[];
}
export interface ContextEnhancement {
    user_context: UserContextData;
    domain_knowledge: DomainKnowledge;
    design_patterns: DesignPatternLibrary;
    technical_constraints: TechnicalConstraints;
    historical_data: HistoricalData;
}
export interface UserContextData {
    user_preferences: Record<string, any>;
    usage_patterns: string[];
    accessibility_needs: string[];
    device_context: DeviceContext;
    session_history: SessionInteraction[];
}
export interface DeviceContext {
    platform: 'web' | 'mobile' | 'desktop' | 'tablet';
    screen_size: {
        width: number;
        height: number;
    };
    input_methods: string[];
    capabilities: string[];
    performance_profile: 'low' | 'medium' | 'high';
}
export interface SessionInteraction {
    timestamp: string;
    user_intent: string;
    generated_components: string[];
    user_feedback: 'positive' | 'negative' | 'neutral';
    refinement_requests: string[];
}
export interface DomainKnowledge {
    industry: string;
    use_cases: string[];
    common_patterns: string[];
    regulatory_requirements: string[];
    best_practices: string[];
}
export interface DesignPatternLibrary {
    ui_patterns: UIPattern[];
    interaction_patterns: InteractionPattern[];
    layout_patterns: LayoutPattern[];
    accessibility_patterns: AccessibilityPattern[];
}
export interface UIPattern {
    name: string;
    description: string;
    use_cases: string[];
    components: string[];
    implementation_notes: string;
    examples: string[];
}
export interface InteractionPattern {
    name: string;
    trigger: string;
    behavior: string;
    feedback: string;
    accessibility_considerations: string[];
}
export interface LayoutPattern {
    name: string;
    structure: string;
    responsive_behavior: string;
    breakpoints: string[];
    grid_system: string;
}
export interface AccessibilityPattern {
    name: string;
    wcag_guidelines: string[];
    implementation: string;
    testing_criteria: string[];
}
export interface TechnicalConstraints {
    framework: string;
    version: string;
    dependencies: string[];
    performance_budget: PerformanceBudget;
    browser_support: string[];
    deployment_target: string;
}
export interface PerformanceBudget {
    max_bundle_size: number;
    max_render_time: number;
    max_memory_usage: number;
    target_lighthouse_score: number;
}
export interface HistoricalData {
    successful_patterns: SuccessfulPattern[];
    common_issues: CommonIssue[];
    user_preferences_trends: PreferenceTrend[];
    performance_benchmarks: PerformanceBenchmark[];
}
export interface SuccessfulPattern {
    pattern_id: string;
    success_rate: number;
    user_satisfaction: number;
    performance_metrics: Record<string, number>;
    usage_frequency: number;
}
export interface CommonIssue {
    issue_type: string;
    frequency: number;
    resolution_strategies: string[];
    prevention_measures: string[];
}
export interface PreferenceTrend {
    preference_type: string;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    confidence_level: number;
    time_period: string;
}
export interface PerformanceBenchmark {
    metric_name: string;
    baseline_value: number;
    target_value: number;
    current_average: number;
    improvement_strategies: string[];
}
export interface GeneratedPrompt {
    prompt_text: string;
    context_data: ContextEnhancement;
    template_used: string;
    generation_metadata: {
        timestamp: string;
        version: string;
        confidence_score: number;
        estimated_effectiveness: number;
    };
}
/**
 * Advanced Prompt Engineering System
 * Implements sophisticated prompt generation with context awareness
 */
export declare class PromptEngineeringSystem {
    private templates;
    private contextEnhancer;
    private patternLibrary;
    private knowledgeBase;
    private adaptiveLearning;
    constructor();
    /**
     * Generate optimized prompt for AI UI generation
     * @param userIntent - User's natural language intent
     * @param context - Request context
     * @param intentAnalysis - Analyzed user intent
     * @returns Generated prompt with enhanced context
     */
    generatePrompt(userIntent: string, context?: UIRequestPayload['context'], intentAnalysis?: IntentAnalysis): Promise<GeneratedPrompt>;
    /**
     * Select the most appropriate prompt template
     */
    private selectOptimalTemplate;
    /**
     * Construct the final prompt from template and context
     */
    private constructPrompt;
    /**
     * Optimize prompt for better AI performance
     */
    private optimizePrompt;
    /**
     * Calculate confidence score for generated prompt
     */
    private calculatePromptConfidence;
    /**
     * Estimate prompt effectiveness
     */
    private estimateEffectiveness;
    /**
     * Initialize prompt templates for different scenarios
     */
    private initializePromptTemplates;
    /**
     * Initialize design pattern library
     */
    private initializePatternLibrary;
}
//# sourceMappingURL=prompt-engineering.d.ts.map