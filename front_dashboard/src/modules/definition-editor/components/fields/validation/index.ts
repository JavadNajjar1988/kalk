// Advanced Field Validation System - Main Exports

export { ValidationEngine } from './ValidationEngine';
export { ValidationFeedback } from './ValidationFeedback';
export { useFieldValidation } from './useFieldValidation';

export type {
  ValidationRule,
  ValidationRuleType,
  ValidationRuleConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext,
  ValidationMode,
  ValidationOptions,
  ValidationCondition,
  ValidationRulePreset
} from './types';

export { VALIDATION_PRESETS } from './types';

// Convenience re-exports
export { ValidationRuleType as RuleType } from './types';
export { ValidationMode as Mode } from './types';