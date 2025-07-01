/**
 * Prompt Engineering System
 * Implements structured prompt design and context enhancement for AI-driven UI generation
 * Based on the AI-driven UI flow architecture
 */

import { UIRequestPayload } from '@muprotocol/types';
import { IntentAnalysis } from './ai-decision-engine';

// Prompt template interfaces
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
  screen_size: { width: number; height: number };
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
export class PromptEngineeringSystem {
  private templates: Map<string, PromptTemplate>;
  private contextEnhancer: ContextEnhancer;
  private patternLibrary: DesignPatternLibrary;
  private knowledgeBase: DomainKnowledgeBase;
  private adaptiveLearning: AdaptiveLearningEngine;

  constructor() {
    this.templates = new Map();
    this.contextEnhancer = new ContextEnhancer();
    this.patternLibrary = this.initializePatternLibrary();
    this.knowledgeBase = new DomainKnowledgeBase();
    this.adaptiveLearning = new AdaptiveLearningEngine();
    this.initializePromptTemplates();
  }

  /**
   * Generate optimized prompt for AI UI generation
   * @param userIntent - User's natural language intent
   * @param context - Request context
   * @param intentAnalysis - Analyzed user intent
   * @returns Generated prompt with enhanced context
   */
  async generatePrompt(
    userIntent: string,
    context?: UIRequestPayload['context'],
    intentAnalysis?: IntentAnalysis
  ): Promise<GeneratedPrompt> {
    try {
      // 1. Select optimal prompt template
      const template = this.selectOptimalTemplate(userIntent, intentAnalysis);

      // 2. Enhance context with domain knowledge
      const enhancedContext = await this.contextEnhancer.enhanceContext(
        userIntent,
        context,
        intentAnalysis
      );

      // 3. Apply adaptive learning insights
      const adaptiveInsights = await this.adaptiveLearning.getInsights(
        userIntent,
        enhancedContext
      );

      // 4. Generate structured prompt
      const promptText = this.constructPrompt(
        template,
        userIntent,
        enhancedContext,
        adaptiveInsights
      );

      // 5. Validate and optimize prompt
      const optimizedPrompt = this.optimizePrompt(promptText, enhancedContext);

      return {
        prompt_text: optimizedPrompt,
        context_data: enhancedContext,
        template_used: template.id,
        generation_metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence_score: this.calculatePromptConfidence(template, enhancedContext),
          estimated_effectiveness: this.estimateEffectiveness(optimizedPrompt, enhancedContext)
        }
      };
    } catch (error) {
      throw new Error(`Prompt generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Select the most appropriate prompt template
   */
  private selectOptimalTemplate(
    userIntent: string,
    intentAnalysis?: IntentAnalysis
  ): PromptTemplate {
    const intentType = intentAnalysis?.semantic_analysis.intent_type || 'general_ui';
    const complexity = intentAnalysis?.semantic_analysis.complexity_level || 'simple';

    // Template selection logic based on intent and complexity
    const templateKey = `${intentType}_${complexity}`;
    
    return this.templates.get(templateKey) || 
           this.templates.get(`${intentType}_simple`) ||
           this.templates.get('general_ui_simple')!;
  }

  /**
   * Construct the final prompt from template and context
   */
  private constructPrompt(
    template: PromptTemplate,
    userIntent: string,
    context: ContextEnhancement,
    adaptiveInsights: any
  ): string {
    let prompt = template.template;

    // Replace template variables
    const variables = {
      user_intent: userIntent,
      domain_context: context.domain_knowledge.industry,
      device_platform: context.user_context.device_context.platform,
      accessibility_requirements: context.user_context.accessibility_needs.join(', '),
      performance_target: context.technical_constraints.performance_budget.target_lighthouse_score,
      design_patterns: context.design_patterns.ui_patterns.map(p => p.name).join(', '),
      historical_success_patterns: context.historical_data.successful_patterns
        .slice(0, 3)
        .map(p => p.pattern_id)
        .join(', '),
      adaptive_recommendations: adaptiveInsights.recommendations.join(', ')
    };

    // Replace all template variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    });

    return prompt;
  }

  /**
   * Optimize prompt for better AI performance
   */
  private optimizePrompt(prompt: string, context: ContextEnhancement): string {
    let optimized = prompt;

    // Add context-specific optimizations
    if (context.user_context.device_context.platform === 'mobile') {
      optimized += '\n\nIMPORTANT: Prioritize touch-friendly interactions and mobile-first responsive design.';
    }

    if (context.user_context.accessibility_needs.length > 0) {
      optimized += '\n\nACCESSIBILITY: Ensure WCAG 2.1 AA compliance with enhanced screen reader support.';
    }

    if (context.technical_constraints.performance_budget.max_bundle_size < 100000) {
      optimized += '\n\nPERFORMANCE: Optimize for minimal bundle size and fast loading times.';
    }

    return optimized;
  }

  /**
   * Calculate confidence score for generated prompt
   */
  private calculatePromptConfidence(
    template: PromptTemplate,
    context: ContextEnhancement
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on context completeness
    if (context.domain_knowledge.industry) confidence += 0.1;
    if (context.user_context.session_history.length > 0) confidence += 0.1;
    if (context.historical_data.successful_patterns.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate prompt effectiveness
   */
  private estimateEffectiveness(prompt: string, context: ContextEnhancement): number {
    let effectiveness = 0.6; // Base effectiveness

    // Factors that increase effectiveness
    const promptLength = prompt.length;
    if (promptLength > 500 && promptLength < 2000) effectiveness += 0.1;
    if (prompt.includes('specific examples')) effectiveness += 0.1;
    if (prompt.includes('constraints')) effectiveness += 0.1;
    if (context.design_patterns.ui_patterns.length > 0) effectiveness += 0.1;

    return Math.min(effectiveness, 1.0);
  }

  /**
   * Initialize prompt templates for different scenarios
   */
  private initializePromptTemplates(): void {
    // Form creation template
    this.templates.set('form_creation_simple', {
      id: 'form_creation_simple',
      name: 'Simple Form Creation',
      description: 'Template for creating basic forms',
      template: `Create a {{device_platform}} form interface for: {{user_intent}}

Context:
- Domain: {{domain_context}}
- Accessibility: {{accessibility_requirements}}
- Performance target: {{performance_target}}

Design patterns to consider: {{design_patterns}}
Successful patterns from history: {{historical_success_patterns}}

Adaptive recommendations: {{adaptive_recommendations}}

Generate a clean, accessible form with proper validation and user feedback.`,
      variables: [
        { name: 'user_intent', type: 'string', required: true, description: 'User\'s form requirements' },
        { name: 'device_platform', type: 'string', required: true, description: 'Target platform' }
      ],
      context_requirements: ['domain_knowledge', 'accessibility_needs'],
      output_format: 'structured_components'
    });

    // Data display template
    this.templates.set('data_display_moderate', {
      id: 'data_display_moderate',
      name: 'Moderate Data Display',
      description: 'Template for data tables and lists',
      template: `Create a {{device_platform}} data display interface for: {{user_intent}}

Requirements:
- Domain: {{domain_context}}
- Accessibility: {{accessibility_requirements}}
- Performance: {{performance_target}} Lighthouse score

Apply these proven patterns: {{historical_success_patterns}}
Consider these design patterns: {{design_patterns}}

Adaptive insights: {{adaptive_recommendations}}

Focus on data clarity, sorting, filtering, and responsive design.`,
      variables: [
        { name: 'user_intent', type: 'string', required: true, description: 'Data display requirements' }
      ],
      context_requirements: ['domain_knowledge', 'performance_budget'],
      output_format: 'structured_components'
    });

    // General UI template (fallback)
    this.templates.set('general_ui_simple', {
      id: 'general_ui_simple',
      name: 'General UI Creation',
      description: 'Fallback template for general UI requests',
      template: `Create a {{device_platform}} user interface for: {{user_intent}}

Guidelines:
- Domain context: {{domain_context}}
- Accessibility requirements: {{accessibility_requirements}}
- Target performance: {{performance_target}}

Recommended patterns: {{design_patterns}}
Learning from successful patterns: {{historical_success_patterns}}

Adaptive recommendations: {{adaptive_recommendations}}

Prioritize usability, accessibility, and performance.`,
      variables: [
        { name: 'user_intent', type: 'string', required: true, description: 'General UI requirements' }
      ],
      context_requirements: ['user_context'],
      output_format: 'structured_components'
    });
  }

  /**
   * Initialize design pattern library
   */
  private initializePatternLibrary(): DesignPatternLibrary {
    return {
      ui_patterns: [
        {
          name: 'Card Layout',
          description: 'Flexible content containers',
          use_cases: ['content display', 'product listings', 'user profiles'],
          components: ['card', 'card_header', 'card_content', 'card_footer'],
          implementation_notes: 'Use consistent spacing and elevation',
          examples: ['dashboard cards', 'product cards', 'profile cards']
        },
        {
          name: 'Form Pattern',
          description: 'Structured data input interfaces',
          use_cases: ['user registration', 'data entry', 'settings'],
          components: ['form', 'input', 'label', 'button', 'validation'],
          implementation_notes: 'Include proper validation and error handling',
          examples: ['contact forms', 'registration forms', 'checkout forms']
        }
      ],
      interaction_patterns: [
        {
          name: 'Progressive Disclosure',
          trigger: 'user_action',
          behavior: 'reveal_additional_content',
          feedback: 'smooth_animation',
          accessibility_considerations: ['keyboard_navigation', 'screen_reader_announcements']
        }
      ],
      layout_patterns: [
        {
          name: 'Responsive Grid',
          structure: 'css_grid',
          responsive_behavior: 'adaptive_columns',
          breakpoints: ['768px', '1024px', '1440px'],
          grid_system: '12_column'
        }
      ],
      accessibility_patterns: [
        {
          name: 'Focus Management',
          wcag_guidelines: ['2.1.1', '2.1.2', '2.4.3'],
          implementation: 'logical_tab_order',
          testing_criteria: ['keyboard_only_navigation', 'screen_reader_testing']
        }
      ]
    };
  }
}

// Supporting classes
class ContextEnhancer {
  async enhanceContext(
    userIntent: string,
    context?: UIRequestPayload['context'],
    intentAnalysis?: IntentAnalysis
  ): Promise<ContextEnhancement> {
    // Simplified implementation
    return {
      user_context: {
        user_preferences: {},
        usage_patterns: [],
        accessibility_needs: ['keyboard_navigation'],
        device_context: {
          platform: (context?.app_type === 'embedded' ? 'tablet' : context?.app_type) || 'web',
          screen_size: { width: 1920, height: 1080 },
          input_methods: ['mouse', 'keyboard'],
          capabilities: ['modern_browser'],
          performance_profile: 'high'
        },
        session_history: []
      },
      domain_knowledge: {
        industry: 'general',
        use_cases: [],
        common_patterns: [],
        regulatory_requirements: [],
        best_practices: []
      },
      design_patterns: this.getDesignPatterns(),
      technical_constraints: {
        framework: 'react',
        version: '18.0.0',
        dependencies: [],
        performance_budget: {
          max_bundle_size: 250000,
          max_render_time: 100,
          max_memory_usage: 50,
          target_lighthouse_score: 90
        },
        browser_support: ['chrome', 'firefox', 'safari', 'edge'],
        deployment_target: 'web'
      },
      historical_data: {
        successful_patterns: [],
        common_issues: [],
        user_preferences_trends: [],
        performance_benchmarks: []
      }
    };
  }

  private getDesignPatterns(): DesignPatternLibrary {
    // Return simplified pattern library
    return {
      ui_patterns: [],
      interaction_patterns: [],
      layout_patterns: [],
      accessibility_patterns: []
    };
  }
}

class DomainKnowledgeBase {
  // Implementation for domain-specific knowledge
}

class AdaptiveLearningEngine {
  async getInsights(userIntent: string, context: ContextEnhancement): Promise<any> {
    // Simplified implementation
    return {
      recommendations: ['use_semantic_html', 'implement_aria_labels', 'optimize_performance']
    };
  }
}