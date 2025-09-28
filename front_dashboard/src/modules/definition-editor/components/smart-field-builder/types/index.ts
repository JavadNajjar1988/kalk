/**
 * Smart Field Builder Types Index
 * Central export for all Smart Field Builder types
 */

// Core types
export * from './smartFieldTypes';
export * from './templateTypes';
export * from './enhancementTypes';

// Re-export commonly used types with aliases for convenience
export type {
  SmartFieldConfig as FieldConfig,
  WizardState as BuilderState,
  FieldContext as BuilderContext,
  EnhancementSuggestion as Suggestion
} from './smartFieldTypes';

export type {
  FieldTemplate as Template,
  TemplateCollection as TemplateGroup,
  TemplateCustomization as CustomTemplate
} from './templateTypes';

export type {
  ContextualEnhancement as SmartSuggestion,
  EnhancementCombination as Enhancement
} from './enhancementTypes';