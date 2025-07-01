/**
 * Quality Validator
 * Implements comprehensive quality assurance for AI-generated UI components
 * Based on the AI-driven UI flow architecture
 */
import { Component } from '@muprotocol/types';
import { UIGenerationResult } from './ai-decision-engine';
export interface AccessibilityMetrics {
    wcag_compliance_level: 'A' | 'AA' | 'AAA';
    keyboard_navigation_score: number;
    screen_reader_compatibility: number;
    color_contrast_ratio: number;
    semantic_structure_score: number;
    aria_attributes_coverage: number;
}
export interface UsabilityMetrics {
    user_flow_clarity: number;
    interaction_intuitiveness: number;
    visual_hierarchy_score: number;
    cognitive_load_assessment: number;
    error_prevention_score: number;
    feedback_mechanisms_score: number;
}
export interface PerformanceMetrics {
    rendering_efficiency: number;
    bundle_size_impact: number;
    memory_usage_estimate: number;
    interaction_responsiveness: number;
    loading_time_estimate: number;
    optimization_opportunities: string[];
}
export interface ConsistencyMetrics {
    design_system_adherence: number;
    component_reusability: number;
    naming_convention_score: number;
    style_consistency: number;
    interaction_pattern_consistency: number;
}
export interface QualityAssessment {
    overall_score: number;
    accessibility: AccessibilityMetrics;
    usability: UsabilityMetrics;
    performance: PerformanceMetrics;
    consistency: ConsistencyMetrics;
    improvement_suggestions: ImprovementSuggestion[];
    validation_timestamp: string;
}
export interface ImprovementSuggestion {
    category: 'accessibility' | 'usability' | 'performance' | 'consistency';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggested_fix: string;
    impact_assessment: string;
    implementation_effort: 'minimal' | 'moderate' | 'significant';
}
export interface ValidationResult {
    is_valid: boolean;
    quality_assessment: QualityAssessment;
    optimized_components: Component[];
    optimization_applied: string[];
    validation_errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    component_id?: string;
    suggested_fix: string;
}
export interface ValidationWarning {
    type: string;
    message: string;
    component_id?: string;
    recommendation: string;
}
/**
 * Comprehensive Quality Validator
 * Implements multi-dimensional quality assessment and optimization
 */
export declare class QualityValidator {
    private accessibilityValidator;
    private usabilityValidator;
    private performanceValidator;
    private consistencyValidator;
    private optimizer;
    constructor();
    /**
     * Validate and optimize UI generation result
     * @param generationResult - AI-generated UI result
     * @returns Validation result with optimizations
     */
    validateAndOptimize(generationResult: UIGenerationResult): Promise<ValidationResult>;
    /**
     * Generate comprehensive quality assessment
     */
    private generateQualityAssessment;
    /**
     * Calculate accessibility score from metrics
     */
    private calculateAccessibilityScore;
    /**
     * Calculate usability score from metrics
     */
    private calculateUsabilityScore;
    /**
     * Calculate performance score from metrics
     */
    private calculatePerformanceScore;
    /**
     * Calculate consistency score from metrics
     */
    private calculateConsistencyScore;
    /**
     * Generate improvement suggestions based on quality metrics
     */
    private generateImprovementSuggestions;
    /**
     * Get default quality assessment for error cases
     */
    private getDefaultQualityAssessment;
}
//# sourceMappingURL=quality-validator.d.ts.map