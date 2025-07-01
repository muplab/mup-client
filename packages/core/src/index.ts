/**
 * MUP Core Package
 * Main entry point for MUP protocol v1 core utilities
 */

// Export message handling utilities
export {
  MessageBuilder
} from './message-builder';

export {
  MessageParser
} from './message-parser';

export {
  MessageQueue,
  QueueItem,
  QueueConfig,
  QueueEventType,
  QueueEventListener,
  MessageProcessor
} from './message-queue';

// Export AI-driven UI generation modules
export {
  DecisionEngine,
  UIGenerationResult,
  IntentAnalysis,
  ComponentSelection,
  LayoutStructure,
  StyleDecisions
} from './ai-decision-engine';

export {
  QualityValidator,
  ValidationResult,
  QualityAssessment,
  AccessibilityMetrics,
  UsabilityMetrics,
  PerformanceMetrics,
  ConsistencyMetrics,
  ImprovementSuggestion
} from './quality-validator';

export {
  PromptEngineeringSystem,
  PromptTemplate,
  ContextEnhancement,
  GeneratedPrompt,
  UserContextData,
  DomainKnowledge,
  DesignPatternLibrary
} from './prompt-engineering';

// Export validation utilities
export {
  ValidationError,
  MUPValidator
} from './validator';

// Export utility classes
export {
  MessageUtils,
  ComponentUtils,
  GeneralUtils
} from './utils';

// Re-export types from @muprotocol/types
export * from '@muprotocol/types';